
-- Create table for email notification configurations
CREATE TABLE IF NOT EXISTS public.email_notification_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL,
  
  -- Patient Notification Email Config
  patient_from_alias TEXT DEFAULT 'Dr. Vaughn at Exhale Sinus',
  patient_reply_to TEXT DEFAULT 'niki@exhalesinus.com',
  patient_subject TEXT,
  patient_preheader TEXT DEFAULT 'Your medical assessment results is not a diagnosis.',
  patient_body TEXT,
  patient_signature TEXT DEFAULT E'Dr. Ryan Vaughn\nExhale Sinus',
  patient_footer TEXT DEFAULT E'© 2025 Exhale Sinus. All rights reserved.',
  patient_enabled BOOLEAN DEFAULT true,
  
  -- Internal Notification Email Config  
  internal_to_emails TEXT[] DEFAULT ARRAY['Mehdiarani@gmail.com', 'niki@exhalesinus.com'],
  internal_from TEXT DEFAULT 'PatientPathway.ai <office@patientpathway.ai>',
  internal_subject TEXT,
  internal_body TEXT,
  internal_enabled BOOLEAN DEFAULT true,
  
  -- Patient Education Email Config (future use)
  education_enabled BOOLEAN DEFAULT false,
  education_subject TEXT,
  education_body TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_configs_doctor_quiz ON public.email_notification_configs(doctor_id, quiz_type);

-- Enable RLS
ALTER TABLE public.email_notification_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with proper UUID handling
CREATE POLICY "Users can view their own email configs"
  ON public.email_notification_configs
  FOR SELECT
  USING (doctor_id IN (
    SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own email configs"
  ON public.email_notification_configs
  FOR INSERT
  WITH CHECK (doctor_id IN (
    SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own email configs"
  ON public.email_notification_configs
  FOR UPDATE
  USING (doctor_id IN (
    SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own email configs"
  ON public.email_notification_configs
  FOR DELETE
  USING (doctor_id IN (
    SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_email_notification_configs_updated_at
  BEFORE UPDATE ON public.email_notification_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
