import { useState, useEffect } from 'react';
import { Bell, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getOrCreateDoctorProfile } from '@/lib/profileUtils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read: boolean;
}

export function NotificationDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDoctorProfile();
    }
  }, [user]);

  useEffect(() => {
    if (doctorId) {
      fetchNotifications();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'doctor_notifications',
            filter: `doctor_id=eq.${doctorId}`
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [doctorId]);

  const fetchDoctorProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
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

      if (!userProfiles || userProfiles.length === 0) {
        // No profile exists, create one (regular doctor)
        const profile = await getOrCreateDoctorProfile(user.id, user.email || undefined);
        if (profile) {
          setDoctorId(profile.id);
        }
        return;
      }

      const userProfile = userProfiles[0];
      
      // Check if user is staff or manager
      if (userProfile.is_staff) {
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
      console.error('Error in fetchDoctorProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!doctorId) return;

    try {
      const { data, error } = await supabase
        .from('doctor_notifications')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const deletedNotification = notifications.find(n => n.id === notificationId);
        return deletedNotification && !deletedNotification.read ? Math.max(0, prev - 1) : prev;
      });
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const clearAllNotifications = async () => {
    if (!doctorId) return;

    try {
      const { error } = await supabase
        .from('doctor_notifications')
        .delete()
        .eq('doctor_id', doctorId);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared permanently');
      fetchNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_lead':
        return '👤';
      case 'quiz_completed':
        return '📋';
      case 'system':
        return '⚙️';
      default:
        return '📢';
    }
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" className="relative rounded-2xl">
        <Bell className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative rounded-2xl">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-[#FF6B35] text-white text-xs px-1 py-0 min-w-[1.2rem] h-5 rounded-full">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-2xl p-0 shadow-xl">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Notifications</h4>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-xl transition-all duration-200 hover:bg-gray-50 border-l-4 group ${
                    notification.read 
                      ? 'border-l-gray-300' 
                      : 'border-l-[#0E7C9D] bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <h5 className="font-medium text-gray-800 text-sm truncate">
                          {notification.title}
                        </h5>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleDateString()} at{' '}
                        {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="w-6 h-6 p-0 hover:bg-[#0E7C9D]/10 rounded-lg"
                        >
                          <span className="text-xs">✓</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="w-6 h-6 p-0 hover:bg-red-100 text-red-500 rounded-lg"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}