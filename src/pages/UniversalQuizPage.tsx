
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import EmbeddedChatBot from '@/components/quiz/EmbeddedChatBot';
import { quizzes } from '@/data/quizzes';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function UniversalQuizPage() {
  const { quizType } = useParams<{ quizType: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shareKey = searchParams.get('key') || undefined;
  const doctorId = searchParams.get('doctor') || undefined;
  
  // Enhanced source tracking
  const source = searchParams.get('source') || searchParams.get('utm_source') || 'direct';
  const campaign = searchParams.get('campaign') || searchParams.get('utm_campaign') || 'default';
  const medium = searchParams.get('medium') || searchParams.get('utm_medium') || 'web';
  
  const [customQuiz, setCustomQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  console.log('UniversalQuizPage - quizType:', quizType);
  console.log('UniversalQuizPage - tracking params:', { source, medium, campaign, doctorId });

  useEffect(() => {
    const checkQuiz = async () => {
      console.log('QuizType from URL:', quizType);
      console.log('Available standard quizzes:', Object.keys(quizzes));
      
      if (!quizType) {
        setError('No quiz type provided');
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // Check if it's a custom quiz
        if (quizType.startsWith('custom_')) {
          const customQuizId = quizType.replace('custom_', '');
          console.log('Fetching custom quiz with ID:', customQuizId);
          
          const { data, error } = await supabase
            .from('custom_quizzes')
            .select('*')
            .eq('id', customQuizId)
            .single();
          
          if (error || !data) {
            console.error('Custom quiz not found:', error);
            setError('Custom quiz not found');
            setNotFound(true);
          } else {
            console.log('Custom quiz found:', data);
            setCustomQuiz(data);
            setQuizData({
              id: data.id,
              title: data.title,
              description: data.description,
              questions: data.questions,
              maxScore: data.max_score,
              scoring: data.scoring,
              isCustom: true,
              source,
              campaign,
              medium,
              doctorId
            });
          }
        } else {
          // Check if it's a standard quiz (case-insensitive)
          console.log('Searching for standard quiz:', quizType);
          const standardQuiz = Object.values(quizzes).find(
            quiz => quiz.id.toLowerCase() === quizType.toLowerCase()
          );
          
          if (!standardQuiz) {
            console.error('Standard quiz not found for type:', quizType);
            setError(`Standard quiz '${quizType}' not found`);
            setNotFound(true);
          } else {
            console.log('Found standard quiz:', standardQuiz);
            setQuizData({
              ...standardQuiz,
              isCustom: false,
              source,
              campaign,
              medium,
              doctorId
            });
          }
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
        setError('Failed to load quiz');
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    checkQuiz();
  }, [quizType, source, campaign, medium, doctorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (notFound || !quizData) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h2>
            <p className="text-gray-600 mb-6">{error || `The requested assessment "${quizType}" could not be found.`}</p>
            <p className="text-sm text-gray-500 mb-4">Quiz Type: {quizType}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/')} className="bg-orange-500 hover:bg-orange-600">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)} className="border-teal-500 text-teal-600 hover:bg-teal-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gradient-to-br from-orange-50 to-teal-50">
      <EmbeddedChatBot
        quizType={quizType || ''}
        shareKey={shareKey}
        doctorId={doctorId}
        customQuiz={customQuiz}
        quizData={quizData}
        utm_source=""
      />
    </div>
  );
}