-- Add brand kit columns to clinic_profiles
ALTER TABLE public.clinic_profiles 
ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#F7904F',
ADD COLUMN IF NOT EXISTS background_color text DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS heading_font text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS body_font text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS tagline text,
ADD COLUMN IF NOT EXISTS logo_icon_url text;