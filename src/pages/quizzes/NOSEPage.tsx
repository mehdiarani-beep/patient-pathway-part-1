
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function NOSEPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const key = searchParams.get('key');
    const doctor = searchParams.get('doctor');
    
    // Redirect to the universal quiz page
    if (key || doctor) {
      window.location.href = `/quiz/nose?key=${key}&doctor=${doctor}`;
    } else {
      window.location.href = '/quiz/nose';
    }
  }, [searchParams]);

  const handleSelectQuiz = () => {
    window.location.href = '/quiz/nose';
  };

  return (
    <div className="min-h-full w-full bg-gradient-to-br from-orange-50 to-teal-50 py-6 sm:py-8 md:py-12 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto w-full text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-teal-600 bg-clip-text text-transparent mb-6">
          NOSE Assessment
        </h1>
        <p className="text-xl text-gray-700 mb-8 font-medium">
          Nasal Obstruction Symptom Evaluation - Assess nasal breathing difficulties
        </p>
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border-2 border-orange-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">About This Assessment</h2>
          <p className="text-gray-600 leading-relaxed mb-6 text-lg">
            The NOSE scale evaluates how nasal obstruction affects your quality of life. 
            It measures the impact of nasal breathing problems on daily activities with a maximum score of 100.
          </p>
          <div className="flex items-center justify-center gap-6 mb-6 text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span className="text-sm font-medium">5 Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              <span className="text-sm font-medium">5-10 Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-sm font-medium">Max Score: 100</span>
            </div>
          </div>
          <button
            onClick={handleSelectQuiz}
            className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl text-lg"
          >
            🚀 Start NOSE Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
