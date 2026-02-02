import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ClientMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  clientName?: string;
}

interface ChatMessage {
  id: string;
  message: string;
  sender: string;
  sender_user_id: string | null;
  timestamp: string;
  is_client: boolean;
}

export const ClientMessagesModal: React.FC<ClientMessagesModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  clientName
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const channelName = `project-${projectId}`;

  const { data: messages, isLoading } = useQuery({
    queryKey: ['client-messages', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_chats')
        .select('id, message, sender, sender_user_id, timestamp')
        .eq('channel_name', channelName)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      // Mark client messages (those without a sender_user_id or with "Client" prefix)
      return (data || []).map(msg => ({
        ...msg,
        is_client: !msg.sender_user_id || msg.sender?.startsWith('Client:')
      })) as ChatMessage[];
    },
    enabled: isOpen && !!projectId
  });

  const sendMessage = useMutation({
    mutationFn: async (messageText: string) => {
      const senderName = `Client: ${clientName || 'Customer'}`;
      
      const { data, error } = await supabase
        .from('team_chats')
        .insert({
          sender: senderName,
          sender_user_id: null, // Client messages don't have a user_id
          message: messageText,
          timestamp: new Date().toISOString(),
          channel_name: channelName,
          message_type: 'client_message',
          is_important: false,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Notify project team
      try {
        await supabase.functions.invoke('notify-photo-comment', {
          body: {
            projectId,
            commentText: messageText,
            commenterName: clientName || 'Customer',
            annotationType: 'message',
          }
        });
      } catch (err) {
        console.error('Failed to send notification:', err);
      }

      return data;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['client-messages', projectId] });
      toast.success('Message sent');
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!isOpen || !projectId) return;

    const channel = supabase
      .channel(`client_chat_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chats',
          filter: `channel_name=eq.${channelName}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['client-messages', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, projectId, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage.mutate(newMessage.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messages
          </DialogTitle>
          {projectName && (
            <p className="text-sm text-muted-foreground">{projectName}</p>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-muted rounded-lg h-12" />
                ))}
              </div>
            ) : messages?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Send a message to your project team</p>
              </div>
            ) : (
              messages?.map(msg => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex gap-2",
                    msg.is_client ? "justify-end" : "justify-start"
                  )}
                >
                  {!msg.is_client && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div 
                    className={cn(
                      "max-w-[75%] rounded-lg p-3",
                      msg.is_client 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    )}
                  >
                    {!msg.is_client && (
                      <p className="text-xs font-medium mb-1">{msg.sender}</p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p className={cn(
                      "text-[10px] mt-1",
                      msg.is_client ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {format(parseISO(msg.timestamp), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t flex-shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMessage.isPending}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMessage.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
