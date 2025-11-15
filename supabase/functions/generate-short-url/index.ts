import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { longUrl } = await req.json();

    if (!longUrl) {
      throw new Error('Missing longUrl parameter');
    }

    // Try multiple URL shortening services with fallbacks
    let shortUrl = null;
    let errorMessage = '';

    // Try is.gd first (direct redirect, no preview page)
    try {
      const isGdResponse = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`);
      if (isGdResponse.ok) {
        const isGdData = await isGdResponse.json();
        if (isGdData && isGdData.shorturl) {
          shortUrl = isGdData.shorturl;
        }
      }
    } catch (error: any) {
      errorMessage += `is.gd failed: ${error.message}; `;
    }

    // Try v.gd if is.gd failed (also direct redirect)
    if (!shortUrl) {
      try {
        const vGdResponse = await fetch(`https://v.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`);
        if (vGdResponse.ok) {
          const vGdData = await vGdResponse.json();
          if (vGdData && vGdData.shorturl) {
            shortUrl = vGdData.shorturl;
          }
        }
      } catch (error: any) {
        errorMessage += `v.gd failed: ${error.message}; `;
      }
    }

    // Try TinyURL as last resort (has preview page with 5-second wait)
    if (!shortUrl) {
      try {
        const tinyUrlResponse = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
        if (tinyUrlResponse.ok) {
          const tinyUrl = await tinyUrlResponse.text();
          if (tinyUrl && tinyUrl.startsWith('http')) {
            shortUrl = tinyUrl;
          }
        }
      } catch (error: any) {
        errorMessage += `TinyURL failed: ${error.message}; `;
      }
    }

    // If all services fail, return the original URL
    if (!shortUrl) {
      console.warn('All URL shortening services failed, returning original URL:', errorMessage);
      shortUrl = longUrl;
    }

    return new Response(
      JSON.stringify({
        success: true,
        shortUrl: shortUrl,
        message: shortUrl === longUrl ? 'URL shortening services unavailable, using original URL' : 'Short URL generated successfully'
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