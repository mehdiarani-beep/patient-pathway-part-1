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

    // Use service role key to bypass RLS for reading email configs
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', 
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
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
      quiz_type_type: typeof lead.quiz_type,
      quiz_type_length: lead.quiz_type?.length,
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
    // Ignore quiz_type matching - just get any config for this doctor
    // Use quiz_type from lead for display purposes in the email content
    console.log('Fetching email notification config (ignoring quiz_type filter):', {
      doctor_id: doctorId,
      lead_quiz_type: lead.quiz_type,
      has_service_role_key: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    });
    
    // First, try to get config matching the lead's quiz_type (if it exists)
    const { data: emailConfigByQuizType } = await supabaseClient
      .from('email_notification_configs')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('quiz_type', lead.quiz_type)
      .maybeSingle();
    
    let emailConfig = emailConfigByQuizType;
    
    // If not found by quiz_type, get any config for this doctor
    if (!emailConfig) {
      console.log('No config found for specific quiz_type, fetching any config for this doctor...');
      const { data: emailConfigAny, error: errorAny } = await supabaseClient
        .from('email_notification_configs')
        .select('*')
        .eq('doctor_id', doctorId)
        .limit(1)
        .maybeSingle();
      
      if (emailConfigAny) {
        emailConfig = emailConfigAny;
        console.log('✓ Found email config (using first available for this doctor, quiz_type:', emailConfig.quiz_type, ')');
      } else if (errorAny) {
        console.error('Error fetching email config:', errorAny);
      } else {
        console.log('No email config found for this doctor');
      }
    } else {
      console.log('✓ Found email config matching quiz_type:', lead.quiz_type);
    }

    console.log('Email config found:', emailConfig ? 'Yes' : 'No (using defaults)');
    if (emailConfig) {
      console.log('Email config loaded successfully:', {
        id: emailConfig.id,
        doctor_id: emailConfig.doctor_id,
        quiz_type: emailConfig.quiz_type,
        patient_from_alias: emailConfig.patient_from_alias,
        patient_reply_to: emailConfig.patient_reply_to,
        patient_subject: emailConfig.patient_subject,
        patient_preheader: emailConfig.patient_preheader,
        patient_body: emailConfig.patient_body ? 'Set' : 'Using default',
        patient_signature: emailConfig.patient_signature,
        patient_footer: emailConfig.patient_footer,
        footer_address_1: emailConfig.footer_address_1,
        footer_address_2: emailConfig.footer_address_2,
        footer_hours: emailConfig.footer_hours,
        footer_phone_numbers: emailConfig.footer_phone_numbers,
      });
    } else {
      console.log('No email config found. Will use default values.');
      
      // Debug: Check what configs exist for this doctor
      const { data: allConfigs } = await supabaseClient
        .from('email_notification_configs')
        .select('id, quiz_type, doctor_id')
        .eq('doctor_id', doctorId);
      
      console.log('Available email configs for this doctor:', allConfigs || []);
    }

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
    'MIDAS': 'Migraine-Specific Quality of Life Questionnaire (MSQ)',
    'NOSE_SNOT': 'Nasal Assessment',
    'SNOT22': 'SNOT-22 Assessment',
    'SNOT12': 'SNOT-12 Assessment',
    'NOSE': 'NOSE Assessment',
    'TNSS': 'TNSS Assessment',
    'EPWORTH': 'Epworth Sleepiness Scale',
    'STOP': 'STOP-BANG Assessment',
    'HHIA': 'HHIA Assessment',
    'DHI': 'Dizziness Handicap Inventory',
    'SYMPTOM_CHECKER': 'Symptom Checker',
    'SLEEP_CHECK': 'Sleep Symptoms Self-Check'
  };
  return quizLabels[quizType] || quizType;
}

/**
 * Sends patient confirmation email using data from Supabase
 * 
 * Data Sources:
 * - lead: From quiz_leads table (name, email, quiz_type, score, submitted_at)
 * - doctorProfile: From doctor_profiles table (avatar_url, logo_url, clinic_name, first_name, last_name)
 * - emailConfig: From email_notification_configs table (all email configuration fields)
 * 
 * All email content comes from emailConfig if available, otherwise uses hardcoded defaults
 */
