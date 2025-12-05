import { useParams, useSearchParams } from "react-router-dom";
import { NOSE_SNOT } from "@/components/quiz/NOSE_SNOTPage";
import doctorImage from "@/assets/dr-vaughn.png";

const NasalAssessmentLandingPage = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [searchParams] = useSearchParams();
  
  // Get physicianId from query params, fall back to doctorId if not provided
  const physicianId = searchParams.get('physician');
  
  // Default to Dr. Vaughn's ID if not provided in URL
  const effectiveDoctorId = doctorId || "192eedfe-92fd-4306-a272-4c06c01604cf";
  // If no explicit physicianId, use the doctorId (clinic-level quiz)
  const effectivePhysicianId = physicianId || effectiveDoctorId;
  
  return (
    <NOSE_SNOT 
      doctorName="Vaughn" 
      doctorImage={doctorImage} 
      doctorIdparam={effectiveDoctorId}
      physicianId={effectivePhysicianId}
    />
  );
};

export default NasalAssessmentLandingPage;
