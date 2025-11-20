import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateQuizScore } from '@/utils/quizScoring';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Mail, Phone, User } from 'lucide-react';
import { quizzes } from '@/data/quizzes';

interface QuizAnswer {
  questionIndex: number;
  answerIndex: number;
  answer: string;
}

interface DoctorProfile {
  id: string;
  clinic_name: string;
  first_name?: string;
  last_name?: string;
  logo_url?: string;
  avatar_url?: string;
}

export function NOSESNOTPage() {
  const [searchParams] = useSearchParams();
  const [stage, setStage] = useState<'triage' | 'quiz' | 'results' | 'contact'>('triage');
  const [selectedTriage, setSelectedTriage] = useState<string>('');
  const [quizType, setQuizType] = useState<'NOSE' | 'SNOT12' | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  
  const [leadData, setLeadData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const doctorId = searchParams.get('doctor');
  const key = searchParams.get('key');

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (doctorId) {
        try {
          const { data, error } = await supabase
            .from('doctor_profiles')
            .select('*')
            .eq('id', doctorId)
            .single();

          if (error) throw error;
          setDoctorProfile(data);
        } catch (error) {
          console.error('Error fetching doctor profile:', error);
        }
      }
    };

    fetchDoctorProfile();
  }, [doctorId]);

  const handleTriageAnswer = (option: string) => {
    setSelectedTriage(option);
    
    // Auto-progress to quiz after brief delay
    setTimeout(() => {
      if (option === 'A') {
        setQuizType('NOSE');
      } else {
        setQuizType('SNOT12');
      }
      setStage('quiz');
    }, 300);
  };

  const handleQuizAnswer = (answerIndex: number, answer: string) => {
    setSelectedOption(answerIndex);
    
    setTimeout(() => {
      const newAnswer: QuizAnswer = {
        questionIndex: currentQuestion,
        answerIndex,
        answer
      };

      const newAnswers = [...answers, newAnswer];
      setAnswers(newAnswers);

      const quiz = quizType ? quizzes[quizType] : null;
      if (currentQuestion < (quiz?.questions.length || 0) - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedOption(null);
      } else {
        // Calculate results
        const result = calculateQuizScore(quizType!, newAnswers);
        setQuizResult(result);
        setStage('results');
      }
    }, 300);
  };

  const handleSubmitLead = async () => {
    if (!leadData.name || !leadData.email) {
      toast.error('Please provide your name and email');
      return;
    }

    if (!doctorId) {
      toast.error('Invalid quiz link');
      return;
    }

    setSubmittingLead(true);

    try {
      const leadDataToSubmit = {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone || '',
        quiz_type: 'NOSE_SNOT',
        score: quizResult.score,
        answers: answers,
        lead_status: 'NEW',
        doctor_id: doctorId,
        share_key: key || null,
        submitted_at: new Date().toISOString()
      };

      console.log('Submitting Nasal Assessment lead via edge function:', leadDataToSubmit);

      // Use the Supabase edge function to submit the lead (triggers email notifications)
      const { data, error } = await supabase.functions.invoke('submit-lead', {
        body: leadDataToSubmit
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Lead submitted successfully:', data);
      setLeadSubmitted(true);
      toast.success('Information submitted successfully!');
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error('Failed to submit information');
    } finally {
      setSubmittingLead(false);
    }
  };

  const quiz = quizType ? quizzes[quizType] : null;
  const progress = quiz ? ((currentQuestion + 1) / quiz.questions.length) * 100 : 0;

  if (stage === 'triage') {
    return (
      <div className="h-full w-full bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 py-8 px-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white shadow-xl border-0">
            <CardContent className="p-8">
              <h3 className="text-sm sm:text-lg md:text-xl font-normal text-center text-slate-800 mb-6 sm:mb-8">
                Is your breathing difficulty mainly due to nasal blockage or stuffiness, or do you also have other symptoms like facial pressure, headaches, postnasal drip, or a reduced sense of smell?
              </h3>

              <div className="space-y-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={() => handleTriageAnswer('A')}
                      className={`w-full p-4 sm:p-5 text-left rounded-xl border-2 transition-all text-slate-700 hover:border-blue-400 hover:bg-blue-50 text-sm sm:text-base ${
                        selectedTriage === 'A'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <span className="font-semibold">A.</span> Nasal blockage/stuffiness
                    </button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={() => handleTriageAnswer('B')}
                      className={`w-full p-4 sm:p-5 text-left rounded-xl border-2 transition-all text-slate-700 hover:border-blue-400 hover:bg-blue-50 text-sm sm:text-base ${
                        selectedTriage === 'B'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <span className="font-semibold">B.</span> Sinus-related symptoms like facial pressure, headaches, or a reduced sense of smell
                    </button>
                  </motion.div>
                </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center text-sm text-slate-600">
                  <span>Progress</span>
                  <span>0%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (stage === 'quiz' && quiz) {
    const currentQ = quiz.questions[currentQuestion];
    const quizName = quizType === 'NOSE' ? 'Nasal Obstruction Symptom Evaluation (NOSE)' : 'Sinonasal Outcome Test (SNOT)';
    const maxScore = quizType === 'NOSE' ? 100 : 60;
    const totalQuestions = quiz.questions.length;

    return (
      <div className="h-full w-full bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 py-8 px-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white shadow-xl border-0">
            <CardContent className="p-8">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center text-slate-800 mb-6 sm:mb-8">
                Question {currentQuestion + 1}: {quizType === 'NOSE' && currentQuestion === 0 ? 'Rate your nasal blockage or obstruction' : currentQ.text}
              </h3>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-3">
                    {currentQ.options.map((option, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={() => handleQuizAnswer(index, option)}
                          className={`w-full p-4 sm:p-5 text-left rounded-xl border-2 transition-all text-slate-700 hover:border-blue-400 hover:bg-blue-50 text-sm sm:text-base ${
                            selectedOption === index
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          {option}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center text-sm text-slate-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="text-center text-sm text-slate-600">
                  Question {currentQuestion + 1} of {totalQuestions}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (stage === 'results') {
    if (leadSubmitted) {
      return (
        <div className="min-h-full w-full bg-gradient-to-br from-background to-secondary/20 py-4 sm:py-8 md:py-12 px-3 sm:px-4">
          <div className="max-w-2xl mx-auto w-full">
            <Card className="shadow-lg">
              <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4">Thank You!</h2>
                <p className="text-muted-foreground mb-6">
                  Your results have been sent. {doctorProfile?.clinic_name || 'Our team'} will contact you soon to discuss your assessment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    const quizName = quizType === 'NOSE' ? 'NOSE' : 'SNOT-12';
    const maxScore = quizType === 'NOSE' ? 100 : 60;

    return (
      <div className="h-full w-full bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 py-8 px-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
            {/* Title */}
            <h1 className="text-[15px] font-bold text-center text-slate-900 mb-8">
              {quizName} Assessment Complete!
            </h1>

            {/* Score Display */}
            <div className="text-center mb-6">
              <div className="text-[22px] font-bold text-blue-600 mb-4">
                Score: {quizResult.score}/{maxScore}
              </div>
              <div className="inline-block px-6 py-2 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold capitalize">
                {quizResult.severity} Symptoms
              </div>
            </div>

            {/* Contact Form Section */}
            <div className="mt-12">
              <h2 className="text-[13px] font-bold text-center text-slate-900 mb-8">
                Please provide your information
              </h2>

              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="name"
                    value={leadData.name}
                    onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                    placeholder="Full Name *"
                    className="pl-12 h-14 text-base border-slate-200 rounded-xl"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={leadData.email}
                    onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                    placeholder="Email Address *"
                    className="pl-12 h-14 text-base border-slate-200 rounded-xl"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={leadData.phone}
                    onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                    placeholder="Phone Number *"
                    className="pl-12 h-14 text-base border-slate-200 rounded-xl"
                  />
                </div>

                <Button
                  onClick={handleSubmitLead}
                  disabled={submittingLead}
                  className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all"
                >
                  {submittingLead ? 'Submitting...' : 'Submit Information'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return null;
}
