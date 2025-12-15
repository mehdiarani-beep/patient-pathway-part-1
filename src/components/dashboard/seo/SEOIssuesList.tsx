import { AlertTriangle, XCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SEOAnalysisResult } from '@/types/seo';

interface SEOIssuesListProps {
  result: SEOAnalysisResult;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  fix?: string;
}

function getIssuesFromResult(result: SEOAnalysisResult): Issue[] {
  const issues: Issue[] = [];
  const tech = result.technical;

  // Title issues
  if (!tech.metaTags.title.value) {
    issues.push({
      id: 'title-missing',
      title: 'Missing Title Tag',
      description: 'Your page is missing a title tag, which is critical for SEO and user experience.',
      severity: 'critical',
      category: 'Meta Tags',
      fix: 'Add a unique, descriptive title tag between 30-60 characters.',
    });
  } else if (tech.metaTags.title.length < 30) {
    issues.push({
      id: 'title-short',
      title: 'Title Too Short',
      description: `Your title is only ${tech.metaTags.title.length} characters. It should be at least 30 characters.`,
      severity: 'warning',
      category: 'Meta Tags',
      fix: 'Expand your title to include more relevant keywords.',
    });
  } else if (tech.metaTags.title.length > 60) {
    issues.push({
      id: 'title-long',
      title: 'Title Too Long',
      description: `Your title is ${tech.metaTags.title.length} characters. It may be truncated in search results.`,
      severity: 'warning',
      category: 'Meta Tags',
      fix: 'Shorten your title to under 60 characters.',
    });
  }

  // Description issues
  if (!tech.metaTags.description.value) {
    issues.push({
      id: 'desc-missing',
      title: 'Missing Meta Description',
      description: 'Your page is missing a meta description, reducing click-through rates from search results.',
      severity: 'critical',
      category: 'Meta Tags',
      fix: 'Add a compelling meta description between 120-160 characters.',
    });
  } else if (tech.metaTags.description.length < 120) {
    issues.push({
      id: 'desc-short',
      title: 'Meta Description Too Short',
      description: `Your description is only ${tech.metaTags.description.length} characters. Aim for at least 120 characters.`,
      severity: 'warning',
      category: 'Meta Tags',
    });
  } else if (tech.metaTags.description.length > 160) {
    issues.push({
      id: 'desc-long',
      title: 'Meta Description Too Long',
      description: `Your description is ${tech.metaTags.description.length} characters and may be truncated.`,
      severity: 'warning',
      category: 'Meta Tags',
    });
  }

  // H1 issues
  if (tech.headings.h1Count === 0) {
    issues.push({
      id: 'h1-missing',
      title: 'Missing H1 Tag',
      description: 'Your page is missing an H1 heading, which is important for SEO and accessibility.',
      severity: 'critical',
      category: 'Headings',
      fix: 'Add a single H1 tag that describes the main topic of your page.',
    });
  } else if (tech.headings.h1Count > 1) {
    issues.push({
      id: 'h1-multiple',
      title: 'Multiple H1 Tags',
      description: `Your page has ${tech.headings.h1Count} H1 tags. Best practice is to have exactly one.`,
      severity: 'warning',
      category: 'Headings',
      fix: 'Consolidate to a single H1 tag and use H2-H6 for subheadings.',
    });
  }

  // Image issues
  if (tech.images.withoutAlt > 0) {
    issues.push({
      id: 'images-alt',
      title: 'Images Missing Alt Text',
      description: `${tech.images.withoutAlt} of ${tech.images.total} images are missing alt text, hurting accessibility and SEO.`,
      severity: tech.images.withoutAlt > 2 ? 'critical' : 'warning',
      category: 'Images',
      fix: 'Add descriptive alt text to all images.',
    });
  }

  // Security issues
  if (!tech.security.https) {
    issues.push({
      id: 'https-missing',
      title: 'Not Using HTTPS',
      description: 'Your site is not using HTTPS, which is a ranking factor and security concern.',
      severity: 'critical',
      category: 'Security',
      fix: 'Install an SSL certificate and redirect HTTP to HTTPS.',
    });
  }

  // Structured data
  if (!tech.structuredData.detected) {
    issues.push({
      id: 'schema-missing',
      title: 'No Structured Data Found',
      description: 'Adding Schema.org markup can enhance your search appearance with rich snippets.',
      severity: 'warning',
      category: 'Structured Data',
      fix: 'Add relevant Schema.org markup (LocalBusiness, MedicalClinic, etc.).',
    });
  }

  // Canonical
  if (!tech.metaTags.canonical.exists) {
    issues.push({
      id: 'canonical-missing',
      title: 'Missing Canonical URL',
      description: 'Without a canonical URL, search engines may index duplicate content.',
      severity: 'warning',
      category: 'Technical',
      fix: 'Add a canonical link element pointing to the preferred URL.',
    });
  }

  // Sitemap
  if (!tech.sitemap.exists) {
    issues.push({
      id: 'sitemap-missing',
      title: 'Sitemap Not Found',
      description: 'A sitemap helps search engines discover and index your pages.',
      severity: 'warning',
      category: 'Technical',
      fix: 'Create and submit an XML sitemap to search engines.',
    });
  }

  // Open Graph
  const ogCount = Object.values(tech.openGraph).filter(Boolean).length;
  if (ogCount < 4) {
    issues.push({
      id: 'og-incomplete',
      title: 'Incomplete Open Graph Tags',
      description: 'Missing Open Graph tags may result in poor social media previews.',
      severity: 'info',
      category: 'Social',
      fix: 'Add og:title, og:description, og:image, and og:url tags.',
    });
  }

  // Content issues
  if (result.keywords.wordCount < 300) {
    issues.push({
      id: 'content-thin',
      title: 'Thin Content',
      description: `Your page has only ${result.keywords.wordCount} words. Consider adding more valuable content.`,
      severity: 'warning',
      category: 'Content',
      fix: 'Aim for at least 300-500 words of unique, valuable content.',
    });
  }

  return issues.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

function IssueCard({ issue }: { issue: Issue }) {
  const severityConfig = {
    critical: {
      icon: XCircle,
      bg: 'bg-red-50 border-red-200',
      iconColor: 'text-red-500',
      badgeVariant: 'destructive' as const,
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-500',
      badgeVariant: 'secondary' as const,
    },
    info: {
      icon: CheckCircle2,
      bg: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-500',
      badgeVariant: 'outline' as const,
    },
  };

  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div className={cn('p-4 rounded-lg border', config.bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-medium text-sm">{issue.title}</h4>
            <Badge variant={config.badgeVariant} className="text-xs">{issue.category}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{issue.description}</p>
          {issue.fix && (
            <div className="mt-2 flex items-center gap-1 text-xs text-primary">
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium">Fix:</span> {issue.fix}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SEOIssuesList({ result }: SEOIssuesListProps) {
  const issues = getIssuesFromResult(result);
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  if (issues.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">All Checks Passed!</h3>
          <p className="text-muted-foreground">No critical issues or warnings found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Issues & Recommendations</CardTitle>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive">{criticalCount} Critical</Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary">{warningCount} Warnings</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {issues.map(issue => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </CardContent>
    </Card>
  );
}