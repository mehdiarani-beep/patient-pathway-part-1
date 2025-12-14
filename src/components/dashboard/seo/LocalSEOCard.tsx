import { MapPin, Phone, Building, Star, Check, X, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { LocalSEOData } from '@/types/seo';

interface LocalSEOCardProps {
  data: LocalSEOData | null;
  loading?: boolean;
}

export function LocalSEOCard({ data, loading }: LocalSEOCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Local SEO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Analyzing local presence...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Local SEO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Local SEO analysis requires clinic information. Please ensure your clinic profile is complete.
          </p>
        </CardContent>
      </Card>
    );
  }

  const gbp = data.googleBusinessProfile;
  const foundCount = data.directories.filter(d => d.found).length;
  const consistentCount = data.directories.filter(d => d.napConsistent).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Local SEO
          </span>
          <Badge variant={data.overallScore >= 70 ? 'default' : 'destructive'}>
            Score: {data.overallScore}/100
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google Business Profile */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Building className="h-4 w-4" />
            Google Business Profile
          </h4>
          {gbp.found ? (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{gbp.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm">{gbp.rating?.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({gbp.reviewCount} reviews)
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Check className="h-3 w-3 mr-1" /> Verified
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{gbp.address || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{gbp.phone || 'Not set'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {gbp.categories.map((cat, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>📷 {gbp.photos} photos</span>
                <span>{gbp.hours ? '🕐 Hours set' : '⚠️ No hours'}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 border border-dashed rounded-lg text-center">
              <X className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium text-destructive">Not Found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your business doesn't appear to have a Google Business Profile.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <a href="https://business.google.com" target="_blank" rel="noopener noreferrer">
                  Create GBP <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Directory Listings */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Directory Listings ({foundCount}/{data.directories.length} found)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {data.directories.map((dir, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  dir.found
                    ? dir.napConsistent
                      ? 'bg-green-50 border-green-200'
                      : 'bg-yellow-50 border-yellow-200'
                    : 'bg-muted/50 border-dashed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dir.name}</span>
                  {dir.found ? (
                    dir.napConsistent ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <span className="text-xs text-yellow-600">NAP Issue</span>
                    )
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NAP Consistency */}
        {data.napConsistency.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              NAP Consistency ({consistentCount}/{foundCount} consistent)
            </h4>
            <div className="text-sm space-y-2">
              {data.napConsistency.slice(0, 5).map((nap, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${
                    nap.consistent ? 'bg-green-50' : 'bg-yellow-50'
                  }`}
                >
                  <span>{nap.source}</span>
                  <Badge variant={nap.consistent ? 'outline' : 'destructive'} className="text-xs">
                    {nap.consistent ? 'Consistent' : 'Mismatch'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">Quick Recommendations:</p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
            {!gbp.found && <li>Create a Google Business Profile to improve local visibility</li>}
            {foundCount < 4 && <li>Submit your business to more healthcare directories</li>}
            {consistentCount < foundCount && <li>Fix NAP inconsistencies across listings</li>}
            {gbp.found && gbp.photos < 10 && <li>Add more photos to your Google Business Profile</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
