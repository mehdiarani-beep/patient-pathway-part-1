import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CoreWebVital {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  displayValue: string;
}

interface SpeedMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  coreWebVitals: {
    lcp: CoreWebVital;
    inp: CoreWebVital;
    cls: CoreWebVital;
  };
  opportunities: { id: string; title: string; description: string; savings: string }[];
}

function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, [number, number]> = {
    lcp: [2500, 4000],
    inp: [200, 500],
    cls: [0.1, 0.25],
  };
  
  const [good, poor] = thresholds[metric] || [0, 0];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing PageSpeed for:', url);
    
    const apiKey = Deno.env.get('GOOGLE_PAGESPEED_API_KEY');
    
    if (!apiKey) {
      // Return simulated results when API key is not available
      console.log('No GOOGLE_PAGESPEED_API_KEY found, returning simulated results');
      
      const simulatedResult: SpeedMetrics = {
        performance: 75,
        accessibility: 85,
        bestPractices: 80,
        seo: 90,
        coreWebVitals: {
          lcp: { value: 2100, rating: 'good', displayValue: '2.1 s' },
          inp: { value: 180, rating: 'good', displayValue: '180 ms' },
          cls: { value: 0.08, rating: 'good', displayValue: '0.08' },
        },
        opportunities: [
          {
            id: 'render-blocking-resources',
            title: 'Eliminate render-blocking resources',
            description: 'Resources are blocking the first paint of your page.',
            savings: 'Potential savings of 500 ms',
          },
          {
            id: 'unused-css-rules',
            title: 'Reduce unused CSS',
            description: 'Reduce unused rules from stylesheets.',
            savings: 'Potential savings of 150 KB',
          },
        ],
      };
      
      return new Response(
        JSON.stringify({ data: simulatedResult, simulated: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google PageSpeed Insights API
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=performance&category=accessibility&category=best-practices&category=seo&strategy=mobile`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('PageSpeed API error:', errorText);
      throw new Error(`PageSpeed API error: ${response.status}`);
    }

    const data = await response.json();
    
    const categories = data.lighthouseResult?.categories || {};
    const audits = data.lighthouseResult?.audits || {};
    
    // Extract Core Web Vitals
    const lcpValue = audits['largest-contentful-paint']?.numericValue || 0;
    const clsValue = audits['cumulative-layout-shift']?.numericValue || 0;
    const inpValue = audits['interaction-to-next-paint']?.numericValue || audits['total-blocking-time']?.numericValue || 0;
    
    // Extract opportunities
    const opportunities: SpeedMetrics['opportunities'] = [];
    const opportunityAudits = ['render-blocking-resources', 'unused-css-rules', 'unused-javascript', 'modern-image-formats', 'offscreen-images'];
    
    for (const auditId of opportunityAudits) {
      const audit = audits[auditId];
      if (audit && audit.score !== null && audit.score < 1) {
        opportunities.push({
          id: auditId,
          title: audit.title || auditId,
          description: audit.description || '',
          savings: audit.displayValue || 'Optimization available',
        });
      }
    }

    const result: SpeedMetrics = {
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
      coreWebVitals: {
        lcp: {
          value: lcpValue,
          rating: getRating('lcp', lcpValue),
          displayValue: `${(lcpValue / 1000).toFixed(1)} s`,
        },
        inp: {
          value: inpValue,
          rating: getRating('inp', inpValue),
          displayValue: `${Math.round(inpValue)} ms`,
        },
        cls: {
          value: clsValue,
          rating: getRating('cls', clsValue),
          displayValue: clsValue.toFixed(2),
        },
      },
      opportunities,
    };

    console.log('PageSpeed analysis complete. Performance score:', result.performance);

    return new Response(
      JSON.stringify({ data: result, simulated: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in pagespeed-analyzer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
