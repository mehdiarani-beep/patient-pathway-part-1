import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log('=== SEND PATIENT CONFIRMATION EDGE FUNCTION STARTED ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', 
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || ''
          }
        }
      }
    );

    const { leadId, doctorId } = await req.json();
    console.log('Received request data:', { leadId, doctorId });

    // Get lead details
    console.log('Fetching lead details for ID:', leadId);
    const { data: lead, error: leadError } = await supabaseClient
      .from('quiz_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError) {
      console.error('Error fetching lead:', leadError);
      throw leadError;
    }

    console.log('Lead found:', {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      quiz_type: lead.quiz_type,
      score: lead.score
    });

    // Get doctor profile
    console.log('Fetching doctor profile for ID:', doctorId);
    const { data: doctorProfile, error: doctorError } = await supabaseClient
      .from('doctor_profiles')
      .select('*')
      .eq('id', doctorId)
      .single();

    if (doctorError) {
      console.error('Error fetching doctor profile:', doctorError);
      throw doctorError;
    }

    console.log('Doctor profile found:', {
      id: doctorProfile.id,
      name: `${doctorProfile.first_name} ${doctorProfile.last_name}`,
      email: doctorProfile.email,
      email_alias: doctorProfile.email_alias
    });

    // Get email notification configuration
    console.log('Fetching email notification config for quiz type:', lead.quiz_type);
    const { data: emailConfig, error: configError } = await supabaseClient
      .from('email_notification_configs')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('quiz_type', lead.quiz_type)
      .single();

    if (configError && configError.code !== 'PGRST116') {
      console.error('Error fetching email config:', configError);
    }

    console.log('Email config found:', emailConfig ? 'Yes' : 'No (using defaults)');

    // Send patient confirmation email
    console.log('Sending patient confirmation email...');
    const emailResult = await sendPatientConfirmationEmail(lead, doctorProfile, emailConfig);
    console.log('Email result:', emailResult);

    // Log the email
    console.log('Logging email to database...');
    await supabaseClient.from('email_logs').insert({
      doctor_id: doctorId,
      recipient_email: lead.email,
      subject: `Thank you for completing your assessment - ${doctorProfile.first_name} ${doctorProfile.last_name}`,
      status: emailResult.success ? 'sent' : 'failed',
      resend_id: emailResult.id || null,
      error_message: emailResult.error || null,
      sent_at: new Date().toISOString()
    });

    console.log('=== SEND PATIENT CONFIRMATION EDGE FUNCTION COMPLETED ===');

    return new Response(JSON.stringify({
      success: true,
      message: 'Patient confirmation email sent successfully',
      emailResult
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });

  } catch (error: any) {
    console.error("Error sending patient confirmation:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};

function getQuizTypeLabel(quizType: string): string {
  const quizLabels: Record<string, string> = {
    'MIDAS': 'Migraine-Specific Quality of Life Questionnaire',
    'NOSE_SNOT': 'Nasal Assessment',
    'SNOT22': 'SNOT-22 Assessment',
    'SNOT12': 'SNOT-12 Assessment',
    'NOSE': 'NOSE Assessment',
    'TNSS': 'TNSS Assessment',
    'EPWORTH': 'Epworth Sleepiness Scale',
    'STOP': 'STOP-BANG Assessment',
    'HHIA': 'HHIA Assessment',
    'DHI': 'Dizziness Handicap Inventory',
    'SYMPTOM_CHECKER': 'Symptom Checker'
  };
  return quizLabels[quizType] || quizType;
}

async function sendPatientConfirmationEmail(lead: any, doctorProfile: any, emailConfig?: any) {
  console.log('=== SENDING PATIENT CONFIRMATION EMAIL ===');
  
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  console.log('Resend API Key available:', !!resendApiKey);

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    throw new Error('RESEND_API_KEY not configured');
  }

  const doctorName = `${doctorProfile.first_name} ${doctorProfile.last_name}`;
  const doctorTitle = doctorProfile.title || 'Dr.';
  const clinicName = doctorProfile.clinic_name || 'Exhale Sinus';
  const logoUrl = doctorProfile.logo_url || '';
  
  // Use config values or defaults
  const fromAlias = emailConfig?.patient_from_alias || 'Dr. Vaughn at Exhale Sinus';
  const replyTo = emailConfig?.patient_reply_to || 'niki@exhalesinus.com';
  const subject = emailConfig?.patient_subject || `Your ${getQuizTypeLabel(lead.quiz_type)} Results from Exhale Sinus`;
  const preheader = emailConfig?.patient_preheader || 'Your medical assessment results is not a diagnosis.';
  const bodyContent = emailConfig?.patient_body || `Thank you for taking the time to complete your ${getQuizTypeLabel(lead.quiz_type)} assessment. We have received your responses and are currently reviewing them to provide you with the most appropriate care recommendations.`;
  const signature = emailConfig?.patient_signature || `Dr. Ryan Vaughn\nExhale Sinus`;
  const footer = emailConfig?.patient_footer || `© 2025 Exhale Sinus. All rights reserved.`;
  
  console.log('Email sender configuration:', {
    fromAlias,
    replyTo,
    subject,
    hasEmailConfig: !!emailConfig
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="x-apple-disable-message-reformatting">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
      body {
        background-color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #1e293b;
        margin: 0;
        padding: 0;
        line-height: 1.6;
      }
      .email-wrapper {
        background-color: #f8fafc;
        padding: 20px 0;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .logo-header {
        text-align: center;
        padding: 30px 20px;
        background: #ffffff;
      }
      .logo-header img {
        max-width: 200px;
        height: auto;
      }
      .content-body {
        padding: 30px 40px;
      }
      .greeting {
        font-size: 18px;
        color: #1e293b;
        margin-bottom: 20px;
        font-weight: 500;
      }
      .body-text {
        font-size: 16px;
        color: #475569;
        margin-bottom: 20px;
        white-space: pre-line;
      }
      .signature {
        margin-top: 30px;
        font-size: 16px;
        color: #1e293b;
        white-space: pre-line;
      }
      .footer {
        background-color: #0b5d82;
        color: #ffffff;
        padding: 30px 40px;
        font-size: 14px;
        line-height: 1.8;
      }
      .footer-text {
        color: #ffffff;
        margin: 5px 0;
        white-space: pre-line;
      }
      @media only screen and (max-width: 600px) {
        .content-body {
          padding: 20px;
        }
        .footer {
          padding: 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-container">
        ${logoUrl ? `
        <div class="logo-header">
          <img src="${logoUrl}" alt="${clinicName}" />
        </div>
        ` : ''}
        
        <div class="content-body">
          <div class="greeting">Dear ${lead.name},</div>
          
          <div class="body-text">${bodyContent}</div>
          
          <div class="signature">${signature}</div>
        </div>
        
        <div class="footer">
          <div class="footer-text">${footer}</div>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const text = `
Dear ${lead.name},

${bodyContent}

${signature}

---
${footer}

This is an automated confirmation email. Please do not reply directly to this message.
  `;

  try {
    console.log('Preparing email data...');
    const emailData = {
      from: `${fromAlias} <office@patientpathway.ai>`,
      to: lead.email,
      subject: subject,
      html: html,
      text: text,
      reply_to: replyTo
    };

    console.log('Email data prepared:', {
      to: emailData.to,
      subject: emailData.subject,
      from: emailData.from,
      reply_to: emailData.reply_to
    });

    console.log('Sending request to Resend API...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    console.log('Resend API response status:', response.status);
    console.log('Resend API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error response:', errorData);
      throw new Error(`Resend API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Resend API success response:', result);

    return {
      success: true,
      id: result.id,
      message: 'Patient confirmation email sent successfully'
    };

  } catch (error: any) {
    console.error('Error in sendPatientConfirmationEmail:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send patient confirmation email'
    };
  }
}

serve(handler);
