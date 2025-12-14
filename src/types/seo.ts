// SEO Audit Suite TypeScript Types

export interface MetaTagAnalysis {
  title: {
    value: string | null;
    length: number;
    score: number;
    issues: string[];
  };
  description: {
    value: string | null;
    length: number;
    score: number;
    issues: string[];
  };
  canonical: {
    exists: boolean;
    value: string | null;
  };
  robots: {
    value: string | null;
    isIndexable: boolean;
  };
  viewport: {
    exists: boolean;
    value: string | null;
  };
}

export interface OpenGraphAnalysis {
  title: boolean;
  description: boolean;
  image: boolean;
  url: boolean;
  type: boolean;
  siteName: boolean;
}

export interface TwitterCardAnalysis {
  card: boolean;
  title: boolean;
  description: boolean;
  image: boolean;
}

export interface HeadingAnalysis {
  h1Count: number;
  h1Content: string[];
  h2Count: number;
  h3Count: number;
  h4Count: number;
  h5Count: number;
  h6Count: number;
  hierarchyValid: boolean;
  issues: string[];
}

export interface ImageAnalysis {
  total: number;
  withAlt: number;
  withoutAlt: number;
  largeImages: number;
  issues: string[];
}

export interface LinkAnalysis {
  internal: number;
  external: number;
  broken: string[];
  nofollow: number;
}

export interface StructuredDataAnalysis {
  detected: boolean;
  types: string[];
  errors: string[];
}

export interface SecurityAnalysis {
  https: boolean;
  mixedContent: boolean;
}

export interface RobotsTxtAnalysis {
  exists: boolean;
  allowsCrawling: boolean;
}

export interface SitemapAnalysis {
  exists: boolean;
  url: string | null;
}

export interface TechnicalSEOData {
  metaTags: MetaTagAnalysis;
  openGraph: OpenGraphAnalysis;
  twitterCard: TwitterCardAnalysis;
  headings: HeadingAnalysis;
  images: ImageAnalysis;
  links: LinkAnalysis;
  structuredData: StructuredDataAnalysis;
  security: SecurityAnalysis;
  robotsTxt: RobotsTxtAnalysis;
  sitemap: SitemapAnalysis;
}

export interface CoreWebVital {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  displayValue: string;
}

export interface SpeedOpportunity {
  id: string;
  title: string;
  description: string;
  savings: string;
}

export interface SpeedMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  coreWebVitals: {
    lcp: CoreWebVital;
    inp: CoreWebVital;
    cls: CoreWebVital;
  };
  opportunities: SpeedOpportunity[];
}

export interface KeywordAnalysis {
  wordCount: number;
  keywordDensity: Record<string, number>;
  topKeywords: { word: string; count: number; density: number }[];
  readabilityScore: number;
  readabilityLevel: string;
}

export interface GBPStatus {
  found: boolean;
  name: string | null;
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  categories: string[];
  hours: boolean;
  photos: number;
}

export interface NAPCheck {
  source: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  consistent: boolean;
  url: string | null;
}

export interface DirectoryListing {
  name: string;
  found: boolean;
  url: string | null;
  napConsistent: boolean;
}

export interface LocalSEOData {
  googleBusinessProfile: GBPStatus;
  napConsistency: NAPCheck[];
  directories: DirectoryListing[];
  overallScore: number;
}

export interface AIRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  howToFix: string;
  estimatedImpact: string;
}

export interface SEOAnalysisResult {
  url: string;
  overallScore: number;
  technicalScore: number;
  speedScore: number;
  contentScore: number;
  localSeoScore: number;
  technical: TechnicalSEOData;
  speed: SpeedMetrics | null;
  keywords: KeywordAnalysis;
  localSeo: LocalSEOData | null;
  aiRecommendations: AIRecommendation[];
  analyzedAt: string;
}

export interface CompetitorScore {
  url: string;
  overallScore: number;
  technicalScore: number;
  speedScore: number;
  contentScore: number;
}

export interface CompetitiveGap {
  area: string;
  yourScore: number;
  competitorAvg: number;
  gap: number;
  recommendation: string;
}

export interface CompetitorComparison {
  urls: string[];
  scores: CompetitorScore[];
  gaps: CompetitiveGap[];
  opportunities: string[];
}

export interface MonitoringSchedule {
  id: string;
  url: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  emailAlerts: boolean;
  alertThreshold: number;
}

export interface SEOAnalysisRecord {
  id: string;
  clinic_id: string;
  url: string;
  overall_score: number;
  technical_score: number;
  speed_score: number;
  content_score: number;
  local_seo_score: number;
  analysis_data: SEOAnalysisResult;
  ai_recommendations: AIRecommendation[];
  created_at: string;
}
