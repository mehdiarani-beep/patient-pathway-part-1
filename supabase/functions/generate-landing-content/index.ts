
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { doctorProfile, specialty, focus } = await req.json();

    const prompt = `
    Generate unique, personalized landing page content for a medical practice specializing in ${focus}.
    
    Doctor Information:
    - Name: Dr. ${doctorProfile.first_name} ${doctorProfile.last_name}
    - Specialty: ${doctorProfile.specialty || specialty}
    - Clinic: ${doctorProfile.clinic_name || 'Medical Center'}
    - Location: ${doctorProfile.location || 'Local Area'}
    - Phone: ${doctorProfile.phone || 'Contact Number'}
    
    Generate:
    1. A compelling main title (different from generic templates)
    2. An engaging subtitle
    3. 4-5 content sections covering:
       - What is ${focus}?
       - Symptoms and impact
       - Treatment options available at this practice
       - Why choose this specific doctor/practice
       - Patient testimonials (realistic but generic)
    
    Make the content unique, professional, and personalized to this specific doctor and practice.
    Focus on ${focus} but make it sound natural and authoritative.
    
    Return as JSON with this structure:
    {
      "title": "...",
      "subtitle": "...",
      "sections": [
        {
          "id": "1",
          "type": "content",
          "title": "...",
          "content": "...",
          "order": 1
        }
      ]
    }
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a medical content writer specializing in creating unique, professional landing page content for healthcare providers. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    const generatedContent = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify({ generatedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-landing-content function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
