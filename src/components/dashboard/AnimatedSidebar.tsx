import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Home,
  BarChart,
  ListChecks,
  Settings,
  HelpCircle,
  User,
  Calendar,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Building,
  Zap,
  Megaphone,
  Brain,
  Users,
  TestTube,
  Mail,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedSidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onSignOut: () => Promise<void>;
}

const mainMenuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home size={22} />,
    description: 'Overview and leads'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart size={22} />,
    description: 'Performance metrics'
  },
  {
    id: 'quizzes',
    label: 'Assessments',
    icon: <ListChecks size={22} />,
    description: 'Manage quizzes'
  },
  {
    id: 'social-media',
    label: 'Social Media',
    icon: <Share2 size={22} />,
    description: 'Manage social posts'
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: <Zap size={22} />,
    description: 'Automated workflows'
  },
  {
    id: 'email-config',
    label: 'Manage Emails',
    icon: <Mail size={22} />,
    description: 'Configure email settings'
  },
];

const bottomMenuItems = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <UserCircle size={22} />,
    description: 'Account settings'
  },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: <Building size={22} />,
    description: 'Clinic settings'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={22} />,
    description: 'Preferences'
  },
  {
    id: 'support',
    label: 'Support',
    icon: <HelpCircle size={22} />,
    description: 'Help & support'
  }
];

export const AnimatedSidebar: React.FC<AnimatedSidebarProps> = ({ currentPage, onPageChange, onSignOut }) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isFullyExpanded, setIsFullyExpanded] = useState(true);
  const [isTeamMember, setIsTeamMember] = useState(false);

  useEffect(() => {
    if (user) {
      checkTeamMemberStatus();
    }
  }, [user]);

  const checkTeamMemberStatus = async () => {
    if (!user) return;
    
    try {
      const { data: userProfiles, error } = await supabase
        .from('doctor_profiles')
        .select('is_staff, is_manager')
        .eq('user_id', user.id)
        .single();

      if (!error && userProfiles) {
        setIsTeamMember(userProfiles.is_staff || userProfiles.is_manager);
      }
    } catch (error) {
      console.error('Error checking team member status:', error);
    }
  };

  const handleAnimationComplete = (definition: any) => {
    if (definition.width === 256) {
      setIsFullyExpanded(true);
    } else {
      setIsFullyExpanded(false);
    }
  };
  const getFilteredMainMenuItems = () => {
    if (isTeamMember) {
      // Remove integrations for team members
      return mainMenuItems.filter(item => 
        item.id !== 'integrations' && item.id !== 'automation'
      );
    }
    return mainMenuItems;
  };
  const getFilteredBottomMenuItems = () => {
    if (isTeamMember) {
      return bottomMenuItems.filter(item => 
        item.id !== 'configuration'
      );
    }
    return bottomMenuItems;
  };

  const renderMenuItem = (item: any) => (
    <button
      key={item.id}
      className={cn(
        'flex items-center w-full rounded-lg transition-all duration-200 px-3 py-2 mb-1',
        currentPage === item.id
          ? 'bg-gradient-to-r from-[#FF6B35] to-[#0E7C9D] text-white shadow-lg'
          : 'hover:bg-gray-50 text-gray-700 dark:hover:bg-neutral-700 dark:text-gray-200',
        isCollapsed ? 'justify-center' : 'justify-start'
      )}
      onClick={() => {
        onPageChange(item.id);
        setMobileOpen(false);
      }}
      title={isCollapsed ? item.label : undefined}
    >
      <span className="mr-0.5 flex-shrink-0">{item.icon}</span>
      <AnimatePresence>
        {isFullyExpanded && !isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="ml-3 text-base font-medium text-left"
          >
            {item.label}
            <div className="text-xs text-gray-400 font-normal leading-tight">{item.description}</div>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className={cn(
          'hidden md:flex flex-col h-full bg-gray-50 dark:bg-neutral-900 border-r border-gray-100 dark:border-neutral-800 shadow-sm z-30',
          isCollapsed ? 'w-16' : 'w-64',
          'transition-all duration-100'
        )}
        animate={{ width: isCollapsed ? 64 : 256, transition: { duration: 0.12 } }}
        onAnimationComplete={handleAnimationComplete}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        {/* Logo and Collapse Button */}
        <div className="p-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          {(isFullyExpanded && !isCollapsed) && (
            <div className="flex flex-col items-start">
              <img src="/patient-pathway-logo.jpeg" alt="Patient Pathway Logo" className="w-10 h-10 object-contain mb-1" />
              <h2 className="text-lg font-bold bg-gradient-to-r from-[#FF6B35] to-[#0E7C9D] bg-clip-text text-transparent">Patient Pathway</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ENT Medical Platform</p>
            </div>
          )}
        </div>
        {/* Main Navigation */}
        <div className={cn('flex-1 overflow-y-auto py-4', isCollapsed ? 'px-1' : 'px-3')}>{getFilteredMainMenuItems().map(renderMenuItem)}</div>
        {/* Bottom Navigation */}
        <div className={cn('border-t border-gray-100 dark:border-neutral-800 py-2', isCollapsed ? 'px-1' : 'px-3')}>{getFilteredBottomMenuItems().map(renderMenuItem)}</div>
        {/* Sign Out */}
        <div className={cn('p-4 border-t border-gray-100 dark:border-neutral-800', isCollapsed ? 'px-1' : 'px-4')}>
          <button
            className={cn(
              'flex items-center w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 transition-all duration-200 rounded',
              isCollapsed ? 'justify-center p-2' : 'justify-start p-2.5'
            )}
            onClick={onSignOut}
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="flex-shrink-0 mr-2" size={20} />
            {isFullyExpanded && !isCollapsed && <span className="ml-3">Sign Out</span>}
          </button>
        </div>
      </motion.aside>
      <div className="relative md:hidden h-14 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 z-40">
      <button 
        onClick={() => setMobileOpen(true)} 
        className="absolute top-1/2 left-2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
      >
        <Menu size={28} />
      </button>
    </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 bg-white dark:bg-neutral-900 flex flex-col w-64 shadow-2xl"
          >
            <div className="flex flex-col-3 items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800">
                <ChevronLeft size={22} />
                </button>
              <img src="/patient-pathway-logo.jpeg" alt="Patient Pathway Logo" className="w-8 h-8 object-contain mr-2" /> 
              <span className="font-bold text-lg bg-gradient-to-r from-[#FF6B35] to-[#0E7C9D] bg-clip-text text-transparent">Patient Pathway</span>

            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3">{getFilteredMainMenuItems().map(renderMenuItem)}</div>
            <div className="border-t border-gray-200 dark:border-neutral-800 py-2 px-3">{getFilteredBottomMenuItems().map(renderMenuItem)}</div>
            <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
              <button
                className="flex items-center w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 transition-all duration-200 rounded p-2.5"
                onClick={onSignOut}
              >
                <LogOut className="flex-shrink-0 mr-2" size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};