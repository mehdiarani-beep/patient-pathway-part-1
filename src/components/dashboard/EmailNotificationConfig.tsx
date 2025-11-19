import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Mail, Save, Eye, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailNotificationConfigProps {
  doctorProfile: any;
  quizId: string;
  quizTitle: string;
}

interface EmailConfig {
  patient_from_alias: string;
  patient_reply_to: string;
  patient_subject: string;
  patient_preheader: string;
  patient_body: string;
  patient_highlight_box_title?: string;
  patient_highlight_box_content?: string;
  patient_next_steps_title?: string;
  patient_next_steps_items?: string[];
  patient_contact_info_title?: string;
  patient_contact_info_content?: string;
  patient_closing_content?: string;
  patient_signature: string;
  patient_footer: string;
  footer_address_1?: string;
  footer_address_2?: string;
  footer_hours?: string;
  footer_phone_numbers?: string[];
  footer_quick_links?: string[];
  footer_appointment_button_text?: string;
  footer_appointment_button_url?: string;
  patient_enabled: boolean;
  internal_to_emails: string[];
  internal_from: string;
  internal_subject: string;
  internal_body: string;
  internal_enabled: boolean;
  education_enabled: boolean;
  education_subject: string;
  education_body: string;
}

export function EmailNotificationConfig({ doctorProfile, quizId, quizTitle }: EmailNotificationConfigProps) {
  const [config, setConfig] = useState<EmailConfig>({
    patient_from_alias: 'Dr. Vaughn at Exhale Sinus',
    patient_reply_to: 'niki@exhalesinus.com',
    patient_subject: `Your ${quizTitle} Results from Exhale Sinus.`,
    patient_preheader: 'Your medical assessment results is not a diagnosis.',
    patient_body: `Thank you for taking the time to complete your ${quizTitle} assessment. We have received your responses and are currently reviewing them to provide you with the most appropriate care recommendations.`,
    patient_highlight_box_title: 'What happens next?',
    patient_highlight_box_content: 'Our medical team will carefully review your assessment results and prepare personalized recommendations based on your responses. You can expect to hear from us within 24-48 hours with next steps for your care.',
    patient_next_steps_title: 'Next Steps',
    patient_next_steps_items: [
      'Our team will review your assessment results',
      'We\'ll prepare personalized recommendations',
      'You\'ll receive a follow-up communication within 24-48 hours',
      'If urgent, please don\'t hesitate to contact us directly'
    ],
    patient_contact_info_title: 'Need Immediate Assistance?',
    patient_contact_info_content: 'If you have any urgent concerns or questions, please don\'t wait for our follow-up. Contact our office directly at your earliest convenience.',
    patient_closing_content: 'We appreciate your trust in our care and look forward to helping you on your health journey.',
    patient_signature: 'Dr. Ryan Vaughn\nExhale Sinus',
    patient_footer: '© 2025 Exhale Sinus. All rights reserved.',
    footer_address_1: '814 E Woodfield, Schaumburg, IL 60173',
    footer_address_2: '735 N. Perryville Rd. Suite 4, Rockford, IL 61107',
    footer_hours: 'Monday - Thursday 8:00 am - 5:00 pm\nFriday - 9:00 am - 5:00 pm',
    footer_phone_numbers: ['224-529-4697', '815-977-5715', '815-281-5803'],
    footer_quick_links: ['Sinus Pain', 'Sinus Headaches', 'Sinus Quiz', 'Nasal & Sinus Procedures', 'Privacy Policy', 'Accessibility Statement'],
    footer_appointment_button_text: 'Request an appointment',
    footer_appointment_button_url: '#',
    patient_enabled: true,
    internal_to_emails: ['Mehdiarani@gmail.com', 'niki@exhalesinus.com'],
    internal_from: 'PatientPathway.ai <office@patientpathway.ai>',
    internal_subject: `New Lead Submitted - ${quizTitle}`,
    internal_body: `A new patient has completed the ${quizTitle} assessment. Please review the submission and follow up accordingly.`,
    internal_enabled: true,
    education_enabled: false,
    education_subject: '',
    education_body: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('patient');
  const [showPreview, setShowPreview] = useState(false);
  const [internalEmailsInput, setInternalEmailsInput] = useState('');

  useEffect(() => {
    loadConfig();
  }, [doctorProfile?.id, quizId]);

  const loadConfig = async () => {
    if (!doctorProfile?.id || !quizId) return;

    try {
      setLoading(true);
      
      // Normalize quiz_type to uppercase to match database format
      const normalizedQuizType = quizId.toUpperCase();
      
      console.log('Loading email config:', {
        doctor_id: doctorProfile.id,
        quiz_type: normalizedQuizType,
        original_quiz_id: quizId
      });

      // Try with normalized (uppercase) first
      let { data, error } = await supabase
        .from('email_notification_configs')
        .select('*')
        .eq('doctor_id', doctorProfile.id)
        .eq('quiz_type', normalizedQuizType)
        .maybeSingle();

      // If not found with normalized, try original format
      if (!data && quizId !== normalizedQuizType) {
        console.log('Trying with original quiz_type format...');
        const retryResult = await supabase
          .from('email_notification_configs')
          .select('*')
          .eq('doctor_id', doctorProfile.id)
          .eq('quiz_type', quizId)
          .maybeSingle();
        
        if (retryResult.data) {
          data = retryResult.data;
          error = null;
        } else if (retryResult.error) {
          error = retryResult.error;
        }
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading email config:', error);
        return;
      }

      console.log('Email config loaded:', data ? 'Found' : 'Not found (using defaults)');

      if (data) {
        setConfig({
          patient_from_alias: data.patient_from_alias || config.patient_from_alias,
          patient_reply_to: data.patient_reply_to || config.patient_reply_to,
          patient_subject: data.patient_subject || config.patient_subject,
          patient_preheader: data.patient_preheader || config.patient_preheader,
          patient_body: data.patient_body || config.patient_body,
          patient_highlight_box_title: data.patient_highlight_box_title || config.patient_highlight_box_title,
          patient_highlight_box_content: data.patient_highlight_box_content || config.patient_highlight_box_content,
          patient_next_steps_title: data.patient_next_steps_title || config.patient_next_steps_title,
          patient_next_steps_items: data.patient_next_steps_items || config.patient_next_steps_items,
          patient_contact_info_title: data.patient_contact_info_title || config.patient_contact_info_title,
          patient_contact_info_content: data.patient_contact_info_content || config.patient_contact_info_content,
          patient_closing_content: data.patient_closing_content || config.patient_closing_content,
          patient_signature: data.patient_signature || config.patient_signature,
          patient_footer: data.patient_footer || config.patient_footer,
          footer_address_1: data.footer_address_1 || config.footer_address_1,
          footer_address_2: data.footer_address_2 || config.footer_address_2,
          footer_hours: data.footer_hours || config.footer_hours,
          footer_phone_numbers: data.footer_phone_numbers || config.footer_phone_numbers,
          footer_quick_links: data.footer_quick_links || config.footer_quick_links,
          footer_appointment_button_text: data.footer_appointment_button_text || config.footer_appointment_button_text,
          footer_appointment_button_url: data.footer_appointment_button_url || config.footer_appointment_button_url,
          patient_enabled: data.patient_enabled ?? config.patient_enabled,
          internal_to_emails: data.internal_to_emails || config.internal_to_emails,
          internal_from: data.internal_from || config.internal_from,
          internal_subject: data.internal_subject || config.internal_subject,
          internal_body: data.internal_body || config.internal_body,
          internal_enabled: data.internal_enabled ?? config.internal_enabled,
          education_enabled: data.education_enabled ?? config.education_enabled,
          education_subject: data.education_subject || config.education_subject,
          education_body: data.education_body || config.education_body,
        });
        // Set the raw input value for the textarea
        if (data.internal_to_emails && Array.isArray(data.internal_to_emails)) {
          setInternalEmailsInput(data.internal_to_emails.join(', '));
        }
      }
    } catch (error) {
      console.error('Error loading email config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!doctorProfile?.id) {
      toast.error('Doctor profile not found');
      return;
    }

    if (!quizId) {
      toast.error('Quiz ID not found');
      return;
    }

    try {
      setSaving(true);

      // Normalize quiz_type to uppercase to match database format
      const normalizedQuizType = quizId.toUpperCase();

      // Remove non-editable fields from save (they will always use defaults)
      const { 
        patient_highlight_box_title, 
        patient_highlight_box_content,
        patient_next_steps_title, 
        patient_next_steps_items, 
        patient_contact_info_title, 
        patient_contact_info_content, 
        patient_closing_content, 
        ...configToSave 
      } = config;

      console.log('Saving email config:', {
        doctor_id: doctorProfile.id,
        quiz_type: normalizedQuizType,
        original_quiz_id: quizId
      });

      // Clean up internal_to_emails - filter out any invalid entries before saving
      const cleanedConfig = {
        ...configToSave,
        internal_to_emails: Array.isArray(configToSave.internal_to_emails) 
          ? configToSave.internal_to_emails.filter((email: string) => email && email.trim().length > 0 && email.includes('@'))
          : []
      };

      const { data, error } = await supabase
        .from('email_notification_configs')
        .upsert({
          doctor_id: doctorProfile.id,
          quiz_type: normalizedQuizType,
          ...cleanedConfig,
          // Explicitly set non-editable fields to null so they use defaults
          patient_highlight_box_title: null,
          patient_highlight_box_content: null,
          patient_next_steps_title: null,
          patient_next_steps_items: null,
          patient_contact_info_title: null,
          patient_contact_info_content: null,
          patient_closing_content: null,
        }, {
          onConflict: 'doctor_id,quiz_type'
        });

      if (error) {
        console.error('Error saving email config:', error);
        throw error;
      }

      console.log('Email config saved successfully:', data);
      toast.success('Email configuration saved successfully');
    } catch (error: any) {
      console.error('Error saving email config:', error);
      toast.error(`Failed to save email configuration: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToEmailsChange = (value: string) => {
    // Store the raw input value (preserves commas and allows free typing)
    setInternalEmailsInput(value);
    
    // Parse emails for display/validation, but keep the raw value in state
    if (!value || value.trim() === '') {
      setConfig({ ...config, internal_to_emails: [] });
      return;
    }
    
    // Split by comma and trim, filter out empty strings
    const emails = value
      .split(',')
      .map(e => e.trim())
      .filter(e => e && e.length > 0);
    
    setConfig({ ...config, internal_to_emails: emails });
    console.log('Updated internal_to_emails:', emails);
  };

  if (loading) {
    return <div>Loading email configuration...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email (lead) Notifications Set up
        </CardTitle>
        <CardDescription>
          Configure automated email notifications for {quizTitle} submissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="patient">
              Patient Confirmation
              {config.patient_enabled && <Badge className="ml-2 bg-green-500">Enabled</Badge>}
            </TabsTrigger>
            <TabsTrigger value="internal">
              Internal Notification
              {config.internal_enabled && <Badge className="ml-2 bg-green-500">Enabled</Badge>}
            </TabsTrigger>
            <TabsTrigger value="education">
              Patient Education
              {config.education_enabled && <Badge className="ml-2 bg-green-500">Enabled</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Patient Confirmation Email */}
          <TabsContent value="patient" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Patient Confirmation Email</h3>
                <p className="text-sm text-muted-foreground">Sent to the lead when they submit the assessment</p>
              </div>
              <Switch
                checked={config.patient_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, patient_enabled: checked })}
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Email Alias</Label>
                  <Input
                    placeholder="Dr. Vaughn at Exhale Sinus"
                    value={config.patient_from_alias}
                    onChange={(e) => setConfig({ ...config, patient_from_alias: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reply-to Email</Label>
                  <Input
                    type="email"
                    placeholder="niki@exhalesinus.com"
                    value={config.patient_reply_to}
                    onChange={(e) => setConfig({ ...config, patient_reply_to: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  placeholder={`Your ${quizTitle} Results from Exhale Sinus.`}
                  value={config.patient_subject}
                  onChange={(e) => setConfig({ ...config, patient_subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Pre-header</Label>
                <Input
                  placeholder="Your medical assessment results is not a diagnosis."
                  value={config.patient_preheader}
                  onChange={(e) => setConfig({ ...config, patient_preheader: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Email Body</Label>
                <Textarea
                  rows={4}
                  placeholder="Enter the main email content..."
                  value={config.patient_body}
                  onChange={(e) => setConfig({ ...config, patient_body: e.target.value })}
                  className="font-sans"
                />
                <p className="text-xs text-muted-foreground">
                  Note: Logo will be centered from your profile automatically
                </p>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label>Signature</Label>
                <Textarea
                  rows={3}
                  placeholder="Dr. Ryan Vaughn&#10;Exhale Sinus"
                  value={config.patient_signature}
                  onChange={(e) => setConfig({ ...config, patient_signature: e.target.value })}
                  className="font-sans"
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm">Footer Content</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Address 1</Label>
                    <Input
                      placeholder="814 E Woodfield, Schaumburg, IL 60173"
                      value={config.footer_address_1 || ''}
                      onChange={(e) => setConfig({ ...config, footer_address_1: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address 2</Label>
                    <Input
                      placeholder="735 N. Perryville Rd. Suite 4, Rockford, IL 61107"
                      value={config.footer_address_2 || ''}
                      onChange={(e) => setConfig({ ...config, footer_address_2: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Hours of Operation</Label>
                  <Textarea
                    rows={2}
                    placeholder="Monday - Thursday 8:00 am - 5:00 pm&#10;Friday - 9:00 am - 5:00 pm"
                    value={config.footer_hours || ''}
                    onChange={(e) => setConfig({ ...config, footer_hours: e.target.value })}
                    className="font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone Numbers (one per line)</Label>
                  <Textarea
                    rows={3}
                    placeholder="224-529-4697&#10;815-977-5715&#10;815-281-5803"
                    value={Array.isArray(config.footer_phone_numbers) ? config.footer_phone_numbers.join('\n') : ''}
                    onChange={(e) => setConfig({ ...config, footer_phone_numbers: e.target.value.split('\n').filter(p => p.trim()) })}
                    className="font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Copyright Text</Label>
                  <Textarea
                    rows={2}
                    placeholder="© 2025 Exhale Sinus. All rights reserved."
                    value={config.patient_footer || ''}
                    onChange={(e) => setConfig({ ...config, patient_footer: e.target.value })}
                    className="font-sans"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Internal Notification Email */}
          <TabsContent value="internal" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Internal Notification Email</h3>
                <p className="text-sm text-muted-foreground">Sent to authorized users when a lead submits</p>
              </div>
              <Switch
                checked={config.internal_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, internal_enabled: checked })}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>To Email(s)</Label>
                <Textarea
                  rows={2}
                  placeholder="email1@example.com, email2@example.com"
                  value={internalEmailsInput}
                  onChange={(e) => handleToEmailsChange(e.target.value)}
                  className="font-sans"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple emails with commas. Saved to: <code className="text-xs bg-gray-100 px-1 rounded">email_notification_configs.internal_to_emails</code>
                </p>
                {config.internal_to_emails.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <strong>Emails ({config.internal_to_emails.length}):</strong> {config.internal_to_emails.join(', ')}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>From Email</Label>
                <Input
                  value={config.internal_from}
                  onChange={(e) => setConfig({ ...config, internal_from: e.target.value })}
                  placeholder="PatientPathway.ai <office@patientpathway.ai>"
                />
              </div>

              <div className="space-y-2">
                <Label>Reply-to</Label>
                <Input
                  value="Do not reply to this email"
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  placeholder={`New Lead Submitted - ${quizTitle}`}
                  value={config.internal_subject}
                  onChange={(e) => setConfig({ ...config, internal_subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Email Body</Label>
                <Textarea
                  rows={8}
                  placeholder="Enter the internal notification content..."
                  value={config.internal_body}
                  onChange={(e) => setConfig({ ...config, internal_body: e.target.value })}
                  className="font-sans"
                />
              </div>
            </div>
          </TabsContent>

          {/* Patient Education Email */}
          <TabsContent value="education" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Patient Education Email</h3>
                <p className="text-sm text-muted-foreground">Follow-up educational content (Coming soon)</p>
              </div>
              <Switch
                checked={config.education_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, education_enabled: checked })}
              />
            </div>

            <div className="p-6 border border-dashed rounded-lg text-center text-muted-foreground">
              <p>Patient education emails will be available in a future update.</p>
              <p className="text-sm mt-2">This feature will use the current Mail Preview template.</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-3 mt-6 pt-6 border-t">
          <Button onClick={saveConfig} disabled={saving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide Preview' : 'Preview Email'}
          </Button>
        </div>

        {showPreview && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-4">
              {activeTab === 'patient' ? 'Patient Confirmation Email Preview' : 'Internal Notification Email Preview'}
            </h4>
            {activeTab === 'patient' ? (
              <div className="bg-white rounded shadow-sm max-w-[600px] mx-auto overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                {/* Pre-header (hidden but shown in email preview) */}
                <div style={{ display: 'none', fontSize: '1px', color: '#fefefe', lineHeight: '1px', maxHeight: '0px', maxWidth: '0px', opacity: 0, overflow: 'hidden' }}>
                  {config.patient_preheader || 'Your medical assessment results is not a diagnosis.'}
                </div>
                
                {/* Logo Header */}
                {(doctorProfile?.avatar_url || doctorProfile?.logo_url) && (
                  <div className="text-center py-10 px-5 bg-white">
                    <img 
                      src={doctorProfile.avatar_url || doctorProfile.logo_url} 
                      alt="Logo" 
                      className="max-w-[200px] h-auto mx-auto"
                    />
                  </div>
                )}
                
                {/* Email Body */}
                <div className="px-10 py-8">
                  <div className="text-lg text-[#1e293b] mb-5 font-medium">
                    Dear [Patient Name],
                  </div>
                  
                  <div className="text-base text-[#475569] mb-5 whitespace-pre-line leading-relaxed">
                    {config.patient_body || `Thank you for taking the time to complete your ${quizTitle} assessment. We have received your responses and are currently reviewing them to provide you with the most appropriate care recommendations.`}
                  </div>
                  
                  {/* Highlight Box */}
                  {config.patient_highlight_box_title && config.patient_highlight_box_content && (
                    <div className="bg-[#e0f2fe] border-l-4 border-[#0369a1] p-4 my-5 rounded-r">
                      <h3 className="text-base font-semibold text-[#0c4a6e] mb-2">{config.patient_highlight_box_title}</h3>
                      <div className="text-sm text-[#475569] whitespace-pre-line leading-relaxed">
                        {config.patient_highlight_box_content || 'Our medical team will carefully review your assessment results and prepare personalized recommendations based on your responses. You can expect to hear from us within 24-48 hours with next steps for your care.'}
                      </div>
                    </div>
                  )}
                  
                  {/* Assessment Details */}
                  <div className="bg-gray-50 p-4 my-5 rounded border">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-[#1e293b]">Assessment Type:</span>
                        <span className="text-[#475569]">{quizTitle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-[#1e293b]">{quizTitle} Score:</span>
                        <span className="text-[#475569] font-semibold">[Score will be displayed here]</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-[#1e293b]">Completed:</span>
                        <span className="text-[#475569]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-[#1e293b]">Time:</span>
                        <span className="text-[#475569]">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Next Steps */}
                  {config.patient_next_steps_title && (config.patient_next_steps_items?.length || 0) > 0 && (
                    <div className="my-5">
                      <h3 className="text-base font-semibold text-[#1e293b] mb-3">{config.patient_next_steps_title}</h3>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-[#475569]">
                        {(config.patient_next_steps_items || []).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Contact Info */}
                  {(config.patient_contact_info_title || config.patient_contact_info_content) && (
                    <div className="my-5">
                      <h3 className="text-base font-semibold text-[#1e293b] mb-2">{config.patient_contact_info_title || 'Need Immediate Assistance?'}</h3>
                      <p className="text-sm text-[#475569] whitespace-pre-line leading-relaxed">
                        {config.patient_contact_info_content || 'If you have any urgent concerns or questions, please don\'t wait for our follow-up. Contact our office directly at your earliest convenience.'}
                      </p>
                    </div>
                  )}
                  
                  {/* Closing Content */}
                  {config.patient_closing_content && (
                    <div className="text-base text-[#475569] my-5 whitespace-pre-line leading-relaxed">
                      {config.patient_closing_content}
                    </div>
                  )}
                  
                  {/* Signature */}
                  <div className="mt-8 text-base text-[#1e293b] whitespace-pre-line font-medium">
                    {config.patient_signature || `Dr. Ryan Vaughn\nExhale Sinus`}
                  </div>
                </div>
                
                {/* Footer */}
                <div className="bg-[#0b5d82] text-white px-10 py-8 text-xs">
                  <div className="grid grid-cols-2 gap-8 mb-5">
                    {/* Left Column - Logo and Addresses */}
                    <div>
                      {(doctorProfile?.avatar_url || doctorProfile?.logo_url) && (
                        <img 
                          src={doctorProfile.avatar_url || doctorProfile.logo_url} 
                          alt="Logo" 
                          className="max-w-[120px] h-auto mb-4"
                        />
                      )}
                      <p>{config.footer_address_1 || '814 E Woodfield, Schaumburg, IL 60173'}</p>
                      <p className="mt-2">{config.footer_address_2 || '735 N. Perryville Rd. Suite 4, Rockford, IL 61107'}</p>
                      <div className="flex gap-2 mt-4">
                        <span>📘</span>
                        <span>🐦</span>
                        <span>📷</span>
                        <span>▶️</span>
                      </div>
                    </div>
                    
                    {/* Middle Column - Hours and Contact */}
                    <div>
                      <h3 className="font-bold mb-2 text-sm">Hours of Operation</h3>
                      <p className="whitespace-pre-line text-[11px]">{config.footer_hours || 'Monday - Thursday 8:00 am - 5:00 pm\nFriday - 9:00 am - 5:00 pm'}</p>
                      {(config.footer_phone_numbers || ['224-529-4697', '815-977-5715', '815-281-5803']).map((phone, idx) => (
                        <p key={idx} className="mt-1 text-[11px]">📞 {phone}</p>
                      ))}
                      <a href={config.footer_appointment_button_url || '#'} className="inline-block bg-white text-[#0b5d82] px-5 py-2 rounded mt-3 font-bold text-[11px]">
                        {config.footer_appointment_button_text || 'Request an appointment'} ▶
                      </a>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8">
                    {/* Quick Links Column */}
                    <div>
                      <h3 className="font-bold mb-2 text-sm">Quick Links</h3>
                      {(config.footer_quick_links || ['Sinus Pain', 'Sinus Headaches', 'Sinus Quiz', 'Nasal & Sinus Procedures', 'Privacy Policy', 'Accessibility Statement']).map((link, idx) => (
                        <p key={idx} className="text-[11px]">{link}</p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-white/20 pt-5 mt-5 text-center text-[11px] whitespace-pre-line">
                    {config.patient_footer || '© 2025 Exhale Sinus. All rights reserved.'}
                  </div>
                </div>
              </div>
            ) : activeTab === 'internal' ? (
              <div className="bg-white rounded shadow-sm max-w-[700px] mx-auto overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                <div className="px-10 py-8">
                  {/* Logo Header */}
                  {(doctorProfile?.avatar_url || doctorProfile?.logo_url) && (
                    <div className="text-center mb-6">
                      <img 
                        src={doctorProfile.avatar_url || doctorProfile.logo_url} 
                        alt="Logo" 
                        className="max-w-[100px] h-auto mx-auto rounded-lg"
                      />
                    </div>
                  )}
                  
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-[#007ea7] mb-1">PatientPathway.ai</div>
                    <div className="text-[15px] text-[#555]">{config.internal_subject || `New Lead Submitted - ${quizTitle}`}</div>
                  </div>
                  
                  {/* Body Message */}
                  {config.internal_body && (
                    <div className="bg-[#f9fafb] border-l-4 border-[#007ea7] p-4 mb-5 rounded-r">
                      <p className="text-[15px] text-[#374151] whitespace-pre-line leading-relaxed">
                        {config.internal_body}
                      </p>
                    </div>
                  )}
                  
                  {/* Patient Contact Information */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-[#374151] mb-2 border-b border-[#e5e7eb] pb-1">
                      Patient Contact Information
                    </h3>
                    <ul className="space-y-1 text-sm">
                      <li><span className="font-semibold mr-1.5 text-[#374151]">Name:</span>[Patient Name]</li>
                      <li><span className="font-semibold mr-1.5 text-[#374151]">Mobile:</span>[Patient Phone]</li>
                      <li><span className="font-semibold mr-1.5 text-[#374151]">Email:</span><a href="mailto:[patient@email.com]" className="text-[#007ea7] underline">[patient@email.com]</a></li>
                    </ul>
                  </div>
                  
                  {/* Assessment Details */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-[#374151] mb-2 border-b border-[#e5e7eb] pb-1">
                      Assessment Details
                    </h3>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                          <td className="py-1.5 text-xs font-semibold text-[#6b7280] uppercase w-[140px]">Quiz Type</td>
                          <td className="py-1.5 text-[15px] text-[#111827]">{quizTitle}</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-xs font-semibold text-[#6b7280] uppercase">Doctor</td>
                          <td className="py-1.5 text-[15px] text-[#111827]">{doctorProfile?.first_name} {doctorProfile?.last_name}</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-xs font-semibold text-[#6b7280] uppercase">Status</td>
                          <td className="py-1.5 text-[15px] text-[#111827]">Qualified Lead</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-xs font-semibold text-[#6b7280] uppercase">Score</td>
                          <td className="py-1.5 text-[15px] text-[#111827]">
                            <span className="inline-block bg-[#007ea7] text-white px-3 py-1 rounded-full font-semibold text-sm">
                              [Score]
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-xs font-semibold text-[#6b7280] uppercase">Source</td>
                          <td className="py-1.5 text-[15px] text-[#111827]">[Lead Source]</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-xs text-[#6b7280] mt-2">
                      Submitted: {new Date().toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Quiz Responses */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold text-[#374151] mb-2 border-b border-[#e5e7eb] pb-1">
                      Quiz Responses
                    </h3>
                    <div className="bg-[#f9fafb] rounded p-3 text-sm">
                      <div className="py-1.5 border-b border-[#e5e7eb]">
                        <span className="font-medium">Question 1:</span> <span className="text-[#475569]">[Answer 1]</span>
                      </div>
                      <div className="py-1.5 border-b border-[#e5e7eb]">
                        <span className="font-medium">Question 2:</span> <span className="text-[#475569]">[Answer 2]</span>
                      </div>
                      <div className="py-1.5">
                        <span className="font-medium">Question 3:</span> <span className="text-[#475569]">[Answer 3]</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dashboard Link */}
                  <div className="text-center mt-8">
                    <h3 className="text-base mb-3 text-[#374151]">
                      Access Your Clinician Dashboard
                    </h3>
                    <a 
                      href="#" 
                      className="inline-block bg-[#007ea7] text-white px-6 py-3 rounded font-semibold text-[15px] hover:bg-[#006a8f]"
                    >
                      Open Dashboard
                    </a>
                  </div>
                  
                  {/* Footer */}
                  <div className="text-center text-xs text-[#999] mt-10">
                    © 2025 Patient Pathway. All rights reserved.
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
