import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { nanoid } from 'nanoid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Copy, 
  QrCode, 
  Mail, 
  Share2, 
  Globe, 
  MessageSquare, 
  Maximize, 
  Eye,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Smartphone,
  Monitor,
  FileText,
  Printer,
  Facebook,
  Linkedin,
  Twitter,
  Link2,
  Loader2,
  Users,
  Edit,
  UserRound,
  MessageCircle,
  Send,
  Square,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { quizzes } from '@/data/quizzes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { QRCodeSVG } from 'qrcode.react';
import { EmbedPreview } from './EmbedPreview';
import { getDeviceType, getDeviceSize } from '@/utils/device';
import { generateAssessmentEmailTemplate } from '@/lib/emailTemplates';
import { EmailNotificationConfig } from './EmailNotificationConfig';

export function ShareQuizPage() {
  const { quizId, customQuizId } = useParams<{ quizId?: string; customQuizId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get the quiz from the quizzes data
  const quiz = quizId ? quizzes[quizId.toUpperCase()] : null;
  
  const [customQuiz, setCustomQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('full-page');
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [showChatQrCode, setShowChatQrCode] = useState(false);
  const [showStandardQrCode, setShowStandardQrCode] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [embedType, setEmbedType] = useState<'inline' | 'button' | 'chat'>('inline');
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [embedSize, setEmbedSize] = useState({ width: '100%', height: '700px' });
  const [webSource, setWebSource] = useState('website');
  const [error, setError] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState('');
  const [shortUrl, setShortUrl] = useState<string>('');
  const [isGeneratingShortUrl, setIsGeneratingShortUrl] = useState(false);
  const [shortUrls, setShortUrls] = useState<{[key: string]: string}>({});
  const [isGeneratingShortUrls, setIsGeneratingShortUrls] = useState<{[key: string]: boolean}>({});
  const [ctaText, setCtaText] = useState('For more info about non-invasive in office procedure to give you relief, Schedule a 5min screening phone call.');
  const [customMessage, setCustomMessage] = useState('');
  const baseUrl = window.location.origin;

  // Email sending states
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const doctorIdFromUrl = searchParams.get('doctor');
  const heightFromUrl = searchParams.get('height');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (doctorIdFromUrl) {
          const { data: profile, error: profileError } = await supabase
            .from('doctor_profiles')
            .select('*')
            .eq('id', doctorIdFromUrl)
            .single();

          if (profileError) {
            console.error('Error fetching doctor profile from URL:', profileError);
            setError('Could not fetch doctor profile');
          } else if (profile) {
            setDoctorProfile(profile);
          }
        } else if (user) {
          // First, get the current user's profile to check if they're staff/manager
          const { data: userProfiles, error: fetchError } = await supabase
            .from('doctor_profiles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

          if (fetchError) {
            console.error('Error fetching doctor profiles:', fetchError);
            setError('Could not fetch doctor profile');
            return;
          }

          if (!userProfiles || userProfiles.length === 0) {
            // No profile exists, create one (regular doctor)
            const { data: newProfile, error: createError } = await supabase
              .from('doctor_profiles')
              .insert([{
                user_id: user.id,
                first_name: 'Doctor',
                last_name: 'User',
                email: user.email,
                doctor_id: Math.floor(100000 + Math.random() * 900000).toString()
              }])
              .select();

            if (createError) {
              console.error('Error creating doctor profile:', createError);
              setError('Failed to create doctor profile');
            } else if (newProfile && newProfile.length > 0) {
              setDoctorProfile(newProfile[0]);
            }
            return;
          }

          const userProfile = userProfiles[0];
          
          // Check if user is staff or manager
          if (userProfile.is_staff || userProfile.is_manager) {
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
                // Use main doctor's profile for quiz sharing
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
        }

        if (customQuizId) {
          const { data, error } = await supabase
            .from('custom_quizzes')
            .select('*')
            .eq('id', customQuizId)
            .single();
          
          if (error) throw error;
          if (data) {
            setCustomQuiz(data);
            if (data.cta_text) {
              setCtaText(data.cta_text);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load page data');
      } finally {
        setLoading(false);
      }
    };
 
    fetchData();
  }, [customQuizId, user, doctorIdFromUrl]);
 
  const getQuizUrl = useCallback((source?: string) => {
    const baseQuizUrl = customQuizId
      ? `${baseUrl}/custom-quiz/${customQuizId}`
      : `${baseUrl}/share/${quizId?.toLowerCase()}`;
    
    const trackingParams = new URLSearchParams();
    
    // Add doctor ID if available
    if (doctorProfile?.id) {
      trackingParams.set('doctor', doctorProfile.id);
    }

    // Add source tracking
    const sourceParam = source || webSource;
    trackingParams.set('source', sourceParam);
    trackingParams.set('utm_source', sourceParam);
    trackingParams.set('utm_medium', getSourceMedium(sourceParam));
    trackingParams.set('utm_campaign', 'quiz_share');

    return `${baseQuizUrl}?${trackingParams.toString()}`;
  }, [customQuizId, quizId, doctorProfile, webSource, baseUrl]);

  const getChatFormatUrl = useCallback((source?: string) => {
    const baseQuizUrl = customQuizId
      ? `${baseUrl}/embed/custom/${customQuizId}`
      : `${baseUrl}/embed/${quizId?.toLowerCase()}`;
    
    const trackingParams = new URLSearchParams();
    
    // Add doctor ID if available
    if (doctorProfile?.id) {
      trackingParams.set('doctor', doctorProfile.id);
    }

    // Add source tracking
    const sourceParam = source || webSource;
    trackingParams.set('source', sourceParam);
    trackingParams.set('utm_source', sourceParam);
    trackingParams.set('utm_medium', getSourceMedium(sourceParam));
    trackingParams.set('utm_campaign', 'quiz_share');

    return `${baseQuizUrl}?${trackingParams.toString()}`;
  }, [customQuizId, quizId, doctorProfile, webSource, baseUrl]);

  const getStandardFormatUrl = useCallback((source?: string) => {
    // For NOSE_SNOT, use the special /share route instead of /quiz
    const baseQuizUrl = customQuizId
      ? `${baseUrl}/quiz/custom/${customQuizId}`
      : quizId?.toLowerCase() === 'nose_snot'
        ? `${baseUrl}/quiz/nose_snot`
        : `${baseUrl}/quiz/${quizId?.toLowerCase()}`;
    
    const trackingParams = new URLSearchParams();
    
    // Add doctor ID if available
    if (doctorProfile?.id) {
      trackingParams.set('doctor', doctorProfile.id);
    }

    // Add source tracking
    const sourceParam = source || webSource;
    trackingParams.set('source', sourceParam);
    trackingParams.set('utm_source', sourceParam);
    trackingParams.set('utm_medium', getSourceMedium(sourceParam));
    trackingParams.set('utm_campaign', 'quiz_share');

    return `${baseQuizUrl}?${trackingParams.toString()}`;
  }, [customQuizId, quizId, doctorProfile, webSource, baseUrl]);


  const getSourceMedium = (source: string) => {
    switch (source) {
      case 'facebook':
        return 'facebook';
      case 'linkedin':
        return 'linkedin';
      case 'twitter':
        return 'twitter';
      case 'tiktok':
        return 'tiktok';
      case 'qr':
        return 'qr';
      case 'email':
        return 'email';
      case 'text':
        return 'sms';
      case 'website':
        return 'web';
      default:
        return 'referral';
    }
  };

const generateShortUrlForFormat = async (longUrl: string, key: string) => {
  setIsGeneratingShortUrls(prev => ({ ...prev, [key]: true }));
  try {
    if (!doctorProfile?.id) {
      toast.error('Doctor profile required to generate short URL');
      return longUrl;
    }

    // Generate a unique 6-character short ID
    const shortId = nanoid(6);
    
    // Store in link_mappings table
    const { error } = await supabase
      .from('link_mappings')
      .insert({
        short_id: shortId,
        doctor_id: doctorProfile.id,
        quiz_type: customQuizId ? 'custom' : quizId?.toLowerCase(),
        custom_quiz_id: customQuizId || null,
        lead_source: webSource
      });

    if (error) {
      console.error('Error inserting link mapping:', error);
      throw error;
    }
    
    // Return self-hosted short URL
    const selfHostedShortUrl = `${baseUrl}/s/${shortId}`;
    setShortUrls(prev => ({ ...prev, [key]: selfHostedShortUrl }));
    toast.success('Short URL generated successfully!');
    
    return selfHostedShortUrl;
  } catch (error) {
    console.error('Error generating short URL:', error);
    toast.error('Failed to generate short URL');
    return longUrl;
  } finally {
    setIsGeneratingShortUrls(prev => ({ ...prev, [key]: false }));
  }
};

const generateShortUrl = async (source?: string) => {
  setIsGeneratingShortUrl(true);
  try {
    if (!doctorProfile?.id) {
      toast.error('Doctor profile required to generate short URL');
      return null;
    }

    // Generate a unique 6-character short ID
    const shortId = nanoid(6);
    
    // Store in link_mappings table
    const { error } = await supabase
      .from('link_mappings')
      .insert({
        short_id: shortId,
        doctor_id: doctorProfile.id,
        quiz_type: customQuizId ? 'custom' : quizId?.toLowerCase(),
        custom_quiz_id: customQuizId || null,
        lead_source: source || webSource
      });

    if (error) {
      console.error('Error inserting link mapping:', error);
      throw error;
    }
    
    // Return self-hosted short URL
    const selfHostedShortUrl = `${baseUrl}/s/${shortId}`;
    
    if (!source) {
      setShortUrl(selfHostedShortUrl);
      toast.success('Short URL generated successfully!');
    }
    
    return selfHostedShortUrl;
  } catch (error) {
    console.error('Error generating short URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    toast.error(`Failed to generate short URL: ${errorMessage}`);
    return null;
  } finally {
    setIsGeneratingShortUrl(false);
  }
};

const generateShortUrlWithRetry = async (source?: string, retries = 3) => {
  setIsGeneratingShortUrl(true);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (!doctorProfile?.id) {
        toast.error('Doctor profile required to generate short URL');
        setIsGeneratingShortUrl(false);
        return null;
      }

      // Generate a unique 6-character short ID
      const shortId = nanoid(6);
      
      // Store in link_mappings table
      const { error } = await supabase
        .from('link_mappings')
        .insert({
          short_id: shortId,
          doctor_id: doctorProfile.id,
          quiz_type: customQuizId ? 'custom' : quizId?.toLowerCase(),
          custom_quiz_id: customQuizId || null,
          lead_source: source || webSource
        });

      if (error) {
        console.error(`Attempt ${attempt} - Error inserting link mapping:`, error);
        if (attempt === retries) throw error;
        continue;
      }
      
      // Return self-hosted short URL
      const selfHostedShortUrl = `${baseUrl}/s/${shortId}`;
      
      if (!source) {
        setShortUrl(selfHostedShortUrl);
        toast.success('Short URL generated successfully!');
      }
      
      setIsGeneratingShortUrl(false);
      return selfHostedShortUrl;
      
    } catch (error) {
      console.error(`Attempt ${attempt} error:`, error);
      if (attempt === retries) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error(`Failed to generate short URL: ${errorMessage}`);
        setIsGeneratingShortUrl(false);
        return null;
      }
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  setIsGeneratingShortUrl(false);
  return null;
};

const handleSocialShare = async (platform: string) => {
  try {
    // Get the direct link with source tracking
    const directLink = getQuizUrl(platform);
    
    console.log(`Sharing on ${platform}:`, directLink);
    
    const message = encodeURIComponent(quizInfo.shareMessage);
    let socialUrl = '';

    switch (platform) {
      case 'facebook':
        try {
          // Use shortened URL for Facebook sharing (Facebook can't access localhost)
          const urlToShare = shortUrl || directLink;
          socialUrl = `https://www.facebook.com/sharer.php?u=${encodeURIComponent(urlToShare)}`;
          toast.info('Opening Facebook...');
        } catch (error) {
          console.error('Error generating Facebook URL:', error);
          socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(directLink)}`;
        }
        break;
      case 'twitter':
        const twitterUrl = shortUrl || directLink;
        socialUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(twitterUrl)}&text=${message}&hashtags=health,assessment`;
        break;
      case 'email':
        const emailUrl = shortUrl || directLink;
        socialUrl = `mailto:?subject=${encodeURIComponent(quizInfo.title)}&body=${message}%0A%0A${encodeURIComponent(emailUrl)}`;
        break;
      case 'text':
        const smsUrl = shortUrl || directLink;
        socialUrl = `sms:?&body=${message}%0A%0A${encodeURIComponent(smsUrl)}`;
        break;
      default:
        toast.error('Unsupported platform');
        return;
    }
    
    if (socialUrl) {
      window.open(socialUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
    }
  } catch (error) {
    console.error('Error in handleSocialShare:', error);
    toast.error('Failed to share. Please try again.');
  }
};


const DirectLinkSection = () => (
  <div className="space-y-4">
    <div className="flex flex-col sm:flex-row gap-2">
      <Input
        value={shareUrl}
        readOnly
        className="flex-1 font-mono text-sm"
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => window.open(doctorLandingUrl, '_blank')}
          className="border-[#0E7C9D] text-[#0E7C9D] font-bold hover:bg-blue-50 flex-1 sm:flex-none"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Landing Page</span>
        </Button>
      </div>
    </div>
  </div>
);

const getTrackedLink = (source: string, campaign?: string) => {
  const baseQuizUrl = customQuizId
    ? `${baseUrl}/custom-quiz/${customQuizId}`
    : `${baseUrl}/share/${quizId?.toLowerCase()}`;
  
  const trackingParams = new URLSearchParams();
  
  if (doctorProfile?.id) {
    trackingParams.set('doctor', doctorProfile.id);
  }

  trackingParams.set('source', source);
  trackingParams.set('utm_source', source);
  trackingParams.set('utm_medium', getSourceMedium(source));
  trackingParams.set('utm_campaign', campaign || 'quiz_share');

  return `${baseQuizUrl}?${trackingParams.toString()}`;
};
const createSpecialLinks = () => {
  return {
    email: getTrackedLink('email', 'email_campaign'),
    social: getTrackedLink('social_media', 'social_campaign'),
    website: getTrackedLink('website', 'website_embed'),
    direct: getTrackedLink('direct_share', 'direct_campaign'),
    print: getTrackedLink('print_material', 'print_campaign')
  };
};

const sendEmail = async () => {
  if (!doctorProfile?.email_alias_created || !doctorProfile?.email_alias || !recipientEmail.trim() || !recipientName.trim()) {
    toast.error('Please fill in all required fields');
    return;
  }

  if (!recipientEmail.includes('@')) {
    toast.error('Please enter a valid email address');
    return;
  }

  setSendingEmail(true);
  try {
    // Generate professional email template using the doctor's details
    const emailTemplate = generateAssessmentEmailTemplate(
      quizId?.toLowerCase() as 'nose' | 'snot12' | 'snot22' | 'tnss' || 'nose',
      {
        doctorProfile: {
          id: doctorProfile.id,
          first_name: doctorProfile.first_name,
          last_name: doctorProfile.last_name,
          email: doctorProfile.email,
          phone: doctorProfile.phone,
          clinic_name: doctorProfile.clinic_name,
          website: doctorProfile.website,
          avatar_url: doctorProfile.avatar_url
        },
        baseUrl,
        recipientName: recipientName.trim()
      }
    );

    // Use custom subject if provided, otherwise use template subject
    const finalSubject = emailSubject.trim() || emailTemplate.subject;

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: recipientEmail.trim(),
        subject: finalSubject,
        html: emailTemplate.html,
        text: emailTemplate.text,
        doctorId: doctorProfile.id
      }
    });

    if (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
      return;
    }

    if (data?.success) {
      toast.success(`Assessment invitation sent to ${recipientName} (${recipientEmail})`);
      setRecipientEmail('');
      setRecipientName('');
      setEmailSubject('');
    } else {
      toast.error(data?.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    toast.error('Failed to send email');
  } finally {
    setSendingEmail(false);
  }
};

  const generateQrCode = () => {
    setShowQrCode(true);
  };

  const downloadQrAsPng = (elementId: string, filename: string) => {
    const svgElement = document.getElementById(elementId);
    if (!svgElement) {
      toast.error('QR code not found');
      return;
    }
    
    const svg = svgElement.querySelector('svg');
    if (!svg) {
      toast.error('QR code SVG not found');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.scale(2, 2);
      ctx?.drawImage(img, 0, 0);
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${filename}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success('QR code downloaded!');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const embedUrl = useMemo(() => {
    const url = new URL(`${baseUrl}/embed/${customQuizId || quizId}`);
    if (doctorProfile?.id) {
      url.searchParams.set('doctor', doctorProfile.id);
    }
    return url.toString();
  }, [baseUrl, customQuizId, quizId, doctorProfile?.id]);

  const shareUrl = useMemo(() => getQuizUrl(), [getQuizUrl]);
  const chatFormatUrl = useMemo(() => getChatFormatUrl(), [getChatFormatUrl]);
  const standardFormatUrl = useMemo(() => getStandardFormatUrl(), [getStandardFormatUrl]);


  const mailHtmlNOSE = useMemo(() => {
    const noseUrl = `${baseUrl}/share/nose?doctor=${doctorProfile?.id || 'demo'}&utm_source=email`;
    const websiteLink = doctorProfile?.website
      ? `<a target="_blank" href="${doctorProfile.website}" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px"><img src="${doctorProfile?.avatar_url || 'Your Website Image'}" alt="" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="200" height="47"></a>`
      : `<img src="https://cdn.prod.website-files.com/6213b8b7ae0610f9484d627a/63d85029011f18f6bfabf2f3_Exhale_Sinus_Horizontal_logo-p-800.png" alt="" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="200" height="47">`;

    const amIACandidateButton = `<span class="x" style="border-style:solid;border-color:#2CB543;background:#6fa8dc;border-width:0px 0px 2px 0px;display:inline-block;border-radius:5px;width:auto"><a href="${noseUrl}" class="b b-1619632113981" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;display:inline-block;background:#6fa8dc;border-radius:5px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:16.8px;width:auto;text-align:center;padding:10px 20px;mso-padding-alt:0;mso-border-alt:10px solid #6fa8dc">Am I a Candidate?</a></span>`;

    const takeTheNoseTestButton = `<span class="x" style="border-style:solid;border-color:#2CB543;background:#6fa8dc;border-width:0px 0px 2px 0px;display:inline-block;border-radius:5px;width:auto"><a href="${noseUrl}" class="b" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;display:inline-block;background:#6fa8dc;border-radius:5px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:16.8px;width:auto;text-align:center;padding:10px 20px 10px 20px;mso-padding-alt:0;mso-border-alt:10px solid #6fa8dc">Take the NOSE Test</a></span>`;

    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0"><head><meta charset="UTF-8"><meta content="width=device-width, initial-scale=1" name="viewport"><meta name="x-apple-disable-message-reformatting"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta content="telephone=no" name="format-detection"><title>E</title> <!--[if (mso 16)]><style type="text/css"> a {text-decoration: none;}  </style><![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]><noscript> <xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> </noscript>
<![endif]--><!--[if mso]><xml> <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"> <w:DontUseAdvancedTypographyReadingMail></w:DontUseAdvancedTypographyReadingMail> </w:WordDocument> </xml>
<![endif]--><style type="text/css">#outlook a { padding:0;}.ExternalClass { width:100%;}.ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div { line-height:100%;}.b { mso-style-priority:100!important; text-decoration:none!important;}a[x-apple-data-detectors] { color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important;}.a { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all;}@media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:26px!important; text-align:center } h3 { font-size:20px!important; text-align:center }
 .bd p, .bd ul li, .bd ol li, .bd a { font-size:16px!important } *[class="gmail-fix"] { display:none!important } .x { display:block!important } .p table, .q table, .r table, .p, .r, .q { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important } a.b, button.b { font-size:20px!important; display:block!important; padding:10px 0px 10px 0px!important } }@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }</style>
 </head> <body data-new-gr-c-s-loaded="14.1244.0" style="font-family:arial, 'helvetica neue', helvetica, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"><div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F6F6F6"><!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f6f6f6"></v:fill> </v:background><![endif]--><table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F6F6F6"><tr style="border-collapse:collapse">
<td valign="top" style="padding:0;Margin:0"><table class="p" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0"><table class="bd" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"><tr style="border-collapse:collapse"><td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0;font-size:0px">${websiteLink}</td></tr><tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-top:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">Hello {{contact.first_name}},<br><br>This is ${doctorProfile?.first_name || 'your ENT'}. Do you experience difficulty breathing through your nose and nothing seems to help? You may have nasal obstruction, a common condition that affects millions of Americans.<br><br>I am now offering non-invasive treatment options that can help you breathe better with lasting results. The non-invasive treatments may be performed right in our office, and patients may return to normal activities on the same day.<br><br>Are you a candidate? Click below to take a quick test and find out.</p></td></tr> <tr style="border-collapse:collapse">
<td align="center" style="padding:10px;Margin:0">${amIACandidateButton}</td></tr> <tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-top:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">If you experience difficulty breathing through your nose and nothing seems to help, we recommend taking the NOSE Test to measure your nasal blockage severity.<br><br>The <b>Nasal Obstruction Symptom Evaluation (NOSE)</b>&nbsp;Test is a short, 5-question survey. <span style="color:#333333">Each question is scored from 0 (not a problem) to 5 (severe problem). Your total score helps your provider understand how serious your symptoms are and what treatment options might be appropriate.</span></p>
 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">It takes less than a minute to complete and is a simple first step toward breathing easier.</p></td></tr> <tr style="border-collapse:collapse">
<td align="center" style="padding:10px;Margin:0">${takeTheNoseTestButton}</td></tr> <tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-top:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">You may be eligible to use your Medicare or insurance benefits towards your treatment. If you have any questions or would like help checking your insurance coverage, please call us at <a target="_blank" href="tel:(630)513-1691" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px"></a><a href="tel:${doctorProfile?.phone || '224-412-5949'}" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px">224-412-5949</a>.</p>
 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">Sincerely,</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">${doctorProfile?.first_name || 'Ryan'} ${doctorProfile?.last_name || 'Vaughn'}, MD<br>${doctorProfile?.clinic_name || 'Your Clinic Name'}&nbsp;</p></td></tr></table></td></tr></table></td></tr></table></td></tr></table>
 <table class="r" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0"><table class="bc" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"><tr style="border-collapse:collapse"><td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0;display:none"></td> </tr></table></td></tr></table></td></tr></table></td></tr></table> <table class="p" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0"><table class="bd" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" cellspacing="0" cellpadding="0" align="center" role="none"><tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;padding-bottom:30px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0;display:none"></td> </tr></table></td></tr></table></td></tr></table></td></tr></table></td></tr></table></div></body></html>`;
  }, [doctorProfile, baseUrl]);

  const mailHtmlSNOT12 = useMemo(() => {
    const snot12Url = `${baseUrl}/share/snot12?doctor=${doctorProfile?.id || 'demo'}&utm_source=email`;
    const websiteLink = doctorProfile?.website
      ? `<a target="_blank" href="${doctorProfile.website}" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px"><img src="${doctorProfile?.avatar_url || 'Your Website Image'}" alt="" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="200" height="47"></a>`
      : `<img src="https://cdn.prod.website-files.com/6213b8b7ae0610f9484d627a/63d85029011f18f6bfabf2f3_Exhale_Sinus_Horizontal_logo-p-800.png" alt="" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="200" height="47">`;

    const amIACandidateButton = `<span class="x" style="border-style:solid;border-color:#2CB543;background:#6fa8dc;border-width:0px 0px 2px 0px;display:inline-block;border-radius:5px;width:auto"><a href="${snot12Url}" class="b b-1619632113981" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;display:inline-block;background:#6fa8dc;border-radius:5px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:16.8px;width:auto;text-align:center;padding:10px 20px;mso-padding-alt:0;mso-border-alt:10px solid #6fa8dc">Am I a Candidate?</a></span>`;

    const takeTheSNOT12TestButton = `<span class="x" style="border-style:solid;border-color:#2CB543;background:#6fa8dc;border-width:0px 0px 2px 0px;display:inline-block;border-radius:5px;width:auto"><a href="${snot12Url}" class="b" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;display:inline-block;background:#6fa8dc;border-radius:5px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:16.8px;width:auto;text-align:center;padding:10px 20px 10px 20px;mso-padding-alt:0;mso-border-alt:10px solid #6fa8dc">Take the SNOT12 Test</a></span>`;
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0"><head><meta charset="UTF-8"><meta content="width=device-width, initial-scale=1" name="viewport"><meta name="x-apple-disable-message-reformatting"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta content="telephone=no" name="format-detection"><title>E</title> <!--[if (mso 16)]><style type="text/css"> a {text-decoration: none;}  </style><![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]><noscript> <xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> </noscript>
<![endif]--><!--[if mso]><xml> <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"> <w:DontUseAdvancedTypographyReadingMail></w:DontUseAdvancedTypographyReadingMail> </w:WordDocument> </xml>
<![endif]--><style type="text/css">#outlook a { padding:0;}.ExternalClass { width:100%;}.ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div { line-height:100%;}.b { mso-style-priority:100!important; text-decoration:none!important;}a[x-apple-data-detectors] { color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important;}.a { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all;}@media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:26px!important; text-align:center } h3 { font-size:20px!important; text-align:center }
 .bd p, .bd ul li, .bd ol li, .bd a { font-size:16px!important } *[class="gmail-fix"] { display:none!important } .x { display:block!important } .p table, .q table, .r table, .p, .r, .q { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important } a.b, button.b { font-size:20px!important; display:block!important; padding:10px 0px 10px 0px!important } }@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }</style>
 </head> <body data-new-gr-c-s-loaded="14.1244.0" style="font-family:arial, 'helvetica neue', helvetica, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"><div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F6F6F6"><!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f6f6f6"></v:fill> </v:background><![endif]--><table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F6F6F6"><tr style="border-collapse:collapse">
<td valign="top" style="padding:0;Margin:0"><table class="p" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0"><table class="bd" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"><tr style="border-collapse:collapse"><td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0;font-size:0px">${websiteLink}</td></tr><tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-top:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">Hello {{contact.first_name}},<br><br>This is ${doctorProfile?.first_name || 'your ENT'}. Do you experience difficulty breathing through your nose and nothing seems to help? You may have nasal obstruction, a common condition that affects millions of Americans.<br><br>I am now offering non-invasive treatment options that can help you breathe better with lasting results. The non-invasive treatments may be performed right in our office, and patients may return to normal activities on the same day.<br><br>Are you a candidate? Click below to take a quick test and find out.</p></td></tr> <tr style="border-collapse:collapse">
<td align="center" style="padding:10px;Margin:0">${amIACandidateButton}</td></tr> <tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-top:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">If you experience difficulty breathing through your nose and nothing seems to help, we recommend taking the SNOT12 Test to evaluate your nasal and sinus symptoms and their impact on your quality of life.<br><br>The <b>Sino-Nasal Outcome Test (SNOT)</b>&nbsp;Test is a short, 12-question survey. <span style="color:#333333">Each question is scored from 0 (not a problem) to 5 (severe problem). Your total score helps your provider understand how serious your symptoms are and what treatment options might be appropriate.</span></p>
 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">It takes less than a minute to complete and is a simple first step toward breathing easier.</p></td></tr> <tr style="border-collapse:collapse">
<td align="center" style="padding:10px;Margin:0">${takeTheSNOT12TestButton}</td></tr> <tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-top:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">You may be eligible to use your Medicare or insurance benefits towards your treatment. If you have any questions or would like help checking your insurance coverage, please call us at <a target="_blank" href="tel:(630)513-1691" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px"></a><a href="tel:${doctorProfile?.phone || '224-412-5949'}" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px">224-412-5949</a>.</p>
 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">Sincerely,</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">${doctorProfile?.first_name || 'Ryan'} ${doctorProfile?.last_name || 'Vaughn'}, MD<br>${doctorProfile?.clinic_name || 'Your Clinic Name'}&nbsp;</p></td></tr></table></td></tr></table></td></tr></table></td></tr></table>
 <table class="r" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0"><table class="bc" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"><tr style="border-collapse:collapse"><td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0;display:none"></td> </tr></table></td></tr></table></td></tr></table></td></tr></table> <table class="p" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0"><table class="bd" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" cellspacing="0" cellpadding="0" align="center" role="none"><tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;padding-bottom:30px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0;display:none"></td> </tr></table></td></tr></table></td></tr></table></td></tr></table></td></tr></table></div></body></html>`;
  }, [doctorProfile, baseUrl]);

const mailHtmlSNOT22 = useMemo(() => {
      const snot22Url = `${baseUrl}/share/snot22?doctor=${doctorProfile?.id || 'demo'}&utm_source=email`;
    const websiteLink = doctorProfile?.website
      ? `<a target="_blank" href="${doctorProfile.website}" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px"><img src="${doctorProfile?.avatar_url || 'Your Website Image'}" alt="" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="200" height="47"></a>`
      : `<img src="https://cdn.prod.website-files.com/6213b8b7ae0610f9484d627a/63d85029011f18f6bfabf2f3_Exhale_Sinus_Horizontal_logo-p-800.png" alt="" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="200" height="47">`;

    const amIACandidateButton = `<span class="x" style="border-style:solid;border-color:#2CB543;background:#6fa8dc;border-width:0px 0px 2px 0px;display:inline-block;border-radius:5px;width:auto"><a href="${snot22Url}" class="b b-1619632113981" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;display:inline-block;background:#6fa8dc;border-radius:5px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:16.8px;width:auto;text-align:center;padding:10px 20px;mso-padding-alt:0;mso-border-alt:10px solid #6fa8dc">Am I a Candidate?</a></span>`;

    const takeTheSNOT22TestButton = `<span class="x" style="border-style:solid;border-color:#2CB543;background:#6fa8dc;border-width:0px 0px 2px 0px;display:inline-block;border-radius:5px;width:auto"><a href="${snot22Url}" class="b" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;display:inline-block;background:#6fa8dc;border-radius:5px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:16.8px;width:auto;text-align:center;padding:10px 20px 10px 20px;mso-padding-alt:0;mso-border-alt:10px solid #6fa8dc">Take the SNOT22 Test</a></span>`;
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0"><head><meta charset="UTF-8"><meta content="width=device-width, initial-scale=1" name="viewport"><meta name="x-apple-disable-message-reformatting"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta content="telephone=no" name="format-detection"><title>E</title> <!--[if (mso 16)]><style type="text/css"> a {text-decoration: none;}  </style><![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]><noscript> <xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> </noscript>
<![endif]--><!--[if mso]><xml> <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"> <w:DontUseAdvancedTypographyReadingMail></w:DontUseAdvancedTypographyReadingMail> </w:WordDocument> </xml>
<![endif]--><style type="text/css">#outlook a { padding:0;}.ExternalClass { width:100%;}.ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div { line-height:100%;}.b { mso-style-priority:100!important; text-decoration:none!important;}a[x-apple-data-detectors] { color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important;}.a { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all;}@media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:26px!important; text-align:center } h3 { font-size:20px!important; text-align:center }
 .bd p, .bd ul li, .bd ol li, .bd a { font-size:16px!important } *[class="gmail-fix"] { display:none!important } .x { display:block!important } .p table, .q table, .r table, .p, .r, .q { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important } a.b, button.b { font-size:20px!important; display:block!important; padding:10px 0px 10px 0px!important } }@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }</style>
 </head> <body data-new-gr-c-s-loaded="14.1244.0" style="font-family:arial, 'helvetica neue', helvetica, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"><div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F6F6F6"><!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f6f6f6"></v:fill> </v:background><![endif]--><table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F6F6F6"><tr style="border-collapse:collapse">
<td valign="top" style="padding:0;Margin:0"><table class="p" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0"><table class="bd" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"><tr style="border-collapse:collapse"><td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0;font-size:0px">${websiteLink}</td></tr><tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-top:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">Hello {{contact.first_name}},<br><br>This is ${doctorProfile?.first_name || 'your ENT'}. Do you experience difficulty breathing through your nose and nothing seems to help? You may have nasal obstruction, a common condition that affects millions of Americans.<br><br>I am now offering non-invasive treatment options that can help you breathe better with lasting results. The non-invasive treatments may be performed right in our office, and patients may return to normal activities on the same day.<br><br>Are you a candidate? Click below to take a quick test and find out.</p></td></tr> <tr style="border-collapse:collapse">
<td align="center" style="padding:10px;Margin:0">${amIACandidateButton}</td></tr> <tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-top:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">If you experience difficulty breathing through your nose and nothing seems to help, we recommend taking the SNOT22 Test to evaluate your nasal and sinus symptoms and their impact on your quality of life.<br><br>The <b>Sino-Nasal Outcome Test (SNOT)</b>&nbsp;Test is a short, 22-question survey. <span style="color:#333333">Each question is scored from 0 (not a problem) to 5 (severe problem). Your total score helps your provider understand how serious your symptoms are and what treatment options might be appropriate.</span></p>
 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">It takes less than a minute to complete and is a simple first step toward breathing easier.</p></td></tr> <tr style="border-collapse:collapse">
<td align="center" style="padding:10px;Margin:0">${takeTheSNOT22TestButton}</td></tr> <tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-top:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">You may be eligible to use your Medicare or insurance benefits towards your treatment. If you have any questions or would like help checking your insurance coverage, please call us at <a target="_blank" href="tel:(630)513-1691" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px"></a><a href="tel:${doctorProfile?.phone || '224-412-5949'}" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px">224-412-5949</a>.</p>
 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">Sincerely,</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">${doctorProfile?.first_name || 'Ryan'} ${doctorProfile?.last_name || 'Vaughn'}, MD<br>${doctorProfile?.clinic_name || 'Your Clinic Name'}&nbsp;</p></td></tr></table></td></tr></table></td></tr></table></td></tr></table>
 <table class="r" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0"><table class="bc" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"><tr style="border-collapse:collapse"><td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0;display:none"></td> </tr></table></td></tr></table></td></tr></table></td></tr></table> <table class="p" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0"><table class="bd" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" cellspacing="0" cellpadding="0" align="center" role="none"><tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;padding-bottom:30px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0;display:none"></td> </tr></table></td></tr></table></td></tr></table></td></tr></table></td></tr></table></div></body></html>`;
  }, [doctorProfile, baseUrl]);
const mailHtmlTNSS = useMemo(() => {
      const tnssUrl = `${baseUrl}/share/tnss?doctor=${doctorProfile?.id || 'demo'}&utm_source=email`;
    const websiteLink = doctorProfile?.website
      ? `<a target="_blank" href="${doctorProfile.website}" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px"><img src="${doctorProfile?.avatar_url || 'Your Website Image'}" alt="" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="200" height="47"></a>`
      : `<img src="https://cdn.prod.website-files.com/6213b8b7ae0610f9484d627a/63d85029011f18f6bfabf2f3_Exhale_Sinus_Horizontal_logo-p-800.png" alt="" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="200" height="47">`;
    const amIACandidateButton = `<span class="x" style="border-style:solid;border-color:#2CB543;background:#6fa8dc;border-width:0px 0px 2px 0px;display:inline-block;border-radius:5px;width:auto"><a href="${tnssUrl}" class="b b-1619632113981" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;display:inline-block;background:#6fa8dc;border-radius:5px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:16.8px;width:auto;text-align:center;padding:10px 20px;mso-padding-alt:0;mso-border-alt:10px solid #6fa8dc">Am I a Candidate?</a></span>`;
    const takeTheTNSSTestButton = `<span class="x" style="border-style:solid;border-color:#2CB543;background:#6fa8dc;border-width:0px 0px 2px 0px;display:inline-block;border-radius:5px;width:auto"><a href="${tnssUrl}" class="b" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#FFFFFF;font-size:14px;display:inline-block;background:#6fa8dc;border-radius:5px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:16.8px;width:auto;text-align:center;padding:10px 20px 10px 20px;mso-padding-alt:0;mso-border-alt:10px solid #6fa8dc">Take the TNSS Test</a></span>`;
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" style="padding:0;Margin:0"><head><meta charset="UTF-8"><meta content="width=device-width, initial-scale=1" name="viewport"><meta name="x-apple-disable-message-reformatting"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta content="telephone=no" name="format-detection"><title>E</title> <!--[if (mso 16)]><style type="text/css"> a {text-decoration: none;}  </style><![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]><noscript> <xml> <o:OfficeDocumentSettings> <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> </noscript>
<![endif]--><!--[if mso]><xml> <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"> <w:DontUseAdvancedTypographyReadingMail></w:DontUseAdvancedTypographyReadingMail> </w:WordDocument> </xml>
<![endif]--><style type="text/css">#outlook a { padding:0;}.ExternalClass { width:100%;}.ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div { line-height:100%;}.b { mso-style-priority:100!important; text-decoration:none!important;}a[x-apple-data-detectors] { color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important;}.a { display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all;}@media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:30px!important; text-align:center } h2 { font-size:26px!important; text-align:center } h3 { font-size:20px!important; text-align:center }
 .bd p, .bd ul li, .bd ol li, .bd a { font-size:16px!important } *[class="gmail-fix"] { display:none!important } .x { display:block!important } .p table, .q table, .r table, .p, .r, .q { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important } a.b, button.b { font-size:20px!important; display:block!important; padding:10px 0px 10px 0px!important } }@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }</style>
 </head> <body data-new-gr-c-s-loaded="14.1244.0" style="font-family:arial, 'helvetica neue', helvetica, sans-serif;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"><div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#F6F6F6"><!--[if gte mso 9]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t"> <v:fill type="tile" color="#f6f6f6"></v:fill> </v:background><![endif]--><table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#F6F6F6"><tr style="border-collapse:collapse">
