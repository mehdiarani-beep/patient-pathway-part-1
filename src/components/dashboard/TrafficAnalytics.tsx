import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, Monitor, Smartphone, Tablet, Globe, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface PageViewStats {
  pageName: string;
  pageType: string;
  views: number;
  uniqueVisitors: number;
  conversionRate: number;
}

interface TrafficSourceStats {
  source: string;
  count: number;
  percentage: number;
}

interface DeviceStats {
  device: string;
  count: number;
  percentage: number;
}

interface DailyStats {
  date: string;
  views: number;
  uniqueVisitors: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function TrafficAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('7');
  const [pageTypeFilter, setPageTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [totalViews, setTotalViews] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [pageStats, setPageStats] = useState<PageViewStats[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSourceStats[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchClinicId();
    }
  }, [user]);

  useEffect(() => {
    if (clinicId) {
      fetchData();
    }
  }, [clinicId, dateRange, pageTypeFilter]);

  const fetchClinicId = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('doctor_profiles')
      .select('clinic_id')
      .eq('user_id', user.id)
      .single();
    
    if (data?.clinic_id) {
      setClinicId(data.clinic_id);
    }
  };

  const fetchData = async () => {
    if (!clinicId) return;
    
    setLoading(true);
    try {
      const days = parseInt(dateRange);
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Build query
      let query = supabase
        .from('page_views')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('viewed_at', startDate.toISOString())
        .lte('viewed_at', endDate.toISOString());

      if (pageTypeFilter !== 'all') {
        query = query.eq('page_type', pageTypeFilter);
      }

      const { data: views, error } = await query;

      if (error) {
        console.error('Error fetching page views:', error);
        return;
      }

      if (!views || views.length === 0) {
        setTotalViews(0);
        setUniqueVisitors(0);
        setPageStats([]);
        setTrafficSources([]);
        setDeviceStats([]);
        setDailyStats([]);
        return;
      }

      // Calculate totals
      setTotalViews(views.length);
      const uniqueVisitorIds = new Set(views.map(v => v.visitor_id).filter(Boolean));
      setUniqueVisitors(uniqueVisitorIds.size);

      // Calculate page stats
      const pageMap = new Map<string, { views: number; unique: Set<string> }>();
      views.forEach(v => {
        const key = `${v.page_name}||${v.page_type}`;
        if (!pageMap.has(key)) {
          pageMap.set(key, { views: 0, unique: new Set() });
        }
        const stats = pageMap.get(key)!;
        stats.views++;
        if (v.visitor_id) stats.unique.add(v.visitor_id);
      });

      const pageStatsArr: PageViewStats[] = Array.from(pageMap.entries()).map(([key, stats]) => {
        const [pageName, pageType] = key.split('||');
        return {
          pageName,
          pageType,
          views: stats.views,
          uniqueVisitors: stats.unique.size,
          conversionRate: 0 // Would need leads data to calculate
        };
      }).sort((a, b) => b.views - a.views);

      setPageStats(pageStatsArr);

      // Calculate traffic sources
      const sourceMap = new Map<string, number>();
      views.forEach(v => {
        const source = v.traffic_source || 'unknown';
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });

      const sourcesArr: TrafficSourceStats[] = Array.from(sourceMap.entries())
        .map(([source, count]) => ({
          source,
          count,
          percentage: (count / views.length) * 100
        }))
        .sort((a, b) => b.count - a.count);

      setTrafficSources(sourcesArr);

      // Calculate device stats
      const deviceMap = new Map<string, number>();
      views.forEach(v => {
        const device = v.device_type || 'unknown';
        deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
      });

      const devicesArr: DeviceStats[] = Array.from(deviceMap.entries())
        .map(([device, count]) => ({
          device,
          count,
          percentage: (count / views.length) * 100
        }))
        .sort((a, b) => b.count - a.count);

      setDeviceStats(devicesArr);

      // Calculate daily stats
      const dailyMap = new Map<string, { views: number; unique: Set<string> }>();
      views.forEach(v => {
        const date = format(new Date(v.viewed_at), 'MMM dd');
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { views: 0, unique: new Set() });
        }
        const stats = dailyMap.get(date)!;
        stats.views++;
        if (v.visitor_id) stats.unique.add(v.visitor_id);
      });

      const dailyArr: DailyStats[] = Array.from(dailyMap.entries())
        .map(([date, stats]) => ({
          date,
          views: stats.views,
          uniqueVisitors: stats.unique.size
        }));

      setDailyStats(dailyArr);

    } catch (err) {
      console.error('Error fetching traffic data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredPageStats = pageStats.filter(p => 
    searchQuery === '' || p.pageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPageTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'landing_page': return 'default';
      case 'quiz_standard': return 'secondary';
      case 'quiz_chat': return 'outline';
      case 'physician_profile': return 'secondary';
      default: return 'outline';
    }
  };

  const getPageTypeLabel = (type: string) => {
    switch (type) {
      case 'landing_page': return 'LP';
      case 'quiz_standard': return 'Standard';
      case 'quiz_chat': return 'Chat';
      case 'physician_profile': return 'Profile';
      default: return type;
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  if (loading && !refreshing) {
    return <div className="p-6">Loading traffic analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Traffic Analytics</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={pageTypeFilter} onValueChange={setPageTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Page Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pages</SelectItem>
              <SelectItem value="landing_page">Landing Pages</SelectItem>
              <SelectItem value="quiz_standard">Quiz Standard</SelectItem>
              <SelectItem value="quiz_chat">Quiz Chat</SelectItem>
              <SelectItem value="physician_profile">Profiles</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Total Page Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Unique Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{uniqueVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Pages Tracked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pageStats.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Avg Views/Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {pageStats.length > 0 ? Math.round(totalViews / pageStats.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Over Time Chart */}
      {dailyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Traffic Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Views"
                />
                <Line 
                  type="monotone" 
                  dataKey="uniqueVisitors" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Unique"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Pages Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Pages Breakdown</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Unique</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPageStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No page views recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                filteredPageStats.slice(0, 10).map((page, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{page.pageName}</TableCell>
                    <TableCell>
                      <Badge variant={getPageTypeBadgeVariant(page.pageType)}>
                        {getPageTypeLabel(page.pageType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{page.views}</TableCell>
                    <TableCell className="text-right">{page.uniqueVisitors}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Traffic Sources & Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {trafficSources.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            ) : (
              <div className="flex items-start gap-6">
                <div className="w-32 h-32 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trafficSources}
                        dataKey="count"
                        nameKey="source"
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={50}
                      >
                        {trafficSources.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {trafficSources.map((source, idx) => (
                    <div key={source.source} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="capitalize">{source.source}</span>
                      </div>
                      <span className="font-medium">{source.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            ) : (
              <div className="space-y-4">
                {deviceStats.map((device) => (
                  <div key={device.device} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.device)}
                        <span className="capitalize">{device.device}</span>
                      </div>
                      <span className="font-medium">{device.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${device.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
