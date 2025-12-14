import { FileText, BookOpen, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { KeywordAnalysis } from '@/types/seo';
import { cn } from '@/lib/utils';

interface ContentAnalysisCardProps {
  data: KeywordAnalysis;
}

export function ContentAnalysisCard({ data }: ContentAnalysisCardProps) {
  const getReadabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWordCountStatus = (count: number) => {
    if (count >= 1500) return { label: 'Excellent', color: 'bg-green-100 text-green-700' };
    if (count >= 800) return { label: 'Good', color: 'bg-lime-100 text-lime-700' };
    if (count >= 300) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Too Short', color: 'bg-red-100 text-red-700' };
  };

  const wordStatus = getWordCountStatus(data.wordCount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Content Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Word Count & Readability */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Word Count</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{data.wordCount.toLocaleString()}</span>
              <Badge className={cn('text-xs', wordStatus.color)}>
                {wordStatus.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Recommended: 800-2000 words for SEO
            </p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Readability</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn('text-3xl font-bold', getReadabilityColor(data.readabilityScore))}>
                {data.readabilityScore}
              </span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.readabilityLevel} to read
            </p>
          </div>
        </div>

        {/* Top Keywords */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Top Keywords
            </h4>
          </div>
          
          {data.topKeywords.length > 0 ? (
            <div className="space-y-3">
              {data.topKeywords.slice(0, 8).map((keyword, index) => (
                <div key={keyword.word} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{keyword.word}</span>
                    <span className="text-muted-foreground">
                      {keyword.count}x ({keyword.density}%)
                    </span>
                  </div>
                  <Progress 
                    value={Math.min((keyword.density / 3) * 100, 100)} 
                    className="h-1.5"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No significant keywords detected</p>
          )}
        </div>

        {/* Keyword Density Tips */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            <span className="font-medium">💡 Tip:</span> Aim for 1-3% keyword density for your target keywords. 
            Ensure your primary keyword appears in the title, H1, and first paragraph.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
