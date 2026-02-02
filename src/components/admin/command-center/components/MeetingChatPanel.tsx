import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatars } from '@/hooks/useAvatars';
import { X, Send, Paperclip } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_name?: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
}

interface MeetingChatPanelProps {
  roomId: string;
  memberId: string;
  onClose: () => void;
}

export const MeetingChatPanel: React.FC<MeetingChatPanelProps> = ({
  roomId,
  memberId,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [memberNames, setMemberNames] = useState<Map<string, string>>(new Map());

  // Collect all sender IDs for avatar fetching
  const senderIds = useMemo(() => messages.map(m => m.sender_id).filter(Boolean), [messages]);
  const { data: avatarMap = {} } = useAvatars(senderIds);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load member names
  useEffect(() => {
    const loadMemberNames = async () => {
      const { data } = await supabase
        .from('team_directory')
        .select('user_id, full_name');
      
      if (data) {
        const names = new Map(data.map(m => [m.user_id, m.full_name]));
        setMemberNames(names);
      }
    };
    loadMemberNames();
  }, []);

  // Load existing messages and subscribe to new ones
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('meeting_chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`meeting-chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      await supabase.from('meeting_chat_messages').insert({
        room_id: roomId,
        sender_id: memberId,
        content: newMessage.trim(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSenderName = (senderId: string) => {
    if (senderId === memberId) return 'You';
    return memberNames.get(senderId) || 'Unknown';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-white font-semibold">Meeting Chat</h3>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/60 hover:text-white"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-white/40 text-center text-sm">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === memberId;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="w-7 h-7 flex-shrink-0">
                    <AvatarImage src={avatarMap[msg.sender_id] || undefined} alt={getSenderName(msg.sender_id)} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold">
                      {getSenderName(msg.sender_id).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white/60 text-xs">
                        {getSenderName(msg.sender_id)}
                      </span>
                      <span className="text-white/30 text-xs">
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </span>
                    </div>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                        isMe
                          ? 'bg-indigo-500 text-white rounded-br-md'
                          : 'bg-white/10 text-white rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
                      {msg.attachment_url && (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline opacity-80 mt-1 block"
                        >
                          📎 {msg.attachment_name || 'Attachment'}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white shrink-0"
            disabled
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            disabled={isLoading}
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-indigo-400 hover:text-indigo-300 shrink-0"
            onClick={sendMessage}
            disabled={isLoading || !newMessage.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
