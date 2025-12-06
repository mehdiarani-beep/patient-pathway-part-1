import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { quizzes } from '@/data/quizzes';
import { QuizType } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { calculateQuizScore } from '@/utils/quizScoring';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Mail, Phone, User } from 'lucide-react';
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

interface EmbeddedCardQuizProps {
  quizType: QuizType;
  doctorId?: string;
  physicianId?: string;
  utm_source?: string | null;
  compact?: boolean;
  autoStart?: boolean;
}

export function EmbeddedCardQuiz({ quizType, doctorId, physicianId, utm_source, compact = false, autoStart = false }: EmbeddedCardQuizProps) {
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(!autoStart);
  const [quizStarted, setQuizStarted] = useState(autoStart);
  
  // Lead capture form
  const [leadData, setLeadData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const quiz = quizzes[quizType];

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

  const handleAnswer = async (answerIndex: number, answer: string) => {
    // Guard against calling when quiz is not active
    if (!quizStarted || quizCompleted || leadSubmitted) {
      return;
    }
    
    setSelectedOption(answerIndex);
    
    // Capture partial submission on first answer
    if (currentQuestion === 0 && answers.length === 0) {
      try {
        await supabase.from('quiz_leads').insert({
          doctor_id: doctorId,
          physician_id: physicianId || doctorId,
          quiz_type: quizType,
          name: 'Partial Submission',
          score: 0,
          is_partial: true,
          submitted_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error capturing partial submission:', error);
      }
    }
    
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
      // Submit lead data using the edge function
      const leadDataToSubmit = {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        quiz_type: quizType,
        score: quizResult.score,
        answers: answers,
        lead_source: utm_source || 'landing_page',
        lead_status: 'NEW',
        doctor_id: doctorId,
        physician_id: physicianId || doctorId,
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
      <div className="flex items-center justify-center p-8">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-12 h-12 mx-auto mb-4">
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-blue-200"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.div 
              className="absolute inset-0 rounded-full border-t-4 border-blue-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-gray-600">Loading assessment...</p>
        </motion.div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div 
          className="text-center p-6 bg-white rounded-xl shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quiz Not Found</h2>
          <p className="text-gray-600">The requested quiz could not be found.</p>
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
      return 'Start your Nasal Obstruction Symptom Evaluation (NOSE) to get your 0–100 nasal obstruction score.';
    } else if (s === 'SNOT12') {
      return 'Start your SNOT-12 assessment to get your 0–60 sinus severity score.';
    } else if (s === 'TNSS') {
      return 'Start your TNSS assessment to get your 0–12 rhinitis severity score.';
    }
  }

  return (
    <div className="w-full">
      <motion.div 
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Quiz Card */}
        <Card className="w-full bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className={compact ? "p-3 sm:p-4" : "p-4 sm:p-6 md:p-8"}>
            <AnimatePresence mode="wait">
              {showWelcome ? (
                <motion.div 
                  key="welcome"
                  className="text-center space-y-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-2">
                    <h2 className={compact ? "text-lg font-bold text-gray-900" : "text-xl sm:text-2xl font-bold text-gray-900"}>
                      {giveMessage(quizType)}
                    </h2>
                    <p className={compact ? "text-xs text-gray-600" : "text-sm sm:text-base text-gray-600"}>
                      {getQuizDescription(quizType)}
                    </p>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={startQuiz}
                      className={`w-full font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white border-0 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                        compact ? 'py-2 text-sm' : 'py-3 sm:py-4 text-base sm:text-lg'
                      }`}
                    >
                      Start Test
                    </Button>
                  </motion.div>
                </motion.div>
              ) : quizStarted && !quizCompleted && !leadSubmitted ? (
                <motion.div 
                  key="question"
                  className="space-y-4"
                  initial={{ opacity: 0, x: direction * 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Quiz Title */}
                  <div className="text-center">
                    <h2 className={compact ? "text-base font-bold text-gray-900 mb-1" : "text-lg sm:text-xl font-bold text-gray-900 mb-2"}>
                      {getQuizTitle(quizType)}
                    </h2>
                    <p className={compact ? "text-xs text-gray-600" : "text-sm text-gray-600"}>
                      {getQuizDescription(quizType)}
                    </p>
                  </div>

                  {/* Question */}
                  <div className="text-center space-y-3">
                    <h3 className={compact ? "text-sm font-bold text-gray-800" : "text-base sm:text-lg font-bold text-gray-800"}>
                      Question {currentQuestion + 1}: {quiz.questions[currentQuestion]?.text}
                    </h3>
                    
                    {/* Options */}
                    <div className="space-y-2">
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
                            className={`w-full font-medium rounded-xl transition-all duration-300 flex items-center justify-between ${
                              compact ? 'py-2 px-3 text-xs' : 'py-3 px-4 text-sm'
                            } ${
                              selectedOption === index 
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg' 
                                : 'bg-white text-gray-800 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
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
                                <CheckCircle className="h-4 w-4" />
                              </motion.div>
                            )}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-center text-xs text-gray-500">
                      Question {currentQuestion + 1} of {quiz.questions.length}
                    </p>
                  </div>
                </motion.div>
              ) : showResults ? (
                <motion.div 
                  key="results"
                  className="space-y-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Results Display */}
                  <div className="text-center">
                    <h2 className={compact ? "text-base font-bold text-gray-900 mb-2" : "text-lg font-bold text-gray-900 mb-2"}>
                      {quizType} Assessment Complete!
                    </h2>
                    <div className={compact ? "text-xl font-bold text-blue-600 mb-2" : "text-2xl sm:text-3xl font-bold text-blue-600 mb-2"}>
                      Score: {quizResult?.score}/{quiz?.maxScore || 100}
                    </div>
                    <div className={`text-xs font-medium px-3 py-1 rounded-full inline-block ${
                      quizResult?.severity === 'severe' ? 'bg-red-100 text-red-800' :
                      quizResult?.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      quizResult?.severity === 'mild' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {quizResult?.severity?.charAt(0).toUpperCase() + quizResult?.severity?.slice(1)} Symptoms
                    </div>
                  </div>
                  
                  {/* Information Form */}
                  {!leadSubmitted ? (
                    <div className="space-y-3">
                      <div className="text-center">
                        <h3 className={compact ? "text-sm font-bold text-gray-900 mb-2" : "text-base font-bold text-gray-900 mb-2"}>
                          Please provide your information
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <User size={14} />
                          </div>
                          <Input
                            type="text"
                            placeholder="Full Name *"
                            value={leadData.name}
                            onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                            className={`w-full pl-9 pr-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
                              compact ? 'py-1.5 text-sm' : 'py-2 text-base'
                            }`}
                          />
                        </div>
                        
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Mail size={14} />
                          </div>
                          <Input
                            type="email"
                            placeholder="Email Address *"
                            value={leadData.email}
                            onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
                            className={`w-full pl-9 pr-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
                              compact ? 'py-1.5 text-sm' : 'py-2 text-base'
                            }`}
                          />
                        </div>
                        
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Phone size={14} />
                          </div>
                          <Input
                            type="tel"
                            placeholder="Phone Number *"
                            value={leadData.phone}
                            onChange={(e) => setLeadData(prev => ({ ...prev, phone: e.target.value }))}
                            className={`w-full pl-9 pr-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 ${
                              compact ? 'py-1.5 text-sm' : 'py-2 text-base'
                            }`}
                          />
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleLeadSubmit}
                        disabled={submittingLead || !leadData.name || !leadData.email || !leadData.phone}
                        className={`w-full font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white border-0 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${
                          compact ? 'py-2 text-sm' : 'py-3 text-base'
                        }`}
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
                    /* Thank You Message */
                    <div className="text-center space-y-3">
                      <h3 className={compact ? "text-base font-bold text-gray-900" : "text-lg sm:text-xl font-bold text-gray-900"}>
                        Thank You!
                      </h3>
                      <p className={compact ? "text-xs text-gray-600" : "text-sm sm:text-base text-gray-600"}>
                        Your result has been successfully submitted{doctorProfile ? ` to Dr. ${doctorProfile.first_name} ${doctorProfile.last_name}` : ''}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

