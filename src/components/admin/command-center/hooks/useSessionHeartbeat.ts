import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const HEARTBEAT_INTERVAL = 60000; // 60 seconds
const INACTIVITY_THRESHOLD = 15 * 60 * 1000; // 15 minutes

export const useSessionHeartbeat = (memberId: string | null) => {
  const sessionIdRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Start session
  const startSession = useCallback(async () => {
    if (!memberId) return;

    try {
      const { data, error } = await supabase
        .from('team_sessions')
        .insert({
          member_id: memberId,
          is_active: true,
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
          },
        })
        .select('id')
        .maybeSingle();

      if (error) throw error;
      sessionIdRef.current = data.id;
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  }, [memberId]);

  // End session
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await supabase
        .from('team_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionIdRef.current);

      sessionIdRef.current = null;
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  }, []);

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!sessionIdRef.current) return;

    const timeSinceActivity = Date.now() - lastActivityRef.current;
    const isActive = timeSinceActivity < INACTIVITY_THRESHOLD;

    try {
      await supabase
        .from('team_sessions')
        .update({
          last_activity_at: new Date().toISOString(),
          is_active: isActive,
        })
        .eq('id', sessionIdRef.current);
    } catch (err) {
      console.error('Failed to send heartbeat:', err);
    }
  }, []);

  useEffect(() => {
    if (!memberId) return;

    // Start session on mount
    startSession();

    // Set up heartbeat interval
    const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // End session on page unload
    const handleBeforeUnload = () => {
      endSession();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
  }, [memberId, startSession, endSession, sendHeartbeat, updateActivity]);

  return { sessionId: sessionIdRef.current };
};
