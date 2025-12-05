-- Add note_image_url column to clinic_physicians table for the "A Note from Dr." section image
ALTER TABLE public.clinic_physicians
ADD COLUMN IF NOT EXISTS note_image_url text;