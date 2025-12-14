import { AlertTriangle, CheckCircle2, Info, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { AIRecommendation } from '@/types/seo';
import { cn } from '@/lib/utils';

interface AIRecommendationsCardProps {
  recommendations: AIRecommendation[];
  loading?: boolean;
}

export function AIRecommendationsCard({ recommendations, loading }: AIRecommendationsCardProps) {
  const getPriorityIcon = (priority: AIRecommendation['priority']) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: AIRecommendation['priority']) => {
    const variants: Record<string, string> = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    return (
      <Badge variant="outline" className={cn('text-xs capitalize', variants[priority])}>
        {priority}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p>Great job! No major issues detected.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by priority
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-primary" />
          AI-Powered Recommendations
          <Badge variant="secondary" className="ml-2">
            {recommendations.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {sortedRecommendations.map((rec, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  {getPriorityIcon(rec.priority)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{rec.title}</span>
                      {getPriorityBadge(rec.priority)}
                      <Badge variant="outline" className="text-xs">
                        {rec.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-7 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-1">How to Fix:</h5>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{rec.howToFix}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Expected Impact:</span>
                    <span className="text-muted-foreground">{rec.estimatedImpact}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
