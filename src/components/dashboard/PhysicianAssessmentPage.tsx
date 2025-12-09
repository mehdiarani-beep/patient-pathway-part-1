import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, Link, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { quizzes } from '@/data/quizzes';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

// Only these quizzes are currently active
const ACTIVE_QUIZ_IDS = ['NOSE_SNOT', 'EPWORTH', 'MIDAS'];

interface PhysicianAssessmentPageProps {
  physicianId: string;
}

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  degree_type: string | null;
  headshot_url: string | null;
  bio: string | null;
  credentials: string[] | null;
}

export function PhysicianAssessmentPage({ physicianId }: PhysicianAssessmentPageProps) {
  const navigate = useNavigate();
  const [physician, setPhysician] = useState<Physician | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    fetchPhysician();
  }, [physicianId]);

  const fetchPhysician = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinic_physicians')
        .select('id, first_name, last_name, degree_type, headshot_url, bio, credentials, slug')
        .eq('id', physicianId)
        .single();

      if (!error && data) {
        setPhysician(data);
        // Generate profile URL using slug if available, otherwise use physicianId
        const slug = (data as any).slug || physicianId;
        setProfileUrl(`${window.location.origin}/${slug}`);
      }
    } catch (error) {
      console.error('Error fetching physician:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success('Profile link copied!');
  };

  const openShareDialog = () => {
    setShowQRDialog(true);
  };

  const handleShareQuiz = (quizId: string) => {
    // Navigate to share page with physician context
    navigate(`/portal/share/${quizId.toLowerCase()}?physician=${physicianId}`);
  };

  const getQuizDisplayName = (quizId: string) => {
    return quizId === 'MIDAS' ? 'MSQ' : quizId;
  };

  const predefinedQuizzes = Object.values(quizzes).filter(quiz => quiz && quiz.id);
  const categorizedQuizzes = {
    Nasal: ['NOSE', 'TNSS', 'SNOT12', 'NOSE_SNOT'],
    Sleep: ['EPWORTH', 'STOP'],
    'Headache/Migraine': ['MIDAS']
  };
  const categorizedPredefined = Object.entries(categorizedQuizzes).map(([category, ids]) => ({
    category,
    quizzes: predefinedQuizzes.filter(q => ids.includes(q.id))
  }));

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!physician) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Physician not found
      </div>
    );
  }

  const physicianName = `Dr. ${physician.first_name} ${physician.last_name}`;
  const physicianDegree = physician.degree_type || 'MD';

  return (
    <div className="p-6 space-y-6">
      {/* Physician Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <Avatar className="h-16 w-16">
          <AvatarImage src={physician.headshot_url || ''} alt={physicianName} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg">
            {physician.first_name[0]}{physician.last_name[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {physicianName}, {physicianDegree}
          </h1>
          {physician.credentials && physician.credentials.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {physician.credentials.join(', ')}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Share assessments for this physician
          </p>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={copyProfileLink}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy profile link</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={openShareDialog}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share profile with QR code</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Quiz Categories */}
      <div className="space-y-10">
        {categorizedPredefined.map(({ category, quizzes }) => (
          <div key={category}>
            <h2 className="text-xl font-semibold text-foreground mb-4 text-center">{category} Related</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => {
                const isActive = ACTIVE_QUIZ_IDS.includes(quiz.id);
                return (
                  <Card 
                    key={quiz.id} 
                    className={`transition-shadow h-full flex flex-col ${isActive ? 'hover:shadow-md' : 'opacity-50'}`}
                  >
                    <CardHeader className="flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        {isActive ? (
                          <Badge variant="secondary">{getQuizDisplayName(quiz.id)}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Coming Soon</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                      <p className="text-sm text-muted-foreground flex-1">{quiz.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{quiz.questions?.length || 0} Questions</span>
                        <span>•</span>
                        <span>Max Score: {quiz.maxScore || 0}</span>
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <Button 
                          size="sm" 
                          onClick={() => handleShareQuiz(quiz.id)} 
                          className="flex-1"
                          disabled={!isActive}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Physician Profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG 
                value={profileUrl} 
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Scan this QR code to visit {physician?.first_name}'s profile
            </p>
            <div className="flex items-center gap-2 w-full">
              <input 
                type="text" 
                value={profileUrl} 
                readOnly 
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
              />
              <Button size="sm" onClick={copyProfileLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
