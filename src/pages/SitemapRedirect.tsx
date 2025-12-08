import { useEffect } from 'react';

const SitemapRedirect = () => {
  useEffect(() => {
    // Redirect to the Supabase edge function that generates the sitemap
    window.location.href = 'https://drvitjhhggcywuepyncx.supabase.co/functions/v1/generate-sitemap?baseUrl=https://patientpathway.ai';
  }, []);

  return null;
};

export default SitemapRedirect;
