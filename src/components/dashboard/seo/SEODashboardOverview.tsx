import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SEOAnalysisResult } from '@/types/seo';

interface SEODashboardOverviewProps {
  result: SEOAnalysisResult;
  previousScore?: number;
}

function ScoreCard({ 
  label, 
  score, 
  previousScore,
  color = 'primary'
}: { 
  label: string; 
  score: number; 
  previousScore?: number;
  color?: 'primary' | 'blue' | 'green' | 'orange' | 'purple';
}) {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 border-primary/20',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
  };

  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const trend = previousScore !== undefined ? score - previousScore : undefined;

  return (
    <div className={cn(
      'relative p-4 rounded-xl bg-gradient-to-br border',
      colorClasses[color]
    )}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <span className={cn('text-3xl font-bold', scoreColor)}>{score}</span>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center text-xs font-medium pb-1',
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-muted-foreground'
          )}>
            {trend > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : 
             trend < 0 ? <TrendingDown className="h-3 w-3 mr-0.5" /> : 
             <Minus className="h-3 w-3 mr-0.5" />}
            {trend > 0 ? '+' : ''}{trend}
          </div>
        )}
      </div>
    </div>
  );
}

function IssuesSummary({ result }: { result: SEOAnalysisResult }) {
  const issues = {
    critical: 0,
    warnings: 0,
    passed: 0,
  };

  // Count issues from technical data
  if (!result.technical.metaTags.title.value) issues.critical++;
  else if (result.technical.metaTags.title.length < 30 || result.technical.metaTags.title.length > 60) issues.warnings++;
  else issues.passed++;

  if (!result.technical.metaTags.description.value) issues.critical++;
  else if (result.technical.metaTags.description.length < 120 || result.technical.metaTags.description.length > 160) issues.warnings++;
  else issues.passed++;

  if (result.technical.headings.h1Count === 0) issues.critical++;
  else if (result.technical.headings.h1Count > 1) issues.warnings++;
  else issues.passed++;

  if (result.technical.images.withoutAlt > 2) issues.critical++;
  else if (result.technical.images.withoutAlt > 0) issues.warnings++;
  else issues.passed++;

  if (!result.technical.security.https) issues.critical++;
  else issues.passed++;

  if (!result.technical.structuredData.detected) issues.warnings++;
  else issues.passed++;

  if (!result.technical.metaTags.canonical.exists) issues.warnings++;
  else issues.passed++;

  if (!result.technical.sitemap.exists) issues.warnings++;
  else issues.passed++;

  return (
    <div className="flex gap-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
        <XCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm font-medium text-red-700">{issues.critical} Critical</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium text-yellow-700">{issues.warnings} Warnings</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="text-sm font-medium text-green-700">{issues.passed} Passed</span>
      </div>
    </div>
  );
}

export function SEODashboardOverview({ result, previousScore }: SEODashboardOverviewProps) {
  const overallColor = result.overallScore >= 80 ? 'text-green-600' : result.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600';
  const overallBg = result.overallScore >= 80 ? 'from-green-500/10 to-green-500/5' : result.overallScore >= 60 ? 'from-yellow-500/10 to-yellow-500/5' : 'from-red-500/10 to-red-500/5';
  const trend = previousScore !== undefined ? result.overallScore - previousScore : undefined;

  return (
    <div className="space-y-6">
      {/* Hero Score Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Score */}
        <Card className={cn('flex-1 bg-gradient-to-br', overallBg)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Overall SEO Score</p>
                <div className="flex items-baseline gap-3">
                  <span className={cn('text-6xl font-bold', overallColor)}>{result.overallScore}</span>
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                {trend !== undefined && (
                  <div className={cn(
                    'flex items-center mt-2 text-sm font-medium',
                    trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-muted-foreground'
                  )}>
                    {trend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : 
                     trend < 0 ? <TrendingDown className="h-4 w-4 mr-1" /> : 
                     <Minus className="h-4 w-4 mr-1" />}
                    {trend > 0 ? '+' : ''}{trend} from last analysis
                  </div>
                )}
              </div>
              <div className="text-right">
                <Badge variant={result.overallScore >= 80 ? 'default' : result.overallScore >= 60 ? 'secondary' : 'destructive'}>
                  {result.overallScore >= 80 ? 'Excellent' : result.overallScore >= 60 ? 'Good' : 'Needs Work'}
                </Badge>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(result.analyzedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:flex-1">
          <ScoreCard label="Technical" score={result.technicalScore} color="blue" />
          <ScoreCard label="Content" score={result.contentScore} color="green" />
          <ScoreCard label="Speed" score={result.speedScore || 0} color="orange" />
          <ScoreCard label="Local SEO" score={result.localSeoScore || 0} color="purple" />
        </div>
      </div>

      {/* Issues Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Issues Found</p>
          <IssuesSummary result={result} />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            Analyzed: <span className="font-medium">{new URL(result.url).hostname}</span>
          </p>
        </div>
      </div>
    </div>
  );
}