import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatedSidebar } from '@/components/dashboard/AnimatedSidebar';
import { QuizManagementPage } from '@/components/dashboard/QuizManagementPage';
import { TrendsPage } from '@/components/dashboard/TrendsPage';
import { LeadsPage } from '@/components/dashboard/LeadsPage';
import { ProfilePage } from '@/components/dashboard/ProfilePage';
import { ConfigurationPage } from '@/components/dashboard/ConfigurationPage';
import { SettingsPage } from '@/components/dashboard/SettingsPage';
import { SupportPage } from '@/components/dashboard/SupportPage';
import { SocialIntegrationsPage } from '@/components/dashboard/SocialIntegrationsPage';
import { SocialMediaManager } from '@/components/dashboard/SocialMediaManager';
import { AutomationPage } from '@/components/dashboard/AutomationPage';
import { SymptomChecker } from '@/components/dashboard/SymptomChecker';
import { EmailConfigurationPage } from '@/components/dashboard/EmailConfigurationPage';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PageLoader } from '@/components/ui/PageLoader';
import { AnimatePresence, motion } from 'framer-motion';
import SocialMediaCreator from '@/components/dashboard/SocialMediaCreator';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreateDoctorProfile } from '@/lib/profileUtils';

export default function PortalPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [tabLoading, setTabLoading] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessRevoked, setAccessRevoked] = useState(false);

  // Check for tab parameter in URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setCurrentPage(tab);
    }
  }, [searchParams]);

  // Check doctor access control - simplified approach
  const checkDoctorAccess = async (userId: string) => {
    try {
      setAccessLoading(true);
      console.log('Checking access for user:', userId);
      
      // Check for doctor profiles (includes both doctors and team members)
      const { data: doctorProfiles, error: doctorError } = await supabase
        .from('doctor_profiles')
        .select('id, access_control, first_name, last_name, email, is_staff, is_manager, doctor_id_clinic')
        .eq('user_id', userId);

      if (doctorError) {
        console.error('Error checking doctor profiles:', doctorError);
      }

      console.log('Doctor profiles found:', doctorProfiles);
      if (doctorProfiles && doctorProfiles.length > 0) {
        const profilesWithAccess = doctorProfiles.filter(profile => profile.access_control === true);
        
        if (profilesWithAccess.length > 0) {
          console.log('Access granted via doctor profile!');
          console.log('User type:', profilesWithAccess[0].is_staff ? 'Staff' : profilesWithAccess[0].is_manager ? 'Manager' : 'Doctor');
          setHasAccess(true);
          return;
        }
      }

      // If no doctor profile found, create one for regular users
      console.log('No doctor profile found, creating one for regular user...');
      
      // Get user info from auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        console.error('Error getting auth user:', authError);
        setHasAccess(false);
        setAccessRevoked(true);
        toast.error('Error getting user information. Please try again.');
        return;
      }

      // Use the existing getOrCreateDoctorProfile function to avoid conflicts
      const profile = await getOrCreateDoctorProfile(userId, authUser.email);
      
      if (!profile) {
        console.error('Failed to create doctor profile');
        setHasAccess(false);
        setAccessRevoked(true);
        toast.error('Failed to set up your account. Please contact support.');
        return;
      }

      console.log('Doctor profile created for regular user');
      setHasAccess(true);
      toast.success('Welcome! Your account has been set up.');
      
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
      setAccessRevoked(true);
      toast.error('Error checking access. Please try again.');
    } finally {
      setAccessLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !hasCheckedAuth) {
      setHasCheckedAuth(true);
      if (!user) {
        console.log('No user found, redirecting to auth');
        navigate('/auth', { replace: true });
      } else {
        checkDoctorAccess(user.id);
      }
    }
  }, [user, loading, navigate, hasCheckedAuth]);

  useEffect(() => {
    if (!user || !hasAccess || accessRevoked) return;
    const interval = setInterval(async () => {
      console.log('Performing periodic access check...');
      await checkDoctorAccess(user.id);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, hasAccess, accessRevoked]);

  const handleSignOut = async () => {
    try {
      console.log('Starting sign out process...');
      await signOut();
      console.log('Sign out completed successfully');
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Helper for main menu tab changes
  const handleTabChange = (page: string) => {
    setTabLoading(true);
    setCurrentPage(page);
  };

  // Set tabLoading to false after the page content is loaded
  useEffect(() => {
    if (!tabLoading) return;
    // Wait for the next tick to ensure renderCurrentPage is mounted
    const timeout = setTimeout(() => setTabLoading(false), 100);
    return () => clearTimeout(timeout);
  }, [currentPage, tabLoading]);
  if (accessRevoked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You do not have access to the portal. Please contact your administrator to request access.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/auth')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (loading || !hasCheckedAuth || accessLoading || hasAccess === null) {
    return <PageLoader loading={true} />;
  }
  if (!user || hasAccess !== true || accessRevoked) {
    console.log('Access denied in render - User:', !!user, 'HasAccess:', hasAccess, 'AccessRevoked:', accessRevoked);
    return null;
  }
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <LeadsPage />;
      case 'analytics':
        return <TrendsPage />;
      case 'trends':
        return <TrendsPage />;
      case 'quizzes':
        return <QuizManagementPage />;
      case 'automation':
        return <AutomationPage />;
      case 'email-config':
        return <EmailConfigurationPage />;
      case 'profile':
        return <ProfilePage />;
      case 'configuration':
        return <ConfigurationPage />;
      case 'settings':
        return <SettingsPage />;
      case 'support':
        return <SupportPage />;
      case 'social-media':
        return <SocialMediaManager />;
      default:
        return <LeadsPage />;
    }
  };

  const teal = '#0f766e';

  return (
    <div className="flex h-screen bg-gray-50">
      <AnimatedSidebar
        currentPage={currentPage}
        onPageChange={handleTabChange}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 overflow-auto relative bg-gradient-to-br from-[#fef7f0] via-[#f8fafc] to-[#f0f4f9]">
        <DashboardHeader />
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="min-h-[calc(100vh-120px)]"
            >
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 bg-white px-6 py-4">
                  <h1 className="text-xl font-bold" style={{ color: teal }}>
                    {currentPage === 'dashboard' && 'Dashboard'}
                    {(currentPage === 'analytics' || currentPage === 'trends') && 'Analytics & Trends'}
                    {currentPage === 'quizzes' && 'Assessments'}
                    {currentPage === 'schedule' && 'Schedule'}
                    {currentPage === 'social' && 'Social Integrations'}
                    {currentPage === 'social-media' && 'Social Media Manager'}
                    {currentPage === 'automation' && 'Automation'}
                    {currentPage === 'marketing' && 'Marketing Recommendations'}
                    {currentPage === 'symptom-checker' && 'Symptom Checker'}
                    {currentPage === 'email' && 'Email Automation'}
                    {currentPage === 'profile' && 'Profile'}
                    {currentPage === 'configuration' && 'Configuration'}
                    {currentPage === 'settings' && 'Settings'}
                    {currentPage === 'support' && 'Support'}
                    {currentPage === 'contacts' && 'Contacts'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentPage === 'dashboard' && 'Overview of your leads and recent activity'}
                    {(currentPage === 'analytics' || currentPage === 'trends') && 'Performance metrics, insights, and data trends'}
                    {currentPage === 'quizzes' && 'Manage your assessments and quizzes'}
                    {currentPage === 'schedule' && 'View and manage your appointments'}
                    {currentPage === 'social' && 'Connect and manage your social media accounts'}
                    {currentPage === 'social-media' && 'Create, schedule, and manage your social media posts'}
                    {currentPage === 'automation' && 'Create and manage automated communications'}
                    {currentPage === 'marketing' && 'Daily content ideas and marketing strategies'}
                    {currentPage === 'symptom-checker' && 'Conversational assessment tool'}
                    {currentPage === 'email' && 'Connect email accounts and send quiz invitations'}
                    {currentPage === 'profile' && 'Manage your account information'}
                    {currentPage === 'configuration' && 'Manage your clinic information, locations, physicians, and assets'}
                    {currentPage === 'settings' && 'Configure your preferences'}
                    {currentPage === 'support' && 'Get help and support'}
                    {currentPage === 'contacts' && 'Manage your contacts'}
                  </p>
                </div>
                <div className="p-6">
                  {renderCurrentPage()}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}