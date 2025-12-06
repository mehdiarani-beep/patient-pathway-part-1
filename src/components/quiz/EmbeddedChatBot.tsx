import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Send, RotateCcw, CheckCircle, AlertCircle, Info, ArrowLeft, Bot, Loader2, UserCircle } from 'lucide-react';
import { quizzes } from '@/data/quizzes';
import { calculateQuizScore } from '@/utils/quizScoring';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Profileimage from '/src/assets/doctor.png';
const defaultChatbotColors = {
  primary: '#2563eb',
  background: '#ffffff',
  text: '#ffffff',
  userBubble: '#2563eb',
  botBubble: '#f1f5f9',
  userText: '#ffffff',
  botText: '#334155'
};

interface Message {
  role: 'assistant' | 'user';
  content: string;
  isQuestion?: boolean;
  questionIndex?: number;
  options?: string[];
}

interface QuizAnswer {
  questionIndex: number;
  answer: string;
  answerIndex: number;
}

interface EmbeddedChatBotProps {
  quizType: string;
  doctorId?: string;
  physicianId?: string;
  customQuiz?: any;
  quizData?: any;
  doctorAvatarUrl?: string;
  chatbotColors?: typeof defaultChatbotColors;
  utm_source: string;
  shareKey?: string;
  compact?: boolean;
}

