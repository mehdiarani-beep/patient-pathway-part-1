-- Add short_bio column to clinic_physicians table
ALTER TABLE public.clinic_physicians 
ADD COLUMN IF NOT EXISTS short_bio text;