async function sendPatientConfirmationEmail(lead: any, doctorProfile: any, emailConfig?: any) {
  console.log('=== SENDING PATIENT CONFIRMATION EMAIL ===');
  
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  console.log('Resend API Key available:', !!resendApiKey);

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    throw new Error('RESEND_API_KEY not configured');
  }

  // Data from doctor_profiles table (Supabase)
  const doctorName = `${doctorProfile.first_name} ${doctorProfile.last_name}`;
  const doctorTitle = doctorProfile.title || 'Dr.';
  const clinicName = doctorProfile.clinic_name || 'Exhale Sinus';
  // Prioritize avatar_url as that's what's being used for the logo
  const logoUrl = doctorProfile.avatar_url || doctorProfile.logo_url || '';
  
  // Data from email_notification_configs table (Supabase) - all editable fields
  const fromAlias = emailConfig?.patient_from_alias || 'Dr. Vaughn at Exhale Sinus';
  const replyTo = emailConfig?.patient_reply_to || 'niki@exhalesinus.com';
  
  // Data from quiz_leads table (Supabase)
  const assessmentName = getQuizTypeLabel(lead.quiz_type);
  
  // Email content from email_notification_configs (Supabase) or defaults
  const subject = emailConfig?.patient_subject || `Your ${assessmentName} Results from Exhale Sinus.`;
  const preheader = emailConfig?.patient_preheader || 'Your medical assessment results is not a diagnosis.';
  const bodyContent = emailConfig?.patient_body || `Thank you for taking the time to complete your ${assessmentName} assessment. We have received your responses and are currently reviewing them to provide you with the most appropriate care recommendations.`;
  
  // Non-editable sections (always use defaults from edge function)
  const highlightBoxTitle = emailConfig?.patient_highlight_box_title || 'What happens next?';
  const highlightBoxContent = emailConfig?.patient_highlight_box_content || 'Our medical team will carefully review your assessment results and prepare personalized recommendations based on your responses. You can expect to hear from us within 24-48 hours with next steps for your care.';
  const nextStepsTitle = emailConfig?.patient_next_steps_title || 'Next Steps';
  const nextStepsItems = emailConfig?.patient_next_steps_items || [
    'Our team will review your assessment results',
    'We\'ll prepare personalized recommendations',
    'You\'ll receive a follow-up communication within 24-48 hours',
    'If urgent, please don\'t hesitate to contact us directly'
  ];
  const contactInfoTitle = emailConfig?.patient_contact_info_title || 'Need Immediate Assistance?';
  const contactInfoContent = emailConfig?.patient_contact_info_content || 'If you have any urgent concerns or questions, please don\'t wait for our follow-up. Contact our office directly at your earliest convenience.';
  const closingContent = emailConfig?.patient_closing_content || 'We appreciate your trust in our care and look forward to helping you on your health journey.';
  
  // Signature and footer from email_notification_configs (Supabase)
  const signature = emailConfig?.patient_signature || `Dr. Ryan Vaughn\nExhale Sinus`;
  const footerCopyright = emailConfig?.patient_footer || `© 2025 Exhale Sinus. All rights reserved.`;
  
  // Footer content from email_notification_configs (Supabase)
  const footerAddress1 = emailConfig?.footer_address_1 || '814 E Woodfield, Schaumburg, IL 60173';
  const footerAddress2 = emailConfig?.footer_address_2 || '735 N. Perryville Rd. Suite 4, Rockford, IL 61107';
  const footerHours = emailConfig?.footer_hours || 'Monday - Thursday 8:00 am - 5:00 pm\nFriday - 9:00 am - 5:00 pm';
  const footerPhones = emailConfig?.footer_phone_numbers || ['224-529-4697', '815-977-5715', '815-281-5803'];
  
  // Format date and time from lead submission (data from quiz_leads table - Supabase)
  const submissionDate = lead.submitted_at ? new Date(lead.submitted_at) : new Date();
  const formattedDate = submissionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = submissionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  console.log('Email sender configuration:', {
    fromAlias,
    replyTo,
    subject,
    preheader,
    hasEmailConfig: !!emailConfig,
    usingConfigFromAlias: !!emailConfig?.patient_from_alias,
    usingConfigReplyTo: !!emailConfig?.patient_reply_to,
    usingConfigSubject: !!emailConfig?.patient_subject,
    usingConfigPreheader: !!emailConfig?.patient_preheader,
    usingConfigBody: !!emailConfig?.patient_body,
    usingConfigSignature: !!emailConfig?.patient_signature,
    usingConfigFooter: !!emailConfig?.patient_footer,
    usingConfigFooterAddress1: !!emailConfig?.footer_address_1,
    usingConfigFooterAddress2: !!emailConfig?.footer_address_2,
    usingConfigFooterHours: !!emailConfig?.footer_hours,
    usingConfigFooterPhones: !!emailConfig?.footer_phone_numbers,
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <!--[if mso]>
    <style type="text/css">
      body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
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
        padding: 40px 20px 30px 20px;
        background: #ffffff;
      }
      .logo-header img {
        max-width: 140px;
        height: auto;
        display: inline-block;
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
      .highlight-box {
        background-color: #eff6ff;
        border-left: 4px solid #3b82f6;
        padding: 16px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .highlight-box strong {
        display: block;
        font-size: 16px;
        color: #1e293b;
        margin-bottom: 8px;
      }
      .highlight-box div {
        font-size: 14px;
        color: #475569;
        white-space: pre-line;
        line-height: 1.6;
      }
      .assessment-details {
        background-color: #f8fafc;
        padding: 16px;
        margin: 20px 0;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
      }
      .detail-label {
        font-weight: 500;
        color: #1e293b;
      }
      .detail-value {
        color: #475569;
      }
      .next-steps {
        margin: 20px 0;
      }
      .next-steps h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 12px;
      }
      .next-steps ul {
        margin: 10px 0;
        padding-left: 20px;
      }
      .next-steps li {
        margin-bottom: 8px;
        font-size: 14px;
        color: #475569;
        line-height: 1.6;
      }
      .contact-info {
        margin: 20px 0;
      }
      .contact-info h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 8px;
      }
      .contact-info p {
        font-size: 14px;
        color: #475569;
        white-space: pre-line;
        line-height: 1.6;
        margin: 10px 0;
      }
      .closing-content {
        font-size: 16px;
        color: #475569;
        margin: 20px 0;
        white-space: pre-line;
        line-height: 1.6;
      }
      .signature {
        margin-top: 30px;
        font-size: 16px;
        color: #1e293b;
        white-space: pre-line;
        font-weight: 500;
      }
      .footer {
        background-color: #0b5d82;
        color: #ffffff;
        padding: 30px 40px;
        font-size: 12px;
        line-height: 1.6;
      }
      .footer-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 32px;
        margin-bottom: 20px;
      }
      .footer-column h3 {
        font-weight: bold;
        margin-bottom: 10px;
        font-size: 14px;
      }
      .footer-column p {
        margin: 5px 0;
        font-size: 11px;
      }
      .footer-logo {
        max-width: 120px;
        height: auto;
        margin-bottom: 15px;
      }
      .footer-copyright {
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        padding-top: 20px;
        text-align: center;
        font-size: 11px;
        white-space: pre-line;
      }
      @media only screen and (max-width: 600px) {
        .content-body {
          padding: 20px;
        }
        .footer {
          padding: 20px;
        }
        .footer-grid {
          grid-template-columns: 1fr;
        }
        .footer-column {
          margin-bottom: 20px;
        }
      }
    </style>
  </head>
  <body>
    <!-- Pre-header text (hidden but shown in email preview) -->
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
      ${preheader}
    </div>
    <div class="email-wrapper">
      <div class="email-container">
        ${logoUrl ? `
        <div class="logo-header">
          <img src="${logoUrl}" alt="${clinicName}" />
        </div>
        ` : ''}
        
        <div class="content-body">
          <!-- Lead name from quiz_leads table (Supabase) -->
          <div class="greeting">Dear ${lead.name || 'Patient'},</div>
          
          <!-- Email body from email_notification_configs table (Supabase) -->
          <div class="body-text">${bodyContent}</div>
          
          <!-- Highlight box (non-editable, uses defaults) -->
          ${highlightBoxTitle || highlightBoxContent ? `
          <div class="highlight-box">
            <strong>${highlightBoxTitle}</strong>
            <div>${highlightBoxContent}</div>
          </div>
          ` : ''}
          
          <!-- Assessment details from quiz_leads table (Supabase) -->
          <div class="assessment-details">
            <div class="detail-row">
              <span class="detail-label">Assessment Type:</span>
              <span class="detail-value">${assessmentName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${assessmentName} Score:</span>
              <span class="detail-value" style="font-weight: 600;">${lead.score || 0}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Completed:</span>
              <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${formattedTime}</span>
            </div>
          </div>
          
          ${nextStepsTitle && nextStepsItems.length > 0 ? `
          <div class="next-steps">
            <h3>${nextStepsTitle}</h3>
            <ul>
              ${nextStepsItems.map((item: string) => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${contactInfoTitle || contactInfoContent ? `
          <div class="contact-info">
            <h3>${contactInfoTitle}</h3>
            <p>${contactInfoContent}</p>
          </div>
          ` : ''}
          
          <!-- Closing content (non-editable, uses defaults) -->
          ${closingContent ? `
          <div class="closing-content">${closingContent}</div>
          ` : ''}
          
          <!-- Signature from email_notification_configs table (Supabase) -->
          <div class="signature">${signature}</div>
        </div>
        
        <!-- Footer content from email_notification_configs table (Supabase) -->
        <div class="footer">
          <div class="footer-grid">
            <div class="footer-column">
              <!-- Logo from doctor_profiles table (Supabase) -->
              ${logoUrl ? `<img src="${logoUrl}" alt="${clinicName}" class="footer-logo" />` : ''}
              <!-- Addresses from email_notification_configs table (Supabase) -->
              <p>${footerAddress1}</p>
              <p style="margin-top: 10px;">${footerAddress2}</p>
            </div>
            
            <div class="footer-column">
              <h3>Hours of Operation</h3>
              <!-- Hours from email_notification_configs table (Supabase) -->
              <p style="white-space: pre-line;">${footerHours}</p>
              <!-- Phone numbers from email_notification_configs table (Supabase) -->
              ${footerPhones && footerPhones.length > 0 ? footerPhones.map((phone: string) => `<p style="margin-top: 5px;">📞 ${phone}</p>`).join('') : ''}
            </div>
          </div>
          
          <!-- Copyright from email_notification_configs table (Supabase) -->
          <div class="footer-copyright">${footerCopyright}</div>
          <p style="margin-top: 15px; font-size: 11px; color: rgba(255, 255, 255, 0.8); text-align: center;">
            This email was sent regarding your recent assessment submission.
          </p>
          <p style="margin-top: 8px; font-size: 11px; color: rgba(255, 255, 255, 0.6); text-align: center;">
            This is an automated confirmation email. Please do not reply directly to this message.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const text = `
Dear ${lead.name},

${bodyContent}

${highlightBoxTitle || highlightBoxContent ? `${highlightBoxTitle}\n${highlightBoxContent}\n` : ''}

Assessment Details:
- Assessment Type: ${assessmentName}
- ${assessmentName} Score: ${lead.score || 0}
- Completed: ${formattedDate}
- Time: ${formattedTime}

${nextStepsTitle && nextStepsItems.length > 0 ? `${nextStepsTitle}:\n${nextStepsItems.map((item: string) => `- ${item}`).join('\n')}\n` : ''}

${contactInfoTitle || contactInfoContent ? `${contactInfoTitle}\n${contactInfoContent}\n` : ''}

${closingContent ? `${closingContent}\n` : ''}

${signature}

---
${footerCopyright}

This email was sent regarding your recent assessment submission.
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
