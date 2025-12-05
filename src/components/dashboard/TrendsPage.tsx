import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Users, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';

interface TrendData {
  period: string;
  newLeads: number;
  contacted: number;
  scheduled: number;
  total: number;
}

interface AnalyticsData {
  totalLeads: number;
  conversionRate: number;
  averageScore: number;
  topQuizType: string;
  leadsBySource: { [key: string]: number };
  leadsByQuizType: { [key: string]: number };
}

export function TrendsPage() {
  const { user } = useAuth();
  const [trendsData, setTrendsData] = useState<TrendData[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6weeks');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, timeRange]);

  const fetchData = async () => {
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
        return;
      }

      let doctorId = null;

      if (!userProfiles || userProfiles.length === 0) {
        console.log('No doctor profile found');
        return;
      } else {
        const userProfile = userProfiles[0];
        
        // Check if user is staff or manager
        if (userProfile.is_staff) {
          // If team member, use the main doctor's ID from doctor_id_clinic
          if (userProfile.doctor_id_clinic) {
            doctorId = userProfile.doctor_id_clinic;
          } else {
            // No clinic link, use user's own profile
            doctorId = userProfile.id;
          }
        } else {
          // Regular doctor, use their own profile
          doctorId = userProfile.id;
        }
      }

      if (doctorId) {
        await Promise.all([
          fetchTrendsData(doctorId),
          fetchAnalyticsData(doctorId)
        ]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendsData = async (doctorId: string) => {
    const { data: leads } = await supabase
      .from('quiz_leads')
      .select('lead_status, created_at')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    // Process data based on time range
    const weeklyData: TrendData[] = [];
    const now = new Date();
    const weeks = timeRange === '6weeks' ? 6 : timeRange === '12weeks' ? 12 : 26;
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekLeads = leads?.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= weekStart && leadDate <= weekEnd;
      }) || [];

      const newLeads = weekLeads.filter(l => l.lead_status === 'NEW').length;
      const contacted = weekLeads.filter(l => l.lead_status === 'CONTACTED').length;
      const scheduled = weekLeads.filter(l => l.lead_status === 'SCHEDULED').length;

      weeklyData.push({
        period: `Week of ${weekStart.toLocaleDateString()}`,
        newLeads,
        contacted,
        scheduled,
        total: weekLeads.length
      });
    }

    setTrendsData(weeklyData);
  };

  const fetchAnalyticsData = async (doctorId: string) => {
    const { data: leads } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('doctor_id', doctorId);

    if (leads && leads.length > 0) {
      const totalLeads = leads.length;
      const scheduledLeads = leads.filter(l => l.lead_status === 'SCHEDULED').length;
      const conversionRate = (scheduledLeads / totalLeads) * 100;
      const averageScore = leads.reduce((sum, lead) => sum + (lead.score || 0), 0) / totalLeads;

      // Group by source
      const leadsBySource: { [key: string]: number } = {};
      leads.forEach(lead => {
        const source = lead.lead_source || 'unknown';
        leadsBySource[source] = (leadsBySource[source] || 0) + 1;
      });

      // Group by quiz type
      const leadsByQuizType: { [key: string]: number } = {};
      leads.forEach(lead => {
        const quizType = lead.quiz_type || 'unknown';
        leadsByQuizType[quizType] = (leadsByQuizType[quizType] || 0) + 1;
      });

      const topQuizType = Object.entries(leadsByQuizType)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

      setAnalyticsData({
        totalLeads,
        conversionRate,
        averageScore,
        topQuizType,
        leadsBySource,
        leadsByQuizType
      });
    }
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getCurrentWeekData = () => trendsData[trendsData.length - 1] || { newLeads: 0, contacted: 0, scheduled: 0, total: 0 };
  const getPreviousWeekData = () => trendsData[trendsData.length - 2] || { newLeads: 0, contacted: 0, scheduled: 0, total: 0 };

  const currentWeek = getCurrentWeekData();
  const previousWeek = getPreviousWeekData();

  const trends = {
    newLeads: calculateTrend(currentWeek.newLeads, previousWeek.newLeads),
    contacted: calculateTrend(currentWeek.contacted, previousWeek.contacted),
    scheduled: calculateTrend(currentWeek.scheduled, previousWeek.scheduled),
    total: calculateTrend(currentWeek.total, previousWeek.total)
  };

  if (loading) {
    return <div className="p-6">Loading analytics and trends...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Trends</h1>
          <p className="text-gray-600">Track your lead generation performance and analytics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6weeks">Last 6 Weeks</SelectItem>
            <SelectItem value="12weeks">Last 12 Weeks</SelectItem>
            <SelectItem value="26weeks">Last 6 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Analytics Overview */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">{analyticsData.totalLeads}</div>
              <p className="text-xs text-blue-600">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{analyticsData.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-green-600">Leads to scheduled</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Avg Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">{analyticsData.averageScore.toFixed(1)}</div>
              <p className="text-xs text-purple-600">Assessment average</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Top Quiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-orange-800">{analyticsData.topQuizType}</div>
              <p className="text-xs text-orange-600">Most popular</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{currentWeek.total}</div>
              <div className={`flex items-center gap-1 ${trends.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trends.total >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                <span className="text-sm font-medium">{Math.abs(trends.total).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-600">{currentWeek.newLeads}</div>
              <div className={`flex items-center gap-1 ${trends.newLeads >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trends.newLeads >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                <span className="text-sm font-medium">{Math.abs(trends.newLeads).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Contacted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-yellow-600">{currentWeek.contacted}</div>
              <div className={`flex items-center gap-1 ${trends.contacted >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trends.contacted >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                <span className="text-sm font-medium">{Math.abs(trends.contacted).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">{currentWeek.scheduled}</div>
              <div className={`flex items-center gap-1 ${trends.scheduled >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trends.scheduled >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                <span className="text-sm font-medium">{Math.abs(trends.scheduled).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">vs last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Source Analytics */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Leads by Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analyticsData.leadsBySource).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{source}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(count / analyticsData.totalLeads) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Leads by Quiz Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analyticsData.leadsByQuizType).map(([quizType, count]) => (
                  <div key={quizType} className="flex items-center justify-between">
                    <span className="text-sm">{quizType}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(count / analyticsData.totalLeads) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weekly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          {trendsData.map((week, index) => (
              <div key={week.period} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                <div className="flex-1">
                  <h3 className="font-medium mb-3">{week.period}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      New: {week.newLeads}
                    </Badge>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                      Contacted: {week.contacted}
                    </Badge>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Scheduled: {week.scheduled}
                    </Badge>
                  </div>
                </div>
                <div className="text-right sm:text-right text-left shrink-0">
                  <div className="text-lg font-bold">{week.total}</div>
                  <div className="text-sm text-gray-500">total leads</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}