import { useState, useEffect, useCallback } from "react";
import { Bell, CheckSquare, MessageSquare, ThumbsUp, ThumbsDown, ListTodo, MessageCircle, X, CheckCheck, Calendar, Clock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface TeamNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  reference_id: string | null;
  reference_type: string | null;
  priority: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

interface TeamNotificationBellProps {
  memberId: string | null;
  onNavigate?: (view: string, params?: Record<string, string>) => void;
  variant?: 'sidebar' | 'header';
}

export function TeamNotificationBell({ memberId, onNavigate, variant = 'header' }: TeamNotificationBellProps) {
  const [notifications, setNotifications] = useState<TeamNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!memberId) return;

    try {
      const { data, error } = await supabase
        .from('team_member_notifications')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Map the data to include priority with default
      const mappedData = (data || []).map(n => ({
        ...n,
        priority: n.priority || 'normal'
      }));
      
      setNotifications(mappedData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    if (!memberId) return;

    loadNotifications();

    // Set up realtime subscription for THIS member's notifications
    const channel = supabase
      .channel(`team_notifications_${memberId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'team_member_notifications',
          filter: `member_id=eq.${memberId}`
        },
        (payload) => {
          const newNotification = {
            ...payload.new,
            priority: (payload.new as any).priority || 'normal'
          } as TeamNotification;
          setNotifications(prev => [newNotification, ...prev]);
          // Show toast for new notification
          toast.info(newNotification.title, {
            description: newNotification.message || undefined,
          });
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'team_member_notifications',
          filter: `member_id=eq.${memberId}`
        },
        (payload) => {
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? {
              ...payload.new,
              priority: (payload.new as any).priority || 'normal'
            } as TeamNotification : n)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId, loadNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const hasUrgent = notifications.some(n => !n.is_read && n.priority === 'urgent');

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('team_member_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    if (!memberId) return;

    await supabase
      .from('team_member_notifications')
      .update({ is_read: true })
      .eq('member_id', memberId)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = (notification: TeamNotification) => {
    markAsRead(notification.id);
    setIsOpen(false);

    if (notification.action_url && onNavigate) {
      const url = notification.action_url;
      const viewMatch = url.match(/view=([^&]+)/);
      const view = viewMatch ? viewMatch[1] : 'home';
      onNavigate(view);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'feedback_approved':
        return <ThumbsUp className="w-4 h-4 text-emerald-400" />;
      case 'feedback_denied':
        return <ThumbsDown className="w-4 h-4 text-rose-400" />;
      case 'task_assigned':
        return <CheckSquare className="w-4 h-4 text-indigo-400" />;
      case 'subtask_assigned':
        return <ListTodo className="w-4 h-4 text-purple-400" />;
      case 'message':
      case 'message_received':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'comment_added':
        return <MessageCircle className="w-4 h-4 text-amber-400" />;
      case 'schedule':
      case 'schedule_assigned':
        return <Calendar className="w-4 h-4 text-cyan-400" />;
      case 'time_clock':
        return <Clock className="w-4 h-4 text-green-400" />;
      case 'request':
      case 'request_status':
        return <FileText className="w-4 h-4 text-orange-400" />;
      default:
        return <Bell className="w-4 h-4 text-white/60" />;
    }
  };

  const getPriorityStyles = (priority: string, isRead: boolean) => {
    if (isRead) return 'bg-white/5 border-white/10';

    switch (priority) {
      case 'urgent':
        return 'bg-rose-500/10 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/10 border-amber-500/30';
      default:
        return 'bg-indigo-500/10 border-indigo-500/30';
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-xl transition-all duration-300",
          "hover:scale-105 active:scale-95",
          unreadCount > 0
            ? "bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20"
            : "bg-white/5 hover:bg-white/10"
        )}
      >
        {/* Animated glow ring for unread notifications */}
        {unreadCount > 0 && (
          <>
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-indigo-500/30 animate-pulse" />
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 blur-sm" />
          </>
        )}

        {/* Urgent pulsing ring */}
        {hasUrgent && (
          <span className="absolute -inset-1 rounded-xl border-2 border-rose-500 animate-ping opacity-50" />
        )}

        {/* Bell Icon */}
        <Bell className={cn(
          "w-5 h-5 relative z-10",
          unreadCount > 0 
            ? "text-white animate-[wiggle_0.5s_ease-in-out]" 
            : "text-white/60"
        )} />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className={cn(
            "absolute -top-1 -right-1 z-20 min-w-[18px] h-[18px] px-1",
            "flex items-center justify-center",
            "text-[10px] font-bold text-white rounded-full",
            hasUrgent 
              ? "bg-gradient-to-r from-rose-500 to-pink-500 animate-bounce"
              : "bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse"
          )}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />

          {/* Panel */}
          <div className={cn(
            "absolute z-50 w-80 max-h-[480px] mt-2",
            "bg-[#1a1a2e]/95 backdrop-blur-xl",
            "border border-white/10 rounded-2xl shadow-2xl",
            "flex flex-col overflow-hidden",
            variant === 'sidebar' ? "left-0" : "right-0"
          )}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs text-white/40">{unreadCount} unread</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="flex-1 max-h-[380px]">
              <div className="p-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/60" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "w-full p-3 rounded-xl border text-left transition-all duration-200",
                          "hover:scale-[1.02] hover:shadow-lg",
                          getPriorityStyles(notification.priority, notification.is_read)
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-lg bg-white/5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-sm font-medium truncate",
                                notification.is_read ? "text-white/60" : "text-white"
                              )}>
                                {notification.title}
                              </span>
                              {!notification.is_read && (
                                <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                              )}
                            </div>
                            {notification.message && (
                              <p className="text-xs text-white/40 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-[10px] text-white/30 mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}

      {/* CSS for wiggle animation */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
      `}</style>
    </div>
  );
}
