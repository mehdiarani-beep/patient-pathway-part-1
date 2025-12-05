import { useParams, useSearchParams } from 'react-router-dom';
import { NOSESNOTPage } from '@/components/quiz/NOSESNOTPage';

export default function NOSESNOTLandingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [searchParams] = useSearchParams();
  
  const physicianId = searchParams.get('physician');
  
  return (
    <NOSESNOTPage 
      doctorId={doctorId || undefined}
      physicianId={physicianId || undefined}
    />
  );
}
