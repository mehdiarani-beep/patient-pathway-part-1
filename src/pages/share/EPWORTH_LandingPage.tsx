import { useParams, useSearchParams } from "react-router-dom";
import { EPWORTH } from "@/components/quiz/EPWORTH_Page";
import doctorImage from "@/assets/dr-vaughn-professional.png";
import { usePageTracking } from "@/hooks/usePageTracking";

const EPWORTHLandingPage = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [searchParams] = useSearchParams();
  
  // Get physicianId from query params, fall back to doctorId if not provided
  const physicianId = searchParams.get('physician');
  
  // Default to Dr. Vaughn's ID if not provided
  const effectiveDoctorId = doctorId || "192eedfe-92fd-4306-a272-4c06c01604cf";
  const effectivePhysicianId = physicianId || effectiveDoctorId;

  // Track page view
  usePageTracking({
    pageType: 'landing_page',
    pageName: 'Epworth Sleepiness Scale',
    doctorId: effectiveDoctorId,
    physicianId: effectivePhysicianId
  });
  
  return (
    <EPWORTH 
      doctorName="Vaughn" 
      doctorImage={doctorImage}
      doctorId={effectiveDoctorId}
      physicianId={effectivePhysicianId}
    />
  );
};

export default EPWORTHLandingPage;
