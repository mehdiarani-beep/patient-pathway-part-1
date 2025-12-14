import { useState } from 'react';
import { Users, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CompetitorScore {
  url: string;
  overallScore: number;
  technicalScore: number;
  speedScore: number;
  contentScore: number;
}

interface CompetitiveGap {
  area: string;
  yourScore: number;
  competitorAvg: number;
  gap: number;
  recommendation: string;
}

interface CompetitorComparisonProps {
  yourUrl: string;
  competitorUrls: string[];
}

export function CompetitorComparison({ yourUrl, competitorUrls }: CompetitorComparisonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scores, setScores] = useState<CompetitorScore[]>([]);
  const [gaps, setGaps] = useState<CompetitiveGap[]>([]);
  const [opportunities, setOpportunities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!yourUrl) {
      toast.error('Please analyze your website first');
      return;
    }

    if (competitorUrls.length === 0) {
      toast.error('No competitor URLs configured. Add them in Configuration → Business Info.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('seo-competitor-analyzer', {
        body: { yourUrl, competitorUrls }
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setScores(data.scores || []);
      setGaps(data.gaps || []);
      setOpportunities(data.opportunities || []);
      toast.success('Competitor analysis complete!');
    } catch (err: any) {
      console.error('Competitor analysis error:', err);
      setError(err.message || 'Failed to analyze competitors');
      toast.error('Competitor analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--chart-2))';
    if (score >= 60) return 'hsl(var(--chart-4))';
    return 'hsl(var(--destructive))';
  };

  const chartData = scores.map((s) => ({
    name: new URL(s.url).hostname.replace('www.', ''),
    score: s.overallScore,
    isYours: s.url === yourUrl,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Competitor Comparison
          </span>
          <Button onClick={handleAnalyze} disabled={isAnalyzing} size="sm">
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Compare'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {competitorUrls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No competitor URLs configured.</p>
            <p className="text-sm mt-1">
              Add competitor URLs in Configuration → Business Info → SEO Competitor Tracking
            </p>
          </div>
        ) : scores.length === 0 && !isAnalyzing ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Click "Compare" to analyze your competitors.</p>
            <p className="text-sm mt-1">
              {competitorUrls.length} competitor URL{competitorUrls.length !== 1 ? 's' : ''} configured
            </p>
          </div>
        ) : null}

        {/* Score Chart */}
        {scores.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Overall SEO Scores
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value}/100`, 'Score']}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isYours ? 'hsl(var(--primary))' : getScoreColor(entry.score)}
                        stroke={entry.isYours ? 'hsl(var(--primary))' : undefined}
                        strokeWidth={entry.isYours ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary" /> Your site
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: 'hsl(var(--chart-2))' }} /> Good (80+)
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: 'hsl(var(--chart-4))' }} /> Fair (60-79)
              </span>
            </div>
          </div>
        )}

        {/* Gaps */}
        {gaps.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Competitive Gaps
            </h4>
            {gaps.map((gap, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{gap.area}</span>
                  <div className="flex items-center gap-2">
                    {gap.gap > 0 ? (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    ) : gap.gap < 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Badge variant={gap.gap > 0 ? 'destructive' : 'outline'}>
                      {gap.gap > 0 ? `-${gap.gap}` : gap.gap < 0 ? `+${Math.abs(gap.gap)}` : '0'} pts
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <span>You: {gap.yourScore}</span>
                  <span>Avg: {gap.competitorAvg}</span>
                </div>
                <p className="text-sm">{gap.recommendation}</p>
              </div>
            ))}
          </div>
        )}

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Opportunities
            </h4>
            {opportunities.map((opp, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg text-sm">
                💡 {opp}
              </div>
            ))}
          </div>
        )}

        {/* Score Table */}
        {scores.length > 1 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Detailed Breakdown
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Website</th>
                    <th className="text-center py-2 px-2">Overall</th>
                    <th className="text-center py-2 px-2">Technical</th>
                    <th className="text-center py-2 px-2">Content</th>
                    <th className="text-center py-2 px-2">Speed</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((s, index) => (
                    <tr 
                      key={index} 
                      className={`border-b ${s.url === yourUrl ? 'bg-primary/5' : ''}`}
                    >
                      <td className="py-2 pr-4 truncate max-w-[150px]">
                        {new URL(s.url).hostname.replace('www.', '')}
                        {s.url === yourUrl && (
                          <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                        )}
                      </td>
                      <td className="text-center py-2 px-2 font-medium">{s.overallScore}</td>
                      <td className="text-center py-2 px-2">{s.technicalScore}</td>
                      <td className="text-center py-2 px-2">{s.contentScore}</td>
                      <td className="text-center py-2 px-2">{s.speedScore || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
