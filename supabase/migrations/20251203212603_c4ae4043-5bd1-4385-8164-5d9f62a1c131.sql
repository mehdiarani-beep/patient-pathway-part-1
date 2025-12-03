-- Add missing columns to link_mappings table
ALTER TABLE public.link_mappings
ADD COLUMN IF NOT EXISTS quiz_type text,
ADD COLUMN IF NOT EXISTS custom_quiz_id uuid,
ADD COLUMN IF NOT EXISTS lead_source text DEFAULT 'website',
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS click_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz;

-- Enable RLS on link_mappings
ALTER TABLE public.link_mappings ENABLE ROW LEVEL SECURITY;

-- Allow doctors to create their own short links
CREATE POLICY "Doctors can create short links"
ON public.link_mappings FOR INSERT
WITH CHECK (doctor_id IN (
  SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()
));

-- Allow public read access for redirects
CREATE POLICY "Anyone can read link mappings for redirects"
ON public.link_mappings FOR SELECT
USING (true);

-- Allow public updates for click tracking
CREATE POLICY "Allow click count updates"
ON public.link_mappings FOR UPDATE
USING (true);

-- Create function to increment click count atomically
CREATE OR REPLACE FUNCTION public.increment_link_click(p_short_id text)
RETURNS void AS $$
BEGIN
  UPDATE public.link_mappings
  SET click_count = COALESCE(click_count, 0) + 1,
      last_clicked_at = now()
  WHERE short_id = p_short_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;