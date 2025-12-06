import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get base URL from request or default
    const url = new URL(req.url);
    const baseUrl = url.searchParams.get("baseUrl") || "https://patientpathway.ai";
    
    const today = new Date().toISOString().split("T")[0];

    // Fetch all active doctor profiles for landing page URLs
    const { data: doctors, error: doctorsError } = await supabase
      .from("doctor_profiles")
      .select("id, clinic_name, updated_at")
      .not("clinic_id", "is", null);

    if (doctorsError) {
      console.error("Error fetching doctors:", doctorsError);
    }

    // Fetch active short URLs
    const { data: shortLinks, error: linksError } = await supabase
      .from("link_mappings")
      .select("short_id, quiz_type, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (linksError) {
      console.error("Error fetching short links:", linksError);
    }

    // Quiz types available
    const quizTypes = ["nose_snot", "epworth", "midas"];

    // Build sitemap URLs
    let urls: string[] = [];

    // Static pages
    urls.push(`
    <url>
      <loc>${baseUrl}/</loc>
      <lastmod>${today}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>1.0</priority>
    </url>`);

    // Landing pages for each doctor and quiz type
    if (doctors && doctors.length > 0) {
      for (const doctor of doctors) {
        for (const quizType of quizTypes) {
          const lastmod = doctor.updated_at 
            ? new Date(doctor.updated_at).toISOString().split("T")[0] 
            : today;
          
          urls.push(`
    <url>
      <loc>${baseUrl}/share/${quizType}/${doctor.id}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.9</priority>
    </url>`);
        }
      }
    }

    // Short URL redirects
    if (shortLinks && shortLinks.length > 0) {
      for (const link of shortLinks) {
        const lastmod = link.created_at 
          ? new Date(link.created_at).toISOString().split("T")[0] 
          : today;
        
        urls.push(`
    <url>
      <loc>${baseUrl}/s/${link.short_id}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
    </url>`);
      }
    }

    // Build complete sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join("")}
</urlset>`;

    console.log(`Generated sitemap with ${urls.length} URLs`);

    return new Response(sitemap, {
      headers: corsHeaders,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating sitemap:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