export function EmbeddedChatBot({ quizType, doctorId, physicianId, customQuiz, quizData, doctorAvatarUrl, chatbotColors, utm_source, shareKey, compact = false }: EmbeddedChatBotProps) {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [result, setResult] = useState({
    score: 0,
    interpretation: '',
    severity: '',
    summary: '',
    detailedAnswers: []
  });
  const [userInfo, setUserInfo] = useState({ name: '', email: '', phone: '' });
  const [collectingInfo, setCollectingInfo] = useState(false);
  const [infoStep, setInfoStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showTyping, setShowTyping] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [finalDoctorId, setFinalDoctorId] = useState<string | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const colors = chatbotColors || defaultChatbotColors;

  // Enhanced source tracking
  const source = utm_source || 'website';
  const campaign = searchParams.get('campaign') || searchParams.get('utm_campaign') || 'default';
  const medium = searchParams.get('medium') || searchParams.get('utm_medium') || 'web';


  // Add state for post-quiz chat
  const [postQuizChat, setPostQuizChat] = useState([]);
  const [postQuizInput, setPostQuizInput] = useState('');

  // Add these validation functions at the top of your component
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string) => {
    // Allows formats: (123) 456-7890, 123-456-7890, 1234567890
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(phone);
  };

  const askNextQuestion = (questionIndex: number) => {
    if (questionIndex < quizData.questions.length) {
      setShowTyping(true);
      setTimeout(() => {
        setShowTyping(false);
        const question = quizData.questions[questionIndex];
        
        // Skip the first question for NOSE, SNOT12, and TNSS since it's already shown in the initial message
        if ((quizType === 'NOSE' || quizType === 'SNOT12' || quizType === 'TNSS') && questionIndex === 0) {
          setCurrentQuestionIndex(questionIndex);
          return;
        }
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Question ${questionIndex + 1} of ${quizData.questions.length}:\n\n${question.text}`,
          isQuestion: true,
          questionIndex,
          options: question.options
        }]);
        setCurrentQuestionIndex(questionIndex);
      }, 700);
    } else {
      setTimeout(() => completeQuiz(), 700);
    }
  };

  useEffect(() => {
    if (quizData) {
      setLoading(false);
      
      // For NOSE, SNOT12, and TNSS quizzes, show consolidated message immediately
      if (quizType === 'NOSE' || quizType === 'SNOT12' || quizType === 'TNSS') {
        let consolidatedMessage = '';
        
        if (quizType === 'NOSE') {
          const firstQuestion = quizData.questions[0];
          const optionsText = firstQuestion.options.join('\n• ');
          
          consolidatedMessage = `Start your Nasal Obstruction Symptom Evaluation (NOSE) to get your 0–100 nasal obstruction score.\n\nQuestion 1 of 5:\n\n${firstQuestion.text}\n`;
        } else if (quizType === 'SNOT12') {
          const firstQuestion = quizData.questions[0];
          const optionsText = firstQuestion.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, etc.
            const score = option.match(/\((\d+)\)/)?.[1] || index;
            const label = option.replace(/\s*\(\d+\)$/, '');
            return `${letter} – ${label} (${score})`;
          }).join('\n• ');
          
          consolidatedMessage = `Start your SNOT-12 assessment to get your 0–60 sinus severity score.\n\nQuestion 1 of 12: \n\n${firstQuestion.text}\n`;
        } else if (quizType === 'TNSS') {
          const firstQuestion = quizData.questions[0];
          const optionsText = firstQuestion.options.map((option, index) => {
            const score = option.match(/\((\d+)\)/)?.[1] || index;
            const label = option.replace(/\s*\(\d+\)$/, '');
            return `${score} – ${label}`;
          }).join('\n• ');
          
          consolidatedMessage = `Start your TNSS assessment to get your 0–12 rhinitis severity score.\n\nQuestion 1 of 4:\n\n${firstQuestion.text}\n`;
        }
        
        setMessages([{
          role: 'assistant',
          content: consolidatedMessage,
          isQuestion: true,
          questionIndex: 0,
          options: quizType === 'NOSE' ? quizData.questions[0].options : quizData.questions[0].options
        }]);
        setQuizStarted(true);
        setCurrentQuestionIndex(0);
      } else {
        // For other quizzes, show the traditional welcome message
        setMessages([
          {
            role: 'assistant',
            content: `Hello! Welcome to the ${quizData.title}. ${quizData.description}\n\nThis assessment will help evaluate your symptoms. Click "Start Assessment" when you're ready to begin.`
          }
        ]);
        askNextQuestion(0);
      }
    }
  }, [quizData]);

  useEffect(() => {
    console.log('🔍 Setting up doctor ID...', {
      doctorId,
      searchParamsDoctor: searchParams.get('doctor'),
      customQuiz: customQuiz?.id,
      shareKey
    });
    
    const urlDoctorId = doctorId || searchParams.get('doctor');
    if (urlDoctorId) {
      console.log('✅ Using URL doctor ID:', urlDoctorId);
      setFinalDoctorId(urlDoctorId);
    } else if (customQuiz && customQuiz.id) {
      console.log('🔍 Looking up doctor for custom quiz:', customQuiz.id);
      // For custom quizzes, find the doctor who owns this quiz
      findDoctorForCustomQuiz(customQuiz.id);
    } else if (shareKey) {
      console.log('🔍 Looking up doctor by share key:', shareKey);
      // For shared quizzes, find doctor by share key
      findDoctorByShareKey();
    } else {
      console.log('🔍 Using fallback - finding first available doctor');
      // Fallback to first available doctor
      findFirstDoctor();
    }
  }, [doctorId, searchParams, customQuiz, shareKey]);

  useEffect(() => {
    // Auto-scroll to bottom of quiz section when:
    // 1. A new question appears
    // 2. Results are shown
    // 3. Taking details/collecting info
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.isQuestion || 
          (lastMessage.content && lastMessage.content.toLowerCase().includes('result')) ||
          collectingInfo ||
          quizCompleted) {
        // For collecting info, scroll to show input field
        if (collectingInfo) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    }
  }, [messages, collectingInfo, quizCompleted]);

  useEffect(() => {
    setIsAnswering(false);
  }, [currentQuestionIndex]);
  
  const fetchDoctorProfile = async () => {
    if (finalDoctorId) {
      try {
        const { data, error } = await supabase
          .from('doctor_profiles')
          .select('*')
          .eq('id', finalDoctorId)
          .single();
        
        if (error) {
          console.error('Error fetching doctor profile:', error);
          return;
        }
        
        if (data) {
          setDoctorProfile(data);
        } else {
          console.warn('No doctor profile found for ID:', finalDoctorId);
        }
      } catch (error) {
        console.error('Error fetching doctor profile:', error);
      }
    }
  };

  useEffect(() => {
    fetchDoctorProfile();
  }, [finalDoctorId]);


  const findDoctorForCustomQuiz = async (customQuizId: string) => {
    try {
      console.log('Finding doctor for custom quiz:', customQuizId);
      const { data: customQuiz, error } = await supabase
        .from('custom_quizzes')
        .select('doctor_id')
        .eq('id', customQuizId)
        .single();
      
      if (error) {
        console.error('Error finding custom quiz:', error);
        findFirstDoctor();
        return;
      }
      
      if (customQuiz && customQuiz.doctor_id) {
        console.log('Found doctor ID for custom quiz:', customQuiz.doctor_id);
        setFinalDoctorId(customQuiz.doctor_id);
      } else {
        console.log('No doctor found for custom quiz, using fallback');
        findFirstDoctor();
      }
    } catch (error) {
      console.error('Error finding doctor for custom quiz:', error);
      findFirstDoctor();
    }
  };

  const findDoctorByShareKey = async () => {
    try {
      console.log('🔍 Finding doctor by share key:', shareKey);
      const { data: shareData, error } = await supabase
        .from('quiz_shares')
        .select('doctor_id')
        .eq('share_key', shareKey)
        .single();
      
      if (error) {
        console.error('Error fetching doctor by share key:', error);
        findFirstDoctor();
        return;
      }
      
      if (shareData && shareData.doctor_id) {
        console.log('✅ Found doctor ID for share key:', shareData.doctor_id);
        setFinalDoctorId(shareData.doctor_id);
      } else {
        console.log('❌ No doctor found for share key, using fallback');
        findFirstDoctor();
      }
    } catch (error) {
      console.error('❌ Error in findDoctorByShareKey:', error);
      findFirstDoctor();
    }
  };

  const findFirstDoctor = async () => {
    try {
      console.log('🔍 Finding first available doctor...');
      const { data: doctorProfiles, error } = await supabase
        .from('doctor_profiles')
        .select('id, email')
        .limit(1);
      
      if (error) {
        console.error('❌ Error fetching doctor profiles:', error);
        return;
      }
      
      if (doctorProfiles && doctorProfiles.length > 0) {
        console.log('✅ Using fallback doctor ID:', doctorProfiles[0].id, 'Email:', doctorProfiles[0].email);
        setFinalDoctorId(doctorProfiles[0].id);
      } else {
        console.error('❌ No doctor profiles found in database');
      }
    } catch (error) {
      console.error('❌ Error finding first doctor:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.primary	 }}></div>
          <p className="text-lg text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (notFound || !quizData) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: colors.background }}>
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assessment Not Found</h1>
          <p className="text-gray-600 mb-4">The requested assessment could not be found or is no longer available.</p>
          <Button onClick={() => window.location.href = '/'} style={{ backgroundColor: colors.primary	, borderColor: colors.primary	 }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleAnswer = async (answerText: string, answerIndex: number, questionIndex?: number) => {
    // Prevent rapid clicks and answering previous questions
    if (isAnswering) {
      console.log('Already answering - please wait');
      return;
    }
    
    if (questionIndex !== undefined && questionIndex !== currentQuestionIndex) {
      console.log('Cannot answer previous questions - quiz progression locked');
      return;
    }

    // Set answering state to prevent rapid clicks
    setIsAnswering(true);
    
    // Capture partial submission on first answer
    if (currentQuestionIndex === 0 && answers.length === 0) {
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

    const newAnswer: QuizAnswer = {
      questionIndex: currentQuestionIndex,
      answer: answerText,
      answerIndex
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    setMessages(prev => [...prev, {
      role: 'user',
      content: answerText
    }]);

    const nextQuestionIndex = currentQuestionIndex + 1;
    if (nextQuestionIndex < quizData.questions.length) {
      setShowTyping(true);
      setTimeout(() => {
        setShowTyping(false);
        askNextQuestion(nextQuestionIndex);
        // isAnswering will be reset when currentQuestionIndex changes
      }, 700);
    } else {
      setShowTyping(true);
      setTimeout(() => {
        setShowTyping(false);
        completeQuiz();
        setIsAnswering(false); // Reset answering state for quiz completion
      }, 700);
    }
  };

  const completeQuiz = () => {
    setQuizCompleted(true);
    
    let score = 0;
    let detailedAnswers: any = {};
    let severity = 'normal';
    let interpretation = '';
    if (quizData.isCustom) {
      // Calculate score for custom quiz
      answers.forEach((answer, index) => {
        const question = quizData.questions[answer.questionIndex];
        const selectedOption = question.options?.[answer.answerIndex];
        if (selectedOption && typeof selectedOption.value === 'number') {
          score += selectedOption.value;
        }
        detailedAnswers[question.id || `q${index}`] = {
          question: question.text,
          answer: answer.answer,
          score: selectedOption?.value || 0
        };
      });

      // Calculate severity based on percentage
      const percentage = (score / quizData.maxScore) * 100;

      if (percentage >= quizData.scoring.severe_threshold) {
        severity = 'severe';
        interpretation = 'Your symptoms indicate a severe condition. Please consult with a healthcare provider immediately.';
      } else if (percentage >= quizData.scoring.moderate_threshold) {
        severity = 'moderate';
        interpretation = 'Your symptoms indicate a moderate condition. We recommend scheduling a consultation.';
      } else if (percentage >= quizData.scoring.mild_threshold) {
        severity = 'mild';
        interpretation = 'Your symptoms indicate a mild condition. Consider monitoring or consulting with a healthcare provider.';
      } else {
        interpretation = 'Your symptoms appear to be minimal. Continue monitoring your condition.';
      }
      resultSetter(score,interpretation,severity,detailedAnswers);
    } else {
      // Use existing scoring for standard quizzes
      const quizResult = calculateQuizScore(quizData.id as any, answers);
      score = quizResult.score;
      interpretation = quizResult.interpretation;
      severity = quizResult.severity;
      answers.forEach((answer, index) => {
        const question = quizData.questions[answer.questionIndex];
        detailedAnswers[`q${index}`] = {
          question: question.text,
          answer: answer.answer,
          score: answer.answerIndex
        };
      });
      const newResult = {
        score,
        interpretation,
        severity,
        summary: interpretation,
        detailedAnswers
      };    
      setResult(newResult);
      score = quizResult.score;
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `🎉 Congratulations! You've completed the ${quizData.title}. Thank you ${userInfo.name || ''}!\n\nYour Results:\n\nScore: ${newResult.score}/${quizData.maxScore}\nSeverity: ${newResult.severity.charAt(0).toUpperCase() + newResult.severity.slice(1)}\n\nInterpretation: ${newResult.interpretation}\n\nA healthcare provider will review your results and may contact you for follow-up care if needed.`
        },
        {
          role: 'assistant',
          content: 'Please enter your full name:'
        }
      ]);
    }
    setCollectingInfo(true);
    setInfoStep(0);
  };
  const resultSetter = (
    score: typeof result['score'],
    interpretation: typeof result['interpretation'],
    severity: typeof result['severity'],
    detailedAnswers: typeof result['detailedAnswers']
  ) => {
    setResult({
      score,
      interpretation,
      severity,
      summary: interpretation,
      detailedAnswers
    });
  };
  
  // Update the handleInfoSubmit function
  const handleInfoSubmit = async () => {
    if (infoStep === 0) {
      if (!userInfo.name.trim()) {
        toast.error('Please enter your name');
        return;
      }
      if (userInfo.name.trim().length < 2) {
        toast.error('Please enter a valid name (at least 2 characters)');
        return;
      }
      setInfoStep(1);
      setMessages(prev => [...prev, 
        { role: 'user', content: userInfo.name },
        { role: 'assistant', content: 'Thank you! Please provide your email address:' }
      ]);
      setInput('');
      return;
    }

    if (infoStep === 1) {
      if (!userInfo.email.trim()) {
        toast.error('Please enter your email address');
        setMessages(prev => [...prev, 
          { role: 'user', content: userInfo.email },
          { role: 'assistant', content: 'I need your email address to proceed. Please enter a valid email address.' }
        ]);
        return;
      }
      if (!isValidEmail(userInfo.email)) {
        toast.error('Invalid email format');
        setMessages(prev => [...prev, 
          { role: 'user', content: userInfo.email },
          { role: 'assistant', content: `"${userInfo.email}" doesn't seem to be a valid email address. Please enter a valid email address (e.g., name@example.com)` }
        ]);
        setInput('');
        return;
      }
      setInfoStep(2);
      setMessages(prev => [...prev, 
        { role: 'user', content: userInfo.email },
        { role: 'assistant', content: 'Great! Finally, please provide your phone number:' }
      ]);
      setInput('');
      return;
    }

    if (infoStep === 2) {
      if (!userInfo.phone.trim()) {
        toast.error('Please enter your phone number');
        setMessages(prev => [...prev, 
          { role: 'user', content: userInfo.phone },
          { role: 'assistant', content: 'I need your phone number to proceed. Please enter a valid phone number.' }
        ]);
        return;
      }
      if (!isValidPhone(userInfo.phone)) {
        toast.error('Invalid phone format');
        setMessages(prev => [...prev, 
          { role: 'user', content: userInfo.phone },
          { role: 'assistant', content: `"${userInfo.phone}" doesn't seem to be a valid phone number. Please enter a number in the format: 123-456-7890 or (123) 456-7890` }
        ]);
        setInput('');
        return;
      }
      setMessages(prev => [...prev, 
        { role: 'user', content: userInfo.phone }
      ]);
      setCollectingInfo(false);
      setInput('');
      
      // Submit lead to database
      await submitLead();
      return;
    }
  };

  const submitLead = async () => {
    console.log('=== SUBMIT LEAD CALLED ===');
    console.log('Starting lead submission process...', {
      finalDoctorId,
      userInfo,
      result,
      quizData
    });

    if (!finalDoctorId) {
      console.error('❌ No doctor ID available for lead submission');
      console.error('finalDoctorId is:', finalDoctorId);
      console.error('doctorId prop is:', doctorId);
      console.error('searchParams doctor:', searchParams.get('doctor'));
      toast.error('Unable to save results - no doctor associated with this quiz');
      return;
    }

    console.log('✅ Doctor ID found:', finalDoctorId);

    setIsSubmittingLead(true);
    
    try {
      const leadData = {
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        quiz_type: quizData.isCustom ? `custom_${quizData.id}` : quizData.id.toUpperCase(),
        custom_quiz_id: quizData.isCustom ? quizData.id : null,
        score: result.score,
        answers: result.detailedAnswers,
        lead_source: source || 'chatbot_page',
        lead_status: 'NEW',
        doctor_id: finalDoctorId,
        physician_id: physicianId || finalDoctorId,
        incident_source: 'default',
        submitted_at: new Date().toISOString()
      };

      console.log('Submitting lead with data:', leadData);

      // Use the Supabase edge function to submit the lead
      console.log('🚀 Calling supabase.functions.invoke("submit-lead")...');
      const { data, error } = await supabase.functions.invoke('submit-lead', {
        body: leadData,
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }
      
      console.log('✅ Lead saved successfully via edge function:', data);
      toast.success('Results saved successfully! Your information has been sent to the healthcare provider.');

      // Create notification for the doctor
      if (finalDoctorId) {
        const { error: notificationError } = await supabase
          .from('doctor_notifications')
          .insert([{
            doctor_id: finalDoctorId,
            title: 'New Assessment Completed',
            message: `${userInfo.name} completed a ${quizData.title} assessment with a score of ${result.score}/${quizData.maxScore}`,
            type: 'new_lead'
          }]);

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        } else {
          console.log('Notification created successfully');
        }
      }

    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error('Failed to save results. Please try again.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handlePostQuizSend = () => {
    if (postQuizInput.trim() === '') return;
    setPostQuizChat(prev => [...prev, { role: 'user', content: postQuizInput }]);
    setMessages(prev => [...prev, { role: 'user', content: postQuizInput }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: "Thank you for your message! A team member will get back to you soon." }]);
    }, 800);
    setPostQuizInput('');
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    if (collectingInfo) {
      if (infoStep === 0) {
        setUserInfo(prev => ({ ...prev, name: value }));
      } else if (infoStep === 1) {
        setUserInfo(prev => ({ ...prev, email: value }));
      } else if (infoStep === 2) {
        setUserInfo(prev => ({ ...prev, phone: value }));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (collectingInfo) {
        handleInfoSubmit();
      } else if (result && quizCompleted && !collectingInfo) {
        handlePostQuizSend();
      }
    }
  };

  const resetQuiz = () => {
    setMessages([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setQuizCompleted(false);
    setQuizStarted(true);
    setResult(null);
    setUserInfo({ name: '', email: '', phone: '' });
    setCollectingInfo(false);
    setInfoStep(0);
    setInput('');
    setPostQuizChat([]);
    setPostQuizInput('');
    // For NOSE, SNOT12, and TNSS quizzes, show consolidated message immediately
    if (quizType === 'NOSE' || quizType === 'SNOT12' || quizType === 'TNSS') {
      setTimeout(() => {
        let consolidatedMessage = '';
        
        if (quizType === 'NOSE') {
          const firstQuestion = quizData.questions[0];
          const optionsText = firstQuestion.options.join('\n• ');
          
          consolidatedMessage = `Start your Nasal Obstruction Symptom Evaluation (NOSE) to get your 0–100 nasal obstruction score.\n\nQuestion 1 of 5:\n\n${firstQuestion.text}\n`;
        } else if (quizType === 'SNOT12') {
          const firstQuestion = quizData.questions[0];
          const optionsText = firstQuestion.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, etc.
            const score = option.match(/\((\d+)\)/)?.[1] || index;
            const label = option.replace(/\s*\(\d+\)$/, '');
            return `${letter} – ${label} (${score})`;
          }).join('\n• ');
          
          consolidatedMessage = `Start your SNOT-12 assessment to get your 0–60 sinus severity score.\n\nQuestion 1 of 12:\n\n${firstQuestion.text}\n`;
        } else if (quizType === 'TNSS') {
          const firstQuestion = quizData.questions[0];
          const optionsText = firstQuestion.options.map((option, index) => {
            const score = option.match(/\((\d+)\)/)?.[1] || index;
            const label = option.replace(/\s*\(\d+\)$/, '');
            return `${score} – ${label}`;
          }).join('\n• ');
          
          consolidatedMessage = `Start your TNSS assessment to get your 0–12 rhinitis severity score.\n\nQuestion 1 of 4:\n\n${firstQuestion.text}\n\n• ${optionsText}`;
        }
        
        setMessages([{
          role: 'assistant',
          content: consolidatedMessage,
          isQuestion: true,
          questionIndex: 0,
          options: quizType === 'NOSE' ? quizData.questions[0].options : quizData.questions[0].options
        }]);
        setQuizStarted(true);
        setCurrentQuestionIndex(0);
      }, 100);
    } else {
      setTimeout(() => {
        setMessages([{
          role: 'assistant',
          content: `Hello! Welcome to the ${quizData.title}. ${quizData.description}\n\nThis assessment will help evaluate your symptoms. Click "Start Assessment" when you're ready to begin.`
        }]);
      }, 100);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'mild': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-teal-600 bg-teal-50 border-teal-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'severe': return <AlertCircle className="w-4 h-4" />;
      case 'moderate': return <AlertCircle className="w-4 h-4" />;
      case 'mild': return <Info className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  // First, let's fix the theme implementation
const theme = {
  colors: {
    primary: '#2563eb',
    secondary: '#f59e0b',
    accent: '#0ea5e9',
    border: '#e2e8f0',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b'
  }
};

// Fix the renderMessage implementation
const renderMessage = (message: Message, index: number) => (
  <motion.div
    key={index}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`flex items-end gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
  >
    {message.role === 'assistant' && (
      <Avatar className="h-8 w-8 border border-gray-200 shadow-sm">
        <AvatarImage 
          src={doctorProfile?.avatar_url || doctorAvatarUrl || Profileimage}
          alt={`Dr. ${doctorProfile?.first_name || ''} ${doctorProfile?.last_name || ''}`}
        />
        <AvatarFallback className="bg-white">
          <Bot className="w-4 h-4" style={{ color: theme.colors.primary }} />
        </AvatarFallback>
      </Avatar>
    )}
    
    <div
      className='rounded-2xl px-5 py-3 max-w-[80%] shadow-sm transition-all duration-200'
      style={
        message.role === 'user'
          ? { backgroundColor: colors.userBubble, color: colors.userText }
          : { backgroundColor: colors.botBubble, color: colors.botText }
      }
    >
      <span className="whitespace-pre-wrap text-base leading-relaxed">
        {message.content}
      </span>
      {message.isQuestion && message.options && !quizCompleted && (
        <div className="mt-4 space-y-2">
          {Array.isArray(message.options) && message.options.map((option: any, optionIndex: number) =>
            renderAnswerOption(option, optionIndex, handleAnswer, setInput, message.questionIndex, currentQuestionIndex, isAnswering)
          )}
        </div>
      )}
    </div>

    {message.role === 'user' && (
      <Avatar className="h-8 w-8 border border-gray-200 shadow-sm">
        <AvatarFallback className="bg-white">
          <UserCircle className="w-4 h-4" style={{ color: theme.colors.secondary }} />
        </AvatarFallback>
      </Avatar>
    )}
  </motion.div>
);


// Fix the renderAnswerOption function
const renderAnswerOption = (option: any, index: number, handleAnswer: Function, setInput: Function, questionIndex?: number, currentQuestionIndex?: number, isAnswering?: boolean, compact?: boolean) => {
  const isPreviousQuestion = questionIndex !== undefined && currentQuestionIndex !== undefined && questionIndex < currentQuestionIndex;
  const isDisabled = isPreviousQuestion || isAnswering;
  
  return (
    <motion.button
      key={`option-${index}`}
      whileHover={!isDisabled ? { scale: 1.01 } : {}}
      whileTap={!isDisabled ? { scale: 0.99 } : {}}
      onClick={() => {
        if (!isDisabled) {
          handleAnswer(option.text || option, index, questionIndex);
          setInput('');
        }
      }}
      disabled={isDisabled}
      className={`w-full ${compact ? 'p-1' : 'p-4'} text-left ${compact ? 'rounded-sm' : 'rounded-xl'} border transition-all duration-200 shadow-sm flex items-center ${compact ? 'gap-1' : 'gap-3'} ${
        isDisabled 
          ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60' 
          : 'border-gray-200 bg-white hover:border-primary/30 hover:bg-gray-50 hover:shadow'
      }`}
      style={!isDisabled ? { 
        '--tw-border-opacity': 0.5,
        color: theme.colors.primary 
      } as React.CSSProperties : {}}
    >
      <span className={`flex-shrink-0 ${compact ? 'w-3 h-3 text-[10px]' : 'w-7 h-7 text-sm'} rounded-full flex items-center justify-center font-medium ${
        isDisabled ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-600'
      }`}>
        {String.fromCharCode(65 + index)}
      </span>
      <span className={`flex-1 font-medium ${compact ? 'text-[11px]' : 'text-base'} ${
        isDisabled ? 'text-gray-500' : 'text-gray-700'
      }`}>
        {option.text || option}
      </span>
    </motion.button>
  );
};

// Remove duplicate theme declarations and conflicting styles
// Remove any references to primary-light, primary-dark etc
// Use the simplified theme object above
  return (
    <div className="flex flex-col h-full w-full" style={{ background: colors.background }}>
      <div className="flex-1 overflow-hidden flex flex-col w-full rounded-2xl shadow-lg" style={{ minHeight: 0 }}>
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: '100%', minHeight: 0 }}>
      <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end max-w-4xl ${compact ? 'gap-1' : 'gap-2'}`}>
                  {message.role === 'assistant' && (
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex-shrink-0">
                      <Avatar className={`${compact ? 'h-5 w-5' : 'h-8 w-8'} border border-gray-200 shadow`}>
                        <AvatarImage 
                          src={doctorProfile?.avatar_url || doctorAvatarUrl || Profileimage}
                          alt={`Dr. ${doctorProfile?.first_name || ''} ${doctorProfile?.last_name || ''}`}
                        />
                        <AvatarFallback className="bg-white">
                          <Bot className={`${compact ? 'w-2 h-2' : 'w-4 h-4'}`} style={{ color: colors.text	 }} />
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  )}
                  <div
                    className={`${compact ? 'rounded-md px-2 py-1' : 'rounded-2xl px-5 py-3'} max-w-full shadow-md transition-all duration-200 ${
                      message.role === 'user'
                        ? 'text-gray-900 hover:shadow-lg'
                        : 'bg-white border border-gray-200 text-gray-700 hover:shadow-lg'
                    }`}
                    style={message.role === 'user' ? { backgroundColor: colors.userBubble, color: colors.userText , borderColor: colors.primary	 } : {backgroundColor: colors.botBubble, color: colors.botText , borderColor: colors.primary}}
                  >
                    <span className={`whitespace-pre-wrap font-medium leading-relaxed ${compact ? 'text-xs' : 'text-base'}`}>{message.content}</span>
                    {message.isQuestion && message.options && !quizCompleted && (
                      <div className={`${compact ? 'mt-2' : 'mt-4'} ${compact ? 'space-y-1' : 'space-y-2'} w-full`}>
                        {Array.isArray(message.options) && message.options.map((option: any, optionIndex: number) =>
                          renderAnswerOption(option, optionIndex, handleAnswer, setInput, message.questionIndex, currentQuestionIndex, isAnswering, compact)
                        )}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex-shrink-0">
                      <UserCircle className={`${compact ? 'w-6 h-6' : 'w-7 h-7'} bg-white rounded-full border border-gray-200 shadow p-1`} style={{ color: colors.primary	 }} />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {showTyping && (
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex-shrink-0">
                <Avatar className={`${compact ? 'h-5 w-5' : 'h-8 w-8'} border border-gray-200 shadow`}>
                  <AvatarImage 
                    src={doctorProfile?.avatar_url || doctorAvatarUrl || Profileimage}
                    alt={`Dr. ${doctorProfile?.first_name || ''} ${doctorProfile?.last_name || ''}`}
                  />
                  <AvatarFallback className="bg-white">
                    <Bot className={`${compact ? 'w-2 h-2' : 'w-4 h-4'}`} style={{ color: colors.primary}} />
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            )}
          </AnimatePresence>
          
          {result && quizCompleted && !collectingInfo && (
            <Card className={`${compact ? 'rounded-lg mt-3' : 'rounded-2xl mt-6'} border`} style={{ borderColor: colors.primary	}}>
              <CardHeader className={compact ? 'p-3' : 'p-6'}>
                <CardTitle className={`flex justify-center items-center gap-2 ${compact ? 'text-base' : 'text-xl'}`} style={{ color: colors.primary	 }}>
                  <CheckCircle className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  Thank You!
                </CardTitle>
              </CardHeader>
              <CardContent className={`${compact ? 'p-3 space-y-2' : 'p-6 space-y-4'}`}>
                <div className={`grid ${compact ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
                  <div className={`text-center ${compact ? 'p-2' : 'p-4'} rounded-lg bg-gray-50`}>
                    <p className={`${compact ? 'text-xs' : 'text-sm'}`} style={{ color: colors.primary }}>Your Score</p>
                    <p className={`${compact ? 'text-lg' : 'text-2xl'} font-bold`} style={{ color: colors.primary	 }}>{result.score}/{quizData.maxScore}</p>
                  </div>
                  <div className={`text-center ${compact ? 'p-2' : 'p-4'} rounded-lg border ${getSeverityColor(result.severity)}`}>
                    <div className={`flex items-center justify-center gap-2 ${compact ? 'mb-0.5' : 'mb-1'}`}>
                      {getSeverityIcon(result.severity)}
                      <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>Severity Level</p>
                    </div>
                    <p className={`${compact ? 'text-sm' : 'text-base'} font-bold capitalize`}>{result.severity}</p>
                  </div>
                  <div className={`text-center ${compact ? 'p-2' : 'p-4'} rounded-lg bg-gray-50`}>
                    <p className={`${compact ? 'text-xs' : 'text-sm'}`} style={{ color: colors.primary }}>Questions</p>
                    <p className={`${compact ? 'text-lg' : 'text-2xl'} font-bold`} style={{ color: colors.primary }}>{quizData.questions.length}</p>
                  </div>
                </div>
                <div className={`${compact ? 'p-2' : 'p-4'} rounded-lg bg-gray-50`}>
                  <h4 className={`${compact ? 'text-sm' : 'text-base'} font-semibold ${compact ? 'mb-1' : 'mb-2'}`} style={{ color: colors.primary	 }}>Results Summary:</h4>
                  <p className={`${compact ? 'text-xs' : 'text-sm'}`} style={{ color: colors.primary }}>{result.interpretation}</p>
                </div>
                <Button 
                  onClick={resetQuiz} 
                  className="w-full rounded-xl text-white" 
                  style={{ backgroundColor: colors.primary	, borderColor: colors.primary	 }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake Quiz
                </Button>
              </CardContent>
            </Card>
          )}
          <div ref={messagesEndRef} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="p-4 sticky bottom-0 z-10 bg-white/90 backdrop-blur rounded-b-2xl border-t border-gray-200"
        >
          
          {collectingInfo && (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={
                  infoStep === 0 ? "Enter your full name..." :
                  infoStep === 1 ? "Enter your email (e.g., name@example.com)..." :
                  "Enter your phone (e.g., 123-456-7890)..."
                }
                onKeyDown={handleKeyDown}
                className={`flex-1 ${compact ? 'rounded-lg px-2 py-1.5 text-xs' : 'rounded-xl px-4 py-2 text-base'} border border-gray-200 bg-white shadow focus:ring-2 focus:outline-none transition-all duration-150 focus:border-blue-500 focus:ring-blue-200`}
                disabled={isSubmittingLead}
                required
                type={infoStep === 1 ? "email" : infoStep === 2 ? "tel" : "text"}
              />
              <Button 
                onClick={handleInfoSubmit} 
                className={`${compact ? 'rounded-lg px-2 py-1.5' : 'rounded-xl px-4 py-2'} shadow text-white transition-all duration-150 hover:scale-105 active:scale-95`}
                style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
                disabled={isSubmittingLead}
              >
                {isSubmittingLead ? <Loader2 className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} /> : <Send className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />}
              </Button>
            </div>
          )}
          
          {result && quizCompleted && !collectingInfo && (
            <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">{quizData.title.toUpperCase()} Assessment Complete!</span>
            </div>
            <p className="text-sm text-gray-600">Your Result has been successfully submitted to Dr. {doctorProfile?.first_name} {doctorProfile?.last_name}.</p>
          </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default EmbeddedChatBot