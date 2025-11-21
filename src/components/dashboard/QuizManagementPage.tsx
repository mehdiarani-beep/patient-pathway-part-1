import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, Edit, Copy, Bot, Wand2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { quizzes } from '@/data/quizzes';
import { CustomQuizCreator } from './CustomQuizCreator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GuidedSymptomChecker } from './SymptomChecker';

export function QuizManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('existing');
  const [selectedBaseQuiz, setSelectedBaseQuiz] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [customQuizzes, setCustomQuizzes] = useState<any[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDoctorProfileAndQuizzes();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchDoctorProfileAndQuizzes = async () => {
    try {
      setLoadingCustom(true);
      // Fetch doctor profile
      const { data: doctorProfiles } = await supabase
        .from('doctor_profiles')
        .select('id')
        .eq('user_id', user?.id);
        
      if (doctorProfiles && doctorProfiles.length > 0) {
        const doctorProfile = doctorProfiles[0];
        setDoctorId(doctorProfile.id);
        
        // Fetch custom quizzes for this doctor
        const { data: quizzesData, error } = await supabase
          .from('custom_quizzes')
          .select('*')
          .eq('doctor_id', doctorProfile.id)
          .order('created_at', { ascending: false });
          
        if (!error && quizzesData) {
          setCustomQuizzes(quizzesData);
        }
      }
    } catch (error) {
      console.error('Error fetching custom quizzes:', error);
    } finally {
      setLoadingCustom(false);
    }
  };

  const handleShareQuiz = (quizId: string, isCustom = false) => {
    if (isCustom) {
      navigate(`/portal/share/custom/${quizId}`);
    } else {
      navigate(`/portal/share/${quizId.toLowerCase()}`);
    }
  };

  const getQuizDisplayName = (quizId: string) => {
    return quizId === 'MIDAS' ? 'MSQ' : quizId;
  };

  const predefinedQuizzes = Object.values(quizzes).filter(quiz => quiz && quiz.id);
  const categorizedQuizzes = {
    Nasal: ['NOSE', 'TNSS','SNOT12', 'NOSE_SNOT'],
    Sleep: ['EPWORTH', 'STOP'],
    'Headache/Migraine': ['MIDAS']
  };
  const categorizedPredefined = Object.entries(categorizedQuizzes).map(([category, ids]) => ({
    category,
    quizzes: predefinedQuizzes.filter(q => ids.includes(q.id))
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
          <p className="text-gray-600 mt-2">Create, edit, and share your medical assessments</p>
        </div>
      </div>
          <div className="space-y-10">
            {categorizedPredefined.map(({ category, quizzes }) => (
              <div key={category}>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">{category} Related</h2>
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
                        <p className="text-sm text-gray-600 flex-1">{quiz.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{quiz.questions?.length || 0} Questions</span>
                          <span>•</span>
                          <span>Max Score: {quiz.maxScore || 0}</span>
                        </div>
                        <div className="flex gap-2 mt-auto">
                          <Button size="sm" onClick={() => handleShareQuiz(quiz.id, false)} className="flex-1">
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