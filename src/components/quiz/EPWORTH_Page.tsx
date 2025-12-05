import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MapPin, CheckCircle2, AlertCircle, Moon, Coffee, Car, Brain, Award, Shield } from "lucide-react";
import exhaleLogo from "@/assets/exhale-logo.png";
import drVaughnProfessional from "@/assets/dr-vaughn-professional.png";
import drVaughnCasual from "@/assets/dr-vaughn-casual.png";
import drVaughnBlack from "@/assets/dr-vaughn-black.png";
import heroSleep from "@/assets/sleep-hero-yawning.png";
import sleepYawning from "@/assets/sleep-yawning.png";
import sleepTiredKitchen from "@/assets/sleep-tired-kitchen.jpg";
import sleepTiredDriver from "@/assets/sleep-tired-driver.jpg";
import sleepTiredOffice from "@/assets/sleep-tired-office.jpg";
import sleepTiredLaptop from "@/assets/sleep-tired-laptop.jpg";
import { supabase } from "@/integrations/supabase/client";

interface Template7Props {
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

export const EPWORTH = ({ doctorName, doctorImage, doctorId, physicianId }: Template7Props) => {
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
    ? 'Board-Certified ENT • Sleep Disorder Specialist • 20+ Years Experience' 
    : (physicianData?.credentials?.join(' • ') || 'ENT Specialist');
  const displayBio = isClinicLevel 
    ? 'Dr. Vaughn has helped hundreds of patients overcome sleep apnea and reclaim their energy through comprehensive, minimally-invasive ENT treatments. His expertise spans from conservative management to advanced surgical interventions.'
    : (physicianData?.bio || 'Experienced ENT specialist dedicated to helping patients sleep better.');
  const displayHeadshot = isClinicLevel ? drVaughnProfessional : (physicianData?.headshot_url || drVaughnProfessional);
  const displayNoteImage = isClinicLevel ? drVaughnBlack : (physicianData?.headshot_url || drVaughnBlack);

  const handleTestClick = () => {
    window.open(`${baseUrl}/embed/epworth?${quizParams}`, '_blank');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = 'auto';
    
    const timers = [
      setTimeout(() => window.scrollTo(0, 0), 100),
      setTimeout(() => window.scrollTo(0, 0), 300),
      setTimeout(() => window.scrollTo(0, 0), 500),
      setTimeout(() => window.scrollTo(0, 0), 1000),
    ];
    
    let scrollPreventionActive = true;
    
    const handleScroll = () => {
      if (scrollPreventionActive && window.scrollY > 0) {
        window.scrollTo(0, 0);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    const unlockScroll = setTimeout(() => {
      scrollPreventionActive = false;
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.style.scrollBehavior = '';
    }, 2000);
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      clearTimeout(unlockScroll);
      scrollPreventionActive = false;
      document.documentElement.style.scrollBehavior = '';
      window.removeEventListener('scroll', handleScroll);
    };
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

  return (
    <div 
      className="min-h-screen epworth-custom-theme font-sans"
      style={{
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
      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-2.5 sm:p-3 bg-background/98 backdrop-blur-md border-t border-primary/20 shadow-2xl z-50">
        <Button size="lg" className="w-full text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all" onClick={handleTestClick}>
          Take your Sleepiness Assessment →
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-1.5">HIPAA-compliant • Board-certified ENT</p>
      </div>

      {/* Hero */}
      <section 
        className="relative min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex items-center py-4 sm:py-6 md:py-8 lg:py-12"
        style={{
          backgroundImage: `url(${heroSleep})`,
          backgroundSize: 'cover',
          backgroundPosition: window.innerWidth < 768 ? '70% center' : 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0, 169, 206, 0.65) 0%, rgba(0, 169, 206, 0.70) 100%)' }} />
        <div className="relative z-10 container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center max-w-7xl mx-auto">
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                Board-Certified ENT | 20+ Years Sleep Apnea Experience
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white">
                How's your Sleep?
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-2xl font-medium">
                Take the quick Epworth Sleepiness Test to see if sleep apnea or airway obstruction is affecting your sleep and quality of life.
              </p>
              <Button 
                size="lg" 
                className="text-base md:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-7 w-full sm:w-auto hidden md:inline-flex shadow-2xl hover:shadow-3xl transition-all" 
                onClick={handleTestClick}
              >
                Take your Sleepiness Assessment →
              </Button>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/20 overflow-hidden mt-4 md:mt-0">
              <iframe
                ref={iframeRef}
                src={`/quiz/epworth?${quizParams}`}
                className="w-full transition-all duration-300"
                style={{ height: `${iframeHeight}px`, minHeight: '400px' }}
                title="Epworth Sleepiness Test"
                scrolling="auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Doctor Note */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div className="order-2 md:order-1">
                <img
                  src={displayNoteImage}
                  alt={`Dr. ${displayName}, Board-Certified ENT and Sleep Specialist`}
                  className="w-full max-w-md mx-auto md:max-w-full rounded-lg shadow-lg"
                  loading="lazy"
                />
              </div>
              <div className="order-1 md:order-2 space-y-2 sm:space-y-3 md:space-y-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
                  A Note from Dr. {displayName}
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                  Many of my patients come to me feeling exhausted, despite getting what seems like enough sleep. The Epworth Sleepiness Scale is a quick, validated tool that helps us understand if your daytime fatigue might be related to obstructive sleep apnea or another sleep disorder.
                </p>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                  As a board-certified ENT specialist focusing on sleep disorders, I've helped hundreds of patients reclaim their energy and quality of life through targeted treatments—from simple lifestyle modifications to advanced surgical interventions.
                </p>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                  Take the quick assessment below. If your score suggests a sleep issue, my team will reach out to discuss next steps.
                </p>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-3 sm:mt-4">
                  Let's get you sleeping better again.
                </p>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium">
                  — Dr. {displayName}
                </p>
                <Button
                  asChild 
                  size="lg" 
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base mt-4 sm:mt-6"
                >
                  <a
                    href={`${baseUrl}/embed/epworth?${quizParams}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Start Your Sleepiness Assessment →
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Symptom Checklist */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-center">
              Do Any of These Sound Familiar?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-center text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              Daytime sleepiness isn't just being tired—it can lead to high blood pressure, car accidents, and poor quality of life.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-5 md:p-6 flex items-start space-x-3 sm:space-x-4">
                  <Coffee className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold mb-0.5 sm:mb-1">Always tired, even after 8 hrs?</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Chronic fatigue despite adequate sleep time</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-5 md:p-6 flex items-start space-x-3 sm:space-x-4">
                  <Moon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold mb-0.5 sm:mb-1">Chronic loud snoring disturbing your sleep?</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Partner complains about persistent snoring</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-5 md:p-6 flex items-start space-x-3 sm:space-x-4">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold mb-0.5 sm:mb-1">Waking gasping or choking during sleep?</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Episodes of stopped breathing at night</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-5 md:p-6 flex items-start space-x-3 sm:space-x-4">
                  <Car className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold mb-0.5 sm:mb-1">Nodding off while driving or watching TV?</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Dangerous daytime drowsiness episodes</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-5 md:p-6 flex items-start space-x-3 sm:space-x-4">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold mb-0.5 sm:mb-1">Frequent morning headaches or dry mouth?</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Common signs of sleep-disordered breathing</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-5 md:p-6 flex items-start space-x-3 sm:space-x-4">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold mb-0.5 sm:mb-1">Struggling with focus, memory, or brain fog?</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Cognitive impacts from poor sleep quality</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Patient Story */}
            <Card className="mb-6 sm:mb-8 bg-primary/5 border-primary/20">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl sm:text-2xl">👤</span>
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">Meet Sarah</p>
                    <p className="text-muted-foreground italic mb-2 sm:mb-3 text-xs sm:text-sm md:text-base">
                      "I thought I was just tired from work and raising kids. Turns out, I had moderate sleep apnea. After treatment with Dr. {displayName}, I wake up refreshed and have energy all day. The test took 2 minutes—I wish I'd done it years ago."
                    </p>
                    <p className="text-xs sm:text-sm text-primary font-medium">— Sarah M., Patient since 2022</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button 
                size="lg" 
                className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto" 
                onClick={handleTestClick}
              >
                Take your Sleepiness Assessment →
              </Button>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3">No cost • No obligation • Results reviewed by Dr. {displayName}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-gradient-to-b from-muted/30 to-muted/50">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
              Why Sleep Health Matters
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="bg-background">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3 text-destructive">The Problem</h3>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    Up to 1 in 3 adults have undiagnosed sleep apnea. Untreated sleep disorders increase risk of:
                  </p>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      High blood pressure & heart disease
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      Motor vehicle accidents (3x higher risk)
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      Depression & cognitive decline
                    </li>
                    <li className="flex items-start">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      Reduced quality of life
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3 text-primary">The Solution</h3>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    Early detection and treatment can dramatically improve your health and quality of life:
                  </p>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      Better cardiovascular health
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      Increased energy & focus
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      Improved mood & relationships
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      Enhanced overall well-being
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Image Section - Sleep Deprivation Grid */}
      <section className="py-6 sm:py-8 md:py-12 bg-background">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
            <div className="rounded-lg overflow-hidden shadow-lg aspect-[4/3]">
              <img 
                src={sleepYawning} 
                alt="Woman yawning wrapped in blanket showing extreme fatigue and sleep deprivation" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg aspect-[4/3]">
              <img 
                src={sleepTiredOffice} 
                alt="Person yawning at office desk showing signs of excessive daytime sleepiness" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Treatment Options */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-center">
              Advanced Sleep Treatment Options
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-8 sm:mb-10 text-center max-w-3xl mx-auto">
              Dr. {displayName} specializes in diagnosing and treating structural ENT issues that cause sleep disorders. We offer comprehensive solutions beyond CPAP.
            </p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="hover:shadow-xl transition-shadow">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                    <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3">Non-Surgical Options</h3>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    Conservative treatments for mild-to-moderate sleep apnea.
                  </p>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-3 sm:mb-4">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      Oral Appliances
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      Weight Management
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      CPAP Optimization
                    </li>
                  </ul>
                  <div className="bg-primary/5 p-2 sm:p-3 rounded-lg">
                    <p className="text-xs italic text-muted-foreground">
                      "Lost 15 lbs and use an oral device—no more snoring!" — Mike T.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow border-primary/30">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3">Nasal & Throat Surgery</h3>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    Correct physical blockages causing snoring and apnea.
                  </p>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-3 sm:mb-4">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      Septoplasty
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      Tonsillectomy
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      UPPP (Throat Surgery)
                    </li>
                  </ul>
                  <div className="bg-primary/5 p-2 sm:p-3 rounded-lg">
                    <p className="text-xs italic text-muted-foreground">
                      "Septoplasty changed my life—I can breathe!" — Jennifer L.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3">Advanced Implants</h3>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    Cutting-edge solutions for CPAP-intolerant patients.
                  </p>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-3 sm:mb-4">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      Hypoglossal Nerve Stimulation
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      For moderate-severe apnea
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                      FDA-approved technology
                    </li>
                  </ul>
                  <div className="bg-primary/5 p-2 sm:p-3 rounded-lg">
                    <p className="text-xs italic text-muted-foreground">
                      "I avoided CPAP thanks to Dr. {displayName}'s approach." — Robert K.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-primary/5 border-primary/20 mb-6 sm:mb-8">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-2 sm:mb-3 flex items-center">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3" />
                  Diagnostic Advantage: Drug-Induced Sleep Endoscopy (DISE)
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                  We use advanced DISE technology to pinpoint exactly where your airway collapses during sleep, allowing for targeted, effective treatment planning tailored to your anatomy.
                </p>
              </CardContent>
            </Card>
            
          </div>
        </div>
      </section>

      {/* Image Section - Daytime Sleepiness Impact */}
      <section className="py-6 sm:py-8 md:py-12 bg-background">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
            <div className="rounded-lg overflow-hidden shadow-lg aspect-[4/3]">
              <img 
                src={sleepTiredDriver} 
                alt="Fatigued driver showing the dangers of excessive daytime sleepiness" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg aspect-[4/3]">
              <img 
                src={sleepTiredKitchen} 
                alt="Woman exhausted at kitchen table demonstrating chronic fatigue from sleep disorders" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About the Test */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
              About the Epworth Sleepiness Scale
            </h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center mb-8 sm:mb-10">
              <div>
                <div className="bg-primary/5 rounded-2xl p-4 sm:p-6 md:p-8 text-center mb-4 sm:mb-6">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-1 sm:mb-2">8</div>
                  <div className="text-base sm:text-lg md:text-2xl font-semibold mb-0.5 sm:mb-1">Questions</div>
                  <div className="h-px bg-border my-3 sm:my-4" />
                  <div className="text-3xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">0-24</div>
                  <div className="text-sm sm:text-base md:text-lg font-semibold mb-0.5 sm:mb-1">Your Score Range</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Over 10 = high risk</div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <p className="text-sm sm:text-base md:text-lg">
                  The Epworth Sleepiness Scale (ESS) measures daytime sleepiness using eight simple questions about everyday situations.
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Scores above 10 indicate possible sleep disorders such as OSA, narcolepsy, or insomnia</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Helps determine if further testing is needed</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-xs sm:text-sm md:text-base">It's a screening tool, not a diagnostic test—but a critical first step</span>
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

      {/* Who Should Take This Test */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
              Who Should Take This Test?
            </h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <p className="text-base sm:text-lg mb-4 sm:mb-6">People who:</p>
                  <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base md:text-lg">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span>Drift off during meetings, conversations or driving</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span>Feel fatigued despite "getting sleep"</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span>Snore or have been told they stop breathing at night</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span>Have nasal congestion, allergy issues or prior ENT procedures</span>
                    </li>
                  </ul>
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-background rounded-lg border border-border">
                    <p className="font-semibold text-primary text-sm sm:text-base">Remember:</p>
                    <p className="text-muted-foreground text-xs sm:text-sm md:text-base">Even mild symptoms can point to underlying conditions — early detection matters.</p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="rounded-lg overflow-hidden shadow-lg aspect-[4/3]">
                <img 
                  src={sleepTiredLaptop} 
                  alt="Woman struggling to stay awake at laptop showing daytime sleepiness at work" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credibility Section */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center">
              Why Choose Dr. {displayName} for Your Sleep Health
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-10">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Award className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3">Board-Certified ENT</h3>
                  <p className="text-muted-foreground mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base">
                    Specialized in sleep medicine with 20+ years experience
                  </p>
                  <p className="text-xs sm:text-sm text-primary font-medium">
                    American Academy of Sleep Medicine
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Brain className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3">Advanced Technology</h3>
                  <p className="text-muted-foreground mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base">
                    State-of-the-art diagnostics including DISE
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
                    Personalized treatment plans for your unique needs
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
                    <p className="text-primary font-semibold mb-2 sm:mb-3 text-xs sm:text-sm md:text-base">
                      {displayCredentials}
                    </p>
                    <p className="text-muted-foreground mb-2 sm:mb-3 text-xs sm:text-sm md:text-base">
                      {displayBio}
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        <span>Sleep Apnea Specialist</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        <span>DISE Expert</span>
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
                    What is a "normal" Epworth score?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    A score of 0-10 is considered normal. Scores above 10 suggest excessive daytime sleepiness and may indicate a sleep disorder that requires evaluation. Scores above 16 indicate severe excessive daytime sleepiness.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    What happens after I take the test?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    After completing the Epworth Sleepiness Scale, you'll receive instant results. If your score indicates potential sleep issues, Dr. {doctorName}'s team will reach out to discuss your results and recommend next steps, which may include an in-person consultation or sleep study.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    If my score is high, do I need a sleep study?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    A high Epworth score indicates you should consult with Dr. {doctorName} for a comprehensive evaluation. Depending on your symptoms and medical history, he may recommend a sleep study or other diagnostic tests to determine the cause of your daytime sleepiness.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    How long does recovery from sleep surgery take?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    Recovery times vary by procedure. Minor nasal procedures like septoplasty typically require 1-2 weeks of recovery, while more extensive surgeries may need 2-4 weeks. Dr. {doctorName} specializes in minimally-invasive techniques to minimize downtime and discomfort.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    Is nasal surgery relevant to sleep apnea and daytime sleepiness?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    Absolutely. Nasal obstruction can contribute significantly to sleep apnea and poor sleep quality. Procedures like septoplasty or turbinate reduction can improve airflow, reduce snoring, and enhance the effectiveness of other sleep apnea treatments like CPAP.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    Is this covered by my insurance?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    Most diagnostic sleep evaluations and treatments for medically-necessary sleep disorders are covered by insurance. We accept most major insurance plans and our team will verify your coverage before any procedures. The Epworth test itself is free and requires no insurance.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    What is obstructive sleep apnea (OSA)?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    OSA is a condition where the airway repeatedly collapses during sleep, causing breathing interruptions. This leads to poor sleep quality, daytime fatigue, and increased health risks. Treatment options range from lifestyle changes and CPAP therapy to surgical interventions.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    What are the risks of untreated sleep apnea?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    Untreated sleep apnea increases risk of high blood pressure, heart disease, stroke, diabetes, and accidents due to daytime sleepiness. It also affects quality of life, mood, and cognitive function. Early diagnosis and treatment significantly reduce these risks.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9" className="border rounded-lg px-3 sm:px-4 md:px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    What if I can't tolerate CPAP?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base pb-3 sm:pb-4">
                    Many patients struggle with CPAP. Alternative treatments include oral appliances, positional therapy, nasal surgery to improve airflow, and advanced procedures like hypoglossal nerve stimulation. We'll work with you to find the most effective and comfortable solution.
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
                  2. <strong className="text-foreground">Johns Hopkins Medicine</strong> — Original Epworth Sleepiness Scale development and validation.
                </p>
                <p>
                  3. <strong className="text-foreground">American Academy of Sleep Medicine</strong> — Sleep disorders and diagnostic criteria:{" "}
                  <a 
                    href="https://aasm.org/" 
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://aasm.org/
                  </a>
                </p>
                <p>
                  4. <strong className="text-foreground">National Sleep Foundation</strong> — Sleep health information and resources:{" "}
                  <a 
                    href="https://www.thensf.org/" 
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://www.thensf.org/
                  </a>
                </p>
                <p>
                  5. <strong className="text-foreground">Mayo Clinic</strong> — Sleep apnea diagnosis and treatment:{" "}
                  <a 
                    href="https://www.mayoclinic.org/diseases-conditions/sleep-apnea" 
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://www.mayoclinic.org/diseases-conditions/sleep-apnea
                  </a>
                </p>
                <p>
                  6. <strong className="text-foreground">American Academy of Otolaryngology</strong> — ENT and sleep disorders:{" "}
                  <a 
                    href="https://www.enthealth.org" 
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://www.enthealth.org
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-gradient-to-b from-primary/5 to-primary/10">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              Don't Let Fatigue Control Your Life
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
              Take our free 2-minute test and start breathing better tomorrow.
            </p>
            <Button 
              size="lg" 
              className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto" 
              onClick={handleTestClick}
            >
              Take your Sleepiness Assessment →
            </Button>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-muted-foreground pt-3 sm:pt-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>No cost, no obligation</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>Results reviewed by Dr. {displayName}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>HIPAA-compliant</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>Board-certified ENT</span>
              </div>
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
              <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">
                Exhale Sinus, TMJ, Headache & Sleep
              </h3>
              <p className="text-xs sm:text-sm text-background/70">
                Expert care for nasal obstruction, chronic sinus infections, and ENT conditions in Schaumburg, Illinois.
              </p>
            </div>

            {/* Location */}
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Location</h4>
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
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h4>
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
  );
};
