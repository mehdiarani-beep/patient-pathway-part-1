import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronDown, Phone, Mail, MapPin, Award, Stethoscope, Heart, Clock, Info, BadgeCheck, Wind, Droplets, Brain, Activity, ExternalLink } from "lucide-react";
import { NOSESNOTPage } from "@/components/quiz/NOSESNOTPage";

// Import landing page images
import heroNasal from "@/assets/landing/hero-nasal.jpg";
import drVaughnBlack from "@/assets/landing/dr-vaughn-black.png";
import drVaughnProfessional from "@/assets/landing/dr-vaughn-professional.png";
import nasalExamDoctor from "@/assets/landing/nasal-exam-doctor.jpg";
import sinusPain from "@/assets/landing/sinus-pain.jpg";
import nasalAirway from "@/assets/landing/nasal-airway.jpg";
import heroRhinitis from "@/assets/landing/hero-rhinitis.jpg";
import exhaleLogo from "@/assets/landing/exhale-logo.png";

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
  }
];

const references = [
  { name: "Exhale Sinus", url: "https://exhalesinus.com" },
  { name: "Mayo Clinic — Deviated septum & septoplasty", url: "https://www.mayoclinic.org/tests-procedures/septoplasty" },
  { name: "Aerin Medical — VivAer information", url: "https://www.aerinmedical.com/vivaer/" },
  { name: "Stryker ENT — Balloon sinuplasty", url: "https://ent.stryker.com/" },
  { name: "American Academy of Otolaryngology", url: "https://www.enthealth.org" }
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
  
  // Chat version URL for CTA buttons (opens in new window)
  const chatQuizUrl = doctorId 
    ? `${window.location.origin}/embed/chatbot/NOSE_SNOT/${doctorId}`
    : `${window.location.origin}/embed/chatbot/NOSE_SNOT`;

  const openChatQuiz = () => {
    window.open(chatQuizUrl, '_blank');
  };

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
      {/* Hero Section - Refined spacing and gradient */}
      <section 
        className="relative min-h-[650px] lg:min-h-[720px] flex items-center py-10 lg:py-14"
        style={{
          backgroundImage: `url(${heroNasal})`,
          backgroundSize: "cover",
          backgroundPosition: "center top"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#145a63]/92 via-[#1a6a75]/88 to-[#0796cc]/82" />
        
        <div className="relative z-10 w-full px-4 sm:px-6 max-w-[1320px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
            {/* Left Content */}
            <div className="text-white">
              <span className="inline-block px-4 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-5 border border-white/20">
                Board-Certified ENT | Nasal & Sinus Specialist
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-[1.15] mb-5 tracking-tight">
                Is it a Nasal or Sinus Problem?
              </h1>
              <p className="text-base lg:text-lg text-white/90 mb-7 leading-relaxed max-w-xl">
                Many patients don't realize that breathing problems, pressure, and congestion can come from different root causes. This short quiz will help you understand whether your symptoms are due to nasal obstruction or sinus inflammation — and guide you toward the right treatment.
              </p>
              <button 
                onClick={openChatQuiz}
                className="hidden lg:inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[#0796cc] font-semibold rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-base"
              >
                Start the Nasal Assessment
              </button>
            </div>

            {/* Right - Quiz Embed (Standard format, responsive height) */}
            <div id="hero-quiz" className="bg-white rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] overflow-hidden border border-white/10">
              <div className="w-full">
                <NOSESNOTPage />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctor Note Section - Refined */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="order-2 lg:order-1">
              <img
                src={doctorProfile?.avatar_url || drVaughnBlack}
                alt={doctorName}
                className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold mb-5 leading-tight">A Note from {doctorName}</h2>
              <div className="text-gray-600 space-y-3.5 text-base leading-relaxed">
                <p>
                  If you're dealing with nasal congestion, facial pressure, trouble breathing, or poor sleep — you're not alone. These symptoms can stem from two common but very different issues: nasal airway obstruction (NAO) or chronic sinus inflammation.
                </p>
                <p>
                  To help you understand what's going on — and what to do next — I've created a quick self-assessment that asks just one question to point you in the right direction. From there, you'll take either the NOSE test (for nasal blockage) or the SNOT-12 test (for sinus-related symptoms).
                </p>
                <p>
                  Once you complete the quiz, I'll personally review your score and offer a free phone consultation to go over treatment options — from medications to minimally invasive in-office procedures.
                </p>
                <p className="font-medium text-[#1a1a2e]">Let's get you breathing better again.</p>
                <p className="font-semibold text-[#1a1a2e]">— {doctorName}</p>
              </div>
              <button 
                onClick={openChatQuiz}
                className="mt-7 px-7 py-3.5 bg-[#0796cc] text-white font-semibold rounded-lg shadow-lg hover:bg-[#0687b8] hover:shadow-xl transition-all"
              >
                Start your Nasal Assessment
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Triage Section - Refined */}
      <section className="py-14 lg:py-20 bg-[#f8f9fa]">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-center leading-tight">
              Which symptoms sound most like yours?
            </h2>
            <Info className="w-5 h-5 text-[#0796cc] flex-shrink-0" />
          </div>
          <p className="text-center text-gray-600 mb-10 text-base">
            Choose the option that best describes your main concerns:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option A - Nasal Blockage */}
            <div 
              onClick={openChatQuiz}
              className="cursor-pointer bg-white p-7 border-2 border-gray-200 rounded-xl hover:border-[#0796cc] hover:shadow-xl transition-all duration-200 group"
            >
              <h3 className="text-lg font-bold mb-5 group-hover:text-[#0796cc] transition-colors">
                Mostly Blockage & Stuffiness
              </h3>
              <ul className="space-y-2.5 mb-5">
                {["Constant nasal congestion or blockage", "Difficulty breathing through nose", "Snoring or sleep problems", "Mouth breathing"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-gray-600 text-[15px]">
                    <div className="w-5 h-5 rounded-full bg-[#0796cc] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <span className="text-[#0796cc] font-semibold group-hover:underline text-[15px]">
                → Take the NOSE Test
              </span>
            </div>

            {/* Option B - Sinus Issues */}
            <div 
              onClick={openChatQuiz}
              className="cursor-pointer bg-white p-7 border-2 border-gray-200 rounded-xl hover:border-[#0796cc] hover:shadow-xl transition-all duration-200 group"
            >
              <h3 className="text-lg font-bold mb-5 group-hover:text-[#0796cc] transition-colors">
                Pressure, Drainage & Smell Loss
              </h3>
              <ul className="space-y-2.5 mb-5">
                {["Facial pain or pressure", "Thick nasal discharge or post-nasal drip", "Loss of smell or taste", "Frequent sinus infections"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-gray-600 text-[15px]">
                    <div className="w-5 h-5 rounded-full bg-[#0796cc] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <span className="text-[#0796cc] font-semibold group-hover:underline text-[15px]">
                → Take the SNOT-12 Test
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Understanding Your Symptoms Section - Refined */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-center mb-3 leading-tight">
            Understanding Your Symptoms
          </h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto text-base">
            Nasal blockage and sinus problems can feel similar, but they have different causes and treatments.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Nasal Obstruction */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <h3 className="text-xl lg:text-2xl font-bold">Nasal Obstruction</h3>
                <Info className="w-4 h-4 text-[#0796cc]" />
              </div>
              <img 
                src={nasalAirway}
                alt="Nasal airway anatomy"
                className="w-full aspect-[4/3] object-cover rounded-xl mb-5"
              />
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-base mb-1.5">What it is:</h4>
                  <p className="text-gray-600 text-[15px] leading-relaxed">
                    Blocked airflow due to physical issues like deviated septum, enlarged turbinates, or nasal valve collapse. The structure of your nose prevents air from flowing freely.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1.5">Common Symptoms:</h4>
                  <ul className="text-gray-600 space-y-1.5">
                    {["Constant stuffiness (especially lying down)", "Snoring and sleep disturbances", "Mouth breathing", "Difficulty during exercise"].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[15px]">
                        <div className="w-4.5 h-4.5 rounded-full bg-[#0796cc] flex items-center justify-center flex-shrink-0 mt-0.5 w-[18px] h-[18px]">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <a href="#" className="text-[#0796cc] font-medium hover:underline text-sm inline-block">Learn more →</a>
              </div>
            </div>

            {/* Sinus Problems */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <h3 className="text-xl lg:text-2xl font-bold">Sinus Problems</h3>
                <Info className="w-4 h-4 text-[#0796cc]" />
              </div>
              <img 
                src={heroRhinitis}
                alt="Woman with sinus symptoms"
                className="w-full aspect-[4/3] object-cover rounded-xl mb-5"
              />
              <div className="space-y-5">
                <div>
                  <h4 className="font-bold text-base mb-1.5">What it is:</h4>
                  <p className="text-gray-600 text-[15px] leading-relaxed">
                    Inflammation or infection of the sinuses (air-filled cavities around your nose). This causes swelling, fluid buildup, and pressure in your face.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1.5">Common Symptoms:</h4>
                  <ul className="text-gray-600 space-y-1.5">
                    {["Facial pressure or pain", "Thick, colored nasal discharge", "Loss of smell or taste", "Post-nasal drip and cough", "Headaches"].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[15px]">
                        <div className="w-4.5 h-4.5 rounded-full bg-[#0796cc] flex items-center justify-center flex-shrink-0 mt-0.5 w-[18px] h-[18px]">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <a href="#" className="text-[#0796cc] font-medium hover:underline text-sm inline-block">Learn more →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Symptom Guide Section - Refined table */}
      <section className="py-14 lg:py-20 bg-[#f8f9fa]">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-2 mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-center leading-tight">
              How Do I Know Which Test to Take?
            </h2>
            <Info className="w-5 h-5 text-[#0796cc] flex-shrink-0" />
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="grid grid-cols-3">
              <div className="p-4 bg-gray-50 font-bold text-center border-b border-r border-gray-100"></div>
              <div className="p-4 bg-[#0796cc]/8 font-bold text-center border-b border-r border-gray-100 text-[#0796cc] text-sm">Nasal Obstruction</div>
              <div className="p-4 bg-[#0796cc]/8 font-bold text-center border-b border-gray-100 text-[#0796cc] text-sm">Sinus Problems</div>
            </div>
            
            {[
              { label: "Primary Symptoms", nasal: "Blocked nose, snoring, mouth breathing", sinus: "Face pain, thick discharge, smell loss" },
              { label: "Typical Causes", nasal: "Deviated septum, swollen turbinates, valve collapse", sinus: "Infection, inflammation, polyps" },
              { label: "Often Worse", nasal: "At night or during exercise", sinus: "When bending over or with weather changes" },
              { label: "Assessment", nasal: "NOSE Test (5 questions)", sinus: "SNOT-12 Test (12 questions)" },
            ].map((row, i, arr) => (
              <div key={i} className={`grid grid-cols-3 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="p-4 bg-gray-50 font-semibold text-sm border-r border-gray-100">{row.label}</div>
                <div className="p-4 text-sm text-gray-600 border-r border-gray-100">{row.nasal}</div>
                <div className="p-4 text-sm text-gray-600">{row.sinus}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={openChatQuiz}
              className="px-7 py-3.5 bg-[#0796cc] text-white font-semibold rounded-lg shadow-lg hover:bg-[#0687b8] hover:shadow-xl transition-all"
            >
              Take the Assessment Now
            </button>
          </div>
        </div>
      </section>

      {/* About Assessment Section - Refined cards */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-center mb-10 leading-tight">
            About Nasal Assessment: NOSE and SNOT-12
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* NOSE Assessment */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <h3 className="text-xl font-bold">NOSE Assessment</h3>
                <Info className="w-4 h-4 text-[#0796cc]" />
              </div>
              <div className="flex gap-10 mb-5">
                <div>
                  <div className="text-[42px] font-bold text-[#0796cc] leading-none">5</div>
                  <div className="text-xs text-gray-500 mt-1">Questions</div>
                </div>
                <div>
                  <div className="text-[42px] font-bold text-[#0796cc] leading-none">0-100</div>
                  <div className="text-xs text-gray-500 mt-1">Score Range</div>
                </div>
              </div>
              <div className="bg-[#e8f4f8] rounded-lg px-3 py-2 mb-4">
                <p className="text-sm text-[#0796cc] font-medium">Over 30 = treatment may help</p>
              </div>
              <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                The NOSE (Nasal Obstruction Symptom Evaluation) is a validated clinical tool that measures nasal blockage and breathing difficulty.
              </p>
              <ul className="text-gray-600 space-y-1.5 text-sm mb-4">
                <li>• Scores above 30-40 often indicate surgical intervention may provide relief</li>
                <li>• Evaluates structural issues like deviated septum and turbinate swelling</li>
                <li>• Quick assessment of how nasal blockage affects daily activities</li>
              </ul>
              <div className="bg-[#f0f7ff] rounded-lg px-3 py-2.5">
                <p className="text-sm"><span className="font-semibold">Best for:</span> Nasal congestion, difficulty breathing through nose, snoring</p>
              </div>
            </div>

            {/* SNOT-12 Assessment */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <h3 className="text-xl font-bold">SNOT-12 Assessment</h3>
                <Info className="w-4 h-4 text-[#0796cc]" />
              </div>
              <div className="flex gap-10 mb-5">
                <div>
                  <div className="text-[42px] font-bold text-[#0796cc] leading-none">12</div>
                  <div className="text-xs text-gray-500 mt-1">Questions</div>
                </div>
                <div>
                  <div className="text-[42px] font-bold text-[#0796cc] leading-none">0-60</div>
                  <div className="text-xs text-gray-500 mt-1">Score Range</div>
                </div>
              </div>
              <div className="bg-[#e8f4f8] rounded-lg px-3 py-2 mb-4">
                <p className="text-sm text-[#0796cc] font-medium">Over 30 = significant impact</p>
              </div>
              <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                The SNOT-12 (Sino-Nasal Outcome Test) measures how chronic rhinosinusitis affects your quality of life.
              </p>
              <ul className="text-gray-600 space-y-1.5 text-sm mb-4">
                <li>• Scores above 30 indicate severe impact requiring comprehensive treatment</li>
                <li>• Assesses sinus pressure, post-nasal drip, facial pain, and smell loss</li>
                <li>• Worldwide standard for evaluating chronic sinusitis severity</li>
              </ul>
              <div className="bg-[#f0f7ff] rounded-lg px-3 py-2.5">
                <p className="text-sm"><span className="font-semibold">Best for:</span> Sinus pain/pressure, post-nasal drip, recurring sinus infections</p>
              </div>
            </div>
          </div>

          {/* What if I have both? */}
          <div className="bg-white rounded-xl p-6 shadow-lg max-w-3xl mx-auto border border-gray-100">
            <h3 className="text-lg font-bold mb-3">What if I have both?</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Many patients experience symptoms from both nasal obstruction and sinus inflammation. In fact, they often occur together because blocked nasal passages can trap bacteria and mucus, leading to sinus infections.
            </p>
            <p className="text-gray-600 mt-3 text-sm leading-relaxed">
              If you're experiencing symptoms from both categories, start with the test that best matches your <em>most bothersome</em> symptoms. {doctorName} will review your results and help determine if you need additional evaluation.
            </p>
          </div>
        </div>
      </section>

      {/* Comprehensive Treatment Options - Refined */}
      <section className="py-14 lg:py-20 bg-[#f8f9fa]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-center mb-3 leading-tight">
            Comprehensive Treatment Options
          </h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto text-base">
            Modern treatments range from conservative therapies to minimally invasive procedures that can be performed in the office.
          </p>

          {/* For Nasal Obstruction */}
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
              <Wind className="w-5 h-5 text-[#0796cc]" />
              For Nasal Obstruction
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "VivAer®", subtitle: "Nasal Valve Treatment", desc: "Non-invasive, in-office procedure using temperature-controlled energy to reshape nasal passages." },
                { title: "Septoplasty", subtitle: "Deviated Septum Repair", desc: "Surgical correction of a crooked septum to improve airflow through both nostrils." },
                { title: "Turbinate Reduction", subtitle: "Swollen Turbinate Treatment", desc: "Reduces enlarged turbinates that block nasal breathing using various techniques." },
                { title: "Nasal Valve Repair", subtitle: "Structural Support", desc: "Strengthens weak nasal sidewalls that collapse during breathing." }
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                  <h4 className="font-bold text-base text-[#1a5f6a]">{item.title}</h4>
                  <p className="text-xs text-[#0796cc] mb-2.5 font-medium">{item.subtitle}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* For Sinus Infections */}
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-[#0796cc]" />
              For Sinus Infections
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Balloon Sinuplasty", subtitle: "Minimally Invasive", desc: "Uses a small balloon to open blocked sinus passages without cutting tissue." },
                { title: "SINUVA®", subtitle: "Sinus Implant", desc: "Dissolving implant that releases anti-inflammatory medication directly into sinuses." },
                { title: "Endoscopic Surgery", subtitle: "Advanced Treatment", desc: "Removes polyps and diseased tissue while preserving healthy sinus structure." },
                { title: "Dupixent®", subtitle: "Biologic Therapy", desc: "Injectable medication that targets underlying inflammation in chronic sinusitis with polyps." }
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                  <h4 className="font-bold text-base text-[#1a5f6a]">{item.title}</h4>
                  <p className="text-xs text-[#0796cc] mb-2.5 font-medium">{item.subtitle}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why Symptoms Overlap */}
          <div className="bg-white rounded-xl p-6 shadow-lg max-w-3xl mx-auto border border-gray-100">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#0796cc]" />
              Why Symptoms Overlap
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Nasal obstruction and sinus problems often occur together. A blocked nose can prevent proper sinus drainage, leading to infections. Similarly, chronic sinus inflammation can cause swelling that blocks nasal passages. That's why a comprehensive evaluation by an ENT specialist is important to identify all contributing factors and create an effective treatment plan.
            </p>
          </div>
        </div>
      </section>

      {/* Treatment Images Section */}
      <section className="py-12 bg-white">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <img 
              src={heroNasal}
              alt="Understanding sinus pressure and pain"
              className="w-full h-72 object-cover rounded-xl shadow-lg"
            />
            <img 
              src={sinusPain}
              alt="Finding relief from sinus symptoms"
              className="w-full h-72 object-cover rounded-xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* What Happens After Section - Refined */}
      <section className="py-14 lg:py-20 bg-[#f8f9fa]">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-center mb-10 leading-tight">
            What Happens After You Complete the Assessment?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { num: "1", title: "Get Your Score", desc: "You'll receive your score immediately along with a personalized interpretation of what it means." },
              { num: "2", title: `${doctorName} Reviews`, desc: `Your results are sent directly to ${doctorName}, who will personally review your symptoms.` },
              { num: "3", title: "Schedule a Consultation", desc: `Virtual or in-person appointment with ${doctorName}` }
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="w-14 h-14 bg-[#0796cc] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#1a5f6a] rounded-xl p-7 text-center text-white shadow-xl">
            <p className="text-lg mb-5">Ready to take control of your breathing and quality of life?</p>
            <button 
              onClick={openChatQuiz}
              className="px-7 py-3.5 bg-white text-[#0796cc] font-semibold rounded-lg shadow-lg hover:bg-gray-50 hover:shadow-xl transition-all"
            >
              Start your Nasal Assessment
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Section - Refined */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-center mb-10 leading-tight">
            Why Choose {doctorName} for Your Nasal & Sinus Health
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Award, title: "Board-Certified ENT", desc: "Fellowship-trained specialist with comprehensive diagnostic approach", link: "20+ Years Experience" },
                { icon: Stethoscope, title: "Advanced Technology", desc: "State-of-the-art diagnostics and minimally invasive procedures", link: "VivAer® & Balloon Sinuplasty Provider" },
                { icon: Heart, title: "Patient-Centered Care", desc: "Personalized treatment plans for your unique needs", link: "Most insurance plans accepted" }
              ].map((item, i) => (
                <div key={i} className="text-center p-5 bg-[#f8f9fa] rounded-xl">
                  <div className="w-11 h-11 bg-[#0796cc] rounded-full flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-sm mb-1.5">{item.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                  <a href="#" className="text-xs text-[#0796cc] mt-2 font-medium hover:underline block">{item.link}</a>
                </div>
              ))}
            </div>

            <div className="bg-[#1a5f6a] rounded-xl p-7 text-white shadow-xl">
              <img 
                src={doctorProfile?.avatar_url || drVaughnProfessional}
                alt={doctorName}
                className="w-44 h-44 object-cover rounded-full mx-auto mb-5 shadow-lg border-4 border-white/20"
              />
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <h3 className="text-xl font-bold text-center">
                  {doctorProfile?.first_name || "Ryan C."} {doctorProfile?.last_name || "Vaughn"}, MD
                </h3>
                <BadgeCheck className="w-5 h-5 text-[#0796cc]" />
              </div>
              <p className="text-center text-white/80 mb-4 text-sm">
                Board-Certified ENT • Nasal & Sinus Specialist • 20+ Years Experience
              </p>
              <p className="text-white/90 text-center text-sm leading-relaxed">
                {doctorName} has helped thousands of patients overcome nasal and sinus conditions through comprehensive, minimally-invasive ENT treatments. His expertise spans from conservative management to advanced surgical interventions.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {["Nasal Obstruction Expert", "Chronic Sinusitis Specialist", "Minimally Invasive Procedures"].map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-white/10 text-white rounded-full text-xs flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctor Exam Image */}
      <section className="py-8 bg-white">
        <div className="max-w-[760px] mx-auto px-4 sm:px-6">
          <img 
            src={nasalExamDoctor}
            alt="Doctor examining patient's nasal symptoms"
            className="w-full h-80 object-cover rounded-xl shadow-xl"
          />
        </div>
      </section>

      {/* FAQ & References Section - 2 Column Layout */}
      <section className="py-14 lg:py-20 bg-[#f8f9fa]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* FAQs */}
            <div>
              <h2 className="text-xl lg:text-2xl font-bold mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full px-5 py-3.5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-semibold text-sm pr-4">{faq.question}</span>
                      <ChevronDown 
                        className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${openFaq === index ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {openFaq === index && (
                      <div className="px-5 pb-4">
                        <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* References */}
            <div>
              <h2 className="text-xl lg:text-2xl font-bold mb-6">
                References
              </h2>
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                <ul className="space-y-3">
                  {references.map((ref, index) => (
                    <li key={index}>
                      <a 
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#0796cc] hover:underline text-sm group"
                      >
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{ref.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-14 lg:py-20 bg-[#1a5f6a]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-white mb-4 leading-tight">
            Ready to Breathe Better?
          </h2>
          <p className="text-white/90 mb-7 text-base max-w-xl mx-auto">
            Take the first step toward relief. Our simple assessment takes just 2-3 minutes and helps identify the root cause of your symptoms.
          </p>
          <button 
            onClick={openChatQuiz}
            className="px-8 py-4 bg-white text-[#0796cc] font-semibold rounded-lg shadow-xl hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-base"
          >
            Start Your Assessment Now
          </button>
        </div>
      </section>

      {/* Footer - 3 Column Layout */}
      <footer className="bg-[#0f3d44] text-white py-12">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Column 1 - Logo & Description */}
            <div>
              <img 
                src={doctorProfile?.logo_url || exhaleLogo}
                alt={clinicName}
                className="h-10 mb-4 brightness-0 invert"
              />
              <p className="text-white/70 text-sm leading-relaxed">
                Comprehensive ENT care for nasal, sinus, and respiratory conditions. 
                Serving patients with advanced diagnostic and treatment solutions.
              </p>
            </div>

            {/* Column 2 - Locations */}
            <div>
              <h4 className="font-bold mb-4 text-sm">Locations</h4>
              <div className="space-y-4 text-sm text-white/70">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Oklahoma City</p>
                    <p>{doctorProfile?.location || "13921 N May Ave, Oklahoma City, OK 73134"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Edmond</p>
                    <p>3560 S Boulevard St, Ste 150, Edmond, OK 73013</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3 - Quick Links */}
            <div>
              <h4 className="font-bold mb-4 text-sm">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href={doctorProfile?.website || "https://exhalesinus.com"} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3" />
                    Visit Our Website
                  </a>
                </li>
                <li>
                  <a href={`tel:${doctorProfile?.phone || "4057557855"}`} className="text-white/70 hover:text-white transition-colors flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    {doctorProfile?.phone || "(405) 755-7855"}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${doctorProfile?.email || "info@exhalesinus.com"}`} className="text-white/70 hover:text-white transition-colors flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    {doctorProfile?.email || "info@exhalesinus.com"}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-xs">
              © {new Date().getFullYear()} {clinicName}. All rights reserved.
            </p>
            <p className="text-white/50 text-xs">
              Powered by Patient Pathway
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile CTA Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] z-50">
        <button 
          onClick={openChatQuiz}
          className="w-full py-3.5 bg-[#0796cc] text-white font-semibold rounded-lg shadow-lg"
        >
          Start Your Assessment
        </button>
      </div>

      {/* Bottom padding for mobile CTA */}
      <div className="lg:hidden h-20" />
    </div>
  );
}
