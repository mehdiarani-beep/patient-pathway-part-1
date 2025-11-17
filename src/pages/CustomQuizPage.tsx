
import { useParams, useSearchParams } from 'react-router-dom';
import EmbeddedChatBot from '@/components/quiz/EmbeddedChatBot';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function CustomQuizPage() {
  const { customQuizId } = useParams<{ customQuizId: string }>();
  const [searchParams] = useSearchParams();
  const shareKey = searchParams.get('key') || undefined;
  const doctorId = searchParams.get('doctor') || undefined;

  const [quizData, setQuizData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!customQuizId) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('custom_quizzes')
          .select('*')
          .eq('id', customQuizId)
          .single();
        if (error || !data) {
          setNotFound(true);
        } else {
          setQuizData({
            id: data.id,
            title: data.title,
            description: data.description,
            questions: data.questions,
            maxScore: data.max_score,
            scoring: data.scoring,
            isCustom: true
          });
        }
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [customQuizId]);

  if (!customQuizId) {
    return (
      <div className="flex items-center justify-center h-screen text-lg">
        Invalid custom quiz ID
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (notFound || !quizData) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">The requested assessment could not be found.</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.href = '/'} className="bg-orange-500 hover:bg-orange-600">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
              <Button variant="outline" onClick={() => window.history.back()} className="border-teal-500 text-teal-600 hover:bg-teal-50">
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
    <EmbeddedChatBot 
      quizType={`custom_${customQuizId}`}
      shareKey={shareKey}
      doctorId={doctorId}
      quizData={quizData}
      utm_source=""
    />
  );
}
