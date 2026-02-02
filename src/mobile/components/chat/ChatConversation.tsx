import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Send, ArrowLeft, Paperclip, MoreVertical, Mic, Phone, Video, Search, Pin, Reply, MoreHorizontal, ImageIcon, Camera, Film, FileText, Laugh, MapPin, UserPlus, Link as LinkIcon, Zap, MessageCircle, Info, Plus, CirclePlus, Clock, X, User, Image as ImageIconLucide, Sparkles, Trash2 } from 'lucide-react';
import { GifPicker } from './GifPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMember } from '@/hooks/useTeamMember';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageReactions } from './MessageReactions';
import { VoiceRecorder } from './VoiceMessage';
import { AIMessageSuggestions } from './AIMessageSuggestions';
import { MessageThread } from './MessageThread';
import { FileUpload } from './FileUpload';
import { MessageSearch } from './MessageSearch';
import { PinnedMessages } from './PinnedMessages';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { sendSmsNotification } from '@/utils/sendSmsNotification';
import { sendPushNotification } from '@/utils/sendPushNotification';

interface Message {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  sender_user_id?: string;
  sender_employee_id?: string;
  is_important?: boolean;
  message_type?: string;
  isOwn: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isOptimistic?: boolean;
  reactions?: { emoji: string; count: number; users: string[] }[];
  audio_url?: string;
  duration?: number;
  attachments?: Array<{
    url: string;
    filename: string;
    type: string;
    size?: number;
  }>;
}

export const ChatConversation: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { getCurrentUserDisplayName, getDisplayName, teamMembers } = useTeamMember();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState<string[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [reactionStates, setReactionStates] = useState<{ [key: string]: boolean }>({});
  const [isOnline, setIsOnline] = useState(true);
  const [showThread, setShowThread] = useState(false);
  const [threadMessage, setThreadMessage] = useState<any>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [otherUserPhone, setOtherUserPhone] = useState<string | null>(null);
  const [channelAvatarUrl, setChannelAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get channel name with proper fallbacks
  const getChannelDisplayName = () => {
    // First, try to get the name from location state (passed when navigating)
    if (location.state?.channelName) {
      return location.state.channelName;
    }
    
    // Handle different channel types based on channelId format
    if (channelId?.startsWith('dm-')) {
      // Extract user_id from dm-{user_id} format and look up team member
      const dmUserId = channelId.substring(3);
      const member = teamMembers.find(m => m.user_id === dmUserId);
      if (member) {
        return member.full_name || member.email?.split('@')[0] || 'Unknown User';
      }
      return 'Direct Message';
    } else if (channelId?.startsWith('group-')) {
      return 'Group Chat';
    } else {
      // Default channels - capitalize and format nicely
      return channelId?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General';
    }
  };
  
  const channelName = getChannelDisplayName();

  useEffect(() => {
    if (channelId && user?.id) {
      loadMessages();
      
      // Fetch other user's avatar if it's a DM
      if (channelId.startsWith('dm-')) {
        const otherUserId = channelId.substring(3);
          
        supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', otherUserId)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.avatar_url) {
              setChannelAvatarUrl(data.avatar_url);
            }
          });
      }
      
      // Mark channel as read when opening
      const markChannelAsRead = () => {
        const now = new Date().toISOString();
        if (user?.id) {
          localStorage.setItem(`chat_last_read_${user.id}_${channelId}`, now);
        }
      };
      
      markChannelAsRead();
      
      // Set up realtime subscription based on channel type
      let channel;
      
      if (channelId.startsWith('dm-')) {
        // For direct messages, subscribe to team_messages
        const otherUserId = channelId.substring(3);
        
        channel = supabase
          .channel(`dm_messages_${channelId}_realtime`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'team_messages',
            },
            async (payload) => {
              const newMsg = payload.new as any;
              
              // Only show messages for this conversation
              const { data: conversationData } = await supabase
                .rpc('get_or_create_conversation', {
                  user1_id: user.id,
                  user2_id: otherUserId,
                });
              
              if (newMsg.conversation_id !== conversationData) return;
              
              // Skip if this is our own optimistic message
              if (newMsg.sender_id === user.id) {
                setMessages(prev => prev.map(msg => 
                  msg.isOptimistic && msg.message === newMsg.content
                    ? { ...msg, id: newMsg.id, isOptimistic: false, status: 'sent' }
                    : msg
                ));
                return;
              }
              
              const processedMessage: Message = {
                id: newMsg.id,
                sender: getDisplayName(newMsg.sender_id, ''),
                message: newMsg.content,
                timestamp: newMsg.created_at,
                sender_user_id: newMsg.sender_id,
                is_important: false,
                message_type: 'chat',
                isOwn: false,
                status: 'delivered',
                attachments: newMsg.attachments || [],
              };
              
              setMessages(prev => [...prev, processedMessage]);
            }
          )
          .subscribe();
      } else {
        // For channels, subscribe to team_chats
        const channelNameQuery = channelId || 'General';
        
        channel = supabase
          .channel(`chat_messages_${channelId}_realtime`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'team_chats',
              filter: `channel_name=eq.${channelNameQuery}`
            },
            (payload) => {
              const newMsg = payload.new as any;
              
              // Skip if this is our own optimistic message
              if (newMsg.sender_user_id === user.id) {
                setMessages(prev => prev.map(msg => 
                  msg.isOptimistic && msg.message === newMsg.message
                    ? { ...msg, id: newMsg.id, isOptimistic: false, status: 'sent' }
                    : msg
                ));
                return;
              }
              
              const processedMessage: Message = {
                id: newMsg.id,
                sender: getDisplayName(newMsg.sender_user_id, newMsg.sender),
                message: newMsg.message,
                timestamp: newMsg.timestamp,
                sender_user_id: newMsg.sender_user_id,
                sender_employee_id: newMsg.sender_employee_id,
                is_important: newMsg.is_important,
                message_type: newMsg.message_type,
                isOwn: false,
                status: 'delivered',
                audio_url: newMsg.audio_url,
                duration: newMsg.duration,
                attachments: newMsg.attachments || [],
              };
              
              setMessages(prev => [...prev, processedMessage]);
            }
          )
          .subscribe();
      }

      // Return cleanup function
      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [channelId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchOtherUserPhone = async (userId: string) => {
    try {
      // First try team_directory
      const { data: teamData } = await supabase
        .from('team_directory')
        .select('phone_number')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (teamData?.phone_number) {
        setOtherUserPhone(teamData.phone_number);
        return;
      }
      
      // Fallback to auth.users via RPC function
      const { data: phoneData, error } = await supabase
        .rpc('get_user_phone', { user_id_param: userId });
      
      if (error) throw error;
      
      if (phoneData) {
        setOtherUserPhone(phoneData);
      }
    } catch (error) {
      console.error('Error fetching phone number:', error);
    }
  };

  const handlePhoneCall = () => {
    if (!otherUserPhone) {
      toast.error('Phone number not available');
      return;
    }
    window.location.href = `tel:${otherUserPhone}`;
  };

  const loadMessages = async () => {
    try {
      // Check if this is a direct message conversation
      if (channelId?.startsWith('dm-')) {
        const otherUserId = channelId.substring(3);
        
        // Get or create the conversation
        const { data: conversationData, error: convError } = await supabase
          .rpc('get_or_create_conversation', {
            user1_id: user?.id,
            user2_id: otherUserId,
          });

        if (convError) throw convError;
        
        const conversationId = conversationData as string;

        // Load messages from team_messages table
        const { data, error } = await supabase
          .from('team_messages')
          .select('id, conversation_id, sender_id, content, created_at, is_deleted, attachments')
          .eq('conversation_id', conversationId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) throw error;

        const processedMessages = (data ?? []).reverse().map((msg: any) => ({
          id: msg.id,
          sender: getDisplayName(msg.sender_id, ''),
          message: msg.content,
          timestamp: msg.created_at,
          sender_user_id: msg.sender_id,
          is_important: false,
          message_type: 'chat',
          isOwn: msg.sender_id === user?.id,
          status: 'delivered' as const,
          attachments: msg.attachments || [],
        })) || [];

        setMessages(processedMessages);
      } else {
        // Load channel messages from team_chats table
        const channelNameQuery = channelId || 'General';
        
        const { data, error } = await supabase
          .from('team_chats')
          .select('id, sender, sender_user_id, sender_employee_id, message, timestamp, channel_name, message_type, is_important, audio_url, duration, attachments')
          .eq('channel_name', channelNameQuery)
          .order('timestamp', { ascending: false })
          .limit(30);

        if (error) throw error;

        const processedMessages = (data ?? []).reverse().map((msg: any) => ({
          id: msg.id,
          sender: getDisplayName(msg.sender_user_id, msg.sender),
          message: msg.message,
          timestamp: msg.timestamp,
          sender_user_id: msg.sender_user_id,
          sender_employee_id: msg.sender_employee_id,
          is_important: msg.is_important,
          message_type: msg.message_type,
          isOwn: msg.sender_user_id === user?.id,
          status: 'delivered' as const,
          audio_url: (msg as any).audio_url ?? undefined,
          duration: typeof (msg as any).duration === 'number' ? (msg as any).duration : undefined,
          attachments: msg.attachments || [],
        })) || [];

        setMessages(processedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };


  // Remove this function as we now use the hook

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageText: string = newMessage.trim()) => {
    if (!messageText || sending) return;

    const senderName = getCurrentUserDisplayName();
    const timestamp = new Date().toISOString();
    
    // Optimistic update - add message immediately
    const optimisticMessage: Message = {
      id: `temp_${Date.now()}`,
      sender: senderName,
      message: messageText,
      timestamp,
      sender_user_id: user?.id,
      message_type: 'chat',
      is_important: false,
      isOwn: true,
      status: 'sending',
      isOptimistic: true,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setShowAISuggestions(false);
    setSending(true);

    try {
      // Check if this is a direct message
      if (channelId?.startsWith('dm-')) {
        const otherUserId = channelId.substring(3);
        
        // Get or create the conversation
        const { data: conversationData, error: convError } = await supabase
          .rpc('get_or_create_conversation', {
            user1_id: user?.id,
            user2_id: otherUserId,
          });

        if (convError) throw convError;
        
        const conversationId = conversationData as string;

        // Insert into team_messages
        const { error } = await supabase
          .from('team_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user?.id,
            content: messageText,
          });

        if (error) throw error;

        // Send SMS notification to the recipient
        console.log('📱 Sending SMS notification to user:', otherUserId);
        try {
          await sendSmsNotification({
            userId: otherUserId,
            title: `New message from ${senderName}`,
            body: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
            data: {
              type: 'message',
              conversationId,
              senderId: user?.id,
            }
          });
          console.log('✅ SMS notification sent successfully');
          
          // Also send push notification for future native app support
          await sendPushNotification({
            userId: otherUserId,
            title: `New message from ${senderName}`,
            body: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
            data: {
              type: 'message',
              conversationId,
              senderId: user?.id,
            }
          });
        } catch (notifError) {
          console.error('❌ Error sending notifications:', notifError);
          // Don't throw - we don't want to fail the message send if notifications fail
        }
      } else {
        // Insert into team_chats for channels
        const channelNameForDb = channelId || 'General';
        
        const { error } = await supabase
          .from('team_chats')
          .insert({
            sender: senderName,
            sender_user_id: user?.id,
            message: messageText,
            timestamp,
            channel_name: channelNameForDb,
            message_type: 'chat',
            is_important: false,
          });

        if (error) throw error;
      }

      // Update optimistic message to sent status
      setMessages(prev => prev.map(msg => 
        msg.isOptimistic && msg.message === messageText
          ? { ...msg, status: 'sent' as const }
          : msg
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.isOptimistic && msg.message === messageText
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!window.confirm('Are you sure you want to clear this chat history? This action cannot be undone.')) {
      return;
    }

    try {
      const channelNameForDb = channelId || 'General';
      
      // Delete all messages in this chat
      const { error } = await supabase
        .from('team_chats')
        .delete()
        .eq('channel_name', channelNameForDb);

      if (error) throw error;

      // Clear messages locally
      setMessages([]);
      
      // Show success message
      alert('Chat history cleared successfully');
    } catch (error) {
      console.error('Error clearing chat history:', error);
      alert('Failed to clear chat history. Please try again.');
    }
  };

  const handleVoiceMessage = async (audioBlob: Blob, duration: number) => {
    try {
      console.log('🎤 Starting voice message...', { 
        blobSize: audioBlob.size, 
        duration, 
        blobType: audioBlob.type 
      });

      const channelNameForDb = channelId?.replace(/-/g, ' ') || 'General';
      const senderName = getCurrentUserDisplayName();
      const timestamp = new Date().toISOString();
      
      // Convert audio blob to base64 data URL for embedding
      const reader = new FileReader();
      const audioDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      console.log('🎤 Audio converted to data URL');

      // Optimistic update with voice message
      const optimisticMessage: Message = {
        id: `temp_${Date.now()}`,
        sender: senderName,
        message: `🎤 Voice message (${Math.floor(duration)}s)`,
        timestamp,
        sender_user_id: user?.id,
        message_type: 'voice',
        is_important: false,
        isOwn: true,
        status: 'sending',
        isOptimistic: true,
        audio_url: audioDataUrl,
        duration: duration,
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setSending(true);

      // Send to database with audio data URL
      console.log('🎤 Inserting to database...');

      const { data: insertData, error } = await supabase
        .from('team_chats')
        .insert({
          sender: senderName,
          sender_user_id: user?.id,
          message: `🎤 Voice message (${Math.floor(duration)}s)`,
          timestamp,
          channel_name: channelNameForDb,
          message_type: 'voice',
          is_important: false,
          audio_url: audioDataUrl,
          duration: duration,
        })
        .select();

      if (error) {
        console.error('🎤 Database insert error:', error);
        throw error;
      }

      console.log('🎤 Database insert successful:', insertData);

      // Update optimistic message to sent status
      setMessages(prev => prev.map(msg => 
        msg.isOptimistic && msg.audio_url === audioDataUrl
          ? { ...msg, status: 'sent' as const, isOptimistic: false }
          : msg
      ));

      console.log('🎤 Voice message sent successfully!');

    } catch (error) {
      console.error('🎤 Error sending voice message:', error);
      
      // Remove optimistic message and show error
      setMessages(prev => prev.filter(msg => !msg.isOptimistic || !msg.message.includes('Voice message')));
      
      toast.error('Failed to send voice message. Please try again.');
    } finally {
      setSending(false);
      setShowVoiceRecorder(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    // In a real implementation, you would store reactions in the database
    console.log('Reaction:', messageId, emoji);
    
    // Mock reaction update
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          existingReaction.count += 1;
        } else {
          reactions.push({ emoji, count: 1, users: [user?.id || ''] });
        }
        
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  const toggleReactionPicker = (messageId: string) => {
    setReactionStates(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleInputFocus = () => {
    setShowAISuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowAISuggestions(false), 200);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setNewMessage(suggestion);
    setShowAISuggestions(false);
  };

  const retryMessage = async (message: Message) => {
    if (message.status !== 'failed') return;

    setMessages(prev => prev.map(msg => 
      msg.id === message.id
        ? { ...msg, status: 'sending' as const }
        : msg
    ));

    try {
      const channelNameForDb = channelId?.replace(/-/g, ' ') || 'General';
      
      const { error } = await supabase
        .from('team_chats')
        .insert({
          sender: message.sender,
          sender_user_id: message.sender_user_id,
          message: message.message,
          timestamp: new Date().toISOString(),
          channel_name: channelNameForDb,
          message_type: 'chat',
          is_important: false,
        });

      if (error) throw error;

      setMessages(prev => prev.map(msg => 
        msg.id === message.id
          ? { ...msg, status: 'sent' as const }
          : msg
      ));

    } catch (error) {
      console.error('Error retrying message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === message.id
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    }
  };

  const openThread = (message: Message) => {
    setThreadMessage(message);
    setShowThread(true);
  };

  const pinMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .rpc('pin_message', {
          message_id: messageId,
          chat_id: channelId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  const handleFileUploaded = async (fileUrl: string, fileName: string, fileType: string, fileSize?: number) => {
    const senderName = getCurrentUserDisplayName();
    const timestamp = new Date().toISOString();
    
    const fileMessage = fileType.startsWith('image/') 
      ? `📸 Image: ${fileName}`
      : `📎 File: ${fileName}`;

    const attachments = [{
      url: fileUrl,
      filename: fileName,
      type: fileType,
      size: fileSize
    }];
    
    // Optimistic update with attachment
    const optimisticMessage: Message = {
      id: `temp_${Date.now()}`,
      sender: senderName,
      message: fileMessage,
      timestamp,
      sender_user_id: user?.id,
      message_type: fileType.startsWith('image/') ? 'image' : 'file',
      is_important: false,
      isOwn: true,
      status: 'sending',
      isOptimistic: true,
      attachments,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setSending(true);
    setShowFileUpload(false);

    try {
      // Check if this is a direct message
      if (channelId?.startsWith('dm-')) {
        const otherUserId = channelId.substring(3);
        
        // Get or create the conversation
        const { data: conversationData, error: convError } = await supabase
          .rpc('get_or_create_conversation', {
            user1_id: user?.id,
            user2_id: otherUserId,
          });

        if (convError) throw convError;
        
        const conversationId = conversationData as string;

        // Insert into team_messages with attachments
        const { error } = await supabase
          .from('team_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user?.id,
            content: fileMessage,
            attachments,
          });

        if (error) throw error;

        // Send notifications to the recipient
        try {
          await sendSmsNotification({
            userId: otherUserId,
            title: `New message from ${senderName}`,
            body: fileMessage,
            data: {
              type: 'message',
              conversationId,
              senderId: user?.id,
            }
          });
          
          await sendPushNotification({
            userId: otherUserId,
            title: `New message from ${senderName}`,
            body: fileMessage,
            data: {
              type: 'message',
              conversationId,
              senderId: user?.id,
            }
          });
        } catch (notifError) {
          console.error('❌ Error sending notifications:', notifError);
        }
      } else {
        // Insert into team_chats for channels
        const channelNameForDb = channelId || 'General';
        
        const { error } = await supabase
          .from('team_chats')
          .insert({
            sender: senderName,
            sender_user_id: user?.id,
            message: fileMessage,
            timestamp,
            channel_name: channelNameForDb,
            message_type: fileType.startsWith('image/') ? 'image' : 'file',
            is_important: false,
            attachments,
          });

        if (error) throw error;
      }

      // Update optimistic message to sent status
      setMessages(prev => prev.map(msg => 
        msg.isOptimistic && msg.message === fileMessage
          ? { ...msg, status: 'sent' as const }
          : msg
      ));

    } catch (error) {
      console.error('Error sending file message:', error);
      
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.isOptimistic && msg.message === fileMessage
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
    } finally {
      setSending(false);
    }
  };

  const handleMessageSearch = (channelId: string, messageId: string) => {
    setShowSearch(false);
    setSelectedMessage(messageId);
    // Scroll to message
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      messageElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleDeleteConversation = async () => {
    try {
      let otherUserId: string | null = null;
      let conversationId: string | null = null;

      // Try to get the user ID from channelId if it's a direct message
      if (channelId?.startsWith('dm-')) {
        otherUserId = channelId.substring(3);
      } else if (location.state?.targetUserId) {
        otherUserId = location.state.targetUserId;
      }

      if (!otherUserId) {
        toast.error('Unable to identify conversation');
        return;
      }
      
      // Get the conversation ID
      const { data: conversationData, error: convError } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: user?.id,
          user2_id: otherUserId
        });

      if (convError) {
        console.error('Error getting conversation:', convError);
        toast.error('Failed to delete conversation');
        return;
      }

      conversationId = conversationData;

      if (!conversationId) {
        toast.error('Conversation not found');
        return;
      }

      // Delete all messages in the conversation
      const { error: messagesError } = await supabase
        .from('team_messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        toast.error('Failed to delete messages');
        return;
      }

      // Delete the conversation
      const { error: convDeleteError } = await supabase
        .from('direct_conversations')
        .delete()
        .eq('id', conversationId);

      if (convDeleteError) {
        console.error('Error deleting conversation:', convDeleteError);
        toast.error('Failed to delete conversation');
        return;
      }

      toast.success('Conversation deleted');
      setShowChatInfo(false);
      setShowDeleteDialog(false);
      navigate('/mobile/messages');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Upload the file to Supabase storage first
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `chat-files/${channelId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('project-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-photos')
        .getPublicUrl(filePath);

      await handleFileUploaded(urlData.publicUrl, file.name, file.type, file.size);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#E8F0F2]">
      {/* Simplified Header */}
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={() => navigate('/mobile/messages')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="relative">
              <Avatar className="w-10 h-10">
                {channelAvatarUrl && (
                  <AvatarImage src={channelAvatarUrl} alt={channelName || 'Unknown'} />
                )}
                <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                  {getInitials(channelName || 'Unknown')}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div 
              className={cn(
                "flex-1",
                channelId?.startsWith('project-') && "cursor-pointer active:opacity-70"
              )}
              onClick={() => {
                if (channelId?.startsWith('project-')) {
                  const projectId = channelId.replace('project-', '');
                  navigate(`/mobile/projects/${projectId}`);
                }
              }}
            >
              <h2 className="text-base font-medium text-foreground">
                {channelName || 'Loading...'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {location.state?.isDirect 
                  ? 'Last seen on Oct 16'
                  : `${messages.length} messages`
                }
              </p>
            </div>
          </div>
          
          {/* Action buttons - only phone and info */}
          <div className="flex items-center space-x-2">
            {channelId?.startsWith('dm-') && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2"
                onClick={handlePhoneCall}
                disabled={!otherUserPhone}
              >
                <Phone className="w-5 h-5 text-muted-foreground" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-5 h-5 text-destructive" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={() => setShowChatInfo(true)}
            >
              <Info className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Welcome to {channelName}
            </h3>
            <p className="text-sm text-muted-foreground">
              This is the beginning of your conversation.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const showAvatar = index === 0 || 
                messages[index - 1].sender !== message.sender ||
                (new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime()) > 300000; // 5 minutes
              
              return (
                <div 
                  key={message.id} 
                  id={`message-${message.id}`}
                  className={`message-slide-in group relative ${
                    selectedMessage === message.id ? 'bg-primary/10 rounded-lg p-2 -m-2' : ''
                  }`}
                >
                  <MessageBubble
                    message={message}
                    showAvatar={showAvatar}
                    onRetry={message.status === 'failed' ? () => retryMessage(message) : undefined}
                  />
                  
                  {/* Message Actions */}
                  <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center space-x-1 bg-background border border-border rounded-lg p-1 shadow-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6"
                        onClick={() => openThread(message)}
                      >
                        <Reply className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6"
                        onClick={() => toggleReactionPicker(message.id)}
                      >
                        <span className="text-xs">😀</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6"
                        onClick={() => pinMessage(message.id)}
                      >
                        <Pin className="w-3 h-3" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6"
                          >
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openThread(message)}>
                            Start Thread
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => pinMessage(message.id)}>
                            Pin Message
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Copy Text
                          </DropdownMenuItem>
                          {message.isOwn && (
                            <>
                              <DropdownMenuItem>
                                Edit Message
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Delete Message
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <MessageReactions
                    messageId={message.id}
                    reactions={message.reactions}
                    onReact={handleReaction}
                    showReactionPicker={reactionStates[message.id]}
                    onToggleReactionPicker={() => toggleReactionPicker(message.id)}
                  />
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            <TypingIndicator typingUsers={typing} />
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* AI Suggestions */}
      <AIMessageSuggestions
        lastMessage={messages[messages.length - 1]?.message}
        channelContext={channelName || 'General'}
        onSuggestionSelect={handleSuggestionSelect}
        isVisible={showAISuggestions && newMessage.length === 0}
      />

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background border-t border-border">
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        {showVoiceRecorder ? (
          <div className="p-4">
            <VoiceRecorder
              onSendVoiceMessage={handleVoiceMessage}
              onCancel={() => setShowVoiceRecorder(false)}
              isRecording={isRecording}
              onStartRecording={() => setIsRecording(true)}
              onStopRecording={() => setIsRecording(false)}
            />
          </div>
        ) : (
          <div className="p-3 bg-background border-t border-border">
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 rounded-full"
                  >
                    <CirclePlus className="w-6 h-6 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                  <div className="grid grid-cols-3 gap-4">
                    <button 
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs text-muted-foreground">Gallery</span>
                    </button>
                    
                    <button 
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => {
                        cameraInputRef.current?.click();
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs text-muted-foreground">Take photo</span>
                    </button>
                    
                    <button 
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => {
                        videoInputRef.current?.click();
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-lime-500 flex items-center justify-center">
                        <Film className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs text-muted-foreground">Record video</span>
                    </button>
                    
                    <button 
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => {
                        documentInputRef.current?.click();
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs text-muted-foreground">File</span>
                    </button>
                    
                    <button 
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setShowGifPicker(true)}
                    >
                      <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs text-muted-foreground">GIF</span>
                    </button>
                    
                    <button 
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const { latitude, longitude } = position.coords;
                              const locationMessage = `📍 Location: https://maps.google.com/?q=${latitude},${longitude}`;
                              handleSendMessage(locationMessage);
                            },
                            (error) => {
                              console.error('Error getting location:', error);
                              toast.error('Unable to get your location. Please enable location access.');
                            }
                          );
                        } else {
                          toast.error('Geolocation is not supported by your browser.');
                        }
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs text-muted-foreground">Location</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <div className="flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={handleKeyPress}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className="border-0 bg-muted/30 focus-visible:ring-0 rounded-full px-4"
                  disabled={sending}
                />
              </div>
              
              {newMessage.trim() ? (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 rounded-full"
                    onClick={() => setShowScheduleSheet(true)}
                  >
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 rounded-full"
                    onClick={() => handleSendMessage()}
                  >
                    <Send className="w-5 h-5 text-primary" />
                  </Button>
                </>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 rounded-full"
                  onClick={() => setShowVoiceRecorder(true)}
                >
                  <Mic className="w-6 h-6 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sheets for additional features */}
      <Sheet open={showThread} onOpenChange={setShowThread}>
        <SheetContent side="right" className="p-0 w-full">
          {threadMessage && (
            <MessageThread
              parentMessage={threadMessage}
              channelId={channelId || ''}
              onClose={() => setShowThread(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={showFileUpload} onOpenChange={setShowFileUpload}>
        <SheetContent side="bottom" className="p-0 h-[80vh]">
          <FileUpload
            channelId={channelId || ''}
            onFileUploaded={handleFileUploaded}
            onCancel={() => setShowFileUpload(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={showSearch} onOpenChange={setShowSearch}>
        <SheetContent side="right" className="p-0 w-full">
          <MessageSearch
            onClose={() => setShowSearch(false)}
            onMessageSelect={handleMessageSearch}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={showPinnedMessages} onOpenChange={setShowPinnedMessages}>
        <SheetContent side="right" className="p-0 w-full">
          <div className="p-4">
            <PinnedMessages
              channelId={channelId || ''}
              channelName={channelName || ''}
              onMessageClick={(messageId) => {
                setShowPinnedMessages(false);
                handleMessageSearch(channelId || '', messageId);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Schedule Message Sheet */}
      <Sheet open={showScheduleSheet} onOpenChange={setShowScheduleSheet}>
        <SheetContent side="bottom" className="p-0 h-[80vh]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Schedule Message</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Message Preview */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Message to schedule:</p>
                <p className="text-sm">{newMessage}</p>
              </div>

              {/* Date Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Date</label>
                <div className="border border-border rounded-lg p-4">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                    className={cn("p-0 pointer-events-auto")}
                  />
                </div>
              </div>

              {/* Time Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Time</label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => {
                    const selectedTime = e.target.value;
                    setScheduleTime(selectedTime);
                    
                    // Validate if today is selected
                    if (scheduleDate) {
                      const today = new Date();
                      const selectedDate = new Date(scheduleDate);
                      
                      if (selectedDate.toDateString() === today.toDateString()) {
                        const [hours, minutes] = selectedTime.split(':').map(Number);
                        const selectedDateTime = new Date();
                        selectedDateTime.setHours(hours, minutes, 0, 0);
                        
                        const minTime = new Date(today.getTime() + 30 * 60000); // 30 minutes from now
                        
                        if (selectedDateTime < minTime) {
                          toast.error('Please select a time at least 30 minutes from now');
                          setScheduleTime('');
                        }
                      }
                    }
                  }}
                  className="w-full"
                />
                {scheduleDate && scheduleDate.toDateString() === new Date().toDateString() && (
                  <p className="text-xs text-muted-foreground">
                    Minimum time: {format(new Date(Date.now() + 30 * 60000), 'h:mm a')}
                  </p>
                )}
              </div>

              {/* Schedule Summary */}
              {scheduleDate && scheduleTime && (
                <div className="bg-primary/10 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">Scheduled for:</p>
                  <p className="text-sm">
                    {format(scheduleDate, 'PPPP')} at {scheduleTime}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <Button
                className="w-full"
                disabled={!scheduleDate || !scheduleTime}
                onClick={() => {
                  if (scheduleDate && scheduleTime) {
                    toast.success(`Message scheduled for ${format(scheduleDate, 'PP')} at ${scheduleTime}`);
                    setShowScheduleSheet(false);
                    setScheduleDate(undefined);
                    setScheduleTime('');
                  }
                }}
              >
                Schedule Message
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Chat Info Sheet */}
      <Sheet open={showChatInfo} onOpenChange={setShowChatInfo}>
        <SheetContent side="bottom" className="h-[90vh]">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Chat Info</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {location.state?.isDirect && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center text-center py-6">
                    <Avatar className="w-24 h-24 mb-4">
                      {channelAvatarUrl && (
                        <AvatarImage src={channelAvatarUrl} alt={channelName || 'Unknown'} />
                      )}
                      <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-medium">
                        {getInitials(channelName || 'Unknown')}
                      </AvatarFallback>
                    </Avatar>
                    <h4 className="text-xl font-semibold">{channelName}</h4>
                    <p className="text-sm text-muted-foreground mt-1">Direct Message</p>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Conversation
                    </Button>
                  </div>
                </div>
              )}
              {!location.state?.isDirect && (
                <p className="text-muted-foreground">Chat information will appear here</p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This will permanently delete all messages and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* GIF Picker */}
      <GifPicker
        isOpen={showGifPicker}
        onSelectGif={(gifUrl) => {
          console.log('GIF selected:', gifUrl);
          handleSendMessage(gifUrl);
          setShowGifPicker(false);
        }}
        onClose={() => setShowGifPicker(false)}
      />
    </div>
  );
};