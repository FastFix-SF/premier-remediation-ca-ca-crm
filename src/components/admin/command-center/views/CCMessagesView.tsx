import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatars } from '@/hooks/useAvatars';
import {
  MessageSquare,
  Send,
  Search,
  Plus,
  Inbox,
  SendHorizontal,
  Mail,
  MailOpen,
  User,
} from 'lucide-react';
import { format } from 'date-fns';

interface CCMessagesViewProps {
  memberId: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  is_from_me?: boolean;
}

interface TeamMember {
  user_id: string;
  full_name: string;
}

export const CCMessagesView: React.FC<CCMessagesViewProps> = ({ memberId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState({
    content: '',
  });

  // Collect all user IDs for avatar fetching
  const userIds = useMemo(() => messages.map(m => m.sender_id).filter(Boolean), [messages]);
  const { data: avatarMap = {} } = useAvatars(userIds);

  // Fetch messages from notifications table as a simple message system
  useEffect(() => {
    if (!memberId) return;

    const fetchData = async () => {
      setLoading(true);

      // Get team members for name mapping
      const { data: members } = await supabase
        .from('team_directory')
        .select('user_id, full_name');

      if (members) setTeamMembers(members);
      const memberMap = new Map(members?.map((m) => [m.user_id, m.full_name]) || []);

      // Get notifications as messages
      const { data: notifications } = await supabase
        .from('team_member_notifications')
        .select('*')
        .eq('type', 'message')
        .order('created_at', { ascending: false });

      if (notifications) {
        setMessages(
          notifications.map((n) => ({
            id: n.id,
            sender_id: n.member_id,
            content: n.message || n.title,
            created_at: n.created_at,
            sender_name: memberMap.get(n.member_id) || 'Unknown',
            is_from_me: n.member_id === memberId,
          }))
        );
      }

      setLoading(false);
    };

    fetchData();
  }, [memberId]);

  const filteredMessages = messages.filter((msg) => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (
        !msg.content?.toLowerCase().includes(searchLower) &&
        !msg.sender_name?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    return true;
  });

  const handleSendMessage = async () => {
    if (!memberId || !newMessage.content) return;

    // Create a notification as a message
    const { error } = await supabase.from('team_member_notifications').insert([{
      member_id: memberId,
      type: 'message',
      title: 'Team Message',
      message: newMessage.content,
      is_read: false,
    }]);

    if (!error) {
      setShowCompose(false);
      setNewMessage({ content: '' });
      // Refresh
      const { data: members } = await supabase
        .from('team_directory')
        .select('user_id, full_name');
      const memberMap = new Map(members?.map((m) => [m.user_id, m.full_name]) || []);

      const { data: notifications } = await supabase
        .from('team_member_notifications')
        .select('*')
        .eq('type', 'message')
        .order('created_at', { ascending: false });

      if (notifications) {
        setMessages(
          notifications.map((n) => ({
            id: n.id,
            sender_id: n.member_id,
            content: n.message || n.title,
            created_at: n.created_at,
            sender_name: memberMap.get(n.member_id) || 'Unknown',
            is_from_me: n.member_id === memberId,
          }))
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="command-glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Messages</h1>
              <p className="text-white/60">Team communication</p>
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
            onClick={() => setShowCompose(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      {/* Compose */}
      {showCompose && (
        <Card className="command-glass-card p-6 border-0">
          <h3 className="text-white font-semibold mb-4">New Message</h3>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message..."
              value={newMessage.content}
              onChange={(e) => setNewMessage({ content: e.target.value })}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[120px]"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setShowCompose(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0"
                onClick={handleSendMessage}
                disabled={!newMessage.content}
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <Card className="command-widget p-4 border-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
      </Card>

      {/* Messages List */}
      <Card className="command-widget p-4 border-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-white/20 mb-4" />
            <p className="text-white/60">No messages yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5"
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={avatarMap[message.sender_id] || undefined} alt={message.sender_name} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                      {message.sender_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white font-medium">{message.sender_name}</span>
                      <span className="text-white/40 text-xs">
                        {format(new Date(message.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-white/70 mt-1">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
};
