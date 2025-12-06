import { Helmet } from 'react-helmet';

export interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'medical.health';
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
  structuredData?: object | object[];
}

export const SEOHead = ({
  title,
  description,
  canonicalUrl,
  keywords,
  ogImage = 'https://patientpathway.ai/og-default.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noindex = false,
  structuredData,
}: SEOHeadProps) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://patientpathway.ai';
  const fullCanonicalUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');
  
  // Ensure description is within limits (155-160 chars optimal)
  const trimmedDescription = description.length > 160 
    ? description.substring(0, 157) + '...' 
    : description;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={trimmedDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Canonical URL */}
      {fullCanonicalUrl && <link rel="canonical" href={fullCanonicalUrl} />}
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={trimmedDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Patient Pathway" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={trimmedDescription} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO tags */}
      <meta name="author" content="Patient Pathway" />
      <meta name="publisher" content="Patient Pathway" />
      <meta httpEquiv="content-language" content="en" />
      
      {/* Mobile optimization */}
      <meta name="format-detection" content="telephone=yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(structuredData) ? structuredData : [structuredData])}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
