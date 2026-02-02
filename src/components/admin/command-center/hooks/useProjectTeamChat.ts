import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface TeamChatMessage {
  id: string;
  message: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
  attachments?: any[];
}

export const useProjectTeamChat = (projectId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelName = projectId ? `project-${projectId}` : '';

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['project-team-chat', projectId],
    queryFn: async (): Promise<TeamChatMessage[]> => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('team_chats')
        .select('*')
        .eq('channel_name', channelName)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return (data || []).map(msg => ({
        id: msg.id,
        message: msg.message || '',
        senderId: msg.sender_user_id || '',
        senderName: msg.sender || 'Unknown',
        timestamp: msg.timestamp,
        isOwn: msg.sender_user_id === user?.id,
        attachments: Array.isArray(msg.attachments) ? msg.attachments : []
      }));
    },
    enabled: !!projectId && !!user
  });

  const sendMessage = useMutation({
    mutationFn: async (messageText: string) => {
      if (!user || !projectId) throw new Error('Not authenticated or no project');

      // Get sender name
      const { data: teamMember } = await supabase
        .from('team_directory')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const senderName = teamMember?.full_name || user.email?.split('@')[0] || 'Admin';

      const { error } = await supabase
        .from('team_chats')
        .insert({
          sender: senderName,
          sender_user_id: user.id,
          message: messageText,
          timestamp: new Date().toISOString(),
          channel_name: channelName,
          message_type: 'chat',
          is_important: false,
          attachments: []
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team-chat', projectId] });
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  // Real-time subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`admin_team_chat_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chats',
          filter: `channel_name=eq.${channelName}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-team-chat', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient, channelName]);

  return {
    messages,
    isLoading,
    sendMessage
  };
};
