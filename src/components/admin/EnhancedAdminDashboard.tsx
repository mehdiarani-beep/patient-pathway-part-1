import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin';
import { 
  Users, 
  BarChart3, 
  Settings, 
  Shield, 
  Mail, 
  Phone, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Calendar,
  FileText,
  Database,
  Activity,
  Bell,
  Search,
  Filter,
  Download,
  Eye,
  MapPin,
  Building,
  UserCheck,
  UserX,
  EyeOff,
  Clock,
  Target,
  PieChart,
  Lock,
  Key,
  Trash2,
  Edit,
  MoreHorizontal,
  Ban,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Settings2,
  ActivitySquare,
  Database as DatabaseIcon,
  Shield as ShieldIcon,
  ToggleRight,
  ToggleLeft,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface DoctorProfile {
  id: string;
  clinic_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  location: string | null;
  specialty: string | null;
  created_at: string;
  user_id: string;
  doctor_id?: string | null;
  is_active?: boolean;
  access_level?: string;
  phone?: string;
  logo_url?: string | null;
  avatar_url?: string | null;
  website?: string | null;
  email_prefix?: string | null;
  access_control?: boolean;
}

interface QuizLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  quiz_type: string;
  score: number;
  lead_status: string | null;
  lead_source: string | null;
  created_at: string;
  doctor_id: string;
  scheduled_date: string | null;
  answers?: any;
}

