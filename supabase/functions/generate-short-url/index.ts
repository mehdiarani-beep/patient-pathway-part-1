import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Generate a random short code
function generateShortCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { longUrl, doctorId, quizType, physicianId, customQuizId, leadSource, urlType } = await req.json();

    console.log('Received request:', { longUrl, doctorId, quizType, physicianId, customQuizId, leadSource, urlType });

    if (!longUrl) {
      throw new Error('Missing longUrl parameter');
    }

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate a unique short ID with retry logic
    let shortId: string = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      shortId = generateShortCode(6);
      
      // Check if short_id already exists
      const { data: existing, error: checkError } = await supabase
        .from('link_mappings')
        .select('id')
        .eq('short_id', shortId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing short_id:', checkError);
        throw new Error('Failed to check short ID uniqueness');
      }
      
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Unable to generate unique short code after multiple attempts');
    }

    // Determine target_url based on urlType
    let targetUrl = longUrl;
    if (urlType === 'profile' && physicianId) {
      targetUrl = `/physician/${physicianId}`;
    }

    // Determine the doctor_id to use - require either doctorId or physicianId
    const finalDoctorId = doctorId || physicianId;
    
    if (!finalDoctorId) {
      throw new Error('Either doctorId or physicianId is required');
    }

    // Store the mapping in database
    // NOTE: physician_id FK references doctor_profiles, not clinic_physicians
    // So we don't store clinic_physicians IDs in physician_id column
    const insertData: Record<string, any> = {
      short_id: shortId,
      doctor_id: finalDoctorId,
      quiz_type: urlType === 'profile' ? 'PROFILE' : (quizType || null),
      target_url: targetUrl,
      click_count: 0
    };

    // Only add custom_quiz_id if it's provided
    if (customQuizId) {
      insertData.custom_quiz_id = customQuizId;
    }

    // Only add lead_source if it's provided
    if (leadSource) {
      insertData.lead_source = leadSource;
    }

    console.log('Inserting link mapping:', insertData);

    const { error: insertError } = await supabase
      .from('link_mappings')
      .insert(insertData);

    if (insertError) {
      console.error('Error inserting link mapping:', insertError);
      throw new Error(`Failed to create short URL mapping: ${insertError.message}`);
    }

    // Construct the short URL using the app's domain
    const appUrl = req.headers.get('origin') || 'https://patient-pathway.lovable.app';
    const shortUrl = `${appUrl}/s/${shortId}`;

    console.log('Generated short URL:', { shortId, shortUrl, targetUrl, urlType });

    return new Response(
      JSON.stringify({
        success: true,
        shortUrl: shortUrl,
        shortId: shortId,
        message: 'Short URL generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Failed to generate short URL'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
