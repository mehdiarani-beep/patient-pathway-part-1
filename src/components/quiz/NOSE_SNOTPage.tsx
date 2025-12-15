import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Phone, MapPin, CheckCircle2, AlertCircle, Pencil, Upload, Loader2 } from "lucide-react";
import heroImage from "@/assets/hero-nasal-new.jpg";
import exhaleLogo from "@/assets/exhale-logo.png";
import nasalAirwayImage from "@/assets/nasal-airway.jpg";
import sinusPainImage from "@/assets/sinus-pain.jpg";
import breathingFreshAir from "@/assets/breathing-fresh-air.jpg";
import drVaughnProfessional from "@/assets/dr-vaughn-professional.png";
import symptomOverlapImage from "@/assets/symptom-overlap.png";
import drVaughnCasual from "@/assets/dr-vaughn-casual.png";
import drVaughnBlack from "@/assets/dr-vaughn-black.png";
import sinusWomanThinking from "@/assets/sinus-woman-thinking.png";
import womanThinkingNasal from "@/assets/woman-thinking-nasal.png";
import nasalExamDoctor from "@/assets/nasal-exam-doctor.jpg";
import sinusProblemTissue from "@/assets/sinus-problem-tissue.jpg";
import sinusPressure from "@/assets/sinus-pressure.jpg";
import sinusRelief from "@/assets/sinus-relief.jpg";
import { NOSESNOTPage } from "./NOSESNOTPage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Template5Props {
  doctorName: string;
  doctorImage: string;
  doctorIdparam: string;
  physicianId?: string;
}

type TestType = 'nose' | 'snot' | null;

