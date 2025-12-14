import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TechnicalSEOData {
  metaTags: {
    title: { value: string | null; length: number; score: number; issues: string[] };
    description: { value: string | null; length: number; score: number; issues: string[] };
    canonical: { exists: boolean; value: string | null };
    robots: { value: string | null; isIndexable: boolean };
    viewport: { exists: boolean; value: string | null };
  };
  openGraph: { title: boolean; description: boolean; image: boolean; url: boolean; type: boolean; siteName: boolean };
  twitterCard: { card: boolean; title: boolean; description: boolean; image: boolean };
  headings: { h1Count: number; h1Content: string[]; h2Count: number; h3Count: number; h4Count: number; h5Count: number; h6Count: number; hierarchyValid: boolean; issues: string[] };
  images: { total: number; withAlt: number; withoutAlt: number; largeImages: number; issues: string[] };
  links: { internal: number; external: number; broken: string[]; nofollow: number };
  structuredData: { detected: boolean; types: string[]; errors: string[] };
  security: { https: boolean; mixedContent: boolean };
  robotsTxt: { exists: boolean; allowsCrawling: boolean };
  sitemap: { exists: boolean; url: string | null };
}

function extractMetaContent(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

function countHeadings(html: string, tag: string): { count: number; content: string[] } {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*(?:<[^/][^>]*>[^<]*)*)<\/${tag}>`, 'gi');
  const matches = html.matchAll(regex);
  const content: string[] = [];
  let count = 0;
  
  for (const match of matches) {
    count++;
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text) content.push(text);
  }
  
  return { count, content };
}

function countImages(html: string): { total: number; withAlt: number; withoutAlt: number } {
  const imgRegex = /<img[^>]+>/gi;
  const images = html.match(imgRegex) || [];
  let withAlt = 0;
  let withoutAlt = 0;
  
  for (const img of images) {
    if (/alt=["'][^"']+["']/i.test(img)) {
      withAlt++;
    } else {
      withoutAlt++;
    }
  }
  
  return { total: images.length, withAlt, withoutAlt };
}

function countLinks(html: string, baseUrl: string): { internal: number; external: number; nofollow: number } {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  const matches = html.matchAll(linkRegex);
  let internal = 0;
  let external = 0;
  let nofollow = 0;
  
  const baseDomain = new URL(baseUrl).hostname;
  
  for (const match of matches) {
    const href = match[0];
    const url = match[1];
    
    if (/rel=["'][^"']*nofollow[^"']*["']/i.test(href)) {
      nofollow++;
    }
    
    try {
      if (url.startsWith('/') || url.startsWith('#')) {
        internal++;
      } else if (url.startsWith('http')) {
        const linkDomain = new URL(url).hostname;
        if (linkDomain === baseDomain) {
          internal++;
        } else {
          external++;
        }
      }
    } catch {
      internal++;
    }
  }
  
  return { internal, external, nofollow };
}

function extractStructuredData(html: string): { detected: boolean; types: string[] } {
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi;
  const matches = html.matchAll(jsonLdRegex);
  const types: string[] = [];
  
  for (const match of matches) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type']) {
        types.push(Array.isArray(data['@type']) ? data['@type'].join(', ') : data['@type']);
      }
    } catch {
      // Invalid JSON-LD
    }
  }
  
  return { detected: types.length > 0, types };
}

function analyzeKeywords(html: string): { wordCount: number; topKeywords: { word: string; count: number; density: number }[]; readabilityScore: number } {
  // Extract text content
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = textContent.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const wordCount = words.length;
  
  // Count word frequency
  const wordFreq: Record<string, number> = {};
  const stopWords = ['that', 'this', 'with', 'from', 'your', 'have', 'more', 'will', 'been', 'about', 'which', 'when', 'their', 'would', 'there', 'what', 'they', 'other'];
  
  for (const word of words) {
    if (!stopWords.includes(word) && word.match(/^[a-z]+$/)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }
  
  // Get top keywords
  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({
      word,
      count,
      density: Math.round((count / wordCount) * 10000) / 100
    }));
  
  // Simple readability score based on average sentence length
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = wordCount / (sentences.length || 1);
  const readabilityScore = Math.max(0, Math.min(100, 100 - (avgSentenceLength - 15) * 2));
  
  return { wordCount, topKeywords, readabilityScore: Math.round(readabilityScore) };
}

function calculateScores(technical: TechnicalSEOData, keywords: ReturnType<typeof analyzeKeywords>): { overall: number; technical: number; content: number } {
  let technicalScore = 100;
  const issues: string[] = [];
  
  // Title scoring
  if (!technical.metaTags.title.value) {
    technicalScore -= 15;
  } else if (technical.metaTags.title.length < 30 || technical.metaTags.title.length > 60) {
    technicalScore -= 5;
  }
  
  // Description scoring
  if (!technical.metaTags.description.value) {
    technicalScore -= 15;
  } else if (technical.metaTags.description.length < 120 || technical.metaTags.description.length > 160) {
    technicalScore -= 5;
  }
  
  // H1 scoring
  if (technical.headings.h1Count === 0) {
    technicalScore -= 10;
  } else if (technical.headings.h1Count > 1) {
    technicalScore -= 5;
  }
  
  // Images alt scoring
  if (technical.images.total > 0 && technical.images.withoutAlt > 0) {
    technicalScore -= Math.min(10, technical.images.withoutAlt * 2);
  }
  
  // Structured data
  if (!technical.structuredData.detected) {
    technicalScore -= 5;
  }
  
  // Open Graph
  const ogScore = Object.values(technical.openGraph).filter(Boolean).length;
  if (ogScore < 4) {
    technicalScore -= (4 - ogScore) * 2;
  }
  
  // HTTPS
  if (!technical.security.https) {
    technicalScore -= 10;
  }
  
  // Content score
  let contentScore = 100;
  if (keywords.wordCount < 300) {
    contentScore -= 20;
  } else if (keywords.wordCount < 600) {
    contentScore -= 10;
  }
  
  if (keywords.readabilityScore < 50) {
    contentScore -= 15;
  } else if (keywords.readabilityScore < 70) {
    contentScore -= 5;
  }
  
  technicalScore = Math.max(0, Math.min(100, technicalScore));
  contentScore = Math.max(0, Math.min(100, contentScore));
  
  const overall = Math.round((technicalScore * 0.6 + contentScore * 0.4));
  
  return { overall, technical: technicalScore, content: contentScore };
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

    console.log('Analyzing URL:', url);
    
    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0; +https://patientpathway.ai)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    const parsedUrl = new URL(url);
    
    // Extract and analyze meta tags
    const title = extractTitle(html);
    const description = extractMetaContent(html, 'description');
    const canonical = extractMetaContent(html, 'canonical') || html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] || null;
    const robots = extractMetaContent(html, 'robots');
    const viewport = extractMetaContent(html, 'viewport');
    
    // Analyze headings
    const h1 = countHeadings(html, 'h1');
    const h2 = countHeadings(html, 'h2');
    const h3 = countHeadings(html, 'h3');
    const h4 = countHeadings(html, 'h4');
    const h5 = countHeadings(html, 'h5');
    const h6 = countHeadings(html, 'h6');
    
    // Analyze images
    const images = countImages(html);
    
    // Analyze links
    const links = countLinks(html, url);
    
    // Analyze structured data
    const structuredData = extractStructuredData(html);
    
    // Check robots.txt
    let robotsTxtExists = false;
    let robotsAllows = true;
    try {
      const robotsResponse = await fetch(`${parsedUrl.origin}/robots.txt`);
      robotsTxtExists = robotsResponse.ok;
    } catch {
      // robots.txt not found
    }
    
    // Check sitemap
    let sitemapExists = false;
    let sitemapUrl: string | null = null;
    try {
      const sitemapResponse = await fetch(`${parsedUrl.origin}/sitemap.xml`);
      sitemapExists = sitemapResponse.ok;
      if (sitemapExists) sitemapUrl = `${parsedUrl.origin}/sitemap.xml`;
    } catch {
      // sitemap not found
    }
    
    // Build title issues
    const titleIssues: string[] = [];
    if (!title) {
      titleIssues.push('Missing title tag');
    } else {
      if (title.length < 30) titleIssues.push('Title is too short (under 30 characters)');
      if (title.length > 60) titleIssues.push('Title is too long (over 60 characters)');
    }
    
    // Build description issues
    const descIssues: string[] = [];
    if (!description) {
      descIssues.push('Missing meta description');
    } else {
      if (description.length < 120) descIssues.push('Meta description is too short (under 120 characters)');
      if (description.length > 160) descIssues.push('Meta description is too long (over 160 characters)');
    }
    
    // Build heading issues
    const headingIssues: string[] = [];
    if (h1.count === 0) headingIssues.push('Missing H1 tag');
    if (h1.count > 1) headingIssues.push(`Multiple H1 tags found (${h1.count})`);
    
    // Build image issues
    const imageIssues: string[] = [];
    if (images.withoutAlt > 0) {
      imageIssues.push(`${images.withoutAlt} image(s) missing alt text`);
    }
    
    const technical: TechnicalSEOData = {
      metaTags: {
        title: {
          value: title,
          length: title?.length || 0,
          score: title ? (title.length >= 30 && title.length <= 60 ? 100 : 70) : 0,
          issues: titleIssues,
        },
        description: {
          value: description,
          length: description?.length || 0,
          score: description ? (description.length >= 120 && description.length <= 160 ? 100 : 70) : 0,
          issues: descIssues,
        },
        canonical: { exists: !!canonical, value: canonical },
        robots: { value: robots, isIndexable: !robots || !robots.includes('noindex') },
        viewport: { exists: !!viewport, value: viewport },
      },
      openGraph: {
        title: !!extractMetaContent(html, 'og:title'),
        description: !!extractMetaContent(html, 'og:description'),
        image: !!extractMetaContent(html, 'og:image'),
        url: !!extractMetaContent(html, 'og:url'),
        type: !!extractMetaContent(html, 'og:type'),
        siteName: !!extractMetaContent(html, 'og:site_name'),
      },
      twitterCard: {
        card: !!extractMetaContent(html, 'twitter:card'),
        title: !!extractMetaContent(html, 'twitter:title'),
        description: !!extractMetaContent(html, 'twitter:description'),
        image: !!extractMetaContent(html, 'twitter:image'),
      },
      headings: {
        h1Count: h1.count,
        h1Content: h1.content,
        h2Count: h2.count,
        h3Count: h3.count,
        h4Count: h4.count,
        h5Count: h5.count,
        h6Count: h6.count,
        hierarchyValid: h1.count === 1 && (h2.count === 0 || h1.count <= h2.count),
        issues: headingIssues,
      },
      images: {
        total: images.total,
        withAlt: images.withAlt,
        withoutAlt: images.withoutAlt,
        largeImages: 0,
        issues: imageIssues,
      },
      links: {
        internal: links.internal,
        external: links.external,
        broken: [],
        nofollow: links.nofollow,
      },
      structuredData: {
        detected: structuredData.detected,
        types: structuredData.types,
        errors: [],
      },
      security: {
        https: url.startsWith('https://'),
        mixedContent: false,
      },
      robotsTxt: {
        exists: robotsTxtExists,
        allowsCrawling: robotsAllows,
      },
      sitemap: {
        exists: sitemapExists,
        url: sitemapUrl,
      },
    };
    
    // Analyze keywords
    const keywords = analyzeKeywords(html);
    
    // Calculate scores
    const scores = calculateScores(technical, keywords);
    
    const result = {
      url,
      overallScore: scores.overall,
      technicalScore: scores.technical,
      speedScore: 0, // Will be filled by pagespeed analyzer
      contentScore: scores.content,
      localSeoScore: 0,
      technical,
      speed: null,
      keywords: {
        wordCount: keywords.wordCount,
        keywordDensity: {},
        topKeywords: keywords.topKeywords,
        readabilityScore: keywords.readabilityScore,
        readabilityLevel: keywords.readabilityScore >= 80 ? 'Easy' : keywords.readabilityScore >= 60 ? 'Moderate' : 'Difficult',
      },
      localSeo: null,
      aiRecommendations: [],
      analyzedAt: new Date().toISOString(),
    };

    console.log('Analysis complete. Overall score:', scores.overall);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in seo-analyzer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
