import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TechnicalSEOData } from '@/types/seo';
import { cn } from '@/lib/utils';

interface TechnicalSEOCardProps {
  data: TechnicalSEOData;
}

function StatusIcon({ status }: { status: 'good' | 'warning' | 'error' }) {
  if (status === 'good') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

function StatusBadge({ status, label }: { status: 'good' | 'warning' | 'error'; label: string }) {
  const classes = {
    good: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    error: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', classes[status])}>
      {label}
    </Badge>
  );
}

export function TechnicalSEOCard({ data }: TechnicalSEOCardProps) {
  const getMetaStatus = (value: string | null, minLen: number, maxLen: number): 'good' | 'warning' | 'error' => {
    if (!value) return 'error';
    if (value.length < minLen || value.length > maxLen) return 'warning';
    return 'good';
  };

  const titleStatus = getMetaStatus(data.metaTags.title.value, 30, 60);
  const descStatus = getMetaStatus(data.metaTags.description.value, 120, 160);
  const h1Status = data.headings.h1Count === 1 ? 'good' : data.headings.h1Count === 0 ? 'error' : 'warning';
  const altStatus = data.images.withoutAlt === 0 ? 'good' : data.images.withoutAlt <= 2 ? 'warning' : 'error';
  const viewportStatus = data.metaTags.viewport?.exists ? 'good' : 'error';

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          Technical SEO Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meta Tags Section */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Meta Tags</h4>
          <div className="space-y-3">
            <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <StatusIcon status={titleStatus} />
                <div>
                  <p className="font-medium text-sm">Title Tag</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                    {data.metaTags.title.value || 'Missing'}
                  </p>
                </div>
              </div>
              <StatusBadge 
                status={titleStatus} 
                label={`${data.metaTags.title.length} chars`} 
              />
            </div>

            <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <StatusIcon status={descStatus} />
                <div>
                  <p className="font-medium text-sm">Meta Description</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                    {data.metaTags.description.value || 'Missing'}
                  </p>
                </div>
              </div>
              <StatusBadge 
                status={descStatus} 
                label={`${data.metaTags.description.length} chars`} 
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <StatusIcon status={data.metaTags.canonical.exists ? 'good' : 'warning'} />
                <p className="font-medium text-sm">Canonical URL</p>
              </div>
              <StatusBadge 
                status={data.metaTags.canonical.exists ? 'good' : 'warning'} 
                label={data.metaTags.canonical.exists ? 'Present' : 'Missing'} 
              />
            </div>
          </div>
        </div>

        {/* Headings Section */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Heading Structure</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className={cn(
              'p-3 rounded-lg text-center',
              h1Status === 'good' ? 'bg-green-50' : h1Status === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
            )}>
              <p className="text-2xl font-bold">{data.headings.h1Count}</p>
              <p className="text-xs text-muted-foreground">H1 Tags</p>
            </div>
            <div className="p-3 rounded-lg text-center bg-muted/50">
              <p className="text-2xl font-bold">{data.headings.h2Count}</p>
              <p className="text-xs text-muted-foreground">H2 Tags</p>
            </div>
            <div className="p-3 rounded-lg text-center bg-muted/50">
              <p className="text-2xl font-bold">{data.headings.h3Count}</p>
              <p className="text-xs text-muted-foreground">H3 Tags</p>
            </div>
          </div>
          {data.headings.h1Content.length > 0 && (
            <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
              <span className="font-medium">H1: </span>
              {data.headings.h1Content.join(', ')}
            </div>
          )}
        </div>

        {/* Images Section */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Images</h4>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <StatusIcon status={altStatus} />
              <div>
                <p className="font-medium text-sm">Alt Text Coverage</p>
                <p className="text-xs text-muted-foreground">
                  {data.images.withAlt} of {data.images.total} images have alt text
                </p>
              </div>
            </div>
            <StatusBadge 
              status={altStatus} 
              label={data.images.withoutAlt === 0 ? 'All set' : `${data.images.withoutAlt} missing`} 
            />
          </div>
        </div>

        {/* Links Section */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Links</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg text-center bg-muted/50">
              <p className="text-2xl font-bold text-blue-600">{data.links.internal}</p>
              <p className="text-xs text-muted-foreground">Internal</p>
            </div>
            <div className="p-3 rounded-lg text-center bg-muted/50">
              <p className="text-2xl font-bold text-purple-600">{data.links.external}</p>
              <p className="text-xs text-muted-foreground">External</p>
            </div>
            <div className="p-3 rounded-lg text-center bg-muted/50">
              <p className="text-2xl font-bold text-gray-600">{data.links.nofollow}</p>
              <p className="text-xs text-muted-foreground">Nofollow</p>
            </div>
          </div>
        </div>

        {/* Mobile & Accessibility */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Mobile Friendliness</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <StatusIcon status={data.metaTags.viewport.exists ? 'good' : 'error'} />
                <span className="text-sm">Viewport Meta Tag</span>
              </div>
              <StatusBadge 
                status={data.metaTags.viewport.exists ? 'good' : 'error'} 
                label={data.metaTags.viewport.exists ? 'Set' : 'Missing'} 
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <StatusIcon status={data.metaTags.robots.isIndexable ? 'good' : 'warning'} />
                <span className="text-sm">Indexable</span>
              </div>
              <StatusBadge 
                status={data.metaTags.robots.isIndexable ? 'good' : 'warning'} 
                label={data.metaTags.robots.isIndexable ? 'Yes' : 'No'} 
              />
            </div>
          </div>
        </div>

        {/* Structured Data & Security */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Structured Data</h4>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon status={data.structuredData.detected ? 'good' : 'warning'} />
                <span className="font-medium text-sm">
                  {data.structuredData.detected ? 'Detected' : 'Not Found'}
                </span>
              </div>
              {data.structuredData.types.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {data.structuredData.types.map((type, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Security & Crawling</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <StatusIcon status={data.security.https ? 'good' : 'error'} />
                <span className="text-sm">HTTPS</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <StatusIcon status={data.robotsTxt.exists ? 'good' : 'warning'} />
                <span className="text-sm">robots.txt</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <StatusIcon status={data.sitemap.exists ? 'good' : 'warning'} />
                <span className="text-sm">Sitemap</span>
              </div>
            </div>
          </div>
        </div>

        {/* Open Graph & Twitter */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Social Media Tags</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-medium text-sm mb-2">Open Graph</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(data.openGraph).map(([key, value]) => (
                  <Badge 
                    key={key} 
                    variant={value ? 'default' : 'outline'} 
                    className={cn('text-xs', !value && 'opacity-50')}
                  >
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-medium text-sm mb-2">Twitter Card</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(data.twitterCard).map(([key, value]) => (
                  <Badge 
                    key={key} 
                    variant={value ? 'default' : 'outline'} 
                    className={cn('text-xs', !value && 'opacity-50')}
                  >
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
