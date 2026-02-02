import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FeedbackItem {
  id: string;
  feedback_text: string;
  selected_element: any;
  ai_suggestion: any;
  suggestion_status: string;
  fix_status: string;
  status: string;
  priority: string;
  category: string;
}

export const useFeedbackAutoFix = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const notifiedIds = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Query for feedback items ready to fix
  const { data: readyToFix } = useQuery({
    queryKey: ['feedback-ready-to-fix'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_feedback')
        .select('*')
        .eq('suggestion_status', 'completed')
        .in('fix_status', ['pending', 'fix_ready'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FeedbackItem[];
    },
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Mutation to update fix_status
  const updateFixStatus = useMutation({
    mutationFn: async ({ id, fix_status }: { id: string; fix_status: string }) => {
      const { error } = await supabase
        .from('admin_feedback')
        .update({ fix_status } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-ready-to-fix'] });
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });

  // Helper to get page route from element
  const getPageRoute = (element: any): string | null => {
    try {
      const parsed = JSON.parse(element as string);
      return parsed.pageRoute || null;
    } catch {
      return null;
    }
  };

  // Generate fix prompt
  const generateFixPrompt = useCallback((feedback: FeedbackItem): string => {
    const ai = feedback.ai_suggestion;
    const pageRoute = getPageRoute(feedback.selected_element);

    return `## Fix Request from User Feedback

**Original Feedback:** "${feedback.feedback_text}"

**Priority:** ${ai?.priority || feedback.priority || 'medium'}
**Category:** ${ai?.category || feedback.category || 'general'}
${pageRoute ? `**Page:** ${pageRoute}` : ''}

### Files to Check:
${ai?.likelyFiles?.length > 0 ? ai.likelyFiles.map((f: string) => `- ${f}`).join('\n') : 'None identified'}

### Diagnosis:
${ai?.diagnosis || 'No diagnosis available'}

### Suggested Fix:
${ai?.suggestedFix || 'No fix suggested'}

### Implementation Steps:
${ai?.implementation || 'No steps provided'}

Please implement this fix based on the above analysis.`;
  }, []);

  // Copy to clipboard and notify
  const copyFixPrompt = useCallback(async (feedback: FeedbackItem) => {
    const prompt = generateFixPrompt(feedback);
    await navigator.clipboard.writeText(prompt);
    
    // Update status to fix_in_progress
    updateFixStatus.mutate({ id: feedback.id, fix_status: 'fix_in_progress' });

    toast({
      title: "Fix Copied!",
      description: `Paste in Lovable to fix: "${feedback.feedback_text.slice(0, 50)}..."`,
    });

    return prompt;
  }, [generateFixPrompt, toast, updateFixStatus]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Show browser notification
  const showNotification = useCallback((title: string, body: string, onClick?: () => void) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'feedback-fix',
        requireInteraction: true,
      });
      
      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!audioRef.current) {
      // Use a simple beep sound
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2telexi2yPq8XAIAFgD+/AIEAwIDAQIDAQIBAQEB');
    }
    audioRef.current.play().catch(() => {});
  }, []);

  // Auto-notify when new fixes are ready
  useEffect(() => {
    if (!readyToFix) return;

    readyToFix.forEach((feedback) => {
      // Only notify for items that transitioned to completed recently
      if (feedback.fix_status === 'pending' && !notifiedIds.current.has(feedback.id)) {
        notifiedIds.current.add(feedback.id);
        
        // Mark as fix_ready
        updateFixStatus.mutate({ id: feedback.id, fix_status: 'fix_ready' });
        
        // Show toast
        toast({
          title: "🔧 Fix Ready!",
          description: `Click to copy fix for: "${feedback.feedback_text.slice(0, 50)}..."`,
          duration: 10000,
        });

        // Browser notification
        showNotification(
          'Fix Ready!',
          `Feedback: "${feedback.feedback_text.slice(0, 100)}..."`,
          () => copyFixPrompt(feedback)
        );

        // Sound
        playNotificationSound();
      }
    });
  }, [readyToFix, toast, copyFixPrompt, showNotification, playNotificationSound, updateFixStatus]);

  // Subscribe to realtime changes for immediate updates
  useEffect(() => {
    const instanceId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`feedback-analysis-complete-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_feedback',
          filter: 'suggestion_status=eq.completed',
        },
        (payload) => {
          // Refetch to get updated data
          queryClient.invalidateQueries({ queryKey: ['feedback-ready-to-fix'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    readyToFix: readyToFix || [],
    copyFixPrompt,
    updateFixStatus: updateFixStatus.mutate,
    generateFixPrompt,
    requestNotificationPermission,
  };
};
