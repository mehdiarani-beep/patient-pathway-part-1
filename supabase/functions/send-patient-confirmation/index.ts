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

async function sendPatientConfirmationEmail(lead: any, doctorProfile: any) {
  console.log('=== SENDING PATIENT CONFIRMATION EMAIL ===');
  
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  console.log('Resend API Key available:', !!resendApiKey);

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    throw new Error('RESEND_API_KEY not configured');
  }

  const doctorName = `${doctorProfile.first_name} ${doctorProfile.last_name}`;
  const doctorTitle = doctorProfile.title || 'Dr.';
  const clinicName = doctorProfile.clinic_name || 'Our Medical Practice';
  
  // Determine sender email - use doctor's email alias if set, otherwise use office email
  const senderEmail = doctorProfile.email_alias || 'office@patientpathway.ai';
  const senderName = doctorProfile.email_alias ? `${doctorTitle} ${doctorProfile.first_name} ${doctorProfile.last_name}` : 'PatientPathway.ai';
  
  console.log('Email sender configuration:', {
    senderEmail,
    senderName,
    hasEmailAlias: !!doctorProfile.email_alias
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Assessment Confirmation - ${doctorName}</title>
    <style>
      body {
        background-color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #1e293b;
        margin: 0;
        padding: 0;
        line-height: 1.6;
      }
      .email-container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        padding: 40px 30px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e2e8f0;
      }
      .doctor-name {
        font-size: 24px;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 5px;
      }
      .clinic-name {
        font-size: 16px;
        color: #64748b;
        font-weight: 500;
      }
      .greeting {
        font-size: 18px;
        color: #1e293b;
        margin-bottom: 20px;
        font-weight: 500;
      }
      .content {
        font-size: 16px;
        color: #475569;
        margin-bottom: 25px;
      }
      .highlight-box {
        background-color: #f1f5f9;
        border-left: 4px solid #3b82f6;
        padding: 20px;
        margin: 25px 0;
        border-radius: 0 8px 8px 0;
      }
      .assessment-details {
        background-color: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
      }
      .detail-label {
        font-weight: 600;
        color: #64748b;
      }
      .detail-value {
        color: #1e293b;
        font-weight: 500;
      }
      .next-steps {
        background-color: #ecfdf5;
        border: 1px solid #bbf7d0;
        padding: 20px;
        border-radius: 8px;
        margin: 25px 0;
      }
      .next-steps h3 {
        color: #059669;
        margin-top: 0;
        font-size: 16px;
        font-weight: 600;
      }
      .contact-info {
        background-color: #fef3c7;
        border: 1px solid #fcd34d;
        padding: 20px;
        border-radius: 8px;
        margin: 25px 0;
        text-align: center;
      }
      .contact-info h3 {
        color: #92400e;
        margin-top: 0;
        font-size: 16px;
        font-weight: 600;
      }
      .signature {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
      }
      .signature-name {
        font-weight: 600;
        color: #1e40af;
        font-size: 16px;
      }
      .signature-title {
        color: #64748b;
        font-size: 14px;
        margin-top: 2px;
      }
      .footer {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 40px;
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="doctor-name">${doctorTitle} ${doctorProfile.first_name} ${doctorProfile.last_name}</div>
        <div class="clinic-name">${clinicName}</div>
      </div>

      <div class="greeting">Dear ${lead.name},</div>

      <div class="content">
        Thank you for taking the time to complete your ${getQuizTypeLabel(lead.quiz_type)} assessment. We have received your responses and are currently reviewing them to provide you with the most appropriate care recommendations.
      </div>

      <div class="highlight-box">
        <strong>What happens next?</strong><br>
        Our medical team will carefully review your assessment results and prepare personalized recommendations based on your responses. You can expect to hear from us within 24-48 hours with next steps for your care.
      </div>

      <div class="assessment-details">
        <div class="detail-row">
          <span class="detail-label">Assessment Type:</span>
          <span class="detail-value">${getQuizTypeLabel(lead.quiz_type)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Completed:</span>
          <span class="detail-value">${new Date(lead.submitted_at).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${new Date(lead.submitted_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
        </div>
      </div>

      <div class="next-steps">
        <h3>Next Steps</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Our team will review your assessment results</li>
          <li>We'll prepare personalized recommendations</li>
          <li>You'll receive a follow-up communication within 24-48 hours</li>
          <li>If urgent, please don't hesitate to contact us directly</li>
        </ul>
      </div>

      <div class="contact-info">
        <h3>Need Immediate Assistance?</h3>
        <p style="margin: 10px 0;">
          If you have any urgent concerns or questions, please don't wait for our follow-up. 
          Contact our office directly at your earliest convenience.
        </p>
      </div>

      <div class="content">
        We appreciate your trust in our care and look forward to helping you on your health journey.
      </div>

      <div class="signature">
        <div class="signature-name">${doctorTitle} ${doctorProfile.first_name} ${doctorProfile.last_name}</div>
        <div class="signature-title">${doctorProfile.specialty || 'Medical Professional'}</div>
        <div class="signature-title">${clinicName}</div>
      </div>

      <div class="footer">
        <p>This email was sent regarding your recent assessment submission.</p>
        <p>© 2025 ${clinicName}. All rights reserved.</p>
        <p style="margin-top: 10px; font-size: 11px; color: #cbd5e1;">
          This is an automated confirmation email. Please do not reply directly to this message.
        </p>
      </div>
    </div>
  </body>
</html>
  `;

  const text = `
Dear ${lead.name},

Thank you for taking the time to complete your ${lead.quiz_type} assessment. We have received your responses and are currently reviewing them to provide you with the most appropriate care recommendations.

ASSESSMENT DETAILS:
- Assessment Type: ${lead.quiz_type}
- Completed: ${new Date(lead.submitted_at).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}
- Time: ${new Date(lead.submitted_at).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}

WHAT HAPPENS NEXT:
Our medical team will carefully review your assessment results and prepare personalized recommendations based on your responses. You can expect to hear from us within 24-48 hours with next steps for your care.

NEXT STEPS:
• Our team will review your assessment results
• We'll prepare personalized recommendations  
• You'll receive a follow-up communication within 24-48 hours
• If urgent, please don't hesitate to contact us directly

NEED IMMEDIATE ASSISTANCE?
If you have any urgent concerns or questions, please don't wait for our follow-up. Contact our office directly at your earliest convenience.

We appreciate your trust in our care and look forward to helping you on your health journey.

Best regards,
${doctorTitle} ${doctorProfile.first_name} ${doctorProfile.last_name}
${doctorProfile.specialty || 'Medical Professional'}
${clinicName}

---
This email was sent regarding your recent assessment submission.
© 2025 ${clinicName}. All rights reserved.

This is an automated confirmation email. Please do not reply directly to this message.
  `;

  try {
    console.log('Preparing email data...');
    const emailData = {
      from: `${senderName} <${senderEmail}>`,
      to: lead.email,
      subject: `Thank you for completing your assessment - ${doctorName}`,
      html: html,
      text: text,
      reply_to: doctorProfile.email
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
