import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Phone, Calendar, Moon, Lightbulb, AlertCircle, CheckCircle2, MapPin, Award, Shield, Loader2, Pencil, Bed, Brain } from "lucide-react";
import exhaleLogo from "@/assets/exhale-logo.png";
import drVaughnCasual from "@/assets/dr-vaughn-casual.png";
import drVaughnBlack from "@/assets/dr-vaughn-black.png";
import drVaughnProfessionalHeadshot from "@/assets/dr-vaughn-professional-headshot.png";
import sleepHeroYawning from "@/assets/sleep-hero-yawning.png";
import sleepTiredCouch from "@/assets/sleep-tired-couch.jpg";
import sleepTiredDriver from "@/assets/sleep-tired-driver.jpg";
import sleepTiredKitchen from "@/assets/sleep-tired-kitchen.jpg";
import sleepTiredLaptop from "@/assets/sleep-tired-laptop.jpg";
import sleepTiredOffice from "@/assets/sleep-tired-office.jpg";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  generateMedicalWebPageSchema,
  generateMedicalTestSchema,
  generateFAQSchema,
} from "@/components/seo/schemas/medicalSchemas";
import { toast } from "sonner";

interface SleepCheckProps {
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
  short_bio: string | null;
  headshot_url: string | null;
}

interface ClinicData {
  clinic_name: string;
  logo_url: string | null;
  phone: string | null;
  website: string | null;
}

interface ClinicLocation {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
}

