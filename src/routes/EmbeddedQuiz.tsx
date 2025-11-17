import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { EmbeddedChatBot } from '@/components/quiz/EmbeddedChatBot';
import { quizzes } from '@/data/quizzes';
import { supabase } from '@/integrations/supabase/client';

import { QuizQuestion as BaseQuizQuestion } from '@/types/quiz';

// Add these type definitions at the top of the file
type QuizType = 'nose' | 'snot22' | 'tnss' | 'dhi' | 'epworth' | 'stop' | 'hhia' | string;

interface QuizData {
  id: string;
  title: string;
  description: string;
  questions: BaseQuizQuestion[];
  maxScore: number;
  scoring?: Object | {
    mild_threshold: number;
    moderate_threshold: number;
    severe_threshold: number;
  };
  isCustom: boolean;
  source: string;
  medium: string;
  campaign: string;
  doctorId?: string;
}

export function EmbeddedQuiz() {
  const { quizType } = useParams<{ quizType: QuizType }>();
  const [searchParams] = useSearchParams();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get source tracking parameters
  const source = searchParams.get('source') || searchParams.get('utm_source') || 'direct';
  const medium = searchParams.get('medium') || searchParams.get('utm_medium') || 'web';
  const campaign = searchParams.get('campaign') || searchParams.get('utm_campaign') || 'quiz_share';
  const doctorId = searchParams.get('doctor') || undefined;

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!quizType) {
        setError('No quiz type provided');
        setLoading(false);
        return;
      }

      try {
        console.group('📋 Quiz Data Fetch');
        console.log('Quiz type:', quizType);
        console.log('Tracking:', { source, medium, campaign, doctorId });

        // Check if it's a custom quiz
        if (quizType.startsWith('custom_')) {
          const customQuizId = quizType.replace('custom_', '');
          const { data, error: dbError } = await supabase
            .from('custom_quizzes')
            .select('*')
            .eq('id', customQuizId)
            .single();

          if (dbError) throw new Error('Custom quiz not found');
          if (!data) throw new Error('No quiz data returned');

          setQuizData({
            ...data,
            isCustom: true,
            source,
            medium,
            campaign,
            doctorId
          });
        } else {
          // Look for standard quiz
          const standardQuiz = quizzes[quizType as keyof typeof quizzes];
          if (!standardQuiz) throw new Error(`Quiz type '${quizType}' not found`);

          setQuizData({
            ...standardQuiz,
            isCustom: false,
            source,
            medium,
            campaign,
            doctorId
          });
        }

        console.log('✅ Quiz data loaded successfully');
        console.groupEnd();
      } catch (error: any) {
        console.error('❌ Error loading quiz:', error.message);
        setError(error.message);
        console.groupEnd();
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizType, source, medium, campaign, doctorId]);

  if (loading) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h2>
            <p className="text-gray-600">{error || 'Unable to load the requested assessment.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-teal-50">
      <EmbeddedChatBot 
        quizType={quizType}
        quizData={quizData}
        doctorId={doctorId}
        utm_source=""
      />
    </div>
  );
}
