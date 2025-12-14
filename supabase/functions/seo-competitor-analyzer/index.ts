import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompetitorScore {
  url: string;
  overallScore: number;
  technicalScore: number;
  speedScore: number;
  contentScore: number;
}

interface CompetitiveGap {
  area: string;
  yourScore: number;
  competitorAvg: number;
  gap: number;
  recommendation: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { yourUrl, competitorUrls } = await req.json();
    
    if (!yourUrl || !competitorUrls || !Array.isArray(competitorUrls)) {
      return new Response(
        JSON.stringify({ error: 'Your URL and competitor URLs array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing competitors:', competitorUrls.length, 'URLs');
    
    const allUrls = [yourUrl, ...competitorUrls.slice(0, 9)]; // Max 10 URLs
    const scores: CompetitorScore[] = [];
    
    // Analyze each URL
    for (const url of allUrls) {
      try {
        console.log('Analyzing:', url);
        
        // Call the seo-analyzer function for each URL
        const { data, error } = await supabase.functions.invoke('seo-analyzer', {
          body: { url }
        });
        
        if (error) {
          console.error('Error analyzing', url, error);
          scores.push({
            url,
            overallScore: 0,
            technicalScore: 0,
            speedScore: 0,
            contentScore: 0,
          });
          continue;
        }
        
        scores.push({
          url,
          overallScore: data.overallScore || 0,
          technicalScore: data.technicalScore || 0,
          speedScore: data.speedScore || 0,
          contentScore: data.contentScore || 0,
        });
      } catch (err) {
        console.error('Failed to analyze:', url, err);
        scores.push({
          url,
          overallScore: 0,
          technicalScore: 0,
          speedScore: 0,
          contentScore: 0,
        });
      }
    }
    
    // Calculate gaps
    const yourScores = scores[0];
    const competitorScores = scores.slice(1).filter(s => s.overallScore > 0);
    
    if (competitorScores.length === 0) {
      return new Response(
        JSON.stringify({
          scores,
          gaps: [],
          opportunities: ['Unable to analyze competitor websites. Please check the URLs.'],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const avgCompetitor = {
      overall: competitorScores.reduce((a, b) => a + b.overallScore, 0) / competitorScores.length,
      technical: competitorScores.reduce((a, b) => a + b.technicalScore, 0) / competitorScores.length,
      speed: competitorScores.reduce((a, b) => a + b.speedScore, 0) / competitorScores.length,
      content: competitorScores.reduce((a, b) => a + b.contentScore, 0) / competitorScores.length,
    };
    
    const gaps: CompetitiveGap[] = [];
    
    if (yourScores.technicalScore < avgCompetitor.technical) {
      gaps.push({
        area: 'Technical SEO',
        yourScore: yourScores.technicalScore,
        competitorAvg: Math.round(avgCompetitor.technical),
        gap: Math.round(avgCompetitor.technical - yourScores.technicalScore),
        recommendation: 'Improve meta tags, heading structure, and schema markup to match competitors.',
      });
    }
    
    if (yourScores.contentScore < avgCompetitor.content) {
      gaps.push({
        area: 'Content Quality',
        yourScore: yourScores.contentScore,
        competitorAvg: Math.round(avgCompetitor.content),
        gap: Math.round(avgCompetitor.content - yourScores.contentScore),
        recommendation: 'Add more comprehensive content, improve readability, and target relevant keywords.',
      });
    }
    
    if (yourScores.speedScore < avgCompetitor.speed) {
      gaps.push({
        area: 'Page Speed',
        yourScore: yourScores.speedScore,
        competitorAvg: Math.round(avgCompetitor.speed),
        gap: Math.round(avgCompetitor.speed - yourScores.speedScore),
        recommendation: 'Optimize images, reduce JavaScript, and improve server response times.',
      });
    }
    
    // Generate opportunities
    const opportunities: string[] = [];
    
    if (yourScores.overallScore > avgCompetitor.overall) {
      opportunities.push('Your website outperforms the average competitor! Maintain your SEO advantage.');
    } else {
      opportunities.push(`Close the ${Math.round(avgCompetitor.overall - yourScores.overallScore)} point gap to match your competitors.`);
    }
    
    const bestCompetitor = competitorScores.reduce((a, b) => a.overallScore > b.overallScore ? a : b);
    if (bestCompetitor.overallScore > yourScores.overallScore) {
      opportunities.push(`Study ${new URL(bestCompetitor.url).hostname} - they have the highest SEO score (${bestCompetitor.overallScore}).`);
    }

    console.log('Competitor analysis complete.');

    return new Response(
      JSON.stringify({
        scores,
        gaps,
        opportunities,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in seo-competitor-analyzer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
