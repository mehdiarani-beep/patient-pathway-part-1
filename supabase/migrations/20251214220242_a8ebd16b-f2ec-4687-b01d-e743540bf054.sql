-- SEO Audit Suite Database Schema

-- Main SEO analysis results table
CREATE TABLE public.seo_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinic_profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
  speed_score INTEGER CHECK (speed_score >= 0 AND speed_score <= 100),
  content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
  local_seo_score INTEGER CHECK (local_seo_score >= 0 AND local_seo_score <= 100),
  analysis_data JSONB NOT NULL DEFAULT '{}',
  ai_recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled monitoring configuration
CREATE TABLE public.seo_monitoring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinic_profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  email_alerts BOOLEAN DEFAULT true,
  alert_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Competitor analysis storage
CREATE TABLE public.seo_competitor_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinic_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  urls JSONB NOT NULL DEFAULT '[]',
  comparison_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_monitoring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_competitor_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seo_analyses
CREATE POLICY "Clinic members can view their SEO analyses" ON public.seo_analyses
  FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM public.doctor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Clinic members can create SEO analyses" ON public.seo_analyses
  FOR INSERT WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.doctor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Clinic members can delete their SEO analyses" ON public.seo_analyses
  FOR DELETE USING (clinic_id IN (SELECT clinic_id FROM public.doctor_profiles WHERE user_id = auth.uid()));

-- RLS Policies for seo_monitoring_schedules
CREATE POLICY "Clinic members can manage their monitoring schedules" ON public.seo_monitoring_schedules
  FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.doctor_profiles WHERE user_id = auth.uid()));

-- RLS Policies for seo_competitor_analyses
CREATE POLICY "Clinic members can manage competitor analyses" ON public.seo_competitor_analyses
  FOR ALL USING (clinic_id IN (SELECT clinic_id FROM public.doctor_profiles WHERE user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_seo_analyses_clinic_id ON public.seo_analyses(clinic_id);
CREATE INDEX idx_seo_analyses_created_at ON public.seo_analyses(created_at DESC);
CREATE INDEX idx_seo_monitoring_schedules_clinic_id ON public.seo_monitoring_schedules(clinic_id);
CREATE INDEX idx_seo_monitoring_schedules_next_run ON public.seo_monitoring_schedules(next_run_at) WHERE is_active = true;