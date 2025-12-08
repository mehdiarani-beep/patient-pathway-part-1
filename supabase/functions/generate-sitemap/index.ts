import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

// Helper to format URL entry without extra whitespace
const formatUrl = (loc: string, lastmod: string, changefreq: string, priority: string): string =>
  `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const baseUrl = url.searchParams.get("baseUrl") || "https://patientpathway.ai";
    
    const today = new Date().toISOString().split("T")[0];

    // Only fetch doctor profiles that have an active clinic
    const { data: doctors, error: doctorsError } = await supabase
      .from("doctor_profiles")
      .select(`
        id, 
        clinic_name, 
        updated_at,
        clinic_id,
        clinic_profiles!inner(id, clinic_name)
      `)
      .not("clinic_id", "is", null);

    if (doctorsError) {
      console.error("Error fetching doctors:", doctorsError);
    }

    // Fetch active physicians for profile pages
    const { data: physicians, error: physiciansError } = await supabase
      .from("clinic_physicians")
      .select("id, first_name, last_name, updated_at")
      .eq("is_active", true);

    if (physiciansError) {
      console.error("Error fetching physicians:", physiciansError);
    }

    // Active quiz types with landing pages
    const quizTypes = ["nose_snot", "epworth", "midas"];

    const urls: string[] = [];

    // Static homepage
    urls.push(formatUrl(baseUrl + "/", today, "weekly", "1.0"));

    // Landing pages for each active doctor and quiz type
    if (doctors && doctors.length > 0) {
      for (const doctor of doctors) {
        for (const quizType of quizTypes) {
          const lastmod = doctor.updated_at 
            ? new Date(doctor.updated_at).toISOString().split("T")[0] 
            : today;
          
          urls.push(formatUrl(
            `${baseUrl}/share/${quizType}/${doctor.id}`,
            lastmod,
            "weekly",
            "0.9"
          ));
        }
      }
    }

    // Physician profile pages
    if (physicians && physicians.length > 0) {
      for (const physician of physicians) {
        const lastmod = physician.updated_at 
          ? new Date(physician.updated_at).toISOString().split("T")[0] 
          : today;
        
        urls.push(formatUrl(
          `${baseUrl}/physician/${physician.id}`,
          lastmod,
          "weekly",
          "0.8"
        ));
      }
    }

    // NOTE: Short URL redirects (/s/:shortId) are intentionally excluded
    // Google recommends not including redirect URLs in sitemaps

    // Build complete sitemap XML (compact format)
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    console.log(`Generated sitemap with ${urls.length} URLs (${physicians?.length || 0} physician profiles, excluding redirects)`);

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
