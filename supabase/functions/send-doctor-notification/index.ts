import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DoctorNotificationRequest {
  leadId: string;
  doctorId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SEND DOCTOR NOTIFICATION EDGE FUNCTION STARTED ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { leadId, doctorId }: DoctorNotificationRequest = await req.json();
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
    console.log('Lead found:', { id: lead.id, name: lead.name, email: lead.email, phone: lead.phone, quiz_type: lead.quiz_type, score: lead.score });

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
    console.log('Doctor profile found:', { id: doctorProfile.id, name: `${doctorProfile.first_name} ${doctorProfile.last_name}`, email: doctorProfile.email });

    // Send doctor notification email via Resend
    console.log('Sending doctor notification email...');
    const emailResult = await sendDoctorNotificationEmail(lead, doctorProfile);
    console.log('Email result:', emailResult);

    // Log the email
    console.log('Logging email to database...');
    await supabaseClient.from('email_logs').insert({
      doctor_id: doctorId,
      recipient_email: doctorProfile.email,
      subject: `New Lead: ${lead.name} - ${lead.quiz_type} Assessment`,
      status: emailResult.success ? 'sent' : 'failed',
      resend_id: emailResult.id || null,
      error_message: emailResult.error || null,
      sent_at: new Date().toISOString()
    });

    console.log('=== SEND DOCTOR NOTIFICATION EDGE FUNCTION COMPLETED ===');
    return new Response(JSON.stringify({
      success: true,
      message: 'Doctor notification sent successfully',
      emailResult
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending doctor notification:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function sendDoctorNotificationEmail(lead: any, doctorProfile: any) {
  console.log('=== SENDING DOCTOR NOTIFICATION EMAIL ===');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  console.log('Resend API Key available:', !!resendApiKey);
  console.log('API Key length:', resendApiKey ? resendApiKey.length : 0);
  console.log('API Key starts with re_:', resendApiKey ? resendApiKey.startsWith('re_') : false);
  
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    throw new Error('RESEND_API_KEY not configured');
  }

  const doctorName = `${doctorProfile.first_name} ${doctorProfile.last_name}`;
  const severity = getSeverityLevel(lead.score);
  const severityColor = getSeverityColor(severity);
  const dashboardUrl = `${Deno.env.get('APP_URL') || 'https://patientpathway.ai'}/portal?tab=dashboard`;

  // Generate quiz answers summary
  const answersSummary = generateAnswersSummary(lead.answers);

  const html = `
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>New Quiz Submission - PatientPathway.ai</title>
    <style>
      body {
        background-color: #f4f6f8;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #333;
        margin: 0;
        padding: 0;
      }
      .email-container {
        max-width: 700px;
        margin: 40px auto;
        background: #ffffff;
        padding: 40px 30px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      }
      .logo {
        max-width: 100px;
        margin: 0 auto 20px;
        display: block;
        border-radius: 8px;
      }
      .header {
        font-size: 24px;
        font-weight: 700;
        color: #007ea7;
        text-align: center;
        margin-bottom: 6px;
      }
      .subheader {
        font-size: 15px;
        color: #555;
        text-align: center;
        margin-bottom: 30px;
      }
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin: 25px 0 10px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 6px;
      }
      .contact-list,
      .info-table {
        width: 100%;
        border-collapse: collapse;
        margin: 0;
        padding: 0;
      }
      .contact-item {
        padding: 6px 0;
        font-size: 14px;
      }
      .contact-label {
        font-weight: 600;
        margin-right: 6px;
        color: #374151;
      }
      .info-label {
        font-size: 13px;
        font-weight: 600;
        color: #6b7280;
        padding: 6px 0;
        width: 140px;
        text-transform: uppercase;
      }
      .info-value {
        font-size: 15px;
        color: #111827;
        padding: 6px 0;
      }
      .score-badge {
        display: inline-block;
        background-color: #007ea7;
        color: white;
        padding: 5px 12px;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 14px;
      }
      .quiz-responses {
        background-color: #f9fafb;
        border-radius: 6px;
        padding: 12px;
        font-size: 14px;
        margin-top: 10px;
      }
      .quiz-item {
        padding: 6px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      .quiz-item:last-child {
        border-bottom: none;
      }
      .dashboard-section {
        text-align: center;
        margin-top: 30px;
      }
      .dashboard-link {
        display: inline-block;
        background-color: #007ea7;
        color: #ffffff !important;
        padding: 12px 24px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        font-size: 15px;
      }
      .footer {
        font-size: 12px;
        color: #999;
        margin-top: 40px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <img
        src="https://drvitjhhggcywuepyncx.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202025-05-26%20at%2009.26.08.jpeg"
        alt="Patient Pathway Logo"
        class="logo"
      />
      <div class="header">PatientPathway.ai</div>
      <div class="subheader">New Quiz Submission</div>

      <div>
        <h3 class="section-title">Patient Contact Information</h3>
        <ul class="contact-list">
          <li class="contact-item">
            <span class="contact-label">Name:</span>${lead.name}
          </li>
          <li class="contact-item">
            <span class="contact-label">Mobile:</span>${lead.phone}
          </li>
          <li class="contact-item">
            <span class="contact-label">Email:</span>
            <a href="mailto:${lead.email}" style="color:#007ea7; text-decoration:underline;">${lead.email || 'Not provided'}</a>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="section-title">Assessment Details</h3>
        <table class="info-table">
          <tr>
            <td class="info-label">Quiz Type</td>
            <td class="info-value">${lead.quiz_type}</td>
          </tr>
          <tr>
            <td class="info-label">Doctor</td>
            <td class="info-value">${doctorName}</td>
          </tr>
          <tr>
            <td class="info-label">Status</td>
            <td class="info-value">Qualified Lead</td>
          </tr>
          <tr>
            <td class="info-label">Score</td>
            <td class="info-value"><span class="score-badge">${lead.score}</span></td>
          </tr>
          <tr>
            <td class="info-label">Source</td>
            <td class="info-value">${lead.lead_source}</td>
          </tr>
        </table>
        <p style="font-size:13px; color:#6b7280; margin-top:8px;">
          Submitted: ${new Date(lead.submitted_at).toLocaleString()}
        </p>
      </div>

      <div>
        <h3 class="section-title">Quiz Responses</h3>
        <div class="quiz-responses">
          ${generateMinimalAnswersSummary(lead.answers)}
        </div>
      </div>

      <div class="dashboard-section">
        <h3 style="font-size:16px; margin-bottom:12px; color:#374151;">
          Access Your Clinician Dashboard
        </h3>
        <a href="${dashboardUrl}" class="dashboard-link">Open Dashboard</a>
      </div>

      <div class="footer">
        © 2025 Patient Pathway. All rights reserved.
      </div>
    </div>
  </body>
</html>
`;
  const text = `
New Quiz Submission

Quiz: ${lead.quiz_type} - ${doctorName}
Status: Qualified Lead
Total Score: ${lead.score}
Submitted: ${new Date(lead.submitted_at).toLocaleString()}

Contact Information
• Full Name: ${lead.name}
• Mobile: ${lead.phone}

All Contact Fields
name: ${lead.name}
phone: ${lead.phone}
email: ${lead.email}

Quiz Responses
${generateMinimalTextAnswers(lead.answers)}

Clinician Dashboard Access
Check out your clinician dashboard:
${dashboardUrl}
PIN: 29108
Hint: Your PIN is your office zip code.
  `;

  try {
    console.log('Preparing email data...');
    const emailData = {
        from: 'PatientPathway.ai <office@patientpathway.ai>', // Using verified domain
      to: doctorProfile.email,
      subject: `Quiz Notifications`,
      html: html,
      text: text,
      reply_to: doctorProfile.email
    };
    console.log('Email data prepared:', { 
      to: emailData.to, 
      subject: emailData.subject,
      from: emailData.from 
    });

    console.log('Sending request to Resend API...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
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
      message: 'Doctor notification email sent successfully'
    };
  } catch (error: any) {
    console.error('Error in sendDoctorNotificationEmail:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send doctor notification email'
    };
  }
}

function generateMinimalAnswersSummary(answers: any) {
  if (!answers || Object.keys(answers).length === 0) {
    return '<div class="quiz-item"><span class="quiz-question">No answers provided</span></div>';
  }
  
  let summary = '';
  
  // Process answers in minimal format with proper destructuring
  Object.entries(answers).forEach(([key, value], index) => {
    const question = `Question ${index + 1}`;
    let answerText = '';
    
    // Handle different answer formats
    if (typeof value === 'object' && value !== null) {
      const answerObj = value as any;
      // If it's an object with answer, answerIndex, questionIndex
      if (answerObj.answer !== undefined) {
        answerText = answerObj.answer;
      } else if (answerObj.answerIndex !== undefined) {
        // Convert answerIndex to readable text
        const answerIndex = answerObj.answerIndex;
        if (answerIndex === 0) answerText = 'None (0)';
        else if (answerIndex === 1) answerText = 'Mild (1)';
        else if (answerIndex === 2) answerText = 'Moderate (2)';
        else if (answerIndex === 3) answerText = 'Severe (3)';
        else answerText = `Option ${answerIndex}`;
      } else {
        answerText = JSON.stringify(value);
      }
    } else {
      // Handle primitive values
      answerText = String(value);
    }
    
    summary += `<div class="quiz-item">
      <span class="quiz-question">${question}</span>
      <span class="quiz-answer">${answerText}</span>
    </div>`;
  });
  
  return summary;
}

function generateMinimalTextAnswers(answers: any) {
  if (!answers || Object.keys(answers).length === 0) {
    return 'Detailed answers not available.';
  }
  
  let summary = '';
  
  // Process answers in minimal text format with proper destructuring
  Object.entries(answers).forEach(([key, value], index) => {
    const question = `Question ${index + 1}`;
    let answerText = '';
    
    // Handle different answer formats
    if (typeof value === 'object' && value !== null) {
      const answerObj = value as any;
      // If it's an object with answer, answerIndex, questionIndex
      if (answerObj.answer !== undefined) {
        answerText = answerObj.answer;
      } else if (answerObj.answerIndex !== undefined) {
        // Convert answerIndex to readable text
        const answerIndex = answerObj.answerIndex;
        if (answerIndex === 0) answerText = 'None (0)';
        else if (answerIndex === 1) answerText = 'Mild (1)';
        else if (answerIndex === 2) answerText = 'Moderate (2)';
        else if (answerIndex === 3) answerText = 'Severe (3)';
        else answerText = `Option ${answerIndex}`;
      } else {
        // Fallback to JSON string for other object formats
        answerText = JSON.stringify(value);
      }
    } else {
      // Handle primitive values
      answerText = String(value);
    }
    
    summary += `${question}: ${answerText}\n`;
  });
  
  return summary;
}

function generateAnswersSummary(answers: any) {
  if (!answers || Object.keys(answers).length === 0) {
    return '<div class="lead-info"><h3>Assessment Details</h3><p>Detailed answers not available.</p></div>';
  }
  
  let summary = '<div class="lead-info"><h3>Assessment Details</h3><table class="answers-table">';
  summary += '<tr><th>Question</th><th>Answer</th><th>Score</th></tr>';
  
  // Process answers
  Object.entries(answers).forEach(([key, value], index) => {
    const question = `Question ${index + 1}`;
    const answer = typeof value === 'object' ? JSON.stringify(value) : value;
    const score = typeof value === 'number' ? value : 'N/A';
    
    summary += `<tr><td>${question} : </td><td>${answer}</td><td>${score}</td></tr>`;
  });
  
  summary += '</table></div>';
  return summary;
}

function getSeverityLevel(score: number) {
  if (score >= 80) return 'severe';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'mild';
  return 'normal';
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'severe': return '#dc2626';
    case 'moderate': return '#ea580c';
    case 'mild': return '#ca8a04';
    default: return '#059669';
  }
}

serve(handler);
