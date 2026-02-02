import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useFastoConversationPersistence() {
  const conversationIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  const startConversation = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      userIdRef.current = user.id;

      const { data, error } = await supabase
        .from('agent_conversations')
        .insert({
          user_id: user.id,
          category: 'fasto_voice',
          title: `Voice Session - ${new Date().toLocaleString()}`,
          message_count: 0
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('[FastoConversation] Error creating conversation:', error);
        return null;
      }

      conversationIdRef.current = data.id;
      console.log('[FastoConversation] Started conversation:', data.id);
      return data.id;
    } catch (err) {
      console.error('[FastoConversation] Error:', err);
      return null;
    }
  }, []);

  const saveMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!conversationIdRef.current || !content.trim()) return;

    try {
      // Save message
      const { error: msgError } = await supabase
        .from('agent_conversation_messages')
        .insert({
          conversation_id: conversationIdRef.current,
          role,
          content,
          agent_type: 'fasto_voice'
        });

      if (msgError) {
        console.error('[FastoConversation] Error saving message:', msgError);
        return;
      }

      // Update conversation metadata
      await supabase
        .from('agent_conversations')
        .update({
          last_message: content.slice(0, 100),
          message_count: await getMessageCount(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationIdRef.current);

      console.log('[FastoConversation] Saved message:', role, content.slice(0, 50));
    } catch (err) {
      console.error('[FastoConversation] Error:', err);
    }
  }, []);

  const getMessageCount = async () => {
    if (!conversationIdRef.current) return 0;
    
    const { count } = await supabase
      .from('agent_conversation_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationIdRef.current);
    
    return count || 0;
  };

  const endConversation = useCallback(async () => {
    if (conversationIdRef.current) {
      // Update final title with message count
      const count = await getMessageCount();
      if (count > 0) {
        await supabase
          .from('agent_conversations')
          .update({
            title: `Voice Session (${count} messages)`,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationIdRef.current);
      }
    }
    conversationIdRef.current = null;
  }, []);

  const loadPreviousMessages = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from('agent_conversation_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[FastoConversation] Error loading messages:', error);
      return [];
    }

    return data || [];
  }, []);

  return {
    conversationId: conversationIdRef.current,
    startConversation,
    saveMessage,
    endConversation,
    loadPreviousMessages
  };
}