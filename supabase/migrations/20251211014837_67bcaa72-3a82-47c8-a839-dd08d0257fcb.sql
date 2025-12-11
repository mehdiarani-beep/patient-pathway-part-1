-- Add full_shot_url column to clinic_physicians table for full body/standing images
ALTER TABLE public.clinic_physicians 
ADD COLUMN IF NOT EXISTS full_shot_url text;