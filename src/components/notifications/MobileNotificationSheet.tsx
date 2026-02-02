import { useState, useEffect, useCallback } from "react";
import { Bell, CheckSquare, MessageSquare, ThumbsUp, ThumbsDown, ListTodo, MessageCircle, X, CheckCheck, Calendar, Clock, FileText, ChevronRight, Users, AtSign, ShieldCheck, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

interface MobileNotificationSheetProps {
  memberId: string | null;
}

export function MobileNotificationSheet({ memberId }: MobileNotificationSheetProps) {
  const navigate = useNavigate();
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

    const channel = supabase
      .channel(`mobile_notifications_${memberId}`)
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

    // Navigate based on reference type first, then action_url
    switch (notification.reference_type) {
      case 'chat':
      case 'conversation':
        if (notification.reference_id) {
          navigate(`/mobile/chat/${notification.reference_id}`);
        }
        break;
      case 'project':
      case 'project_chat':
        if (notification.reference_id) {
          navigate(`/mobile/projects/${notification.reference_id}`);
        }
        break;
      case 'schedule':
        navigate('/mobile/schedule');
        break;
      case 'task':
      case 'subtask':
        if (notification.reference_id && notification.action_url) {
          navigate(notification.action_url);
        } else {
          navigate('/mobile/tasks');
        }
        break;
      case 'request':
        navigate('/mobile/requests');
        break;
      case 'quiz':
        navigate('/mobile/quizzes');
        break;
      default:
        if (notification.action_url) {
          // Convert admin routes to mobile routes
          const mobileRoute = notification.action_url.replace('/admin', '/mobile');
          navigate(mobileRoute);
        }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'feedback_approved':
        return <ThumbsUp className="w-5 h-5 text-emerald-400" />;
      case 'feedback_denied':
        return <ThumbsDown className="w-5 h-5 text-rose-400" />;
      case 'task_assigned':
        return <CheckSquare className="w-5 h-5 text-indigo-400" />;
      case 'task_collaborator':
        return <Users className="w-5 h-5 text-blue-400" />;
      case 'subtask_assigned':
        return <ListTodo className="w-5 h-5 text-purple-400" />;
      case 'message':
      case 'message_received':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-purple-500" />;
      case 'comment_added':
        return <MessageCircle className="w-5 h-5 text-amber-400" />;
      case 'schedule':
      case 'schedule_assigned':
        return <Calendar className="w-5 h-5 text-cyan-400" />;
      case 'time_clock':
        return <Clock className="w-5 h-5 text-green-400" />;
      case 'request':
      case 'request_status':
        return <FileText className="w-5 h-5 text-orange-400" />;
      case 'safety_quiz':
        return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'project_assigned':
        return <FolderOpen className="w-5 h-5 text-blue-400" />;
      case 'project_update':
        return <FolderOpen className="w-5 h-5 text-cyan-400" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const getPriorityStyles = (priority: string, isRead: boolean) => {
    if (isRead) return 'bg-muted/30 border-border/50';

    switch (priority) {
      case 'urgent':
        return 'bg-destructive/10 border-destructive/30';
      case 'high':
        return 'bg-amber-500/10 border-amber-500/30';
      default:
        return 'bg-primary/5 border-primary/20';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "relative p-2 rounded-xl transition-all",
            "text-primary-foreground hover:bg-primary-foreground/10"
          )}
        >
          {/* Elegant glow ring behind the bell */}
          {unreadCount > 0 && (
            <div 
              className={cn(
                "absolute inset-0 rounded-xl",
                hasUrgent ? "animate-bell-glow-urgent" : "animate-bell-glow"
              )} 
            />
          )}
          
          {/* Bell icon with elegant ringing animation */}
          <Bell 
            className={cn(
              "w-5 h-5 relative z-10 transition-colors will-change-transform",
              unreadCount > 0 && "origin-top animate-bell-ring",
              hasUrgent && unreadCount > 0 && "text-rose-200"
            )}
            style={unreadCount > 0 ? {
              animation: 'bell-ring 1.2s ease-in-out infinite',
              transformOrigin: 'top center'
            } : undefined}
          />
          
          {/* Notification badge with bounce animation */}
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1",
              "flex items-center justify-center",
              "text-[10px] font-bold text-white rounded-full",
              "shadow-lg animate-notification-bounce",
              hasUrgent 
                ? "bg-gradient-to-br from-destructive to-rose-600" 
                : "bg-gradient-to-br from-primary to-indigo-600"
            )}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md p-0" hideClose>
        <SheetHeader className="p-4 border-b pt-[max(calc(env(safe-area-inset-top,0px)+16px),16px)]">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </SheetTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
              <SheetClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9 min-h-[44px] min-w-[44px] touch-manipulation"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              </SheetClose>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    "active:scale-[0.98]",
                    getPriorityStyles(notification.priority, notification.is_read)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-background/50">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium",
                          notification.is_read ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {notification.title}
                        </span>
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground/60 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
