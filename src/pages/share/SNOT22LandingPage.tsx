import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { EmbeddedChatBot } from '@/components/quiz/EmbeddedChatBot';
import { quizzes } from '@/data/quizzes';
import { supabase } from '@/integrations/supabase/client';
import { generatePageContent, DoctorProfile } from '../../lib/openrouter';


const defaultDoctor: DoctorProfile = {
  id: 'demo',
  name: 'Dr. Jane Smith',
  credentials: 'MD, Board-Certified ENT',
  locations: [
    { city: 'Fort Worth', address: '6801 Oakmont Blvd., Fort Worth, TX 76132', phone: '(817) 332-8848' },
    { city: 'Southlake', address: '1545 E. Southlake Blvd., Ste. 140, Southlake, TX 76092', phone: '(817) 420-9393' },
  ],
  testimonials: [
    { text: 'The comprehensive SNOT-22 assessment revealed the full impact of my sinus condition. Treatment has been transformative.', author: 'Patient', location: 'Fort Worth' },
    { text: 'Dr. Smith used the detailed SNOT-22 evaluation to create a comprehensive treatment plan that addressed all my symptoms.', author: 'Patient', location: 'Southlake' },
  ],
  website: 'https://www.exhalesinus.com/',
};

const defaultChatbotColors = {
  primary: '#2563eb',
  background: '#ffffff',
  text: '#ffffff',
  userBubble: '#2563eb',
  botBubble: '#f1f5f9',
  userText: '#ffffff',
  botText: '#334155'
};

