import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageBubble } from './MessageBubble';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMember } from '@/hooks/useTeamMember';

interface ThreadMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  sender_user_id?: string;
  isOwn: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface MessageThreadProps {
  parentMessage: {
    id: string;
    sender: string;
    message: string;
    timestamp: string;
  };
  channelId: string;
  onClose: () => void;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  parentMessage,
  channelId,
  onClose
}) => {
  const { user } = useAuth();
  const { getCurrentUserDisplayName } = useTeamMember();
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadThreadMessages();
    
    // Set up realtime subscription for thread messages
    const channel = supabase
      .channel(`thread_${parentMessage.id}_realtime`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',  
          schema: 'public',
          table: 'message_threads',
          filter: `parent_message_id=eq.${parentMessage.id}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.sender_user_id !== user?.id) {
            const processedMessage: ThreadMessage = {
              id: newMsg.id,
              sender: newMsg.sender,
              message: newMsg.message,
              timestamp: newMsg.timestamp,
              sender_user_id: newMsg.sender_user_id,
              isOwn: false,
              status: 'delivered',
            };
            setThreadMessages(prev => [...prev, processedMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentMessage.id, user?.id]);

  const loadThreadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('message_threads')
        .select('*')
        .eq('parent_message_id', parentMessage.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const processedMessages: ThreadMessage[] = (data || []).map(msg => ({
        id: msg.id,
        sender: msg.sender,
        message: msg.message,
        timestamp: msg.timestamp,
        sender_user_id: msg.sender_user_id,
        isOwn: msg.sender_user_id === user?.id,
        status: 'delivered' as const,
      }));

      setThreadMessages(processedMessages);
    } catch (error) {
      console.error('Error loading thread messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const senderName = getCurrentUserDisplayName();
    const timestamp = new Date().toISOString();
    
    // Optimistic update
    const optimisticMessage: ThreadMessage = {
      id: `temp_${Date.now()}`,
      sender: senderName,
      message: newMessage.trim(),
      timestamp,
      sender_user_id: user?.id,
      isOwn: true,
      status: 'sending',
    };

    setThreadMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSending(true);

    try {
      const { data, error } = await supabase
        .from('message_threads')
        .insert({
          parent_message_id: parentMessage.id,
          sender: senderName,
          sender_user_id: user?.id,
          message: newMessage.trim(),
          timestamp,
          channel_id: channelId,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Update optimistic message with real ID
      setThreadMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id
          ? { ...msg, id: data.id, status: 'sent' as const }
          : msg
      ));

    } catch (error) {
      console.error('Error sending thread message:', error);
      setThreadMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Thread Header */}
      <div className="sticky top-0 bg-background border-b border-border p-4 z-10">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={onClose}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">Thread</h2>
            <p className="text-xs text-muted-foreground">
              {threadMessages.length} {threadMessages.length === 1 ? 'reply' : 'replies'}
            </p>
          </div>
        </div>
      </div>

      {/* Parent Message */}
      <div className="p-4 bg-muted/30 border-b border-border">
        <div className="flex items-start space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(parentMessage.sender)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">
                {parentMessage.sender}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(parentMessage.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            <p className="text-sm text-foreground mt-1">
              {parentMessage.message}
            </p>
          </div>
        </div>
      </div>

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading thread...</div>
          </div>
        ) : threadMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <span className="text-lg">💬</span>
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">
              Start a thread
            </h3>
            <p className="text-sm text-muted-foreground">
              Reply to this message to start a conversation
            </p>
          </div>
        ) : (
          threadMessages.map((message, index) => {
            const showAvatar = index === 0 || 
              threadMessages[index - 1].sender !== message.sender;
            
            return (
              <div key={message.id} className="message-slide-in">
                <MessageBubble
                  message={message}
                  showAvatar={showAvatar}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Reply to thread..."
              onKeyPress={handleKeyPress}
              className="border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary rounded-2xl"
              disabled={sending}
            />
          </div>
          
          <Button 
            variant="default" 
            size="sm" 
            className="p-2 rounded-full"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};