import React, { useState, useEffect } from 'react';
import { Pin, X, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMember } from '@/hooks/useTeamMember';

interface PinnedMessage {
  id: string;
  message: string;
  sender: string;
  sender_user_id?: string;
  timestamp: string;
  channel_name: string;
  pinned_by?: string;
  pinned_at?: string;
}

interface PinnedMessagesProps {
  channelId: string;
  channelName: string;
  onMessageClick?: (messageId: string) => void;
}

export const PinnedMessages: React.FC<PinnedMessagesProps> = ({
  channelId,
  channelName,
  onMessageClick
}) => {
  const { user } = useAuth();
  const { getDisplayName, getCurrentUserDisplayName } = useTeamMember();
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPinnedMessages();
    
    // Set up realtime subscription for pinned messages
    const channel = supabase
      .channel(`pinned_messages_${channelId}_realtime`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pinned_messages'
        },
        () => {
          loadPinnedMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'pinned_messages'
        },
        () => {
          loadPinnedMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  const loadPinnedMessages = async () => {
    try {
      // Use mock data for now until types are updated
      const mockPinnedMessages: PinnedMessage[] = [
        {
          id: '1',
          message: 'Important: Safety meeting tomorrow at 9 AM',
          sender: 'Team Leader',
          sender_user_id: 'user-1',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          channel_name: channelName,
          pinned_by: 'admin-1',
          pinned_at: new Date().toISOString(),
        }
      ];

      setPinnedMessages(mockPinnedMessages);
    } catch (error) {
      console.error('Error loading pinned messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const unpinMessage = async (messageId: string) => {
    try {
      // Mock unpin for now until types are updated
      setPinnedMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error unpinning message:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-muted-foreground text-sm">Loading pinned messages...</div>
      </div>
    );
  }

  if (pinnedMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Pin className="w-8 h-8 text-muted-foreground mb-3" />
        <h3 className="text-base font-medium text-foreground mb-1">
          No Pinned Messages
        </h3>
        <p className="text-sm text-muted-foreground">
          Important messages will appear here when pinned
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 px-2">
        <Pin className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">
          Pinned Messages ({pinnedMessages.length})
        </h3>
      </div>

      {pinnedMessages.map((message) => (
        <Card
          key={message.id}
          className="p-0 border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => onMessageClick?.(message.id)}
        >
          <div className="flex items-start space-x-3 p-3">
            {/* Pin Icon */}
            <div className="flex-shrink-0 mt-1">
              <Pin className="w-3 h-3 text-primary" />
            </div>

            {/* Avatar */}
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(getDisplayName(message.sender_user_id, message.sender))}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  {getDisplayName(message.sender_user_id, message.sender)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              
              {/* Message Content */}
              <p className="text-sm text-foreground line-clamp-3 mb-2">
                {message.message}
              </p>

              {/* Pin Info */}
              <p className="text-xs text-muted-foreground">
                📌 Pinned {message.pinned_at ? formatTime(message.pinned_at) : 'recently'}
                {message.pinned_by && (
                  <span> by {getDisplayName(message.pinned_by)}</span>
                )}
              </p>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMessageClick?.(message.id);
                  }}
                >
                  Go to Message
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    unpinMessage(message.id);
                  }}
                  className="text-destructive"
                >
                  Unpin Message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      ))}
    </div>
  );
};