interface AdminStats {
  totalDoctors: number;
  totalLeads: number;
  activeQuizzes: number;
  conversionRate: number;
  leadsThisMonth: number;
  leadsThisWeek: number;
  averageScore: number;
  topSpecialties: string[];
  activeUsers: number;
  suspendedUsers: number;
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

interface TeamMember {
  id: string;
  doctor_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  permissions: {
    leads: boolean;
    content: boolean;
    payments: boolean;
    team: boolean;
  } | null;
}

export function EnhancedAdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalDoctors: 0,
    totalLeads: 0,
    activeQuizzes: 7,
    conversionRate: 0,
    leadsThisMonth: 0,
    leadsThisWeek: 0,
    averageScore: 0,
    topSpecialties: [],
    activeUsers: 0,
    suspendedUsers: 0
  });
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [leads, setLeads] = useState<QuizLead[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedQuizType, setSelectedQuizType] = useState('all');
  const [currentTab, setCurrentTab] = useState('overview');
  
  // Function to handle tab change and reset search terms
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    // Reset search terms when switching tabs to show all data
    setSearchTerm('');
    setDoctorSearchTerm('');
    setLeadSearchTerm('');
  };
  
  // Admin management states
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [showMaskedData, setShowMaskedData] = useState(true); // Default to masked data
  const [showMaskedLeads, setShowMaskedLeads] = useState(false); // For masked leads dialog
  const [selectedLead, setSelectedLead] = useState<QuizLead | null>(null);
  // Email alias request states
  const [emailAliasRequests, setEmailAliasRequests] = useState<any[]>([]);
  const [aliasRequestLoading, setAliasRequestLoading] = useState(false);
  
  // Doctor analytics & access control
  const [showDoctorLeads, setShowDoctorLeads] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [locallySuspendedDoctorIds, setLocallySuspendedDoctorIds] = useState<Set<string>>(new Set());
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedDoctors, setSelectedDoctors] = useState<Set<string>>(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    doctors: '',
    leads: '',
    users: ''
  });

  // Enhanced states for lead and doctor management
  const [showLeadEdit, setShowLeadEdit] = useState(false);
  const [editingLead, setEditingLead] = useState<QuizLead | null>(null);
  const [leadStatus, setLeadStatus] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  
  // Doctor password change states
  const [showDoctorPasswordChange, setShowDoctorPasswordChange] = useState(false);
  const [doctorNewPassword, setDoctorNewPassword] = useState('');
  const [doctorConfirmPassword, setDoctorConfirmPassword] = useState('');
  const [selectedDoctorForPassword, setSelectedDoctorForPassword] = useState<DoctorProfile | null>(null);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [maskedLeads, setMaskedLeads] = useState<QuizLead[]>([]);
  const [showDeleteLeadDialog, setShowDeleteLeadDialog] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<QuizLead | null>(null);
  
  // Doctor editing states
  const [editingDoctor, setEditingDoctor] = useState<DoctorProfile | null>(null);
  const [showDoctorEdit, setShowDoctorEdit] = useState(false);
  const [doctorEditData, setDoctorEditData] = useState({
    first_name: '',
    last_name: '',
    clinic_name: '',
    location: '',
    website: ''
  });
  const [showAccessWarning, setShowAccessWarning] = useState(false);
  const [doctorToRevoke, setDoctorToRevoke] = useState<DoctorProfile | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<DoctorProfile | null>(null);
  
  // Team members states
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [doctorDetailsTab, setDoctorDetailsTab] = useState('overview');

  useEffect(() => {
    fetchAdminData();
  }, [selectedTimeframe]);

  const approveEmailAliasRequest = async (requestId: string) => {
    try {
      setAliasRequestLoading(true);
      
      console.log('Approving alias request:', requestId);
      
      const { data: userData } = await supabase.auth.getUser();
      const approvedBy = userData.user?.id;
      
      if (!approvedBy) {
        console.error('No authenticated user found');
        toast.error('Authentication required to approve requests');
        return;
      }
      
      console.log('Approving with user ID:', approvedBy);
      
      const { data, error } = await supabase.rpc('approve_alias_request', {
        request_id: requestId,
        approved_by: approvedBy
      });

      console.log('Approval response:', { data, error });

      if (error) {
        console.error('Error approving alias request:', error);
        toast.error(`Failed to approve alias request: ${error.message}`);
        return;
      }

      if (data) {
        toast.success('Email alias request approved successfully');
        // Refresh the data
        await fetchAdminData();
      } else {
        console.error('Approval returned false - alias may no longer be available');
        toast.error('Failed to approve alias request - alias may no longer be available');
      }
    } catch (error) {
      console.error('Error approving alias request:', error);
      toast.error(`Failed to approve alias request: ${error.message}`);
    } finally {
      setAliasRequestLoading(false);
    }
  };

  const rejectEmailAliasRequest = async (requestId: string, reason?: string) => {
    try {
      setAliasRequestLoading(true);
      
      const { data, error } = await supabase.rpc('reject_alias_request', {
        request_id: requestId,
        rejected_by: (await supabase.auth.getUser()).data.user?.id,
        rejection_reason: reason || 'No reason provided'
      });

      if (error) {
        console.error('Error rejecting alias request:', error);
        toast.error('Failed to reject alias request');
        return;
      }

      if (data) {
        toast.success('Email alias request rejected');
        // Refresh the data
        await fetchAdminData();
      } else {
        toast.error('Failed to reject alias request');
      }
    } catch (error) {
      console.error('Error rejecting alias request:', error);
      toast.error('Failed to reject alias request');
    } finally {
      setAliasRequestLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch doctors with clinic information
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctor_profiles')
        .select(`
          *,
          clinic_profiles(
            id,
            clinic_name,
            clinic_slug
          )
        `)
        .order('created_at', { ascending: false });

      if (doctorError) {
        console.error('Error fetching doctors:', doctorError);
      }

      // Fetch leads
      const { data: leadData, error: leadError } = await supabase
        .from('quiz_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadError) {
        console.error('Error fetching leads:', leadError);
      }

      // Fetch email alias requests
      const { data: aliasRequestData, error: aliasRequestError } = await supabase
        .from('email_alias_requests')
        .select(`
          *,
          doctor_profiles!inner(
            id,
            first_name,
            last_name,
            clinic_name,
            email
          )
        `)
        .order('requested_at', { ascending: false });

      if (aliasRequestError) {
        console.error('Error fetching email alias requests:', aliasRequestError);
      }

      // Fetch admin users from doctor_profiles
      const { data: adminUserData, error: adminUserError } = await supabase
        .from('doctor_profiles')
        .select('user_id, email, is_admin, created_at')
        .eq('is_admin', true);

      if (adminUserError) {
        console.error('Error fetching admin users:', adminUserError);
      }

      // Transform admin user data to match AdminUser interface
      const transformedAdminUsers: AdminUser[] = (adminUserData || []).map(user => ({
        id: user.user_id,
        email: user.email,
        role: 'admin',
        is_active: user.is_admin,
        last_login: null, // We don't track this currently
        created_at: user.created_at
      }));

      setDoctors(doctorData || []);
      setLeads(leadData || []);
      setEmailAliasRequests(aliasRequestData || []);
      setAdminUsers(transformedAdminUsers);
      
      // Calculate comprehensive stats
      const totalDoctors = doctorData?.length || 0;
      const totalLeads = leadData?.length || 0;
      const conversionRate = totalDoctors > 0 ? (totalLeads / totalDoctors) * 100 : 0;
      
      // Calculate time-based stats
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const leadsThisMonth = leadData?.filter(lead => 
        new Date(lead.created_at) >= monthAgo
      ).length || 0;
      
      const leadsThisWeek = leadData?.filter(lead => 
        new Date(lead.created_at) >= weekAgo
      ).length || 0;
      
      // Calculate average score
      const totalScore = leadData?.reduce((sum, lead) => sum + lead.score, 0) || 0;
      const averageScore = leadData?.length > 0 ? totalScore / leadData.length : 0;
      
      // Get top specialties
      const specialtyCounts: { [key: string]: number } = {};
      doctorData?.forEach(doctor => {
        if (doctor.specialty) {
          specialtyCounts[doctor.specialty] = (specialtyCounts[doctor.specialty] || 0) + 1;
        }
      });
      
      const topSpecialties = Object.entries(specialtyCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([specialty]) => specialty);
      
      setStats({
        totalDoctors,
        totalLeads,
        activeQuizzes: 7,
        conversionRate: Math.round(conversionRate),
        leadsThisMonth,
        leadsThisWeek,
        averageScore: Math.round(averageScore * 100) / 100,
        topSpecialties,
        activeUsers: 1, // Admin user
        suspendedUsers: 0
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const timeframeStart = useMemo(() => {
    const days = Number(selectedTimeframe || '30');
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return start;
  }, [selectedTimeframe]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(leadSearchTerm.toLowerCase())) ||
        (lead.phone && lead.phone.includes(leadSearchTerm));
      
      const matchesSpecialty = selectedSpecialty === 'all' || 
        doctors.find(d => d.id === lead.doctor_id)?.specialty === selectedSpecialty;
      
      const matchesStatus = selectedStatus === 'all' || lead.lead_status === selectedStatus;
      const matchesQuizType = selectedQuizType === 'all' || lead.quiz_type === selectedQuizType;

      const createdAt = new Date(lead.created_at);
      const matchesTimeframe = createdAt >= timeframeStart;
      
      return matchesSearch && matchesSpecialty && matchesStatus && matchesQuizType && matchesTimeframe;
    });
  }, [leads, leadSearchTerm, selectedSpecialty, selectedStatus, selectedQuizType, doctors, timeframeStart]);

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = 
      (doctor.clinic_name && doctor.clinic_name.toLowerCase().includes(doctorSearchTerm.toLowerCase())) ||
      (doctor.first_name && doctor.first_name.toLowerCase().includes(doctorSearchTerm.toLowerCase())) ||
      (doctor.last_name && doctor.last_name.toLowerCase().includes(doctorSearchTerm.toLowerCase())) ||
      (doctor.email && doctor.email.toLowerCase().includes(doctorSearchTerm.toLowerCase()));
    
    const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialty === selectedSpecialty;
    
    return matchesSearch && matchesSpecialty;
  });

  const getUniqueValues = (field: keyof QuizLead | keyof DoctorProfile) => {
    const values = new Set();
    if (field === 'specialty') {
      doctors.forEach(doctor => {
        if (doctor.specialty) values.add(doctor.specialty);
      });
    } else if (field === 'lead_status') {
      leads.forEach(lead => {
        if (lead.lead_status) values.add(lead.lead_status);
      });
    } else if (field === 'quiz_type') {
      leads.forEach(lead => {
        values.add(lead.quiz_type);
      });
    }
    return Array.from(values);
  };


  const restoreDoctorAccess = async (doctorId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_profiles')
        .update({ is_active: true })
        .eq('id', doctorId);

      if (error) {
        // Fallback to local-only toggle
        setLocallySuspendedDoctorIds(prev => {
          const next = new Set(prev);
          next.delete(doctorId);
          return next;
        });
        toast.info('Doctor marked active locally (add is_active column to persist).');
        return;
      }

      setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, is_active: true } : d));
      toast.success('Doctor access restored');
    } catch (e) {
      toast.error('Failed to restore access');
    }
  };

  const openDoctorLeads = async (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    setShowDoctorLeads(true);
    setDoctorDetailsTab('overview'); // Reset to overview tab
    await fetchTeamMembers(doctor.id);
  };

  const fetchTeamMembers = async (doctorProfileId: string) => {
    try {
      setLoadingTeamMembers(true);
      console.log('Fetching team members for doctor:', doctorProfileId);
      
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('doctor_id', doctorProfileId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching team members:', error);
        toast.error('Failed to load team members');
        setTeamMembers([]);
        return;
      }

      console.log('Team members loaded:', data);
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
      setTeamMembers([]);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  const getDoctorLeadBreakdown = (doctorId: string) => {
    // Get ALL leads for this doctor, regardless of current filters
    const doctorLeads = leads.filter(l => l.doctor_id === doctorId);
    const total = doctorLeads.length;
    const byQuiz: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    doctorLeads.forEach(l => {
      byQuiz[l.quiz_type] = (byQuiz[l.quiz_type] || 0) + 1;
      const statusKey = l.lead_status || 'New';
      byStatus[statusKey] = (byStatus[statusKey] || 0) + 1;
    });
    return { total, byQuiz, byStatus };
  };

  const exportData = (type: 'leads' | 'doctors') => {
    const data = type === 'leads' ? filteredLeads : filteredDoctors;
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${type} data exported successfully`);
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  // Admin management functions
  const handleUserAccessToggle = async (userId: string, isActive: boolean) => {
    try {
      // Update admin status in doctor_profiles table
      const { error } = await supabase
        .from('doctor_profiles')
        .update({ is_admin: isActive })
        .eq('user_id', userId);

      if (error) {
        toast.error('Failed to update admin status');
        return;
      }

      // Update local state
      setAdminUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_active: isActive } : user
      ));

      toast.success(`User ${isActive ? 'granted admin access' : 'removed admin access'} successfully`);
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast.error('Failed to update admin status');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error('Failed to update password');
        return;
      }

      toast.success('Password updated successfully');
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to update password');
    }
  };

  const viewLeadDetails = (lead: QuizLead) => {
    setSelectedLead(lead);
    setShowLeadDetails(true);
  };

  const revokeUserAccess = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_profiles')
        .update({ is_admin: false })
        .eq('user_id', userId);

      if (error) {
        toast.error('Failed to revoke admin access');
        return;
      }

      setAdminUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_active: false } : user
      ));

      toast.success('Admin access revoked successfully');
    } catch (error) {
      toast.error('Failed to revoke access');
    }
  };

  const addAdminUser = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setAddAdminLoading(true);
    try {
      // First, check if the user exists in doctor_profiles
      const { data: existingUser, error: checkError } = await supabase
        .from('doctor_profiles')
        .select('user_id, email, is_admin, first_name, last_name')
        .eq('email', newAdminEmail.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error checking user:', checkError);
        toast.error('Error checking user existence');
        return;
      }

      if (existingUser) {
        if (existingUser.is_admin) {
          toast.error('This user is already an admin');
          return;
        }

        // User exists, just update their admin status
        const { error: updateError } = await supabase
          .from('doctor_profiles')
          .update({ is_admin: true })
          .eq('user_id', existingUser.user_id);

        if (updateError) {
          toast.error('Failed to grant admin access');
          return;
        }

        // Send admin notification email
        try {
          const { error: emailError } = await supabase.functions.invoke('send-admin-notification', {
            body: {
              email: existingUser.email,
              firstName: existingUser.first_name,
              lastName: existingUser.last_name
            }
          });

          if (emailError) {
            console.error('Error sending admin notification email:', emailError);
            // Don't show error to user, admin access was still granted
          }
        } catch (emailError) {
          console.error('Failed to send admin notification email:', emailError);
          // Don't show error to user, admin access was still granted
        }

        toast.success('Admin access granted to existing user');
      } else {
        // User doesn't exist, we need to create a doctor profile
        // But first, we need to check if they have a Supabase auth account
        toast.error('User not found. The user must first register and create a doctor profile before being granted admin access.');
        return;
      }

      // Refresh admin users list
      await fetchAdminData();
      setShowAddAdminDialog(false);
      setNewAdminEmail('');
    } catch (error) {
      console.error('Error adding admin user:', error);
      toast.error('An error occurred while adding admin user');
    } finally {
      setAddAdminLoading(false);
    }
  };

  // Enhanced functions for lead and doctor management
  const deleteLead = async (leadId: string) => {
    try {
      console.log('Deleting lead with ID:', leadId);
      
      const { data, error } = await supabase
        .from('quiz_leads')
        .delete()
        .eq('id', leadId)
        .select();

      if (error) {
        console.error('Error deleting lead:', error);
        console.error('Error details:', error.message, error.code, error.details);
        toast.error(`Failed to delete lead: ${error.message}`);
        return;
      }

      console.log('Delete response data:', data);
      console.log('Number of rows deleted:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.error('No rows were deleted - lead may not exist or no permission');
        toast.error('Lead not found or no permission to delete');
        return;
      }

      console.log('Lead deleted successfully from database');
      
      // Update local state
      setLeads(leads.filter(lead => lead.id !== leadId));
      setStats(prev => ({ ...prev, totalLeads: prev.totalLeads - 1 }));
      
      console.log('Local state updated, lead count:', leads.length - 1);
      toast.success('Lead deleted successfully');
    } catch (error) {
      console.error('Error in deleteLead:', error);
      toast.error('Failed to delete lead');
    }
  };

  // Function to delete a lead from masked leads dialog
  const deleteMaskedLead = async (leadId: string) => {
    try {
      console.log('Deleting masked lead with ID:', leadId);
      console.log('Current masked leads count:', maskedLeads.length);
      
      const { data, error } = await supabase
        .from('quiz_leads')
        .delete()
        .eq('id', leadId)
        .select();

      if (error) {
        console.error('Error deleting masked lead:', error);
        console.error('Error details:', error.message, error.code, error.details);
        toast.error(`Failed to delete lead: ${error.message}`);
        return;
      }

      console.log('Delete response data:', data);
      console.log('Number of rows deleted:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.error('No rows were deleted - lead may not exist or no permission');
        toast.error('Lead not found or no permission to delete');
        return;
      }

      console.log('Masked lead deleted successfully from database');
      
      // Update local state
      const updatedMaskedLeads = maskedLeads.filter(lead => lead.id !== leadId);
      const updatedLeads = leads.filter(lead => lead.id !== leadId);
      
      console.log('Updated masked leads count:', updatedMaskedLeads.length);
      console.log('Updated main leads count:', updatedLeads.length);
      
      setMaskedLeads(updatedMaskedLeads);
      setLeads(updatedLeads);
      setStats(prev => ({ ...prev, totalLeads: prev.totalLeads - 1 }));
      
      toast.success('Lead deleted successfully');
      setShowDeleteLeadDialog(false);
      setLeadToDelete(null);
    } catch (error) {
      console.error('Error in deleteMaskedLead:', error);
      toast.error('Failed to delete lead');
    }
  };

  // Function to confirm lead deletion
  const confirmDeleteLead = () => {
    if (leadToDelete) {
      console.log('Confirming deletion of lead:', leadToDelete.id, leadToDelete.name);
      deleteMaskedLead(leadToDelete.id);
    }
  };

  // Test function to verify delete permissions
  const testDeletePermission = async () => {
    try {
      console.log('Testing delete permission...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current user for delete test:', user?.email, 'Auth error:', authError);
      
      // Try to select a lead first to verify we can access the table
      const { data: testData, error: selectError } = await supabase
        .from('quiz_leads')
        .select('id, name, email')
        .limit(1);
      
      if (selectError) {
        console.error('Error selecting leads:', selectError);
        toast.error(`Cannot access leads table: ${selectError.message}`);
        return;
      }
      
      console.log('Successfully accessed leads table, found leads:', testData?.length || 0);
      toast.success('Delete permission test passed - can access leads table');
    } catch (error) {
      console.error('Error in testDeletePermission:', error);
      toast.error('Delete permission test failed');
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('quiz_leads')
        .update({ 
          lead_status: newStatus,
          ...(notes && { notes })
        })
        .eq('id', leadId);

      if (error) {
        toast.error('Failed to update lead status');
        return;
      }

      // Update local state
      setLeads(leads.map(lead => 
        lead.id === leadId 
          ? { ...lead, lead_status: newStatus }
          : lead
      ));

      toast.success('Lead status updated successfully');
      setShowLeadEdit(false);
      setEditingLead(null);
    } catch (error) {
      toast.error('Failed to update lead status');
    }
  };

  const editLead = (lead: QuizLead) => {
    setEditingLead(lead);
    setLeadStatus(lead.lead_status || '');
    setLeadNotes('');
    setShowLeadEdit(true);
  };

  // Function to mask contact information
  const maskEmail = (email: string | null) => {
    if (!email) return 'N/A';
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return email;
    const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
    return `${maskedLocal}@${domain}`;
  };

  const maskPhone = (phone: string | null) => {
    if (!phone) return 'N/A';
    if (phone.length <= 4) return phone;
    const lastFour = phone.slice(-4);
    const masked = '*'.repeat(phone.length - 4);
    return `${masked}${lastFour}`;
  };

  const maskName = (name: string) => {
    if (!name) return 'N/A';
    const words = name.split(' ');
    return words.map(word => {
      if (word.length <= 2) return word;
      return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
    }).join(' ');
  };

  const viewMaskedLeads = async (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    
    // Fetch leads for this doctor
    const { data: leadsData } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('doctor_id', doctor.id)
      .order('created_at', { ascending: false });

    setMaskedLeads(leadsData || []);
    setShowMaskedLeads(true);
  };

  // Doctor editing functions
  const editDoctor = (doctor: DoctorProfile) => {
    setEditingDoctor(doctor);
    setDoctorEditData({
      first_name: doctor.first_name || '',
      last_name: doctor.last_name || '',
      clinic_name: doctor.clinic_name || '',
      location: doctor.location || '',
      website: doctor.website || ''
    });
    setShowDoctorEdit(true);
  };

  const updateDoctor = async () => {
    if (!editingDoctor) return;

    try {
      // Check current user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current user for doctor update:', user?.email, 'Auth error:', authError);
      
      const { error } = await supabaseAdmin
        .from('doctor_profiles')
        .update({
          first_name: doctorEditData.first_name,
          last_name: doctorEditData.last_name,
          clinic_name: doctorEditData.clinic_name,
          location: doctorEditData.location,
          website: doctorEditData.website,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingDoctor.id);

      if (error) {
        console.error('Error updating doctor profile:', error);
        console.error('Error details:', error.message, error.code, error.details);
        toast.error(`Failed to update doctor profile: ${error.message}`);
        return;
      }

      // Update local state
      setDoctors(doctors.map(doctor => 
        doctor.id === editingDoctor.id 
          ? { 
              ...doctor, 
              first_name: doctorEditData.first_name,
              last_name: doctorEditData.last_name,
              clinic_name: doctorEditData.clinic_name,
              location: doctorEditData.location,
              website: doctorEditData.website
            }
          : doctor
      ));

      toast.success('Doctor profile updated successfully');
      setShowDoctorEdit(false);
      setEditingDoctor(null);
    } catch (error) {
      toast.error('Failed to update doctor profile');
    }
  };

  const formatFieldValue = (value: string | null | undefined) => {
    if (value === null || value === undefined || value === '') {
      return 'undefined';
    }
    return value;
  };

  // Function to determine if a doctor has access to the portal
  const getDoctorAccess = (doctor: DoctorProfile) => {
    // Only grant access if access_control is explicitly true
    const hasAccess = doctor.access_control === true;
    return { hasAccess, reason: hasAccess ? 'Has portal access' : 'Access revoked' };
  };

  // Function to check real-time access status of a doctor
  const checkDoctorAccessStatus = async (doctorId: string) => {
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('id, access_control, first_name, last_name, email')
        .eq('id', doctorId);
      
      if (error) {
        console.error('Error checking doctor access status:', error);
        toast.error(`Error: ${error.message}`);
        return;
      }
      
      console.log('Doctor access status check:', data);
      if (data && data.length > 0) {
        const doctor = data[0];
        const hasAccess = doctor.access_control === true;
        toast.success(`Doctor ${doctor.first_name} ${doctor.last_name}: access_control = ${doctor.access_control} (${hasAccess ? 'HAS ACCESS' : 'NO ACCESS'})`);
      } else {
        toast.error('Doctor not found');
      }
    } catch (error) {
      console.error('Error in checkDoctorAccessStatus:', error);
      toast.error('Failed to check doctor access status');
    }
  };

  // Function to revoke doctor access (with warning)
  const revokeDoctorAccess = (doctor: DoctorProfile) => {
    console.log('Revoke access clicked for doctor:', doctor.id, doctor.first_name, doctor.last_name);
    setDoctorToRevoke(doctor);
    setShowAccessWarning(true);
  };

  // Function to give doctor access
  const giveDoctorAccess = async (doctorId: string) => {
    try {
      console.log('Giving access to doctor:', doctorId);
      
      // Check current user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current user:', user?.email, 'Auth error:', authError);
      
      const { error } = await supabaseAdmin
        .from('doctor_profiles')
        .update({ access_control: true })
        .eq('id', doctorId);

      if (error) {
        console.error('Error giving doctor access:', error);
        console.error('Error details:', error.message, error.code, error.details);
        toast.error(`Failed to give doctor access: ${error.message}`);
        return;
      }

      // Update local state
      setDoctors(doctors.map(doctor => 
        doctor.id === doctorId 
          ? { ...doctor, access_control: true }
          : doctor
      ));

      toast.success('Doctor access granted successfully');
    } catch (error) {
      console.error('Error in giveDoctorAccess:', error);
      toast.error('Failed to give doctor access');
    }
  };

  // Function to confirm access revocation (sets access_control = false, keeps profile)
  const confirmRevokeAccess = async () => {
    if (!doctorToRevoke) return;

    try {
      console.log('Revoking access for doctor:', doctorToRevoke.id, doctorToRevoke.first_name, doctorToRevoke.last_name);
      
      // Check current user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current user:', user?.email, 'Auth error:', authError);
      
      // Update access_control to false to revoke access
      const { error } = await supabaseAdmin
        .from('doctor_profiles')
        .update({ access_control: false })
        .eq('id', doctorToRevoke.id);

      if (error) {
        console.error('Error revoking doctor access:', error);
        console.error('Error details:', error.message, error.code, error.details);
        toast.error(`Failed to revoke doctor access: ${error.message}`);
        return;
      }

      console.log('Doctor access revoked successfully in database');

      // Update local state to reflect the access change
      setDoctors(doctors.map(doctor => 
        doctor.id === doctorToRevoke.id 
          ? { ...doctor, access_control: false }
          : doctor
      ));

      const doctorName = doctorToRevoke.first_name && doctorToRevoke.last_name 
        ? `${doctorToRevoke.first_name} ${doctorToRevoke.last_name}`
        : 'Unknown Doctor';
        
      toast.success(`Doctor ${doctorName} access revoked successfully`);
      setShowAccessWarning(false);
      setDoctorToRevoke(null);
    } catch (error) {
      console.error('Error in confirmRevokeAccess:', error);
      toast.error('Failed to revoke doctor access');
    }
  };

  // Function to open password change dialog for doctor
  const openDoctorPasswordChange = (doctor: DoctorProfile) => {
    setSelectedDoctorForPassword(doctor);
    setDoctorNewPassword('');
    setDoctorConfirmPassword('');
    setShowDoctorPasswordChange(true);
  };

  const deleteDoctor = (doctor: DoctorProfile) => {
    console.log('Delete clicked for doctor:', doctor.id, doctor.first_name, doctor.last_name);
    setDoctorToDelete(doctor);
    setShowDeleteWarning(true);
  };
  const confirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    try {
      console.log('Deleting doctor:', doctorToDelete.id, doctorToDelete.first_name, doctorToDelete.last_name);
      
      // Check current user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication error:', authError);
        toast.error('Authentication required to delete doctor');
        return;
      }

      // Use admin client for elevated permissions
      // First, try to delete any related data that might cause foreign key issues
      // Delete leads associated with this doctor
      const { error: leadsError } = await supabaseAdmin
        .from('quiz_leads')
        .delete()
        .eq('doctor_id', doctorToDelete.id);

      if (leadsError) {
        console.warn('Warning: Could not delete associated leads:', leadsError);
        // Continue with doctor deletion even if leads deletion fails
      }

      // Delete doctor profile using admin client
      const { error } = await supabaseAdmin
        .from('doctor_profiles')
        .delete()
        .eq('id', doctorToDelete.id);

      if (error) {
        console.error('Error deleting doctor:', error);
        console.error('Error details:', error.message, error.code, error.details);
        
        // If it's a foreign key constraint error, try a different approach
        if (error.message.includes('foreign key') || error.message.includes('constraint')) {
          toast.error('Cannot delete doctor: There are related records that must be deleted first. Please contact support.');
        } else {
          toast.error(`Failed to delete doctor: ${error.message}`);
        }
        return;
      }

      console.log('Doctor deleted successfully from database');
      
      // Update local state to remove the doctor and associated leads
      setDoctors(doctors.filter(doctor => doctor.id !== doctorToDelete.id));
      setLeads(leads.filter(lead => lead.doctor_id !== doctorToDelete.id));
      
      const doctorName = doctorToDelete.first_name && doctorToDelete.last_name 
        ? `${doctorToDelete.first_name} ${doctorToDelete.last_name}`
        : 'Unknown Doctor';
        
      toast.success(`Doctor ${doctorName} and associated leads deleted successfully`);
      setShowDeleteWarning(false);
      setDoctorToDelete(null);
    } catch (error) {
      console.error('Error in confirmDeleteDoctor:', error);
      toast.error('Failed to delete doctor');
    }
  };
  const changeDoctorPassword = async () => {
    if (!selectedDoctorForPassword) return;

    // Validation
    if (!doctorNewPassword || !doctorConfirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (doctorNewPassword !== doctorConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (doctorNewPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setPasswordChangeLoading(true);
      
      // Call the secure edge function to change password
      const { data, error } = await supabase.functions.invoke('change-user-password', {
        body: {
          userId: selectedDoctorForPassword.user_id,
          newPassword: doctorNewPassword
        }
      });

      if (error) {
        console.error('Error changing doctor password:', error);
        toast.error(`Failed to change password: ${error.message}`);
        return;
      }

      if (data?.error) {
        console.error('Error from edge function:', data.error);
        toast.error(`Failed to change password: ${data.error}`);
        return;
      }

      const doctorName = selectedDoctorForPassword.first_name && selectedDoctorForPassword.last_name 
        ? `${selectedDoctorForPassword.first_name} ${selectedDoctorForPassword.last_name}`
        : 'Unknown Doctor';
        
      toast.success(`Password changed successfully for ${doctorName}`);
      setShowDoctorPasswordChange(false);
      setSelectedDoctorForPassword(null);
      setDoctorNewPassword('');
      setDoctorConfirmPassword('');
    } catch (error) {
      console.error('Error in changeDoctorPassword:', error);
      toast.error('Failed to change doctor password');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-gray-700" />
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Platform management and analytics</p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Admin Actions */}
            <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Admin Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button onClick={handlePasswordChange} className="w-full">
                    Update Password
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>



        {/* Search and Quick Stats */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search doctors, leads, or analytics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {stats.totalDoctors} Doctors
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {stats.totalLeads} Leads
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              {stats.leadsThisWeek} This Week
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border border-gray-200 hover:shadow-sm transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                Total Doctors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900">{stats.totalDoctors}</div>
              <p className="text-xs text-gray-500 mt-1">Registered practitioners</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-sm transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900">{stats.totalLeads}</div>
              <p className="text-xs text-gray-500 mt-1">Patient assessments</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-sm transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-500" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900">{stats.leadsThisMonth}</div>
              <p className="text-xs text-gray-500 mt-1">New leads generated</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-sm transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                Avg Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900">{stats.averageScore}</div>
              <p className="text-xs text-gray-500 mt-1">Patient assessment scores</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{stats.leadsThisWeek}</div>
              <p className="text-xs text-slate-500 mt-1">New leads this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{stats.conversionRate}%</div>
              <p className="text-xs text-slate-500 mt-1">Lead generation efficiency</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{stats.activeUsers}</div>
              <p className="text-xs text-slate-500 mt-1">Active admin users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <UserX className="w-4 h-4" />
                Suspended
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{stats.suspendedUsers}</div>
              <p className="text-xs text-slate-500 mt-1">Suspended users</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-white p-1 rounded-lg shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Doctors ({filteredDoctors.length})
            </TabsTrigger>
            <TabsTrigger value="doctorAnalytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Doctor Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="emailAliases" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Aliases
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setShowAddDoctor(true)}>
                <UserPlus className="w-8 h-8 text-green-600" />
                <span className="text-sm">Add Doctor</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={fetchAdminData}>
                <Database className="w-8 h-8 text-blue-600" />
                <span className="text-sm">Refresh Data</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => exportData('doctors')}>
                <Download className="w-8 h-8 text-purple-600" />
                <span className="text-sm">Export Data</span>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setShowNotifications(true)}>
                <Bell className="w-8 h-8 text-red-600" />
                <span className="text-sm">Notifications</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Top Specialties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topSpecialties.map((specialty, index) => (
                      <div key={specialty} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{specialty}</span>
                        <Badge variant="secondary">{index + 1}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{stats.leadsThisWeek} new leads this week</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{stats.totalDoctors} active doctors</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>7 active quiz types</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Lead Analytics (HIPAA Compliant)
                  </CardTitle>
                  <div className="text-sm text-slate-500">
                    No personal information displayed - only aggregated data
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search leads..."
                      value={leadSearchTerm}
                      onChange={(e) => setLeadSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Specialties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      {getUniqueValues('specialty').map((specialty: string) => (
                        <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {getUniqueValues('lead_status').map((status: string) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedQuizType} onValueChange={setSelectedQuizType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Quiz Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Quiz Types</SelectItem>
                      {getUniqueValues('quiz_type').map((type: string) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Toggle Button for Masked/Unmasked Leads */}
                <div className="flex justify-end mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMaskedData(!showMaskedData)}
                    className="flex items-center gap-2"
                  >
                    {showMaskedData ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Show Unmasked Data
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Show Masked Data
                      </>
                    )}
                  </Button>
                </div>

                {/* Leads Table */}
                <div className="border rounded-lg overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">
                          Name
                          {showMaskedData && <span className="text-xs text-gray-500 ml-2">(Masked)</span>}
                        </TableHead>
                        <TableHead className="w-[250px]">
                          Contact
                          {showMaskedData && <span className="text-xs text-gray-500 ml-2">(Masked)</span>}
                        </TableHead>
                        <TableHead className="w-[150px]">Quiz Type</TableHead>
                        <TableHead className="w-[100px]">Score</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[200px]">Doctor</TableHead>
                        <TableHead className="w-[120px]">Date</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(showMaskedData ? maskedLeads : filteredLeads).map((lead) => {
                        const doctor = doctors.find(d => d.id === lead.doctor_id);
                        return (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">
                              {showMaskedData ? maskName(lead.name) : lead.name}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {lead.email && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Mail className="w-3 h-3" />
                                    {showMaskedData ? maskEmail(lead.email) : lead.email}
                                  </div>
                                )}
                                {lead.phone && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Phone className="w-3 h-3" />
                                    {showMaskedData ? maskPhone(lead.phone) : lead.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{lead.quiz_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={lead.score >= 7 ? "default" : lead.score >= 4 ? "secondary" : "destructive"}>
                                {lead.score}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={lead.lead_status === 'scheduled' ? "default" : "secondary"}>
                                {lead.lead_status || 'New'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{doctor?.clinic_name || 'Unknown'}</div>
                                <div className="text-slate-500">{doctor?.specialty}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => viewLeadDetails(lead)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Doctors Tab */}
          <TabsContent value="doctors" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Doctor Profiles
                  </CardTitle>
                  <Button onClick={() => exportData('doctors')} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search doctors..."
                      value={doctorSearchTerm}
                      onChange={(e) => setDoctorSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Specialties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      {getUniqueValues('specialty').map((specialty: string) => (
                        <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Active
                    </Button>
                    <Button variant="outline" size="sm">
                      <UserX className="w-4 h-4 mr-2" />
                      Inactive
                    </Button>
                  </div>
                </div>

                {/* Doctors Table */}
                <div className="border rounded-lg overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Doctor</TableHead>
                        <TableHead className="w-[180px]">Clinic</TableHead>
                        <TableHead className="w-[120px]">Specialty</TableHead>
                        <TableHead className="w-[180px]">Leads by Quiz Type</TableHead>
                        <TableHead className="w-[100px]">Total Leads</TableHead>
                        <TableHead className="w-[200px]">Contact</TableHead>
                        <TableHead className="w-[150px]">Location</TableHead>
                        <TableHead className="w-[100px]">Access</TableHead>
                        <TableHead className="w-[100px]">Joined</TableHead>
                        <TableHead className="w-[180px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDoctors.map((doctor) => {
                        const doctorAccess = getDoctorAccess(doctor);
                        return (
                        <TableRow key={doctor.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
                                {doctor.avatar_url ? (
                                  <img 
                                    src={doctor.avatar_url} 
                                    alt={`${doctor.first_name} ${doctor.last_name}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={`w-full h-full flex items-center justify-center text-gray-500 ${doctor.avatar_url ? 'hidden' : ''}`}>
                                  <Users className="w-5 h-5" />
                                </div>
                              </div>
                              <div>
                                <div className="font-medium">
                                  {doctor.first_name} {doctor.last_name}
                                </div>
                                <div className="text-sm text-slate-500">{doctor.doctor_id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{doctor.clinic_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{doctor.specialty || 'General'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {(() => {
                                const doctorLeads = leads.filter(l => l.doctor_id === doctor.id);
                                const leadsByQuiz: { [key: string]: number } = {};
                                
                                doctorLeads.forEach(lead => {
                                  leadsByQuiz[lead.quiz_type] = (leadsByQuiz[lead.quiz_type] || 0) + 1;
                                });
                                
                                return (
                                  <>
                                    {Object.entries(leadsByQuiz).map(([quizType, count]) => (
                                      <div key={quizType} className="flex items-center justify-between text-xs">
                                        <span className="text-slate-600">{quizType}:</span>
                                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                                      </div>
                                    ))}
                                    {Object.keys(leadsByQuiz).length === 0 && (
                                      <span className="text-xs text-slate-400">No leads yet</span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {leads.filter(l => l.doctor_id === doctor.id).length}
                              </div>
                              <div className="text-xs text-slate-500">Total</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {doctor.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="w-3 h-3" />
                                  {doctor.email}
                                </div>
                              )}
                              {doctor.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="w-3 h-3" />
                                  {doctor.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {doctor.location || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={doctorAccess.hasAccess ? "default" : "secondary"}
                                className={doctorAccess.hasAccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {doctorAccess.hasAccess ? 'Has Access' : 'No Access'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {new Date(doctor.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openDoctorLeads(doctor)}
                                className="h-8 px-2 text-xs"
                                title="View Details"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => viewMaskedLeads(doctor)}
                                className="h-8 px-2 text-xs"
                                title="View Leads"
                              >
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Leads
                              </Button>
                              {doctorAccess.hasAccess ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => revokeDoctorAccess(doctor)}
                                  className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
                                  title="Revoke Access"
                                >
                                  Revoke Access
                                </Button>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => giveDoctorAccess(doctor.id)}
                                  className="h-8 px-2 text-xs text-green-600 hover:text-green-700"
                                  title="Give Access"
                                >
                                  Give Access
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openDoctorPasswordChange(doctor)}
                                className="h-8 px-2 text-xs"
                                title="Change Password"
                              >
                                <Key className="w-3 h-3 mr-1" />
                                Password
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => deleteDoctor(doctor)}
                                className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
                                title="Delete Doctor"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Doctor Analytics Tab */}
          <TabsContent value="doctorAnalytics" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Comprehensive Doctor Analytics
                  </CardTitle>
                  <Button onClick={() => exportData('doctors')} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Analytics
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Quiz Type Summary */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Quiz Type Distribution Across All Doctors</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      if (!leads || leads.length === 0) {
                        return (
                          <div className="col-span-2 md:col-span-4 text-center py-8">
                            <div className="text-lg text-slate-500">No leads found yet</div>
                            <div className="text-sm text-slate-400">Take quizzes or create sample leads to see data</div>
                          </div>
                        );
                      }
                      
                      const quizTypeTotals = leads.reduce((acc, lead) => {
                        acc[lead.quiz_type] = (acc[lead.quiz_type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      
                      return Object.entries(quizTypeTotals).map(([quizType, count]) => (
                        <Card key={quizType} className="text-center">
                          <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-blue-600">{count}</div>
                            <div className="text-sm text-slate-600">{quizType}</div>
                            <div className="text-xs text-slate-400">Total Leads</div>
                          </CardContent>
                        </Card>
                      ));
                    })()}
                  </div>
                </div>

                {/* Detailed Doctor Analytics Table */}
                <div className="border rounded-lg overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Doctor</TableHead>
                        <TableHead className="w-[150px]">Clinic</TableHead>
                        <TableHead className="w-[100px]">Specialty</TableHead>
                        <TableHead className="w-[80px]">NOSE</TableHead>
                        <TableHead className="w-[80px]">SNOT22</TableHead>
                        <TableHead className="w-[80px]">SNOT12</TableHead>
                        <TableHead className="w-[80px]">TNSS</TableHead>
                        <TableHead className="w-[80px]">Other</TableHead>
                        <TableHead className="w-[80px]">Total</TableHead>
                        <TableHead className="w-[100px]">Access</TableHead>
                        <TableHead className="w-[150px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDoctors.map((doctor) => {
                        const doctorAccess = getDoctorAccess(doctor);
                        const doctorLeads = leads.filter(l => l.doctor_id === doctor.id);
                        const totalLeads = doctorLeads.length;
                        
                        // Count leads by quiz type
                        const noseLeads = doctorLeads.filter(l => l.quiz_type === 'NOSE').length;
                        const snot22Leads = doctorLeads.filter(l => l.quiz_type === 'SNOT22').length;
                        const snot12Leads = doctorLeads.filter(l => l.quiz_type === 'SNOT12').length;
                        const tnssLeads = doctorLeads.filter(l => l.quiz_type === 'TNSS').length;
                        const otherLeads = totalLeads - noseLeads - snot22Leads - snot12Leads - tnssLeads;
                        
                        return (
                          <TableRow key={doctor.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
                                  {doctor.avatar_url ? (
                                    <img 
                                      src={doctor.avatar_url} 
                                      alt={`${doctor.first_name} ${doctor.last_name}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  <div className={`w-full h-full flex items-center justify-center text-gray-500 ${doctor.avatar_url ? 'hidden' : ''}`}>
                                    <Users className="w-5 h-5" />
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {doctor.first_name} {doctor.last_name}
                                  </div>
                                  <div className="text-sm text-slate-500">{doctor.clinic_name || 'N/A'}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{doctor.clinic_name || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{doctor.specialty || 'General'}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-600">{noseLeads}</div>
                                <div className="text-xs text-slate-500">NOSE</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-600">{snot22Leads}</div>
                                <div className="text-xs text-slate-500">SNOT22</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-600">{snot12Leads}</div>
                                <div className="text-xs text-slate-500">SNOT12</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <div className="text-lg font-bold text-orange-600">{tnssLeads}</div>
                                <div className="text-xs text-slate-500">TNSS</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <div className="text-lg font-bold text-slate-600">{otherLeads}</div>
                                <div className="text-xs text-slate-500">Other</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <div className="text-xl font-bold text-red-600">{totalLeads}</div>
                                <div className="text-xs text-slate-500">Total</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={doctorAccess.hasAccess ? "default" : "secondary"}
                                  className={doctorAccess.hasAccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                >
                                  {doctorAccess.hasAccess ? 'Has Access' : 'No Access'}
                                </Badge>
                                <div className="text-xs text-gray-500" title={doctorAccess.reason}>
                                  {doctorAccess.reason}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => openDoctorLeads(doctor)}>
                                View Details
                              </Button>
                                {doctorAccess.hasAccess ? (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => revokeDoctorAccess(doctor)}
                                    className="text-xs text-red-600 hover:text-red-700"
                                    title="Revoke Access"
                                  >
                                    Revoke Access
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => giveDoctorAccess(doctor.id)}
                                    className="text-xs text-green-600 hover:text-green-700"
                                    title="Give Access"
                                  >
                                    Give Access
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => deleteDoctor(doctor)}
                                  className="text-xs text-red-600 hover:text-red-700"
                                  title="Delete Doctor"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary Statistics */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Top Performing Doctor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        if (!filteredDoctors || filteredDoctors.length === 0) {
                          return (
                            <div>
                              <div className="text-lg font-bold text-blue-600">N/A</div>
                              <div className="text-sm text-slate-500">0 leads</div>
                            </div>
                          );
                        }
                        
                        const topDoctor = filteredDoctors.reduce((top, current) => {
                          const topLeads = leads.filter(l => l.doctor_id === top.id).length;
                          const currentLeads = leads.filter(l => l.doctor_id === current.id).length;
                          return currentLeads > topLeads ? current : top;
                        }, filteredDoctors[0]);
                        
                        const topDoctorLeads = leads.filter(l => l.doctor_id === topDoctor?.id).length;
                        
                        return (
                          <div>
                            <div className="text-lg font-bold text-blue-600">
                              {topDoctor ? `${topDoctor.first_name} ${topDoctor.last_name}` : 'N/A'}
                            </div>
                            <div className="text-sm text-slate-500">{topDoctorLeads} leads</div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Most Popular Quiz</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        if (!leads || leads.length === 0) {
                          return (
                            <div>
                              <div className="text-lg font-bold text-green-600">N/A</div>
                              <div className="text-sm text-slate-500">0 leads</div>
                            </div>
                          );
                        }
                        
                        const quizTypeTotals = leads.reduce((acc, lead) => {
                          acc[lead.quiz_type] = (acc[lead.quiz_type] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);
                        
                        if (Object.keys(quizTypeTotals).length === 0) {
                          return (
                            <div>
                              <div className="text-lg font-bold text-green-600">N/A</div>
                              <div className="text-sm text-slate-500">0 leads</div>
                            </div>
                          );
                        }
                        
                        const mostPopular = Object.entries(quizTypeTotals).reduce((a, b) => 
                          quizTypeTotals[a[0]] > quizTypeTotals[b[0]] ? a : b
                        );
                        
                        return (
                          <div>
                            <div className="text-lg font-bold text-green-600">{mostPopular?.[0] || 'N/A'}</div>
                            <div className="text-sm text-slate-500">{mostPopular?.[1] || 0} leads</div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Average Leads per Doctor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-purple-600">
                        {filteredDoctors.length > 0 ? Math.round(leads.length / filteredDoctors.length) : 0}
                      </div>
                      <div className="text-sm text-slate-500">Across all doctors</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Admin User Management
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddAdminDialog(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Admin User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                                <Shield className="w-4 h-4 text-slate-600" />
                              </div>
                              <div>
                                <div className="font-medium">{user.email}</div>
                                <div className="text-sm text-slate-500">ID: {user.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.is_active}
                                onCheckedChange={(checked) => handleUserAccessToggle(user.id, checked)}
                              />
                              <Badge variant={user.is_active ? "default" : "destructive"}>
                                {user.is_active ? "Active" : "Suspended"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Lead Generation Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-500">
                    Chart visualization would go here
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Quiz Type Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-500">
                    Pie chart would go here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-slate-500">Add an extra layer of security</div>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Session Timeout</div>
                      <div className="text-sm text-slate-500">Auto-logout after inactivity</div>
                    </div>
                    <Select defaultValue="30">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Data Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export All Data
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Database className="w-4 h-4 mr-2" />
                    Database Backup
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clean Old Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Email Aliases Tab */}
          <TabsContent value="emailAliases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Alias Requests
                </CardTitle>
                <CardDescription>
                  Review and manage email alias requests from doctors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aliasRequestLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : emailAliasRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No email alias requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {emailAliasRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {(request.doctor_profiles?.first_name?.[0] || '') + (request.doctor_profiles?.last_name?.[0] || '')}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {request.doctor_profiles?.first_name} {request.doctor_profiles?.last_name}
                              </h4>
                              <p className="text-sm text-gray-500">{request.doctor_profiles?.email}</p>
                              <p className="text-sm text-gray-500">Clinic: {request.doctor_profiles?.clinic_name || 'N/A'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-medium">Requested Alias:</span>
                                <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                                  {request.requested_alias}@patientpathway.ai
                                </code>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                Requested: {new Date(request.requested_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            request.status === 'approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => approveEmailAliasRequest(request.id)}
                                disabled={aliasRequestLoading}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectEmailAliasRequest(request.id)}
                                disabled={aliasRequestLoading}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Lead Details Dialog */}
      <Dialog open={showLeadDetails} onOpenChange={setShowLeadDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <div className="text-sm">{selectedLead.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="text-sm">{selectedLead.email || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <div className="text-sm">{selectedLead.phone || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quiz Type</Label>
                  <div className="text-sm">{selectedLead.quiz_type}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Score</Label>
                  <div className="text-sm">{selectedLead.score}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="text-sm">{selectedLead.lead_status || 'New'}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <div className="text-sm">{new Date(selectedLead.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Scheduled Date</Label>
                  <div className="text-sm">{selectedLead.scheduled_date ? new Date(selectedLead.scheduled_date).toLocaleDateString() : 'Not scheduled'}</div>
                </div>
              </div>
              
              {selectedLead.answers && (
                <div>
                  <Label className="text-sm font-medium">Quiz Answers</Label>
                  <Textarea 
                    value={JSON.stringify(selectedLead.answers, null, 2)} 
                    readOnly 
                    className="mt-2"
                    rows={6}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Doctor Leads Analytics Dialog */}
      <Dialog open={showDoctorLeads} onOpenChange={setShowDoctorLeads}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Doctor Profile & Analytics
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => editDoctor(selectedDoctor!)}
                className="h-8"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedDoctor && (
            <Tabs value={doctorDetailsTab} onValueChange={setDoctorDetailsTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="team">
                  Team Members
                  {teamMembers.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {teamMembers.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Doctor Profile Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {selectedDoctor.avatar_url ? (
                        <img 
                          src={selectedDoctor.avatar_url} 
                          alt={`${selectedDoctor.first_name} ${selectedDoctor.last_name}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center text-gray-500 ${selectedDoctor.avatar_url ? 'hidden' : ''}`}>
                        <Users className="w-6 h-6" />
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {formatFieldValue(selectedDoctor.first_name)} {formatFieldValue(selectedDoctor.last_name)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatFieldValue(selectedDoctor.specialty)} • {formatFieldValue(selectedDoctor.clinic_name)}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                        <Label className="text-sm font-medium text-gray-600">First Name</Label>
                        <div className="text-sm font-medium text-gray-900">
                          {formatFieldValue(selectedDoctor.first_name)}
                  </div>
                </div>
                <div>
                        <Label className="text-sm font-medium text-gray-600">Last Name</Label>
                        <div className="text-sm font-medium text-gray-900">
                          {formatFieldValue(selectedDoctor.last_name)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Email</Label>
                        <div className="text-sm text-gray-900">
                          {formatFieldValue(selectedDoctor.email)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Phone</Label>
                        <div className="text-sm text-gray-900">
                          {formatFieldValue(selectedDoctor.phone)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Specialty</Label>
                        <div className="text-sm text-gray-900">
                          {formatFieldValue(selectedDoctor.specialty)}
                        </div>
                </div>
              </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Clinic Name</Label>
                        <div className="text-sm text-gray-900">
                          {formatFieldValue(selectedDoctor.clinic_name)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Location</Label>
                        <div className="text-sm text-gray-900">
                          {formatFieldValue(selectedDoctor.location)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Website</Label>
                        <div className="text-sm text-gray-900">
                          {selectedDoctor.website ? (
                            <a 
                              href={selectedDoctor.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {selectedDoctor.website}
                            </a>
                          ) : (
                            'undefined'
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Email Prefix</Label>
                        <div className="text-sm text-gray-900">
                          {formatFieldValue(selectedDoctor.email_prefix)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Doctor ID</Label>
                        <div className="text-sm text-gray-900 font-mono">
                          {formatFieldValue(selectedDoctor.user_id)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Joined On</Label>
                        <div className="text-sm text-gray-900">
                          {new Date(selectedDoctor.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Portal Access</Label>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={getDoctorAccess(selectedDoctor).hasAccess ? "default" : "secondary"}
                            className={getDoctorAccess(selectedDoctor).hasAccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {getDoctorAccess(selectedDoctor).hasAccess ? 'Has Access' : 'No Access'}
                          </Badge>
                          <div className="text-xs text-gray-500" title={getDoctorAccess(selectedDoctor).reason}>
                            {getDoctorAccess(selectedDoctor).reason}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Members Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Members
                    <Badge variant="secondary" className="ml-auto">
                      {teamMembers.filter(m => m.role === 'staff' || m.role === 'manager' || m.role === 'owner').length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Staff and managers associated with this profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTeamMembers ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No team members added yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teamMembers
                        .filter(member => member.role === 'staff' || member.role === 'manager' || member.role === 'owner')
                        .slice(0, 3)
                        .map((member) => (
                          <div 
                            key={member.id} 
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                              {member.first_name?.[0] || member.email[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm text-gray-900 truncate">
                                  {member.first_name && member.last_name 
                                    ? `${member.first_name} ${member.last_name}`
                                    : formatFieldValue(member.first_name) || formatFieldValue(member.last_name) || 'Unnamed Member'
                                  }
                                </p>
                                <Badge 
                                  variant="outline"
                                  className={`text-xs ${
                                    member.role === 'owner' 
                                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                      : member.role === 'manager'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}
                                >
                                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 truncate">{member.email}</p>
                            </div>
                            <Badge 
                              variant={member.status === 'accepted' ? 'default' : 'outline'}
                              className={`text-xs ${
                                member.status === 'accepted'
                                  ? 'bg-green-100 text-green-800'
                                  : member.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {member.status}
                            </Badge>
                          </div>
                        ))}
                      
                      {teamMembers.filter(m => m.role === 'staff' || m.role === 'manager' || m.role === 'owner').length > 3 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setDoctorDetailsTab('team')}
                        >
                          View all {teamMembers.filter(m => m.role === 'staff' || m.role === 'manager' || m.role === 'owner').length} members
                        </Button>
                      )}
                      
                      {teamMembers.filter(m => m.role === 'staff' || m.role === 'manager' || m.role === 'owner').length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No staff or manager members found
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {(() => {
                const breakdown = getDoctorLeadBreakdown(selectedDoctor.id);
                const quizEntries = Object.entries(breakdown.byQuiz);
                const statusEntries = Object.entries(breakdown.byStatus);
                return (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Totals</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{breakdown.total} leads</div>
                        <div className="text-xs text-slate-500 mt-1">All time leads for this doctor</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">By Quiz Type</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          {quizEntries.length === 0 && (
                            <div className="text-sm text-slate-500">No leads yet</div>
                          )}
                          {quizEntries.map(([quiz, count]) => (
                            <div key={quiz} className="flex items-center justify-between">
                              <span className="text-sm">{quiz}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">By Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          {statusEntries.length === 0 && (
                            <div className="text-sm text-slate-500">No leads yet</div>
                          )}
                          {statusEntries.map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                              <span className="text-sm">{status}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
              </TabsContent>

              <TabsContent value="team" className="space-y-6 mt-6">
                {loadingTeamMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Team Members ({teamMembers.length})
                      </CardTitle>
                      <CardDescription>
                        Staff and managers associated with this doctor's profile
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {teamMembers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No team members found</p>
                          <p className="text-xs text-gray-400 mt-1">This doctor hasn't added any team members yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {teamMembers
                            .filter(member => member.role === 'staff' || member.role === 'manager' || member.role === 'owner')
                            .map((member) => (
                              <div 
                                key={member.id} 
                                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                    {member.first_name?.[0] || member.email[0].toUpperCase()}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-gray-900">
                                        {member.first_name && member.last_name 
                                          ? `${member.first_name} ${member.last_name}`
                                          : formatFieldValue(member.first_name) || formatFieldValue(member.last_name) || 'Unnamed Member'
                                        }
                                      </h4>
                                      <Badge 
                                        variant={member.role === 'owner' ? 'default' : member.role === 'manager' ? 'secondary' : 'outline'}
                                        className={
                                          member.role === 'owner' 
                                            ? 'bg-purple-100 text-purple-800' 
                                            : member.role === 'manager'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }
                                      >
                                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                      </Badge>
                                      <Badge 
                                        variant={member.status === 'accepted' ? 'default' : 'outline'}
                                        className={
                                          member.status === 'accepted'
                                            ? 'bg-green-100 text-green-800'
                                            : member.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        }
                                      >
                                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{member.email}</p>
                                    
                                    {member.permissions && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        <span className="text-xs text-gray-500">Permissions:</span>
                                        {member.permissions.leads && (
                                          <Badge variant="outline" className="text-xs">Leads</Badge>
                                        )}
                                        {member.permissions.content && (
                                          <Badge variant="outline" className="text-xs">Content</Badge>
                                        )}
                                        {member.permissions.payments && (
                                          <Badge variant="outline" className="text-xs">Payments</Badge>
                                        )}
                                        {member.permissions.team && (
                                          <Badge variant="outline" className="text-xs">Team</Badge>
                                        )}
                                        {!member.permissions.leads && !member.permissions.content && !member.permissions.payments && !member.permissions.team && (
                                          <span className="text-xs text-gray-400">No permissions</span>
                                        )}
                                      </div>
                                    )}
                                    
                                    <div className="mt-2 text-xs text-gray-500">
                                      <div className="flex gap-4">
                                        <span>Invited: {new Date(member.invited_at).toLocaleDateString()}</span>
                                        {member.accepted_at && (
                                          <span>Accepted: {new Date(member.accepted_at).toLocaleDateString()}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          
                          {teamMembers.filter(member => member.role === 'staff' || member.role === 'manager' || member.role === 'owner').length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-sm">No staff or manager members found</p>
                              <p className="text-xs text-gray-400 mt-1">Team members with other roles are not displayed</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              System Notifications
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">New leads this week</div>
                  <div className="text-xs text-slate-600">{stats.leadsThisWeek} new patient assessments</div>
                </div>
                <Badge variant="secondary">New</Badge>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">System health</div>
                  <div className="text-xs text-slate-600">All systems operational</div>
                </div>
                <Badge variant="default">Good</Badge>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Data backup</div>
                  <div className="text-xs text-slate-600">Last backup: 2 hours ago</div>
                </div>
                <Badge variant="secondary">Info</Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                Mark All Read
              </Button>
              <Button variant="outline" onClick={() => setShowNotifications(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Actions Dialog */}
      <Dialog open={showQuickActions} onOpenChange={setShowQuickActions}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Actions
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => {
                setShowQuickActions(false);
                setShowAddDoctor(true);
              }}
            >
              <UserPlus className="w-6 h-6" />
              <span>Add Doctor</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => {
                setShowQuickActions(false);
                fetchAdminData();
              }}
            >
              <Database className="w-6 h-6" />
              <span>Refresh Data</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => exportData('doctors')}
            >
              <Download className="w-6 h-6" />
              <span>Export Doctors</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => exportData('leads')}
            >
              <TrendingUp className="w-6 h-6" />
              <span>Export Analytics</span>
            </Button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowQuickActions(false)} className="flex-1">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Add Doctor Dialog */}
      <Dialog open={showAddDoctor} onOpenChange={setShowAddDoctor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div>
                <Label htmlFor="firstName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john.doe@clinic.com" />
            </div>
            <div>
              <Label htmlFor="clinic">Clinic Name</Label>
              <Input id="clinic" placeholder="City Medical Center" />
            </div>
            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENT">ENT</SelectItem>
                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                  <SelectItem value="Dermatology">Dermatology</SelectItem>
                  <SelectItem value="Neurology">Neurology</SelectItem>
                  <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="City, State" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+1 (555) 123-4567" />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Doctor
              </Button>
              <Button variant="outline" onClick={() => setShowAddDoctor(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Bulk Actions Dialog */}
      <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-sm font-medium">Selected Doctors: {selectedDoctors.size}</div>
              <div className="text-xs text-slate-500">Choose an action to perform on all selected doctors</div>
            </div>
            
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="w-4 h-4 mr-2" />
                Activate All
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <UserX className="w-4 h-4 mr-2" />
                Deactivate All
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Selected
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600"
                onClick={() => toast.error('Bulk delete not yet implemented')}
                disabled={selectedDoctors.size === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedDoctors.size})
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBulkActions(false)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Masked Leads Dialog */}
      <Dialog open={showMaskedLeads} onOpenChange={setShowMaskedLeads}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Leads for {selectedDoctor?.clinic_name || selectedDoctor?.first_name || 'Unknown Doctor'}
            </DialogTitle>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Contact information is masked for privacy</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMaskedData(!showMaskedData)}
                className="flex items-center gap-2"
              >
                {showMaskedData ? (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    Show Unmasked Data
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    Show Masked Data
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>
          {selectedDoctor && (
            <div className="space-y-4">
              {maskedLeads.length > 0 ? (
                <div className="border rounded-lg overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Name</TableHead>
                        <TableHead className="w-[200px]">Email</TableHead>
                        <TableHead className="w-[150px]">Phone</TableHead>
                        <TableHead className="w-[120px]">Quiz Type</TableHead>
                        <TableHead className="w-[80px]">Score</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maskedLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">
                            {showMaskedData ? maskName(lead.name) : lead.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {showMaskedData ? maskEmail(lead.email) : lead.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {showMaskedData ? maskPhone(lead.phone) : lead.phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{lead.quiz_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={lead.score >= 7 ? "default" : lead.score >= 4 ? "secondary" : "destructive"}>
                              {lead.score}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={lead.lead_status === 'scheduled' ? "default" : "secondary"}>
                              {lead.lead_status || 'New'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setLeadToDelete(lead);
                                setShowDeleteLeadDialog(true);
                              }}
                              className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No leads found for this doctor</p>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Total leads: {maskedLeads.length}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowMaskedLeads(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lead Edit Dialog */}
      <Dialog open={showLeadEdit} onOpenChange={setShowLeadEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead Status</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Lead Name</Label>
                <div className="text-sm text-gray-600">{editingLead.name}</div>
              </div>
              
              <div>
                <Label htmlFor="leadStatus" className="text-sm font-medium">Status</Label>
                <Select value={leadStatus} onValueChange={setLeadStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="leadNotes" className="text-sm font-medium">Notes (Optional)</Label>
                <Textarea
                  id="leadNotes"
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowLeadEdit(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => updateLeadStatus(editingLead.id, leadStatus, leadNotes)}
                  className="flex-1"
                >
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Doctor Edit Dialog */}
      <Dialog open={showDoctorEdit} onOpenChange={setShowDoctorEdit}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Doctor Profile
            </DialogTitle>
            <p className="text-sm text-gray-500">Edit doctor information (only editable fields are shown)</p>
          </DialogHeader>
          {editingDoctor && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName" className="text-sm font-medium">First Name *</Label>
                  <Input
                    id="editFirstName"
                    value={doctorEditData.first_name}
                    onChange={(e) => setDoctorEditData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter first name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName" className="text-sm font-medium">Last Name *</Label>
                  <Input
                    id="editLastName"
                    value={doctorEditData.last_name}
                    onChange={(e) => setDoctorEditData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter last name"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editClinicName" className="text-sm font-medium">Clinic Name</Label>
                <Input
                  id="editClinicName"
                  value={doctorEditData.clinic_name}
                  onChange={(e) => setDoctorEditData(prev => ({ ...prev, clinic_name: e.target.value }))}
                  placeholder="Enter clinic name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="editLocation" className="text-sm font-medium">Location</Label>
                <Input
                  id="editLocation"
                  value={doctorEditData.location}
                  onChange={(e) => setDoctorEditData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location (City, State)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="editWebsite" className="text-sm font-medium">Website</Label>
                <Input
                  id="editWebsite"
                  value={doctorEditData.website}
                  onChange={(e) => setDoctorEditData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                  className="mt-1"
                />
              </div>

              {/* Read-only fields for reference */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-600 mb-3">Read-only Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 text-gray-900">{formatFieldValue(editingDoctor.email)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-2 text-gray-900">{formatFieldValue(editingDoctor.phone)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Specialty:</span>
                    <span className="ml-2 text-gray-900">{formatFieldValue(editingDoctor.specialty)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Doctor ID:</span>
                    <span className="ml-2 text-gray-900 font-mono">{formatFieldValue(editingDoctor.doctor_id)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDoctorEdit(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={updateDoctor}
                  className="flex-1"
                  disabled={!doctorEditData.first_name.trim() || !doctorEditData.last_name.trim()}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Access Control Warning Dialog */}
      <AlertDialog open={showAccessWarning} onOpenChange={setShowAccessWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Revoke Doctor Access
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to revoke access for{' '}
                <span className="font-semibold">
                  {doctorToRevoke?.first_name && doctorToRevoke?.last_name 
                    ? `${doctorToRevoke.first_name} ${doctorToRevoke.last_name}`
                    : 'Unknown Doctor'
                  }
                </span>
                ?
              </p>
              <p className="text-red-600 font-medium">
                ⚠️ This action will revoke the doctor's access to the portal.
              </p>
              <p className="text-sm text-gray-600">
                The doctor will no longer be able to access their dashboard, view leads, or manage their profile. Their profile will remain in the database but they won't be able to log in.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowAccessWarning(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevokeAccess}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lead Confirmation Dialog */}
      <AlertDialog open={showDeleteLeadDialog} onOpenChange={setShowDeleteLeadDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Delete Lead
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
            {leadToDelete && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <div className="text-sm font-medium">Lead Details:</div>
                <div className="text-sm text-gray-600">Name: {maskName(leadToDelete.name)}</div>
                <div className="text-sm text-gray-600">Email: {maskEmail(leadToDelete.email)}</div>
                <div className="text-sm text-gray-600">Quiz: {leadToDelete.quiz_type}</div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteLeadDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLead}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Doctor Deletion Warning Dialog */}
      <AlertDialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Doctor Profile
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p>
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold">
                  {doctorToDelete?.first_name && doctorToDelete?.last_name 
                    ? `${doctorToDelete.first_name} ${doctorToDelete.last_name}`
                    : 'Unknown Doctor'
                  }
                </span>
                ?
              </p>
              <p className="mt-2 text-red-600 font-medium">
                This action cannot be undone. All doctor profile data will be permanently removed from the system.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteWarning(false);
              setDoctorToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteDoctor}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Doctor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Doctor Password Change Dialog */}
      <Dialog open={showDoctorPasswordChange} onOpenChange={setShowDoctorPasswordChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Change Doctor Password
            </DialogTitle>
            {selectedDoctorForPassword && (
              <p className="text-sm text-gray-500">
                Change password for {selectedDoctorForPassword.first_name} {selectedDoctorForPassword.last_name}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={doctorNewPassword}
                onChange={(e) => setDoctorNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={doctorConfirmPassword}
                onChange={(e) => setDoctorConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDoctorPasswordChange(false);
                  setSelectedDoctorForPassword(null);
                  setDoctorNewPassword('');
                  setDoctorConfirmPassword('');
                }}
                disabled={passwordChangeLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={changeDoctorPassword}
                disabled={passwordChangeLoading || !doctorNewPassword || !doctorConfirmPassword}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {passwordChangeLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Admin User Dialog */}
      <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>
              Grant admin access to an existing user. The user must already have a doctor profile in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="user@example.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                disabled={addAdminLoading}
              />
              <p className="text-sm text-slate-500 mt-1">
                Enter the email address of an existing user to grant admin access.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddAdminDialog(false);
                setNewAdminEmail('');
              }}
              disabled={addAdminLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={addAdminUser}
              disabled={addAdminLoading || !newAdminEmail.trim()}
            >
              {addAdminLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                'Add Admin User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
