import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisResult } = await req.json();
    
    if (!analysisResult) {
      return new Response(
        JSON.stringify({ error: 'Analysis result is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating AI recommendations for URL:', analysisResult.url);

    const systemPrompt = `You are an expert SEO consultant specializing in medical practice websites. Analyze SEO audit results and provide specific, actionable recommendations prioritized by impact.

Focus on:
1. Critical issues that hurt rankings (must fix immediately)
2. Quick wins that can be implemented in under an hour
3. High-impact improvements for sustained growth
4. Medical-specific SEO best practices (E-E-A-T for health content)
5. Local SEO for medical practices

For each recommendation, provide:
- A clear, actionable title
- A brief description of the issue
- Step-by-step instructions to fix it
- Estimated impact (high/medium/low)

Return a JSON array of recommendations. Each item must have these exact fields:
{
  "priority": "critical" | "high" | "medium" | "low",
  "category": "string (e.g., Meta Tags, Content, Technical, Local SEO)",
  "title": "string",
  "description": "string",
  "howToFix": "string with specific steps",
  "estimatedImpact": "string describing the expected improvement"
}`;

    const userPrompt = `Analyze this SEO audit and provide 5-8 prioritized recommendations:

URL: ${analysisResult.url}
Overall Score: ${analysisResult.overallScore}/100
Technical Score: ${analysisResult.technicalScore}/100
Content Score: ${analysisResult.contentScore}/100

Technical Analysis:
- Title: ${analysisResult.technical?.metaTags?.title?.value || 'Missing'} (${analysisResult.technical?.metaTags?.title?.length || 0} chars)
- Meta Description: ${analysisResult.technical?.metaTags?.description?.value ? 'Present' : 'Missing'} (${analysisResult.technical?.metaTags?.description?.length || 0} chars)
- H1 Tags: ${analysisResult.technical?.headings?.h1Count || 0} found
- H1 Content: ${analysisResult.technical?.headings?.h1Content?.join(', ') || 'None'}
- Images without alt: ${analysisResult.technical?.images?.withoutAlt || 0} of ${analysisResult.technical?.images?.total || 0}
- HTTPS: ${analysisResult.technical?.security?.https ? 'Yes' : 'No'}
- Structured Data: ${analysisResult.technical?.structuredData?.detected ? analysisResult.technical?.structuredData?.types?.join(', ') : 'None detected'}
- Canonical: ${analysisResult.technical?.metaTags?.canonical?.exists ? 'Present' : 'Missing'}
- Robots.txt: ${analysisResult.technical?.robotsTxt?.exists ? 'Present' : 'Missing'}
- Sitemap: ${analysisResult.technical?.sitemap?.exists ? 'Present' : 'Missing'}
- Open Graph: Title=${analysisResult.technical?.openGraph?.title}, Desc=${analysisResult.technical?.openGraph?.description}, Image=${analysisResult.technical?.openGraph?.image}

Content Analysis:
- Word Count: ${analysisResult.keywords?.wordCount || 0}
- Readability Score: ${analysisResult.keywords?.readabilityScore || 0}/100 (${analysisResult.keywords?.readabilityLevel || 'Unknown'})
- Top Keywords: ${analysisResult.keywords?.topKeywords?.slice(0, 5).map((k: any) => `${k.word} (${k.density}%)`).join(', ') || 'None analyzed'}

Links:
- Internal: ${analysisResult.technical?.links?.internal || 0}
- External: ${analysisResult.technical?.links?.external || 0}

Provide your recommendations as a JSON array only, no additional text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate recommendations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No recommendations generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON from the response
    let recommendations;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      recommendations = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      // Return a default recommendation if parsing fails
      recommendations = [{
        priority: "high",
        category: "General",
        title: "SEO Analysis Complete",
        description: "Review the technical analysis above to identify improvement opportunities.",
        howToFix: "Address the issues flagged in the technical, content, and speed analysis sections.",
        estimatedImpact: "Varies based on specific issues addressed"
      }];
    }

    console.log('Generated', recommendations.length, 'recommendations');

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in seo-ai-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate recommendations' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
