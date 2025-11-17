
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function NOSEPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const key = searchParams.get('key');
    const doctor = searchParams.get('doctor');
    
    if (key || doctor) {
      // Redirect to the main quiz interface with proper parameters
      const params = new URLSearchParams();
      params.set('type', 'NOSE');
      if (key) params.set('key', key);
      if (doctor) params.set('doctor', doctor);
      params.set('mode', 'single');
      
      navigate(`/quiz?${params.toString()}`);
    }
  }, [searchParams, navigate]);

  const handleSelectQuiz = () => {
    const params = new URLSearchParams();
    params.set('type', 'NOSE');
    params.set('mode', 'single');
    navigate(`/quiz?${params.toString()}`);
  };

  return (
    <div className="min-h-full w-full bg-gradient-to-br from-green-50 to-blue-50 py-6 sm:py-8 md:py-12 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#0E7C9D] to-[#FD904B] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <img 
              src="/src/assets/doctor.png" 
              alt="Patient Pathway"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-5xl font-bold text-[#0E7C9D] mb-4">
            NOSE Assessment
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Nasal Obstruction Symptom Evaluation - Assess your nasal breathing
          </p>
        </div>
        
        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-8 border border-gray-100 hover-lift">
          <div className="text-6xl mb-6">🫁</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">About This Assessment</h2>
          <p className="text-gray-600 leading-relaxed mb-8 text-lg">
            The NOSE scale is a validated instrument for evaluating nasal obstruction symptoms. 
            It helps assess how nasal congestion affects your quality of life and daily activities.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-blue-50 rounded-2xl">
              <div className="text-3xl mb-2">⏱️</div>
              <h3 className="font-semibold text-gray-800">Quick</h3>
              <p className="text-sm text-gray-600">5 minutes to complete</p>
            </div>
            <div className="p-4 bg-green-50 rounded-2xl">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-800">Accurate</h3>
              <p className="text-sm text-gray-600">Medically validated</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-800">Detailed</h3>
              <p className="text-sm text-gray-600">Comprehensive results</p>
            </div>
          </div>
          
          <button
            onClick={handleSelectQuiz}
            className="bg-gradient-to-r from-[#0E7C9D] to-[#FD904B] hover:from-[#0E7C9D]/90 hover:to-[#FD904B]/90 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg text-lg"
          >
            Start NOSE Assessment
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">
            This assessment is confidential and your results will be reviewed by qualified medical professionals.
          </p>
        </div>
      </div>
    </div>
  );
}
