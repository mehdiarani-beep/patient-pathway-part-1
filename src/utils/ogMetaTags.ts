/**
 * Utility functions for managing Open Graph meta tags for social sharing
 */

export interface OGMetaTags {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  siteName?: string;
}

/**
 * Updates the page's Open Graph meta tags for better social sharing
 */
export function updateOGMetaTags(tags: OGMetaTags) {
  // Update or create Open Graph meta tags
  const ogTags = [
    { property: 'og:title', content: tags.title },
    { property: 'og:description', content: tags.description },
    { property: 'og:image', content: tags.image },
    { property: 'og:url', content: tags.url },
    { property: 'og:type', content: tags.type || 'website' },
    { property: 'og:site_name', content: tags.siteName || 'Patient Pathway' },
  ];

  // Update Twitter Card meta tags
  const twitterTags = [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: tags.title },
    { name: 'twitter:description', content: tags.description },
    { name: 'twitter:image', content: tags.image },
  ];

  // Update all meta tags
  [...ogTags, ...twitterTags].forEach((tag) => {
    const property = 'property' in tag ? tag.property : undefined;
    const name = 'name' in tag ? tag.name : undefined;
    const content = tag.content;
    
    const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
    let metaTag = document.querySelector(selector) as HTMLMetaElement;
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      if (property) {
        metaTag.setAttribute('property', property);
      } else if (name) {
        metaTag.setAttribute('name', name);
      }
      document.head.appendChild(metaTag);
    }
    
    metaTag.setAttribute('content', content);
  });

  // Update page title
  document.title = tags.title;
}

/**
 * Generates quiz-specific Open Graph meta tags
 */
export function generateQuizOGTags(
  quizType: string,
  quizTitle: string,
  quizDescription: string,
  currentUrl: string,
  doctorName?: string,
  clinicName?: string
): OGMetaTags {
  const title = doctorName && clinicName 
    ? `${quizTitle} - ${doctorName} at ${clinicName}`
    : quizTitle;
    
  const description = doctorName && clinicName
    ? `Take the ${quizTitle} assessment with ${doctorName} at ${clinicName}. ${quizDescription}`
    : `Take the ${quizTitle} assessment. ${quizDescription}`;

  return {
    title,
    description,
    image: `${window.location.origin}/patient-pathway-logo.jpeg`,
    url: currentUrl,
    type: 'website',
    siteName: 'Patient Pathway'
  };
}

/**
 * Clears Facebook's cache for a specific URL
 * This should be called when sharing URLs to ensure fresh content
 */
export function clearFacebookCache(url: string) {
  // Facebook Sharing Debugger URL for clearing cache
  const debuggerUrl = `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`;
  
  // Open in new tab (optional - for manual cache clearing)
  // window.open(debuggerUrl, '_blank');
  
  console.log('To clear Facebook cache, visit:', debuggerUrl);
  return debuggerUrl;
}
