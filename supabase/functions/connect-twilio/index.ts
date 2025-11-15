const { createClient } = require('@supabase/supabase-js');
const functions = require('@google-cloud/functions-framework');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

functions.http('connect-twilio', async (req: any, res: any) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders);
    res.status(204).send('');
    return;
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const supabaseAdmin = createClient(
      "YOUR_SUPABASE_URL", // Replace with your Supabase URL
      "YOUR_SUPABASE_SERVICE_ROLE_KEY" // Replace with your Supabase service role key
    );

    const { accountSid, authToken } = req.body;

    if (!accountSid || !authToken) {
      throw new Error('Missing Twilio credentials');
    }

    // Basic validation of Twilio credentials (more robust validation may be needed)
    if (accountSid.length !== 34 || authToken.length !== 32) {
      throw new Error('Invalid Twilio credentials');
    }

    // Store Twilio credentials in Supabase (securely)
    const { data, error } = await supabaseAdmin
      .from('twilio_connections')
      .insert([{
        account_sid: accountSid,
        auth_token: authToken,
        user_id: req.get('x-userid'), // Assuming user ID is passed in the header
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    res.set(corsHeaders);
    res.json({
      success: true,
      data,
      message: 'Twilio connection successful'
    });

  } catch (error: any) {
    console.error('Function error:', error);
    res.set(corsHeaders);
    res.status(400).json({
      success: false,
      error: error.message,
      details: 'Failed to connect to Twilio'
    });
  }
});