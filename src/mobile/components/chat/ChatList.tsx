import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, Hash, Plus, BellOff, Archive, Pin, Check, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import { DirectMessagesList } from './DirectMessagesList';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ChatChannel {
  id: string;
  name: string;
  type: 'channel' | 'direct';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  participants: string[];
  lastSender?: string;
  timestamp?: string;
  avatarUrl?: string;
  userId?: string;
  projectThumbnail?: string;
  isProjectChat?: boolean;
}

interface ChatListProps {
  searchQuery?: string;
  filter?: 'all' | 'unread' | 'teams';
}

export const ChatList: React.FC<ChatListProps> = ({ searchQuery = '', filter = 'all' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: teamMembers = [], isLoading: teamMembersLoading } = useTeamMembers();
  const [showDirectMessages, setShowDirectMessages] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<{ channelId: string; x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Use React Query for caching chat channels
  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['chat-channels', user?.id],
    queryFn: () => loadChatChannels(),
    enabled: !!user?.id && !teamMembersLoading && teamMembers.length > 0,
    staleTime: 2 * 60 * 1000, // Data fresh for 2 minutes
    gcTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
  });

  // Set up realtime subscriptions to invalidate cache
  useEffect(() => {
    if (!user?.id) return;

    // Use unique channel names to prevent duplicate subscription errors
    const instanceId = Math.random().toString(36).substring(7);

    const channelChats = supabase
      .channel(`team_chats_list_realtime-${user.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chats'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-channels', user?.id] });
        }
      )
      .subscribe();

    const channelMessages = supabase
      .channel(`team_messages_list_realtime-${user.id}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-channels', user?.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelChats);
      supabase.removeChannel(channelMessages);
    };
  }, [user?.id, queryClient]);

  // Get the last read timestamp for a channel (user-specific)
  const getLastReadTime = (channelId: string): string | null => {
    if (!user?.id) return null;
    const stored = localStorage.getItem(`chat_last_read_${user.id}_${channelId}`);
    return stored;
  };

  // Set the last read timestamp for a channel (user-specific)
  const setLastReadTime = (channelId: string, timestamp: string) => {
    if (!user?.id) return;
    localStorage.setItem(`chat_last_read_${user.id}_${channelId}`, timestamp);
  };

  // Calculate unread count based on messages after last read time
  const calculateUnreadCount = (channelId: string, messages: any[]): number => {
    const lastReadTime = getLastReadTime(channelId);
    if (!lastReadTime || !messages.length) return 0;
    
    // Handle both timestamp (team_chats) and created_at (team_messages)
    return messages.filter(msg => {
      const messageTime = msg.timestamp || msg.created_at;
      const isAfterLastRead = messageTime && new Date(messageTime) > new Date(lastReadTime);
      const isNotFromCurrentUser = msg.sender_id !== user?.id && msg.sender_user_id !== user?.id;
      return isAfterLastRead && isNotFromCurrentUser;
    }).length;
  };

  const loadChatChannels = async () => {
    try {
      if (!user?.id) return;

      // First, get direct conversations for this user
      const { data: conversations, error: convError } = await supabase
        .from('direct_conversations')
        .select('id, participant_one_id, participant_two_id, last_message_at, created_at')
        .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      // Fetch ALL messages for all conversations in ONE query (much faster!)
      const conversationIds = conversations?.map(c => c.id) || [];
      const { data: allDirectMessages } = conversationIds.length > 0 
        ? await supabase
            .from('team_messages')
            .select('*')
            .in('conversation_id', conversationIds)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
        : { data: null };

      // Group messages by conversation_id for quick lookup
      const messagesByConversation = new Map<string, any[]>();
      allDirectMessages?.forEach(msg => {
        if (!messagesByConversation.has(msg.conversation_id)) {
          messagesByConversation.set(msg.conversation_id, []);
        }
        messagesByConversation.get(msg.conversation_id)!.push(msg);
      });

      // Get team_chats only for channels (not DMs) or filter by user
      const { data: chatsData, error } = await supabase
        .from('team_chats')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Fetch all profiles to get avatar URLs
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url');

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.avatar_url]) || []);

      // Group by channel and get latest message info
      const channelMap = new Map<string, ChatChannel>();
      
      // Add some default channels
      const defaultChannels = [
        { name: 'General', type: 'channel' as const },
        { name: 'Project Updates', type: 'channel' as const },
        { name: 'Daily Operations', type: 'channel' as const },
        { name: 'Logistics', type: 'channel' as const },
      ];

      defaultChannels.forEach(ch => {
        const channelId = ch.name.toLowerCase().replace(/\s+/g, '-');
        channelMap.set(channelId, {
          id: channelId,
          name: ch.name,
          type: ch.type,
          unreadCount: 0,
          participants: [],
        });
      });

      // Group messages by channel to calculate unread counts properly
      const messagesByChannel = new Map<string, any[]>();
      chatsData?.forEach(chat => {
        const channelName = chat.channel_name || 'General';
        const channelId = channelName.toLowerCase().replace(/\s+/g, '-');
        
        if (!messagesByChannel.has(channelId)) {
          messagesByChannel.set(channelId, []);
        }
        messagesByChannel.get(channelId)?.push(chat);
      });

      // Process direct conversations from direct_conversations table
      for (const conv of conversations || []) {
        const otherUserId = conv.participant_one_id === user.id 
          ? conv.participant_two_id 
          : conv.participant_one_id;
        
        // Get the other user's info
        const member = teamMembers.find(m => m.user_id === otherUserId);
        if (!member) {
          console.log('Member not found for userId:', otherUserId);
          continue;
        }

        const displayName = member.full_name || member.email?.split('@')[0] || 'Unknown User';
        const avatarUrl = profilesMap.get(member.user_id);
        const channelId = `dm-${member.user_id}`;

        // Get messages from the cached map (no more individual queries!)
        const conversationMessages = messagesByConversation.get(conv.id) || [];
        const lastMessage = conversationMessages[0]; // First one is the latest
        const unreadCount = calculateUnreadCount(channelId, conversationMessages);
        
        if (lastMessage) {
          const messageTime = formatTime(lastMessage.created_at);

          channelMap.set(channelId, {
            id: channelId,
            name: displayName,
            type: 'direct',
            lastMessage: lastMessage.content,
            lastMessageTime: messageTime,
            lastSender: lastMessage.sender_id === user.id ? 'You' : displayName,
            unreadCount: unreadCount,
            participants: [otherUserId],
            timestamp: lastMessage.created_at,
            avatarUrl,
            userId: member.user_id,
          });
        } else {
          // Show conversation even if there are no messages yet
          channelMap.set(channelId, {
            id: channelId,
            name: displayName,
            type: 'direct',
            lastMessage: 'No messages yet',
            lastMessageTime: formatTime(conv.created_at),
            lastSender: undefined,
            unreadCount: 0,
            participants: [otherUserId],
            timestamp: conv.created_at,
            avatarUrl,
            userId: member.user_id,
          });
        }
      }

      // Process channel messages (not DMs) from team_chats
      // First, collect all project IDs from project channels
      const projectIds = new Set<string>();
      chatsData?.forEach(chat => {
        const channelName = chat.channel_name || 'General';
        // Check if this is a project channel (format: project-<uuid>)
        if (channelName.startsWith('project-') && channelName.length > 40) {
          const projectId = channelName.replace('project-', '');
          projectIds.add(projectId);
        }
      });

      // Fetch project names and photo thumbnails for all project channels in one query
      const projectNamesMap = new Map<string, string>();
      const projectThumbnailsMap = new Map<string, string>();
      if (projectIds.size > 0) {
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', Array.from(projectIds));
        
        projectsData?.forEach(project => {
          projectNamesMap.set(project.id, project.name);
        });

        // Fetch project photos separately
        const { data: photosData } = await supabase
          .from('project_photos')
          .select('project_id, photo_url, is_highlighted_before, is_highlighted_after, display_order')
          .in('project_id', Array.from(projectIds))
          .order('is_highlighted_before', { ascending: false })
          .order('is_highlighted_after', { ascending: false })
          .order('display_order', { ascending: true });

        // Map first photo for each project
        const photosByProject = new Map<string, string>();
        photosData?.forEach(photo => {
          if (!photosByProject.has(photo.project_id)) {
            photosByProject.set(photo.project_id, photo.photo_url);
          }
        });

        photosByProject.forEach((photoUrl, projectId) => {
          projectThumbnailsMap.set(projectId, photoUrl);
        });
      }

      chatsData?.forEach(chat => {
        const channelName = chat.channel_name || 'General';
        
        // Skip DM channels - we already processed them above
        if (channelName.toLowerCase().startsWith('dm ') || channelName.toLowerCase().startsWith('dm-')) {
          return;
        }

        let displayName = channelName;
        let projectThumbnail: string | undefined;
        let isProjectChat = false;
        
        // Check if this is a project channel and replace with project name
        if (channelName.startsWith('project-') && channelName.length > 40) {
          const projectId = channelName.replace('project-', '');
          const projectName = projectNamesMap.get(projectId);
          if (projectName) {
            displayName = projectName;
            projectThumbnail = projectThumbnailsMap.get(projectId);
            isProjectChat = true;
          }
        }
        
        let channelType: 'channel' | 'direct' = 'channel';
        let channelId = channelName.toLowerCase().replace(/\s+/g, '-');
        
        const existingChannel = channelMap.get(channelId);
        const messageTime = formatTime(chat.timestamp);
        
        // Get sender display name from team members
        const sender = teamMembers.find(m => m.user_id === chat.sender_user_id);
        const senderName = sender?.full_name || chat.sender || 'Unknown';
        
        if (existingChannel) {
          // Always update with the latest message (since data is ordered by timestamp desc)
          const currentMessageTime = existingChannel.lastMessageTime;
          if (!currentMessageTime || new Date(chat.timestamp) > new Date(existingChannel.lastMessageTime || '1970-01-01')) {
            const channelMessages = messagesByChannel.get(channelId) || [];
            const unreadCount = calculateUnreadCount(channelId, channelMessages);
            
            channelMap.set(channelId, {
              ...existingChannel,
              name: displayName,
              type: channelType,
              lastMessage: chat.message,
              lastMessageTime: messageTime,
              lastSender: senderName,
              unreadCount: unreadCount,
              timestamp: chat.timestamp,
              projectThumbnail,
              isProjectChat,
            });
          }
        } else {
          const channelMessages = messagesByChannel.get(channelId) || [];
          const unreadCount = calculateUnreadCount(channelId, channelMessages);
          
          channelMap.set(channelId, {
            id: channelId,
            name: displayName,
            type: channelType,
            lastMessage: chat.message,
            lastMessageTime: messageTime,
            lastSender: senderName,
            unreadCount: unreadCount,
            participants: [],
            timestamp: chat.timestamp,
            projectThumbnail,
            isProjectChat,
          });
        }
      });

      // Convert to array and sort by timestamp (newest first)
      const sortedChannels = Array.from(channelMap.values()).sort((a, b) => {
        const aTime = a.timestamp || a.lastMessageTime || '1970-01-01';
        const bTime = b.timestamp || b.lastMessageTime || '1970-01-01';
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      return sortedChannels;
    } catch (error) {
      console.error('Error loading chat channels:', error);
      return [];
    }
  };


  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleChannelPress = (channel: ChatChannel) => {
    // Mark channel as read when opening it
    const now = new Date().toISOString();
    setLastReadTime(channel.id, now);
    
    // Update the channel's unread count immediately in cache
    queryClient.setQueryData(['chat-channels', user?.id], (oldData: ChatChannel[] | undefined) => 
      oldData?.map(ch => 
        ch.id === channel.id 
          ? { ...ch, unreadCount: 0 }
          : ch
      ) ?? []
    );
    
    navigate(`/mobile/messages/chat/${channel.id}`, {
      state: { channelName: channel.name }
    });
  };

  const handleLongPressStart = (e: React.TouchEvent, channelId: string) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    
    longPressTimerRef.current = setTimeout(() => {
      // Show context menu
      const touch = touchStartRef.current;
      if (touch) {
        setContextMenu({ channelId, x: touch.x, y: touch.y });
      }
    }, 500); // 500ms long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    touchStartRef.current = null;
  };

  const handleMarkAsUnread = (channelId: string) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setLastReadTime(channelId, yesterday.toISOString());
    
    queryClient.setQueryData(['chat-channels', user?.id], (oldData: ChatChannel[] | undefined) => 
      oldData?.map(ch => 
        ch.id === channelId 
          ? { ...ch, unreadCount: 1 }
          : ch
      ) ?? []
    );
    setContextMenu(null);
  };

  const handleArchiveConversation = (channelId: string) => {
    // For now, just remove from list - in production, you'd save to a separate archived list
    queryClient.setQueryData(['chat-channels', user?.id], (oldData: ChatChannel[] | undefined) => 
      oldData?.filter(ch => ch.id !== channelId) ?? []
    );
    setContextMenu(null);
  };

  const handleMuteNotifications = (channelId: string) => {
    // Store mute status in localStorage (user-specific)
    if (user?.id) {
      localStorage.setItem(`chat_muted_${user.id}_${channelId}`, 'true');
    }
    setContextMenu(null);
  };

  const handlePinConversation = (channelId: string) => {
    // Store pin status in localStorage (user-specific)
    if (user?.id) {
      localStorage.setItem(`chat_pinned_${user.id}_${channelId}`, 'true');
    }
    setContextMenu(null);
  };

  const handleDeleteConversation = async (channelId: string) => {
    setContextMenu(null);
    
    // Show confirmation
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const channel = channels.find(ch => ch.id === channelId);
      
      if (channel?.type === 'direct' && channel.userId) {
        // For direct messages, find the conversation between current user and the other user
        const { data: conversations, error: fetchError } = await supabase
          .from('direct_conversations')
          .select('id, participant_one_id, participant_two_id')
          .or(`participant_one_id.eq.${user?.id},participant_two_id.eq.${user?.id}`)
          .or(`participant_one_id.eq.${channel.userId},participant_two_id.eq.${channel.userId}`);

        if (fetchError) {
          console.error('Error fetching conversations:', fetchError);
          toast.error('Failed to find conversation');
          return;
        }

        // Find the conversation where both users are participants
        const conversation = conversations?.find(conv => 
          (conv.participant_one_id === user?.id && conv.participant_two_id === channel.userId) ||
          (conv.participant_one_id === channel.userId && conv.participant_two_id === user?.id)
        );

        if (conversation) {
          console.log('Deleting conversation:', conversation.id);
          
          // Delete all messages in this conversation first
          const { error: messagesError } = await supabase
            .from('team_messages')
            .delete()
            .eq('conversation_id', conversation.id);

          if (messagesError) {
            console.error('Error deleting messages:', messagesError);
            toast.error('Failed to delete messages');
            return;
          }

          // Delete the conversation
          const { error: convError } = await supabase
            .from('direct_conversations')
            .delete()
            .eq('id', conversation.id);

          if (convError) {
            console.error('Error deleting conversation:', convError);
            toast.error('Failed to delete conversation');
            return;
          }

          console.log('Conversation deleted successfully');
        } else {
          console.warn('Conversation not found');
        }
      }

      // Remove from UI cache
      queryClient.setQueryData(['chat-channels', user?.id], (oldData: ChatChannel[] | undefined) => 
        oldData?.filter(ch => ch.id !== channelId) ?? []
      );
      toast.success('Conversation deleted successfully');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const getChannelIcon = (type: string) => {
    return type === 'direct' ? <MessageCircle className="w-5 h-5" /> : <Hash className="w-5 h-5" />;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Only show loading if no cached data exists
  if ((isLoading || teamMembersLoading) && channels.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground text-sm">Loading chats...</div>
      </div>
    );
  }

  // Filter channels based on search and filter
  const filteredChannels = channels.filter(channel => {
    // Apply search filter first
    const matchesSearch = searchQuery === '' || 
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (channel.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    // Apply category filter
    let matchesFilter = true;
    if (filter === 'unread') {
      matchesFilter = channel.unreadCount > 0;
    } else if (filter === 'teams') {
      // Show only group chats (more than 2 participants) and channels (including project chats)
      matchesFilter = channel.type === 'channel' || channel.participants.length >= 2;
    } else {
      // For 'all' filter, exclude channel-type conversations (green profile pictures)
      if (channel.type === 'channel') {
        return false;
      }
    }
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 relative">
      {/* Context Menu */}
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setContextMenu(null)}
          />
          <div 
            className="fixed z-50 bg-background border border-border rounded-xl shadow-2xl overflow-hidden min-w-[240px]"
            style={{ 
              left: `${Math.min(contextMenu.x, window.innerWidth - 260)}px`,
              top: `${Math.min(contextMenu.y, window.innerHeight - 200)}px`
            }}
          >
            <button
              onClick={() => handleMarkAsUnread(contextMenu.channelId)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left"
            >
              <Check className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Mark as unread</span>
            </button>
            <button
              onClick={() => handleArchiveConversation(contextMenu.channelId)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left"
            >
              <Archive className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Archive conversation</span>
            </button>
            <button
              onClick={() => handleMuteNotifications(contextMenu.channelId)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left"
            >
              <BellOff className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Mute notifications</span>
            </button>
            <button
              onClick={() => handlePinConversation(contextMenu.channelId)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left"
            >
              <Pin className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Pin conversation</span>
            </button>
            <button
              onClick={() => handleDeleteConversation(contextMenu.channelId)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-left border-t border-border"
            >
              <Trash2 className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium text-destructive">Delete conversation</span>
            </button>
          </div>
        </>
      )}

      {filteredChannels.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-medium text-foreground mb-1">
            {searchQuery ? 'No matches found' : 'No conversations yet'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Try a different search' : 'Start chatting with your team'}
          </p>
        </div>
      ) : (
        <div>
          {filteredChannels.map((channel) => (
            <div 
              key={channel.id} 
              className="group px-4 py-3 cursor-pointer hover:bg-accent/50 transition-all duration-150 active:bg-accent border-b border-border/50 last:border-0"
              onClick={() => handleChannelPress(channel)}
              onTouchStart={(e) => handleLongPressStart(e, channel.id)}
              onTouchEnd={handleLongPressEnd}
              onTouchMove={handleLongPressEnd}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {channel.type === 'channel' ? (
                    channel.isProjectChat && channel.projectThumbnail ? (
                      <div className="w-11 h-11 rounded-lg overflow-hidden shadow-sm">
                        <img 
                          src={channel.projectThumbnail} 
                          alt={channel.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-sm">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    )
                  ) : (
                    <Avatar className="w-11 h-11 shadow-sm">
                      {channel.avatarUrl && (
                        <AvatarImage src={channel.avatarUrl} alt={channel.name} />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold text-sm">
                        {getInitials(channel.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {channel.type === 'channel' && channel.participants.length > 2 && (
                        <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {channel.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {channel.lastMessageTime && (
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">
                          {channel.lastMessageTime}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {channel.lastMessage && (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] text-muted-foreground truncate flex-1">
                        {channel.lastMessage}
                      </p>
                      
                      {channel.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] text-primary-foreground font-bold">
                            {channel.unreadCount > 9 ? '9+' : channel.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};