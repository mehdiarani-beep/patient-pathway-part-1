import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePageTracking } from '@/hooks/usePageTracking';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Mail, Phone, Globe, MapPin, ExternalLink } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  degree_type: string | null;
  headshot_url: string | null;
  bio: string | null;
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

const ACTIVE_QUIZZES = [
  { id: 'NOSE_SNOT', label: 'Nasal Assessment', description: 'Evaluate nasal obstruction & sinus symptoms' },
  { id: 'EPWORTH', label: 'Sleepiness Scale', description: 'Assess daytime sleepiness levels' },
  { id: 'MIDAS', label: 'MSQ - Migraine', description: 'Migraine-specific quality of life' }
];

export default function PhysicianProfilePage() {
  const { physicianId } = useParams<{ physicianId: string }>();
  const [physician, setPhysician] = useState<Physician | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (physicianId) {
      fetchPhysicianData();
    }
  }, [physicianId]);

  const fetchPhysicianData = async () => {
    try {
      // Fetch physician data
      const { data: physData, error: physError } = await supabase
        .from('clinic_physicians')
        .select('*')
        .eq('id', physicianId)
        .single();

      if (physError || !physData) {
        console.error('Error fetching physician:', physError);
        setLoading(false);
        return;
      }

      setPhysician(physData);

      // Fetch clinic data
      if (physData.clinic_id) {
        const { data: clinicData } = await supabase
          .from('clinic_profiles')
          .select('*')
          .eq('id', physData.clinic_id)
          .single();

        if (clinicData) {
          setClinic(clinicData);

          // Get doctor profile for the clinic
          const { data: docProfile } = await supabase
            .from('doctor_profiles')
            .select('id')
            .eq('clinic_id', physData.clinic_id)
            .limit(1)
            .single();

          if (docProfile) {
            setDoctorId(docProfile.id);
          }
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Track page view
  usePageTracking({
    pageType: 'physician_profile',
    pageName: 'Physician Profile',
    doctorId: doctorId || undefined,
    physicianId: physicianId,
    clinicId: clinic?.id,
    physicianName: physician ? `Dr. ${physician.first_name} ${physician.last_name}` : undefined,
    clinicName: clinic?.clinic_name
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!physician) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Physician Not Found</h1>
          <p className="text-muted-foreground">The requested physician profile does not exist.</p>
        </Card>
      </div>
    );
  }

  const physicianName = `Dr. ${physician.first_name} ${physician.last_name}`;
  const fullName = `${physicianName}${physician.degree_type ? `, ${physician.degree_type}` : ''}`;

  return (
    <>
      <SEOHead 
        title={`${fullName} | ${clinic?.clinic_name || 'Medical Practice'}`}
        description={physician.bio || `${physicianName} specializes in ENT care. Take a self-assessment quiz and schedule your appointment today.`}
        keywords="ENT doctor, physician, medical practice"
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8 px-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="p-6 text-center space-y-4">
            {/* Clinic Logo */}
            {clinic?.logo_url && (
              <div className="flex justify-center mb-2">
                <img 
                  src={clinic.logo_url} 
                  alt={clinic.clinic_name} 
                  className="h-10 object-contain"
                />
              </div>
            )}

            {/* Physician Avatar */}
            <Avatar className="h-28 w-28 mx-auto ring-4 ring-primary/20">
              <AvatarImage src={physician.headshot_url || ''} alt={physicianName} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {physician.first_name[0]}{physician.last_name[0]}
              </AvatarFallback>
            </Avatar>

            {/* Name & Credentials */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
              {physician.credentials && physician.credentials.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {physician.credentials.map((cred, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {cred}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Bio */}
            {physician.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {physician.bio}
              </p>
            )}

            {/* Clinic Info */}
            {clinic && (
              <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  <span>{clinic.clinic_name}</span>
                </div>
                {clinic.city && clinic.state && (
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{clinic.city}, {clinic.state}</span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Assessment Links */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-center">Take an Assessment</h2>
            <div className="space-y-3">
              {ACTIVE_QUIZZES.map((quiz) => (
                <a
                  key={quiz.id}
                  href={`/share/${quiz.id.toLowerCase()}/${doctorId}?physician=${physicianId}`}
                  className="block"
                >
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-4 px-4 hover:bg-primary/5 hover:border-primary"
                  >
                    <div className="text-left">
                      <div className="font-semibold">{quiz.label}</div>
                      <div className="text-xs text-muted-foreground">{quiz.description}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
                  </Button>
                </a>
              ))}
            </div>
          </Card>

          {/* Contact Links */}
          <Card className="p-6 space-y-3">
            <h2 className="text-lg font-semibold text-center">Get in Touch</h2>
            
            {clinic?.website && (
              <a href={clinic.website} target="_blank" rel="noopener noreferrer">
                <Button variant="default" className="w-full">
                  <Globe className="w-4 h-4 mr-2" />
                  Book an Appointment
                </Button>
              </a>
            )}

            {clinic?.phone && (
              <a href={`tel:${clinic.phone}`}>
                <Button variant="outline" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Call {clinic.phone}
                </Button>
              </a>
            )}

            {physician.email && (
              <a href={`mailto:${physician.email}`}>
                <Button variant="outline" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </a>
            )}
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4">
            <p>Powered by PatientPathway.ai</p>
          </div>
        </div>
      </div>
    </>
  );
}
