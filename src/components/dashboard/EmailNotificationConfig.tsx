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
    patient_subject: `Your ${quizTitle} Results from Exhale Sinus`,
    patient_preheader: 'Your medical assessment results is not a diagnosis.',
    patient_body: `Thank you for taking the time to complete your ${quizTitle} assessment. We have received your responses and are currently reviewing them to provide you with the most appropriate care recommendations.`,
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

  useEffect(() => {
    loadConfig();
  }, [doctorProfile?.id, quizId]);

  const loadConfig = async () => {
    if (!doctorProfile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_notification_configs')
        .select('*')
        .eq('doctor_id', doctorProfile.id)
        .eq('quiz_type', quizId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading email config:', error);
        return;
      }

      if (data) {
        setConfig({
          patient_from_alias: data.patient_from_alias || config.patient_from_alias,
          patient_reply_to: data.patient_reply_to || config.patient_reply_to,
          patient_subject: data.patient_subject || config.patient_subject,
          patient_preheader: data.patient_preheader || config.patient_preheader,
          patient_body: data.patient_body || config.patient_body,
          patient_signature: data.patient_signature || config.patient_signature,
          patient_footer: data.patient_footer || config.patient_footer,
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

    try {
      setSaving(true);

      const { error } = await supabase
        .from('email_notification_configs')
        .upsert({
          doctor_id: doctorProfile.id,
          quiz_type: quizId,
          ...config,
        }, {
          onConflict: 'doctor_id,quiz_type'
        });

      if (error) throw error;

      toast.success('Email configuration saved successfully');
    } catch (error: any) {
      console.error('Error saving email config:', error);
      toast.error('Failed to save email configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleToEmailsChange = (value: string) => {
    const emails = value.split(',').map(e => e.trim()).filter(e => e);
    setConfig({ ...config, internal_to_emails: emails });
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
                  placeholder={`Your ${quizTitle} Results from Exhale Sinus`}
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
                  rows={6}
                  placeholder="Enter the main email content..."
                  value={config.patient_body}
                  onChange={(e) => setConfig({ ...config, patient_body: e.target.value })}
                  className="font-sans"
                />
                <p className="text-xs text-muted-foreground">
                  Note: Logo will be centered from your profile automatically
                </p>
              </div>

              <div className="space-y-2">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Appointment Button Text</Label>
                    <Input
                      placeholder="Request an appointment"
                      value={config.footer_appointment_button_text || ''}
                      onChange={(e) => setConfig({ ...config, footer_appointment_button_text: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Appointment Button URL</Label>
                    <Input
                      placeholder="#"
                      value={config.footer_appointment_button_url || ''}
                      onChange={(e) => setConfig({ ...config, footer_appointment_button_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quick Links (one per line)</Label>
                  <Textarea
                    rows={6}
                    placeholder="Sinus Pain&#10;Sinus Headaches&#10;Sinus Quiz&#10;Nasal & Sinus Procedures&#10;Privacy Policy&#10;Accessibility Statement"
                    value={Array.isArray(config.footer_quick_links) ? config.footer_quick_links.join('\n') : ''}
                    onChange={(e) => setConfig({ ...config, footer_quick_links: e.target.value.split('\n').filter(l => l.trim()) })}
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
                <Input
                  type="text"
                  placeholder="email1@example.com, email2@example.com"
                  value={config.internal_to_emails.join(', ')}
                  onChange={(e) => handleToEmailsChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple emails with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label>From Email</Label>
                <Input
                  value={config.internal_from}
                  onChange={(e) => setConfig({ ...config, internal_from: e.target.value })}
                  disabled
                  className="bg-gray-50"
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

        {showPreview && activeTab === 'patient' && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-4">Email Preview</h4>
            <div className="bg-white rounded shadow-sm max-w-[600px] mx-auto">
              {doctorProfile?.logo_url && (
                <div className="text-center py-8 bg-white">
                  <img 
                    src={doctorProfile.logo_url} 
                    alt={doctorProfile.clinic_name || 'Logo'} 
                    className="max-w-[200px] h-auto mx-auto"
                  />
                </div>
              )}
              
              <div className="p-8">
                <p className="text-lg font-medium mb-4">Dear [Patient Name],</p>
                <div className="text-gray-700 mb-6 whitespace-pre-line">
                  {config.patient_body || `Thank you for completing the ${quizTitle} assessment. Your results have been submitted and our team will review them shortly.`}
                </div>
                <div className="mt-6 text-gray-900 whitespace-pre-line">
                  {config.patient_signature || `Dr. Ryan Vaughn\nExhale Sinus`}
                </div>
              </div>
              
              <div className="bg-[#0b5d82] text-white p-6 text-sm">
                <div className="grid grid-cols-3 gap-6">
                  {/* Left Column - Logo and Contact */}
                  <div>
                    {doctorProfile?.logo_url && (
                      <img 
                        src={doctorProfile.logo_url} 
                        alt="Exhale Sinus" 
                        className="max-w-[120px] h-auto mb-4"
                      />
                    )}
                    <p className="mb-1 text-xs">{config.footer_address_1 || '814 E Woodfield, Schaumburg, IL 60173'}</p>
                    <p className="mb-4 text-xs">{config.footer_address_2 || '735 N. Perryville Rd. Suite 4, Rockford, IL 61107'}</p>
                    <div className="flex gap-3">
                      <span className="text-xl">📘</span>
                      <span className="text-xl">🐦</span>
                      <span className="text-xl">📷</span>
                      <span className="text-xl">▶️</span>
                    </div>
                  </div>
                  
                  {/* Middle Column - Hours */}
                  <div>
                    <h3 className="font-bold mb-2">Hours of Operation</h3>
                    <p className="mb-3 text-xs whitespace-pre-line">{config.footer_hours || 'Monday - Thursday 8:00 am - 5:00 pm\nFriday - 9:00 am - 5:00 pm'}</p>
                    {(config.footer_phone_numbers || ['224-529-4697', '815-977-5715', '815-281-5803']).map((phone, idx) => (
                      <p key={idx} className="mb-1 text-xs">📞 {phone}</p>
                    ))}
                    <button className="bg-white text-[#0b5d82] px-4 py-2 rounded text-xs font-semibold mt-3">
                      {config.footer_appointment_button_text || 'Request an appointment'} ▶
                    </button>
                  </div>
                  
                  {/* Right Column - Quick Links */}
                  <div>
                    <h3 className="font-bold mb-2">Quick Links</h3>
                    {(config.footer_quick_links || ['Sinus Pain', 'Sinus Headaches', 'Sinus Quiz', 'Nasal & Sinus Procedures', 'Privacy Policy', 'Accessibility Statement']).map((link, idx) => (
                      <p key={idx} className="mb-1 text-xs">{link}</p>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/20 text-center text-xs whitespace-pre-line">
                  {config.patient_footer || '© 2025 Exhale Sinus. All rights reserved.'}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
