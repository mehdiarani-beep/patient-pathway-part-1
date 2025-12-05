-- Add public read access for landing pages to clinic_profiles
CREATE POLICY "Public can view clinic profiles for landing pages" 
ON public.clinic_profiles 
FOR SELECT 
USING (true);

-- Add public read access for landing pages to clinic_locations
CREATE POLICY "Public can view clinic locations for landing pages" 
ON public.clinic_locations 
FOR SELECT 
USING (true);