import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface ClientPortalMessage {
  id: string;
  message: string;
  senderType: 'client' | 'admin' | 'bot';
  senderName: string;
  timestamp: string;
  isFromClient: boolean;
}

export const useClientPortalChat = (projectId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['client-portal-chat', projectId],
    queryFn: async (): Promise<ClientPortalMessage[]> => {
      if (!projectId) return [];

      // Fetch chatbot conversations for this project
      const { data, error } = await supabase
        .from('client_chatbot_conversations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(msg => ({
        id: msg.id,
        message: msg.message,
        senderType: msg.sender_type as 'client' | 'admin' | 'bot',
        senderName: msg.sender_type === 'client' ? 'Client' : msg.sender_type === 'bot' ? 'Assistant' : 'Admin',
        timestamp: msg.created_at,
        isFromClient: msg.sender_type === 'client'
      }));
    },
    enabled: !!projectId
  });

  const sendMessage = useMutation({
    mutationFn: async (messageText: string) => {
      if (!user || !projectId) throw new Error('Not authenticated or no project');

      const { error } = await supabase
        .from('client_chatbot_conversations')
        .insert({
          project_id: projectId,
          message: messageText,
          sender_type: 'admin',
          message_type: 'text'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portal-chat', projectId] });
      toast.success('Message sent to client');
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  // Real-time subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`admin_client_chat_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_chatbot_conversations',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['client-portal-chat', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return {
    messages,
    isLoading,
    sendMessage
  };
};
