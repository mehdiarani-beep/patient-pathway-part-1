-- Create page_views table for traffic analytics
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctor_profiles(id),
  physician_id UUID REFERENCES public.clinic_physicians(id),
  clinic_id UUID REFERENCES public.clinic_profiles(id),
  
  -- Page identification
  page_type TEXT NOT NULL, -- 'landing_page', 'quiz_standard', 'quiz_chat', 'physician_profile'
  page_name TEXT NOT NULL, -- e.g., "Nasal Assessment - Dr. Vaughn" or "Epworth - Exhale Sinus"
  page_url TEXT,
  
  -- Visitor info
  visitor_id TEXT, -- Anonymous visitor ID
  session_id TEXT, -- Session identifier
  is_unique BOOLEAN DEFAULT true,
  
  -- Traffic source
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  traffic_source TEXT, -- 'direct', 'organic', 'social', 'email', 'referral', 'paid', 'short_link'
  
  -- Device info
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  
  -- Timing
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_page_views_doctor_id ON public.page_views(doctor_id);
CREATE INDEX idx_page_views_clinic_id ON public.page_views(clinic_id);
CREATE INDEX idx_page_views_physician_id ON public.page_views(physician_id);
CREATE INDEX idx_page_views_viewed_at ON public.page_views(viewed_at DESC);
CREATE INDEX idx_page_views_page_type ON public.page_views(page_type);
CREATE INDEX idx_page_views_visitor_id ON public.page_views(visitor_id);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for tracking from public pages)
CREATE POLICY "Allow public page view tracking"
ON public.page_views
FOR INSERT
WITH CHECK (true);

-- Doctors can view their own page views
CREATE POLICY "Doctors can view their own page views"
ON public.page_views
FOR SELECT
USING (
  doctor_id IN (
    SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()
  )
  OR clinic_id IN (
    SELECT clinic_id FROM public.doctor_profiles WHERE user_id = auth.uid()
  )
);