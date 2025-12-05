import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, TrendingUp, Clock, Filter, Search, ArrowUpDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
// Lead type will be inferred from quiz_leads table structure
import { EnhancedLeadsTable } from './EnhancedLeadsTable';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import { getOrCreateDoctorProfile } from '@/lib/profileUtils';


interface MarketingEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_type: string;
  doctor_id: string;
  created_at: string;
}

export function LeadsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quizTypeFilter, setQuizTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'contact' | 'score' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [marketingEvents, setMarketingEvents] = useState<MarketingEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);


  useEffect(() => {
    if (user) {
      fetchDoctorProfile();
    }
  }, [user]);

  useEffect(() => {
    if (doctorId) {
      fetchLeads();
    }
  }, [doctorId, currentWeek]);

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
        toast.error('Failed to fetch doctor profile');
        return;
      }

      if (!userProfiles || userProfiles.length === 0) {
        // No profile exists, create one (regular doctor)
        const profile = await getOrCreateDoctorProfile(user.id, user.email || undefined);
        if (profile) {
          setDoctorId(profile.id);
        } else {
          setError('Failed to create doctor profile');
          toast.error('Failed to create doctor profile');
        }
        return;
      }

      const userProfile = userProfiles[0];
      
      // Check if user is staff or manager
      if (userProfile.is_staff || userProfile.is_manager) {
        // If team member, use the main doctor's ID from doctor_id_clinic
        if (userProfile.doctor_id_clinic) {
          setDoctorId(userProfile.doctor_id_clinic);
        } else {
          // No clinic link, use user's own profile
          setDoctorId(userProfile.id);
        }
      } else {
        // Regular doctor, use their own profile
        setDoctorId(userProfile.id);
      }
    } catch (error) {
      console.error('Unexpected error fetching doctor profile:', error);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    if (!doctorId) return;

    try {
      
      // Fetch leads with physician data
      const { data: leadsData, error: leadsError } = await supabase
        .from('quiz_leads')
        .select(`
          *,
          doctor:doctor_profiles(first_name, last_name),
          physician:clinic_physicians(id, first_name, last_name, degree_type)
        `)
        .eq('doctor_id', doctorId)
        .order('submitted_at', { ascending: false });

      if (leadsError) {
        console.error('Leads fetch error:', leadsError);
        setError('Could not fetch leads');
        toast.error('Could not fetch leads');
        setLoading(false);
        return;
      }

      // Transform and set leads data
      const transformedLeads = (leadsData || []).map(lead => ({
        ...lead,
        lead_status: lead.lead_status || 'NEW',
        submitted_at: new Date(lead.submitted_at).toISOString()
      }));
      setLeads(transformedLeads);
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };


  const getWeekDays = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 }); // Saturday
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  };

  const getEventsForDay = (day: Date) => {
    return marketingEvents.filter(event => 
      isSameDay(parseISO(event.event_date), day)
    );
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setCurrentWeek(addWeeks(currentWeek, 1));
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'all' || lead.lead_status === statusFilter;
    const matchesQuizType = quizTypeFilter === 'all' || lead.quiz_type === quizTypeFilter;
    
    return matchesSearch && matchesStatus && matchesQuizType;
  });

  const filteredAndSortedLeads = [...filteredLeads].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'contact':
        aValue = (a.email || a.phone || '').toLowerCase();
        bValue = (b.email || b.phone || '').toLowerCase();
        break;
      case 'score':
        aValue = a.score;
        bValue = b.score;
        break;
      case 'date':
        aValue = new Date(a.submitted_at).getTime();
        bValue = new Date(b.submitted_at).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.lead_status === 'NEW' && !l.is_partial).length,
    contacted: leads.filter(l => l.lead_status === 'CONTACTED').length,
    scheduled: leads.filter(l => l.lead_status === 'SCHEDULED').length,
    partial: leads.filter(l => l.is_partial).length
  };

  const uniqueQuizTypes = [...new Set(leads.map(l => l.quiz_type))];

  const toggleSort = (field: 'name' | 'contact' | 'score' | 'date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Leads</h3>
            <p className="text-red-700">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const weekDays = getWeekDays();

  // Split leads into active and deleted/partial
  const activeLeads = filteredAndSortedLeads.filter(l => !l.is_partial && l.lead_status !== 'DELETED');
  const deletedAndPartialLeads = filteredAndSortedLeads.filter(l => l.is_partial || l.lead_status === 'DELETED');

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
            <p className="text-xs text-blue-600">All time leads</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">New Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{stats.new}</div>
            <p className="text-xs text-green-600">Awaiting contact</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Contacted</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">{stats.contacted}</div>
            <p className="text-xs text-yellow-600">Follow up in progress</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Scheduled</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{stats.scheduled}</div>
            <p className="text-xs text-purple-600">Appointments booked</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Partial Leads</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{stats.partial}</div>
            <p className="text-xs text-orange-600">Started assessments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sorting */}
      <Card className="shadow-lg border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter & Sort Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={quizTypeFilter} onValueChange={setQuizTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Quiz Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quiz Types</SelectItem>
                {uniqueQuizTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'name' | 'contact' | 'score' | 'date') => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="contact">Contact Info</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => toggleSort(sortBy)}
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {filteredAndSortedLeads.length} of {leads.length} leads
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setQuizTypeFilter('all');
                setSortBy('date');
                setSortOrder('desc');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="shadow-lg border-gray-200">
        <CardHeader>
          <CardTitle>
            Leads ({activeLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeLeads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No Leads Found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                You don't have any leads yet. Share your assessments with patients to start collecting leads.
              </p>
              <Button onClick={() => navigate('/portal/quizzes')}>
                Manage Assessments
              </Button>
            </div>
          ) : (
            <EnhancedLeadsTable leads={activeLeads} onLeadUpdate={fetchLeads} />
          )}
        </CardContent>
      </Card>

      {/* Deleted Leads and Partial Submissions */}
      <Card className="shadow-lg border-gray-200">
        <CardHeader>
          <CardTitle>
            Deleted Leads & Partial Submissions ({deletedAndPartialLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deletedAndPartialLeads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No deleted leads or partial submissions.</p>
            </div>
          ) : (
            <EnhancedLeadsTable leads={deletedAndPartialLeads} onLeadUpdate={fetchLeads} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}