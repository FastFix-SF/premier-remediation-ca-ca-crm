import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  MessageSquare,
  Calendar,
  Check,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';

interface CCAlertsViewProps {
  memberId: string | null;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export const CCAlertsView: React.FC<CCAlertsViewProps> = ({ memberId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!memberId) return;

    const fetchNotifications = async () => {
      setLoading(true);

      const { data } = await supabase
        .from('team_member_notifications')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (data) setNotifications(data);
      setLoading(false);
    };

    fetchNotifications();
  }, [memberId]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    await supabase
      .from('team_member_notifications')
      .update({ is_read: true })
      .eq('id', id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    if (!memberId) return;

    await supabase
      .from('team_member_notifications')
      .update({ is_read: true })
      .eq('member_id', memberId)
      .eq('is_read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleDelete = async (id: string) => {
    await supabase.from('team_member_notifications').delete().eq('id', id);

    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'calendar':
      case 'schedule':
        return <Calendar className="w-5 h-5 text-purple-400" />;
      default:
        return <Info className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="command-glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-white/60">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleMarkAllAsRead}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="command-widget p-2 border-0">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className={`flex-1 ${
              filter === 'all'
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant="ghost"
            className={`flex-1 ${
              filter === 'unread'
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setFilter('unread')}
          >
            Unread
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>
            )}
          </Button>
        </div>
      </Card>

      {/* Notifications List */}
      <Card className="command-widget p-4 border-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto text-white/20 mb-4" />
            <p className="text-white/60">
              {filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                    notification.is_read
                      ? 'bg-white/5'
                      : 'bg-indigo-500/10 ring-1 ring-indigo-500/30'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`font-medium ${
                          notification.is_read ? 'text-white/80' : 'text-white'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <span className="text-white/40 text-xs flex-shrink-0">
                        {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>

                    {notification.message && (
                      <p className="text-white/60 text-sm mt-1">{notification.message}</p>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Mark as Read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/40 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
};
