import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function MIDASPage() {
  const [searchParams] = useSearchParams();
  const [stage, setStage] = useState<'quiz' | 'results'>('quiz');
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

  const quiz = quizzes['MIDAS'];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

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

      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedOption(null);
      } else {
        const result = calculateQuizScore('MIDAS', newAnswers);
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
        quiz_type: 'MIDAS',
        score: quizResult.score,
        answers: answers,
        lead_status: 'NEW',
        doctor_id: doctorId,
        share_key: key || null,
        submitted_at: new Date().toISOString()
      };

      console.log('Submitting MIDAS lead via edge function:', leadDataToSubmit);

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

  if (stage === 'quiz') {
    const currentQ = quiz.questions[currentQuestion];
    const isLastQuestion = currentQuestion === quiz.questions.length - 1;

    return (
      <div className="h-full w-full bg-gradient-to-br from-background to-secondary/20 py-4 sm:py-8 md:py-12 px-3 sm:px-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-4">
              Migraine Disability Assessment Test (MIDAS)
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Measure the impact your headaches have on your life
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="mb-6">
                {currentQuestion < 5 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground">
                      Instructions: Please answer the following questions about ALL of the headaches you have had over the last 3 months. Enter 0 if you did not have the activity in the last 3 months.
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Question {currentQuestion + 1} of {quiz.questions.length}
                  </span>
                  <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="mb-6" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold text-foreground mb-6">
                    {currentQ.text}
                  </h2>

                  <div className="space-y-3">
                    {currentQ.options.map((option, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={() => handleQuizAnswer(index, option)}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                            selectedOption === index
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          }`}
                        >
                          <span className="text-foreground">{option}</span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (stage === 'results') {
    if (leadSubmitted) {
      return (
        <div className="h-full w-full bg-gradient-to-br from-background to-secondary/20 py-4 sm:py-8 md:py-12 px-3 sm:px-4 overflow-y-auto">
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

    return (
      <div className="h-full w-full bg-gradient-to-br from-background to-secondary/20 py-4 sm:py-8 md:py-12 px-3 sm:px-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
          <Card className="shadow-lg">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="text-center mb-8">
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">Assessment Complete</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Here are your results</p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
                <div className="text-center mb-4">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">{quizResult.score}</div>
                  <div className="text-xs sm:text-sm uppercase tracking-wide text-muted-foreground">
                    MIDAS Score
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-sm sm:text-base text-foreground font-semibold mb-2 capitalize">{quizResult.severity}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{quizResult.interpretation}</p>
                </div>
              </div>

              <div className="border-t border-border pt-8">
                <div className="text-center mb-6">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2">Get Your Detailed Results</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Enter your information to receive your complete assessment results and recommendations. We may contact you if you qualify for an in office procedure that may give your symptoms relief.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      value={leadData.name}
                      onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={leadData.email}
                      onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={leadData.phone}
                      onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <Button 
                    onClick={handleSubmitLead}
                    disabled={submittingLead || !leadData.name || !leadData.email}
                    className="w-full"
                    size="lg"
                  >
                    {submittingLead ? 'Submitting...' : 'Submit Information'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
