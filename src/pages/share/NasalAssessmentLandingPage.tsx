import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronDown, Phone, Mail, MapPin, Award, Stethoscope, Heart, Clock } from "lucide-react";

// Import landing page images
import heroNasal from "@/assets/landing/hero-nasal.jpg";
import drVaughnBlack from "@/assets/landing/dr-vaughn-black.png";
import drVaughnProfessional from "@/assets/landing/dr-vaughn-professional.png";
import nasalExamDoctor from "@/assets/landing/nasal-exam-doctor.jpg";
import sinusPain from "@/assets/landing/sinus-pain.jpg";
import nasalAirway from "@/assets/landing/nasal-airway.jpg";
import heroRhinitis from "@/assets/landing/hero-rhinitis.jpg";

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

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Is this test a medical diagnosis?",
    answer: "No, this assessment is a screening tool to help identify potential nasal or sinus issues. It provides a score that can guide discussion with your healthcare provider, but it is not a substitute for professional medical evaluation and diagnosis."
  },
  {
    question: "What's the difference between acute and chronic sinusitis?",
    answer: "Acute sinusitis typically lasts less than 4 weeks and is often caused by a viral infection. Chronic sinusitis persists for 12 weeks or longer despite treatment attempts and may involve structural issues, allergies, or other underlying factors."
  },
  {
    question: "How do I know if my problem is nasal obstruction or sinus-related?",
    answer: "Nasal obstruction primarily causes difficulty breathing through the nose, congestion, and snoring. Sinus problems typically involve facial pressure, thick discharge, loss of smell, and headaches. Many patients experience both conditions simultaneously."
  },
  {
    question: "Do I always need antibiotics for sinus infections?",
    answer: "No, most sinus infections are viral and don't require antibiotics. Antibiotics are only effective for bacterial sinus infections. Your doctor will determine the appropriate treatment based on your symptoms and their duration."
  },
  {
    question: "Can allergies cause my nasal or sinus problems?",
    answer: "Yes, allergies are a common cause of both nasal congestion and sinus inflammation. Allergic reactions cause swelling in the nasal passages, which can lead to obstruction and impaired sinus drainage."
  },
  {
    question: "What treatments are available?",
    answer: "Treatment options range from conservative approaches (nasal sprays, saline rinses, medications) to minimally invasive procedures (balloon sinuplasty, turbinate reduction) and surgical interventions (septoplasty, endoscopic sinus surgery) depending on the diagnosis."
  },
  {
    question: "When is surgery necessary?",
    answer: "Surgery is typically considered when conservative treatments have failed to provide adequate relief. Common surgical candidates include those with significant structural abnormalities, chronic sinusitis unresponsive to medication, or severe nasal obstruction."
  },
  {
    question: "How long is recovery from nasal or sinus procedures?",
    answer: "Recovery varies by procedure. In-office procedures like balloon sinuplasty often allow return to normal activities within 1-2 days. More extensive surgeries like septoplasty may require 1-2 weeks of recovery time."
  },
  {
    question: "Will my insurance cover these treatments?",
    answer: "Many nasal and sinus treatments are covered by insurance when medically necessary. Coverage varies by plan and specific procedure. Our office can help verify your benefits and discuss payment options."
  },
  {
    question: "What if I have both nasal and sinus symptoms?",
    answer: "Many patients experience symptoms from both conditions. Start with the assessment that addresses your most bothersome symptoms. Your doctor will evaluate all factors during your consultation and recommend comprehensive treatment."
  }
];

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
    : "Dr. Vaughn";
  
  const doctorLastName = doctorProfile?.last_name || "Vaughn";
  const clinicName = doctorProfile?.clinic_name || "Exhale Sinus";
  const quizUrl = doctorId 
    ? `${window.location.origin}/embed/chatbot/NOSE_SNOT/${doctorId}`
    : `${window.location.origin}/embed/chatbot/NOSE_SNOT`;

  const scrollToQuiz = () => {
    const heroQuiz = document.getElementById('hero-quiz');
    if (heroQuiz) {
      heroQuiz.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    document.title = `Nasal Assessment - ${clinicName}`;
  }, [clinicName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0796cc]" />
      </div>
    );
  }

  return (
    <div className="font-sans text-[#1a1a2e] bg-white antialiased">
      {/* Hero Section */}
      <section 
        className="relative min-h-[600px] lg:min-h-[700px] flex items-center py-12 lg:py-16"
        style={{
          backgroundImage: `url(${heroNasal})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0796cc]/80 to-[#0796cc]/60" />
        
        <div className="relative z-10 w-full px-4 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-white">
              <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
                Board-Certified ENT | Nasal & Sinus Specialist
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
                Is it a Nasal or Sinus Problem?
              </h1>
              <p className="text-lg lg:text-xl text-white/95 mb-8 leading-relaxed max-w-xl">
                Many patients don't realize that breathing problems, pressure, and congestion can come from different root causes. This short quiz will help you understand whether your symptoms are due to nasal obstruction or sinus inflammation — and guide you toward the right treatment.
              </p>
              <button 
                onClick={scrollToQuiz}
                className="hidden lg:inline-block px-8 py-4 bg-white text-[#0796cc] font-semibold rounded-lg shadow-lg hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-lg"
              >
                Start the Nasal Assessment
              </button>
            </div>

            {/* Right - Quiz Embed */}
            <div id="hero-quiz" className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <iframe
                src={quizUrl}
                className="w-full h-[420px] lg:h-[480px] border-none"
                title="Nasal Assessment Quiz"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Doctor Note Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img
                src={doctorProfile?.avatar_url || drVaughnBlack}
                alt={doctorName}
                className="w-full max-w-md mx-auto rounded-2xl shadow-xl"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">A Note from {doctorName}</h2>
              <div className="text-gray-600 space-y-4 text-lg leading-relaxed">
                <p>
                  If you're dealing with nasal congestion, facial pressure, trouble breathing, or poor sleep — you're not alone. These symptoms can stem from two common but very different issues: nasal airway obstruction (NAO) or chronic sinus inflammation.
                </p>
                <p>
                  To help you understand what's going on — and what to do next — I've created a quick self-assessment that asks just one question to point you in the right direction. From there, you'll take either the NOSE test (for nasal blockage) or the SNOT-12 test (for sinus-related symptoms).
                </p>
                <p>
                  Once you complete the quiz, I'll personally review your score and offer a free phone consultation to go over treatment options — from medications to minimally invasive in-office procedures.
                </p>
                <p className="font-medium">Let's get you breathing better again.</p>
                <p className="font-semibold text-[#1a1a2e]">— {doctorName}</p>
              </div>
              <button 
                onClick={scrollToQuiz}
                className="mt-8 px-8 py-4 bg-[#0796cc] text-white font-semibold rounded-lg shadow-lg hover:bg-[#0687b8] transition-all"
              >
                Start your Nasal Assessment
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Triage Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-[1100px] mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
            Which symptoms sound most like yours?
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Choose the option that best describes your main concerns:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Option A - Nasal Blockage */}
            <div 
              onClick={scrollToQuiz}
              className="cursor-pointer bg-white p-8 border-2 border-gray-200 rounded-2xl hover:border-[#0796cc] hover:shadow-xl transition-all group"
            >
              <h3 className="text-xl font-bold mb-6 group-hover:text-[#0796cc] transition-colors">
                Mostly Blockage & Stuffiness
              </h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-[#0796cc] mt-0.5 flex-shrink-0" />
                  Constant nasal congestion or blockage
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-[#0796cc] mt-0.5 flex-shrink-0" />
                  Difficulty breathing through nose
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-[#0796cc] mt-0.5 flex-shrink-0" />
                  Snoring or sleep problems
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-[#0796cc] mt-0.5 flex-shrink-0" />
                  Mouth breathing
                </li>
              </ul>
              <span className="text-[#0796cc] font-semibold group-hover:underline">
                → Take the NOSE Test
              </span>
            </div>

            {/* Option B - Sinus Issues */}
            <div 
              onClick={scrollToQuiz}
              className="cursor-pointer bg-white p-8 border-2 border-gray-200 rounded-2xl hover:border-[#0796cc] hover:shadow-xl transition-all group"
            >
              <h3 className="text-xl font-bold mb-6 group-hover:text-[#0796cc] transition-colors">
                Pressure, Drainage & Smell Loss
              </h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-[#0796cc] mt-0.5 flex-shrink-0" />
                  Facial pain or pressure
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-[#0796cc] mt-0.5 flex-shrink-0" />
                  Thick nasal discharge or post-nasal drip
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-[#0796cc] mt-0.5 flex-shrink-0" />
                  Loss of smell or taste
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <Check className="w-5 h-5 text-[#0796cc] mt-0.5 flex-shrink-0" />
                  Frequent sinus infections
                </li>
              </ul>
              <span className="text-[#0796cc] font-semibold group-hover:underline">
                → Take the SNOT-12 Test
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Understanding Your Symptoms Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
            Understanding Your Symptoms
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto text-lg">
            Nasal blockage and sinus problems can feel similar, but they have different causes and treatments.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Nasal Obstruction */}
            <div>
              <h3 className="text-2xl font-bold mb-6">Nasal Obstruction</h3>
              <img 
                src={nasalAirway}
                alt="Nasal airway anatomy"
                className="w-full h-64 object-cover rounded-xl mb-6"
              />
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-lg mb-2">What it is:</h4>
                  <p className="text-gray-600">
                    Blocked airflow due to physical issues like deviated septum, enlarged turbinates, or nasal valve collapse. The structure of your nose prevents air from flowing freely.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">Common Symptoms:</h4>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Constant stuffiness (especially lying down)</li>
                    <li>• Snoring and sleep disturbances</li>
                    <li>• Mouth breathing</li>
                    <li>• Difficulty during exercise</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">Treatment Options:</h4>
                  <ul className="text-gray-600 space-y-2">
                    <li><strong>Septoplasty:</strong> Straighten deviated septum</li>
                    <li><strong>Turbinate Reduction:</strong> Shrink enlarged turbinates</li>
                    <li><strong>Nasal Valve Repair:</strong> Strengthen weak valves</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sinus Problems */}
            <div>
              <h3 className="text-2xl font-bold mb-6">Sinus Problems</h3>
              <img 
                src={heroRhinitis}
                alt="Woman with sinus symptoms"
                className="w-full h-64 object-cover rounded-xl mb-6"
              />
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-lg mb-2">What it is:</h4>
                  <p className="text-gray-600">
                    Inflammation or infection of the sinuses (air-filled cavities around your nose). This causes swelling, fluid buildup, and pressure in your face.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">Common Symptoms:</h4>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Facial pressure or pain</li>
                    <li>• Thick, colored nasal discharge</li>
                    <li>• Loss of smell or taste</li>
                    <li>• Post-nasal drip and cough</li>
                    <li>• Headaches</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">Treatment Options:</h4>
                  <ul className="text-gray-600 space-y-2">
                    <li><strong>Medical Therapy:</strong> Antibiotics, steroids, rinses</li>
                    <li><strong>Balloon Sinuplasty:</strong> Open blocked sinuses</li>
                    <li><strong>Endoscopic Surgery:</strong> Remove polyps & diseased tissue</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Assessment Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            About Nasal Assessment: NOSE and SNOT-12
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* NOSE Assessment */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6">NOSE Assessment</h3>
              <div className="flex gap-8 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#0796cc]">5</div>
                  <div className="text-sm text-gray-500">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#0796cc]">0-100</div>
                  <div className="text-sm text-gray-500">Your Score Range</div>
                </div>
              </div>
              <p className="text-sm text-[#0796cc] font-medium mb-4">Over 30 = treatment may help</p>
              <p className="text-gray-600 mb-4">
                The NOSE (Nasal Obstruction Symptom Evaluation) is a validated clinical tool that measures nasal blockage and breathing difficulty.
              </p>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Scores above 30-40 often indicate surgical intervention may provide relief</li>
                <li>• Evaluates structural issues like deviated septum and turbinate swelling</li>
                <li>• Quick assessment of how nasal blockage affects daily activities</li>
              </ul>
              <p className="mt-4 text-sm"><strong>Best for:</strong> Nasal congestion, difficulty breathing through nose, snoring</p>
            </div>

            {/* SNOT-12 Assessment */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6">SNOT-12 Assessment</h3>
              <div className="flex gap-8 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#0796cc]">12</div>
                  <div className="text-sm text-gray-500">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#0796cc]">0-60</div>
                  <div className="text-sm text-gray-500">Your Score Range</div>
                </div>
              </div>
              <p className="text-sm text-[#0796cc] font-medium mb-4">Over 30 = significant impact</p>
              <p className="text-gray-600 mb-4">
                The SNOT-12 (Sino-Nasal Outcome Test) measures how chronic rhinosinusitis affects your quality of life.
              </p>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Scores above 30 indicate severe impact requiring comprehensive treatment</li>
                <li>• Assesses sinus pressure, post-nasal drip, facial pain, and smell loss</li>
                <li>• Worldwide standard for evaluating chronic sinusitis severity</li>
              </ul>
              <p className="mt-4 text-sm"><strong>Best for:</strong> Sinus pain/pressure, post-nasal drip, recurring sinus infections</p>
            </div>
          </div>

          {/* What if I have both? */}
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-3xl mx-auto">
            <h3 className="text-xl font-bold mb-4">What if I have both?</h3>
            <p className="text-gray-600">
              Many patients experience symptoms from both nasal obstruction and sinus inflammation. In fact, they often occur together because blocked nasal passages can trap bacteria and mucus, leading to sinus infections.
            </p>
            <p className="text-gray-600 mt-4">
              If you're experiencing symptoms from both categories, start with the test that best matches your <em>most bothersome</em> symptoms. {doctorName} will review your results and help determine if you need additional evaluation.
            </p>
          </div>
        </div>
      </section>

      {/* Treatment Images Section */}
      <section className="py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <img 
              src={heroNasal}
              alt="Understanding sinus pressure and pain"
              className="w-full h-80 object-cover rounded-2xl shadow-lg"
            />
            <img 
              src={sinusPain}
              alt="Finding relief from sinus symptoms"
              className="w-full h-80 object-cover rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* What Happens After Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-[1000px] mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            What Happens After You Complete the Assessment?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#0796cc] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Get Your Score</h3>
              <p className="text-gray-600">
                You'll receive your score immediately along with a personalized interpretation of what it means.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#0796cc] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">{doctorName} Reviews</h3>
              <p className="text-gray-600">
                Your results are sent directly to {doctorName}, who will personally review your symptoms.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#0796cc] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Schedule a Consultation</h3>
              <p className="text-gray-600">
                Virtual or in-person appointment with {doctorName}
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl text-gray-700 mb-6">Ready to take control of your breathing and quality of life?</p>
            <button 
              onClick={scrollToQuiz}
              className="px-8 py-4 bg-[#0796cc] text-white font-semibold rounded-lg shadow-lg hover:bg-[#0687b8] transition-all text-lg"
            >
              Start your Nasal Assessment
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            Why Choose {doctorName} for Your Nasal & Sinus Health
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <Award className="w-12 h-12 text-[#0796cc] mx-auto mb-4" />
                <h3 className="font-bold mb-2">Board-Certified ENT</h3>
                <p className="text-sm text-gray-600">Fellowship-trained specialist with comprehensive diagnostic approach</p>
                <p className="text-xs text-[#0796cc] mt-2 font-medium">20+ Years Experience</p>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <Stethoscope className="w-12 h-12 text-[#0796cc] mx-auto mb-4" />
                <h3 className="font-bold mb-2">Advanced Technology</h3>
                <p className="text-sm text-gray-600">State-of-the-art diagnostics and minimally invasive procedures</p>
                <p className="text-xs text-[#0796cc] mt-2 font-medium">VivAer® & Balloon Sinuplasty Provider</p>
              </div>
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <Heart className="w-12 h-12 text-[#0796cc] mx-auto mb-4" />
                <h3 className="font-bold mb-2">Patient-Centered Care</h3>
                <p className="text-sm text-gray-600">Personalized treatment plans for your unique needs</p>
                <p className="text-xs text-[#0796cc] mt-2 font-medium">Most insurance plans accepted</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <img 
                src={doctorProfile?.avatar_url || drVaughnProfessional}
                alt={doctorName}
                className="w-48 h-48 object-cover rounded-full mx-auto mb-6 shadow-lg"
              />
              <h3 className="text-2xl font-bold text-center mb-2">
                {doctorProfile?.first_name || "Ryan C."} {doctorProfile?.last_name || "Vaughn"}, MD
              </h3>
              <p className="text-center text-gray-600 mb-4">
                Board-Certified ENT • Nasal & Sinus Specialist • 20+ Years Experience
              </p>
              <p className="text-gray-600 text-center">
                {doctorName} has helped thousands of patients overcome nasal and sinus conditions through comprehensive, minimally-invasive ENT treatments. His expertise spans from conservative management to advanced surgical interventions.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                <span className="px-3 py-1 bg-[#0796cc]/10 text-[#0796cc] rounded-full text-sm">Nasal Obstruction Expert</span>
                <span className="px-3 py-1 bg-[#0796cc]/10 text-[#0796cc] rounded-full text-sm">Chronic Sinusitis Specialist</span>
                <span className="px-3 py-1 bg-[#0796cc]/10 text-[#0796cc] rounded-full text-sm">Minimally Invasive Procedures</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctor Exam Image */}
      <section className="py-8 bg-white">
        <div className="max-w-[800px] mx-auto px-4">
          <img 
            src={nasalExamDoctor}
            alt="Doctor examining patient's nasal symptoms"
            className="w-full h-96 object-cover rounded-2xl shadow-xl"
          />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-[800px] mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* References Section */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-[800px] mx-auto px-4">
          <h2 className="text-xl font-bold mb-6">References</h2>
          <ol className="text-sm text-gray-500 space-y-2 list-decimal list-inside">
            <li><strong>{clinicName}</strong> — practice information: <a href={doctorProfile?.website || "#"} className="text-[#0796cc] hover:underline">{doctorProfile?.website || clinicName}</a></li>
            <li><strong>Mayo Clinic</strong> — Deviated septum & septoplasty: <a href="https://www.mayoclinic.org/tests-procedures/septoplasty" className="text-[#0796cc] hover:underline" target="_blank" rel="noopener noreferrer">mayoclinic.org</a></li>
            <li><strong>Aerin Medical</strong> — VivAer information: <a href="https://www.aerinmedical.com/vivaer/" className="text-[#0796cc] hover:underline" target="_blank" rel="noopener noreferrer">aerinmedical.com</a></li>
            <li><strong>Stryker ENT</strong> — Balloon sinuplasty and sinus procedures: <a href="https://ent.stryker.com/" className="text-[#0796cc] hover:underline" target="_blank" rel="noopener noreferrer">ent.stryker.com</a></li>
            <li><strong>American Academy of Otolaryngology</strong> — Patient education: <a href="https://www.enthealth.org" className="text-[#0796cc] hover:underline" target="_blank" rel="noopener noreferrer">enthealth.org</a></li>
          </ol>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 lg:py-24 bg-[#0796cc]">
        <div className="max-w-[800px] mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Breathe Better?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Don't let nasal or sinus problems hold you back any longer. Take the first step toward lasting relief today.
          </p>
          <button 
            onClick={scrollToQuiz}
            className="px-8 py-4 bg-white text-[#0796cc] font-semibold rounded-lg shadow-lg hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-lg"
          >
            Start your Nasal Assessment
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="font-semibold">{clinicName}</p>
              {doctorProfile?.location && (
                <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4" />
                  {doctorProfile.location}
                </p>
              )}
            </div>
            <div className="flex flex-col md:flex-row gap-4 text-sm">
              {doctorProfile?.phone && (
                <a href={`tel:${doctorProfile.phone}`} className="text-gray-400 hover:text-white flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {doctorProfile.phone}
                </a>
              )}
              {doctorProfile?.email && (
                <a href={`mailto:${doctorProfile.email}`} className="text-gray-400 hover:text-white flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {doctorProfile.email}
                </a>
              )}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} {clinicName}. All rights reserved.</p>
            <p className="mt-2">Powered by Patient Pathway</p>
          </div>
        </div>
      </footer>

      {/* Mobile CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-50">
        <button 
          onClick={scrollToQuiz}
          className="w-full py-4 bg-[#0796cc] text-white font-semibold rounded-lg shadow-lg"
        >
          Take the Assessment
        </button>
      </div>
    </div>
  );
}
