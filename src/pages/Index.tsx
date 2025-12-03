import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ShadowOverlay from "@/components/ui/shadowOverlay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Stethoscope, 
  Microscope, 
  Wind, 
  Headphones, 
  Moon, 
  RotateCcw, 
  Bed, 
  Droplet,
  Zap,
  Target,
  Rocket,
  ChevronDown
} from 'lucide-react';

const quizzes = [
  {
    title: 'SNOT-22 Assessment',
    description: 'A comprehensive evaluation tool for chronic rhinosinusitis symptoms. This 22-question assessment measures the impact of nasal and sinus symptoms on your quality of life, including nasal blockage, facial pain, sleep disturbances, and emotional impact. Used by ENT specialists worldwide to track treatment progress and symptom severity.',
    questions: 22,
    maxScore: 110,
    icon: <Stethoscope className="w-12 h-12 text-blue-600" />,
  },
  {
    title: 'SNOT-12 Assessment',
    description: 'A streamlined version of the SNOT-22, focusing on the most critical symptoms of chronic rhinosinusitis. This 12-question assessment provides a quick yet accurate evaluation of nasal and sinus symptoms, making it ideal for routine check-ups and treatment monitoring. Perfect for patients who need regular symptom tracking.',
    questions: 12,
    maxScore: 60,
    icon: <Microscope className="w-12 h-12 text-blue-600" />,
  },
  {
    title: 'NOSE Scale Assessment',
    description: 'The Nasal Obstruction Symptom Evaluation (NOSE) scale is a validated tool for assessing nasal breathing difficulties. This 5-question assessment helps quantify the severity of nasal obstruction and its impact on daily activities, sleep, and exercise. Essential for evaluating treatment effectiveness and surgical outcomes.',
    questions: 5,
    maxScore: 100,
    icon: <Wind className="w-12 h-12 text-blue-600" />,
  },
  {
    title: 'HHIA',
    description: 'The Hearing Handicap Inventory for Adults (HHIA) is a comprehensive 25-question assessment that evaluates the psychosocial impact of hearing loss. It measures emotional and social consequences, helping healthcare providers understand how hearing difficulties affect daily life, relationships, and emotional well-being.',
    questions: 25,
    maxScore: 100,
    icon: <Headphones className="w-12 h-12 text-blue-600" />,
  },
  {
    title: 'Epworth Sleepiness Scale',
    description: 'A widely used 8-question assessment that measures daytime sleepiness and helps identify potential sleep disorders. This scale evaluates your likelihood of falling asleep in various situations, providing valuable insights for diagnosing conditions like sleep apnea, narcolepsy, and other sleep-related disorders.',
    questions: 8,
    maxScore: 24,
    icon: <Moon className="w-12 h-12 text-blue-600" />,
  },
  {
    title: 'DHI',
    description: 'The Dizziness Handicap Inventory (DHI) is a 25-question assessment that evaluates the impact of dizziness and balance problems on daily life. It measures physical, emotional, and functional aspects of dizziness, helping healthcare providers develop targeted treatment plans and track recovery progress.',
    questions: 25,
    maxScore: 100,
    icon: <RotateCcw className="w-12 h-12 text-blue-600" />,
  },
  {
    title: 'STOP-Bang',
    description: 'A concise 8-question screening tool for obstructive sleep apnea (OSA). This assessment evaluates key risk factors including snoring, tiredness, observed apneas, blood pressure, BMI, age, neck circumference, and gender. Essential for early detection and management of sleep-related breathing disorders.',
    questions: 8,
    maxScore: 8,
    icon: <Bed className="w-12 h-12 text-blue-600" />,
  },
  {
    title: 'TNSS',
    description: 'The Total Nasal Symptom Score (TNSS) is a focused 4-question assessment that evaluates the severity of nasal symptoms including congestion, rhinorrhea, sneezing, and nasal itching. This tool helps track symptom changes over time and assess the effectiveness of treatments for allergic and non-allergic rhinitis.',
    questions: 4,
    maxScore: 12,
    icon: <Droplet className="w-12 h-12 text-blue-600" />,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  const handleLogin = () => {
    navigate('/auth?mode=login');
  };

  const handleSignup = () => {
    navigate('/auth?mode=signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-auto">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 right-0 z-50 bg-white/50 backdrop-blur-md border-b border-gray-100 transition-all duration-300 ${
          isScrolled ? 'shadow-lg' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-2 py-4 justify-between items-center">
          <div className="flex flex-col items-center">
            <img 
              src="/patient-pathway-logo.jpeg" 
              alt="Patient Pathway" 
              className="h-20 w-auto object-contain rounded-sm shadow-lg mb-2" 
            />
            <span className="text-xl font-semibold bg-gradient-to-r from-[#f7904f] to-[#04748f] bg-clip-text text-transparent">
              Patient Pathway
            </span>
          </div>
        </div>
      </motion.nav>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button 
              className="bg-black hover:from-black hover:to-[#03657a] text-white text-xl px-10 py-10 rounded-full transition-all duration-300 border-2 border-solid border-white shadow-lg hover:shadow-xl transform hover:scale-110 mx-5"
              onClick={handleLogin}
            >
              Log In
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
