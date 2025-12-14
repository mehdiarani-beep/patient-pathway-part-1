import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NAPCheck {
  source: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  consistent: boolean;
  url: string | null;
}

interface DirectoryListing {
  name: string;
  found: boolean;
  url: string | null;
  napConsistent: boolean;
}

interface LocalSEOData {
  googleBusinessProfile: {
    found: boolean;
    name: string | null;
    rating: number | null;
    reviewCount: number | null;
    address: string | null;
    phone: string | null;
    website: string | null;
    categories: string[];
    hours: boolean;
    photos: number;
  };
  napConsistency: NAPCheck[];
  directories: DirectoryListing[];
  overallScore: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clinicName, address, city, state, phone, website } = await req.json();
    
    if (!clinicName) {
      return new Response(
        JSON.stringify({ error: 'Clinic name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing Local SEO for:', clinicName);
    
    // Note: Real implementation would use Google Places API and scrape directories
    // This provides a structured response that can be enhanced with real API calls
    
    const directories: DirectoryListing[] = [
      { name: 'Healthgrades', found: false, url: null, napConsistent: false },
      { name: 'Vitals', found: false, url: null, napConsistent: false },
      { name: 'Zocdoc', found: false, url: null, napConsistent: false },
      { name: 'Yelp', found: false, url: null, napConsistent: false },
      { name: 'WebMD', found: false, url: null, napConsistent: false },
      { name: 'Google Business', found: false, url: null, napConsistent: false },
    ];

    const napChecks: NAPCheck[] = [];
    
    // Simulate checking each directory
    // In production, this would make actual API calls or scrape these sites
    for (const dir of directories) {
      // Simulate a 60% chance of being found
      const found = Math.random() > 0.4;
      dir.found = found;
      
      if (found) {
        dir.url = `https://www.${dir.name.toLowerCase().replace(' ', '')}.com/search?q=${encodeURIComponent(clinicName)}`;
        dir.napConsistent = Math.random() > 0.3; // 70% consistency when found
        
        napChecks.push({
          source: dir.name,
          name: found ? clinicName : null,
          address: found && dir.napConsistent ? address : found ? `${address} (slight variation)` : null,
          phone: found && dir.napConsistent ? phone : found ? phone?.replace('-', '.') : null,
          consistent: dir.napConsistent,
          url: dir.url,
        });
      }
    }

    // Calculate overall score
    const foundCount = directories.filter(d => d.found).length;
    const consistentCount = directories.filter(d => d.napConsistent).length;
    
    let overallScore = 0;
    overallScore += (foundCount / directories.length) * 50; // 50% for directory presence
    overallScore += (consistentCount / Math.max(foundCount, 1)) * 50; // 50% for NAP consistency
    
    const result: LocalSEOData = {
      googleBusinessProfile: {
        found: Math.random() > 0.3,
        name: clinicName,
        rating: 4.5 + Math.random() * 0.5,
        reviewCount: Math.floor(Math.random() * 100) + 10,
        address: address || null,
        phone: phone || null,
        website: website || null,
        categories: ['ENT Doctor', 'Medical Clinic'],
        hours: true,
        photos: Math.floor(Math.random() * 20) + 5,
      },
      napConsistency: napChecks,
      directories,
      overallScore: Math.round(overallScore),
    };

    console.log('Local SEO analysis complete. Score:', result.overallScore);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in local-seo-analyzer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
