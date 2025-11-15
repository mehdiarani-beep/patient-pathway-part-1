
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShareLeadRequest {
  lead_id: string;
  platforms: string[];
  message: string;
  lead_data: {
    name: string;
    quiz_type: string;
    score: number;
    email?: string;
    phone?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { lead_id, platforms, message, lead_data }: ShareLeadRequest = await req.json();

    // Get user's social accounts and configurations
    const { data: userProfile } = await supabaseClient
      .from('doctor_profiles')
      .select('*')
      .single();

    const results = [];

    for (const platform of platforms) {
      try {
        let result;
        
        switch (platform) {
          case 'SMS':
            result = await sendSMS(lead_data, message, userProfile);
            break;
          case 'Email':
            result = await sendEmail(lead_data, message, userProfile);
            break;
          case 'Facebook':
          case 'Twitter':
          case 'LinkedIn':
            result = await shareToSocialMedia(platform, lead_data, message);
            break;
          default:
            result = { success: false, error: `Unsupported platform: ${platform}` };
        }
        
        results.push({ platform, ...result });
      } catch (error: any) {
        results.push({ 
          platform, 
          success: false, 
          error: error.message 
        });
      }
    }

    // Log the sharing activity
    await supabaseClient.from('lead_communications').insert({
      lead_id,
      communication_type: 'social_share',
      message: `Shared to: ${platforms.join(', ')}`,
      status: 'sent'
    });

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: 'Lead sharing completed'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sharing lead:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to share lead' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function sendSMS(leadData: any, message: string, profile: any) {
  if (!profile.twilio_account_sid || !profile.twilio_auth_token) {
    throw new Error('Twilio not configured');
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${profile.twilio_account_sid}/Messages.json`;
  const authHeader = `Basic ${btoa(`${profile.twilio_account_sid}:${profile.twilio_auth_token}`)}`;

  const body = new URLSearchParams({
    From: profile.twilio_phone_number,
    To: leadData.phone || '',
    Body: message || `New lead: ${leadData.name} completed ${leadData.quiz_type} assessment with score ${leadData.score}`
  });

  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to send SMS');
  }

  return { success: true, message: 'SMS sent successfully' };
}

async function sendEmail(leadData: any, message: string, profile: any) {
  // This would integrate with your email service (SendGrid, etc.)
  // For now, we'll return a simulated response
  return { 
    success: true, 
    message: 'Email functionality would be implemented with your email service' 
  };
}

async function shareToSocialMedia(platform: string, leadData: any, message: string) {
  // This would integrate with social media APIs
  // For now, we'll return a simulated response
  return { 
    success: true, 
    message: `${platform} sharing would be implemented with OAuth integration` 
  };
}

serve(handler);
