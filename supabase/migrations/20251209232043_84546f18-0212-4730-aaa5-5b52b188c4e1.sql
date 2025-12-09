-- Add slug column to clinic_physicians
ALTER TABLE public.clinic_physicians 
ADD COLUMN IF NOT EXISTS slug text UNIQUE;