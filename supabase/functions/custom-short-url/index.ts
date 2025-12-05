import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Handle URL creation
    if (req.method === 'POST') {
      const { longUrl, physicianId } = await req.json();

      if (!longUrl) {
        throw new Error('Missing longUrl parameter');
      }

      // Check if URL already exists
      const { data: existingUrl } = await supabaseAdmin
        .from('short_urls')
        .select('short_code')
        .eq('long_url', longUrl)
        .single();

      if (existingUrl) {
        const shortUrl = `https://${Deno.env.get('CUSTOM_DOMAIN') || 'yourdomain.com'}/${existingUrl.short_code}`;
        return new Response(JSON.stringify({ shortUrl }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Generate unique short code
      let shortCode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        shortCode = generateShortCode();
        const { data: existing } = await supabaseAdmin
          .from('short_urls')
          .select('id')
          .eq('short_code', shortCode)
          .single();
        
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Unable to generate unique short code');
      }

      // Insert new short URL
      const { data: newUrl, error } = await supabaseAdmin
        .from('short_urls')
        .insert([{
          short_code: shortCode,
          long_url: longUrl,
          created_at: new Date().toISOString(),
          click_count: 0,
          physician_id: physicianId
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const shortUrl = `https://${Deno.env.get('CUSTOM_DOMAIN') || 'yourdomain.com'}/${shortCode}`;

      return new Response(JSON.stringify({ shortUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Handle URL redirection
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const shortCode = url.pathname.split('/').pop();

      if (!shortCode) {
        return new Response('Not Found', { status: 404 });
      }

      // Get the long URL
      const { data: urlData, error } = await supabaseAdmin
        .from('short_urls')
        .select('long_url')
        .eq('short_code', shortCode)
        .single();

      if (error || !urlData) {
        return new Response('Not Found', { status: 404 });
      }

      // Update click count
      await supabaseAdmin
        .from('short_urls')
        .update({ click_count: supabaseAdmin.rpc('increment', { x: 1 }) })
        .eq('short_code', shortCode);

      // Redirect to the long URL
      return new Response(null, {
        status: 302,
        headers: {
          'Location': urlData.long_url,
          ...corsHeaders
        }
      });
    }

    throw new Error('Method not allowed');
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
