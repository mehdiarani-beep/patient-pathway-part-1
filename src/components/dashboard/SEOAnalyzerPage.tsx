import { useState, useEffect } from 'react';
import { Search, Globe, Loader2, RefreshCw, Save, History, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEOScoreGauge } from './seo/SEOScoreGauge';
import { TechnicalSEOCard } from './seo/TechnicalSEOCard';
import { ContentAnalysisCard } from './seo/ContentAnalysisCard';
import { AIRecommendationsCard } from './seo/AIRecommendationsCard';
import { CoreWebVitalsCard } from './seo/CoreWebVitalsCard';
import { LocalSEOCard } from './seo/LocalSEOCard';
import { CompetitorComparison } from './seo/CompetitorComparison';
import type { SEOAnalysisResult, AIRecommendation, SpeedMetrics, LocalSEOData } from '@/types/seo';
export function SEOAnalyzerPage() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SEOAnalysisResult | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicWebsite, setClinicWebsite] = useState<string>('');
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [speedMetrics, setSpeedMetrics] = useState<SpeedMetrics | null>(null);
  const [localSeoData, setLocalSeoData] = useState<LocalSEOData | null>(null);
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([]);
  const [clinicData, setClinicData] = useState<any>(null);
  const [isLoadingSpeed, setIsLoadingSpeed] = useState(false);
  const [isLoadingLocalSeo, setIsLoadingLocalSeo] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClinicData();
      fetchRecentAnalyses();
    }
  }, [user]);

  const fetchClinicData = async () => {
    if (!user) return;
    
    // First get the clinic_id from doctor_profiles
    const { data: profile } = await supabase
      .from('doctor_profiles')
      .select('clinic_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profile?.clinic_id) {
      setClinicId(profile.clinic_id);
      
      // Fetch clinic profile to get website and competitor URLs
      const { data: clinic } = await supabase
        .from('clinic_profiles')
        .select('website, clinic_name, address, city, state, phone, seo_competitor_urls')
        .eq('id', profile.clinic_id)
        .maybeSingle();
      
      if (clinic) {
        setClinicData(clinic);
        if (clinic.website) {
          setClinicWebsite(clinic.website);
          // Auto-populate the URL field if empty
          if (!url) {
            setUrl(clinic.website);
          }
        }
        
        // Parse competitor URLs
        if (clinic.seo_competitor_urls) {
          const urls = clinic.seo_competitor_urls
            .split(/[,\n]/)
            .map((u: string) => u.trim())
            .filter((u: string) => u.length > 0);
          setCompetitorUrls(urls);
        }
      }
    }
  };

  const fetchRecentAnalyses = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('seo_analyses')
      .select('id, url, overall_score, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) {
      setRecentAnalyses(data);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAnalyze = async () => {
    let targetUrl = url.trim();
    
    // Add https:// if no protocol specified
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
      setUrl(targetUrl);
    }

    if (!isValidUrl(targetUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setAiRecommendations([]);

    try {
      // Call the SEO analyzer edge function
      const { data, error: fnError } = await supabase.functions.invoke('seo-analyzer', {
        body: { url: targetUrl }
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setAnalysisResult(data);
      toast.success('SEO analysis complete!');

      // Generate AI recommendations
      generateAIRecommendations(data);
      
      // Fetch speed metrics
      fetchSpeedMetrics(targetUrl);
      
      // Fetch local SEO data if clinic data available
      if (clinicData) {
        fetchLocalSeoData();
      }

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze URL');
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const fetchSpeedMetrics = async (targetUrl: string) => {
    setIsLoadingSpeed(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('pagespeed-analyzer', {
        body: { url: targetUrl }
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setSpeedMetrics(data.data);
      if (data.simulated) {
        console.log('Using simulated PageSpeed data (no API key configured)');
      }
    } catch (err: any) {
      console.error('PageSpeed error:', err);
    } finally {
      setIsLoadingSpeed(false);
    }
  };
  
  const fetchLocalSeoData = async () => {
    if (!clinicData) return;
    
    setIsLoadingLocalSeo(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('local-seo-analyzer', {
        body: {
          clinicName: clinicData.clinic_name,
          address: clinicData.address,
          city: clinicData.city,
          state: clinicData.state,
          phone: clinicData.phone,
          website: clinicData.website,
        }
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setLocalSeoData(data);
    } catch (err: any) {
      console.error('Local SEO error:', err);
    } finally {
      setIsLoadingLocalSeo(false);
    }
  };

  const generateAIRecommendations = async (result: SEOAnalysisResult) => {
    setIsGeneratingAI(true);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('seo-ai-recommendations', {
        body: { analysisResult: result }
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setAiRecommendations(data.recommendations || []);
      
    } catch (err: any) {
      console.error('AI recommendations error:', err);
      // Don't show error toast - AI recommendations are supplementary
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisResult || !clinicId) {
      toast.error('Cannot save analysis');
      return;
    }

    try {
      const { error } = await supabase.from('seo_analyses').insert({
        clinic_id: clinicId,
        url: analysisResult.url,
        overall_score: analysisResult.overallScore,
        technical_score: analysisResult.technicalScore,
        speed_score: analysisResult.speedScore || 0,
        content_score: analysisResult.contentScore,
        local_seo_score: analysisResult.localSeoScore || 0,
        analysis_data: analysisResult as any,
        ai_recommendations: aiRecommendations as any,
      });

      if (error) throw error;

      toast.success('Analysis saved successfully!');
      fetchRecentAnalyses();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error('Failed to save analysis');
    }
  };

  const loadRecentAnalysis = async (analysisId: string) => {
    try {
      const { data, error } = await supabase
        .from('seo_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) throw error;

      if (data) {
        setUrl(data.url);
        setAnalysisResult(data.analysis_data as unknown as SEOAnalysisResult);
        setAiRecommendations((data.ai_recommendations as unknown as AIRecommendation[]) || []);
        toast.success('Loaded previous analysis');
      }
    } catch (err) {
      console.error('Load error:', err);
      toast.error('Failed to load analysis');
    }
  };

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            SEO Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <Input
                type="url"
                placeholder="Enter website URL (e.g., https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                className="flex-1"
              />
              {clinicWebsite && url !== clinicWebsite && (
                <Button
                  variant="outline"
                  onClick={() => setUrl(clinicWebsite)}
                  className="whitespace-nowrap"
                >
                  Use My Website
                </Button>
              )}
            </div>
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !url.trim()}
              className="min-w-[140px]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Recent Analyses */}
          {recentAnalyses.length > 0 && !analysisResult && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <History className="h-4 w-4" />
                Recent Analyses
              </p>
              <div className="flex flex-wrap gap-2">
                {recentAnalyses.map((analysis) => (
                  <Button
                    key={analysis.id}
                    variant="outline"
                    size="sm"
                    onClick={() => loadRecentAnalysis(analysis.id)}
                    className="text-xs"
                  >
                    <span className="truncate max-w-[150px]">
                      {new URL(analysis.url).hostname}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      ({analysis.overall_score})
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {analysisResult && (
        <>
          {/* Score Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Analysis Results</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleAnalyze}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Re-analyze
                </Button>
                <Button size="sm" onClick={handleSaveAnalysis}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-center gap-8 py-4">
                <SEOScoreGauge score={analysisResult.overallScore} label="Overall" size="lg" />
                <SEOScoreGauge score={analysisResult.technicalScore} label="Technical" size="md" />
                <SEOScoreGauge score={analysisResult.contentScore} label="Content" size="md" />
                <SEOScoreGauge score={analysisResult.speedScore || 0} label="Speed" size="md" />
              </div>
              <div className="text-center mt-2">
                <p className="text-sm text-muted-foreground">
                  Analyzed: {new URL(analysisResult.url).hostname}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(analysisResult.analyzedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="recommendations" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="recommendations">AI</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="speed">Speed</TabsTrigger>
              <TabsTrigger value="local">Local SEO</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="mt-4">
              <AIRecommendationsCard 
                recommendations={aiRecommendations} 
                loading={isGeneratingAI}
              />
            </TabsContent>

            <TabsContent value="technical" className="mt-4">
              <TechnicalSEOCard data={analysisResult.technical} />
            </TabsContent>

            <TabsContent value="content" className="mt-4">
              <ContentAnalysisCard data={analysisResult.keywords} />
            </TabsContent>

            <TabsContent value="speed" className="mt-4">
              <CoreWebVitalsCard data={speedMetrics} loading={isLoadingSpeed} />
            </TabsContent>

            <TabsContent value="local" className="mt-4">
              <LocalSEOCard data={localSeoData} loading={isLoadingLocalSeo} />
            </TabsContent>

            <TabsContent value="competitors" className="mt-4">
              <CompetitorComparison yourUrl={url} competitorUrls={competitorUrls} />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Analyzing website...</p>
                <p className="text-sm text-muted-foreground">
                  This may take a few seconds
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
