import { useParams, useSearchParams } from "react-router-dom";
import { MIDAS } from "@/components/quiz/MIDAS_Page";
import doctorImage from "@/assets/dr-vaughn.png";

const MIDASLandingPage = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [searchParams] = useSearchParams();
  
  // Get physicianId from query params, fall back to doctorId if not provided
  const physicianId = searchParams.get('physician');
  
  // Default to Dr. Vaughn's ID if not provided
  const effectiveDoctorId = doctorId || "192eedfe-92fd-4306-a272-4c06c01604cf";
  const effectivePhysicianId = physicianId || effectiveDoctorId;
  
  return (
    <MIDAS 
      doctorName="Vaughn" 
      doctorImage={doctorImage}
      doctorId={effectiveDoctorId}
      physicianId={effectivePhysicianId}
    />
  );
};

export default MIDASLandingPage;
