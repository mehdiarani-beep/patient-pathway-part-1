import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Facebook, 
  Instagram, 
  Calendar,
  Plus,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Settings,
  Users,
  TrendingUp,
  MessageSquare,
  Heart,
  Share2,
  Edit
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Import sub-components
import { PostComposer } from './PostComposer';
import { ScheduledPosts } from './ScheduledPosts';
import { PostAnalytics } from './PostAnalytics';
import { AccountManagement } from './AccountManagement';

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  connected: boolean;
  permissions: any;
  last_sync_at?: string;
  created_at: string;
}

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  image_url?: string;
  hashtags: string[];
  scheduled_at?: string;
  published_at?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';
  engagement_stats: {
    likes?: number;
    comments?: number;
    shares?: number;
    reach?: number;
  };
}

interface AnalyticsData {
  totalPosts: number;
  totalEngagement: number;
  averageEngagement: number;
  topPerformingPost: SocialPost | null;
  platformBreakdown: Record<string, number>;
}

export function SocialMediaManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('compose');
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchConnectedAccounts(),
        fetchRecentPosts(),
        fetchAnalytics()
      ]);
    } catch (error) {
      console.error('Error fetching social media data:', error);
      toast.error('Failed to load social media data');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedAccounts = async () => {
    if (!user) return;

    try {
      // Get doctor profile first
      const { data: doctorProfile } = await supabase
        .from('doctor_profiles')
        .select('id, clinic_id')
        .eq('user_id', user.id)
        .single();

      if (!doctorProfile) return;

      const { data: accounts, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('doctor_id', doctorProfile.id)
        .eq('connected', true);

      if (error) throw error;
      setConnectedAccounts(accounts || []);
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    }
  };

  const fetchRecentPosts = async () => {
    if (!user) return;

    try {
      // Get doctor profile first
      const { data: doctorProfile } = await supabase
        .from('doctor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!doctorProfile) return;

      const { data: posts, error } = await supabase
        .from('social_posts')
        .select('*')
        .eq('doctor_id', doctorProfile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentPosts(posts || []);
    } catch (error) {
      console.error('Error fetching recent posts:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      // Get doctor profile first
      const { data: doctorProfile } = await supabase
        .from('doctor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!doctorProfile) return;

      const { data: posts, error } = await supabase
        .from('social_posts')
        .select('*')
        .eq('doctor_id', doctorProfile.id)
        .eq('status', 'published');

      if (error) throw error;

      // Calculate analytics
      const totalPosts = posts?.length || 0;
      const totalEngagement = posts?.reduce((sum, post) => {
        const stats = post.engagement_stats || {};
        return sum + (stats.likes || 0) + (stats.comments || 0) + (stats.shares || 0);
      }, 0) || 0;
      const averageEngagement = totalPosts > 0 ? totalEngagement / totalPosts : 0;

      const topPerformingPost = posts?.reduce((top, post) => {
        const stats = post.engagement_stats || {};
        const engagement = (stats.likes || 0) + (stats.comments || 0) + (stats.shares || 0);
        const topEngagement = (top.engagement_stats?.likes || 0) + 
                             (top.engagement_stats?.comments || 0) + 
                             (top.engagement_stats?.shares || 0);
        return engagement > topEngagement ? post : top;
      }, posts?.[0] || null);

      const platformBreakdown = posts?.reduce((acc, post) => {
        acc[post.platform] = (acc[post.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      setAnalytics({
        totalPosts,
        totalEngagement,
        averageEngagement,
        topPerformingPost,
        platformBreakdown
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'twitter':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'linkedin':
        return <Users className="w-4 h-4 text-blue-700" />;
      case 'youtube':
        return <Share2 className="w-4 h-4 text-red-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Published</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800"><Edit className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connected Accounts</p>
                <p className="text-2xl font-bold">{connectedAccounts.length}</p>
              </div>
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold">{analytics?.totalPosts || 0}</p>
              </div>
              <Send className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Engagement</p>
                <p className="text-2xl font-bold">{analytics?.totalEngagement || 0}</p>
              </div>
              <Heart className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Engagement</p>
                <p className="text-2xl font-bold">{Math.round(analytics?.averageEngagement || 0)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Accounts Quick View */}
      {connectedAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {connectedAccounts.map((account) => (
                <div key={account.id} className="flex items-center gap-2 p-3 border rounded-lg">
                  {getPlatformIcon(account.platform)}
                  <span className="font-medium capitalize">{account.platform}</span>
                  <span className="text-sm text-gray-600">@{account.username}</span>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Posts Quick View */}
      {recentPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Recent Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPosts.slice(0, 3).map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(post.platform)}
                    <div>
                      <p className="font-medium">{post.content.substring(0, 50)}...</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(post.status)}
                        {post.published_at && (
                          <span className="text-sm text-gray-500">
                            {new Date(post.published_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {post.engagement_stats && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      {post.engagement_stats.likes && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.engagement_stats.likes}
                        </span>
                      )}
                      {post.engagement_stats.comments && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {post.engagement_stats.comments}
                        </span>
                      )}
                      {post.engagement_stats.shares && (
                        <span className="flex items-center gap-1">
                          <Share2 className="w-3 h-3" />
                          {post.engagement_stats.shares}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Accounts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="compose" className="mt-6">
          <PostComposer 
            connectedAccounts={connectedAccounts}
            onPostCreated={fetchRecentPosts}
          />
        </TabsContent>
        
        <TabsContent value="schedule" className="mt-6">
          <ScheduledPosts 
            onPostsUpdated={fetchRecentPosts}
          />
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <PostAnalytics 
            analytics={analytics}
            onRefresh={fetchAnalytics}
          />
        </TabsContent>
        
        <TabsContent value="accounts" className="mt-6">
          <AccountManagement 
            connectedAccounts={connectedAccounts}
            onAccountsUpdated={fetchConnectedAccounts}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