const SNOT22LandingPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [utmSource, setUtmSource] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [aiContent, setAIContent] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showChatWidget, setShowChatWidget] = useState(true);
  const [showChatMessage, setShowChatMessage] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatbotColors, setChatbotColors] = useState(defaultChatbotColors);
  const [contentError, setContentError] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const lastProcessedDoctorId = useRef<string | null>(null);
  const isInitialized = useRef(false);
  const isProcessingContent = useRef(false);
  const isSettingFromDatabase = useRef(false);

  // Memoized function to prevent unnecessary re-renders
  const fetchDoctorData = useCallback(async (actualDoctorId: string) => {
    try {
      console.log('Fetching doctor profile for ID:', actualDoctorId);
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', actualDoctorId)
        .single();

      if (error) {
        console.error('Error fetching doctor profile:', error);
        setDoctor(defaultDoctor);
        return;
      }

      if (data && data.first_name && data.last_name) {
        const doctorProfile = {
          id: data.id,
          name: `${data.first_name} ${data.last_name}`,
          credentials: data.specialty || 'MD',
          locations: [
            {
              city: data.location || 'Main Office',
              address: data.clinic_name || 'Please contact for address',
              phone: data.phone || 'Please contact for phone'
            }
          ],
          testimonials: defaultDoctor.testimonials,
          website: data.website || defaultDoctor.website,
          avatar_url: data.avatar_url
        };
        console.log('Successfully fetched doctor profile:', doctorProfile);
        setDoctor(doctorProfile);
      } else {
        console.warn('Doctor data incomplete, using default doctor');
        setDoctor(defaultDoctor);
      }
    } catch (error) {
      console.error('Error in fetchDoctorData:', error);
      setDoctor(defaultDoctor);
    }
  }, []);

  // Initialize doctor data - only run once
  useEffect(() => {
    if (isInitialized.current) return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const source = searchParams.get('utm_source');
    if (source) {
      setUtmSource(source);
    }
    
    console.log('SNOT22LandingPage - doctorId from URL:', doctorId);
    console.log('SNOT22LandingPage - URL search params:', Object.fromEntries(searchParams));
    
    const doctorIdFromRoute = doctorId;
    const doctorIdFromQuery = searchParams.get('doctor');
    const actualDoctorId = doctorIdFromQuery || doctorIdFromRoute;
    
    if (!actualDoctorId) {
      console.error('No doctorId found in URL parameters or route');
      setDoctor(defaultDoctor);
      isInitialized.current = true;
      return;
    }

    fetchDoctorData(actualDoctorId);
    isInitialized.current = true;
  }, [doctorId, fetchDoctorData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowChatMessage(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch chatbot colors - only when doctor changes
  useEffect(() => {
    if (!doctor?.id) return;
    
    const fetchChatbotColors = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_landing_pages')
          .select('chatbot_colors')
          .eq('doctor_id', doctor.id)
          .eq('quiz_type', 'SNOT22')
          .maybeSingle();
          
        if (data && data.chatbot_colors) {
          setChatbotColors(data.chatbot_colors);
        } else {
          setChatbotColors(defaultChatbotColors);
        }
      } catch (error) {
        console.warn('Could not fetch chatbot colors, using defaults:', error);
        setChatbotColors(defaultChatbotColors);
      }
    };
    
    fetchChatbotColors();
  }, [doctor?.id]); // Only depend on doctor.id, not the entire doctor object

  // Fetch AI content - prevent multiple calls and infinite loops
  useEffect(() => {
    if (!doctor?.id || isProcessingContent.current) return;
    
    // Prevent multiple calls for the same doctor ID
    if (doctor.id === lastProcessedDoctorId.current) {
      console.log('Skipping content generation - already processed this doctor ID:', doctor.id);
      return;
    }
    
    console.log('Starting content generation for doctor ID:', doctor.id);
    lastProcessedDoctorId.current = doctor.id;
    isProcessingContent.current = true;

    const fetchOrCreateAIContent = async () => {
      setLoadingAI(true);
      setContentError(null);

      try {
        // First, try to get existing content from database
        try {
          const { data: queryResult, error } = await supabase
            .from('ai_landing_pages')
            .select('*, doctor_profile')
            .eq('doctor_id', doctor.id)
            .eq('quiz_type', 'SNOT22');
            
          // Handle multiple rows by using the most recent one
          let data: any = null;
          if (queryResult && Array.isArray(queryResult) && queryResult.length > 1) {
            data = queryResult.sort((a, b) => 
              new Date(b.updated_at || b.created_at).getTime() - 
              new Date(a.updated_at || a.created_at).getTime()
            )[0];
            
            // Clean up duplicate rows (keep only the most recent one)
            const duplicateIds = queryResult
              .filter(row => row.id !== data.id)
              .map(row => row.id);
              
            if (duplicateIds.length > 0) {
              try {
                const { error: deleteError } = await supabase
                  .from('ai_landing_pages')
                  .delete()
                  .in('id', duplicateIds);
                  
                if (deleteError) {
                  console.warn('Could not clean up duplicate rows:', deleteError);
                } else {
                }
              } catch (cleanupError) {
                console.warn('Error during duplicate cleanup:', cleanupError);
              }
            }
          } else if (queryResult && Array.isArray(queryResult) && queryResult.length === 1) {
            data = queryResult[0];
          } else if (queryResult && !Array.isArray(queryResult)) {
            data = queryResult;
          } else {
            data = null;
          }

          if (data && data.content && !data.content.error) {
            // Parse content if it's a string
            let parsedContent = data.content;
            if (typeof data.content === 'string') {
              try {
                parsedContent = JSON.parse(data.content);
              } catch (parseError) {
                console.warn('Could not parse content from database:', parseError);
                parsedContent = data.content;
              }
            }
            
            // Check if this is SNOT22 content by looking for SNOT22-specific fields
            const isSNOT22Content = parsedContent.headline && 
              parsedContent.headline.toLowerCase().includes('snot') &&
              parsedContent.symptoms && Array.isArray(parsedContent.symptoms);
            
            if (isSNOT22Content) {
              // For shared links, be more lenient with validation - just check if basic content exists
              const hasBasicContent = parsedContent.headline && 
                parsedContent.intro && 
                parsedContent.symptoms && 
                Array.isArray(parsedContent.symptoms) && 
                parsedContent.symptoms.length > 0;
              
              if (hasBasicContent) {
                console.log('Using existing SNOT22 content from database for shared link');
                console.log('Content from database:', parsedContent);
                console.log('Doctor profile in content:', parsedContent.doctor_profile);
                
                setAIContent(parsedContent);
                setLoadingAI(false);
                
                // Then set doctor data from the stored profile if available (but don't trigger content generation again)
                if (parsedContent.doctor_profile && !doctor.name) {
                  console.log('Setting doctor from stored profile:', parsedContent.doctor_profile);
                  // Only set doctor if we don't already have a name (prevents infinite loop)
                  const storedDoctor = {
                    id: parsedContent.doctor_profile.id || doctor.id,
                    name: parsedContent.doctor_profile.name || 'Dr. Smith',
                    credentials: parsedContent.doctor_profile.credentials || 'MD',
                    locations: parsedContent.doctor_profile.locations || [{ city: 'Main Office', address: 'Please contact for address', phone: 'Please contact for phone' }],
                    testimonials: parsedContent.doctor_profile.testimonials || [],
                    website: parsedContent.doctor_profile.website || '#',
                    avatar_url: parsedContent.doctor_profile.avatar_url
                  };
                  setDoctor(storedDoctor);
                  // Reset the flag after a short delay
                  setTimeout(() => {
                    isSettingFromDatabase.current = false;
                  }, 100);
                } else {
                  console.log('No doctor profile found in content or doctor already has name');
                }
                
                return; // EXIT HERE - don't generate new content
              }
            }
          } else {
          }
        } catch (dbError) {
          console.warn('Could not fetch existing content from database:', dbError);
          // Continue to generate new content
        }

        // If we get here, no valid content was found in database
        // Try localStorage as a backup before generating new content
        const cachedContent = localStorage.getItem(`snot22_content_${doctor.id}`);
        if (cachedContent) {
          try {
            const parsed = JSON.parse(cachedContent);
            // Only use cached content if it's actually SNOT22 content (not NOSE content)
            if (parsed && !parsed.error && parsed.symptoms && 
                parsed.headline && parsed.headline.toLowerCase().includes('snot') &&
                !parsed.headline.toLowerCase().includes('nose') &&
                !parsed.whatIsNAO) { // NOSE content has whatIsNAO, SNOT22 doesn't
              console.log('Using cached SNOT22 content from localStorage');
              setAIContent(parsed);
              setLoadingAI(false);
              return; // EXIT HERE - don't generate new content
            } else {
              console.log('Cached content is not SNOT22 type, will generate new content');
              // Remove the old cached content
              localStorage.removeItem(`snot22_content_${doctor.id}`);
            }
          } catch (e) {
            console.warn('Failed to parse cached content:', e);
          }
        }

        // Generate new AI content
        console.log('Generating new SNOT22 content for doctor:', doctor.name);
        const generated = await generatePageContent(doctor, 'SNOT22');
        
        if (generated.error) {
          setContentError(generated.error);
          setAIContent(generated);
        } else {
          setAIContent(generated);
          console.log('Generated SNOT22 content:', generated.headline);
          
          // Cache the content in localStorage for future use
          try {
            localStorage.setItem(`snot22_content_${doctor.id}`, JSON.stringify(generated));
            console.log('SNOT22 content cached in localStorage');
          } catch (cacheError) {
            console.warn('Could not cache content in localStorage:', cacheError);
          }
          
                    // Try to save to database - check if record exists first
          try {
            // Check if a record already exists for SNOT22 quiz type
            const { data: existingRecord } = await supabase
              .from('ai_landing_pages')
              .select('id')
              .eq('doctor_id', doctor.id)
              .eq('quiz_type', 'SNOT22')
              .maybeSingle();

            if (existingRecord) {
              // Update existing record with complete data
              const { error: updateError } = await supabase
                .from('ai_landing_pages')
                .update({
                  content: {
                    ...generated,
                    doctor_profile: {
                      id: doctor.id,
                      name: doctor.name,
                      credentials: doctor.credentials,
                      locations: doctor.locations,
                      testimonials: doctor.testimonials,
                      website: doctor.website,
                      avatar_url: doctor.avatar_url
                    }
                  },
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingRecord.id);
              
              if (updateError) {
                console.warn('Could not update content in database:', updateError);
              } else {
              }
            } else {
              // Insert new record for SNOT22 quiz type with complete data
              const { error: insertError } = await supabase
                .from('ai_landing_pages')
                .insert({
                  doctor_id: doctor.id,
                  quiz_type: 'SNOT22',
                  content: {
                    ...generated,
                    doctor_profile: {
                      id: doctor.id,
                      name: doctor.name,
                      credentials: doctor.credentials,
                      locations: doctor.locations,
                      testimonials: doctor.testimonials,
                      website: doctor.website,
                      avatar_url: doctor.avatar_url
                    }
                  },
                  chatbot_colors: {}, // Default empty object
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              
              if (insertError) {
                console.warn('Could not insert content to database:', insertError);
              } else {
              }
            }
          } catch (saveError) {
            console.warn('Could not save content to database:', saveError);
            // This is not critical - the page will still work with cached content
          }
        }
      } catch (error) {
        console.error('Error in fetchOrCreateAIContent:', error);
        setContentError('Failed to generate content. Please try again.');
        setAIContent({ error: error.message });
      } finally {
        setLoadingAI(false);
        isProcessingContent.current = false;
      }
    };

    fetchOrCreateAIContent();
  }, [doctor?.id, retryAttempts]); // Only depend on doctor.id and retryAttempts

  const handleShowQuiz = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setShowChatModal(true);
  };

  const handleRetryContent = () => {
    setRetryAttempts(prev => prev + 1);
  };

  // Utility function to safely render arrays with fallbacks
  const safeArray = (arr: any, fallback: string[] = []) => {
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.filter(item => typeof item === 'string' && item.trim().length > 0);
    }
    return fallback;
  };

  // Utility function to safely render text with fallbacks
  const safeText = (text: any, fallback: string = '') => {
    return (typeof text === 'string' && text.trim()) ? text.trim() : fallback;
  };

  const doctorAvatarUrl = doctor?.avatar_url || '/src/assets/doctor.png';

  if (!doctor || loadingAI) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Generating Your Personalized Assessment</h3>
          <p className="text-gray-600">Creating comprehensive content tailored to your needs...</p>
          <div className="mt-4 text-sm text-gray-500">This may take a few moments</div>
        </div>
      </div>
    );
  }

  if (aiContent?.error || contentError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto p-8 bg-red-50 border border-red-200 text-red-800 rounded-2xl shadow-lg">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold mb-4">Content Generation Error</h2>
            <p className="mb-6">We encountered an issue generating personalized content for this page.</p>
            <div className="space-y-4">
              <button 
                onClick={handleRetryContent}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={handleShowQuiz}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Take the SNOT-22 Assessment
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium">Debug Info</summary>
                <pre className="mt-2 text-xs bg-red-100 p-4 rounded-lg border overflow-x-auto">
                  {JSON.stringify({ error: contentError || aiContent?.error, raw: aiContent?.raw }, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!aiContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
          </div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  const ChatWidget = () => {
    if (!showChatWidget) return null;
  
    return (
      <>
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative">
            {showChatMessage && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full animate-pulse"></div>
            )}
            
            {showChatMessage && (
              <div className="absolute bottom-24 right-2 bg-white rounded-2xl shadow-2xl p-6 mb-2 border border-gray-100 animate-slideIn" style={{ width: '340px', minWidth: '340px' }}>
                <div className="text-sm text-gray-700 mb-3 font-medium">
                  {safeText(aiContent.cta, 'Take our comprehensive SNOT-22 assessment to evaluate your sinus and nasal symptoms impact!')}
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <span>Click to start the quiz</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <div className="absolute bottom-0 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white transform translate-y-full"></div>
                
                <button
                  onClick={() => setShowChatMessage(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <button
              onClick={() => setShowChatModal(true)}
              className="relative text-white bg-blue-600 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center w-20 h-20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>
  
        {showChatModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
            style={{ 
              overflow: 'hidden',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowChatModal(false);
              }
            }}
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl relative overflow-hidden transform transition-all duration-300 ease-out animate-slideIn" style={{ height: '90vh' }}>
              <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-6 flex justify-between items-center sticky top-0 z-10" 
              style={{
                backgroundColor: (chatbotColors || defaultChatbotColors).primary,
                color: (chatbotColors || defaultChatbotColors).text
              }}>
                <div className="flex items-center space-x-4">
                  <img src={doctorAvatarUrl} alt="Doctor" className="w-12 h-12 rounded-full object-cover border-2 border-white/30" />
                  <div>
                    <h3 className="font-bold text-lg">SNOT-22 Assessment</h3>
                    <p className="text-sm">Comprehensive sinus evaluation with {doctor.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="overflow-y-auto overflow-x-hidden" style={{ height: 'calc(90vh - 96px)' }}>
                <EmbeddedChatBot
                  quizType="SNOT22"
                  doctorId={doctorId || doctor?.id}
                  quizData={quizzes.SNOT22}
                  doctorAvatarUrl={doctorAvatarUrl}
                  chatbotColors={chatbotColors}
                  utm_source={utmSource}
                />
              </div>
            </div>
          </div>
        )}
        
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          
          .animate-slideIn {
            animation: slideIn 0.3s ease-out;
          }
        `}</style>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="w-full bg-white border-b border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <div className="mb-12">
            <div className="w-20 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <img src={doctorAvatarUrl} alt="Practice Logo" className="w-20 rounded-xl object-cover" />
            </div>
            <h1 className="text-5xl font-bold text-slate-900 mb-8 leading-tight max-w-6xl mx-auto">
              {safeText(aiContent.headline, "Comprehensive Sinus & Nasal Symptom Evaluation - Get the Full Picture")}
            </h1>
            <p className="text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              {safeText(aiContent.intro, 'Take our comprehensive SNOT-22 assessment to get a complete evaluation of how your sinus and nasal symptoms are affecting your quality of life. This detailed 22-question assessment provides the most thorough understanding of your condition.')}
            </p>
            <button
              onClick={handleShowQuiz}
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-12 rounded-xl transition-all duration-300 hover:scale-105 shadow-xl text-xl group"
            >
              <span>Take the SNOT-22 Assessment</span>
              <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            

          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="w-full space-y-0">
        {/* What is SNOT-22 */}
        <section className="w-full bg-slate-100 py-24">
          <div className="max-w-7xl mx-auto px-8 text-center">
              <h2 className="text-5xl font-bold text-slate-900 mb-8">What Is the SNOT-22 Assessment?</h2>
              <p className="text-2xl text-slate-600 leading-relaxed max-w-5xl mx-auto">
                {safeText(aiContent.whatIsSNOT22, 'The SNOT-22 (Sino-Nasal Outcome Test) is the gold standard 22-question assessment that comprehensively evaluates how much your sinus and nasal symptoms are affecting your quality of life. This detailed evaluation covers physical symptoms, emotional impact, and functional limitations to provide the most complete picture of your condition.')}
              </p>
          </div>
        </section>

        {/* Symptoms & Impact */}
        <section className="w-full bg-white py-24">
          <div className="max-w-7xl mx-auto px-8 text-center">
              <h2 className="text-5xl font-bold text-slate-900 mb-12">Comprehensive Symptom Evaluation</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {safeArray(aiContent.symptoms, [
                  'Nasal symptoms: congestion, runny nose, post-nasal drip',
                  'Sleep quality: difficulty falling asleep, frequent waking',
                  'Emotional impact: frustration, embarrassment, depression',
                  'Functional limitations: reduced productivity, concentration issues',
                  'Social impact: avoiding social situations, relationship stress',
                  'Physical symptoms: facial pressure, ear problems, cough'
                ]).map((symptom: string, i: number) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="w-4 h-4 bg-blue-600 rounded-full mb-4 mx-auto"></div>
                    <span className="text-slate-700 text-lg leading-relaxed">{symptom}</span>
                  </div>
                ))}
              </div>
          </div>
        </section>

        {/* Treatment Options */}
        <section className="w-full bg-slate-100 py-24">
          <div className="max-w-7xl mx-auto px-8 text-center">
              <h2 className="text-5xl font-bold text-slate-900 mb-8">
                Advanced Treatment Options at {doctor.name.split(' ')[0]}'s Practice
              </h2>
              <p className="text-2xl text-slate-600 mb-16 max-w-5xl mx-auto leading-relaxed">
                {safeText(aiContent.treatments, 'Our practice offers the most advanced treatment options for chronic sinus and nasal conditions. Based on your comprehensive SNOT-22 results, we create personalized treatment plans that address the root cause of your symptoms.')}
              </p>
              
              <div className="mb-16">
                <h3 className="text-3xl font-semibold text-slate-800 mb-12">Comprehensive Treatment Approach</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {safeArray(aiContent.treatmentOptions, [
                    'Advanced Medical Management: Targeted therapies based on symptom severity',
                    'Minimally Invasive Procedures: Balloon sinuplasty and endoscopic techniques',
                    'Surgical Solutions: Comprehensive sinus surgery for severe cases',
                    'Lifestyle & Prevention: Long-term management strategies'
                  ]).map((option: string, i: number) => (
                    <div key={i} className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <span className="text-white font-bold text-lg">{i + 1}</span>
                      </div>
                      <p className="text-slate-700 text-lg leading-relaxed">{option}</p>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full bg-blue-600 py-24">
          <div className="max-w-7xl mx-auto px-8 text-center">
              <h2 className="text-5xl font-bold text-white mb-12">Get Your Complete Symptom Evaluation</h2>
              <p className="text-2xl text-blue-100 mb-16 max-w-4xl mx-auto leading-relaxed">
                {safeText(aiContent.cta, 'Don\'t let chronic sinus and nasal symptoms continue to impact your quality of life. Take our comprehensive SNOT-22 assessment to get the complete picture of your condition and discover personalized treatment options. The assessment takes just 5 minutes and provides the most thorough evaluation available.')}
              </p>
              <button
                onClick={handleShowQuiz}
                className="inline-flex items-center bg-white text-blue-600 font-bold py-6 px-12 rounded-xl transition-all duration-300 hover:scale-105 shadow-xl text-xl group hover:shadow-2xl"
              >
                <span>Take the SNOT-22 Assessment</span>
                <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
          </div>
        </section>

        {/* Why Choose */}
        <section className="w-full bg-white py-24">
          <div className="max-w-7xl mx-auto px-8 text-center">
              <h2 className="text-5xl font-bold text-slate-900 mb-16">Why Choose {doctor.name.split(' ')[0]}'s Practice</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {safeArray(aiContent.whyChoose, [
                  'Board-certified ENT specialists with extensive experience',
                  'Comprehensive diagnostic evaluation using validated assessments',
                  'Full spectrum of treatment options from medical to surgical',
                  'State-of-the-art facilities and advanced procedures',
                  'Personalized treatment plans based on your SNOT-22 results',
                  'Proven track record of successful outcomes'
                ]).map((reason: string, i: number) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-8 text-left border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-slate-700 text-lg leading-relaxed">{reason}</span>
                  </div>
                ))}
              </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="w-full bg-slate-100 py-24">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-5xl font-bold text-slate-900 mb-16">Patient Testimonials</h2>
            <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {(Array.isArray(aiContent.testimonials) && aiContent.testimonials.length > 0 
                ? aiContent.testimonials 
                : [
                    {
                      text: "The comprehensive SNOT-22 assessment revealed the full extent of my sinus condition. Dr. Smith's treatment plan based on these results has been life-changing.",
                      author: "Sarah M.",
                      location: "Fort Worth"
                    },
                    {
                      text: "After years of suffering, the detailed SNOT-22 evaluation led to a treatment that addressed all my symptoms. My quality of life has improved dramatically.",
                      author: "Michael R.", 
                      location: "Southlake"
                    }
                  ]
              ).map((testimonial: { text: string; author: string; location: string }, i: number) => (
                <div key={i} className="bg-white rounded-xl p-12 border border-slate-200 relative shadow-sm hover:shadow-md transition-shadow">
                  <div className="absolute top-8 left-8 text-8xl text-slate-300">"</div>
                  <p className="text-slate-700 mb-8 pt-12 text-xl leading-relaxed italic">
                    {safeText(testimonial.text, 'This comprehensive treatment has significantly improved my quality of life.')}
                  </p>
                  <div className="flex items-center justify-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-slate-900 text-lg">
                        {safeText(testimonial.author, 'Patient')}
                      </div>
                      <div className="text-slate-500">
                        {safeText(testimonial.location, doctor.locations[0]?.city || 'Local Patient')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="w-full bg-slate-900 py-24">
          <div className="max-w-7xl mx-auto px-8 text-center">
            <h2 className="text-5xl font-bold text-white mb-12">Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              {doctor.locations.map((location, i) => (
                <div key={i} className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                  <h3 className="text-2xl font-bold text-white mb-4">{location.city} Office</h3>
                  <div className="space-y-3 text-slate-300">
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{location.address}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{location.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <p className="text-xl text-slate-300 mb-6">
                {safeText(aiContent.contact, `Ready for a comprehensive evaluation of your sinus symptoms? Contact ${doctor.name} at one of our convenient locations to schedule your consultation.`)}
              </p>
              <a 
                href={doctor.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold text-lg transition-colors"
              >
                Visit Our Website
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </div>
      
      <ChatWidget />
    </div>
  );
};

export default SNOT22LandingPage;
