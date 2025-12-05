-- ================================================
-- Phase 1: Multi-Physician Architecture Database Schema
-- ================================================

-- 1. Create clinic_physicians table
CREATE TABLE public.clinic_physicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinic_profiles(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  degree_type text DEFAULT 'MD' CHECK (degree_type IN ('MD', 'DO')),
  credentials text[] DEFAULT '{}',
  mobile text,
  email text,
  bio text,
  headshot_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_clinic_physicians_clinic_id ON public.clinic_physicians(clinic_id);
CREATE INDEX idx_clinic_physicians_active ON public.clinic_physicians(clinic_id, is_active);

-- Enable RLS
ALTER TABLE public.clinic_physicians ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clinic_physicians
CREATE POLICY "Public can view active physicians"
ON public.clinic_physicians
FOR SELECT
USING (is_active = true);

CREATE POLICY "Clinic members can view their physicians"
ON public.clinic_physicians
FOR SELECT
TO authenticated
USING (clinic_id IN (
  SELECT dp.clinic_id FROM public.doctor_profiles dp WHERE dp.user_id = auth.uid()
));

CREATE POLICY "Clinic members can insert physicians"
ON public.clinic_physicians
FOR INSERT
TO authenticated
WITH CHECK (clinic_id IN (
  SELECT dp.clinic_id FROM public.doctor_profiles dp WHERE dp.user_id = auth.uid()
));

CREATE POLICY "Clinic members can update their physicians"
ON public.clinic_physicians
FOR UPDATE
TO authenticated
USING (clinic_id IN (
  SELECT dp.clinic_id FROM public.doctor_profiles dp WHERE dp.user_id = auth.uid()
));

CREATE POLICY "Clinic members can delete their physicians"
ON public.clinic_physicians
FOR DELETE
TO authenticated
USING (clinic_id IN (
  SELECT dp.clinic_id FROM public.doctor_profiles dp WHERE dp.user_id = auth.uid()
));

-- 2. Create clinic_assets table
CREATE TABLE public.clinic_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinic_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'pdf', 'video', 'vector', 'document', 'other')),
  mime_type text,
  url text NOT NULL,
  storage_path text,
  file_size integer,
  width integer,
  height integer,
  metadata jsonb DEFAULT '{}',
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_clinic_assets_clinic_id ON public.clinic_assets(clinic_id);
CREATE INDEX idx_clinic_assets_file_type ON public.clinic_assets(clinic_id, file_type);

-- Enable RLS
ALTER TABLE public.clinic_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clinic_assets
CREATE POLICY "Clinic members can view their assets"
ON public.clinic_assets
FOR SELECT
TO authenticated
USING (clinic_id IN (
  SELECT dp.clinic_id FROM public.doctor_profiles dp WHERE dp.user_id = auth.uid()
));

CREATE POLICY "Clinic members can insert assets"
ON public.clinic_assets
FOR INSERT
TO authenticated
WITH CHECK (clinic_id IN (
  SELECT dp.clinic_id FROM public.doctor_profiles dp WHERE dp.user_id = auth.uid()
));

CREATE POLICY "Clinic members can update their assets"
ON public.clinic_assets
FOR UPDATE
TO authenticated
USING (clinic_id IN (
  SELECT dp.clinic_id FROM public.doctor_profiles dp WHERE dp.user_id = auth.uid()
));

CREATE POLICY "Clinic members can delete their assets"
ON public.clinic_assets
FOR DELETE
TO authenticated
USING (clinic_id IN (
  SELECT dp.clinic_id FROM public.doctor_profiles dp WHERE dp.user_id = auth.uid()
));

-- 3. Add columns to clinic_locations
ALTER TABLE public.clinic_locations
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS google_business_url text;

-- 4. Add owner columns to clinic_profiles
ALTER TABLE public.clinic_profiles
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS owner_mobile text,
  ADD COLUMN IF NOT EXISTS owner_email text;

-- 5. Add physician_id to quiz_leads
ALTER TABLE public.quiz_leads
  ADD COLUMN IF NOT EXISTS physician_id uuid REFERENCES public.clinic_physicians(id);

-- Create index for physician lookups on leads
CREATE INDEX IF NOT EXISTS idx_quiz_leads_physician_id ON public.quiz_leads(physician_id);

-- 6. Create updated_at trigger for new tables
CREATE TRIGGER update_clinic_physicians_updated_at
  BEFORE UPDATE ON public.clinic_physicians
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinic_assets_updated_at
  BEFORE UPDATE ON public.clinic_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create storage bucket for clinic assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-assets', 'clinic-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for clinic-assets bucket
CREATE POLICY "Authenticated users can upload clinic assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'clinic-assets');

CREATE POLICY "Public can view clinic assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'clinic-assets');

CREATE POLICY "Authenticated users can update their clinic assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'clinic-assets');

CREATE POLICY "Authenticated users can delete their clinic assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'clinic-assets');