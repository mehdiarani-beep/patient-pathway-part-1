import { useParams } from "react-router-dom";
import { NOSE_SNOT } from "@/components/quiz/NOSE_SNOTPage";
import doctorImage from "@/assets/dr-vaughn.png";

const NasalVaughn = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  // Default to Dr. Vaughn's ID if not provided in URL
  const effectiveDoctorId = doctorId || "192eedfe-92fd-4306-a272-4c06c01604cf";
  
  return (
    <NOSE_SNOT 
      doctorName="Vaughn" 
      doctorImage={doctorImage} 
      doctorId={effectiveDoctorId}
    />
  );
};

export default NasalVaughn;
