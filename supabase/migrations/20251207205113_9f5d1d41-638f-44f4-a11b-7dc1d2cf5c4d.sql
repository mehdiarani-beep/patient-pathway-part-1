-- Add missing is_manager column to doctor_profiles table
ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS is_manager BOOLEAN DEFAULT false;