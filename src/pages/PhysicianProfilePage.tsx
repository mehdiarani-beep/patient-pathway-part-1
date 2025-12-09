import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePageTracking } from '@/hooks/usePageTracking';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SEOHead } from '@/components/seo/SEOHead';
import { Calendar, Youtube, Instagram } from 'lucide-react';
import { FaTiktok } from 'react-icons/fa';

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  degree_type: string | null;
  headshot_url: string | null;
  bio: string | null;
  short_bio: string | null;
  credentials: string[] | null;
  email: string | null;
  mobile: string | null;
  clinic_id: string;
}

interface Clinic {
  id: string;
  clinic_name: string;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
}

export default function PhysicianProfilePage() {
  const { physicianId, slug } = useParams<{ physicianId?: string; slug?: string }>();
  const [physician, setPhysician] = useState<Physician | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedPhysicianId, setResolvedPhysicianId] = useState<string | null>(null);

  useEffect(() => {
    if (physicianId || slug) {
      fetchPhysicianData();
    }
  }, [physicianId, slug]);

  const fetchPhysicianData = async () => {
    try {
      let physData;
      
      // Look up by physicianId or by slug
      if (physicianId) {
        const { data, error } = await supabase
          .from('clinic_physicians')
          .select('*')
          .eq('id', physicianId)
          .single();
        
        if (error || !data) {
          console.error('Error fetching physician by ID:', error);
          setLoading(false);
          return;
        }
        physData = data;
      } else if (slug) {
        const { data, error } = await supabase
          .from('clinic_physicians')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (error || !data) {
          console.error('Error fetching physician by slug:', error);
          setLoading(false);
          return;
        }
        physData = data;
      } else {
        setLoading(false);
        return;
      }

      setPhysician(physData);
      setResolvedPhysicianId(physData.id);

      if (physData.clinic_id) {
        const { data: clinicData } = await supabase
          .from('clinic_profiles')
          .select('*')
          .eq('id', physData.clinic_id)
          .single();

        if (clinicData) {
          setClinic(clinicData);

          // Use clinic's created_by (owner) as doctorId for proper link attribution
          if (clinicData.created_by) {
            const { data: docProfile } = await supabase
              .from('doctor_profiles')
              .select('id')
              .eq('user_id', clinicData.created_by)
              .limit(1)
              .single();

            if (docProfile) {
              setDoctorId(docProfile.id);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  usePageTracking({
    pageType: 'physician_profile',
    pageName: physician ? `Dr. ${physician.first_name} ${physician.last_name}` : 'Physician Profile',
    doctorId: doctorId || undefined,
    physicianId: resolvedPhysicianId || physicianId,
    clinicId: clinic?.id,
    physicianName: physician ? `Dr. ${physician.first_name} ${physician.last_name}` : undefined,
    clinicName: clinic?.clinic_name
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#5ba4c9] to-[#1e3a5f]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!physician) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#5ba4c9] to-[#1e3a5f]">
        <div className="p-8 text-center text-white">
          <h1 className="text-2xl font-bold mb-2">Physician Not Found</h1>
          <p className="opacity-80">The requested physician profile does not exist.</p>
        </div>
      </div>
    );
  }

  const physicianName = `Dr. ${physician.first_name} ${physician.last_name}`;
  const displayBio = physician.short_bio || physician.bio;

  return (
    <>
      <SEOHead 
        title={`${physicianName} | ${clinic?.clinic_name || 'Medical Practice'}`}
        description={displayBio || `${physicianName} specializes in ENT care. Take a self-assessment quiz and schedule your appointment today.`}
        keywords="ENT doctor, physician, medical practice"
      />

      <div className="min-h-screen bg-gradient-to-b from-[#5ba4c9] to-[#1e3a5f] py-8 px-4">
        <div className="max-w-md mx-auto space-y-8">
          
          {/* Profile Header Section */}
          <div className="text-center space-y-4">
            {/* Logo removed from header */}

            {/* Physician Avatar - Large Circle */}
            <Avatar className="h-32 w-32 mx-auto ring-4 ring-white/30 shadow-xl">
              <AvatarImage src={physician.headshot_url || ''} alt={physicianName} className="object-cover" />
              <AvatarFallback className="bg-white/20 text-white text-3xl font-bold">
                {physician.first_name[0]}{physician.last_name[0]}
              </AvatarFallback>
            </Avatar>

            {/* Physician Name */}
            <h1 className="text-2xl font-bold text-white">
              {physicianName}
            </h1>

            {/* Short Bio */}
            {displayBio && (
              <p className="text-white/90 text-sm leading-relaxed max-w-sm mx-auto">
                {displayBio}
              </p>
            )}

            {/* Clinic Name */}
            {clinic && (
              <p className="text-white/70 text-sm font-medium">
                {clinic.clinic_name}
              </p>
            )}

            {/* Social Icons - Hidden for now */}
            {/* <div className="flex justify-center gap-4 pt-2">
              <a href="https://www.youtube.com/@exhalesinus" target="_blank" rel="noopener noreferrer" 
                 className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Youtube className="w-5 h-5 text-white" />
              </a>
              <a href="https://www.instagram.com/exhalesinus/" target="_blank" rel="noopener noreferrer"
                 className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a href="https://www.tiktok.com/@exhalesinus" target="_blank" rel="noopener noreferrer"
                 className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <FaTiktok className="w-5 h-5 text-white" />
              </a>
            </div> */}
          </div>

          {/* Medical Evals & Symptoms Checker Section */}
          <div className="space-y-4">
            <h2 className="text-white text-center font-semibold text-lg">
              Medical Evals & Symptoms Checker
            </h2>
            
            <div className="space-y-3">
              {/* Nasal Assessment Link */}
              <a
                href={`/embed/nose_snot?doctor=${doctorId}?physician=${physicianId}&source=website&utm_source=website&utm_medium=web&utm_campaign=quiz_share`}
                className="block"
              >
                <div className="flex items-center gap-4 p-4 rounded-full border-2 border-white/30 bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 4C10 4 9 6 9 8C9 10 8 12 6 14C4 16 4 18 6 20M12 4C14 4 15 6 15 8C15 10 16 12 18 14C20 16 20 18 18 20" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <div className="flex-1 text-center pr-12">
                    <p className="text-white font-medium text-sm leading-tight">
                      Trouble Breathing? Blocked nose or sinus issue? Start your test to find out
                    </p>
                  </div>
                </div>
              </a>

              {/* Epworth Link */}
              <a
                href={`/embed/epworth?doctor=${doctorId}?physician=${physicianId}&source=website&utm_source=website&utm_medium=web&utm_campaign=quiz_share`}
                className="block"
              >
                <div className="flex items-center gap-4 p-4 rounded-full border-2 border-white/30 bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="10" r="6" />
                      <path d="M8 8.5C8.5 9 9 9 9.5 8.5M14.5 8.5C15 9 15.5 9 16 8.5" />
                      <path d="M9 20h6M12 16v4" />
                      <path d="M7 3l-2 2M17 3l2 2" />
                    </svg>
                  </div>
                  <div className="flex-1 text-center pr-12">
                    <p className="text-white font-medium text-sm leading-tight">
                      Struggling to Stay Awake? Start your test to find out why
                    </p>
                  </div>
                </div>
              </a>

              {/* MSQ/Migraine Link */}
              <a
                href={`/embed/midas?doctor=${doctorId}?physician=${physicianId}&source=website&utm_source=website&utm_medium=web&utm_campaign=quiz_share`}
                className="block"
              >
                <div className="flex items-center gap-4 p-4 rounded-full border-2 border-white/30 bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="10" r="7" />
                      <path d="M7 7l2 3M17 7l-2 3" />
                      <path d="M5 4l-1-2M19 4l1-2M3 10l-2 0M21 10l2 0" />
                    </svg>
                  </div>
                  <div className="flex-1 text-center pr-12">
                    <p className="text-white font-medium text-sm leading-tight">
                      Is It Just a Headache or Something More? Start your test to find out
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Symptom and Treatment Resources Section */}
          <div className="space-y-4">
            <h2 className="text-white text-center font-semibold text-lg">
              Symptom and Treatment Resources
            </h2>
            
            <div className="space-y-3">
              {/* Nasal & Sinus Resources */}
              <a
                href={`/share/nose_snot?doctor=${doctorId}&physician=${physicianId}&source=website&utm_source=website&utm_medium=web&utm_campaign=quiz_share`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="p-4 rounded-full border-2 border-white/30 bg-white/5 hover:bg-white/10 transition-colors text-center">
                  <p className="text-white font-medium text-sm">
                    Nasal & Sinus Symptoms, Causes and Treatments
                  </p>
                </div>
              </a>
              {/* Sleepiness Resources */}
              <a
                href={`/share/epworth?doctor=${doctorId}&physician=${physicianId}&source=website&utm_source=website&utm_medium=web&utm_campaign=quiz_share`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="p-4 rounded-full border-2 border-white/30 bg-white/5 hover:bg-white/10 transition-colors text-center">
                  <p className="text-white font-medium text-sm">
                    Sleepiness Symptoms, Causes and Treatments
                  </p>
                </div>
              </a>
              {/* Migraine Resources */}
              <a
                href={`/share/midas?doctor=${doctorId}&physician=${physicianId}&source=website&utm_source=website&utm_medium=web&utm_campaign=quiz_share`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="p-4 rounded-full border-2 border-white/30 bg-white/5 hover:bg-white/10 transition-colors text-center">
                  <p className="text-white font-medium text-sm">
                    Migraine Symptoms, Causes and Treatments
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Appointment Section */}
          <div className="space-y-4">
            <h2 className="text-white text-center font-semibold text-lg">
              Appointment
            </h2>
            
            <a
              href="https://www.exhalesinus.com/request-an-appointment"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="flex items-center gap-4 p-4 rounded-full border-2 border-white/30 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-center pr-12">
                  <p className="text-white font-medium text-sm">
                    Request an appointment
                  </p>
                </div>
              </div>
            </a>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-white/50 pt-4 pb-8">
            <p>Powered by PatientPathway.ai</p>
          </div>
        </div>
      </div>
    </>
  );
}