interface ClinicData {
  clinic_name: string;
  logo_url: string | null;
  avatar_url: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
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
  note_image_url: string | null;
  email: string | null;
  mobile: string | null;
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

export const NOSE_SNOT = ({ doctorName, doctorImage, doctorIdparam, physicianId }: Template5Props) => {
  const [selectedTest, setSelectedTest] = useState<TestType>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [physicianData, setPhysicianData] = useState<PhysicianData | null>(null);
  const [allPhysicians, setAllPhysicians] = useState<PhysicianData[]>([]);
  const [clinicLocations, setClinicLocations] = useState<ClinicLocation[]>([]);
  const [isClinicLevel, setIsClinicLevel] = useState<boolean>(true);
  const [isUploadingNoteImage, setIsUploadingNoteImage] = useState(false);
  const noteImageInputRef = useRef<HTMLInputElement>(null);
  
  // Build dynamic URLs
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const physicianParam = physicianId && physicianId !== doctorIdparam ? `&physician=${physicianId}` : '';
  const quizParams = `doctor=${doctorIdparam}&source=website&utm_source=website&utm_medium=web&utm_campaign=quiz_share${physicianParam}`;
  
  // Fetch physician or clinic data based on physicianId
  useEffect(() => {
    const fetchData = async () => {
      // Check if this is clinic-level (no physicianId OR physicianId matches doctorId)
      const isClinic = !physicianId || physicianId === doctorIdparam;
      setIsClinicLevel(isClinic);
      
      console.log('NOSE_SNOT Fetching data:', { doctorIdparam, physicianId, isClinic });
      
      // First get clinic_id from doctor_profiles
      const { data: doctorProfile, error: doctorError } = await supabase
        .from('doctor_profiles')
        .select('clinic_id')
        .eq('id', doctorIdparam)
        .maybeSingle();
      
      if (doctorError) {
        console.error('Error fetching doctor profile:', doctorError);
        setLoading(false);
        return;
      }
      
      const fetchedClinicId = doctorProfile?.clinic_id;
      setClinicId(fetchedClinicId);
      console.log('NOSE_SNOT clinic_id:', fetchedClinicId);
      
      // Always fetch clinic data for footer and branding
      if (fetchedClinicId) {
        const { data: clinic, error: clinicError } = await supabase
          .from('clinic_profiles')
          .select('clinic_name, logo_url, avatar_url, phone, website, address, city, state, zip_code')
          .eq('id', fetchedClinicId)
          .maybeSingle();
        
        if (!clinicError && clinic) {
          console.log('NOSE_SNOT clinic data:', clinic);
          setClinicData(clinic);
        } else {
          console.error('Error fetching clinic:', clinicError);
        }
        
        // Fetch clinic locations
        const { data: locations, error: locationsError } = await supabase
          .from('clinic_locations')
          .select('id, name, address, city, state, zip_code, phone')
          .eq('clinic_id', fetchedClinicId)
          .order('is_primary', { ascending: false });
        
        if (!locationsError && locations) {
          setClinicLocations(locations);
        }
        
        // Always fetch all physicians for the clinic
        const { data: physicians, error: physiciansError } = await supabase
          .from('clinic_physicians')
          .select('id, first_name, last_name, degree_type, credentials, bio, short_bio, headshot_url, note_image_url, email, mobile')
          .eq('clinic_id', fetchedClinicId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (!physiciansError && physicians) {
          console.log('NOSE_SNOT physicians:', physicians);
          setAllPhysicians(physicians as PhysicianData[]);
        }
      }
      
      // If physician-specific, also fetch that physician's data
      if (!isClinic && physicianId) {
        const { data: physician, error: physicianError } = await supabase
          .from('clinic_physicians')
          .select('id, first_name, last_name, degree_type, credentials, bio, short_bio, headshot_url, note_image_url, email, mobile')
          .eq('id', physicianId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (!physicianError && physician) {
          setPhysicianData(physician as PhysicianData);
        } else {
          console.error('Error fetching physician:', physicianError);
        }
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [doctorIdparam, physicianId]);
  
  // Get display values based on whether it's clinic or physician level
  const clinicName = clinicData?.clinic_name || 'Our Practice';
  const displayName = isClinicLevel 
    ? clinicName
    : physicianData?.last_name || doctorName;
  const displayFullName = isClinicLevel 
    ? clinicName
    : `${physicianData?.first_name || ''} ${physicianData?.last_name || ''}`.trim() || doctorName;
  const displayDegree = isClinicLevel 
    ? '' 
    : physicianData?.degree_type || 'MD';
  const displayCredentials = isClinicLevel 
    ? 'Board-Certified ENT • Nasal & Sinus Specialist' 
    : (physicianData?.credentials?.join(' • ') || 'ENT Specialist');
  const displayBio = isClinicLevel 
    ? `${clinicName} has helped thousands of patients overcome nasal and sinus conditions through comprehensive, minimally-invasive ENT treatments.`
    : (physicianData?.short_bio || physicianData?.bio || 'Experienced ENT specialist dedicated to helping patients breathe better.');
  // For clinic level, use first physician's headshot or logo, for physician use their specific headshot
  const displayHeadshot = isClinicLevel 
    ? (allPhysicians[0]?.headshot_url || clinicData?.logo_url || drVaughnProfessional)
    : (physicianData?.headshot_url || drVaughnProfessional);
  // For note image at clinic level, use logo or first physician image
  const displayNoteImage = isClinicLevel 
    ? (clinicData?.logo_url || allPhysicians[0]?.headshot_url || drVaughnBlack)
    : (physicianData?.note_image_url || physicianData?.headshot_url || drVaughnBlack);

  // Handle note image upload
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
      
      // Update physician's note_image_url
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
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // No iframe height adjustment needed - using direct component

  useEffect(() => {
    // Prevent auto-scroll to embedded iframe
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = 'auto';
    
    // Multiple delayed scrolls to handle iframe loading
    const timers = [
      setTimeout(() => window.scrollTo(0, 0), 100),
      setTimeout(() => window.scrollTo(0, 0), 300),
      setTimeout(() => window.scrollTo(0, 0), 500),
      setTimeout(() => window.scrollTo(0, 0), 1000),
    ];
    
    // Gentle scroll prevention only for first 2 seconds
    let scrollPreventionActive = true;
    
    const handleScroll = () => {
      if (scrollPreventionActive && window.scrollY > 0) {
        window.scrollTo(0, 0);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Disable scroll prevention after 2 seconds
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

  const scrollToTest = () => {
    const testElement = document.getElementById('test-section');
    if (testElement) {
      testElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
  };

  const handleTestSelection = (type: TestType) => {
    setSelectedTest(type);
    setTimeout(scrollToTest, 100);
  };

  return (
    <div 
      className="min-h-screen nose-snot-custom-theme font-sans"
      style={{
        // Custom color overrides for NOSE_SNOT page only (from Exhale Sinus design system)
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
      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      {/* Hero Section */}
      <section 
        className="relative min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex items-center py-4 sm:py-6 md:py-8 lg:py-12"
        style={{ 
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: window.innerWidth < 768 ? 'center' : 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0, 169, 206, 0.65) 0%, rgba(0, 169, 206, 0.70) 100%)' }} />
        <div className="relative z-10 container mx-auto px-3 sm:px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center max-w-7xl mx-auto">
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                Board-Certified ENT | Nasal & Sinus Specialist
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white">
                Is it a Nasal or Sinus Problem?
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed max-w-2xl font-medium">
                Many patients don't realize that breathing problems, pressure, and congestion can come from different root causes.
                This short quiz will help you understand whether your symptoms are due to nasal obstruction or sinus inflammation — 
                and guide you toward the right treatment.
              </p>
              <Button 
                size="lg" 
                className="text-base md:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-7 w-full sm:w-auto hidden md:inline-flex shadow-2xl hover:shadow-3xl transition-all" 
                onClick={() => window.open(`${baseUrl}/embed/nose_snot?${quizParams}`, '_blank')}
              >
                Start the Nasal Assessment
              </Button>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/20 overflow-hidden mt-4 md:mt-0 min-h-[400px] md:min-h-[480px]">
              <NOSESNOTPage doctorId={doctorIdparam} physicianId={physicianId} />
            </div>
          </div>
        </div>
      </section>

      {/* Note Section */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 bg-background">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
              {/* Left Column - Doctor Image */}
              <div className="relative order-2 md:order-1">
                <img 
                  src={displayNoteImage}
                  alt={isClinicLevel ? (clinicData?.clinic_name || 'Our Practice') : `Dr. ${displayName}`}
                  className="w-full max-w-md mx-auto md:max-w-full rounded-lg shadow-xl"
                  loading="lazy"
                />
                {/* Edit button for logged-in users (physician level only) */}
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

              {/* Right Column - Note */}
              <div className="order-1 md:order-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 md:mb-6">
                  A Note from {isClinicLevel ? (clinicData?.clinic_name || 'Our Practice') : `Dr. ${displayName}`}
                </h2>
                <div className="space-y-2 sm:space-y-3 md:space-y-4 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                  <p>
                    If you're dealing with nasal congestion, facial pressure, trouble breathing, or poor sleep — you're not alone. 
                    These symptoms can stem from two common but very different issues: nasal airway obstruction (NAO) or chronic sinus inflammation.
                  </p>
                  <p>
                    To help you understand what's going on — and what to do next — {isClinicLevel ? "we've" : "I've"} created a quick self-assessment that asks just one question 
                    to point you in the right direction. From there, you'll take either the NOSE test (for nasal blockage) or the SNOT-12 test 
                    (for sinus-related symptoms).
                  </p>
                  <p>
                    Once you complete the quiz, {isClinicLevel ? "our team will" : "I'll"} personally review your score and offer a free phone consultation to go over treatment options — 
                    from medications to minimally invasive in-office procedures.
                  </p>
                  <p className="font-semibold text-foreground">
                    Let's get you breathing better again.
                  </p>
                  {!isClinicLevel && (
                    <p className="italic">
                      — Dr. {displayName}
                    </p>
                  )}
                </div>
                <Button 
                  size="lg" 
                  className="mt-4 sm:mt-6 md:mt-8 w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => window.open(`${baseUrl}/embed/nose_snot?${quizParams}`, '_blank')}
                >
                  Start your Nasal Assessment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Triage Question Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardContent className="p-4 sm:p-6 md:p-8 lg:p-12">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6">
                  Which symptoms sound most like yours?
                </h2>
                <p className="text-center text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base md:text-lg">
                  Choose the option that best describes your main concerns:
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* NOSE Option */}
                  <button
                    onClick={() => window.open(`${baseUrl}/embed/nose?${quizParams}`, '_blank')}
                    className="p-4 sm:p-6 rounded-lg border-2 transition-all hover:scale-105 active:scale-95 text-left border-border hover:border-primary/50"
                  >
                    <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-1" />
                      <h3 className="text-base sm:text-lg md:text-xl font-bold">Mostly Blockage & Stuffiness</h3>
                    </div>
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Constant nasal congestion or blockage</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Difficulty breathing through nose</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Snoring or sleep problems</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Mouth breathing</span>
                      </li>
                    </ul>
                    <div className="mt-3 sm:mt-4 text-xs sm:text-sm font-semibold text-primary">
                      → Take the NOSE Test
                    </div>
                  </button>

                  {/* SNOT Option */}
                  <button
                    onClick={() => window.open(`${baseUrl}/embed/snot12?${quizParams}`, '_blank')}
                    className="p-4 sm:p-6 rounded-lg border-2 transition-all hover:scale-105 active:scale-95 text-left border-border hover:border-primary/50"
                  >
                    <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-1" />
                      <h3 className="text-base sm:text-lg md:text-xl font-bold">Pressure, Drainage & Smell Loss</h3>
                    </div>
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Facial pain or pressure</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Thick nasal discharge or post-nasal drip</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Loss of smell or taste</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>Frequent sinus infections</span>
                      </li>
                    </ul>
                    <div className="mt-3 sm:mt-4 text-xs sm:text-sm font-semibold text-primary">
                      → Take the SNOT-12 Test
                    </div>
                  </button>
                </div>

                {selectedTest && (
                  <div className="mt-6 sm:mt-8 text-center animate-fade-in">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      Great choice! Scroll down to take the {selectedTest === 'nose' ? 'NOSE' : 'SNOT-12'} assessment.
                    </p>
                    <Button onClick={scrollToTest} size="lg" className="w-full sm:w-auto">
                      Start Assessment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Educational Section - Nasal vs Sinus */}
      <section id="learn-more" className="py-8 sm:py-12 md:py-16 bg-background">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 sm:mb-4">
            Understanding Your Symptoms
          </h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto text-sm sm:text-base">
            Nasal blockage and sinus problems can feel similar, but they have different causes and treatments.
          </p>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Nasal Obstruction Column */}
            <Card id="nasal-obstruction" className="scroll-mt-20">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Nasal Obstruction</h3>
                </div>

                <img 
                  src={nasalAirwayImage} 
                  alt="Nasal airway anatomy" 
                  className="rounded-lg shadow-md w-full max-w-sm mx-auto mb-4 sm:mb-6"
                  loading="lazy"
                />

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">What it is:</h4>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Blocked airflow due to physical issues like deviated septum, enlarged turbinates, 
                      or nasal valve collapse. The structure of your nose prevents air from flowing freely.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Common Symptoms:</h4>
                    <ul className="space-y-1.5 sm:space-y-2 text-muted-foreground text-sm sm:text-base">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Constant stuffiness (especially lying down)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Snoring and sleep disturbances</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Mouth breathing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Difficulty during exercise</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Common Causes:</h4>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Structural problems from birth, trauma, or injury. Enlarged turbinates from allergies. 
                      Weak nasal valves that collapse during breathing.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Treatment Options:</h4>
                    <ul className="space-y-1.5 sm:space-y-2 text-muted-foreground text-sm sm:text-base">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>Septoplasty:</strong> Straighten deviated septum (5-7 days congestion, 1-2 weeks full recovery)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>Turbinate Reduction:</strong> Radiofrequency or in-office procedure to shrink enlarged turbinates</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>VivAer®:</strong> In-office radiofrequency treatment (~20 min) to stiffen nasal valve</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>LATERA®:</strong> Absorbable nasal implant placed in-office to support lateral wall</span>
                      </li>
                    </ul>
                  </div>
            </div>
          </CardContent>
        </Card>

            {/* Sinus Problems Column */}
            <Card id="sinus-problems" className="scroll-mt-20">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Sinus Problems</h3>
                </div>

                <img 
                  src={sinusProblemTissue} 
                  alt="Woman with sinus symptoms" 
                  className="rounded-lg shadow-md w-full max-w-sm mx-auto mb-4 sm:mb-6"
                  loading="lazy"
                />

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">What it is:</h4>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Inflammation or infection of the sinuses (air-filled cavities around your nose). 
                      This causes swelling, fluid buildup, and pressure in your face.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Common Symptoms:</h4>
                    <ul className="space-y-1.5 sm:space-y-2 text-muted-foreground text-sm sm:text-base">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Facial pressure or pain</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Thick, colored nasal discharge</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Loss of smell or taste</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Post-nasal drip and cough</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>Headaches</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Common Causes:</h4>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Chronic sinusitis, allergies, nasal polyps, infections that won't go away. 
                      Often triggered by environmental factors or immune system issues.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Treatment Options:</h4>
                    <ul className="space-y-1.5 sm:space-y-2 text-muted-foreground text-sm sm:text-base">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>Medical Therapy:</strong> Saline irrigation, intranasal steroids, antibiotics for bacterial flares</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>Balloon Sinuplasty:</strong> In-office procedure, return to normal in 24-48 hours</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>FESS (Endoscopic Surgery):</strong> 5-7 days to work, 4-6 weeks full healing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>Biologics (Dupixent®):</strong> For chronic sinusitis with nasal polyps</span>
                      </li>
                    </ul>
                  </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </section>

      {/* About Nasal Assessment: NOSE and SNOT-12 */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 md:mb-10 text-center">
              About Nasal Assessment: NOSE and SNOT-12
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {/* NOSE Column */}
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">NOSE Assessment</h3>
                <div className="bg-primary/5 rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    <div className="text-center">
                      <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-1 sm:mb-2">5</div>
                      <div className="text-base sm:text-lg md:text-2xl font-semibold mb-0.5 sm:mb-1">Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">0-100</div>
                      <div className="text-sm sm:text-base md:text-lg font-semibold mb-0.5 sm:mb-1">Your Score Range</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Over 30 = treatment may help</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <p className="text-sm sm:text-base md:text-lg">
                    The NOSE (Nasal Obstruction Symptom Evaluation) is a validated clinical tool that measures nasal blockage and breathing difficulty.
                  </p>
                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Scores above 30-40 often indicate surgical intervention may provide relief</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Evaluates structural issues like deviated septum and turbinate swelling</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Quick assessment of how nasal blockage affects daily activities</span>
                    </li>
                  </ul>
                </div>

                <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-medium">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1 text-amber-600" />
                      <strong>Best for:</strong> Nasal congestion, difficulty breathing through nose, snoring
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* SNOT-12 Column */}
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">SNOT-12 Assessment</h3>
                <div className="bg-primary/5 rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    <div className="text-center">
                      <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-1 sm:mb-2">12</div>
                      <div className="text-base sm:text-lg md:text-2xl font-semibold mb-0.5 sm:mb-1">Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">0-60</div>
                      <div className="text-sm sm:text-base md:text-lg font-semibold mb-0.5 sm:mb-1">Your Score Range</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Over 30 = significant impact</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <p className="text-sm sm:text-base md:text-lg">
                    The SNOT-12 (Sino-Nasal Outcome Test) measures how chronic rhinosinusitis affects your quality of life.
                  </p>
                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Scores above 30 indicate severe impact requiring comprehensive treatment</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Assesses sinus pressure, post-nasal drip, facial pain, and smell loss</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-xs sm:text-sm md:text-base">Worldwide standard for evaluating chronic sinusitis severity</span>
                    </li>
                  </ul>
                </div>

                <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-medium">
                      <AlertCircle className="w-4 h-4 inline mr-1 text-amber-600" />
                      <strong>Best for:</strong> Sinus pain/pressure, post-nasal drip, recurring sinus infections
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What if I have both? */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="mt-6 sm:mt-8 md:mt-12 max-w-4xl mx-auto">
          {/* Symptom Overlap */}
            <Card className="bg-secondary/30">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center">
                  What if I have both?
                </h3>
                <p className="text-center text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
                  Many patients experience symptoms from both nasal obstruction and sinus inflammation. 
                  In fact, they often occur together because blocked nasal passages can trap bacteria and mucus, 
                  leading to sinus infections.
                </p>
                <p className="text-center text-muted-foreground mt-4 sm:mt-6 text-sm sm:text-base">
                  If you're experiencing symptoms from both categories, start with the test that best matches 
                  your <em>most bothersome</em> symptoms. Dr. {displayName} will review your results and help 
                  determine if you need additional evaluation.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Symptom Comparison Table */}
          <div className="mt-8 sm:mt-12 md:mt-16 max-w-6xl mx-auto">
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 sm:mb-6 text-foreground text-center">
              Symptom Guide at a Glance
            </h3>
            
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full border-collapse bg-card rounded-lg overflow-hidden shadow-sm min-w-[600px]">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-foreground border-b border-border text-xs sm:text-sm">Symptom/Feature</th>
                      <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-foreground border-b border-border text-xs sm:text-sm">Allergic/Non-Allergic Rhinitis</th>
                      <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-foreground border-b border-border text-xs sm:text-sm">Sinusitis (acute/chronic)</th>
                      <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-foreground border-b border-border text-xs sm:text-sm">Deviated Septum</th>
                      <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-foreground border-b border-border text-xs sm:text-sm">Nasal Valve Collapse</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Congestion</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Common</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Common</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Common</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Common</td>
                    </tr>
                    <tr className="border-b border-border bg-muted/30">
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Itchy/sneezy, clear runny nose</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Typical (esp. allergic)</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Uncommon</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">No</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">No</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Facial pressure, thick discharge</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Less typical</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Common</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">No</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">No</td>
                    </tr>
                    <tr className="border-b border-border bg-muted/30">
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Always blocked on one side</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Sometimes</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Sometimes</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Typical</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Possible</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Worse with deep breath/exercise</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">No</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">No</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">No</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Typical</td>
                    </tr>
                    <tr>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Loss of smell (long-standing)</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Possible</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Common</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Possible</td>
                      <td className="p-2 sm:p-3 md:p-4 text-muted-foreground text-xs sm:text-sm">Possible</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Treatment Options Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-6xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-center text-foreground">
            Comprehensive Treatment Options
          </h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto text-sm sm:text-base">
            Every patient's path is different. Here's an overview of treatment approaches based on your specific diagnosis.
          </p>

          {/* Nasal Obstruction Treatments */}
          <div className="mb-8 sm:mb-12 md:mb-16">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-foreground">
              Nasal Obstruction Treatments
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8">
              For structural issues like deviated septum, enlarged turbinates, or nasal valve collapse
            </p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                    Medical Therapy
                  </h4>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    Saline irrigation, intranasal corticosteroid sprays, antihistamines, and decongestants. 
                    Often the first-line approach for managing nasal congestion and inflammation.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground italic">
                    Non-invasive, low-risk foundation compatible with other treatments.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                    Septoplasty
                  </h4>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    Straightens a deviated septum to improve airflow through the nose. Performed as outpatient 
                    surgery, most patients experience dramatic improvement in breathing.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground italic">
                    Gold standard for septal deviation; definitive anatomic correction.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                    Turbinate Reduction
                  </h4>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    Office or OR procedure (e.g., radiofrequency or microdebrider) to shrink enlarged turbinates, 
                    increasing nasal airflow and reducing congestion.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground italic">
                    Quick recovery; often combined with septoplasty for comprehensive relief.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                    VivAer® Nasal Valve Treatment
                  </h4>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    In-office radiofrequency procedure (~20 minutes) that stiffens nasal valve tissue without implants. 
                    No external incisions, performed under local anesthesia.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground italic">
                    Many patients breathe better within days; ideal for nasal valve collapse.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                    LATERA® Nasal Implant
                  </h4>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    FDA-cleared absorbable implant placed in-office to support the lateral nasal wall and prevent collapse during breathing.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground italic">
                    Dissolves over 18 months while providing lasting structural support.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Image Section */}
          <section className="py-6 sm:py-8 md:py-12 bg-background">
            <div className="container mx-auto px-3 sm:px-4 md:px-6">
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
                <div className="rounded-lg overflow-hidden shadow-lg aspect-[4/3]">
                  <img 
                    src={sinusPressure}
                    alt="Understanding sinus pressure and pain"
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
                <div className="rounded-lg overflow-hidden shadow-lg aspect-[4/3]">
                  <img 
                    src={sinusRelief}
                    alt="Finding relief from sinus symptoms"
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Sinus Infection Treatments */}
          <div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-foreground">
              Sinus Infection Treatments
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8">
              For chronic sinusitis, recurrent infections, and sinus inflammation
            </p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                    At-Home & Medical Therapy
                  </h4>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    Saline irrigation and intranasal corticosteroid sprays are first-line for chronic rhinosinusitis. 
                    Short antibiotic courses are reserved for suspected acute bacterial flares.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground italic">
                    Non-invasive foundation of care; compatible with other treatment options.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                    Allergy-Directed Care
                  </h4>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    When allergies contribute to sinus problems, testing and tailored therapy (environmental control, 
                    medications, or immunotherapy) reduce inflammation and reinfection risk.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground italic">
                    Addresses root cause for better long-term outcomes.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                    Balloon Sinuplasty
                  </h4>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    A small, flexible balloon catheter gently opens narrowed sinus drainage pathways without removing tissue. 
                    Can be performed in-office under local anesthesia.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground italic">
                    Most patients return to normal activities within 24-48 hours.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                    Endoscopic Sinus Surgery (FESS)
                  </h4>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    Functional Endoscopic Sinus Surgery uses a thin endoscope and specialized instruments to remove blockages 
                    and diseased tissue. No external incisions, preserves healthy tissue.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground italic">
                    Return to work in 5-7 days; full healing 4-6 weeks. Nasal rinses important during recovery.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                    Steroid-Eluting Implants
                  </h4>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    Office-placed mometasone implants (e.g., SINUVA®) help shrink polyps and reduce inflammation 
                    in adults who have had prior ethmoid surgery.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground italic">
                    Targeted local therapy for recurrent polyps.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-foreground">
                    Biologic Therapy
                  </h4>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                    For uncontrolled chronic rhinosinusitis with nasal polyps, biologics such as dupilumab 
                    can reduce polyp size, congestion, and the need for surgery.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground italic">
                    Advanced option for severe, uncontrolled cases.
                  </p>
                </CardContent>
              </Card>
          </div>
        </div>

        <Card className="bg-background mt-6 sm:mt-8">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center">
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
                    Why Symptoms Overlap — And How We Narrow the Cause
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                    Many patients have both inflammation and structural issues at play. That's why sprays might help 
                    but never fully solve the problem—or why surgery alone may not relieve congestion if nasal valve 
                    collapse or turbinate swelling remains. Our comprehensive exam identifies all contributors so we 
                    can treat the full picture, not just one piece.
                  </p>
                </div>
                <div className="flex justify-center order-first md:order-last">
                  <img 
                    src={nasalExamDoctor} 
                    alt="Doctor examining patient's nasal symptoms" 
                    className="rounded-lg w-full max-w-sm md:max-w-md object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Conditional Test Section */}
      {selectedTest && (
        <section id="test-section" className="py-8 sm:py-12 md:py-16 bg-secondary/20 scroll-mt-20">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                  {selectedTest === 'nose' ? 'Take Your NOSE Assessment' : 'Take Your SNOT-12 Assessment'}
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                  {selectedTest === 'nose' 
                    ? 'The NOSE (Nasal Obstruction Symptom Evaluation) test helps quantify how much nasal blockage affects your daily life.'
                    : 'The SNOT-12 (Sino-Nasal Outcome Test) evaluates how chronic sinusitis impacts your quality of life.'
                  }
                </p>
              </div>

              <Card className="shadow-xl">
                <CardContent className="p-3 sm:p-4 md:p-6 flex flex-col" style={{ minHeight: isMobile ? '400px' : '500px', height: 'auto' }}>
                  <iframe 
                    src={selectedTest === 'nose' 
                      ? "https://leads.kleermessage.com/quiz/mehdi-arani?start=true"
                      : "https://leads.kleermessage.com/quiz/snot12-mehdi-arani?start=true"
                    }
                    className="w-full flex-1 border-0 rounded-lg"
                    style={{ minHeight: isMobile ? '400px' : '500px', height: '100%' }}
                    title={selectedTest === 'nose' ? 'NOSE Assessment' : 'SNOT-12 Assessment'}
                    scrolling="auto"
                  />
                </CardContent>
              </Card>

              {/* How Test Works */}
              <Card className="mt-6 sm:mt-8 bg-background">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">
                    How the {selectedTest === 'nose' ? 'NOSE' : 'SNOT-12'} Test Works
                  </h3>
                  
                  {selectedTest === 'nose' ? (
                    <div className="space-y-3 sm:space-y-4 text-muted-foreground text-sm sm:text-base">
                      <p>
                        The NOSE score is a validated, clinically-used tool that measures nasal obstruction on a scale of 0–100:
                      </p>
                      <div className="bg-secondary/30 p-3 sm:p-4 md:p-6 rounded-lg space-y-2 sm:space-y-3">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="font-bold text-foreground min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">0–25:</div>
                          <div className="text-xs sm:text-sm">Mild symptoms — lifestyle adjustments may help</div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="font-bold text-foreground min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">25–50:</div>
                          <div className="text-xs sm:text-sm">Moderate symptoms — medical consultation recommended</div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="font-bold text-foreground min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">50–75:</div>
                          <div className="text-xs sm:text-sm">Severe symptoms — treatment likely beneficial</div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="font-bold text-foreground min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">75–100:</div>
                          <div className="text-xs sm:text-sm">Extreme symptoms — surgery often provides significant relief</div>
                        </div>
                      </div>
                      <p>
                        Research shows that patients with NOSE scores above 30-40 often benefit from surgical intervention, 
                        with most experiencing dramatic improvements in breathing and quality of life.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4 text-muted-foreground text-sm sm:text-base">
                      <p>
                        The SNOT-12 is a validated questionnaire used worldwide to assess chronic rhinosinusitis (CRS). 
                        It measures 12 key symptoms on a scale of 0-5 each, for a total score of 0-60:
                      </p>
                      <div className="bg-secondary/30 p-3 sm:p-4 md:p-6 rounded-lg space-y-2 sm:space-y-3">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="font-bold text-foreground min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">0–20:</div>
                          <div className="text-xs sm:text-sm">Mild impact — conservative management may suffice</div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="font-bold text-foreground min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">20–40:</div>
                          <div className="text-xs sm:text-sm">Moderate impact — medical therapy recommended</div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="font-bold text-foreground min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">40+:</div>
                          <div className="text-xs sm:text-sm">Severe impact — comprehensive evaluation and treatment indicated</div>
                        </div>
                      </div>
                      <p>
                        Patients with scores above 30 typically have chronic sinusitis that significantly affects their 
                        quality of life and may benefit from advanced treatments like balloon sinuplasty or endoscopic surgery.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* What Happens Next */}
      <section className="py-8 sm:py-12 md:py-16 bg-background">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              What Happens After You Complete the Assessment?
            </h2>
            
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-6 sm:mt-8 md:mt-12">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2">Get Your Score</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                    You'll receive your score immediately along with a personalized interpretation of what it means.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2">
                    {isClinicLevel ? 'Our Team' : `Dr. ${displayName}`} Reviews
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                    Your results are sent directly to {isClinicLevel ? 'our team' : `Dr. ${displayName}`}, who will personally review your symptoms.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1.5 sm:mb-2">Schedule a Consultation</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                    Virtual or in-person appointment with {isClinicLevel ? 'our specialists' : `Dr. ${displayName}`}
                  </p>
                </CardContent>
              </Card>
            </div>

              <div className="mt-6 sm:mt-8 md:mt-12 p-4 sm:p-6 md:p-8 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-lg">
              <p className="text-sm sm:text-base md:text-lg mb-3 sm:mb-4 md:mb-6 text-center">
                Ready to take control of your breathing and quality of life?
              </p>
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  onClick={() => window.open(`${baseUrl}/embed/nose_snot?${quizParams}`, '_blank')}
                  className="w-full sm:w-auto text-sm sm:text-base md:text-lg py-5 sm:py-6 md:py-7 px-5 sm:px-6 md:px-8"
                >
                  Start your Nasal Assessment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>




      {/* Why Choose Section */}
      <section className="py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center">
              Why Choose {isClinicLevel ? (clinicData?.clinic_name || 'Our Practice') : `Dr. ${displayName}`} for Your Nasal & Sinus Health
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-10">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3">Board-Certified ENT</h3>
                  <p className="text-muted-foreground mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base">
                    Fellowship-trained specialist with comprehensive diagnostic approach
                  </p>
                  <p className="text-xs sm:text-sm text-primary font-medium">
                    20+ Years Experience
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl mb-2 sm:mb-3">Advanced Technology</h3>
                  <p className="text-muted-foreground mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base">
                    State-of-the-art diagnostics and minimally invasive procedures
                  </p>
                  <p className="text-xs sm:text-sm text-primary font-medium">
                    VivAer® & Balloon Sinuplasty Provider
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
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

            {/* Physician Cards - Show all for clinic level, or single for physician level */}
            {isClinicLevel && allPhysicians.length > 0 ? (
              <div className="space-y-4 sm:space-y-6">
                {allPhysicians.map((physician) => (
                  <Card key={physician.id} className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 sm:p-6 md:p-8">
                      <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden shadow-lg flex-shrink-0">
                          <img 
                            src={physician.headshot_url || drVaughnProfessional}
                            alt={`${physician.first_name} ${physician.last_name}, ${physician.degree_type}`}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: '50% 45%' }}
                            loading="lazy"
                          />
                        </div>
                        <div className="text-center md:text-left flex-1">
                          <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5 sm:mb-2">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
                              {physician.first_name} {physician.last_name}, {physician.degree_type || 'MD'}
                            </h3>
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          <p className="text-primary font-semibold mb-2 sm:mb-3 text-xs sm:text-sm md:text-base">
                            {physician.credentials?.join(' • ') || 'ENT Specialist'}
                          </p>
                          <p className="text-muted-foreground mb-2 sm:mb-3 text-xs sm:text-sm md:text-base">
                            {physician.short_bio || physician.bio || 'Experienced ENT specialist dedicated to helping patients breathe better.'}
                          </p>
                          <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                              <span>Nasal Obstruction Expert</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                              <span>Chronic Sinusitis Specialist</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden shadow-lg flex-shrink-0">
                      <img 
                        src={displayHeadshot}
                        alt={`${displayFullName}${displayDegree ? `, ${displayDegree}` : ''}`}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: '50% 45%', transform: isClinicLevel ? 'scale(1.35)' : 'scale(1)' }}
                        loading="lazy"
                      />
                    </div>
                    <div className="text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5 sm:mb-2">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
                          {displayFullName}{displayDegree ? `, ${displayDegree}` : ''}
                        </h3>
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
                          <span>Nasal Obstruction Expert</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                          <span>Chronic Sinusitis Specialist</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                          <span>Minimally Invasive Procedures</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section - Two Condition-Based Columns */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-6xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-10 md:mb-12 text-center text-foreground">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
            {/* Chronic Sinusitis FAQ Column */}
            <div className="bg-card border rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">🩺</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">Chronic Sinusitis</h3>
              </div>
              
              <Accordion type="single" collapsible className="space-y-2">
                <div className="mb-4">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Understanding the Condition</p>
                  <AccordionItem value="cs-1" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">What is the difference between a cold, allergies, and a sinus infection?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">A cold is a viral infection that typically resolves in 7-10 days. Allergies cause sneezing and clear drainage triggered by environmental factors. A sinus infection causes facial pressure, thick discolored drainage, and symptoms lasting longer than 10 days.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cs-2" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">What defines "chronic" sinusitis?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">Sinus inflammation lasting 12 weeks or longer. Requires comprehensive evaluation including CT imaging and nasal endoscopy to determine the underlying cause.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cs-3" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">Can sinusitis cause bad breath or tooth pain?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">Yes. Infected mucus causes halitosis. Upper tooth pain is common because molar roots are close to maxillary sinuses—inflammation mimics a toothache.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cs-4" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">How does an ENT diagnose chronic sinusitis?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">Medical history, nasal endoscopy (thin camera to visualize sinuses), and CT scan imaging. Allergy testing may identify contributing factors.</AccordionContent>
                  </AccordionItem>
                </div>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Treatment Options</p>
                  <AccordionItem value="cs-5" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">Do antibiotics work for chronic sinusitis?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">Not always. Most is inflammatory, not bacterial. First-line: saline irrigation, intranasal corticosteroids, and addressing allergies.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cs-6" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">What is Balloon Sinuplasty?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">Minimally invasive procedure using a balloon catheter to open blocked sinus passages. Return to normal in 24-48 hours. Can be done in-office.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cs-7" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">What is FESS and recovery time?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">Functional Endoscopic Sinus Surgery removes blockages with no external incisions. Return to work in 5-7 days, full healing 4-6 weeks.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="cs-8" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">What are biologics for sinusitis?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">Dupixent® targets inflammatory pathways in chronic sinusitis with nasal polyps. Can significantly reduce polyp size and symptoms.</AccordionContent>
                  </AccordionItem>
                </div>
              </Accordion>
            </div>

            {/* Nasal Obstruction FAQ Column */}
            <div className="bg-card border rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <span className="text-xl">👃</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">Nasal Obstruction</h3>
              </div>
              
              <Accordion type="single" collapsible className="space-y-2">
                <div className="mb-4">
                  <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Identifying the Cause</p>
                  <AccordionItem value="no-1" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">Why is only one side of my nose blocked?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">Often caused by a deviated septum. Other causes include enlarged turbinates or nasal polyps. Persistent one-sided blockage warrants ENT evaluation.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="no-2" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">What are the main causes?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3"><strong>Deviated Septum</strong> (crooked cartilage/bone), <strong>Turbinate Hypertrophy</strong> (enlarged nasal tissues), and <strong>Nasal Valve Collapse</strong> (weak sidewall). Many patients have a combination.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="no-3" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">What is Nasal Valve Collapse?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">Nose sidewall caves inward during inhalation. Symptoms: difficulty breathing during exercise, nostril "pinching" sensation, improvement with nasal strips. Highly treatable.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="no-4" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">Can mouth breathing cause health problems?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">Yes. Poor sleep, snoring, dry mouth, dental problems, facial development issues in children, and fatigue from non-restorative sleep.</AccordionContent>
                  </AccordionItem>
                </div>
                <div>
                  <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Surgical Options</p>
                  <AccordionItem value="no-5" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">What is Septoplasty?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">Straightens deviated septum through nostrils. Recovery: 5-7 days congestion, 1-2 weeks full activity. Most notice improvement within 2-4 weeks.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="no-6" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">What is Turbinate Reduction?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">Shrinks enlarged turbinates. Radiofrequency reduction is in-office with minimal downtime. Often combined with septoplasty.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="no-7" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">What options exist for Nasal Valve Collapse?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3"><strong>VivAer®:</strong> In-office radiofrequency (~20 min). <strong>LATERA®:</strong> Absorbable implant for lateral wall support. Both highly effective.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="no-8" className="border rounded-lg px-3 sm:px-4 bg-background/50">
                    <AccordionTrigger className="text-left hover:no-underline text-sm py-3">How long until I breathe normally after surgery?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm pb-3">Most notice improvement in 1-2 weeks. Full results over 4-12 weeks. In-office procedures like VivAer® often show faster recovery.</AccordionContent>
                  </AccordionItem>
                </div>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* References Section */}
      <section className="py-8 sm:py-12 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-foreground">References</h2>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 text-muted-foreground text-xs sm:text-sm">
            <p>1. <strong className="text-foreground">Exhale Sinus</strong> — <a href="https://www.exhalesinus.com/" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">exhalesinus.com</a></p>
            <p>2. <strong className="text-foreground">Mayo Clinic</strong> — <a href="https://www.mayoclinic.org/tests-procedures/septoplasty" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Septoplasty</a></p>
            <p>3. <strong className="text-foreground">Aerin Medical</strong> — <a href="https://www.aerinmedical.com/vivaer/" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">VivAer®</a></p>
            <p>4. <strong className="text-foreground">Stryker ENT</strong> — <a href="https://ent.stryker.com/" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Balloon Sinuplasty</a></p>
            <p>5. <strong className="text-foreground">SINUVA®</strong> — FDA-approved implant</p>
            <p>6. <strong className="text-foreground">Dupixent®</strong> — FDA add-on for CRSwNP</p>
            <p>7. <strong className="text-foreground">AAO</strong> — <a href="https://www.enthealth.org" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">enthealth.org</a></p>
            <p>8. <strong className="text-foreground">LATERA®</strong> — FDA-cleared nasal implant</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-foreground">
              Ready to Breathe Better?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">
              Don't let nasal or sinus problems hold you back any longer. Take the first step 
              toward lasting relief today.
            </p>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={() => window.open(`${baseUrl}/embed/nose_snot?${quizParams}`, '_blank')}
                className="w-full sm:w-auto text-base md:text-lg py-6 md:py-7 px-6 md:px-8"
              >
                Start your Nasal Assessment
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
              {clinicData?.logo_url ? (
                <img 
                  src={clinicData.logo_url} 
                  alt={clinicData?.clinic_name || 'Clinic Logo'} 
                  className="h-12 sm:h-14 md:h-16 mb-3 sm:mb-4 brightness-0 invert"
                  loading="lazy"
                />
              ) : (
                <img 
                  src={exhaleLogo} 
                  alt="Exhale Sinus" 
                  className="h-12 sm:h-14 md:h-16 mb-3 sm:mb-4 brightness-0 invert"
                  loading="lazy"
                />
              )}
              <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">
                {clinicData?.clinic_name || 'Exhale Sinus, TMJ, Headache & Sleep'}
              </h3>
              <p className="text-xs sm:text-sm text-background/70">
                Expert care for nasal obstruction, chronic sinus infections, and ENT conditions.
              </p>
            </div>

            {/* Locations */}
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                {clinicLocations.length > 1 ? 'Locations' : 'Location'}
              </h4>
              <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                {clinicLocations.length > 0 ? (
                  clinicLocations.map((location) => (
                    <div key={location.id} className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-1 flex-shrink-0" />
                      <div>
                        {location.address && <div>{location.address}</div>}
                        <div>
                          {[location.city, location.state, location.zip_code].filter(Boolean).join(', ')}
                        </div>
                        {location.phone && (
                          <a href={`tel:${location.phone}`} className="hover:text-primary transition-colors">
                            {location.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h4>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {clinicData?.website && (
                  <>
                    <a 
                      href={clinicData.website.includes('http') ? clinicData.website : `https://${clinicData.website}`}
                      className="block hover:text-primary transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Request an Appointment
                    </a>
                    <a 
                      href={clinicData.website.includes('http') ? clinicData.website : `https://${clinicData.website}`}
                      className="block hover:text-primary transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {clinicData?.clinic_name || 'Clinic'} Website
                    </a>
                  </>
                )}
                {!clinicData?.website && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-background/20 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-background/70">
            <p>&copy; {new Date().getFullYear()} {clinicData?.clinic_name || 'Exhale Sinus, TMJ, Headache & Sleep'}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA - Only visible on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg animate-in slide-in-from-bottom">
        <div className="container mx-auto px-3 py-2.5 sm:py-3">
          <Button 
            size="lg" 
            onClick={() => window.open(`${baseUrl}/embed/nose_snot?${quizParams}`, '_blank')}
            className="w-full text-sm sm:text-base py-5 sm:py-6 shadow-lg"
          >
            Start the Nasal Assessment
          </Button>
        </div>
      </div>
    </div>
  );
};