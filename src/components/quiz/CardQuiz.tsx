import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { quizzes } from '@/data/quizzes';
import { QuizType } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { calculateQuizScore } from '@/utils/quizScoring';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChevronRight, Loader2, Mail, Phone, User } from 'lucide-react';
import Profileimage from '/src/assets/doctor.png';
interface QuizAnswer {
  questionIndex: number;
  answerIndex: number;
  answer: string;
}

interface DoctorProfile {
  id: string;
  clinic_name: string;
  doctor_name: string;
  logo_url?: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
}

export function CardQuiz() {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [quizStarted, setQuizStarted] = useState(true);
  
  // Lead capture form
  const [leadData, setLeadData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const doctorId = searchParams.get('doctor');
  const quizType = quizId?.toUpperCase() as QuizType;
  const quiz = quizType ? quizzes[quizType] : null;

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
      setLoading(false);
    };

    fetchDoctorProfile();
  }, [doctorId]);

  // Prevent quiz from restarting randomly by adding guards
  useEffect(() => {
    // Only reset quiz state if we're going back to welcome screen
    if (showWelcome && quizStarted) {
      setQuizStarted(false);
    }
  }, [showWelcome, quizStarted]);


  const handleAnswer = (answerIndex: number, answer: string) => {
    // Guard against calling when quiz is not active
    if (!quizStarted || quizCompleted || leadSubmitted) {
      return;
    }
    
    setSelectedOption(answerIndex);
    
    // Delay to show the selection before moving to next question
    setTimeout(() => {
      const newAnswer: QuizAnswer = {
        questionIndex: currentQuestion,
        answerIndex,
        answer
      };

      setAnswers(prev => [...prev, newAnswer]);

      // Move to next question or complete quiz
      if (currentQuestion < (quiz?.questions.length || 0) - 1) {
        setDirection(1);
        setTimeout(() => {
          setCurrentQuestion(prev => prev + 1);
          setSelectedOption(null);
        }, 150);
      } else {
        // Calculate quiz result
        const allAnswers = [...answers, newAnswer];
        const result = calculateQuizScore(quizType, allAnswers);
        setQuizResult(result);
        setQuizCompleted(true);
        setShowResults(true);
      }
    }, 200);
  };

  const startQuiz = () => {
    setShowWelcome(false);
    setQuizStarted(true);
    // Reset any previous quiz state
    setCurrentQuestion(0);
    setAnswers([]);
    setQuizCompleted(false);
    setShowResults(false);
    setLeadSubmitted(false);
    setSelectedOption(null);
  };

  const proceedToLeadCapture = () => {
    setShowResults(false);
    setShowLeadCapture(true);
  };

  const handleLeadSubmit = async () => {
    if (!leadData.name || !leadData.email || !leadData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Prevent multiple submissions
    if (submittingLead || leadSubmitted) {
      return;
    }

    setSubmittingLead(true);
    try {
      // Submit lead data using the edge function (same as other components)
      const leadDataToSubmit = {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        quiz_type: quizType,
        score: quizResult.score,
        answers: answers,
        lead_source: searchParams.get('utm_source') || 'card_page',
        lead_status: 'NEW',
        doctor_id: doctorId,
        share_key: null,
        submitted_at: new Date().toISOString()
      };

      console.log('Submitting lead via edge function:', leadDataToSubmit);

      // Use the Supabase edge function to submit the lead
      const { data, error } = await supabase.functions.invoke('submit-lead', {
        body: leadDataToSubmit,
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      console.log('Lead saved successfully via edge function:', data);
      
      // Reset form and show success state
      setLeadData({ name: '', email: '', phone: '' });
      setShowLeadCapture(false);
      setLeadSubmitted(true);
      
      // Show success message
      toast.success('Thank you! Your results have been sent to your doctor.');
      
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error('Failed to submit information. Please try again.');
    } finally {
      setSubmittingLead(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center p-3 sm:p-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-16 h-16 mx-auto mb-4">
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.div 
              className="absolute inset-0 rounded-full border-t-4 border-blue-600 dark:border-blue-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading assessment...</p>
        </motion.div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center p-3 sm:p-4">
        <motion.div
          className="text-center p-8 bg-white dark:bg-gray-900 rounded-xl shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quiz Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">The requested quiz could not be found.</p>
        </motion.div>
      </div>
    );
  }

  const progress = ((currentQuestion + (quizCompleted ? 1 : 0)) / quiz.questions.length) * 100;
  const getQuizDescription = (s: string) => {
    if (s === 'NOSE') {
      return 'Quick Nasal Obstruction Evaluation';
    } else if (s === 'SNOT12') {
      return 'Quick Sinus Evaluation';
    } else if (s === 'TNSS') {
      return 'Assessment of nasal congestion and rhinitis symptoms';
    }
  }
  const getQuizTitle = (s: string) => {
    if (s === 'NOSE'){
      return 'NOSE Score';
    } else if (s === 'SNOT12') {
      return 'SNOT-12';
    } else if (s === 'TNSS') {
      return 'TNSS';
    }
  }
  const giveMessage = (s: string) => {
    if (s === 'NOSE') {
      return 'Start your Nasal Obstruction Symptom Evaluation (NOSE) to get your 0–100 nasal obstruction score. ';
    } else if (s === 'SNOT12') {
      return 'Start your SNOT-12 assessment to get your 0–60 sinus severity score.';
    } else if (s === 'TNSS') {
      return 'Start your TNSS assessment to get your 0–12 rhinitis severity score.';
    }
  }
  return (
    <div className="min-h-full w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
      <motion.div
        className="w-full max-w-5xl space-y-4 sm:space-y-6 lg:space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        
        {/* Quiz Card */}
        <Card className="w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/20 dark:ring-gray-700/20">
          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12 w-full">
            <AnimatePresence mode="wait">
              {showWelcome ? (
                <motion.div 
                  key="welcome"
                  className="text-center space-y-6 sm:space-y-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-3 sm:space-y-4 px-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                      {giveMessage(quizId.toUpperCase())}
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                      {getQuizDescription(quizId.toUpperCase())}
                    </p>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-2"
                  >
                    <Button
                      onClick={startQuiz}
                      className="w-full py-3 sm:py-4 md:py-6 text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white border-0 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Start Test
                    </Button>
                  </motion.div>
                </motion.div>
              ) : quizStarted && !quizCompleted && !leadSubmitted ? (
                <motion.div 
                  key="question"
                  className="space-y-6 sm:space-y-8"
                  initial={{ opacity: 0, x: direction * 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Quiz Title */}
                  <div className="text-center px-2">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">{getQuizTitle(quizType)}</h2>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">{getQuizDescription(quizType)}</p>
                  </div>

                  {/* Question */}
                  <div className="text-center space-y-6 sm:space-y-8">
                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100 leading-relaxed max-w-4xl mx-auto px-2">
                      Question {currentQuestion + 1}: {quiz.questions[currentQuestion]?.text}
                    </h3>
                    
                    {/* Options */}
                    <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto px-2">
                      {quiz.questions[currentQuestion]?.options.map((option, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <Button
                            onClick={() => handleAnswer(index, option)}
                            className={`w-full py-3 sm:py-4 md:py-6 px-4 sm:px-6 md:px-8 text-xs sm:text-sm md:text-base lg:text-lg font-medium rounded-2xl transition-all duration-300 flex items-center justify-between min-h-[48px] sm:min-h-[56px] ${
                              selectedOption === index 
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg shadow-blue-200 dark:shadow-blue-900/30' 
                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-300 hover:shadow-md'
                            }`}
                            disabled={selectedOption !== null}
                          >
                            <span className="text-left flex-1 pr-2">{option}</span>
                            {selectedOption === index && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="flex-shrink-0"
                              >
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                              </motion.div>
                            )}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : showResults ? (
                <motion.div 
                  key="results"
                  className="space-y-4 sm:space-y-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Short Results Display */}
                  <div className="text-center px-2">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">{quizId.toUpperCase()} Assessment Complete!</h2>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      Score: {quizResult?.score}/{quiz?.maxScore || 100}
                    </div>
                    <div className={`text-xs sm:text-sm font-medium px-3 py-1 rounded-full inline-block ${
                      quizResult?.severity === 'severe' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                      quizResult?.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      quizResult?.severity === 'mild' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {quizResult?.severity?.charAt(0).toUpperCase() + quizResult?.severity?.slice(1)} Symptoms
                    </div>
                  </div>
                  
                  {/* Information Form - Show in same area */}
                  {!leadSubmitted ? (
                    <div className="space-y-3 sm:space-y-4 px-2">
                      <div className="text-center">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">Please provide your information</h3>
                      </div>
                      
                      <div className="space-y-3 sm:space-y-4">
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
                            <User size={16} />
                          </div>
                          <Input
                            type="text"
                            placeholder="Full Name *"
                            value={leadData.name}
                            onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full py-2 sm:py-3 pl-10 pr-4 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-200"
                          />
                        </div>
                        
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
                            <Mail size={16} />
                          </div>
                          <Input
                            type="email"
                            placeholder="Email Address *"
                            value={leadData.email}
                            onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full py-2 sm:py-3 pl-10 pr-4 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-200"
                          />
                        </div>
                        
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
                            <Phone size={16} />
                          </div>
                          <Input
                            type="tel"
                            placeholder="Phone Number *"
                            value={leadData.phone}
                            onChange={(e) => setLeadData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full py-2 sm:py-3 pl-10 pr-4 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-all duration-200"
                          />
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleLeadSubmit}
                        disabled={submittingLead || !leadData.name || !leadData.email || !leadData.phone}
                        className="w-full py-3 sm:py-4 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white border-0 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                      >
                        {submittingLead ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Information'
                        )}
                      </Button>
                    </div>
                  ) : (
                    /* Thank You Message - Show after submission */
                    <div className="text-center space-y-3 sm:space-y-4 px-2">
                      <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Thank You!</h3>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300">
                        Your Result has been successfully submitted to Dr. {doctorProfile?.first_name} {doctorProfile?.last_name} 
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Progress Bar - Only show during quiz */}
        {quizStarted && !quizCompleted && !leadSubmitted && (
          <motion.div 
            className="w-full space-y-2 px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="relative h-2 sm:h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              <motion.div 
                className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["0%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </p>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}

export default function QuizPage() {
  return <CardQuiz />;
}
