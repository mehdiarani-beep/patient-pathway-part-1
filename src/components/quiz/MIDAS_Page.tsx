import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Phone, Calendar, Brain, Lightbulb, AlertCircle, CheckCircle2, MapPin, Award, Shield } from "lucide-react";
import exhaleLogo from "@/assets/exhale-logo.png";
import drVaughnCasual from "@/assets/dr-vaughn-casual.png";
import drVaughnBlack from "@/assets/dr-vaughn-black.png";
import drVaughnProfessionalHeadshot from "@/assets/dr-vaughn-professional-headshot.png";
import heroMigraine from "@/assets/hero-migraine.png";
import migraineLyingDown from "@/assets/migraine-lying-down.png";
import migraineForehead from "@/assets/migraine-forehead.png";
import migraineCloseup from "@/assets/migraine-closeup.png";
import migraineDistressed from "@/assets/migraine-distressed.png";
import migraineMan from "@/assets/migraine-man.png";
import migraineHomeOffice from "@/assets/migraine-home-office.png";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  generateMedicalWebPageSchema,
  generateMedicalTestSchema,
  generateFAQSchema,
  generatePhysicianSchema,
} from "@/components/seo/schemas/medicalSchemas";

interface Template6Props {
  doctorName: string;
  doctorImage: string;
  doctorId?: string;
  physicianId?: string;
}

interface PhysicianData {
  id: string;
  first_name: string;
  last_name: string;
  degree_type: string;
  credentials: string[] | null;
  bio: string | null;
  headshot_url: string | null;
}

