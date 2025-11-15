import { supabase } from '@/integrations/supabase/client';
import { resendService } from './resendService';

export type EmailTemplateData = Record<string, any>;

// Stub email template generators
const generateWelcomeEmail = (data: EmailTemplateData) => ({
  subject: 'Welcome to Patient Pathway',
  html: `<p>Welcome ${data.leadName || 'User'}!</p>`,
  text: `Welcome ${data.leadName || 'User'}!`
});

const generateDoctorNotificationEmail = (data: EmailTemplateData) => ({
  subject: 'New Lead Notification',
  html: `<p>You have a new lead: ${data.leadName || 'Unknown'}</p>`,
  text: `You have a new lead: ${data.leadName || 'Unknown'}`
});

const generateFollowUpEmail = (data: EmailTemplateData) => ({
  subject: 'Follow Up',
  html: `<p>Following up with ${data.leadName || 'you'}</p>`,
  text: `Following up with ${data.leadName || 'you'}`
});

export interface EmailServiceConfig {
  enabled: boolean;
  maxRetries: number;
  retryDelayMs: number;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  message: string;
  error?: string;
}

export class EmailService {
  private config: EmailServiceConfig;
  private retryCount: number = 0;

  constructor(config: EmailServiceConfig) {
    this.config = config;
  }

  /**
   * Send welcome email to patient
   */
  async sendWelcomeEmail(data: EmailTemplateData): Promise<EmailResult> {
    try {
      const { subject, html, text } = generateWelcomeEmail(data);
      
      const result = await this.sendEmail({
        to: data.leadEmail,
        subject,
        html,
        text,
        from: 'noreply@patientpathway.com'
      });

      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send welcome email',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send doctor notification email
   */
  async sendDoctorNotificationEmail(data: EmailTemplateData): Promise<EmailResult> {
    try {
      const { subject, html, text } = generateDoctorNotificationEmail(data);
      
      const result = await this.sendEmail({
        to: data.leadEmail, // This should be doctor's email, but using lead email for testing
        subject,
        html,
        text,
        from: 'noreply@patientpathway.com'
      });

      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send doctor notification email',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send follow-up email
   */
  async sendFollowUpEmail(data: EmailTemplateData): Promise<EmailResult> {
    try {
      const { subject, html, text } = generateFollowUpEmail(data);
      
      const result = await this.sendEmail({
        to: data.leadEmail,
        subject,
        html,
        text,
        from: 'noreply@patientpathway.com'
      });

      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send follow-up email',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Core email sending function
   */
  private async sendEmail(emailData: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    doctorId?: string;
  }): Promise<EmailResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'Email service is disabled'
      };
    }

    try {
      // Try to send via Resend edge function first
      const { data, error } = await supabase.functions.invoke('send-resend-email', {
        body: {
          ...emailData,
          from: emailData.from || 'noreply@patientpathway.ai'
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        return {
          success: true,
          id: data.id || `email_${Date.now()}`,
          message: 'Email sent successfully via Resend'
        };
      } else {
        throw new Error(data?.error || 'Email sending failed');
      }
    } catch (error) {
      // If Supabase function fails, try direct Resend API
      return this.fallbackEmailSending(emailData);
    }
  }

  /**
   * Fallback email sending using Resend directly
   */
  private async fallbackEmailSending(emailData: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    doctorId?: string;
  }): Promise<EmailResult> {
    // In development, just log the email
    const isDevelopment = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isDevelopment) {
      console.log('📧 Email would be sent (development mode):', {
        to: emailData.to,
        subject: emailData.subject,
        from: emailData.from || 'noreply@patientpathway.ai'
      });

      return {
        success: true,
        id: `dev_email_${Date.now()}`,
        message: 'Email logged in development mode'
      };
    }

    // Use Resend service directly as fallback
    try {
      return await resendService.sendEmail({
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        from: emailData.from || 'noreply@patientpathway.ai'
      });
    } catch (error) {
      return {
        success: false,
        message: 'Fallback email sending failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Retry mechanism for failed emails
   */
  async retryEmail(emailData: any, maxRetries: number = 3): Promise<EmailResult> {
    if (this.retryCount >= maxRetries) {
      this.retryCount = 0;
      return {
        success: false,
        message: `Email failed after ${maxRetries} retries`
      };
    }

    this.retryCount++;
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelayMs));
    
    return this.sendEmail(emailData);
  }

  /**
   * Reset retry counter
   */
  resetRetryCount(): void {
    this.retryCount = 0;
  }

  /**
   * Check if email service is available
   */
  isAvailable(): boolean {
    return this.config.enabled;
  }
}

// Default email service instance
export const emailService = new EmailService({
  enabled: true,
  maxRetries: 3,
  retryDelayMs: 5000
});

// Utility functions for easy access
export async function sendWelcomeEmail(data: EmailTemplateData): Promise<EmailResult> {
  return emailService.sendWelcomeEmail(data);
}

export async function sendDoctorNotificationEmail(data: EmailTemplateData): Promise<EmailResult> {
  return emailService.sendDoctorNotificationEmail(data);
}

export async function sendFollowUpEmail(data: EmailTemplateData): Promise<EmailResult> {
  return emailService.sendFollowUpEmail(data);
}
