import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CommunicationEntry {
  id: string;
  type: 'chatbot' | 'sms' | 'client_message' | 'project_update';
  sender: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export const useClientCommunications = (projectId: string | undefined, clientPhone?: string | null) => {
  // Fetch chatbot conversations
  const { data: chatbotMessages = [], isLoading: chatbotLoading } = useQuery({
    queryKey: ['client-chatbot', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('client_chatbot_conversations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(msg => ({
        id: msg.id,
        type: 'chatbot' as const,
        sender: msg.sender_type === 'bot' ? 'Chatbot' : 'Client',
        content: msg.message,
        timestamp: msg.created_at,
        metadata: { senderType: msg.sender_type }
      }));
    },
    enabled: !!projectId
  });

  // Fetch client messages - uses sender_type to determine who sent
  const { data: clientMessages = [], isLoading: clientMessagesLoading } = useQuery({
    queryKey: ['client-messages-project', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      // client_messages links to sales_clients, not projects directly
      // We'll fetch via project portal access if available
      const { data: portalAccess } = await supabase
        .from('client_portal_access')
        .select('client_id')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (!portalAccess?.client_id) return [];
      
      const { data, error } = await supabase
        .from('client_messages')
        .select('*')
        .eq('client_id', portalAccess.client_id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(msg => ({
        id: msg.id,
        type: 'client_message' as const,
        sender: msg.sender_type === 'client' ? 'Client' : 'Team',
        content: msg.message,
        timestamp: msg.created_at,
        metadata: { senderType: msg.sender_type }
      }));
    },
    enabled: !!projectId
  });

  // Fetch project updates
  const { data: projectUpdates = [], isLoading: updatesLoading } = useQuery({
    queryKey: ['client-project-updates', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_updates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(update => ({
        id: update.id,
        type: 'project_update' as const,
        sender: 'Team',
        content: update.content,
        timestamp: update.created_at,
        metadata: { title: update.title }
      }));
    },
    enabled: !!projectId
  });

  // Fetch SMS conversations if phone is available
  const { data: smsMessages = [], isLoading: smsLoading } = useQuery({
    queryKey: ['client-sms', clientPhone],
    queryFn: async () => {
      if (!clientPhone) return [];
      // Normalize phone for search
      const normalizedPhone = clientPhone.replace(/\D/g, '');
      const { data, error } = await supabase
        .from('sms_conversations')
        .select('*')
        .or(`from_phone.ilike.%${normalizedPhone}%,to_phone.ilike.%${normalizedPhone}%`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(sms => ({
        id: sms.id,
        type: 'sms' as const,
        sender: sms.direction === 'inbound' ? 'Client' : 'Team',
        content: sms.message,
        timestamp: sms.created_at,
        metadata: { direction: sms.direction }
      }));
    },
    enabled: !!clientPhone
  });

  // Combine all communications and sort by timestamp
  const allCommunications: CommunicationEntry[] = [
    ...chatbotMessages,
    ...clientMessages,
    ...projectUpdates,
    ...smsMessages
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    communications: allCommunications,
    chatbotMessages,
    clientMessages,
    projectUpdates,
    smsMessages,
    isLoading: chatbotLoading || clientMessagesLoading || updatesLoading || smsLoading
  };
};
