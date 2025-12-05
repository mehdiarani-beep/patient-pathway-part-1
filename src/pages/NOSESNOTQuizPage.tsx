import { useSearchParams } from 'react-router-dom';
import { NOSESNOTPage } from '@/components/quiz/NOSESNOTPage';

export default function NOSESNOTQuizPage() {
  const [searchParams] = useSearchParams();
  
  const doctorId = searchParams.get('doctor');
  const physicianId = searchParams.get('physician');
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NOSESNOTPage 
        doctorId={doctorId || undefined}
        physicianId={physicianId || undefined}
      />
    </div>
  );
}
