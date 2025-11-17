
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function SNOT22Page() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const key = searchParams.get('key');
    const doctor = searchParams.get('doctor');
    
    // Redirect to the universal quiz page
    if (key || doctor) {
      window.location.href = `/quiz/snot22?key=${key}&doctor=${doctor}`;
    } else {
      window.location.href = '/quiz/snot22';
    }
  }, [searchParams]);

  const handleSelectQuiz = () => {
    window.location.href = '/quiz/snot22';
  };

  return (
    <div className="min-h-full w-full bg-slate-50 py-6 sm:py-8 md:py-12 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto w-full text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-6">
          SNOT-22 Assessment
        </h1>
        <p className="text-lg text-slate-700 mb-8">
          Sino-Nasal Outcome Test - Evaluate nasal and sinus symptoms
        </p>
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">About This Assessment</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            The SNOT-22 measures the impact of nasal and sinus symptoms on quality of life. 
            It evaluates physical problems, functional limitations, and emotional consequences.
          </p>
          <button
            onClick={handleSelectQuiz}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
          >
            Start SNOT-22 Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
