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
  const clinicName = clinicData?.clinic_name || 'Exhale Sinus, TMJ, Headache & Sleep';
  const seoTitle = `Sleep Symptoms Self-Check | ${clinicName}`;
  const seoDescription = `Take our quick 2-minute Sleep Symptoms Self-Check to discover signs of sleep apnea, nasal obstruction, or airway problems. Results reviewed by Dr. ${displayFullName}, board-certified ENT.`;
  
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
      description: 'A screening tool to evaluate sleep-related symptoms including snoring, fatigue, and airway obstruction.',
      url: currentUrl,
      usedToDiagnose: ['Sleep Apnea', 'Upper Airway Resistance Syndrome', 'Nasal Obstruction', 'Airway Disorders'],
    }),
    generateFAQSchema([
      { question: "What's the difference between regular snoring and sleep apnea?", answer: "Snoring is noise caused by airway vibration during breathing. Sleep apnea is a sleep disorder where breathing repeatedly stops and starts, often leading to serious health issues if untreated. Our quiz helps identify when snoring may be a sign of deeper issues." },
      { question: 'Can nasal obstruction really cause sleep problems?', answer: "Yes. Structural issues — such as a deviated septum, enlarged turbinates, or weak nasal valves — can limit airflow at night, leading to mouth breathing, poor oxygenation, and disrupted sleep cycles." },
      { question: 'Do I need a formal sleep study before treatment?', answer: "The Sleep Symptoms Self-Check serves as an initial screening tool. If the results suggest risk, we may recommend a sleep study or airway evaluation, but not everyone needs formal testing — especially if structural nasal issues are clearly present." },
      { question: 'What are alternatives to CPAP therapy?', answer: "We offer a full range of non-surgical and surgical options, including oral appliances, nasal airway procedures, and structural correction for patients who cannot tolerate CPAP." },
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
                  Stop Snoring, Start Living
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-2xl font-medium">
                  Tired of waking up exhausted? Take our free 2-minute Sleep Symptoms Self-Check to uncover 
                  possible causes of your sleep problems like snoring, fatigue, or airway obstruction.
                </p>
                <Button 
                  size="lg" 
                  className="text-base md:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-7 w-full sm:w-auto hidden md:inline-flex shadow-2xl hover:shadow-3xl transition-all" 
                  onClick={() => window.open(`${baseUrl}/embed/sleep_check?${quizParams}`, '_blank')}
                >
                  Take the Sleep Quiz Now →
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
            Take the Sleep Quiz Now →
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

        {/* Why Sleep Issues Matter Section */}
        <section className="py-8 sm:py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 sm:mb-4">
                Poor Sleep Might Be More Than Just Fatigue
              </h2>
              <div className="space-y-4 text-muted-foreground text-sm sm:text-base md:text-lg mb-6 sm:mb-8">
                <p>
                  Many adults suffer from undiagnosed sleep-related breathing disorders such as <strong className="text-foreground">Obstructive Sleep Apnea (OSA)</strong>, 
                  <strong className="text-foreground"> Upper Airway Resistance Syndrome (UARS)</strong>, or <strong className="text-foreground">nighttime airway obstruction</strong>. 
                  Common causes include <strong className="text-foreground">nasal congestion, structural blockage, or throat-airway narrowing</strong>.
                </p>
                <p>
                  These conditions often go unnoticed — but the impact on daily life can be profound:
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <img 
                  src={sleepTiredCouch}
                  alt="Person experiencing sleep-related fatigue"
                  className="w-full rounded-lg shadow-lg object-cover h-[200px] sm:h-[250px]"
                  loading="lazy"
                />
                <img 
                  src={sleepTiredDriver}
                  alt="Drowsy driving danger"
                  className="w-full rounded-lg shadow-lg object-cover h-[200px] sm:h-[250px]"
                  loading="lazy"
                />
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base md:text-lg">Loud snoring or gasping for air at night</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base md:text-lg">Dry mouth or sore throat on waking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base md:text-lg">Morning headaches or persistent fatigue</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base md:text-lg">Daytime sleepiness, brain fog, or poor concentration</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base md:text-lg">Interrupted or restless sleep despite "hours in bed"</span>
                </li>
              </ul>

              <div className="text-center">
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => window.open(`${baseUrl}/embed/sleep_check?${quizParams}`, '_blank')}
                >
                  Start the Sleep Quiz →
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Simple. Fast. Insightful. Section */}
        <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
                Simple. Fast. Insightful.
              </h2>
              <div className="space-y-4 text-muted-foreground text-sm sm:text-base md:text-lg mb-6 sm:mb-8">
                <p>
                  The <strong className="text-foreground">Sleep Symptoms Self-Check</strong> is a quick, 8-question tool designed to highlight whether symptoms 
                  like snoring, fatigue, and poor sleep quality may point to an underlying airway, nasal, or sleep-breathing issue.
                </p>
                <p>
                  In under 2 minutes, you'll receive a score that helps show how disrupted your sleep might be — from low symptom 
                  burden to high risk. Use your score to guide whether further evaluation may be needed.
                </p>
              </div>

              <Card className="mb-6 sm:mb-8">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h3 className="text-lg sm:text-xl font-bold mb-4 text-center">Score Interpretation</h3>
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600">0-5</div>
                      <div className="text-sm sm:text-base">Low symptom burden</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <div className="text-2xl sm:text-3xl font-bold text-yellow-600">6-11</div>
                      <div className="text-sm sm:text-base">Mild symptoms / poor sleep quality</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <div className="text-2xl sm:text-3xl font-bold text-orange-600">12-17</div>
                      <div className="text-sm sm:text-base">Moderate symptoms — possible airway or sleep-breathing issues</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <div className="text-2xl sm:text-3xl font-bold text-red-600">18-24</div>
                      <div className="text-sm sm:text-base">High symptoms — likely significant sleep disruption</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button 
                  size="lg"
                  className="w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => window.open(`${baseUrl}/embed/sleep_check?${quizParams}`, '_blank')}
                >
                  Take the Sleep Quiz Now →
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* What Happens After Quiz Section */}
        <section className="py-8 sm:py-10 md:py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                What Happens After You Finish the Quiz
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-6 sm:mb-8">
                If your score is moderate or high, it may indicate a higher likelihood of sleep-related breathing issues, such as 
                <strong className="text-foreground"> sleep apnea</strong> or <strong className="text-foreground">nasal/airway obstruction</strong>. 
                Our team at <strong className="text-foreground">{clinicData?.clinic_name || 'Exhale Sinus, TMJ, Headache & Sleep'}</strong> will review 
                your responses and reach out to discuss the next best steps — whether that's a full evaluation, sleep testing, or airway assessment.
              </p>
              {(clinicLocations[0]?.phone || clinicData?.phone) && (
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => window.location.href = `tel:${clinicLocations[0]?.phone || clinicData?.phone}`}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Us to Schedule a Follow-Up
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Treatment Pathways Section */}
        <section className="py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 sm:mb-4">
                Treat the Root Cause — Not Just the Snoring
              </h2>
              <p className="text-center text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto text-sm sm:text-base">
                We offer comprehensive solutions tailored to your specific sleep and airway needs
              </p>

              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <Card>
                  <CardContent className="p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <Bed className="h-6 w-6 sm:h-7 md:h-8 md:w-8 text-primary" />
                      <h3 className="text-base sm:text-lg md:text-xl font-bold">Non-Surgical Options</h3>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Oral appliances, CPAP, simple airway therapy — for mild to moderate sleep apnea or nasal congestion.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <Shield className="h-6 w-6 sm:h-7 md:h-8 md:w-8 text-primary" />
                      <h3 className="text-base sm:text-lg md:text-xl font-bold">Minimally Invasive Procedures</h3>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Nasal valve procedures, turbinate reduction — ideal for structural nasal or airway blockage.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <Brain className="h-6 w-6 sm:h-7 md:h-8 md:w-8 text-primary" />
                      <h3 className="text-base sm:text-lg md:text-xl font-bold">Surgical Solutions</h3>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Septoplasty, UPPP, or advanced sleep-airway surgeries — for moderate-to-severe sleep apnea or obstructive airway disorders.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <Lightbulb className="h-6 w-6 sm:h-7 md:h-8 md:w-8 text-primary" />
                      <h3 className="text-base sm:text-lg md:text-xl font-bold">Lifestyle & Supportive Care</h3>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Weight management, posture and breathing training, sleep hygiene — helpful for long-term maintenance.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Meet the Doctor Section */}
        <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-muted/30">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-10">
                Meet Dr. {displayFullName} – ENT Sleep Specialist
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
                <div className="order-2 md:order-1">
                  <img 
                    src={displayHeadshot}
                    alt={`Dr. ${displayFullName}, ENT Specialist`}
                    className="w-full max-w-md mx-auto rounded-lg shadow-xl"
                    loading="lazy"
                  />
                </div>
                <div className="order-1 md:order-2 space-y-4">
                  <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                    Dr. {displayFullName}, {displayDegree}, is a board-certified <strong className="text-foreground">ENT and Sleep Medicine specialist</strong> at {clinicData?.clinic_name || 'Exhale Sinus, TMJ, Headache & Sleep'}. He brings expert care in <strong className="text-foreground">sinus, nasal obstruction, sleep apnea, and airway disorders</strong> to patients seeking better breathing and better sleep.
                  </p>
                  <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                    {isClinicLevel 
                      ? "Dr. Vaughn completed his otolaryngology training at the University of Illinois at Chicago and has extensive experience treating sleep-related breathing conditions, nasal obstruction, and airway disorders. Outside the clinic, he enjoys time with his wife, daughter, and their sheepadoodle, Oscar."
                      : displayBio
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-10">
                Common Questions About Sleep & Airway Problems
              </h2>
              
              <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-4 sm:px-6">
                  <AccordionTrigger className="text-sm sm:text-base md:text-lg font-medium py-3 sm:py-4">
                    What's the difference between regular snoring and sleep apnea?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm md:text-base text-muted-foreground pb-3 sm:pb-4">
                    Snoring is noise caused by airway vibration during breathing. Sleep apnea is a sleep disorder 
                    where breathing repeatedly stops and starts, often leading to serious health issues if untreated. 
                    Our quiz helps identify when snoring may be a sign of deeper issues.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4 sm:px-6">
                  <AccordionTrigger className="text-sm sm:text-base md:text-lg font-medium py-3 sm:py-4">
                    Can nasal obstruction really cause sleep problems?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm md:text-base text-muted-foreground pb-3 sm:pb-4">
                    Yes. Structural issues — such as a deviated septum, enlarged turbinates, or weak nasal valves — 
                    can limit airflow at night, leading to mouth breathing, poor oxygenation, and disrupted sleep cycles.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4 sm:px-6">
                  <AccordionTrigger className="text-sm sm:text-base md:text-lg font-medium py-3 sm:py-4">
                    Do I need a formal sleep study before treatment?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm md:text-base text-muted-foreground pb-3 sm:pb-4">
                    The Sleep Symptoms Self-Check serves as an initial screening tool. If the results suggest risk, 
                    we may recommend a sleep study or airway evaluation, but not everyone needs formal testing — 
                    especially if structural nasal issues are clearly present.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4 sm:px-6">
                  <AccordionTrigger className="text-sm sm:text-base md:text-lg font-medium py-3 sm:py-4">
                    What are alternatives to CPAP therapy?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm md:text-base text-muted-foreground pb-3 sm:pb-4">
                    We offer a full range of <strong>non-surgical and surgical options</strong>, including oral appliances, 
                    nasal airway procedures, and structural correction for patients who cannot tolerate CPAP.
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
              Take the First Step Toward Better Sleep Tonight
            </h2>
            <Button 
              size="lg"
              variant="secondary"
              className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 mb-4"
              onClick={() => window.open(`${baseUrl}/embed/sleep_check?${quizParams}`, '_blank')}
            >
              Start the Sleep Self-Check Quiz →
            </Button>
            <p className="text-sm sm:text-base opacity-80">
              Free, quick, and reviewed by a board-certified ENT sleep specialist. No obligation.
            </p>
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
