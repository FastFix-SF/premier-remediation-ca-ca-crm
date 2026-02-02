import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { sendPushNotification } from '@/utils/sendPushNotification';
import { sendSmsNotification } from '@/utils/sendSmsNotification';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_deleted: boolean;
  attachments?: Array<{
    url: string;
    filename: string;
    type: string;
    size?: number;
  }>;
}

export const useDirectConversation = (otherUserId: string | null) => {
  const queryClient = useQueryClient();

  // Get or create conversation
  const { data: conversationId } = useQuery({
    queryKey: ['conversation', otherUserId],
    queryFn: async () => {
      if (!otherUserId) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: user.id,
          user2_id: otherUserId,
        });

      if (error) throw error;
      return data as string;
    },
    enabled: !!otherUserId,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  // Get messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('team_messages')
        .select('id, conversation_id, sender_id, content, created_at, is_deleted, attachments')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      return (data as Message[]).reverse(); // Reverse since we ordered desc for limit
    },
    enabled: !!conversationId,
    staleTime: 30 * 1000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ content, attachments }: { content: string; attachments?: Array<{url: string; filename: string; type: string; size?: number}> }) => {
      if (!conversationId) throw new Error('No conversation');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('team_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          attachments: attachments || [],
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: async (message) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        
        // Send notifications to the recipient
        if (otherUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: senderProfile } = await supabase
          .from('team_directory')
          .select('full_name')
          .eq('user_id', user?.id)
          .maybeSingle();
        
        const senderName = senderProfile?.full_name || 'Someone';
        const preview = message.content.length > 50 
          ? message.content.substring(0, 50) + '...' 
          : message.content;
        
        // Send push notification
        await sendPushNotification({
          userId: otherUserId,
          title: `New message from ${senderName}`,
          body: preview,
          data: {
            type: 'message',
            conversationId,
            senderId: user?.id,
          }
        });

        // Send SMS notification
        try {
          await sendSmsNotification({
            userId: otherUserId,
            title: `💬 New message from ${senderName}`,
            body: preview,
            data: {
              type: 'message',
              conversationId,
              senderId: user?.id,
            }
          });
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
        }
      }
      } catch (error) {
        console.error('Error in onSuccess callback:', error);
      }
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
  };
};
