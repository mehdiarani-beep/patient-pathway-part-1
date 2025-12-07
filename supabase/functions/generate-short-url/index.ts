import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { nanoid } from "https://esm.sh/nanoid@5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

    if (!longUrl) {
      throw new Error('Missing longUrl parameter');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate a short ID
    const shortId = nanoid(6);

    // Determine target_url based on urlType
    let targetUrl = longUrl;
    if (urlType === 'profile' && physicianId) {
      // For physician profile pages, construct the profile URL
      targetUrl = `/physician/${physicianId}`;
    }

    // Store the mapping in database
    const { error: insertError } = await supabase
      .from('link_mappings')
      .insert({
        short_id: shortId,
        doctor_id: doctorId,
        quiz_type: urlType === 'profile' ? 'PROFILE' : quizType,
        physician_id: physicianId,
        custom_quiz_id: customQuizId,
        lead_source: leadSource,
        target_url: targetUrl,
        click_count: 0
      });

    if (insertError) {
      console.error('Error inserting link mapping:', insertError);
      throw new Error('Failed to create short URL mapping');
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
