import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AgentConversation {
  id: string;
  user_id: string;
  category: string;
  title: string | null;
  last_message: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface AgentConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  agent_type: string | null;
  confidence: number | null;
  structured_data: any;
  created_at: string;
}

export const useAgentConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ['agent-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('agent_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as AgentConversation[];
    },
    enabled: !!user?.id,
  });

  const createConversation = useMutation({
    mutationFn: async ({ category, title }: { category: string; title?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('agent_conversations')
        .insert({
          user_id: user.id,
          category,
          title: title || `${category} conversation`,
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data as AgentConversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-conversations'] });
    },
  });

  const updateConversation = useMutation({
    mutationFn: async ({ id, last_message, message_count }: { 
      id: string; 
      last_message?: string; 
      message_count?: number;
    }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (last_message !== undefined) updates.last_message = last_message;
      if (message_count !== undefined) updates.message_count = message_count;
      
      const { error } = await supabase
        .from('agent_conversations')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-conversations'] });
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agent_conversations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-conversations'] });
    },
  });

  return {
    conversations: conversationsQuery.data || [],
    isLoading: conversationsQuery.isLoading,
    createConversation,
    updateConversation,
    deleteConversation,
  };
};

export const useAgentConversationMessages = (conversationId: string | null) => {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['agent-conversation-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data, error } = await supabase
        .from('agent_conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as AgentConversationMessage[];
    },
    enabled: !!conversationId,
  });

  const addMessage = useMutation({
    mutationFn: async (message: Omit<AgentConversationMessage, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('agent_conversation_messages')
        .insert(message)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data as AgentConversationMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-conversation-messages', conversationId] });
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    addMessage,
  };
};
