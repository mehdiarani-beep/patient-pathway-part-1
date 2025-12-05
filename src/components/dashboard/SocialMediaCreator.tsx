import React, { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, Eye, Edit3, Image, Type, Sparkles, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreateDoctorProfile } from '@/lib/profileUtils';

const SocialMediaCreator = () => {
  const [selectedCategory, setSelectedCategory] = useState('NOSE');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState({
    first_name: 'John',
    last_name: 'Smith',
    phone: '+1 (555) 123-4567',
    location: '123 Medical Center Dr, City, State 12345',
    clinic_name: 'Advanced ENT Clinic'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (user) {
      fetchDoctorProfile();
    }
  }, [user]);
  const fetchDoctorProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // First, get the current user's profile to check if they're staff/manager
      const { data: userProfiles, error: fetchError } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching doctor profiles:', fetchError);
        setError('Failed to fetch doctor profile');
        return;
      }

      let profile = null;

      if (!userProfiles || userProfiles.length === 0) {
        // No profile exists, create one (regular doctor)
        profile = await getOrCreateDoctorProfile(user.id, user.email || undefined);
      } else {
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
              profile = userProfile;
            } else {
              // Use main doctor's profile for display
              profile = mainDoctorProfile;
            }
          } else {
            // No clinic link, use user's own profile
            profile = userProfile;
          }
        } else {
          // Regular doctor, use their own profile
          profile = userProfile;
        }
      }
      
      if (profile) {
        setDoctorProfile(profile);
      } else {
        setError('Failed to fetch or create doctor profile');
      }
    } catch (error) {
      console.error('Error in fetchDoctorProfile:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getDoctorName = () => {
    if (doctorProfile?.first_name && doctorProfile?.last_name) {
      return `Dr. ${doctorProfile.first_name} ${doctorProfile.last_name}`;
    }
    return 'the doctor';
  };

  const getDoctorPhone = () => {
    if (doctorProfile?.phone) {
      return doctorProfile.phone;
    }
    return 'No Phone Number';
  }

  const getDoctorAddress = () => {
    if(doctorProfile?.location){
      return `${doctorProfile.location}`;
    }
    return `No Location`;
  }

  const getClinicName = () => {
    if(doctorProfile?.clinic_name){
      return `${doctorProfile.clinic_name}`;
    }
    return `No Clinic Name`;
  }
  // Calendar states
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [selectedEventDate, setSelectedEventDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [calendarPostText, setCalendarPostText] = useState('');
  const [calendarPostLoading, setCalendarPostLoading] = useState(false);
  const [calendarPosts, setCalendarPosts] = useState([]);

  // ENT Health dates - recurring yearly events
  const entHealthDates = [
    { month: 1, day: 24, occasion: 'International Day of Education', relevance: 'Health literacy, ENT patient education' },
    { month: 2, day: 4, occasion: 'World Cancer Day', relevance: 'Includes head & neck cancer awareness' },
    { month: 2, day: 13, occasion: 'World Radio Day', relevance: 'Ear health, hearing loss due to noise' },
    { month: 3, day: 3, occasion: 'World Hearing Day', relevance: 'Directly ENT — hearing loss awareness' },
    { month: 3, day: 20, occasion: 'World Oral Health Day', relevance: 'Mouth, throat, tonsils — ENT overlaps' },
    { month: 4, day: 7, occasion: 'World Health Day', relevance: 'General health; promote ENT checkups' },
    { month: 4, day: 16, occasion: 'Voice Day', relevance: 'Throat, vocal cord health (ENT focus)' },
    { month: 5, day: 12, occasion: 'International Nurses Day', relevance: 'Healthcare support staff shoutout' },
    { month: 5, day: 16, occasion: 'International Cough Day', relevance: 'Cough = ENT/respiratory relevance' },
    { month: 5, day: 31, occasion: 'World No Tobacco Day', relevance: 'ENT cancers, vocal health, sinus impact' },
    { month: 6, day: 21, occasion: 'International Yoga Day', relevance: 'Breath, sinuses, posture and ENT care' },
    { month: 7, day: 1, occasion: 'National Doctor\'s Day (India)', relevance: 'Doctors\' celebration day 🇮🇳' },
    { month: 7, day: 3, occasion: 'International Plastic Bag Free Day', relevance: 'Talk about ENT microplastic exposure' },
    { month: 7, day: 15, occasion: 'World Youth Skills Day', relevance: 'ENT health for growing minds' },
    { month: 8, day: 1, occasion: 'World Breastfeeding Week', relevance: 'ENT: lactation & infant ear infections' },
    { month: 9, day: 21, occasion: 'World Alzheimer\'s Day', relevance: 'Aging & hearing loss, ENT link' },
    { month: 9, day: 26, occasion: 'International Day for Deaf' , relevance: 'Strong ENT theme and Hearing Quiz'},
    { month: 10, day: 10, occasion: 'World Mental Health Day', relevance: 'ENT-migraine, tinnitus, sleep disorders'},
    { month: 10, day: 12, occasion: 'World Sight Day', relevance: 'Can be linked to vision/hearing balance and can incorporate HHIA quiz in this'},
    { month: 10, day: 14, occasion: 'World Standards Day', relevance: 'ENT device quality, audiology tools'},
    { month: 10, day: 20, occasion: 'World Osteoporosis Day', relevance: 'Jaw/throat health in aging patients'},
    { month: 11, day: 12, occasion: 'World Pneumonia Day', relevance: 'ENT–respiratory tract infections'},
    { month: 11, day: 14, occasion: 'World Diabetes Day', relevance: 'ENT infections higher in diabetic patients'},
    { month: 11, day: 20, occasion: 'Universal Children\'s Day', relevance: 'ENT health in children'},
    { month: 11, day: 25, occasion: 'International Day for Elimination of Violence Against Women', relevance: 'ENT trauma awareness'},
    { month: 12, day: 1, occasion: 'World AIDS Day', relevance: 'ENT manifestations in immunocompromised'},
    { month: 12, day: 3, occasion: 'International Day of Persons with Disabilities', relevance: 'Hearing loss, ENT disabilities'},
    { month: 12, day: 5, occasion: 'International Volunteer Day', relevance: 'Medical outreach stories'},
    { month: 12, day: 10, occasion: 'Human Rights Day', relevance: 'Access to ENT healthcare'},
    { month: 12, day: 15, occasion: 'National Energy Conservation Day', relevance: 'Promote sustainable ENT clinic practices'}
  ];

  // Generate calendar dates for next 12 months
  const generateCalendarEvents = () => {
    const events = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    
    entHealthDates.forEach(event => {
      // Check if event has already passed this year
      const eventDateThisYear = new Date(currentYear, event.month - 1, event.day);
      const eventDateNextYear = new Date(currentYear + 1, event.month - 1, event.day);
      
      if (eventDateThisYear >= today) {
        events.push({
          ...event,
          date: eventDateThisYear,
          dateString: eventDateThisYear.toISOString().slice(0, 10)
        });
      } else {
        events.push({
          ...event,
          date: eventDateNextYear,
          dateString: eventDateNextYear.toISOString().slice(0, 10)
        });
      }
    });
    
    return events.sort((a, b) => a.date - b.date);
  };

  const calendarEvents = generateCalendarEvents();

  // Get events for a specific date
  const getEventForDate = (date) => {
    const dateString = date.toISOString().slice(0, 10);
    return calendarEvents.find(event => event.dateString === dateString);
  };

  // Get post for a specific date
  const getPostForDate = (date) => {
    const dateString = date.toISOString().slice(0, 10);
    return calendarPosts.find(post => post.date === dateString);
  };

  // Calendar navigation
  const navigateCalendar = (direction) => {
    const newDate = new Date(currentCalendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    
    // Don't allow going to past months
    const today = new Date();
    const firstDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (firstDayOfMonth >= firstDayOfCurrentMonth) {
      setCurrentCalendarDate(newDate);
    }
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const isCurrentMonth = date.getMonth() === month;
      const isPast = date < today;
      const event = getEventForDate(date);
      const post = getPostForDate(date);
      
      days.push({
        date,
        isCurrentMonth,
        isPast,
        event,
        post,
        day: date.getDate()
      });
    }
    
    return days;
  };

  // Handle day click
  const handleDayClick = (dayInfo) => {
    if (dayInfo.isPast || !dayInfo.event) return;
    
    setSelectedEventDate(dayInfo.date);
    setSelectedEvent(dayInfo.event);
    setCalendarPostText(dayInfo.post?.post_text || '');
    setCalendarDialogOpen(true);
  };

  // Generate post content for event
  const generateEventPost = async () => {
    if (!selectedEvent) return;
    
    setCalendarPostLoading(true);
    
    // Simulate AI generation - replace with actual API call
    const sampleContent = `🌟 Today is ${selectedEvent.occasion}! 

At ${getClinicName()}, we believe in the importance of ${selectedEvent.relevance.toLowerCase()}. 

Book your consultation with ${getDoctorName()} today!
📞 ${getDoctorPhone()}
📍 ${getDoctorAddress()}

#ENTHealth #${selectedEvent.occasion.replace(/\s+/g, '')}`;

    setTimeout(() => {
      setCalendarPostText(sampleContent);
      setCalendarPostLoading(false);
    }, 1500);
  };

  // Save calendar post
  const handleSaveCalendarPost = async () => {
    if (!selectedEventDate || !selectedEvent) return;
    
    const dateString = selectedEventDate.toISOString().slice(0, 10);
    const existingPostIndex = calendarPosts.findIndex(p => p.date === dateString);
    
    const postData = {
      date: dateString,
      occasion: selectedEvent.occasion,
      relevance: selectedEvent.relevance,
      post_text: calendarPostText,
      updated_at: new Date().toISOString()
    };
    
    if (existingPostIndex >= 0) {
      // Update existing post
      const updatedPosts = [...calendarPosts];
      updatedPosts[existingPostIndex] = { ...updatedPosts[existingPostIndex], ...postData };
      setCalendarPosts(updatedPosts);
    } else {
      // Add new post
      setCalendarPosts([...calendarPosts, { ...postData, id: Date.now() }]);
    }
    
    setCalendarDialogOpen(false);
  };

  const samplePosts = {
    NOSE: [
      {
        text: `Look around and you’ll see that a large percentage of the population breathes incorrectly! Worst of all, and maybe the most common, is the habit of mouth breathing.\n\nEven for nonsmokers, there’s a long list of problems associated with mouth breathing.1 These may range from embarrassing issues such as bad breath, to life-threatening concerns – obesity, heart and lung problems and more.\n\nIf you’re concerned that your mouth breathing habits may be hurting your health, click here to see what you can do about it.`,
        image: "https://images.unsplash.com/photo-1465409042654-5314e9d1754b?w=600&h=300&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        hashtags: ["#MouthBreathing", "#BreatheRight", "#HealthAwareness"]
      },
      {
        text: `Millions of people suffer from nasal airway obstruction, which makes it difficult to breathe through the nose and gives the sensation of always being blocked-up.\n\nSymptoms may include chronic congestion or stuffiness, trouble breathing, snoring, and trouble sleeping. You may also find yourself struggling to breathe through your nose during exercise or exertion.\n\nUntil now, your only options may have been medications, breathing strips that offer temporary relief, and surgeries that often have a long recovery period.\n\n${getDoctorName()} now offers the VivAer® procedure which may provide lasting relief1 without surgery. This procedure can be performed in our office and has been clinically shown to improve breathing.`,
        image: "https://images.pexels.com/photos/3951623/pexels-photo-3951623.jpeg?_gl=1*4ptbzp*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTMxMTMkbzIkZzEkdDE3NTMzNTMyNDkkajYwJGwwJGgw",
        hashtags: ["#NasalAirwayObstruction", "#VivAer", "#NonSurgicalRelief"]
      },
      {
        text: `Why is my nose stuffed up (again!!)?\n\nThe frequent sensation that your nose is blocked-up is quite common – there are millions of fellow-sufferers. Possible causes for that ‘stuffy nose’ feeling include: colds or allergies, unique nasal anatomy, or nasal trauma. Whatever the cause, living with a chronically stuffed-up nose can be frustrating!\n\nFortunately, there are new procedures available that offer some sufferers lasting relief without surgery. The NOSE Score helps you determine whether you may be a candidate for one of these procedures by rating the common symptoms:\n• Nasal congestion or stuffiness\n• Nasal blockage or obstruction\n• Trouble breathing through my nose\n• Trouble sleeping\n• Unable to get enough air through my nose during exercise or exertion\n\nTake the NOSE Score Now to find out if you are a candidate.`,
        image: "https://plus.unsplash.com/premium_photo-1661434866462-84351b521865?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        hashtags: ["#StuffyNose", "#NasalObstruction", "#NOSEScore"]
      },
      {
        text: `Do you suffer from nasal airway obstruction? Millions of people do! It makes it difficult to breathe through the nose and gives the sensation of always being blocked-up.\n\n${getDoctorName()} is now offering an effective, non-invasive procedure to help you breathe better. This procedure is performed right in our office, and you can return to normal activities on the same day.`,
        image: "https://images.pexels.com/photos/3951623/pexels-photo-3951623.jpeg?_gl=1*hqoy67*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTMxMTMkbzIkZzAkdDE3NTMzNTMxMTMkajYwJGwwJGgw",
        hashtags: ["#ENTSolution", "#VivAerProcedure", "#BreatheEasy"]
      },
      {
        text: `Have you ever wondered why so many professional athletes like football and soccer players wear nasal strips during games? Swimmers, runners and cyclists are known for using plastic nasal inserts to help keep the nostrils open wide, too.\n\nUse of nasal strips or dilatators is a sign that the breathing problem may be in the nose. Even though many coaches and exercise how-to books specify that we should breathe through the nose when working out, this is next to impossible for people who are chronically blocked-up due to Nasal Airway Obstruction.\n\nNasal Airway Obstruction may be caused by a variety of anatomical issues like nasal wall collapse, deviated septum, enlarged turbinate, or deformity due to trauma.1 Click here to assess the severity of your Nasal Obstruction with the NOSE Score and talk to us about lasting, non-surgical options like the VivAer® procedure.`,
        image: "https://images.unsplash.com/photo-1521475711856-a80d1d3845a4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        hashtags: ["#NasalStrips", "#AthleteBreathing", "#VivAerRelief"]
      },
      {
        text: `One question often asked is: Will nasal strips help me breathe better and stop snoring? Nasal strips are safe and easy to use temporary remedies to help you breathe easier at night or while exercising. They may also decrease how loudly you snore.\n\nThe bad news is that nasal strips do not address the root cause, and the relief is temporary. The good news is that if the strips do provide temporary relief, then the cause of your breathing issues may be Nasal Airway Obstruction.\n\nFor lasting relief, ditch the nasal strips and ask us about the VivAer® procedure.`,
        image: "https://images.pexels.com/photos/5207304/pexels-photo-5207304.jpeg?_gl=1*1xi4kr1*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTMxMTMkbzIkZzEkdDE3NTMzNTM0MTAkajQwJGwwJGgw",
        hashtags: ["#SnoringRelief", "#TemporaryFix", "#VivAerWorks"]
      },
      {
        text: `Do you wake up with a dry mouth? Do you sleep with your mouth open? Do you need nasal strips or dilators just to fall asleep? If you answered yes to any of these questions, you may have nasal obstruction.\n\n${getDoctorName()} is now offering an effective, non-invasive procedure to treat your nasal obstruction and help you breathe better. This procedure is performed right in our office, and you can return to normal activities on the same day.1 Click here to see if you are a candidate.`,
        image: "https://images.pexels.com/photos/7596886/pexels-photo-7596886.jpeg?_gl=1*d4sk4q*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTMxMTMkbzIkZzEkdDE3NTMzNTU2NjkkajIyJGwwJGgw",
        hashtags: ["#DryMouth", "#MouthBreathing", "#NasalTreatment"]
      },
      {
        text: `Nasal blockage can dramatically impact your quality of life.\n\nYou may have tried treating your nasal blockage with ongoing home remedies: Neti Pots, breathing strips, nasal dilators, and sprays. Home remedies never quite fix the problem.\n\nFortunately, there is a new effective option: the VivAer® procedure.\n\nThe VivAer® procedure, performed in our office, does not require any incisions. The inside of your nose is gently treated using temperature-controlled energy with lasting results1, without affecting the outward appearance of your nose.\n\nFind out more about the VivAer® procedure and see if you are a candidate.`,
        image: "https://images.unsplash.com/photo-1568409775525-2b1be62a1aee?w=300&h=350&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        hashtags: ["#NasalBlockage", "#VivAerSolution", "#NoMoreRemedies"]
      },
      {
        text: `How do I determine if my nasal valve is restricted?\nThere’s a simple self-check routine called the Cottle’s Maneuver that can help you learn whether your obstructed breathing is due to nasal valve collapse.\n\nHere’s how to do it:\n1. Place the tips of one or two fingers on your cheeks on each side of your nose.\n2. Press and pull outward very gently to slightly open the nasal valve\n\nIf this helps you inhale more easily through your nose, the obstruction is likely to be in the nasal valve and you should discuss it with ${getDoctorName()}.`,
        image: "https://drvitjhhggcywuepyncx.supabase.co/storage/v1/object/public/logo//Cottle%20Manuever.gif",
        hashtags: ["#CottlesManeuver", "#SelfCheck", "#NasalValveCollapse"]
      },
      {
        text: `Better nasal breathing is the key to better sleep. One easy remedy for sleep interrupted by breathing troubles is to breathe more naturally through your nose.\n\nTwo tips for better nose breathing in bed include1:\n• Position pillows to raise your head higher\n• Use a humidifier in the room where you sleep.\n\nIf you’ve tried these tips and they don’t work for you, your sleeplessness may be caused by a more serious issue, such as nasal airway obstruction.\n\nIf you feel your nasal breathing is obstructed, take this simple NOSE Score to see if you may be a candidate for treatment.`,
        image: "https://images.unsplash.com/photo-1552650272-b8a34e21bc4b?w=600&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        hashtags: ["#SleepTips", "#NoseBreathing", "#SleepBetter"]
      },
      {
        text: `Breathe through your nose – fall asleep faster?!? Are you among the millions of people who can’t seem to fall asleep or stay asleep? Here’s a simple technique for falling asleep that works for thousands. Best of all – it’s free!\n\n4 – 7 – 8 sleep!1\n• Open your mouth and exhale completely. To make sure you’re expelling all the air you can, practice making a whooshing sound as you breathe out.\n• Close your mouth and inhale gently through your nose while mentally counting a slow 1 - 2 - 3 - 4. Aim for a comfortable inflation of the lungs using the belly muscles. If you find your shoulders hunching, relax and try to manage the incoming breath with your belly muscles.\n• Hold the breath for a slow 7 count.\n• Exhale through your mouth while mentally counting to 8. Make the whoosh sound to be sure you’re exhaling completely.\n\nThis is one 4 – 7 – 8 breathing cycle! *Repeat the same 4-step sequence 3 more times.\n\nFor many people, the relaxation and the increased intake of air that take place in these four breath cycles will calm their minds and nourish their blood oxygen so thoroughly that they fall asleep before the cycles are complete!\n\nHaving trouble breathing through your nose? Click here to learn about a new treatment that might help.`,
        image: "https://images.unsplash.com/photo-1495197359483-d092478c170a?w=600&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        hashtags: ["#478Breathing", "#SleepHack", "#NasalHealth"]
      },
      {
        text: `Do you find yourself dozing off at work or school – or worse, behind the wheel at traffic lights? Is it especially difficult to get up and get going in the morning, but still hard to fall asleep at bedtime? If you answered “yes” to any of these questions, click here to learn about a new treatment that might help.`,
        image: "https://images.unsplash.com/photo-1478719050108-41b67a7bc956?w=600&h=300&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        hashtags: ["#FatigueFix", "#SleepDisruption", "#VivAerTreatment"]
      },
      {
        text: `Snoring is bad for your sleep, harmful to your health, and rough on relationships!\nWhat can you do about snoring?\nThere are many home remedies for snoring, depending on the cause. These can vary between losing weight, changing pillows, or altering your sleeping position.\nIf your snoring is constant, or loud enough to affect your relationship with your sleeping partner, or if you experience disruptive consequences in your sleeping and waking life, ask ${getDoctorName()} about treatment options.`,
        image: "https://images.unsplash.com/photo-1512548438457-4c9584d3766b?w=600&h=300&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        hashtags: ["#StopSnoring", "#SleepSolutions", "#ENTSupport"]
      },
      {
        text: `6 Ways to Stop Snoring:\n\n• Don’t sleep on your back\n• Don’t drink alcohol before bedtime\n• Change your pillows\n• Open the inside of your nasal passages with home remedies\n• Open the outside of your nose with strips or dilators\n• Lose Weight\n\nWork your way through this list to see if they work for you. If you have tried just about everything but are still being kicked out of the bedroom, you should see ${getDoctorName()}.\nLoud and persistent snoring may be a sign of a more serious health problem, like nasal obstruction.`,
        image: "https://drvitjhhggcywuepyncx.supabase.co/storage/v1/object/public/logo//Screenshot%202025-07-24%20at%202.08.13%20PM.png",
        hashtags: ["#SnoringHelp", "#SleepTips", "#ENTCare"]
      },
      {
        text:  `What an amazing nose job! But can you breathe through your nose? Many people complain of the inability to breathe through their nose after rhinoplasty. While the new look helps your self- confidence, the blocked nose could ruin your sleep and stamina.\n\nNasal obstruction is common after a rhinoplasty (or nose job).\nLuckily, ${getDoctorName()} is now offering an effective, non- invasive procedure to help you breathe better again. This procedure is performed right in our office, and you can return to normal activities on the same day.`,
        image: "https://images.pexels.com/photos/792994/pexels-photo-792994.jpeg?_gl=1*udjdjs*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNDU4MTUkbzEkZzEkdDE3NTMzNDYxODUkajMzJGwwJGgw",
        hashtags: ["#Rhinoplasty", "#PostSurgeryBreathing", "#ENTRelief"]
      },
      {
        text: `Did you break your nose playing sports in high school? It may be all healed up now, and after so many years you probably don’t even think about it. That nose injury could have blocked your nose, and you’ve been coping with it. Nose injuries often cause nasal obstruction in later years and could ruin your sleep and stamina.\n\nLuckily, ${getDoctorName()} is now offering an effective, non-invasive procedure to help you breathe better again. This procedure is performed right in our office, and you can return to normal activities on the same day`,
        image: "https://images.pexels.com/photos/1571582/forbidden-person-nose-people-1571582.jpeg?_gl=1*f04jmi*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNDU4MTUkbzEkZzEkdDE3NTMzNDU4NTMkajIyJGwwJGgw",
        hashtags: ["#NasalInjury", "#OldInjuryFix", "#BreatheBetter"]
      }
    ],
    SNOT: [
      {
        text: `The \"SNOT quiz\" refers to the Sino-Nasal Outcome Test (SNOT-22), a questionnaire used to assess the severity of symptoms related to rhinosinusitis (inflammation of the sinuses and nasal passages) and its impact on a person's quality of life. It helps determine the extent to which sinus problems affect various aspects of a person's life, including physical symptoms, functional limitations, and emotional well-being.`,
        image: "https://images.pexels.com/photos/5212350/pexels-photo-5212350.jpeg?_gl=1*xlzw4y*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTg0ODMkbzMkZzEkdDE3NTMzNTg1MDQkajM5JGwwJGgw",
        hashtags: ["#SNOT22", "#SinusHealth", "#NasalCare", "#ENTAwareness", "#Rhinosinusitis", "#BreatheBetter"]
      },
      {
        text: `Did you know? The SNOT-22 quiz is one of the most trusted tools doctors use to measure how sinus issues are impacting your daily life — not just physically, but emotionally too.`,
        image: "https://images.pexels.com/photos/5979735/pexels-photo-5979735.jpeg?_gl=1*1wm4nec*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTg0ODMkbzMkZzEkdDE3NTMzNTg1MzMkajEwJGwwJGgw",
        hashtags: ["#SNOT22","#SinusAwareness", "#ENTCheck", "#HealthQuiz", "#NasalHealth", "#ChronicSinusitis"]
      },
      {
        text: `SNOT-22 goes beyond just “how blocked your nose feels.” It looks at sleep, fatigue, headaches, and emotional strain — a complete 360 on how sinuses affect you.`,
        image: "https://images.pexels.com/photos/3807629/pexels-photo-3807629.jpeg?_gl=1*brchvm*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTg0ODMkbzMkZzEkdDE3NTMzNTg4MTEkajQ4JGwwJGgw",
        hashtags: ["#SNOT22Explained", "#SinusSupport", "#ChronicRhinosinusitis", "#NasalObstruction", "#ENTQuiz"]
      },
      {
        text: `Struggling with nasal congestion or facial pain? The SNOT-22 questionnaire helps map exactly how severe your symptoms are and how much they disrupt your life.`,
        image: "https://images.pexels.com/photos/7195082/pexels-photo-7195082.jpeg?_gl=1*1ioxxi6*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTg0ODMkbzMkZzEkdDE3NTMzNTg4NDckajEyJGwwJGgw",
        hashtags: ["#SNOT22", "#SinusCheck" ,"#BreatheEasy" ,"#ENTHealth", "#SinusSymptoms"]
      },
      {
        text: `Doctors often use the SNOT-22 before and after treatment to see how much your condition has improved. It's a progress tracker — but for your nose.`,
        image: "https://images.pexels.com/photos/4428994/pexels-photo-4428994.jpeg?_gl=1*1dzmf84*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTg0ODMkbzMkZzEkdDE3NTMzNTg5NTEkajUxJGwwJGgw",
        hashtags: ["#ENTCare", "#SNOT22Tracker", "#SinusRelief", "#HealthMonitor", "#ENTFollowUp"]
      },
      {
        text: `If you deal with sinus pressure, post-nasal drip, or chronic stuffiness — the SNOT-22 might be your first step to getting the right help.`,
        image: "https://images.pexels.com/photos/11743792/pexels-photo-11743792.jpeg?_gl=1*uaemzr*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTg0ODMkbzMkZzEkdDE3NTMzNTkwMDkkajUzJGwwJGgw",
        hashtags: ["#KnowYourSymptoms", "#SNOT22", "#ENTAwareness", "#BreatheFreely", "#NasalHealthMatters"]
      },
      {
        text: `The SNOT-22 isn’t about mucus — it’s about you. It helps your doctor understand how nasal issues are affecting your whole life.`,
        image: "https://images.pexels.com/photos/5858852/pexels-photo-5858852.jpeg?_gl=1*1yszbie*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTg0ODMkbzMkZzEkdDE3NTMzNTkxNTYkajMwJGwwJGgw",
        hashtags: ["#SNOT22Facts", "#ENTSupport", "#QualityOfLifeMatters", "#SinusIssues", "#HolisticENTCare"]
      },
      {
        text: `Fatigue. Sleep troubles. Ear fullness. The SNOT-22 captures symptoms most people don’t even realize are connected to sinus issues.`,
        image: "https://images.pexels.com/photos/271897/pexels-photo-271897.jpeg?_gl=1*u1tqh3*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTg0ODMkbzMkZzEkdDE3NTMzNTkzMTIkajE1JGwwJGgw",
        hashtags: ["#SNOT22Awareness", "#SinusCheckIn", "#ENTQuiz", "#ChronicSinusCare", "#HealthEducation"]
      },
      {
        text: `Want to track your sinus health better? SNOT-22 gives a numeric score that helps you and your doctor monitor your symptoms over time.`,
        image: "https://images.pexels.com/photos/5207297/pexels-photo-5207297.jpeg?_gl=1*1hags9f*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTg0ODMkbzMkZzEkdDE3NTMzNTk3MTYkajM4JGwwJGgw",
        hashtags: ["#TrackYourHealth", "#SNOT22Score", "#ENTDiagnostics", "#ChronicSinusRelief", "#BreatheRight"]
      },
      {
        text: `The SNOT-22 is often used in research to measure how effective a surgery or medicine is. It's not just a quiz — it's scientific gold.`,
        image: "https://images.pexels.com/photos/208512/pexels-photo-208512.jpeg?_gl=1*19wfmec*_ga*MTU3NDg1NDIxMi4xNzUzMzQ1ODE2*_ga_8JE65Q40S6*czE3NTMzNTg0ODMkbzMkZzEkdDE3NTMzNTk3MzgkajE2JGwwJGgw",
        hashtags: ["#SNOT22InResearch", "#EvidenceBasedENT", "#SinusOutcomes", "#ENTScience", "#SinusCareMatters"]
      }
    ],
    TNSS: [
      {
        text: `Is your nose constantly running and you can’t find relief? You may have chronic rhinitis. Over-the-counter pills and sprays may not be very helpful in controlling your symptoms and don’t usually offer a lasting solution.\n\nToday, there is a better option: the RhinAer® procedure. ${getDoctorName()} now offers this new non-invasive treatment right in our office, and patients may return to normal activities the same day.\n\nYou may finally put away the medications and start enjoying life again. Visit our website for more details to see if you are a candidate.`,
        image: "https://cdn.pixabay.com/photo/2018/09/13/02/17/pills-3673645_1280.jpg",
        hashtags: ["#ChronicRhinitis", "#RunnyNose", "#RhinAer"]
      },
      {
        text: `Do you use a lot of decongestant sprays or drops? Repetitive use of decongestant sprays may induce rebound nasalcongestion after withdrawal. Extensive use may cause the mucosa to become red and inflamed with occasional bleeding. Discontinuation of the spray resolves the problem, although many patients find this process difficult. If your symptoms worsen even with the help of decongestants, you may be at risk for a more serious issue.\n\nIf you cannot find relief from your runny, stuffy nose despite the use of nasal sprays, give us a call to book a telemed visit.`,
        image: "https://cdn.pixabay.com/photo/2017/03/08/20/08/nasal-drops-2127686_1280.jpg",
        hashtags: ["#NasalSpray", "#Decongestant", "#Rhinitis"]
      },
      {
        text: `Do allergies worsen your runny nose? It’s not always possible to completely avoid allergens, but you can minimize your exposure with the following tips: \n\n• Keep windows closed when pollen counts are high.\n• Wear a mask when mowing the lawn, doing garden work, or cleaning the house.\n• Purchase an air purifier, use a vacuum with a HEPA filter, and replace often.\n• Purchase a dust-mite proof pillow.\n• Wash your bedding weekly in hot water.\n• Bathe and groom pets frequently.\n• Take showers after being outside.\n• Avoid secondhand smoke.\n\nIf your runny nose continues regardless of the pollen levels, you may have chronic rhinitis. ${getDoctorName()} now offers a new non-invasive treatment to give you lasting relief from your runny, stuffy nose. The RhinAer® procedure is performed right in our office, and patients return to normal activities the same day.\n\nYou may finally put away the tissues and start enjoying life again. Visit our website for more details to see if you are a candidate.`,
        image: "https://as1.ftcdn.net/jpg/03/28/74/48/1000_F_328744890_SipJxoVMZagusHnSikxho1mtkpAcKUbd.jpg",
        hashtags: ["#Allergies", "#RunnyNose", "#RhinAer"]
      },
      {
        text: `Have you had an allergy skin test? Many people with nonallergic rhinitis test negative, however many experience localized allergic reactions in nasal passages.\n\nEven though it can be hard to pin down the exact cause of your symptoms, some triggers include cold weather or extreme temperature changes, eating spicy foods, exposure to chemicals, or other irritating substances like air pollution. Try keeping a journal of your symptoms to help spot your triggers.\n\nIf you cannot find relief from your runny, stuffy nose, give us a call or book a telemed visit.`,
        image: "https://media.istockphoto.com/id/1168122199/photo/senior-patient-discusses-pain-with-her-doctor-during-video-appointment.jpg?s=1024x1024&w=is&k=20&c=S8FcJRKhVG_uaPGtmz0K00C8dbRUUpEHRszTuKXv3rk=",
        hashtags: ["#AllergySymptoms", "#NonAllergicRhinitis", "#TriggerTracking"]
      },
      {
        text: `Do you experience year-round allergy symptoms regardless of allergens? You may have mixed rhinitis. The most common allergy medications provide limited relief addressing only some symptoms of mixed rhinitis.\n\n${getDoctorName()} now offers a new non-invasive treatment to give you lasting relief from your runny, stuffy nose. The RhinAer® procedure is performed right in our office, and patients return to normal activities the same day.\n\nYou may finally put away the tissues and start enjoying life again. Visit our website for more details to see if you are a candidate.`,
        image: "https://as2.ftcdn.net/jpg/01/98/58/21/1000_F_198582198_tpr4qDibNxwVkdsHMFLtha7PNzjwmCCV.jpg",
        hashtags: ["#MixedRhinitis", "#AllergyRelief", "#RhinAer"]
      },
      {
        text: `Did you know there are different types of nonallergic rhinitis? Infectious rhinitis, or viral rhinitis, is caused by an infection such as the common cold or flu. The lining of the nose and throat become inflamed when a virus attacks the area. Inflammation triggers mucus production, and this causes sneezing and a runny nose.\n\nClick to learn more about the different types of rhinitis.`,
        image: "https://plus.unsplash.com/premium_photo-1661589660012-70d522ae67ac?w=600&h=300&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        hashtags: ["#InfectiousRhinitis", "#ColdSymptoms", "#ViralRhinitis"]
      },
      {
        text: `Did you know there are different types of nonallergic rhinitis? One type, vasomotor rhinitis, presents when the blood vessels in the nose are too sensitive and there is abnormal nerve control of the blood vessels in the nose. This leads to inflammation. Triggers include chemical irritants, perfumes, paint fumes, smoke, changes in humidity, a drop in temperature, consumption of alcohol, spicy foods, and mental stress.\n\nVisit our website to learn more about the different types of rhinitis.`,
        image: "https://media.istockphoto.com/id/1221345815/vector/sneezing-man-spring-allergy-symptom-sickness-runny-itchy-and-sneeze-cough-and-lacrimation.jpg?s=1024x1024&w=is&k=20&c=cHl2Cg9XjlkYCeAwqe9qQ__Gb97FAmf4rsD4r67YzHY=",
        hashtags: ["#VasomotorRhinitis", "#NasalTriggers", "#NonAllergicRhinitis"]
      },
      {
        text: `Post-nasal drip sucks! It’s always on your mind, and when it happens, it could disrupt your day. If you suffer from mucus buildup in your throat all year long, you may have chronic rhinitis.\n\n${getDoctorName()} now offers a new non-invasive treatment to give you lasting relief from post-nasal drip and chronic rhinitis. The RhinAer® procedure is performed right in our office, and patients return to normal activities the same day.\n\nYou may finally have a clear throat and start enjoying life again. Visit our website for more details to see if you are a candidate.`,
        image: "https://as2.ftcdn.net/jpg/03/30/73/79/1000_F_330737940_1yVId7gT3g8xr9hP3bwSlphUO4WRwAdo.jpg",
        hashtags: ["#PostNasalDrip", "#ChronicRhinitis", "#RhinAer"]
      },
      {
        text: `Don’t you hate that gargling mucus sound from the back of your throat, especially in public? You are too embarrassed to clear your throat in front of others, but you can’t swallow it either. Now you can put an end to it!\n\n${getDoctorName()} now offers a new non-invasive procedure to give you lasting relief from your post nasal drip. The RhinAer® procedure is performed right in our office, and patients return to normal activities the same day.\n\nYou may finally have a clear throat and start enjoying life again. Visit our website for more details to see if you are a candidate.`,
        image: "https://as2.ftcdn.net/jpg/03/57/41/73/1000_F_357417334_sPcKhWUFa2M54ye9dIRTtjlVeGHTyw8g.jpg",
        hashtags: ["#PostNasalDripRelief", "#ThroatClearing", "#RhinAer"]
      },
      {
        text: `Did you know that smoking is harmful to more than just your lungs? If you have a constant runny, stuffy nose and also smoke, chances are smoking is making your runny nose worse or possibly causing it altogether. Cigarette smoke contains scores of different compounds and particulates which can cause both allergic or nonallergic rhinitis. If individuals smoke and have rhinitis, they should consider quitting their cigarettes for at least a few days to see if their condition improves. If it does, a permanent change may be needed.\n\nIf you cannot find relief from your runny, stuffy nose, give us a call to book a telemed visit.`,
        image: "https://images.unsplash.com/photo-1649430332289-65ee9fa56a4d?w=600&h=300&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        hashtags: ["#SmokingRisks", "#RunnyNose", "#QuitSmoking"]
      },
      {
        text: `Does your nose drip into your mask? That’s an uncomfortable feeling. What do you do? You want to protect others, but your nose is constantly running. You no longer have to put up with a runny nose!\n\n${getDoctorName()} now offers a new non-invasive treatment to give you lasting relief from your constant runny nose. The RhinAer® procedure is performed right in our office, and patients return to normal activities the same day.\n\nVisit our website for more details to see if you are a candidate.`,
        image: "https://as2.ftcdn.net/v2/jpg/03/29/04/95/1000_F_329049525_82072Rq4bxBGATCQfGeq18dtEvNVkozj.jpg",
        hashtags: ["#RunnyNoseFix", "#MaskProblems", "#RhinAer"]
      }
    ]
  };

  const platforms = {
    instagram: { name: 'Instagram', limit: 2200, aspect: 'square' },
    facebook: { name: 'Facebook', limit: 63206, aspect: 'landscape' },
    twitter: { name: 'Twitter/X', limit: 280, aspect: 'landscape' },
    linkedin: { name: 'LinkedIn', limit: 3000, aspect: 'landscape' }
  };

  const categories = {
    NOSE: 'NOSE',
    SNOT: 'SNOT',
    TNSS: 'TNSS'
  };

  const generatePost = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      const posts = samplePosts[selectedCategory];
      const randomPost = posts[Math.floor(Math.random() * posts.length)];
      setCurrentPost(randomPost);
      setIsGenerating(false);
    }, 2000);
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getCharacterCount = (text) => text ? text.length : 0;
  const isOverLimit = (text) => getCharacterCount(text) > platforms[selectedPlatform].limit;

  const calendarDays = generateCalendarDays();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Social Media Post Creator
          </h1>
          <p className="text-gray-600">
            Create engaging social media content for your ENT practice
          </p>
        </div>

        {/* Social Media Calendar Section */}
        <div className="mb-10">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 justify-center">
              <Calendar className="text-blue-500" size={24} />
              Social Media Calendar
            </h2>
            
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateCalendar(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={currentCalendarDate.getMonth() === new Date().getMonth() && 
                         currentCalendarDate.getFullYear() === new Date().getFullYear()}
              >
                <ChevronLeft size={20} />
              </button>
              
              <h3 className="text-xl font-semibold">
                {monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
              </h3>
              
              <button
                onClick={() => navigateCalendar(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {/* Day headers */}
              {dayNames.map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((dayInfo, index) => (
                <div
                  key={index}
                  className={`
                    min-h-24 border rounded-lg p-2 transition-all duration-200
                    ${!dayInfo.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                    ${dayInfo.isPast ? 'opacity-50 cursor-not-allowed' : ''}
                    ${dayInfo.event && !dayInfo.isPast ? 'cursor-pointer hover:shadow-md border-blue-200' : 'border-gray-200'}
                    ${dayInfo.event && !dayInfo.isPast ? 'hover:bg-blue-50' : ''}
                  `}
                  onClick={() => handleDayClick(dayInfo)}
                >
                  <div className="font-semibold text-sm mb-1">
                    {dayInfo.day}
                  </div>
                  
                  {dayInfo.event && (
                    <div className="space-y-1">
                      <div className={`
                        text-xs px-2 py-1 rounded-full text-center font-medium
                        ${dayInfo.post ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-orange-100 text-orange-800 border border-orange-200'}
                      `}>
                        {dayInfo.event.occasion.length > 15 
                          ? dayInfo.event.occasion.substring(0, 15) + '...' 
                          : dayInfo.event.occasion}
                      </div>
                      
                      {dayInfo.post && (
                        <div className="h-2 bg-green-400 rounded-full"></div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
                <span>Event (No Post)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span>Event (Post Created)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-2 bg-green-400 rounded-full"></div>
                <span>Post Scheduled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Dialog */}
        <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {selectedEvent?.occasion}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                {selectedEventDate?.toLocaleDateString()} - {selectedEvent?.relevance}
              </p>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Image Placeholder */}
              <div className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Image size={48} className="mx-auto mb-2" />
                  <p>Image Placeholder</p>
                  <p className="text-xs">Upload through database</p>
                </div>
              </div>
              
              {/* Post Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Social Media Post Content
                </label>
                <textarea
                  className="w-full border rounded-lg p-3 min-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={calendarPostText}
                  onChange={e => setCalendarPostText(e.target.value)}
                  placeholder="Enter your social media post content..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  Character count: {calendarPostText.length}
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <button
                onClick={generateEventPost}
                disabled={calendarPostLoading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {calendarPostLoading ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <Sparkles size={16} />
                )}
                {calendarPostLoading ? 'Generating...' : 'Generate Post'}
              </button>
              
              <button
                onClick={handleSaveCalendarPost}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Post
              </button>
              
              <button
                onClick={() => setCalendarDialogOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Sparkles className="mr-2 text-blue-500" size={20} />
                Generate Content
              </h2>

              {/* Platform Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Social Media Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(platforms).map(([key, platform]) => (
                    <option key={key} value={key}>
                      {platform.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={generatePost}
                disabled={isGenerating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={16} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2" size={16} />
                    Generate Post
                  </>
                )}
              </button>

              {/* Template Variables */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Template Variables
                </h3>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Doctor's name: {getDoctorName()}</p>
                  <p>Clinic name: {getClinicName()}</p>
                  <p>Contact number: {getDoctorPhone()}</p>
                  <p>Clinic address: {getDoctorAddress()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Eye className="mr-2 text-green-500" size={20} />
                Post Preview
              </h2>

              {currentPost ? (
                <div className="space-y-6">
                  {/* Post Content */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">
                        {platforms[selectedPlatform].name} Post
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          isOverLimit(currentPost.text) 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {getCharacterCount(currentPost.text)} / {platforms[selectedPlatform].limit}
                        </span>
                        <button
                          onClick={() => copyToClipboard(currentPost.text, 'text')}
                          className="text-gray-500 hover:text-blue-500 transition-colors"
                        >
                          {copiedIndex === 'text' ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Image Preview */}
                    <div className="mb-4">
                      <img
                        src={currentPost.image}
                        alt="Post preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>

                    {/* Text Content */}
                    <div className="mb-4">
                      <textarea
                        value={currentPost.text}
                        onChange={(e) => setCurrentPost({...currentPost, text: e.target.value})}
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Hashtags */}
                    <div className="flex flex-wrap gap-2">
                      {currentPost.hashtags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button
                      onClick={generatePost}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <RefreshCw className="mr-2" size={16} />
                      Generate New
                    </button>
                    <button
                      onClick={() => copyToClipboard(currentPost.text, 'full')}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {copiedIndex === 'full' ? (
                        <Check className="mr-2" size={16} />
                      ) : (
                        <Copy className="mr-2" size={16} />
                      )}
                      Copy Content
                    </button>
                    <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                      <Download className="mr-2" size={16} />
                      Download Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Image className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-500 mb-4">
                    No post generated yet. Click "Generate Post" to create your first social media post.
                  </p>
                  <button
                    onClick={generatePost}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>

            {/* Sample Posts Gallery */}
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <h2 className='text-2xl font-bold mb-4 text-center'>Sample Posts</h2>
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                {Object.entries(categories).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-4 py-2 rounded-lg font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${selectedCategory === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              <h3 className="text-lg font-semibold mb-4">{categories[selectedCategory]}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {samplePosts[selectedCategory].map((post, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                       onClick={() => setCurrentPost(post)}>
                    <img
                      src={post.image}
                      alt={`Sample post ${index + 1}`}
                      className="w-full h-44 object-cover rounded-lg mb-3"
                    />
                    <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                      {post.text.substring(0, 100)}...
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {post.hashtags.slice(0, 2).map((tag, tagIndex) => (
                        <span key={tagIndex} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaCreator;