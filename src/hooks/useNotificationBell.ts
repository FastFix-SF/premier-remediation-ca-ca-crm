import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationCounts {
  total: number;
  unread: number;
  urgent: number;
  messages: number;
}

export function useNotificationBell(memberId: string | null) {
  const [counts, setCounts] = useState<NotificationCounts>({
    total: 0,
    unread: 0,
    urgent: 0,
    messages: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    if (!memberId) return;

    try {
      // Get all unread notifications
      const { data: notifications, error } = await supabase
        .from('team_member_notifications')
        .select('id, is_read, priority, type')
        .eq('member_id', memberId);

      if (error) throw error;

      const all = notifications || [];
      const unread = all.filter(n => !n.is_read);
      const urgent = unread.filter(n => n.priority === 'urgent');
      const messages = unread.filter(n => n.type === 'message' || n.type === 'message_received');

      setCounts({
        total: all.length,
        unread: unread.length,
        urgent: urgent.length,
        messages: messages.length,
      });
    } catch (error) {
      console.error('Failed to fetch notification counts:', error);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    if (!memberId) return;

    fetchCounts();

    // Set up realtime subscription
    const channel = supabase
      .channel(`notification_counts_${memberId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'team_member_notifications',
          filter: `member_id=eq.${memberId}`
        },
        () => {
          // Refetch counts on any change
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId, fetchCounts]);

  return { counts, loading, refetch: fetchCounts };
}

// Helper function to create an in-app notification
export async function createInAppNotification(params: {
  memberId: string;
  type: string;
  title: string;
  message?: string;
  priority?: 'normal' | 'high' | 'urgent';
  referenceId?: string;
  referenceType?: string;
  actionUrl?: string;
}) {
  const { memberId, type, title, message, priority = 'normal', referenceId, referenceType, actionUrl } = params;

  try {
    const { error } = await supabase
      .from('team_member_notifications')
      .insert({
        member_id: memberId,
        type,
        title,
        message: message || null,
        priority,
        reference_id: referenceId || null,
        reference_type: referenceType || null,
        action_url: actionUrl || null,
        is_read: false,
      });

    if (error) {
      console.error('Failed to create notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}
