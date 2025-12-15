import { useState, useEffect } from 'react';
import { Globe, Loader2, RefreshCw, Save, Settings, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { SEODashboardOverview } from './seo/SEODashboardOverview';
import { SEOIssuesList } from './seo/SEOIssuesList';
import { TechnicalSEOCard } from './seo/TechnicalSEOCard';
import { ContentAnalysisCard } from './seo/ContentAnalysisCard';
import { AIRecommendationsCard } from './seo/AIRecommendationsCard';
import { CoreWebVitalsCard } from './seo/CoreWebVitalsCard';
import { LocalSEOCard } from './seo/LocalSEOCard';
import { CompetitorComparison } from './seo/CompetitorComparison';
import type { SEOAnalysisResult, AIRecommendation, SpeedMetrics, LocalSEOData } from '@/types/seo';

export function SEOAnalyzerPage() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SEOAnalysisResult | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicWebsite, setClinicWebsite] = useState<string>('');
  const [previousScore, setPreviousScore] = useState<number | undefined>();
  const [speedMetrics, setSpeedMetrics] = useState<SpeedMetrics | null>(null);
  const [localSeoData, setLocalSeoData] = useState<LocalSEOData | null>(null);
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([]);
  const [clinicData, setClinicData] = useState<any>(null);
  const [isLoadingSpeed, setIsLoadingSpeed] = useState(false);
  const [isLoadingLocalSeo, setIsLoadingLocalSeo] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (user && !hasLoaded) {
      fetchClinicData();
    }
  }, [user, hasLoaded]);

  const fetchClinicData = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('doctor_profiles')
      .select('clinic_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profile?.clinic_id) {
      setClinicId(profile.clinic_id);
      
      const { data: clinic } = await supabase
        .from('clinic_profiles')
        .select('website, clinic_name, address, city, state, phone, seo_competitor_urls')
        .eq('id', profile.clinic_id)
        .maybeSingle();
      
      if (clinic) {
        setClinicData(clinic);
        if (clinic.website) {
          setClinicWebsite(clinic.website);
        }
        
        if (clinic.seo_competitor_urls) {
          const urls = clinic.seo_competitor_urls
            .split(/[,\n]/)
            .map((u: string) => u.trim())
            .filter((u: string) => u.length > 0);
          setCompetitorUrls(urls);
        }
      }
      
      // Fetch previous analysis for trend comparison
      const { data: prevAnalysis } = await supabase
        .from('seo_analyses')
        .select('overall_score')
        .eq('clinic_id', profile.clinic_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (prevAnalysis) {
        setPreviousScore(prevAnalysis.overall_score);
      }
      
      // Auto-analyze if website is configured
      if (clinic?.website) {
        setHasLoaded(true);
        handleAnalyze(clinic.website, clinic);
      } else {
        setHasLoaded(true);
      }
    } else {
      setHasLoaded(true);
    }
  };

  const handleAnalyze = async (targetUrl?: string, clinicInfo?: any) => {
    const url = targetUrl || clinicWebsite;
    const clinic = clinicInfo || clinicData;
    
    if (!url) {
      setError('No website configured');
      return;
    }
    
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('seo-analyzer', {
        body: { url: normalizedUrl }
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setAnalysisResult(data);
      toast.success('SEO analysis complete!');

      generateAIRecommendations(data);
      fetchSpeedMetrics(normalizedUrl);
      
      if (clinic) {
        fetchLocalSeoData(clinic);
      }

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze website');
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
    } catch (err: any) {
      console.error('PageSpeed error:', err);
    } finally {
      setIsLoadingSpeed(false);
    }
  };
  
  const fetchLocalSeoData = async (clinic: any) => {
    if (!clinic) return;
    
    setIsLoadingLocalSeo(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('local-seo-analyzer', {
        body: {
          clinicName: clinic.clinic_name,
          address: clinic.address,
          city: clinic.city,
          state: clinic.state,
          phone: clinic.phone,
          website: clinic.website,
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

      toast.success('Analysis saved!');
      setPreviousScore(analysisResult.overallScore);
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error('Failed to save analysis');
    }
  };

  // No website configured state
  if (hasLoaded && !clinicWebsite) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <Globe className="h-16 w-16 text-muted-foreground/50" />
              <div>
                <h2 className="text-xl font-semibold mb-2">No Website Configured</h2>
                <p className="text-muted-foreground max-w-md">
                  Add your clinic's website URL in Configuration → Business Info to enable SEO analysis.
                </p>
              </div>
              <Button asChild className="mt-4">
                <Link to="/portal/configuration">
                  <Settings className="mr-2 h-4 w-4" />
                  Go to Configuration
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (!hasLoaded || (isAnalyzing && !analysisResult)) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Analyzing your website...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {clinicWebsite && new URL(clinicWebsite.startsWith('http') ? clinicWebsite : `https://${clinicWebsite}`).hostname}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SEO Analysis</h1>
          <p className="text-sm text-muted-foreground">
            {clinicWebsite && (
              <>Analyzing <span className="font-medium">{new URL(clinicWebsite.startsWith('http') ? clinicWebsite : `https://${clinicWebsite}`).hostname}</span></>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleAnalyze()} disabled={isAnalyzing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            Re-analyze
          </Button>
          {analysisResult && (
            <Button onClick={handleSaveAnalysis}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {analysisResult && (
        <>
          {/* Overview Dashboard */}
          <SEODashboardOverview result={analysisResult} previousScore={previousScore} />

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="issues" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="speed">Speed</TabsTrigger>
              <TabsTrigger value="local">Local SEO</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
              <TabsTrigger value="ai">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="mt-4">
              <SEOIssuesList result={analysisResult} />
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
              <CompetitorComparison yourUrl={clinicWebsite} competitorUrls={competitorUrls} />
            </TabsContent>

            <TabsContent value="ai" className="mt-4">
              <AIRecommendationsCard 
                recommendations={aiRecommendations} 
                loading={isGeneratingAI}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}