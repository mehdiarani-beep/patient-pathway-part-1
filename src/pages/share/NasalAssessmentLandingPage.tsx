import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronDown, Phone, Mail, MapPin } from "lucide-react";

interface DoctorProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  clinic_name: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  logo_url: string | null;
  avatar_url: string | null;
  specialty: string | null;
  website: string | null;
}

export default function NasalAssessmentLandingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [searchParams] = useSearchParams();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!doctorId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("doctor_profiles")
          .select("*")
          .eq("id", doctorId)
          .single();

        if (error) throw error;
        setDoctorProfile(data);
      } catch (err) {
        console.error("Error fetching doctor profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, [doctorId]);

  const doctorName = doctorProfile
    ? `Dr. ${doctorProfile.first_name || ""} ${doctorProfile.last_name || ""}`.trim()
    : "Your ENT Specialist";
  
  const clinicName = doctorProfile?.clinic_name || "ENT Medical Center";
  const quizUrl = doctorId 
    ? `${window.location.origin}/embed/chatbot/NOSE_SNOT/${doctorId}`
    : `${window.location.origin}/embed/chatbot/NOSE_SNOT`;

  const scrollToQuiz = () => {
    const heroQuiz = document.getElementById('hero-quiz');
    if (heroQuiz) {
      heroQuiz.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a9ce]" />
      </div>
    );
  }

  useEffect(() => {
    document.title = `Nasal Assessment - ${clinicName}`;
  }, [clinicName]);

  return (
    <div className="font-sans text-[#1a1a2e] bg-white">
        {/* Hero Section */}
        <section 
          className="relative min-h-[600px] flex items-center py-8"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1920&h=1080&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#00a9ce]/65 to-[#00a9ce]/70" />
          
          <div className="relative z-10 w-full px-4 max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left Content */}
              <div>
                <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium mb-4">
                  ✓ Trusted by thousands of patients
                </span>
                <h1 className="text-[2.5rem] md:text-[3.5rem] font-bold leading-[1.1] text-white mb-6">
                  Struggling to Breathe Through Your Nose?
                </h1>
                <p className="text-lg text-white/95 mb-8 leading-relaxed">
                  Take our quick "Nose Test" to see if you have nasal airway obstruction or sinus issues. 
                  Get personalized results and treatment options from {clinicName}.
                </p>
                <button 
                  onClick={scrollToQuiz}
                  className="hidden md:inline-block px-8 py-3.5 bg-[#00a9ce] text-white font-semibold rounded-lg shadow-lg hover:bg-[#0088a8] hover:-translate-y-0.5 transition-all"
                >
                  Take the Assessment
                </button>
              </div>

              {/* Right - Quiz Embed */}
              <div id="hero-quiz" className="bg-white/50 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                <iframe
                  src={quizUrl}
                  className="w-full h-[480px] border-none"
                  title="Nasal Assessment Quiz"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Doctor Note Section */}
        <section className="py-16 bg-white">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <img
                  src={doctorProfile?.avatar_url || doctorProfile?.logo_url || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=600&fit=crop"}
                  alt={doctorName}
                  className="w-full rounded-xl shadow-2xl"
                />
              </div>
              <div>
                <h2 className="text-[2rem] font-bold mb-6">A Note from {doctorName}</h2>
                <div className="text-[#6b7280] mb-8">
                  <p className="mb-4">
                    If you're constantly struggling to breathe through your nose, you're not alone. 
                    Millions of people suffer from nasal obstruction and chronic sinus issues that 
                    affect their quality of life.
                  </p>
                  <p className="mb-4">
                    I've helped countless patients find relief through proper diagnosis and 
                    personalized treatment plans. This quick assessment is the first step 
                    toward understanding your condition and finding the right solution.
                  </p>
                  <p className="mt-6 font-medium text-[#1a1a2e]">
                    — {doctorName}<br />
                    <span className="text-[#6b7280] font-normal">{clinicName}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Triage Section */}
        <section className="py-16 bg-gradient-to-b from-white to-[#f8f9fa]">
          <div className="max-w-[900px] mx-auto px-4">
            <div className="bg-white border-2 border-[#00a9ce]/20 rounded-2xl p-8 md:p-12 shadow-lg">
              <h2 className="text-[1.75rem] text-center font-bold mb-4">
                What Brings You Here Today?
              </h2>
              <p className="text-center text-[#6b7280] mb-8 text-lg">
                Select the option that best describes your primary concern
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option A - Nasal Blockage */}
                <a 
                  href="#hero-quiz"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToQuiz();
                  }}
                  className="block p-6 border-2 border-[#e5e7eb] rounded-xl hover:border-[#00a9ce] hover:scale-[1.02] hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-2xl">👃</span>
                    <h3 className="text-xl font-bold">Nasal Blockage / Stuffiness</h3>
                  </div>
                  <ul className="mb-4">
                    <li className="flex items-start gap-2 text-sm text-[#6b7280] mb-2">
                      <Check className="w-4 h-4 text-[#00a9ce] mt-0.5 flex-shrink-0" />
                      Difficulty breathing through one or both nostrils
                    </li>
                    <li className="flex items-start gap-2 text-sm text-[#6b7280] mb-2">
                      <Check className="w-4 h-4 text-[#00a9ce] mt-0.5 flex-shrink-0" />
                      Congestion that doesn't improve with medication
                    </li>
                    <li className="flex items-start gap-2 text-sm text-[#6b7280] mb-2">
                      <Check className="w-4 h-4 text-[#00a9ce] mt-0.5 flex-shrink-0" />
                      Snoring or mouth breathing
                    </li>
                  </ul>
                  <span className="text-sm font-semibold text-[#00a9ce]">
                    Take the NOSE Assessment →
                  </span>
                </a>

                {/* Option B - Sinus Issues */}
                <a 
                  href="#hero-quiz"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToQuiz();
                  }}
                  className="block p-6 border-2 border-[#e5e7eb] rounded-xl hover:border-[#00a9ce] hover:scale-[1.02] hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-2xl">🤧</span>
                    <h3 className="text-xl font-bold">Sinus-Related Symptoms</h3>
                  </div>
                  <ul className="mb-4">
                    <li className="flex items-start gap-2 text-sm text-[#6b7280] mb-2">
                      <Check className="w-4 h-4 text-[#00a9ce] mt-0.5 flex-shrink-0" />
                      Facial pain or pressure
                    </li>
                    <li className="flex items-start gap-2 text-sm text-[#6b7280] mb-2">
                      <Check className="w-4 h-4 text-[#00a9ce] mt-0.5 flex-shrink-0" />
                      Thick nasal discharge or post-nasal drip
                    </li>
                    <li className="flex items-start gap-2 text-sm text-[#6b7280] mb-2">
                      <Check className="w-4 h-4 text-[#00a9ce] mt-0.5 flex-shrink-0" />
                      Reduced sense of smell
                    </li>
                  </ul>
                  <span className="text-sm font-semibold text-[#00a9ce]">
                    Take the SNOT Assessment →
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Education Section */}
        <section className="py-16 bg-white">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-[2rem] text-center font-bold mb-2">
              Understanding Your Symptoms
            </h2>
            <p className="text-center text-[#6b7280] mb-12 max-w-[700px] mx-auto">
              Learn more about the conditions that may be causing your nasal and sinus symptoms
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1100px] mx-auto">
              {/* Card 1 - Nasal Obstruction */}
              <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-md">
                <div className="flex items-center gap-3 p-6 pb-0">
                  <div className="w-12 h-12 flex items-center justify-center bg-[#00a9ce]/10 rounded-full text-2xl">
                    👃
                  </div>
                  <h3 className="text-2xl font-bold">Nasal Obstruction</h3>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=300&fit=crop"
                  alt="Nasal obstruction"
                  className="w-full h-[200px] object-cover my-6"
                />
                <div className="px-6 pb-6">
                  <h4 className="font-semibold mb-2">What is it?</h4>
                  <p className="text-[#6b7280] mb-4">
                    Nasal obstruction is a blockage that makes it difficult to breathe through your nose. 
                    It can be caused by a deviated septum, enlarged turbinates, or nasal valve collapse.
                  </p>
                  <h4 className="font-semibold mb-2 mt-6">Common Symptoms</h4>
                  <ul>
                    <li className="flex items-start gap-2 text-[#6b7280] mb-2">
                      <Check className="w-4 h-4 text-[#00a9ce] mt-1 flex-shrink-0" />
                      Chronic nasal congestion
                    </li>
                    <li className="flex items-start gap-2 text-[#6b7280] mb-2">
                      <Check className="w-4 h-4 text-[#00a9ce] mt-1 flex-shrink-0" />
                      Difficulty breathing during sleep
                    </li>
                    <li className="flex items-start gap-2 text-[#6b7280] mb-2">
                      <Check className="w-4 h-4 text-[#00a9ce] mt-1 flex-shrink-0" />
                      Snoring or sleep apnea
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 2 - Chronic Sinusitis */}
              <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-md">
                <div className="flex items-center gap-3 p-6 pb-0">
                  <div className="w-12 h-12 flex items-center justify-center bg-[#00a9ce]/10 rounded-full text-2xl">
                    🤧
                  </div>
                  <h3 className="text-2xl font-bold">Chronic Sinusitis</h3>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&h=300&fit=crop"
                  alt="Chronic sinusitis"
                  className="w-full h-[200px] object-cover my-6"
                />
                <div className="px-6 pb-6">
                  <h4 className="font-semibold mb-2">What is it?</h4>
                  <p className="text-[#6b7280] mb-4">
                    Chronic sinusitis is inflammation of the sinuses lasting 12 weeks or more. 
                    It can cause persistent facial pain, nasal discharge, and reduced smell.
                  </p>
                  <h4 className="font-semibold mb-2 mt-6">Common Symptoms</h4>
                  <ul>
                    <li className="flex items-start gap-2 text-[#6b7280] mb-2">
                      <Check className="w-4 h-4 text-[#00a9ce] mt-1 flex-shrink-0" />
                      Facial pressure and pain
                    </li>
                    <li className="flex items-start gap-2 text-[#6b7280] mb-2">
                      <Check className="w-4 h-4 text-[#00a9ce] mt-1 flex-shrink-0" />
                      Thick nasal discharge
                    </li>
                    <li className="flex items-start gap-2 text-[#6b7280] mb-2">
                      <Check className="w-4 h-4 text-[#00a9ce] mt-1 flex-shrink-0" />
                      Loss of smell and taste
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Assessment Section */}
        <section className="py-16 bg-[#f8f9fa]">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-[2rem] text-center font-bold mb-8">
              Which Assessment Is Right for You?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1000px] mx-auto">
              {/* NOSE Card */}
              <div className="bg-white rounded-2xl p-8 shadow-md">
                <div className="flex justify-center items-center gap-8 bg-[#00a9ce]/5 rounded-2xl p-6 mb-6">
                  <div className="text-center">
                    <div className="text-[2.5rem] font-bold text-[#00a9ce]">5</div>
                    <div className="text-sm font-semibold text-[#6b7280]">Questions</div>
                  </div>
                  <div className="w-px h-[50px] bg-[#e5e7eb]" />
                  <div className="text-center">
                    <div className="text-[2.5rem] font-bold text-[#00a9ce]">2</div>
                    <div className="text-sm font-semibold text-[#6b7280]">Minutes</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4">NOSE Assessment</h3>
                <p className="text-[#6b7280] mb-4">
                  The Nasal Obstruction Symptom Evaluation (NOSE) scale measures the severity 
                  of nasal obstruction symptoms.
                </p>
                <ul>
                  <li className="flex items-start gap-2 text-[#6b7280] mb-2">
                    <Check className="w-4 h-4 text-[#00a9ce] mt-1 flex-shrink-0" />
                    Validates breathing difficulties
                  </li>
                  <li className="flex items-start gap-2 text-[#6b7280] mb-2">
                    <Check className="w-4 h-4 text-[#00a9ce] mt-1 flex-shrink-0" />
                    Clinically proven assessment
                  </li>
                  <li className="flex items-start gap-2 text-[#6b7280] mb-2">
                    <Check className="w-4 h-4 text-[#00a9ce] mt-1 flex-shrink-0" />
                    Used by ENT specialists worldwide
                  </li>
                </ul>
              </div>

              {/* SNOT Card */}
              <div className="bg-white rounded-2xl p-8 shadow-md">
                <div className="flex justify-center items-center gap-8 bg-[#00a9ce]/5 rounded-2xl p-6 mb-6">
                  <div className="text-center">
                    <div className="text-[2.5rem] font-bold text-[#00a9ce]">12</div>
                    <div className="text-sm font-semibold text-[#6b7280]">Questions</div>
                  </div>
                  <div className="w-px h-[50px] bg-[#e5e7eb]" />
                  <div className="text-center">
                    <div className="text-[2.5rem] font-bold text-[#00a9ce]">3</div>
                    <div className="text-sm font-semibold text-[#6b7280]">Minutes</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4">SNOT-12 Assessment</h3>
                <p className="text-[#6b7280] mb-4">
                  The Sino-Nasal Outcome Test evaluates the impact of sinus symptoms 
                  on your quality of life.
                </p>
                <ul>
                  <li className="flex items-start gap-2 text-[#6b7280] mb-2">
                    <Check className="w-4 h-4 text-[#00a9ce] mt-1 flex-shrink-0" />
                    Comprehensive symptom evaluation
                  </li>
                  <li className="flex items-start gap-2 text-[#6b7280] mb-2">
                    <Check className="w-4 h-4 text-[#00a9ce] mt-1 flex-shrink-0" />
                    Measures quality of life impact
                  </li>
                  <li className="flex items-start gap-2 text-[#6b7280] mb-2">
                    <Check className="w-4 h-4 text-[#00a9ce] mt-1 flex-shrink-0" />
                    Gold standard for sinus assessment
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Both Section */}
        <section className="py-16 bg-white">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8 max-w-[1000px] mx-auto items-center">
              <img
                src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&h=600&fit=crop"
                alt="Patient consultation"
                className="w-full rounded-2xl shadow-lg"
              />
              <div>
                <h2 className="text-[2rem] font-bold mb-4">
                  Not Sure Which One? No Problem!
                </h2>
                <p className="text-[#6b7280] mb-4">
                  Our smart assessment will guide you to the right test based on your symptoms. 
                  Simply start the assessment and answer a few questions about your primary concerns.
                </p>
                <p className="text-[#6b7280] mb-4">
                  Many patients experience overlapping symptoms of both nasal obstruction and sinus issues. 
                  That's completely normal, and our assessment is designed to help identify your specific situation.
                </p>
                <button
                  onClick={scrollToQuiz}
                  className="px-8 py-3.5 bg-[#00a9ce] text-white font-semibold rounded-lg shadow-lg hover:bg-[#0088a8] hover:-translate-y-0.5 transition-all"
                >
                  Start Your Assessment
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-16 bg-[#f8f9fa]">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-[2rem] text-center font-bold mb-8">
              Why Choose {clinicName}?
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[800px] mx-auto">
              <div className="bg-white rounded-2xl p-6 text-center shadow-md">
                <div className="text-3xl mb-3">🏆</div>
                <h4 className="font-semibold mb-2">Board Certified</h4>
                <p className="text-sm text-[#6b7280]">Expert ENT specialists</p>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center shadow-md">
                <div className="text-3xl mb-3">👥</div>
                <h4 className="font-semibold mb-2">5000+ Patients</h4>
                <p className="text-sm text-[#6b7280]">Successfully treated</p>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center shadow-md">
                <div className="text-3xl mb-3">🛡️</div>
                <h4 className="font-semibold mb-2">Insurance Accepted</h4>
                <p className="text-sm text-[#6b7280]">Most plans accepted</p>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center shadow-md">
                <div className="text-3xl mb-3">⭐</div>
                <h4 className="font-semibold mb-2">5-Star Rating</h4>
                <p className="text-sm text-[#6b7280]">Verified reviews</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 max-w-[1100px] mx-auto">
              <div>
                <h2 className="text-[2rem] font-bold mb-6">Frequently Asked Questions</h2>
                
                {[
                  {
                    q: "How long does the assessment take?",
                    a: "The NOSE assessment takes about 2 minutes with 5 questions. The SNOT-12 takes about 3 minutes with 12 questions. Both are designed to be quick and easy to complete."
                  },
                  {
                    q: "Is this assessment a diagnosis?",
                    a: "No, this assessment is a screening tool to help identify potential issues. A proper diagnosis requires an in-person evaluation with a qualified ENT specialist."
                  },
                  {
                    q: "What happens after I complete the assessment?",
                    a: "You'll receive your results immediately along with recommendations based on your score. Our team will also reach out to discuss treatment options if appropriate."
                  },
                  {
                    q: "Is my information kept private?",
                    a: "Yes, we take your privacy seriously. All information is encrypted and protected according to HIPAA guidelines. We never share your personal health information."
                  }
                ].map((faq, index) => (
                  <div key={index} className="mb-4">
                    <details 
                      className="bg-white border border-[#e5e7eb] rounded-lg"
                      open={openFaq === index}
                    >
                      <summary 
                        className="font-semibold cursor-pointer p-4 flex items-center justify-between"
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenFaq(openFaq === index ? null : index);
                        }}
                      >
                        {faq.q}
                        <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                      </summary>
                      {openFaq === index && (
                        <p className="text-[#6b7280] px-4 pb-4 leading-relaxed">
                          {faq.a}
                        </p>
                      )}
                    </details>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Clinical References</h3>
                <ul>
                  <li className="mb-3">
                    <a href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer" className="text-[#00a9ce] text-sm hover:underline">
                      NOSE Scale Validation Study
                    </a>
                  </li>
                  <li className="mb-3">
                    <a href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer" className="text-[#00a9ce] text-sm hover:underline">
                      SNOT-22 Development Paper
                    </a>
                  </li>
                  <li className="mb-3">
                    <a href="https://www.entnet.org/" target="_blank" rel="noopener noreferrer" className="text-[#00a9ce] text-sm hover:underline">
                      American Academy of Otolaryngology
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-[#1a1a2e] text-white">
          <div className="max-w-[1200px] mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-6 justify-between text-center md:text-left">
              <div>
                <h3 className="text-xl font-bold mb-2">{clinicName}</h3>
                <p className="opacity-70 text-sm">Your trusted partner in ENT care</p>
              </div>
              <div className="text-sm opacity-70">
                {doctorProfile?.location && <p className="flex items-center justify-center md:justify-start gap-2 mb-1"><MapPin className="w-4 h-4" /> {doctorProfile.location}</p>}
                {doctorProfile?.phone && <p className="flex items-center justify-center md:justify-start gap-2 mb-1"><Phone className="w-4 h-4" /> {doctorProfile.phone}</p>}
                {doctorProfile?.email && <p className="flex items-center justify-center md:justify-start gap-2"><Mail className="w-4 h-4" /> {doctorProfile.email}</p>}
              </div>
            </div>
          </div>
        </footer>

        {/* Mobile Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/98 backdrop-blur-md border-t border-[#e5e7eb] z-50 md:hidden">
          <button
            onClick={scrollToQuiz}
            className="w-full px-8 py-3.5 bg-[#00a9ce] text-white font-semibold rounded-lg shadow-lg"
          >
            Take the Assessment
          </button>
        </div>

        {/* Bottom padding for mobile sticky CTA */}
        <div className="h-24 md:hidden" />
      </div>
  );
}