<td valign="top" style="padding:0;Margin:0"><table class="p" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0"><table class="bd" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px"><tr style="border-collapse:collapse"><td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0;font-size:0px">${websiteLink}</td></tr><tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-top:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">Hello {{contact.first_name}},<br><br>This is ${doctorProfile?.first_name || 'your ENT'}. Do you experience difficulty breathing through your nose and nothing seems to help? You may have nasal obstruction, a common condition that affects millions of Americans.<br><br>I am now offering non-invasive treatment options that can help you breathe better with lasting results. The non-invasive treatments may be performed right in our office, and patients may return to normal activities on the same day.<br><br>Are you a candidate? Click below to take a quick test and find out.</p></td></tr> <tr style="border-collapse:collapse">
<td align="center" style="padding:10px;Margin:0">${amIACandidateButton}</td></tr> <tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-top:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">If you experience difficulty breathing through your nose and nothing seems to help, we recommend taking the TNSS Test to evaluate your nasal and sinus symptoms and their impact on your quality of life.<br><br>The <b>Total Nasal Symptom Score (TNSS)</b>&nbsp;Test is a short, 22-question survey. <span style="color:#333333">Each question is scored from 0 (not a problem) to 5 (severe problem). Your total score helps your provider understand how serious your symptoms are and what treatment options might be appropriate.</span></p>
 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">It takes less than a minute to complete and is a simple first step toward breathing easier.</p></td></tr> <tr style="border-collapse:collapse">
