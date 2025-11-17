
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function EpworthPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const key = searchParams.get('key');
    const doctor = searchParams.get('doctor');
    
    if (key || doctor) {
      window.location.href = `/quiz?type=EPWORTH&key=${key}&doctor=${doctor}&mode=single`;
    }
  }, [searchParams]);

  const handleSelectQuiz = () => {
    window.location.href = '/quiz?type=EPWORTH&mode=single';
  };

  return (
    <div className="min-h-full w-full bg-slate-50 py-6 sm:py-8 md:py-12 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto w-full text-center">
        <h1 className="text-4xl font-bold text-indigo-600 mb-6">
          Epworth Sleepiness Scale
        </h1>
        <p className="text-lg text-slate-700 mb-8">
          Assess daytime sleepiness and sleep disorders
        </p>
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">About This Assessment</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            The Epworth Sleepiness Scale measures your likelihood of falling asleep in different situations. 
            It helps identify potential sleep disorders and excessive daytime sleepiness.
          </p>
          <button
            onClick={handleSelectQuiz}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
          >
            Start Epworth Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
