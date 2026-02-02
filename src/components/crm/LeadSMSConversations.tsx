import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeadSMSConversationsProps {
  leadId: string;
  leadPhone?: string;
}

interface SMSMessage {
  id: string;
  lead_id: string | null;
  from_phone: string;
  to_phone: string;
  direction: 'inbound' | 'outbound';
  message: string;
  twilio_sid: string | null;
  context: Record<string, unknown>;
  created_at: string;
}

export const LeadSMSConversations: React.FC<LeadSMSConversationsProps> = ({
  leadId,
  leadPhone
}) => {
  const queryClient = useQueryClient();

  // Fetch SMS conversations for this lead
  const { data: messages, isLoading } = useQuery({
    queryKey: ['sms-conversations', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_conversations')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as SMSMessage[];
    },
    enabled: !!leadId
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`sms-conversations-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sms_conversations',
          filter: `lead_id=eq.${leadId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sms-conversations', leadId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, queryClient]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No SMS conversations yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          SMS Conversations
          <span className="text-sm font-normal text-muted-foreground">
            ({messages.length} messages)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  msg.direction === 'outbound'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <div className="flex items-center gap-1 mb-1">
                  {msg.direction === 'outbound' ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownLeft className="h-3 w-3" />
                  )}
                  <span className="text-xs opacity-75">
                    {msg.direction === 'outbound' ? 'Sent' : 'Received'}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                <p className={cn(
                  "text-xs mt-2",
                  msg.direction === 'outbound' 
                    ? 'text-primary-foreground/70' 
                    : 'text-muted-foreground'
                )}>
                  {format(new Date(msg.created_at), 'MMM dd, yyyy h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
