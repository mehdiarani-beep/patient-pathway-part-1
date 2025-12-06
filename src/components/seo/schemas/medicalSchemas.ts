// Medical-specific Schema.org structured data generators

export interface PhysicianInfo {
  name: string;
  credentials?: string;
  specialty?: string;
  image?: string;
  url?: string;
}

export interface ClinicInfo {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  logo?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

// Generate MedicalWebPage schema
export const generateMedicalWebPageSchema = ({
  name,
  description,
  url,
  specialty = 'Otolaryngology',
  datePublished,
  dateModified,
  physician,
  clinic,
}: {
  name: string;
  description: string;
  url: string;
  specialty?: string;
  datePublished?: string;
  dateModified?: string;
  physician?: PhysicianInfo;
  clinic?: ClinicInfo;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'MedicalWebPage',
  name,
  description,
  url,
  specialty: {
    '@type': 'MedicalSpecialty',
    name: specialty,
  },
  ...(datePublished && { datePublished }),
  ...(dateModified && { dateModified }),
  ...(physician && {
    author: {
      '@type': 'Physician',
      name: physician.name,
      ...(physician.credentials && { jobTitle: physician.credentials }),
      ...(physician.image && { image: physician.image }),
      ...(physician.url && { url: physician.url }),
    },
  }),
  ...(clinic && {
    publisher: {
      '@type': 'MedicalClinic',
      name: clinic.name,
      ...(clinic.logo && { logo: clinic.logo }),
      ...(clinic.website && { url: clinic.website }),
    },
  }),
  isAccessibleForFree: true,
  audience: {
    '@type': 'PeopleAudience',
    healthCondition: {
      '@type': 'MedicalCondition',
      name: specialty === 'Otolaryngology' ? 'ENT Conditions' : specialty,
    },
  },
});

// Generate MedicalTest schema (for assessments/quizzes)
export const generateMedicalTestSchema = ({
  name,
  description,
  url,
  usedToDiagnose,
}: {
  name: string;
  description: string;
  url: string;
  usedToDiagnose: string[];
}) => ({
  '@context': 'https://schema.org',
  '@type': 'MedicalTest',
  name,
  description,
  url,
  usedToDiagnose: usedToDiagnose.map(condition => ({
    '@type': 'MedicalCondition',
    name: condition,
  })),
  medicineSystem: 'WesternConventional',
  relevantSpecialty: {
    '@type': 'MedicalSpecialty',
    name: 'Otolaryngology',
  },
});

// Generate Physician schema
export const generatePhysicianSchema = ({
  name,
  credentials,
  specialty,
  image,
  url,
  clinic,
}: PhysicianInfo & { clinic?: ClinicInfo }) => ({
  '@context': 'https://schema.org',
  '@type': 'Physician',
  name,
  ...(credentials && { jobTitle: credentials }),
  ...(image && { image }),
  ...(url && { url }),
  medicalSpecialty: {
    '@type': 'MedicalSpecialty',
    name: specialty || 'Otolaryngology',
  },
  ...(clinic && {
    worksFor: {
      '@type': 'MedicalClinic',
      name: clinic.name,
      ...(clinic.address && {
        address: {
          '@type': 'PostalAddress',
          streetAddress: clinic.address,
          addressLocality: clinic.city,
          addressRegion: clinic.state,
          postalCode: clinic.zipCode,
        },
      }),
      ...(clinic.phone && { telephone: clinic.phone }),
      ...(clinic.website && { url: clinic.website }),
    },
  }),
});

// Generate MedicalClinic/LocalBusiness schema
export const generateMedicalClinicSchema = ({
  name,
  address,
  city,
  state,
  zipCode,
  phone,
  website,
  logo,
  physicians,
}: ClinicInfo & { physicians?: PhysicianInfo[] }) => ({
  '@context': 'https://schema.org',
  '@type': ['MedicalClinic', 'LocalBusiness'],
  name,
  ...(logo && { logo, image: logo }),
  ...(website && { url: website }),
  ...(phone && { telephone: phone }),
  ...(address && {
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: city,
      addressRegion: state,
      postalCode: zipCode,
      addressCountry: 'US',
    },
  }),
  medicalSpecialty: {
    '@type': 'MedicalSpecialty',
    name: 'Otolaryngology',
  },
  ...(physicians && physicians.length > 0 && {
    employee: physicians.map(p => ({
      '@type': 'Physician',
      name: p.name,
      ...(p.credentials && { jobTitle: p.credentials }),
      ...(p.image && { image: p.image }),
    })),
  }),
  priceRange: '$$',
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '17:00',
  },
});

// Generate FAQPage schema
export const generateFAQSchema = (faqs: FAQItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

// Generate BreadcrumbList schema
export const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

// Generate HowTo schema (for "What to Expect" sections)
export const generateHowToSchema = ({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name,
  description,
  step: steps.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.name,
    text: step.text,
  })),
});
