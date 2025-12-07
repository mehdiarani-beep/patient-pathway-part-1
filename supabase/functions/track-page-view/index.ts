import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to detect device type from user agent
function getDeviceType(userAgent: string): string {
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

// Helper to get browser name from user agent
function getBrowser(userAgent: string): string {
  if (/edg/i.test(userAgent)) return 'Edge';
  if (/opr|opera/i.test(userAgent)) return 'Opera';
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/msie|trident/i.test(userAgent)) return 'IE';
  return 'Other';
}

// Helper to determine traffic source from referrer and UTM params
function getTrafficSource(
  referrer: string | null,
  utmSource: string | null,
  utmMedium: string | null
): string {
  // Check UTM params first
  if (utmSource) {
    const source = utmSource.toLowerCase();
    if (source.includes('facebook') || source.includes('instagram') || 
        source.includes('twitter') || source.includes('linkedin') ||
        source.includes('tiktok')) {
      return 'social';
    }
    if (source.includes('email') || source.includes('newsletter')) {
      return 'email';
    }
    if (source.includes('google') || source.includes('bing') || source.includes('yahoo')) {
      return utmMedium?.toLowerCase() === 'cpc' ? 'paid' : 'organic';
    }
  }

  if (!referrer) {
    return 'direct';
  }

  // Check referrer
  const refLower = referrer.toLowerCase();
  
  // Social media
  if (refLower.includes('facebook') || refLower.includes('instagram') ||
      refLower.includes('twitter') || refLower.includes('linkedin') ||
      refLower.includes('tiktok') || refLower.includes('youtube')) {
    return 'social';
  }
  
  // Search engines
  if (refLower.includes('google') || refLower.includes('bing') ||
      refLower.includes('yahoo') || refLower.includes('duckduckgo')) {
    return 'organic';
  }
  
  // Short links (internal)
  if (refLower.includes('/s/')) {
    return 'short_link';
  }

  return 'referral';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      pageType,
      pageName,
      pageUrl,
      doctorId,
      physicianId,
      clinicId,
      visitorId,
      sessionId,
      referrerUrl,
      utmSource,
      utmMedium,
      utmCampaign
    } = body;

    // Get user agent for device detection
    const userAgent = req.headers.get('user-agent') || '';
    const deviceType = getDeviceType(userAgent);
    const browser = getBrowser(userAgent);

    // Determine traffic source
    const trafficSource = getTrafficSource(referrerUrl, utmSource, utmMedium);

    // Check if this visitor has viewed this page before (for unique visitor tracking)
    let isUnique = true;
    if (visitorId && pageUrl) {
      const { data: existingView } = await supabase
        .from('page_views')
        .select('id')
        .eq('visitor_id', visitorId)
        .eq('page_url', pageUrl)
        .limit(1);
      
      isUnique = !existingView || existingView.length === 0;
    }

    // Insert the page view
    const { data, error } = await supabase
      .from('page_views')
      .insert({
        page_type: pageType,
        page_name: pageName,
        page_url: pageUrl,
        doctor_id: doctorId || null,
        physician_id: physicianId || null,
        clinic_id: clinicId || null,
        visitor_id: visitorId,
        session_id: sessionId,
        is_unique: isUnique,
        referrer_url: referrerUrl,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        traffic_source: trafficSource,
        device_type: deviceType,
        browser: browser
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting page view:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Page view tracked: ${pageName} (${pageType}) - ${trafficSource} - ${isUnique ? 'unique' : 'returning'}`);

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in track-page-view:', error);
    return new Response(
      JSON.stringify({ success: false, error: errMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
