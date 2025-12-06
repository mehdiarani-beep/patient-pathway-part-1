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
import { SEOHead } from '@/components/seo/SEOHead';
import {
  generateMedicalWebPageSchema,
  generateMedicalTestSchema,
  generateFAQSchema,
  generatePhysicianSchema,
  generateMedicalClinicSchema,
} from '@/components/seo/schemas/medicalSchemas';

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

interface ClinicData {
  id: string;
  clinic_name: string;
  logo_url?: string;
  avatar_url?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  primary_color?: string;
  secondary_color?: string;
}

interface PhysicianData {
  id: string;
  first_name: string;
  last_name: string;
  degree_type?: string;
  headshot_url?: string;
  bio?: string;
  email?: string;
  mobile?: string;
  credentials?: string[];
}

interface NOSESNOTPageProps {
  doctorId?: string;
  physicianId?: string;
}

export function NOSESNOTPage({ doctorId: propDoctorId, physicianId: propPhysicianId }: NOSESNOTPageProps = {}) {
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
  
  // New state for clinic and physician data
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [physicianData, setPhysicianData] = useState<PhysicianData | null>(null);
  const [isClinicQuiz, setIsClinicQuiz] = useState<boolean>(false);
  
  const [leadData, setLeadData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Use prop doctorId if provided, otherwise fall back to URL param
  const doctorId = propDoctorId || searchParams.get('doctor');
  const physicianId = propPhysicianId || searchParams.get('physician');
  const key = searchParams.get('key');

  // Fetch clinic or physician data based on ID comparison
  useEffect(() => {
    const fetchClinicData = async () => {
      if (!doctorId) return;
      
      try {
        // First get the clinic_id from doctor_profiles
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctor_profiles')
          .select('clinic_id')
          .eq('id', doctorId)
          .maybeSingle();

        if (doctorError) throw doctorError;
        
        if (doctorData?.clinic_id) {
          const { data: clinic, error: clinicError } = await supabase
            .from('clinic_profiles')
            .select('*')
            .eq('id', doctorData.clinic_id)
            .maybeSingle();

          if (clinicError) throw clinicError;
          setClinicData(clinic);
        }
      } catch (error) {
        console.error('Error fetching clinic data:', error);
      }
    };

    const fetchPhysicianData = async () => {
      if (!physicianId) return;
      
      try {
        const { data: physician, error } = await supabase
          .from('clinic_physicians')
          .select('*')
          .eq('id', physicianId)
          .maybeSingle();

        if (error) throw error;
        setPhysicianData(physician);
      } catch (error) {
        console.error('Error fetching physician data:', error);
      }
    };

    // Determine if this is a clinic quiz or physician quiz
    if (physicianId && doctorId) {
      if (physicianId === doctorId) {
        // Clinic-level quiz - fetch clinic data
        setIsClinicQuiz(true);
        fetchClinicData();
      } else {
        // Physician-level quiz - fetch physician data
        setIsClinicQuiz(false);
        fetchPhysicianData();
      }
    } else if (doctorId) {
      // Only doctorId provided - treat as clinic quiz
      setIsClinicQuiz(true);
      fetchClinicData();
    }
  }, [doctorId, physicianId]);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (doctorId) {
        try {
          const { data, error } = await supabase
            .from('doctor_profiles')
            .select('*')
            .eq('id', doctorId)
            .maybeSingle();

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
        physician_id: physicianId || doctorId,
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

  // SEO Data
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const physicianName = physicianData ? `${physicianData.first_name} ${physicianData.last_name}` : 'Our ENT Specialist';
  const seoTitle = isClinicQuiz 
    ? `Nasal & Sinus Assessment | Free NOSE & SNOT-12 Test`
    : `Nasal Assessment | Dr. ${physicianName} | Free Breathing Evaluation`;
  const seoDescription = `Take the free nasal assessment to evaluate breathing difficulties, nasal congestion, and sinus symptoms. Clinically-validated NOSE and SNOT-12 screening tools.`;

  const structuredData = [
    generateMedicalWebPageSchema({
      name: seoTitle,
      description: seoDescription,
      url: currentUrl,
      specialty: 'Otolaryngology',
    }),
    generateMedicalTestSchema({
      name: 'Nasal Assessment (NOSE & SNOT-12)',
      description: 'A combined screening tool using NOSE (Nasal Obstruction Symptom Evaluation) and SNOT-12 (Sinonasal Outcome Test) to assess nasal and sinus symptoms.',
      url: currentUrl,
      usedToDiagnose: ['Nasal Obstruction', 'Chronic Rhinosinusitis', 'Deviated Septum', 'Nasal Congestion'],
    }),
  ];

  const seoHead = (
    <SEOHead
      title={seoTitle}
      description={seoDescription}
      canonicalUrl={currentUrl}
      keywords="nasal obstruction test, NOSE score, SNOT-12, sinus assessment, nasal congestion evaluation, ENT screening, breathing difficulty test"
      structuredData={structuredData}
    />
  );

  if (stage === 'triage') {
    return (
      <>
        {seoHead}
        <div className="h-full w-full bg-white py-6 px-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-sm sm:text-base md:text-lg font-medium text-center text-slate-800 mb-6 leading-relaxed">
            Is your breathing difficulty mainly due to nasal blockage or stuffiness, or do you also have other symptoms like facial pressure, headaches, postnasal drip, or a reduced sense of smell?
          </h3>

          <div className="space-y-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => handleTriageAnswer('A')}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all text-slate-700 hover:border-[#0796cc] hover:bg-[#0796cc]/5 text-sm sm:text-base ${
                  selectedTriage === 'A'
                    ? 'border-[#0796cc] bg-[#0796cc]/5'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <span className="font-semibold text-[#0796cc]">A.</span> Nasal blockage/stuffiness
              </button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => handleTriageAnswer('B')}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all text-slate-700 hover:border-[#0796cc] hover:bg-[#0796cc]/5 text-sm sm:text-base ${
                  selectedTriage === 'B'
                    ? 'border-[#0796cc] bg-[#0796cc]/5'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <span className="font-semibold text-[#0796cc]">B.</span> Sinus-related symptoms like facial pressure, headaches, or a reduced sense of smell
              </button>
            </motion.div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Progress</span>
              <span>0%</span>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (stage === 'quiz' && quiz) {
    const currentQ = quiz.questions[currentQuestion];
    const quizName = quizType === 'NOSE' ? 'Nasal Obstruction Symptom Evaluation (NOSE)' : 'Sinonasal Outcome Test (SNOT)';
    const maxScore = quizType === 'NOSE' ? 100 : 60;
    const totalQuestions = quiz.questions.length;

    return (
      <>
        {seoHead}
      <div className="h-full w-full bg-white py-6 px-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-center text-slate-800 mb-6">
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
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all text-slate-700 hover:border-[#0796cc] hover:bg-[#0796cc]/5 text-sm sm:text-base ${
                        selectedOption === index
                          ? 'border-[#0796cc] bg-[#0796cc]/5'
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

          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="text-center text-xs text-slate-500">
              Question {currentQuestion + 1} of {totalQuestions}
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (stage === 'results') {
    if (leadSubmitted) {
      return (
        <>
          {seoHead}
          <div className="h-full w-full bg-white py-6 px-4 overflow-y-auto">
            <div className="max-w-lg mx-auto text-center">
              <CheckCircle className="w-12 h-12 text-[#0796cc] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Thank You!</h2>
              <p className="text-slate-600 text-sm">
                Your results have been sent. {doctorProfile?.clinic_name || 'Our team'} will contact you soon to discuss your assessment.
              </p>
            </div>
          </div>
        </>
      );
    }

    const quizName = quizType === 'NOSE' ? 'NOSE' : 'SNOT-12';
    const maxScore = quizType === 'NOSE' ? 100 : 60;

    return (
      <div className="h-full w-full bg-white py-6 px-4 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          {/* Title */}
          <h1 className="text-base font-bold text-center text-slate-800 mb-2">
            {quizName} Assessment Complete!
          </h1>

          {/* Score Display */}
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-[#0796cc] mb-1">
              Score: {quizResult.score}/{maxScore}
            </div>
            <div className="inline-block px-3 py-1 bg-[#0796cc]/10 text-[#0796cc] rounded-full text-xs font-semibold capitalize mb-2">
              {quizResult.severity} Symptoms
            </div>
            {quizResult.interpretation && (
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {quizResult.interpretation}
              </p>
            )}
          </div>

          {/* Contact Form Section */}
          <div className="border-t border-slate-200 pt-4">
            <h2 className="text-sm font-bold text-center text-slate-800 mb-3">
              Please provide your information
            </h2>

            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="name"
                  value={leadData.name}
                  onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                  placeholder="Full Name *"
                  className="pl-10 h-11 text-sm border-slate-200 rounded-lg"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={leadData.email}
                  onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                  placeholder="Email Address *"
                  className="pl-10 h-11 text-sm border-slate-200 rounded-lg"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={leadData.phone}
                  onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                  placeholder="Phone Number"
                  className="pl-10 h-11 text-sm border-slate-200 rounded-lg"
                />
              </div>

              <Button
                onClick={handleSubmitLead}
                disabled={submittingLead}
                className="w-full h-11 text-sm font-semibold rounded-lg bg-[#0796cc] hover:bg-[#0687b8] transition-all"
              >
                {submittingLead ? 'Submitting...' : 'Submit Information'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }


  return null;
}
