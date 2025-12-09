import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { longUrl, physicianId, doctorId, quizType, customQuizId, leadSource } = await req.json();

    console.log('Received request:', { longUrl, physicianId, doctorId, quizType, customQuizId, leadSource });

    if (!longUrl) {
      throw new Error('Missing longUrl parameter');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Determine doctor_id - use physicianId as doctorId if not provided
    const finalDoctorId = doctorId || physicianId;

    if (!finalDoctorId) {
      throw new Error('Either doctorId or physicianId is required');
    }

    // Check if URL already exists with same parameters
    const { data: existingUrl } = await supabaseAdmin
      .from('link_mappings')
      .select('short_id')
      .eq('target_url', longUrl)
      .eq('doctor_id', finalDoctorId)
      .maybeSingle();

    if (existingUrl) {
      const appUrl = req.headers.get('origin') || 'https://patient-pathway.lovable.app';
      const shortUrl = `${appUrl}/s/${existingUrl.short_id}`;
      console.log('Returning existing short URL:', shortUrl);
      return new Response(JSON.stringify({ shortUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Generate unique short code
    let shortCode: string = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      shortCode = generateShortCode();
      const { data: existing } = await supabaseAdmin
        .from('link_mappings')
        .select('id')
        .eq('short_id', shortCode)
        .maybeSingle();
      
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Unable to generate unique short code');
    }

    // Build insert data
    const insertData: Record<string, any> = {
      short_id: shortCode,
      doctor_id: finalDoctorId,
      target_url: longUrl,
      click_count: 0
    };

    if (physicianId) {
      insertData.physician_id = physicianId;
    }

    if (quizType) {
      insertData.quiz_type = quizType;
    }

    if (customQuizId) {
      insertData.custom_quiz_id = customQuizId;
    }

    if (leadSource) {
      insertData.lead_source = leadSource;
    }

    console.log('Inserting link mapping:', insertData);

    // Insert new short URL into link_mappings table
    const { error: insertError } = await supabaseAdmin
      .from('link_mappings')
      .insert(insertData);

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    const appUrl = req.headers.get('origin') || 'https://patient-pathway.lovable.app';
    const shortUrl = `${appUrl}/s/${shortCode}`;

    console.log('Generated new short URL:', shortUrl);

    return new Response(JSON.stringify({ shortUrl, shortId: shortCode }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