export const MIDAS = ({ doctorName, doctorImage, doctorId, physicianId }: Template6Props) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [iframeHeight, setIframeHeight] = useState<number>(480);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [physicianData, setPhysicianData] = useState<PhysicianData | null>(null);
  const [isClinicLevel, setIsClinicLevel] = useState<boolean>(true);

  // Build dynamic URLs
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const physicianParam = physicianId && physicianId !== doctorId ? `&physician=${physicianId}` : '';
  const quizParams = `doctor=${doctorId || '192eedfe-92fd-4306-a272-4c06c01604cf'}&source=website&utm_source=website&utm_medium=web&utm_campaign=quiz_share${physicianParam}`;

  // Fetch physician data
  useEffect(() => {
    const fetchData = async () => {
      const isClinic = !physicianId || physicianId === doctorId;
      setIsClinicLevel(isClinic);
      
      if (!isClinic && physicianId) {
        const { data: physician, error } = await supabase
          .from('clinic_physicians')
          .select('id, first_name, last_name, degree_type, credentials, bio, headshot_url')
          .eq('id', physicianId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (!error && physician) {
          setPhysicianData(physician as PhysicianData);
        }
      }
    };
    
    fetchData();
  }, [doctorId, physicianId]);

  // Display values
  const displayName = isClinicLevel ? doctorName : (physicianData?.last_name || doctorName);
  const displayFullName = isClinicLevel ? 'Ryan C. Vaughn' : `${physicianData?.first_name || ''} ${physicianData?.last_name || ''}`.trim();
  const displayDegree = isClinicLevel ? 'MD' : (physicianData?.degree_type || 'MD');
  const displayCredentials = isClinicLevel 
    ? 'Board-Certified ENT • Migraine & Headache Specialist • 20+ Years Experience' 
    : (physicianData?.credentials?.join(' • ') || 'ENT Specialist');
  const displayBio = isClinicLevel 
    ? 'Many patients live for years with untreated migraines, thinking their headaches are "normal" — when in fact, they\'re not. Dr. Vaughn specializes in comprehensive migraine care, offering solutions from lifestyle changes and supplements to prescription therapy and in-office migraine relief procedures.'
    : (physicianData?.bio || 'Experienced ENT specialist dedicated to helping patients find migraine relief.');
  const displayHeadshot = isClinicLevel ? drVaughnProfessionalHeadshot : (physicianData?.headshot_url || drVaughnProfessionalHeadshot);
  const displayNoteImage = isClinicLevel ? drVaughnBlack : (physicianData?.headshot_url || drVaughnBlack);

  // Detect mobile and update on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dynamic iframe height adjustment
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object' && event.data.type === 'resize') {
        const newHeight = event.data.height || 480;
        setIframeHeight(newHeight);
      } else if (typeof event.data === 'number' && event.data > 0) {
        setIframeHeight(event.data);
      }
    };

    window.addEventListener('message', handleMessage);

    const iframe = iframeRef.current;
    if (iframe) {
      const resizeObserver = new ResizeObserver(() => {
        try {
          const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDocument && iframeDocument.body) {
            const contentHeight = iframeDocument.body.scrollHeight;
            if (contentHeight > 0) {
              setIframeHeight(contentHeight + 20);
            }
          }
        } catch (e) {
          // Cross-origin restrictions - rely on postMessage
        }
      });

      resizeObserver.observe(iframe);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('message', handleMessage);
      };
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // Prevent auto-scroll to embedded iframe - mobile-friendly approach
    window.scrollTo(0, 0);
    
    const timers = [
      setTimeout(() => window.scrollTo(0, 0), 100),
      setTimeout(() => window.scrollTo(0, 0), 300),
      setTimeout(() => window.scrollTo(0, 0), 500),
      setTimeout(() => window.scrollTo(0, 0), 1000),
    ];
    
    // Scroll lock for 2 seconds
    const handleScroll = () => {
      window.scrollTo(0, 0);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    const unlockTimer = setTimeout(() => {
      window.removeEventListener('scroll', handleScroll);
    }, 2000);
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      clearTimeout(unlockTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Generate SEO structured data
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const seoTitle = isClinicLevel 
    ? `Migraine Assessment (MSQ) | Free Migraine Impact Questionnaire`
    : `Migraine Assessment (MSQ) | Dr. ${displayFullName}, ${displayDegree} | Headache Specialist`;
  const seoDescription = `Take the free Migraine-Specific Quality of Life Questionnaire (MSQ) to measure how migraines affect your daily life. Board-certified ENT Dr. ${displayName} specializes in comprehensive migraine treatment.`;
  
  const structuredData = [
    generateMedicalWebPageSchema({
      name: seoTitle,
      description: seoDescription,
      url: currentUrl,
      specialty: 'Headache Medicine',
      physician: { name: `Dr. ${displayFullName}`, credentials: displayCredentials },
    }),
    generateMedicalTestSchema({
      name: 'Migraine-Specific Quality of Life Questionnaire (MSQ)',
      description: 'A validated assessment tool measuring how migraines impact daily activities, work productivity, and quality of life.',
      url: currentUrl,
      usedToDiagnose: ['Migraine', 'Chronic Migraine', 'Tension Headache', 'Cluster Headache'],
    }),
    generateFAQSchema([
      { question: 'What is the MSQ assessment?', answer: 'The Migraine-Specific Quality of Life Questionnaire (MSQ) is a clinically-validated tool that measures how migraines affect your daily functioning, work, and social activities.' },
      { question: 'What does my MSQ score mean?', answer: 'Higher scores indicate greater migraine impact on quality of life. A score of 0-7 is minimal impact, 8-14 is mild, 15-21 is moderate, and 22-28 indicates severe migraine impact requiring treatment.' },
      { question: 'When should I see a doctor for migraines?', answer: 'You should consult a doctor if you experience frequent headaches, migraines that interfere with daily activities, or headaches accompanied by vision changes, numbness, or severe symptoms.' },
    ]),
  ];

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={currentUrl}
        keywords="migraine assessment, MSQ questionnaire, migraine impact test, headache evaluation, chronic migraine screening, migraine specialist ENT"
        structuredData={structuredData}
      />
      <div 
        className="min-h-screen midas-custom-theme font-sans"
        style={{
          // Custom color overrides for MIDAS page only (from Exhale Sinus design system)
          '--primary': '191 100% 40%',
          '--primary-foreground': '0 0% 100%',
          '--secondary': '191 100% 50%',
          '--secondary-foreground': '0 0% 100%',
          '--accent': '191 100% 40%',
          '--accent-foreground': '0 0% 100%',
          '--muted': '210 40% 96%',
          '--muted-foreground': '210 16% 45%',
          '--ring': '203 89% 20%',
          '--background': '0 0% 100%',
          '--foreground': '210 24% 16%',
          '--card': '0 0% 100%',
          '--card-foreground': '210 24% 16%',
          '--border': '210 25% 88%',
          '--destructive': '0 84% 60%',
          '--destructive-foreground': '0 0% 100%',
          // Custom gradients
          '--gradient-hero': 'linear-gradient(135deg, hsl(191 100% 40%) 0%, hsl(191 100% 50%) 100%)',
          '--gradient-cta': 'linear-gradient(135deg, hsl(191 100% 40%) 0%, hsl(191 100% 35%) 100%)',
          '--gradient-hero-overlay': 'linear-gradient(135deg, rgba(0, 169, 206, 0.85) 0%, rgba(0, 169, 206, 0.90) 100%)',
          // Custom shadows
          '--shadow-soft': '0 4px 24px -4px hsl(203 89% 20% / 0.12)',
          '--shadow-card': '0 8px 32px -8px hsl(203 89% 20% / 0.18)',
          // Transitions
          '--transition-smooth': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          // Font family
          fontFamily: 'Inter, sans-serif',
        } as React.CSSProperties}
      >
        {/* Hero Section */}
        <section 
          className="relative min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex items-center py-4 sm:py-6 md:py-8 lg:py-12"
          style={{ 
            backgroundImage: `url(${heroMigraine})`,
            backgroundSize: 'cover',
            backgroundPosition: window.innerWidth < 768 ? 'center' : 'center',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0, 169, 206, 0.65) 0%, rgba(0, 169, 206, 0.70) 100%)' }} />
        <div className="relative z-10 container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center max-w-7xl mx-auto">
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                Board-Certified ENT | Migraine & Headache Specialist
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white">
                Is it just a headache or a migraine?
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-2xl font-medium">
                Recurring headaches, sensitivity to light, and disrupted daily routines may be signs of 
                something more serious than a standard headache. Take our quick quiz to learn whether 
                migraines are affecting your quality of life — and what to do next.
              </p>
              <Button 
                size="lg" 
                className="text-base md:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-7 w-full sm:w-auto hidden md:inline-flex shadow-2xl hover:shadow-3xl transition-all" 
                onClick={() => window.open(`${baseUrl}/embed/midas?${quizParams}`, '_blank')}
              >
                Start the Migraine Assessment
              </Button>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/20 overflow-hidden mt-4 md:mt-0">
              <iframe
                ref={iframeRef}
                src={`/quiz/midas?${quizParams}`}
                className="w-full transition-all duration-300"
                style={{ height: `${iframeHeight}px`, minHeight: '400px' }}
                title="MSQ Assessment"
                scrolling="auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-2.5 sm:p-3 md:p-4 bg-background/95 backdrop-blur-sm border-t border-border z-50">
        <Button 
          className="w-full text-sm sm:text-base"
          size="lg"
          onClick={() => window.open(`${baseUrl}/embed/midas?${quizParams}`, '_blank')}
        >
          Start the Migraine Assessment
        </Button>
      </div>

      {/* Note from Dr. Section */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 bg-background">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
              {/* Left Column - Doctor Image */}
              <div className="relative order-2 md:order-1">
                <img 
                  src={displayNoteImage}
                  alt={`Dr. ${displayName}`}
                  className="w-full max-w-md mx-auto md:max-w-full rounded-lg shadow-xl"
                  loading="lazy"
                />
              </div>

              {/* Right Column - Note */}
              <div className="order-1 md:order-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 md:mb-6">
                  A Note from Dr. {displayName}
                </h2>
                <div className="space-y-2 sm:space-y-3 md:space-y-4 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                  <p>
                    Many patients live for years with debilitating migraines, thinking their headaches are 
                    "normal" — when in fact, they're not. As a board-certified ENT with over 20 years of 
                    experience treating migraines and headaches, I've helped thousands of patients find 
                    lasting relief.
                  </p>
                  <p>
                    Whether you're experiencing occasional migraines or chronic daily headaches, effective 
                    treatment is available. From lifestyle modifications and preventive medications to 
                    advanced in-office procedures like nerve blocks and Botox therapy, we offer a comprehensive 
                    approach tailored to your specific needs.
                  </p>
                  <p>
                    The Migraine-Specific Quality of Life Questionnaire (MSQ) is a clinically-validated tool that helps us understand how migraines 
                    are impacting your daily life. Take the quiz to get started on your path to relief.
                  </p>
                  <p className="font-normal text-foreground">
                    Let's help you find lasting relief.
                  </p>
                  <p className="italic">
                    — Dr. {displayName}
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="mt-4 sm:mt-6 md:mt-8 w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => window.open(`${baseUrl}/embed/midas?${quizParams}`, '_blank')}
                >
                  Start your Migraine Assessment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Educational Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 sm:mb-4">
            What Is a Migraine?
          </h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto text-sm sm:text-base">
            Understanding the difference between regular headaches and migraines
          </p>

          {/* Featured Image - Mobile Optimized */}
          <div className="max-w-4xl mx-auto mb-8 sm:mb-10 md:mb-12">
            <img 
              src={migraineLyingDown}
              alt="Person experiencing migraine symptoms"
              className="w-full rounded-lg shadow-lg object-cover max-h-[300px] sm:max-h-[400px]"
              loading="lazy"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Migraine Overview */}
            <Card>
              <CardContent className="p-4 sm:p-6 md:p-8">
                {/* Image for visual impact */}
                <div className="mb-4 sm:mb-6">
                  <img 
                    src={migraineHomeOffice}
                    alt="Person experiencing migraine at home"
                    className="w-full rounded-lg object-cover max-h-[200px] sm:max-h-[250px]"
                    loading="lazy"
                  />
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Migraine Overview</h3>
                </div>
                <div className="space-y-3 sm:space-y-4 text-muted-foreground text-sm sm:text-base">
                  <p>
                    A migraine is more than "just a headache" — it's a neurological condition that 
                    can significantly impact your daily life.
                  </p>
                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Can last anywhere from hours to days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>May include nausea, vomiting, or visual aura</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Often accompanied by neck pain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Sensitivity to sound, light, or smells</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Symptoms & Triggers */}
            <Card>
              <CardContent className="p-4 sm:p-6 md:p-8">
                {/* Image for visual impact */}
                <div className="mb-4 sm:mb-6">
                  <img 
                    src={migraineForehead}
                    alt="Person with migraine symptoms"
                    className="w-full rounded-lg object-cover max-h-[200px] sm:max-h-[250px]"
                    loading="lazy"
                  />
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Symptoms & Triggers</h3>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h4 className="font-normal text-base sm:text-lg mb-2 sm:mb-3 text-foreground">Common Symptoms:</h4>
                    <ul className="space-y-1.5 sm:space-y-2 text-muted-foreground text-xs sm:text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Pulsating head pain (often one-sided)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Light or sound sensitivity</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Nausea or vomiting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Visual disturbances (aura)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Difficulty concentrating</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-normal text-base sm:text-lg mb-2 sm:mb-3 text-foreground">Common Triggers:</h4>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Hormonal changes, stress, poor sleep, certain foods, weather changes, and dehydration
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-6 sm:mt-8">
            <Button 
              size="lg"
              className="w-full sm:w-auto text-sm sm:text-base"
              onClick={() => window.open(`${baseUrl}/embed/midas?${quizParams}`, '_blank')}
            >
              Start your Migraine Assessment
            </Button>
          </div>
        </div>
      </section>

      {/* About the MSQ */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
              About Migraine-Specific Quality of Life Questionnaire (MSQ)
            </h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center mb-8 sm:mb-10">
              <div>
                <div className="bg-primary/5 rounded-2xl p-4 sm:p-6 md:p-8 text-center mb-4 sm:mb-6">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-1 sm:mb-2">7</div>
                  <div className="text-base sm:text-lg md:text-2xl font-normal mb-0.5 sm:mb-1">Questions</div>
                  <div className="h-px bg-border my-3 sm:my-4" />
                  <div className="text-3xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">3</div>
                  <div className="text-sm sm:text-base md:text-lg font-normal mb-0.5 sm:mb-1">Key Life Domains</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Function & Emotional Impact</div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <p className="text-sm sm:text-base md:text-lg">
                  The MSQ assesses how migraines affect your daily activities, work productivity, and emotional well-being across three validated domains.
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Measures role function (restrictive and preventive) and emotional function</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Helps guide personalized treatment plans</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Higher scores indicate better quality of life—a key metric for tracking improvement</span>
                  </li>
                </ul>
                <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-medium">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1 text-amber-600" />
                      <strong>Disclaimer:</strong> This test is a screening tool, not a medical diagnosis. Results will be reviewed by Dr. {displayName}'s team.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Treatment Options Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 sm:mb-4">
              Migraine Treatment Options
            </h2>
            <p className="text-center text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto text-sm sm:text-base">
              We offer a comprehensive approach to migraine management, tailored to your specific needs
            </p>

            {/* Treatment Hero Images - Side by side on desktop, stacked on mobile */}
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10 md:mb-12">
              <img 
                src={migraineCloseup}
                alt="Migraine relief treatment"
                className="w-full rounded-lg shadow-lg object-cover h-[250px] sm:h-[300px]"
                loading="lazy"
              />
              <img 
                src={migraineMan}
                alt="Patient receiving migraine treatment"
                className="w-full rounded-lg shadow-lg object-cover h-[250px] sm:h-[300px]"
                loading="lazy"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12">
              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <Lightbulb className="h-6 w-6 sm:h-7 sm:h-7 md:h-8 md:w-8 text-primary" />
                    <h3 className="text-base sm:text-lg md:text-xl font-bold">Lifestyle & Prevention</h3>
                  </div>
                  <ul className="space-y-2 sm:space-y-3 text-muted-foreground text-xs sm:text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Diet modifications:</strong> Identifying and avoiding trigger foods</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Hydration:</strong> Maintaining proper fluid intake</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Sleep hygiene:</strong> Establishing consistent sleep patterns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Stress management:</strong> Relaxation and mindfulness techniques</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <Brain className="h-6 w-6 sm:h-7 sm:h-7 md:h-8 md:w-8 text-primary" />
                    <h3 className="text-base sm:text-lg md:text-xl font-bold">Medication Therapy</h3>
                  </div>
                  <ul className="space-y-2 sm:space-y-3 text-muted-foreground text-xs sm:text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Acute treatment:</strong> Medications to stop migraines when they start</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Preventive therapy:</strong> Daily medications to reduce frequency</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>Supplements:</strong> Magnesium, riboflavin, CoQ10</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span><strong>CGRP inhibitors:</strong> Latest generation migraine prevention</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-center">In-Office Advanced Treatments</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                    </div>
                    <h4 className="font-normal mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">Nerve Blocks</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Occipital and other targeted nerve blocks</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                    </div>
                    <h4 className="font-normal mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">SPG Blocks</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Sphenopalatine ganglion procedures</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                    </div>
                    <h4 className="font-normal mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">Botox Therapy</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">FDA-approved for chronic migraines</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                    </div>
                    <h4 className="font-normal mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">Trigger Point Injections</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Relief for muscle-related headaches</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Dr. */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center">
              Why Choose Dr. {displayName} for Your Migraine Treatment
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-10">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Award className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3">Board-Certified ENT</h3>
                  <p className="text-muted-foreground mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base">
                    Fellowship-trained with 20+ years treating migraines and headaches
                  </p>
                  <p className="text-xs sm:text-sm text-primary font-medium">
                    Comprehensive diagnostic approach
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Brain className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3">Full Treatment Spectrum</h3>
                  <p className="text-muted-foreground mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base">
                    From conservative care to advanced in-office procedures
                  </p>
                  <p className="text-xs sm:text-sm text-primary font-medium">
                    Personalized treatment plans
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Shield className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3">Patient-Centered Care</h3>
                  <p className="text-muted-foreground mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base">
                    Thousands helped across Chicagoland area
                  </p>
                  <p className="text-xs sm:text-sm text-primary font-medium">
                    Most insurance plans accepted
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden shadow-lg flex-shrink-0">
                    <img 
                      src={displayHeadshot}
                      alt={`${displayFullName}, ${displayDegree}`}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: '50% 45%', transform: isClinicLevel ? 'scale(1.35)' : 'scale(1)' }}
                      loading="lazy"
                    />
                  </div>
                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5 sm:mb-2">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold">{displayFullName}, {displayDegree}</h3>
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <p className="text-primary font-normal mb-2 sm:mb-3 text-xs sm:text-sm md:text-base">
                      {displayCredentials}
                    </p>
                    <p className="text-muted-foreground mb-2 sm:mb-3 text-xs sm:text-sm md:text-base">
                      {displayBio}
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        <span>Migraine Specialist</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        <span>In-Office Procedures</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        <span>Minimally-Invasive Care</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ and References */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
            {/* FAQ Column */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-foreground">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    Is a migraine the same as a headache?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    No. While all migraines involve head pain, not all headaches are migraines. Migraines are 
                    a specific neurological condition with distinct symptoms like nausea, light sensitivity, 
                    and often visual disturbances. Regular headaches are typically less severe and don't include 
                    these additional symptoms.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    Do I need a CT or MRI?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    Most migraine patients don't need brain imaging. However, if you have sudden severe headaches, 
                    new neurological symptoms, or headaches that don't respond to treatment, imaging may be 
                    recommended to rule out other conditions. We'll evaluate your specific situation during 
                    your consultation.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    What if medications haven't helped?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    Many patients find relief through alternative approaches when traditional medications don't 
                    work. We offer nerve blocks, Botox therapy, SPG blocks, and other in-office procedures. 
                    We also explore lifestyle modifications, supplements, and newer medication classes like 
                    CGRP inhibitors. There are many options beyond traditional painkillers.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    How long does treatment take to work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    It varies by treatment. Acute medications work within hours, while preventive medications 
                    may take 2-3 months to show full effect. In-office procedures like nerve blocks can provide 
                    relief within days. We'll create a realistic timeline based on your treatment plan.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    Are migraines hereditary?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    Yes, migraines often run in families. If one parent has migraines, there's a 40% chance 
                    their child will develop them. If both parents have migraines, the risk increases to 90%. 
                    However, environmental factors and triggers also play a significant role.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    What are CGRP inhibitors?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    CGRP (Calcitonin Gene-Related Peptide) inhibitors are a newer class of migraine prevention medications. 
                    They work by blocking CGRP, a protein involved in migraine attacks. These medications have shown 
                    significant effectiveness with fewer side effects than traditional preventive treatments.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    Is Botox effective for migraines?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    Yes. Botox (onabotulinumtoxinA) is FDA-approved for chronic migraines (15+ headache days per month). 
                    It's administered as a series of small injections around the head and neck every 12 weeks. Many patients 
                    experience significant reduction in migraine frequency and severity.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    Will my insurance cover migraine treatment?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    Most insurance plans cover medically necessary migraine treatments, including preventive medications, 
                    Botox for chronic migraines, and nerve block procedures. We accept most major insurance and will work 
                    with your provider to verify coverage.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* References Column */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-foreground">
                References
              </h2>
              <div className="space-y-3 sm:space-y-4 text-muted-foreground text-xs sm:text-sm md:text-base">
                <p>
                  1. <strong className="text-foreground">Exhale Sinus & Facial Pain Center</strong> — practice information:{" "}
                  <a 
                    href="https://www.exhalesinus.com/" 
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://www.exhalesinus.com/
                  </a>
                </p>
                <p>
                  2. <strong className="text-foreground">American Migraine Foundation</strong> — Migraine information and resources:{" "}
                  <a 
                    href="https://americanmigrainefoundation.org/" 
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://americanmigrainefoundation.org/
                  </a>
                </p>
                <p>
                  3. <strong className="text-foreground">National Headache Foundation</strong> — Headache and migraine education:{" "}
                  <a 
                    href="https://headaches.org/" 
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://headaches.org/
                  </a>
                </p>
                <p>
                  4. <strong className="text-foreground">FDA</strong> — CGRP inhibitors approved for migraine prevention (erenumab, fremanezumab, galcanezumab, eptinezumab).
                </p>
                <p>
                  5. <strong className="text-foreground">FDA label: OnabotulinumtoxinA (Botox®)</strong> — Approved for chronic migraine prevention (≥15 headache days/month).
                </p>
                <p>
                  6. <strong className="text-foreground">Mayo Clinic</strong> — Migraine diagnosis and treatment:{" "}
                  <a 
                    href="https://www.mayoclinic.org/diseases-conditions/migraine-headache" 
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://www.mayoclinic.org/diseases-conditions/migraine-headache
                  </a>
                </p>
                <p>
                  7. <strong className="text-foreground">International Classification of Headache Disorders (ICHD-3)</strong> — Diagnostic criteria for migraines and headache disorders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 md:mb-6 text-foreground">
              Ready to Find Relief?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-4 sm:mb-6 md:mb-8">
              Don't let migraines control your life any longer. Take the first step toward lasting relief today.
            </p>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={() => window.open(`${baseUrl}/embed/midas?${quizParams}`, '_blank')}
                className="w-full sm:w-auto text-sm sm:text-base md:text-lg py-5 sm:py-6 md:py-7 px-5 sm:px-6 md:px-8"
              >
                Start your Migraine Assessment
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-8 sm:py-10 md:py-12 mb-16 md:mb-0">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12 max-w-6xl mx-auto">
            {/* Logo and Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <img 
                src={exhaleLogo} 
                alt="Exhale Sinus" 
                className="h-12 sm:h-14 md:h-16 mb-3 sm:mb-4 brightness-0 invert"
                loading="lazy"
              />
              <h3 className="text-base sm:text-lg font-normal mb-1.5 sm:mb-2">
                Exhale Sinus, TMJ, Headache & Sleep
              </h3>
              <p className="text-xs sm:text-sm text-background/70">
                Expert care for migraines, headaches, and ENT conditions in Schaumburg, Illinois.
              </p>
            </div>

            {/* Location */}
            <div>
              <h4 className="text-base sm:text-lg font-base mb-3 sm:mb-4">Location</h4>
              <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-1 flex-shrink-0" />
                  <div>
                    <div>814 E Woodfield</div>
                    <div>Schaumburg, IL 60173</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-1 flex-shrink-0" />
                  <div>
                    <div>735 N. Perryville Rd. Suite 4</div>
                    <div>Rockford, IL 61107</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-base sm:text-lg font-normal mb-3 sm:mb-4">Quick Links</h4>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <a 
                  href="https://www.exhalesinus.com/request-an-appointment" 
                  className="block hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Request an Appointment
                </a>
                <a 
                  href="https://www.exhalesinus.com/" 
                  className="block hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Exhale Sinus Website
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-background/20 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-background/70">
            <p>&copy; {new Date().getFullYear()} Exhale Sinus, TMJ, Headache & Sleep. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};