<td align="center" style="padding:10px;Margin:0">${takeTheTNSSTestButton}</td></tr> <tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-top:20px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">You may be eligible to use your Medicare or insurance benefits towards your treatment. If you have any questions or would like help checking your insurance coverage, please call us at <a target="_blank" href="tel:(630)513-1691" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px"></a><a href="tel:${doctorProfile?.phone || '224-412-5949'}" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#1376C8;font-size:14px">224-412-5949</a>.</p>
 <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px"><br></p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">Sincerely,</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#000000;font-size:14px">${doctorProfile?.first_name || 'Ryan'} ${doctorProfile?.last_name || 'Vaughn'}, MD<br>${doctorProfile?.clinic_name || 'Your Clinic Name'}&nbsp;</p></td></tr></table></td></tr></table></td></tr></table></td></tr></table>
 <table class="r" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0"><table class="bc" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"><tr style="border-collapse:collapse"><td align="left" style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse">
<td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0;display:none"></td> </tr></table></td></tr></table></td></tr></table></td></tr></table> <table class="p" cellspacing="0" cellpadding="0" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0"><table class="bd" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" cellspacing="0" cellpadding="0" align="center" role="none"><tr style="border-collapse:collapse">
<td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px;padding-bottom:30px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td valign="top" align="center" style="padding:0;Margin:0;width:560px"><table width="100%" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"><tr style="border-collapse:collapse"><td align="center" style="padding:0;Margin:0;display:none"></td> </tr></table></td></tr></table></td></tr></table></td></tr></table></td></tr></table></div></body></html>`;
  }, [doctorProfile, baseUrl]);

  const activeMailHtml = useMemo(() => {
    if (quizId?.toLowerCase() === 'snot12') {
      return mailHtmlSNOT12;
    }
    if (quizId?.toLowerCase() === 'snot22') {
      return mailHtmlSNOT22;
    }
    if(quizId?.toLowerCase() === 'tnss') {
      return mailHtmlTNSS;
    }
    return mailHtmlNOSE;
  }, [quizId, mailHtmlNOSE, mailHtmlSNOT12, mailHtmlSNOT22,mailHtmlTNSS]);

  const blob = useMemo(() => new Blob([activeMailHtml], { type: 'text/html' }), [activeMailHtml]);
  const mailiframSrc = useMemo(() => URL.createObjectURL(blob), [blob]);

 useEffect(() => {
    if (embedUrl) {
      const deviceType = getDeviceType();
      const size = getDeviceSize();

      const script = `
        (function() {
          var container = document.currentScript.parentElement;
          var deviceType = (function() {
            var width = window.innerWidth;
            if (width < 768) return 'phone';
            if (width < 1024) return 'tablet';
            return 'desktop';
          })();
          var sizes = {
            phone: { width: '375px', height: '667px' },
            tablet: { width: '768px', height: '1024px' },
            desktop: { width: '100%', height: '700px' },
          };
          var size = sizes[deviceType];
          container.style.width = size.width;
          container.style.height = size.height;
          container.style.maxWidth = '100%';
        })();
      `;

      const iframeCode = `<div id="quiz-embed-container" style="width: ${size.width}; height: ${size.height}; max-width: 100%;">
  <iframe src="${embedUrl}" width="100%" height="100%" style="border: none;" title="Quiz Embed"></iframe>
</div>
<script>${script.replace('quiz-embed-container', 'document.currentScript.previousElementSibling.id')}</script>`;

      const buttonEmbedCode = `<div id="quiz-chatbot-container"></div>
<script>
  (function() {
    var container = document.getElementById('quiz-chatbot-container');
    if (!container) return;

    var deviceType = (function() {
      var width = window.innerWidth;
      if (width < 768) return 'phone';
      if (width < 1024) return 'tablet';
      return 'desktop';
    })();
    var sizes = {
      phone: { width: '375px', height: '667px' },
      tablet: { width: '768px', height: '1024px' },
      desktop: { width: '100%', height: '700px' },
    };
    var size = sizes[deviceType];
    container.style.width = size.width;
    container.style.height = size.height;
    container.style.maxWidth = '100%';
    
    var button = document.createElement('button');
    button.innerText = 'Take the ${quizId.toUpperCase()} Assessment';
    button.style.cssText = 'background-color: #2563EB; color: white; padding: 10px 20px; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; transition: all 0.2s ease;';
    
    container.appendChild(button);
    
    button.addEventListener('mouseenter', function() {
      button.style.backgroundColor = '#1D4ED8';
      button.style.transform = 'scale(1.1)';
    });
    button.addEventListener('mouseleave', function() {
      button.style.backgroundColor = '#2563EB';
      button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', function() {
      container.innerHTML = '';
      var iframe = document.createElement('iframe');
      iframe.src = '${embedUrl}';
      iframe.style.cssText = 'width: 100%; height: 100%; border: none; border-radius: 10px;';
      container.appendChild(iframe);
    });
  })();
</script>`;

      const chatEmbedCode = `<div id="quiz-chat-widget-container"></div>
<script>
  (function() {
    var container = document.getElementById('quiz-chat-widget-container');
    if (!container) return;

    var button = document.createElement('button');
    button.style.cssText = 'background-color: #2563EB; width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.2); display: flex; justify-content: center; align-items: center; position: fixed; bottom: 20px; right: 20px;';
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    
    container.appendChild(button);

    var iframe = null;
    var isOpen = false;

    button.addEventListener('click', function() {
      if (isOpen) {
        if (iframe) iframe.style.display = 'none';
        isOpen = false;
      } else {
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.src = '${embedUrl}';
          iframe.style.cssText = 'position: fixed; bottom: 90px; right: 20px; width: 400px; height: 600px; border: none; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);';
          container.appendChild(iframe);
        }
        iframe.style.display = 'block';
        isOpen = true;
      }
    });
  })();
</script>`;

      if (embedType === 'inline') {
        setEmbedCode(iframeCode);
      } else if (embedType === 'button') {
        setEmbedCode(buttonEmbedCode);
      } else if (embedType === 'chat') {
        setEmbedCode(chatEmbedCode);
      }
    }
  }, [embedUrl, embedType, quizId]);

 const handleCopy = (text: string, successMessage: string) => {
   navigator.clipboard.writeText(text)
     .then(() => {
       toast.success(successMessage);
     })
     .catch(err => {
       console.error("Could not copy text: ", err);
       toast.error('Failed to copy to clipboard.');
     });
 };

 if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-4">Error</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <Button onClick={() => navigate('/portal')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const quizExists = customQuizId ? customQuiz : Object.values(quizzes).find(
    quiz => quiz.id.toLowerCase() === quizId?.toLowerCase()
  );
  
  if (!quizExists) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h2>
            <p className="text-gray-600 mb-6">The requested assessment could not be found.</p>
          <Button onClick={() => navigate('/portal')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const getQuizDisplayName = (id: string) => {
    return id.toUpperCase() === 'MIDAS' ? 'MSQ' : id;
  };

  const quizInfo = customQuiz ? {
    title: customQuiz.title,
    description: customQuiz.description,
    shareMessage: customQuiz.share_message || `Take this ${customQuiz.title} assessment to evaluate your symptoms.`,
    linkedinMessage: customQuiz.linkedin_message || `Share this ${customQuiz.title} assessment with your patients to evaluate their symptoms.`
  } : {
    title: getQuizDisplayName(quizId || 'Assessment'),
    description: quizExists.description || "Medical assessment tool",
    shareMessage: `Take this ${getQuizDisplayName(quizId || '')} assessment to evaluate your symptoms.`,
    linkedinMessage: `Share this ${getQuizDisplayName(quizId || '')} assessment with your patients to evaluate their symptoms.`
  };

  
  const doctorLandingUrl = doctorProfile?.id ? `${baseUrl}/share/${quizId}/${doctorProfile.id}` : `${baseUrl}/share/${quizId}/demo`;
  const doctorEditingUrl = doctorProfile?.id ? `${baseUrl}/${quizId}-editor/${doctorProfile.id}` : `${baseUrl}/share/${quizId}/demo`;
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/portal')}
                className="p-2 sm:p-2 sm:flex sm:items-center sm:gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Share Assessment</h1>
                <p className="text-sm sm:text-base text-gray-600">{quizInfo.title.toUpperCase()}</p>
                {doctorProfile && (
                  <p className="text-xs sm:text-sm text-gray-500">
                    Dr. {doctorProfile.first_name} {doctorProfile.last_name} (ID: {doctorProfile.id})
                  </p>
                )}
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-[#f7904f] to-[#04748f] text-white px-3 py-1.5 text-sm self-end sm:self-center">
              {customQuiz ? 'Custom Quiz' : 'Standard Quiz'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
            <TabsTrigger value="full-page" className="flex items-center gap-2">
              <Maximize className="w-4 h-4" />
              Full Page
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Embed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="full-page" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Share Assessment with Source Tracking</CardTitle>
                <CardDescription>
                  Share this link to track where your leads come from
                  {doctorProfile && (
                    <span className="block text-sm text-green-600 mt-1">
                      ✓ Doctor ID ({doctorProfile.id}) is included in all URLs
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  
                  {/* LP Link Section */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700">Landing page Link</h4>
                    <div className="flex gap-2">
                      <Input
                        value={shareUrl}
                        readOnly
                        className="flex-1 text-xs font-mono"
                        placeholder="Landing Page Link"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(shareUrl, 'Landing page link copied!')}
                        title="Copy Landing Page Link"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doctorLandingUrl, '_blank')}
                        title="Open Landing Page"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        value={shortUrls['lp'] || "Generate a short URL for easier sharing"}
                        readOnly
                        className="flex-1 text-xs font-mono"
                        placeholder="Short Link"
                      />
                      {shortUrls['lp'] ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(shortUrls['lp'], 'Short URL')}
                            title="Copy Short URL"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(shortUrls['lp'], '_blank')}
                            title="Open Short URL"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateShortUrlForFormat(shareUrl, 'lp')}
                          disabled={isGeneratingShortUrls['lp']}
                          title="Generate Short URL"
                        >
                          {isGeneratingShortUrls['lp'] ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Link2 className="w-4 h-4 mr-1" />
                          )}
                          Generate
                        </Button>
                      )}
                    </div>
                    
                    {/* Landing Page QR Code */}
                    <div className="flex items-center gap-4 mt-2">
                      <h5 className="font-medium text-xs text-gray-600">Landing Page QR Code</h5>
                      {showQrCode ? (
                        <>
                          <div id="landing-qr" className="bg-white p-2 rounded-lg border border-gray-200">
                            <QRCodeSVG value={doctorLandingUrl} size={100} />
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadQrAsPng('landing-qr', 'landing-page-qr')}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            .png
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowQrCode(true)}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Generate QR
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Quiz Link - Chat Section */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Quiz Link - Chat
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        value={chatFormatUrl}
                        readOnly
                        className="flex-1 text-xs font-mono"
                        placeholder="Chat Format Link"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(chatFormatUrl, 'Chat format link copied!')}
                        title="Copy Chat Format Link"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(chatFormatUrl, '_blank')}
                        title="Open Chat Format"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        value={shortUrls['chat'] || "Generate a short URL for easier sharing"}
                        readOnly
                        className="flex-1 text-xs font-mono"
                        placeholder="Short Link"
                      />
                      {shortUrls['chat'] ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(shortUrls['chat'], 'Chat Short URL')}
                            title="Copy Chat Short URL"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(shortUrls['chat'], '_blank')}
                            title="Open Chat Short URL"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateShortUrlForFormat(chatFormatUrl, 'chat')}
                          disabled={isGeneratingShortUrls['chat']}
                          title="Generate Chat Short URL"
                        >
                          {isGeneratingShortUrls['chat'] ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Link2 className="w-4 h-4 mr-1" />
                          )}
                          Generate
                        </Button>
                      )}
                    </div>
                    
                    {/* Chat Quiz QR Code */}
                    <div className="flex items-center gap-4 mt-2">
                      <h5 className="font-medium text-xs text-gray-600">Chat Quiz QR Code</h5>
                      {showChatQrCode ? (
                        <>
                          <div id="chat-qr" className="bg-white p-2 rounded-lg border border-gray-200">
                            <QRCodeSVG value={chatFormatUrl} size={100} />
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadQrAsPng('chat-qr', 'chat-quiz-qr')}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            .png
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowChatQrCode(true)}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Generate QR
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Quiz Link - Standard Section */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Quiz Link - Standard
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        value={standardFormatUrl}
                        readOnly
                        className="flex-1 text-xs font-mono"
                        placeholder="Standard Format Link"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(standardFormatUrl, 'Standard format link copied!')}
                        title="Copy Standard Format Link"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(standardFormatUrl, '_blank')}
                        title="Open Standard Format"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        value={shortUrls['standard'] || "Generate a short URL for easier sharing"}
                        readOnly
                        className="flex-1 text-xs font-mono"
                        placeholder="Short Link"
                      />
                      {shortUrls['standard'] ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(shortUrls['standard'], 'Standard Short URL')}
                            title="Copy Standard Short URL"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(shortUrls['standard'], '_blank')}
                            title="Open Standard Short URL"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateShortUrlForFormat(standardFormatUrl, 'standard')}
                          disabled={isGeneratingShortUrls['standard']}
                          title="Generate Standard Short URL"
                        >
                          {isGeneratingShortUrls['standard'] ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Link2 className="w-4 h-4 mr-1" />
                          )}
                          Generate
                        </Button>
                      )}
                    </div>
                    
                    {/* Standard Quiz QR Code */}
                    <div className="flex items-center gap-4 mt-2">
                      <h5 className="font-medium text-xs text-gray-600">Standard Quiz QR Code</h5>
                      {showStandardQrCode ? (
                        <>
                          <div id="standard-qr" className="bg-white p-2 rounded-lg border border-gray-200">
                            <QRCodeSVG value={standardFormatUrl} size={100} />
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadQrAsPng('standard-qr', 'standard-quiz-qr')}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            .png
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowStandardQrCode(true)}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Generate QR
                        </Button>
                      )}
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Social Media Sharing</CardTitle>
                      <CardDescription>Each platform gets tracked separately</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleSocialShare('facebook')}
                          className="hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center"
                        >
                          <Facebook className="w-4 h-4 mr-2" />
                          Facebook
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSocialShare('twitter')}
                          className="hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center"
                        >
                          <Twitter className="w-4 h-4 mr-2" />
                          Twitter
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSocialShare('email')}
                          className="hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSocialShare('text')}
                          className="hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center"
                        >
                          <Smartphone className="w-4 h-4 mr-2" />
                          Text/SMS
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* Email Notifications Configuration */}
                <EmailNotificationConfig 
                  doctorProfile={doctorProfile}
                  quizId={quizId || ''}
                  quizTitle={quiz?.title || 'Assessment'}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Embed Code</CardTitle>
                <Tabs value={embedType} onValueChange={(value) => setEmbedType(value as 'inline' | 'button' | 'chat')} className="w-full pt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="inline">Inline Iframe</TabsTrigger>
                    <TabsTrigger value="button">Button Popup</TabsTrigger>
                    <TabsTrigger value="chat">Chat Button</TabsTrigger>
                  </TabsList>
                </Tabs>
                <CardDescription>
                  Add this assessment directly to your website
                  {doctorProfile && (
                    <span className="block text-sm text-green-600 mt-1">
                      ✓ Doctor ID ({doctorProfile.id}) is included in the embed URL
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={embedCode}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    onClick={() => handleCopy(embedCode, 'Embed code copied!')}
                    className="min-w-[100px]"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EmbedPreview
                        embedType={embedType}
                        embedUrl={embedUrl}
                        quizInfo={quizInfo}
                        onSizeChange={setEmbedSize}
                        quizId={quizId}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Implementation Guide</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">1. Copy the embed code</h4>
                        <p className="text-sm text-gray-600">Click the copy button above to copy the embed code to your clipboard.</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">2. Paste into your website</h4>
                        <p className="text-sm text-gray-600">Paste the code into your website's HTML where you want the assessment to appear.</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">3. Customize Appearance (Optional)</h4>
                        <p className="text-sm text-gray-600">You can customize the chatbot's appearance by adding parameters to the URL in the <code>src</code> attribute of the iframe.</p>
                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                          <li><b>Size:</b> Add <code>&width=...</code> and <code>&height=...</code> (e.g., <code>&width=400px&height=600px</code>).</li>
                          <li><b>Colors:</b> Add parameters like <code>&primary=2563eb</code> for colors (use hex codes without '#').</li>
                        </ul>
                        <p className="text-sm text-gray-500 mt-2">Example: <code>src="{embedUrl}?primary=007bff&userBubble=007bff&userText=ffffff"</code></p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">4. Source tracking included</h4>
                        <p className="text-sm text-gray-600">All leads will be tracked with "website" as the source automatically.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
