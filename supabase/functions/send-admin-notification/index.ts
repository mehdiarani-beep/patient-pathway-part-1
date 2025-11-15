import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const handler = async (req: Request)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { email, firstName, lastName } = await req.json();
    if (!email) {
      throw new Error('Email is required');
    }
    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }
    // Create the email content
    const recipientName = firstName && lastName ? `${firstName} ${lastName}` : 'there';
    const subject = 'You\'ve Been Assigned as an Admin - Patient Pathway';
      const html = `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" lang="en" style="padding:0;Margin:0">
    <head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="telephone=no" name="format-detection">
    <title>Admin Access Granted</title>
    <!--[if (mso 16)]><style type="text/css"> a {text-decoration: none;} </style><![endif]-->
    <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
    <style type="text/css">
    #outlook a {padding:0;}
    .ExternalClass {width:100%;}
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height:100%;}
    a[x-apple-data-detectors] {color:inherit!important;text-decoration:none!important;}
    @media only screen and (max-width:600px) {
      p, a {line-height:150%!important}
      h1, h2 {text-align:center!important}
      h1 {font-size:28px!important}
      h2 {font-size:22px!important}
      .logo-img {width:150px!important;height:auto!important;}
    }
    </style>
    </head>
    <body style="font-family:arial, 'helvetica neue', helvetica, sans-serif;
    width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;
    padding:0;Margin:0;background-color:#f4f4f4;">
    <div style="background-color:#f4f4f4;">

    <table width="100%" cellspacing="0" cellpadding="0" role="none"
      style="border-collapse:collapse;padding:0;Margin:0;width:100%;background-color:#f4f4f4;">
    <tr>
    <td align="center" style="padding:20px 10px;Margin:0;">

      <!-- Main Container -->
      <table cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none"
        style="border-collapse:collapse;background-color:#ffffff;width:600px;border-radius:8px;overflow:hidden">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding:30px 30px 20px 30px;">
            <img src="https://patientpathway.ai/patient-pathway-logo.jpeg" alt="Patient Pathway" class="logo-img"
              style="display:block;border:0;outline:none;text-decoration:none;width:200px;height:auto;">
          </td>
        </tr>

        <!-- Header -->
        <tr>
          <td align="center" bgcolor="#667eea"
            style="padding:40px 30px;background: linear-gradient(135deg, #f7904f, #04748f);color:#ffffff;">
            <h1 style="Margin:0;font-size:28px;font-weight:600;">Admin Access Granted!</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td align="left" style="padding:40px 30px;">

            <h2 style="color: #04748f;font-size:24px;Margin:0 0 12px 0;">Welcome to the Admin Team, ${recipientName}!</h2>

            <p style="font-size:16px;line-height:24px;color:#333333;Margin:0 0 16px 0;">
              Great news! You've been assigned as an administrator on the Patient Pathway platform.
            </p>

            <p style="font-size:16px;line-height:24px;color:#333333;Margin:0 0 16px 0;">
              As an admin, you now have elevated permissions to help manage and oversee the platform.
            </p>

            <!-- Permissions box -->
            <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
              style="border-collapse:collapse;background:#f8f9ff;border-left: 4px solid #04748f;padding:0;Margin:24px 0;border-radius:4px;">
              <tr>
                <td style="padding:20px;">
                  <h3 style="Margin:0 0 12px 0;color: #04748f;font-size:18px;">Your Admin Capabilities:</h3>
                  <ul style="list-style:none;padding:0;Margin:0;">
                    <li style="padding:6px 0;padding-left:24px;">✓ View and manage all doctor profiles</li>
                    <li style="padding:6px 0;padding-left:24px;">✓ Access and export lead data across the platform</li>
                    <li style="padding:6px 0;padding-left:24px;">✓ Monitor quiz submissions and analytics</li>
                    <li style="padding:6px 0;padding-left:24px;">✓ Manage user accounts and permissions</li>
                    <li style="padding:6px 0;padding-left:24px;">✓ Access comprehensive platform statistics</li>
                    <li style="padding:6px 0;padding-left:24px;">✓ Moderate content and ensure quality standards</li>
                  </ul>
                </td>
              </tr>
            </table>

            <p style="font-size:16px;line-height:24px;color:#333333;">
              <strong>Account Email:</strong> ${email}
            </p>

            <!-- Button -->
            <div style="text-align:center;Margin:24px 0;">
              <a href="https://app.patientpathway.ai/admin"
                style="background-color: #04748f;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:600;display:inline-block;border-bottom: 2px solid green;">
                Access Admin Portal
              </a>
            </div>

            <p style="font-size:16px;line-height:24px;color:#333333;">
              If you have any questions about your new admin role or need assistance,
              please don't hesitate to reach out to our support team.
            </p>

            <p style="font-size:16px;line-height:24px;color:#333333;">
              Best regards,<br>
              <strong>The Patient Pathway Team</strong>
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" bgcolor="#f8f9fa"
            style="padding:30px;text-align:center;font-size:14px;color:#6c757d;border-top:1px solid #e9ecef;">
            <p style="Margin:0 0 8px 0;">This email was sent to ${email} because you were granted admin access on Patient Pathway.</p>
            <p style="Margin:0;">
              <a href="https://patientpathway.ai"
                style="color:#667eea;text-decoration:none;">Patient Pathway</a> |
              <a href="mailto:office@patientpathway.ai"
                style="color:#667eea;text-decoration:none;">office@patientpathway.ai</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
    </tr>
    </table>

    </div>
    </body>
    </html>`;
    const text = `
      Admin Access Granted - Patient Pathway
      
      Welcome to the Admin Team, ${recipientName}!
      
      Great news! You've been assigned as an administrator on the Patient Pathway platform.
      
      As an admin, you now have elevated permissions to help manage and oversee the platform.
      
      Your Admin Capabilities:
      - View and manage all doctor profiles
      - Access and export lead data across the platform
      - Monitor quiz submissions and analytics
      - Manage user accounts and permissions
      - Access comprehensive platform statistics
      - Moderate content and ensure quality standards
      
      Account Email: ${email}
      
      Access Admin Portal: https://app.patientpathway.ai/admin
      
      If you have any questions about your new admin role or need assistance, please don't hesitate to reach out to our support team.
      
      Best regards,
      The Patient Pathway Team
      
      ---
      This email was sent to ${email} because you were granted admin access on Patient Pathway.
      Patient Pathway | office@patientpathway.ai
    `;
    // Prepare email data
    const emailData = {
      from: 'office@patientpathway.ai',
      to: email,
      subject,
      html,
      text,
      reply_to: 'office@patientpathway.ai'
    };
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorData.message || 'Unknown error'}`);
    }
    const result = await resendResponse.json();
    await supabaseClient.from('email_logs').insert({
      recipient_email: email,
      subject,
      status: 'sent',
      resend_id: result.id,
      sent_at: new Date().toISOString()
    });
    return new Response(JSON.stringify({
      success: true,
      id: result.id,
      message: 'Admin notification email sent successfully'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error: any) {
    console.error("Error sending admin notification email:", error);
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
serve(handler);
