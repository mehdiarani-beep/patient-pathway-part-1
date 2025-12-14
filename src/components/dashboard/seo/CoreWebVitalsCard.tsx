import { Activity, Clock, Move } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { SpeedMetrics } from '@/types/seo';

interface CoreWebVitalsCardProps {
  data: SpeedMetrics | null;
  loading?: boolean;
}

const getRatingColor = (rating: 'good' | 'needs-improvement' | 'poor') => {
  switch (rating) {
    case 'good': return 'text-green-600 bg-green-100';
    case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
    case 'poor': return 'text-red-600 bg-red-100';
  }
};

const getRatingLabel = (rating: 'good' | 'needs-improvement' | 'poor') => {
  switch (rating) {
    case 'good': return 'Good';
    case 'needs-improvement': return 'Needs Work';
    case 'poor': return 'Poor';
  }
};

export function CoreWebVitalsCard({ data, loading }: CoreWebVitalsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading speed metrics...</p>
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
            <Activity className="h-5 w-5 text-primary" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Speed analysis not yet available. Run a full analysis to see Core Web Vitals.
          </p>
        </CardContent>
      </Card>
    );
  }

  const vitals = [
    {
      name: 'LCP',
      fullName: 'Largest Contentful Paint',
      description: 'Measures loading performance',
      value: data.coreWebVitals.lcp.displayValue,
      rating: data.coreWebVitals.lcp.rating,
      target: '< 2.5s',
      icon: Clock,
    },
    {
      name: 'INP',
      fullName: 'Interaction to Next Paint',
      description: 'Measures interactivity',
      value: data.coreWebVitals.inp.displayValue,
      rating: data.coreWebVitals.inp.rating,
      target: '< 200ms',
      icon: Activity,
    },
    {
      name: 'CLS',
      fullName: 'Cumulative Layout Shift',
      description: 'Measures visual stability',
      value: data.coreWebVitals.cls.displayValue,
      rating: data.coreWebVitals.cls.rating,
      target: '< 0.1',
      icon: Move,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Core Web Vitals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{data.performance}</p>
            <p className="text-xs text-muted-foreground">Performance</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{data.accessibility}</p>
            <p className="text-xs text-muted-foreground">Accessibility</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{data.bestPractices}</p>
            <p className="text-xs text-muted-foreground">Best Practices</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{data.seo}</p>
            <p className="text-xs text-muted-foreground">SEO</p>
          </div>
        </div>

        {/* Core Web Vitals */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Core Web Vitals
          </h4>
          {vitals.map((vital) => {
            const Icon = vital.icon;
            return (
              <div key={vital.name} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{vital.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRatingColor(vital.rating)}`}>
                      {getRatingLabel(vital.rating)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{vital.fullName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{vital.value}</p>
                  <p className="text-xs text-muted-foreground">Target: {vital.target}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Opportunities */}
        {data.opportunities.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Optimization Opportunities
            </h4>
            {data.opportunities.map((opp, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">{opp.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{opp.savings}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
