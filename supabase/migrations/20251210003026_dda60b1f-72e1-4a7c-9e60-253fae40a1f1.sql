-- Fix Niki's doctor_profile: set correct clinic_id
UPDATE public.doctor_profiles 
SET clinic_id = '0a801d88-14b4-4688-92c2-6e648d8d85a0'
WHERE user_id = '18565365-f4dd-40a3-a04d-5ccbf1e2c64d';

-- Add RLS policy for clinic members to view leads from their clinic's doctors
CREATE POLICY "Clinic members can view clinic leads"
ON public.quiz_leads FOR SELECT
USING (
  doctor_id IN (
    SELECT dp.id FROM doctor_profiles dp
    WHERE dp.clinic_id IN (
      SELECT dp2.clinic_id FROM doctor_profiles dp2 
      WHERE dp2.user_id = auth.uid() AND dp2.clinic_id IS NOT NULL
    )
  )
);

-- Add RLS policy for clinic members to update leads from their clinic's doctors
CREATE POLICY "Clinic members can update clinic leads"
ON public.quiz_leads FOR UPDATE
USING (
  doctor_id IN (
    SELECT dp.id FROM doctor_profiles dp
    WHERE dp.clinic_id IN (
      SELECT dp2.clinic_id FROM doctor_profiles dp2 
      WHERE dp2.user_id = auth.uid() AND dp2.clinic_id IS NOT NULL
    )
  )
);