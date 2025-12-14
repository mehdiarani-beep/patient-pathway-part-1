-- Add seo_competitor_urls column to clinic_profiles for storing up to 10 competitor website URLs
ALTER TABLE clinic_profiles 
ADD COLUMN IF NOT EXISTS seo_competitor_urls TEXT DEFAULT NULL;