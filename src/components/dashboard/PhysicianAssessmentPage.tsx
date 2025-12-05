import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { quizzes } from '@/data/quizzes';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

  useEffect(() => {
    fetchPhysician();
  }, [physicianId]);

  const fetchPhysician = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinic_physicians')
        .select('id, first_name, last_name, degree_type, headshot_url, bio, credentials')
        .eq('id', physicianId)
        .single();

      if (!error && data) {
        setPhysician(data);
      }
    } catch (error) {
      console.error('Error fetching physician:', error);
    } finally {
      setLoading(false);
    }
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
      </div>

      {/* Quiz Categories */}
      <div className="space-y-10">
        {categorizedPredefined.map(({ category, quizzes }) => (
          <div key={category}>
            <h2 className="text-xl font-semibold text-foreground mb-4 text-center">{category} Related</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <Badge variant="secondary">{getQuizDisplayName(quiz.id)}</Badge>
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
                      <Button size="sm" onClick={() => handleShareQuiz(quiz.id)} className="flex-1">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
