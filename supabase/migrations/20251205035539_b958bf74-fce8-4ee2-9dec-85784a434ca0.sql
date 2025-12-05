-- Add avatar_url column to clinic_profiles
ALTER TABLE public.clinic_profiles
ADD COLUMN avatar_url text;