import { useParams, useSearchParams } from 'react-router-dom';
import { NOSESNOTPage } from '@/components/quiz/NOSESNOTPage';
import { usePageTracking } from '@/hooks/usePageTracking';

export default function NOSESNOTLandingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [searchParams] = useSearchParams();
  
  const physicianId = searchParams.get('physician');

  // Track page view
  usePageTracking({
    pageType: 'quiz_standard',
    pageName: 'NOSE_SNOT Quiz',
    doctorId: doctorId,
    physicianId: physicianId || doctorId
  });
  
  return (
    <NOSESNOTPage 
      doctorId={doctorId || undefined}
      physicianId={physicianId || undefined}
    />
  );
}
