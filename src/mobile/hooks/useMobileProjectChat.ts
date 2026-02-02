import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { notifyMention } from '@/utils/sendSmsNotification';
import { createInAppNotification } from '@/hooks/useNotificationBell';

export interface ProjectChatMessage {
  id: string;
  message_text: string;
  user_id: string;
  sender_name: string;
  created_at: string;
  project_id: string;
  is_own: boolean;
  attachments?: Array<{
    url: string;
    filename: string;
    type: string;
    size?: number;
  }>;
}

// Extract @mentions from message text
const extractMentions = (text: string): string[] => {
  const mentionRegex = /@([\w\s]+?)(?=\s@|\s|$)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1].trim());
  }
  return mentions;
};

export const useMobileProjectChat = (projectId: string, projectName?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelName = `project-${projectId}`;

  const messagesQuery = useQuery({
    queryKey: ['mobile-project-chat', projectId],
    queryFn: async (): Promise<ProjectChatMessage[]> => {
      if (!projectId) throw new Error('Project ID required');

      const { data, error } = await supabase
        .from('team_chats')
        .select('*')
        .eq('channel_name', channelName)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return (data || []).map((msg: any) => ({
        id: msg.id,
        message_text: msg.message,
        user_id: msg.sender_user_id,
        sender_name: msg.sender || 'Unknown User',
        created_at: msg.timestamp,
        project_id: projectId,
        is_own: msg.sender_user_id === user?.id,
        attachments: msg.attachments || [],
      }));
    },
    enabled: !!projectId && !!user
  });

  const sendMessage = useMutation({
    mutationFn: async (messageData: string | { message: string; attachments?: any[]; messageType?: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Get user's display name from team directory
      const { data: teamMember } = await supabase
        .from('team_directory')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const senderName = teamMember?.full_name || user.email?.split('@')[0] || 'Unknown';

      // Handle both string and object inputs
      const messageText = typeof messageData === 'string' ? messageData : messageData.message;
      const attachments = typeof messageData === 'object' ? messageData.attachments : undefined;
      const messageType = typeof messageData === 'object' ? messageData.messageType : 'chat';

      const { data, error } = await supabase
        .from('team_chats')
        .insert({
          sender: senderName,
          sender_user_id: user.id,
          message: messageText,
          timestamp: new Date().toISOString(),
          channel_name: channelName,
          message_type: messageType,
          is_important: false,
          attachments: attachments || [],
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Mentions are now handled server-side via database trigger
      // that calls the process-chat-mentions edge function

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-project-chat', projectId] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project_chat_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chats',
          filter: `channel_name=eq.${channelName}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['mobile-project-chat', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    sendMessage
  };
};