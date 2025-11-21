import { EnhancedChatBot } from "@/components/quiz/EnhancedChatBot";
import { useParams, useSearchParams } from "react-router-dom";
import { QuizType } from "@/types/quiz";
import { quizzes } from "@/data/quizzes";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Embed = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const [customQuiz, setCustomQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const doctorId = searchParams.get('doctor');

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!quizId) {
        setError('No quiz ID provided');
        setLoading(false);
        return;
      }

      try {
        // Check if it's a custom quiz
        if (quizId.startsWith('custom_')) {
          const customQuizId = quizId.replace('custom_', '');
          const { data, error: dbError } = await supabase
            .from('custom_quizzes')
            .select('*')
            .eq('id', customQuizId)
            .single();

          if (dbError) throw new Error('Custom quiz not found');
          if (!data) throw new Error('No quiz data returned');

          setCustomQuiz(data);
        } else {
          // Check if it's a standard quiz
          const quizType = quizId.toUpperCase() as QuizType;
          if (!quizzes[quizType]) {
            throw new Error(`Quiz type '${quizId}' not found`);
          }
        }
      } catch (error: any) {
        console.error('Error loading quiz:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !quizId) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h2>
            <p className="text-gray-600">{error || 'Unable to load the requested assessment.'}</p>
          </div>
        </div>
      </div>
    );
  }
  const quizType = quizId.toUpperCase() as QuizType;
  // Get quiz data for display
  const getQuizData = () => {
    if (customQuiz) {
      return {
        title: customQuiz.title || 'Custom Assessment',
        description: customQuiz.description || 'Complete this assessment to evaluate your symptoms.'
      };
    } else {
      const quiz = quizzes[quizType];
      return {
        title: quiz?.title || 'Assessment',
        description: quiz?.description || 'Complete this assessment to evaluate your symptoms.'
      };
    }
  };
  const getQuizDescription = (s: string) => {
    if (s === 'NOSE') {
      return 'Quick Nasal Obstruction Evaluation';
    } else if (quizType === 'SNOT12') {
      return 'Quick Sinus Evaluation';
    } else if (quizType === 'TNSS') {
      return 'Assessment of nasal congestion and rhinitis symptoms';
    } else if (quizType === 'MIDAS') {
      return 'Measure how migraines impact your quality of life';
    }
  }
  const quizData = getQuizData();

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header Section */}
      <div className="bg-blue-300 border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{quizData.title}</h1>
          <p className="text-gray-600">{getQuizDescription(quizType)}</p>
        </div>
      </div>
      
      {/* Chat Bot Section */}
      <div className="flex-1">
        <EnhancedChatBot 
          quizType={quizType} 
          customQuiz={customQuiz}
          doctorId={doctorId}
        />
      </div>
    </div>
  );
};

export default Embed;