export const SLEEP_CHECK = ({ doctorName, doctorImage, doctorId, physicianId }: SleepCheckProps) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const { user } = useAuth();
  const [isUploadingNoteImage, setIsUploadingNoteImage] = useState(false);
  const noteImageInputRef = useRef<HTMLInputElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(480);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [physicianData, setPhysicianData] = useState<PhysicianData | null>(null);
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [clinicLocations, setClinicLocations] = useState<ClinicLocation[]>([]);
  const [isClinicLevel, setIsClinicLevel] = useState<boolean>(true);

  // Build dynamic URLs
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const physicianParam = physicianId && physicianId !== doctorId ? `&physician=${physicianId}` : '';
  const quizParams = `doctor=${doctorId || '192eedfe-92fd-4306-a272-4c06c01604cf'}&source=website&utm_source=website&utm_medium=web&utm_campaign=quiz_share${physicianParam}`;

  // Fetch physician and clinic data
  useEffect(() => {
    const fetchData = async () => {
      const isClinic = !physicianId || physicianId === doctorId;
      setIsClinicLevel(isClinic);
      
      const { data: doctorProfile, error: doctorError } = await supabase
        .from('doctor_profiles')
        .select('clinic_id')
        .eq('id', doctorId || '192eedfe-92fd-4306-a272-4c06c01604cf')
        .maybeSingle();
      
      if (!doctorError && doctorProfile?.clinic_id) {
        const { data: clinic, error: clinicError } = await supabase
          .from('clinic_profiles')
          .select('clinic_name, logo_url, phone, website')
          .eq('id', doctorProfile.clinic_id)
          .maybeSingle();
        
        if (!clinicError && clinic) {
          setClinicData(clinic);
        }
        
        const { data: locations, error: locationsError } = await supabase
          .from('clinic_locations')
          .select('id, name, address, city, state, zip_code, phone')
          .eq('clinic_id', doctorProfile.clinic_id)
          .order('is_primary', { ascending: false });
        
        if (!locationsError && locations) {
          setClinicLocations(locations);
        }
      }
      
      if (!isClinic && physicianId) {
        const { data: physician, error } = await supabase
          .from('clinic_physicians')
          .select('id, first_name, last_name, degree_type, credentials, bio, short_bio, headshot_url')
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
    ? 'Board-Certified ENT • Sleep Medicine Specialist • 20+ Years Experience' 
    : (physicianData?.credentials?.join(' • ') || 'ENT Specialist');
  const displayBio = isClinicLevel 
    ? 'Many patients live for years with undiagnosed sleep issues, thinking their fatigue is "normal" — when in fact, it\'s not. Dr. Vaughn specializes in comprehensive sleep evaluation, helping patients identify underlying causes and find effective solutions for better rest.'
    : (physicianData?.short_bio || physicianData?.bio || 'Experienced ENT specialist dedicated to helping patients achieve better sleep.');
  const displayHeadshot = isClinicLevel ? drVaughnProfessionalHeadshot : (physicianData?.headshot_url || drVaughnProfessionalHeadshot);
  const displayNoteImage = isClinicLevel ? drVaughnBlack : (physicianData?.headshot_url || drVaughnBlack);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNoteImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !physicianId || isClinicLevel) return;
    
    setIsUploadingNoteImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `note-${physicianId}-${Date.now()}.${fileExt}`;
      const filePath = `physician-notes/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('clinic-assets')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('clinic-assets')
        .getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('clinic_physicians')
        .update({ note_image_url: publicUrl })
        .eq('id', physicianId);
      
      if (updateError) throw updateError;
      
      setPhysicianData(prev => prev ? { ...prev, note_image_url: publicUrl } : null);
      toast.success('Note image updated successfully');
    } catch (error) {
      console.error('Error uploading note image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingNoteImage(false);
    }
  };

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
          // Cross-origin restrictions
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
    window.scrollTo(0, 0);
    const timers = [
      setTimeout(() => window.scrollTo(0, 0), 100),
      setTimeout(() => window.scrollTo(0, 0), 300),
      setTimeout(() => window.scrollTo(0, 0), 500),
      setTimeout(() => window.scrollTo(0, 0), 1000),
    ];
    
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

  // SEO
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const seoTitle = isClinicLevel 
    ? `Sleep Symptoms Self-Check | Free Sleep Quality Assessment`
    : `Sleep Symptoms Self-Check | Dr. ${displayFullName}, ${displayDegree} | Sleep Specialist`;
  const seoDescription = `Take the free Sleep Symptoms Self-Check to understand how sleep-related symptoms may be affecting your daily energy. Board-certified ENT Dr. ${displayName} specializes in comprehensive sleep evaluation.`;
  
  const structuredData = [
    generateMedicalWebPageSchema({
      name: seoTitle,
      description: seoDescription,
      url: currentUrl,
      specialty: 'Sleep Medicine',
      physician: { name: `Dr. ${displayFullName}`, credentials: displayCredentials },
    }),
    generateMedicalTestSchema({
      name: 'Sleep Symptoms Self-Check',
      description: 'A screening tool to evaluate sleep-related symptoms including difficulty sleeping, daytime fatigue, snoring, and morning headaches.',
      url: currentUrl,
      usedToDiagnose: ['Sleep Apnea', 'Insomnia', 'Sleep Disorders', 'Chronic Fatigue'],
    }),
    generateFAQSchema([
      { question: 'What is the Sleep Symptoms Self-Check?', answer: 'The Sleep Symptoms Self-Check is a screening tool that evaluates common sleep-related symptoms like trouble falling asleep, nighttime waking, daytime fatigue, and snoring to help identify potential sleep issues.' },
      { question: 'What does my sleep score mean?', answer: 'Scores range from 0-24. A score of 0-5 indicates low symptom impact, 6-11 is mild, 12-17 is moderate, and 18-24 indicates high symptom impact requiring professional evaluation.' },
      { question: 'When should I see a doctor for sleep issues?', answer: 'You should consult a doctor if you experience persistent sleep difficulties, loud snoring, gasping during sleep, excessive daytime fatigue, or if sleep issues are affecting your daily functioning.' },
    ]),
  ];

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={currentUrl}
        keywords="sleep assessment, sleep symptoms quiz, sleep apnea screening, insomnia test, sleep quality evaluation, daytime fatigue assessment, sleep disorder screening"
        structuredData={structuredData}
      />
      <div 
        className="min-h-screen sleep-check-custom-theme font-sans"
        style={{
          '--primary': '220 70% 50%',
          '--primary-foreground': '0 0% 100%',
          '--secondary': '220 60% 60%',
          '--secondary-foreground': '0 0% 100%',
          '--accent': '220 70% 50%',
          '--accent-foreground': '0 0% 100%',
          '--muted': '210 40% 96%',
          '--muted-foreground': '210 16% 45%',
          '--ring': '220 70% 40%',
          '--background': '0 0% 100%',
          '--foreground': '210 24% 16%',
          '--card': '0 0% 100%',
          '--card-foreground': '210 24% 16%',
          '--border': '210 25% 88%',
          '--destructive': '0 84% 60%',
          '--destructive-foreground': '0 0% 100%',
          '--gradient-hero': 'linear-gradient(135deg, hsl(220 70% 50%) 0%, hsl(220 60% 60%) 100%)',
          '--gradient-cta': 'linear-gradient(135deg, hsl(220 70% 50%) 0%, hsl(220 70% 45%) 100%)',
          '--gradient-hero-overlay': 'linear-gradient(135deg, rgba(59, 130, 246, 0.85) 0%, rgba(59, 130, 246, 0.90) 100%)',
          '--shadow-soft': '0 4px 24px -4px hsl(220 70% 40% / 0.12)',
          '--shadow-card': '0 8px 32px -8px hsl(220 70% 40% / 0.18)',
          '--transition-smooth': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: 'Inter, sans-serif',
        } as React.CSSProperties}
      >
        {/* Hero Section */}
        <section 
          className="relative min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex items-center py-4 sm:py-6 md:py-8 lg:py-12"
          style={{ 
            backgroundImage: `url(${sleepHeroYawning})`,
            backgroundSize: '60%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.75) 0%, rgba(37, 99, 235, 0.80) 100%)' }} />
          <div className="relative z-10 container mx-auto px-3 sm:px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center max-w-7xl mx-auto">
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  Board-Certified ENT | Sleep Medicine Specialist
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white">
                  Are sleep issues affecting your daily life?
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-2xl font-medium">
                  Trouble falling asleep, waking up tired, or feeling fatigued throughout the day? 
                  These symptoms may indicate an underlying sleep issue. Take our quick self-check 
                  to understand how sleep-related symptoms may be affecting you.
                </p>
                <Button 
                  size="lg" 
                  className="text-base md:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-7 w-full sm:w-auto hidden md:inline-flex shadow-2xl hover:shadow-3xl transition-all" 
                  onClick={() => window.open(`${baseUrl}/embed/sleep_check?${quizParams}`, '_blank')}
                >
                  Start the Sleep Self-Check
                </Button>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/20 overflow-hidden mt-4 md:mt-0">
                <iframe
                  ref={iframeRef}
                  src={`/quiz/sleep_check?${quizParams}`}
                  className="w-full transition-all duration-300"
                  style={{ height: `${iframeHeight}px`, minHeight: '400px' }}
                  title="Sleep Symptoms Self-Check"
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
            onClick={() => window.open(`${baseUrl}/embed/sleep_check?${quizParams}`, '_blank')}
          >
            Start the Sleep Self-Check
          </Button>
        </div>

        {/* Note from Dr. Section */}
        <section className="py-8 sm:py-10 md:py-12 lg:py-16 bg-background">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
                <div className="relative order-2 md:order-1">
                  <img 
                    src={displayNoteImage}
                    alt={`Dr. ${displayName}`}
                    className="w-full max-w-md mx-auto md:max-w-full rounded-lg shadow-xl"
                    loading="lazy"
                  />
                  {user && !isClinicLevel && physicianId && (
                    <div className="absolute top-2 right-2 md:right-auto md:left-2">
                      <input
                        type="file"
                        ref={noteImageInputRef}
                        onChange={handleNoteImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-black/80 hover:bg-black/60 shadow-xl shadow-gray-300"
                        onClick={() => noteImageInputRef.current?.click()}
                        disabled={isUploadingNoteImage}
                      >
                        {isUploadingNoteImage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Pencil className="w-3.5 h-3.5 mr-1.5" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="order-1 md:order-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 md:mb-6">
                    A Note from Dr. {displayName}
                  </h2>
                  <div className="space-y-2 sm:space-y-3 md:space-y-4 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                    <p>
                      Many patients live for years with poor sleep quality, thinking their fatigue is 
                      "normal" — when in fact, it's not. As a board-certified ENT with over 20 years of 
                      experience treating sleep disorders, I've helped thousands of patients identify 
                      underlying causes and find effective solutions.
                    </p>
                    <p>
                      Whether you're struggling to fall asleep, waking up multiple times at night, or 
                      feeling exhausted despite getting enough hours in bed, there are answers. From 
                      sleep apnea to insomnia, we offer comprehensive evaluation and treatment options 
                      tailored to your specific needs.
                    </p>
                    <p>
                      The Sleep Symptoms Self-Check helps us understand how sleep issues are affecting 
                      your daily life. Take the quiz to get started on your path to better rest.
                    </p>
                    <p className="font-normal text-foreground">
                      Let's help you get the rest you deserve.
                    </p>
                    <p className="italic">
                      — Dr. {displayName}
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    className="mt-4 sm:mt-6 md:mt-8 w-full sm:w-auto text-sm sm:text-base"
                    onClick={() => window.open(`${baseUrl}/embed/sleep_check?${quizParams}`, '_blank')}
                  >
                    Start your Sleep Self-Check
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
              Understanding Sleep Problems
            </h2>
            <p className="text-center text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto text-sm sm:text-base">
              Recognizing the signs of sleep issues is the first step toward better rest
            </p>

            <div className="max-w-4xl mx-auto mb-8 sm:mb-10 md:mb-12">
              <img 
                src={sleepTiredCouch}
                alt="Person experiencing sleep-related fatigue"
                className="w-full rounded-lg shadow-lg object-cover max-h-[300px] sm:max-h-[400px]"
                loading="lazy"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="mb-4 sm:mb-6">
                    <img 
                      src={sleepTiredOffice}
                      alt="Daytime fatigue affecting work"
                      className="w-full rounded-lg object-cover max-h-[200px] sm:max-h-[250px]"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Moon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Sleep Quality Issues</h3>
                  </div>
                  <div className="space-y-3 sm:space-y-4 text-muted-foreground text-sm sm:text-base">
                    <p>
                      Poor sleep quality can significantly impact your daily life, even if you spend 
                      enough hours in bed.
                    </p>
                    <ul className="space-y-2 sm:space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Difficulty falling or staying asleep</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Waking up feeling unrefreshed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Daytime fatigue and low energy</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Difficulty concentrating or remembering</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="mb-4 sm:mb-6">
                    <img 
                      src={sleepTiredDriver}
                      alt="Drowsy driving danger"
                      className="w-full rounded-lg object-cover max-h-[200px] sm:max-h-[250px]"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Warning Signs</h3>
                  </div>
                  
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h4 className="font-normal text-base sm:text-lg mb-2 sm:mb-3 text-foreground">Common Symptoms:</h4>
                      <ul className="space-y-1.5 sm:space-y-2 text-muted-foreground text-xs sm:text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Loud snoring or gasping during sleep</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Morning headaches</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Excessive daytime sleepiness</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Mood changes and irritability</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Memory and concentration issues</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-normal text-base sm:text-lg mb-2 sm:mb-3 text-foreground">Risk Factors:</h4>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        Obesity, nasal congestion, enlarged tonsils, alcohol use, age, and family history
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
                onClick={() => window.open(`${baseUrl}/embed/sleep_check?${quizParams}`, '_blank')}
              >
                Start your Sleep Self-Check
              </Button>
            </div>
          </div>
        </section>

        {/* About the Assessment */}
        <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
                About the Sleep Symptoms Self-Check
              </h2>
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center mb-8 sm:mb-10">
                <div>
                  <div className="bg-primary/5 rounded-2xl p-4 sm:p-6 md:p-8 text-center mb-4 sm:mb-6">
                    <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-1 sm:mb-2">8</div>
                    <div className="text-base sm:text-lg md:text-2xl font-normal mb-0.5 sm:mb-1">Questions</div>
                    <div className="h-px bg-border my-3 sm:my-4" />
                    <div className="text-3xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">4</div>
                    <div className="text-sm sm:text-base md:text-lg font-normal mb-0.5 sm:mb-1">Severity Levels</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Low • Mild • Moderate • High Impact</div>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base md:text-lg">
                    The Sleep Symptoms Self-Check evaluates common sleep-related symptoms to help identify 
                    potential issues affecting your rest and daily energy levels.
                  </p>
                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Assesses difficulty falling and staying asleep</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Evaluates daytime fatigue and energy levels</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Screens for snoring and sleep-disordered breathing symptoms</span>
                    </li>
                  </ul>
                  <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs sm:text-sm font-medium">
                        <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1 text-amber-600" />
                        <strong>Disclaimer:</strong> This is a screening tool, not a medical diagnosis. Results will be reviewed by Dr. {displayName}'s team.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Treatment Options */}
        <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-muted/30">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 sm:mb-4">
                Sleep Treatment Options
              </h2>
              <p className="text-center text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto text-sm sm:text-base">
                We offer comprehensive solutions tailored to your specific sleep issues
              </p>

              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10 md:mb-12">
                <img 
                  src={sleepTiredLaptop}
                  alt="Sleep affecting daily life"
                  className="w-full rounded-lg shadow-lg object-cover h-[250px] sm:h-[300px]"
                  loading="lazy"
                />
                <img 
                  src={sleepTiredKitchen}
                  alt="Morning fatigue"
                  className="w-full rounded-lg shadow-lg object-cover h-[250px] sm:h-[300px]"
                  loading="lazy"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12">
                <Card>
                  <CardContent className="p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <Lightbulb className="h-6 w-6 sm:h-7 sm:h-7 md:h-8 md:w-8 text-primary" />
                      <h3 className="text-base sm:text-lg md:text-xl font-bold">Lifestyle & Sleep Hygiene</h3>
                    </div>
                    <ul className="space-y-2 sm:space-y-3 text-muted-foreground text-xs sm:text-sm md:text-base">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>Sleep schedule:</strong> Consistent bedtime and wake time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>Environment:</strong> Cool, dark, quiet bedroom</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>Screen time:</strong> Limiting devices before bed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>Caffeine/alcohol:</strong> Limiting intake, especially evening</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <Brain className="h-6 w-6 sm:h-7 sm:h-7 md:h-8 md:w-8 text-primary" />
                      <h3 className="text-base sm:text-lg md:text-xl font-bold">Medical Treatments</h3>
                    </div>
                    <ul className="space-y-2 sm:space-y-3 text-muted-foreground text-xs sm:text-sm md:text-base">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>Sleep study:</strong> Comprehensive overnight evaluation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>CPAP therapy:</strong> For obstructive sleep apnea</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>Oral appliances:</strong> Dental devices for mild apnea</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>Surgical options:</strong> For anatomical issues</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button 
                  size="lg"
                  className="w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => window.open(`${baseUrl}/embed/sleep_check?${quizParams}`, '_blank')}
                >
                  Start your Sleep Self-Check
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-10">
                Frequently Asked Questions
              </h2>
              
              <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-4 sm:px-6">
                  <AccordionTrigger className="text-sm sm:text-base md:text-lg font-medium py-3 sm:py-4">
                    What is the Sleep Symptoms Self-Check?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm md:text-base text-muted-foreground pb-3 sm:pb-4">
                    The Sleep Symptoms Self-Check is a screening tool that evaluates 8 common sleep-related 
                    symptoms including difficulty falling asleep, nighttime waking, daytime fatigue, snoring, 
                    concentration issues, mood changes, and morning headaches. It helps identify potential 
                    sleep issues that may benefit from professional evaluation.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4 sm:px-6">
                  <AccordionTrigger className="text-sm sm:text-base md:text-lg font-medium py-3 sm:py-4">
                    What do my results mean?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm md:text-base text-muted-foreground pb-3 sm:pb-4">
                    Scores range from 0-24 based on your responses. A score of 0-5 indicates low symptom impact, 
                    6-11 suggests mild impact, 12-17 indicates moderate impact, and 18-24 suggests high symptom 
                    impact that would benefit from a comprehensive sleep evaluation.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4 sm:px-6">
                  <AccordionTrigger className="text-sm sm:text-base md:text-lg font-medium py-3 sm:py-4">
                    When should I see a doctor about sleep issues?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm md:text-base text-muted-foreground pb-3 sm:pb-4">
                    You should consult a doctor if you experience persistent difficulty sleeping, loud snoring 
                    or gasping during sleep, excessive daytime sleepiness despite adequate sleep time, morning 
                    headaches, or if sleep issues are affecting your daily functioning, work performance, or safety.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4 sm:px-6">
                  <AccordionTrigger className="text-sm sm:text-base md:text-lg font-medium py-3 sm:py-4">
                    What happens after I complete the assessment?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm md:text-base text-muted-foreground pb-3 sm:pb-4">
                    After completing the assessment, you'll receive your score and an interpretation of your 
                    results immediately. Our team will review your submission and may reach out to discuss 
                    next steps, which could include scheduling a consultation or recommending a sleep study.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Ready to Get Better Sleep?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90">
              Take the first step toward understanding your sleep health. The Sleep Symptoms Self-Check 
              takes just a few minutes and could be the start of getting the rest you deserve.
            </p>
            <Button 
              size="lg"
              variant="secondary"
              className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6"
              onClick={() => window.open(`${baseUrl}/embed/sleep_check?${quizParams}`, '_blank')}
            >
              Start the Sleep Self-Check Now
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 sm:py-10 md:py-12 bg-foreground text-background">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="sm:col-span-2 lg:col-span-1">
                <img 
                  src={clinicData?.logo_url || exhaleLogo} 
                  alt={clinicData?.clinic_name || "Clinic"} 
                  className="h-10 sm:h-12 mb-3 sm:mb-4 brightness-0 invert" 
                  loading="lazy"
                />
                <p className="text-xs sm:text-sm opacity-80">
                  {clinicData?.clinic_name || 'Exhale Sinus, TMJ, Headache & Sleep'} provides 
                  comprehensive care for sleep disorders and related conditions.
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Contact</h4>
                <div className="space-y-2 text-xs sm:text-sm opacity-80">
                  {clinicLocations[0] && (
                    <p className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {clinicLocations[0].address && `${clinicLocations[0].address}, `}
                        {clinicLocations[0].city}, {clinicLocations[0].state} {clinicLocations[0].zip_code}
                      </span>
                    </p>
                  )}
                  {(clinicLocations[0]?.phone || clinicData?.phone) && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      {clinicLocations[0]?.phone || clinicData?.phone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Resources</h4>
                <ul className="space-y-2 text-xs sm:text-sm opacity-80">
                  <li><a href={clinicData?.website || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">Visit Website</a></li>
                  <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                  <li><a href="#" className="hover:underline">Terms of Service</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Schedule</h4>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="w-full text-xs sm:text-sm"
                  onClick={() => window.open(clinicData?.website ? `${clinicData.website}/request-an-appointment` : '#', '_blank')}
                >
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Request Appointment
                </Button>
              </div>
            </div>

            <div className="border-t border-background/20 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm opacity-60">
              <p>© {new Date().getFullYear()} {clinicData?.clinic_name || 'Exhale Sinus, TMJ, Headache & Sleep'}. All rights reserved.</p>
              <p className="mt-1">Powered by PatientPathway.ai</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
