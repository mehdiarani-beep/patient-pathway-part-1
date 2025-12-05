
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Sparkles,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LandingPageSection {
  id: string;
  type: 'hero' | 'content' | 'testimonial' | 'treatment' | 'contact';
  title: string;
  content: string;
  image_url?: string;
  order: number;
}

interface LandingPageData {
  id: string;
  doctor_id: string;
  title: string;
  subtitle: string;
  sections: LandingPageSection[];
  chatbot_enabled: boolean;
  quiz_embedded: boolean;
  created_at: string;
  updated_at: string;
}

export function EditableNOSELandingPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const { user } = useAuth();
  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLandingPageData();
    fetchDoctorProfile();
    
    // Show chatbot after 30 seconds
    const timer = setTimeout(() => setShowChatbot(true), 30000);
    return () => clearTimeout(timer);
  }, [doctorId, user]);

  const fetchDoctorProfile = async () => {
    if (!user) return;
    
    try {
      // First, get the current user's profile to check if they're staff/manager
      const { data: userProfiles, error: fetchError } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching doctor profiles:', fetchError);
        throw fetchError;
      }

      if (!userProfiles || userProfiles.length === 0) {
        console.log('No doctor profile found');
        return;
      }

      const userProfile = userProfiles[0];
      
      // Check if user is staff or manager
      if (userProfile.is_staff) {
        // If team member, fetch the main doctor's profile using doctor_id_clinic
        if (userProfile.doctor_id_clinic) {
          const { data: mainDoctorProfile, error: mainDoctorError } = await supabase
            .from('doctor_profiles')
            .select('*')
            .eq('id', userProfile.doctor_id_clinic)
            .single();

          if (mainDoctorError) {
            console.error('Error fetching main doctor profile:', mainDoctorError);
            // Fallback to user's own profile
            setDoctorProfile(userProfile);
          } else {
            // Use main doctor's profile for landing page
            setDoctorProfile(mainDoctorProfile);
          }
        } else {
          // No clinic link, use user's own profile
          setDoctorProfile(userProfile);
        }
      } else {
        // Regular doctor, use their own profile
        setDoctorProfile(userProfile);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const fetchLandingPageData = async () => {
    try {
      const { data, error } = await supabase
        .from('nose_landing_pages')
        .select('*')
        .eq('doctor_id', doctorId || 'demo')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setLandingPageData(data);
      } else {
        // Create default landing page
        await createDefaultLandingPage();
      }
    } catch (error) {
      console.error('Error fetching landing page:', error);
      toast.error('Failed to load landing page data');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultLandingPage = async () => {
    const defaultData: Partial<LandingPageData> = {
      doctor_id: doctorId || 'demo',
      title: 'Struggling to Breathe Through Your Nose?',
      subtitle: 'Take Our Quick "Nose Test" to See If You Have Nasal Airway Obstruction',
      sections: [
        {
          id: '1',
          type: 'content',
          title: 'What Is Nasal Airway Obstruction?',
          content: 'Nasal Airway Obstruction (NAO) occurs when airflow through the nose is chronically limited—most commonly by structural causes—and can significantly degrade sleep, energy, exercise capacity, and quality of life.',
          order: 1
        },
        {
          id: '2',
          type: 'treatment',
          title: 'Treatment Options',
          content: 'We offer comprehensive treatment options from gentle medical management to advanced in-office procedures like VivAer and Latera.',
          order: 2
        },
        {
          id: '3',
          type: 'testimonial',
          title: 'Patient Success Stories',
          content: 'Our patients report significant improvement in breathing and quality of life after treatment.',
          order: 3
        }
      ],
      chatbot_enabled: true,
      quiz_embedded: true
    };

    try {
      const { data, error } = await supabase
        .from('nose_landing_pages')
        .insert([defaultData])
        .select()
        .single();

      if (error) throw error;
      setLandingPageData(data);
    } catch (error) {
      console.error('Error creating default landing page:', error);
    }
  };

  const generateAIContent = async () => {
    if (!doctorProfile) {
      toast.error('Please complete your profile first');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await supabase.functions.invoke('generate-landing-content', {
        body: {
          doctorProfile,
          specialty: 'ENT',
          focus: 'Nasal Airway Obstruction'
        }
      });

      if (response.error) throw response.error;

      const { generatedContent } = response.data;
      
      // Update landing page with AI-generated content
      const updatedData = {
        ...landingPageData,
        title: generatedContent.title,
        subtitle: generatedContent.subtitle,
        sections: generatedContent.sections
      };

      await saveLandingPage(updatedData);
      toast.success('AI content generated successfully!');
    } catch (error) {
      console.error('Error generating AI content:', error);
      toast.error('Failed to generate AI content');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const saveLandingPage = async (data: any) => {
    try {
      const { error } = await supabase
        .from('nose_landing_pages')
        .upsert([{ ...data, updated_at: new Date().toISOString() }]);

      if (error) throw error;
      
      setLandingPageData(data);
      toast.success('Landing page saved successfully!');
    } catch (error) {
      console.error('Error saving landing page:', error);
      toast.error('Failed to save landing page');
    }
  };

  const handleImageUpload = async (sectionId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `landing-pages/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update section with image URL
      const updatedSections = landingPageData?.sections.map(section =>
        section.id === sectionId ? { ...section, image_url: publicUrl } : section
      ) || [];

      const updatedData = { ...landingPageData, sections: updatedSections };
      await saveLandingPage(updatedData);
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const addNewSection = () => {
    const newSection: LandingPageSection = {
      id: Date.now().toString(),
      type: 'content',
      title: 'New Section',
      content: 'Enter your content here...',
      order: (landingPageData?.sections?.length || 0) + 1
    };

    const updatedData = {
      ...landingPageData,
      sections: [...(landingPageData?.sections || []), newSection]
    };
    
    setLandingPageData(updatedData as LandingPageData);
  };

  const updateSection = (sectionId: string, field: string, value: string) => {
    const updatedSections = landingPageData?.sections.map(section =>
      section.id === sectionId ? { ...section, [field]: value } : section
    ) || [];

    setLandingPageData(prev => prev ? { ...prev, sections: updatedSections } : null);
  };

  const deleteSection = (sectionId: string) => {
    const updatedSections = landingPageData?.sections.filter(section => section.id !== sectionId) || [];
    setLandingPageData(prev => prev ? { ...prev, sections: updatedSections } : null);
  };

  const quizIframeSrc = `${window.location.origin}/quiz/nose?source=landing_page&doctor=${doctorId}`;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Editor Controls */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">NOSE Landing Page Editor</h1>
            {doctorProfile && (
              <Badge variant="outline">
                Dr. {doctorProfile.first_name} {doctorProfile.last_name}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={generateAIContent}
              disabled={isGeneratingAI}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isGeneratingAI ? 'Generating...' : 'AI Generate'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center gap-2"
            >
              {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isPreview ? 'Edit Mode' : 'Preview'}
            </Button>
            
            <Button
              onClick={() => {
                if (isEditing) {
                  saveLandingPage(landingPageData);
                }
                setIsEditing(!isEditing);
              }}
              className="flex items-center gap-2"
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isEditing ? 'Save' : 'Edit'}
            </Button>
          </div>
        </div>
      </div>

      {/* Landing Page Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          {isEditing && !isPreview ? (
            <div className="space-y-4">
              <Input
                value={landingPageData?.title || ''}
                onChange={(e) => setLandingPageData(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="text-2xl font-bold text-center"
                placeholder="Main title"
              />
              <Input
                value={landingPageData?.subtitle || ''}
                onChange={(e) => setLandingPageData(prev => prev ? { ...prev, subtitle: e.target.value } : null)}
                className="text-lg text-center"
                placeholder="Subtitle"
              />
            </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
                {landingPageData?.title}
              </h1>
              <p className="text-xl text-blue-700 mb-8">
                {landingPageData?.subtitle}
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#0E7C9D] to-[#FD904B] text-white font-bold shadow-lg hover:scale-105 transition-all"
                onClick={() => {
                  document.getElementById('nose-quiz')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Take the Nose Test Now »
              </Button>
            </>
          )}
        </section>

        {/* Quiz Embed */}
        <section id="nose-quiz" className="mb-12">
          <Card className="shadow-lg">
            <CardHeader>
              <h2 className="text-2xl font-bold text-center">NOSE Assessment</h2>
            </CardHeader>
            <CardContent>
              <iframe
                src={quizIframeSrc}
                width="100%"
                height="600px"
                frameBorder="0"
                className="rounded-lg"
                title="NOSE Assessment Quiz"
              />
            </CardContent>
          </Card>
        </section>

        {/* Dynamic Sections */}
        {landingPageData?.sections?.map((section, index) => (
          <Card key={section.id} className="mb-8 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              {isEditing && !isPreview ? (
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                  className="text-xl font-bold"
                />
              ) : (
                <h2 className="text-2xl font-bold text-blue-900">{section.title}</h2>
              )}
              
              {isEditing && !isPreview && (
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(section.id, file);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSection(section.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {isEditing && !isPreview ? (
                    <Textarea
                      value={section.content}
                      onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                      className="min-h-[150px]"
                      placeholder="Section content..."
                    />
                  ) : (
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">{section.content}</p>
                    </div>
                  )}
                </div>
                
                {section.image_url && (
                  <div>
                    <img
                      src={section.image_url}
                      alt={section.title}
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Section Button */}
        {isEditing && !isPreview && (
          <div className="text-center">
            <Button
              onClick={addNewSection}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Section
            </Button>
          </div>
        )}
      </div>

      {/* Chatbot Widget */}
      {showChatbot && landingPageData?.chatbot_enabled && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative">
            <Button
              className="w-16 h-16 rounded-full bg-gradient-to-r from-[#0E7C9D] to-[#FD904B] text-white shadow-lg hover:scale-110 transition-all"
              onClick={() => {
                document.getElementById('nose-quiz')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
            <div className="absolute bottom-20 right-0 bg-white rounded-lg shadow-lg p-4 max-w-xs">
              <p className="text-sm text-gray-700">
                Hi! I'm here to help you assess your nasal breathing. Click to take our quick NOSE test!
              </p>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
    </div>
  );
}