import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// Points configuration
const POINTS_CONFIG: Record<string, number> = {
  task_completed: 2,
  task_created: 0.5,
  recording_made: 4,
  timer_started: 2,
  timer_stopped: 1,
  message_sent: 1,
  daily_checkin: 3,
  call_completed: 3,
  meeting_joined: 2,
  meeting_hosted: 4,
  note_added: 0.5,
  client_updated: 1,
  schedule_created: 2,
  clock_in: 2,
  clock_out: 1,
};

export type ActivityType = keyof typeof POINTS_CONFIG;

export const useActivityTracker = (memberId: string | null) => {
  const logActivity = useCallback(
    async (
      actionType: ActivityType,
      description: string,
      data?: Record<string, unknown>
    ) => {
      if (!memberId) return;

      const points = POINTS_CONFIG[actionType] || 0;

      try {
        await supabase.from('team_activity_log').insert([{
          member_id: memberId,
          action_type: actionType,
          action_description: description,
          action_data: (data || {}) as Json,
          points,
        }]);
      } catch (err) {
        console.error('Failed to log activity:', err);
      }
    },
    [memberId]
  );

  // Convenience methods
  const logTaskCompleted = useCallback(
    (taskTitle: string) => {
      logActivity('task_completed', `Completed task: ${taskTitle}`, { taskTitle });
    },
    [logActivity]
  );

  const logTaskCreated = useCallback(
    (taskTitle: string) => {
      logActivity('task_created', `Created task: ${taskTitle}`, { taskTitle });
    },
    [logActivity]
  );

  const logTimerStarted = useCallback(
    (taskTitle?: string) => {
      logActivity('timer_started', `Started timer${taskTitle ? `: ${taskTitle}` : ''}`, { taskTitle });
    },
    [logActivity]
  );

  const logTimerStopped = useCallback(
    (durationMinutes: number) => {
      logActivity('timer_stopped', `Stopped timer after ${durationMinutes} minutes`, { durationMinutes });
    },
    [logActivity]
  );

  const logMessageSent = useCallback(
    (recipientName: string) => {
      logActivity('message_sent', `Sent message to ${recipientName}`, { recipientName });
    },
    [logActivity]
  );

  const logDailyCheckin = useCallback(() => {
    logActivity('daily_checkin', 'Daily check-in');
  }, [logActivity]);

  const logClockIn = useCallback(() => {
    logActivity('clock_in', 'Clocked in for work');
  }, [logActivity]);

  const logClockOut = useCallback(() => {
    logActivity('clock_out', 'Clocked out from work');
  }, [logActivity]);

  const logMeetingJoined = useCallback(
    (roomName: string) => {
      logActivity('meeting_joined', `Joined meeting: ${roomName}`, { roomName });
    },
    [logActivity]
  );

  return {
    logActivity,
    logTaskCompleted,
    logTaskCreated,
    logTimerStarted,
    logTimerStopped,
    logMessageSent,
    logDailyCheckin,
    logClockIn,
    logClockOut,
    logMeetingJoined,
  };
};
