import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Paperclip, Mic, MoreVertical, Search, Pin } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMobileProjectChat } from '@/mobile/hooks/useMobileProjectChat';
import { useTeamMember } from '@/hooks/useTeamMember';
import { MessageBubble } from './chat/MessageBubble';
import { AIMessageSuggestions } from './chat/AIMessageSuggestions';
import { FileUpload } from './chat/FileUpload';
import { MessageSearch } from './chat/MessageSearch';
import { PinnedMessages } from './chat/PinnedMessages';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ProjectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

interface TeamMember {
  user_id: string | null;
  email: string;
  full_name: string | null;
  avatar_url?: string | null;
}

export const ProjectChatModal: React.FC<ProjectChatModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName
}) => {
  const [message, setMessage] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [reactionStates, setReactionStates] = useState<{ [key: string]: boolean }>({});
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const { messages, isLoading, sendMessage } = useMobileProjectChat(projectId, projectName);
  const { getInitials, getDisplayName } = useTeamMember();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch team members for mentions
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members-mentions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_directory')
        .select('user_id, email, full_name')
        .eq('status', 'active')
        .order('full_name');
      
      if (error) throw error;
      
      // Fetch avatar URLs from profiles
      const userIds = data?.map(u => u.user_id).filter(Boolean) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', userIds);
      
      const avatarMap = new Map(profilesData?.map(p => [p.id, p.avatar_url]) || []);
      
      return data?.map(user => ({
        ...user,
        avatar_url: user.user_id ? avatarMap.get(user.user_id) : null
      })) as TeamMember[];
    }
  });

  // Filter team members based on mention search
  const filteredMembers = teamMembers.filter(member => {
    const name = member.full_name || member.email;
    return name.toLowerCase().includes(mentionSearch.toLowerCase());
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset selected mention index when filtered list changes
  useEffect(() => {
    setSelectedMentionIndex(0);
  }, [filteredMembers.length]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    setMessage(value);
    
    // Check for @ symbol
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Check if @ is at start or preceded by a space
      const charBeforeAt = lastAtIndex > 0 ? value[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || lastAtIndex === 0) {
        const searchText = textBeforeCursor.substring(lastAtIndex + 1);
        // Only show if no space after @ (still typing the mention)
        if (!searchText.includes(' ')) {
          setShowMentions(true);
          setMentionSearch(searchText);
          setMentionStartIndex(lastAtIndex);
          setShowAISuggestions(false);
          return;
        }
      }
    }
    
    setShowMentions(false);
    setMentionSearch('');
    setMentionStartIndex(null);
  };

  const handleMentionSelect = (member: TeamMember) => {
    if (mentionStartIndex === null) return;
    
    const displayName = member.full_name || member.email.split('@')[0];
    const beforeMention = message.substring(0, mentionStartIndex);
    const afterMention = message.substring(mentionStartIndex + mentionSearch.length + 1);
    
    const newMessage = `${beforeMention}@${displayName} ${afterMention}`;
    setMessage(newMessage);
    setShowMentions(false);
    setMentionSearch('');
    setMentionStartIndex(null);
    
    // Focus back on input
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sendMessage.isPending) return;

    await sendMessage.mutateAsync(message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredMembers.length - 1 ? prev + 1 : prev
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : prev);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleMentionSelect(filteredMembers[selectedMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    // Mock reaction handling for now
    console.log('Reaction:', messageId, emoji);
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
    setTimeout(() => setShowAISuggestions(false), 200);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setMessage(suggestion);
    setShowAISuggestions(false);
  };

  const handleFileUploaded = async (fileUrl: string, fileName: string, fileType: string, fileSize?: number) => {
    const fileMessage = fileType.startsWith('image/') 
      ? `📸 Image: ${fileName}`
      : `📎 File: ${fileName}`;
    
    const attachments = [{
      url: fileUrl,
      filename: fileName,
      type: fileType,
      size: fileSize
    }];
    
    await sendMessage.mutateAsync({
      message: fileMessage,
      attachments,
      messageType: fileType.startsWith('image/') ? 'image' : 'file'
    });
  };

  const handleMessageSearch = (channelId: string, messageId: string) => {
    setShowSearch(false);
    setSelectedMessage(messageId);
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      messageElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto h-[85vh] flex flex-col p-0 gap-0">
          {/* Clean Header */}
          <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
            <DialogTitle className="text-center text-base font-semibold">{projectName}</DialogTitle>
            <DialogDescription className="sr-only">
              Chat with your project team members
            </DialogDescription>
          </DialogHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-primary">#</span>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Welcome to {projectName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start chatting with your project team members
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  const showAvatar = index === 0 || 
                    messages[index - 1].user_id !== msg.user_id ||
                    (new Date(msg.created_at).getTime() - new Date(messages[index - 1].created_at).getTime()) > 300000;

                  const senderName = getDisplayName(msg.user_id, msg.sender_name);
                  const initials = senderName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const formattedDate = new Date(msg.created_at).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                  });
                  const formattedTime = new Date(msg.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <div 
                      key={msg.id} 
                      id={`message-${msg.id}`}
                      className={selectedMessage === msg.id ? 'bg-primary/5 rounded-lg p-2 -mx-2' : ''}
                    >
                      {/* Sender Name */}
                      {showAvatar && (
                        <p className="text-sm font-medium text-foreground mb-1 ml-12">
                          {senderName}
                        </p>
                      )}
                      
                      {/* Message Row */}
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-9">
                          {showAvatar ? (
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-9" />
                          )}
                        </div>
                        
                        {/* Message Bubble */}
                        <div className="flex-1">
                          <div className="bg-muted/60 rounded-xl px-4 py-2.5 inline-block max-w-full">
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                              {msg.message_text}
                            </p>
                          </div>
                          
                          {/* Timestamp */}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formattedDate}, {formattedTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t px-4 py-3 flex-shrink-0 bg-background">
            <div className="flex items-center gap-2">
              {/* @ Mention Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMessage(prev => prev + '@');
                  inputRef.current?.focus();
                }}
                className="p-2 h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <span className="text-lg">@</span>
              </Button>
              
              <div className="flex-1 relative">
                {/* Mentions Dropdown */}
                {showMentions && filteredMembers.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                    {filteredMembers.slice(0, 6).map((member, index) => (
                      <button
                        key={member.user_id || member.email}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors ${
                          index === selectedMentionIndex ? 'bg-muted' : ''
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleMentionSelect(member);
                        }}
                        onMouseEnter={() => setSelectedMentionIndex(index)}
                      >
                        <Avatar className="h-6 w-6">
                          {member.avatar_url && (
                            <AvatarImage src={member.avatar_url} alt={member.full_name || member.email} />
                          )}
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {(member.full_name || member.email).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate">
                          {member.full_name || member.email.split('@')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={handleMessageChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Touch to add comment"
                  className="bg-transparent border-0 shadow-none focus-visible:ring-0 px-0 text-sm placeholder:text-muted-foreground"
                />
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessage.isPending}
                size="sm"
                className="px-4 h-9 rounded-full"
              >
                Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Upload Sheet */}
      <Sheet open={showFileUpload} onOpenChange={setShowFileUpload}>
        <SheetContent side="bottom" className="h-[70vh]">
          <FileUpload
            channelId={projectId}
            onFileUploaded={handleFileUploaded}
            onCancel={() => setShowFileUpload(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Search Sheet */}
      <Sheet open={showSearch} onOpenChange={setShowSearch}>
        <SheetContent side="bottom" className="h-[70vh]">
          <MessageSearch
            onClose={() => setShowSearch(false)}
            onMessageSelect={handleMessageSearch}
          />
        </SheetContent>
      </Sheet>

      {/* Pinned Messages Sheet */}
      <Sheet open={showPinnedMessages} onOpenChange={setShowPinnedMessages}>
        <SheetContent side="bottom" className="h-[70vh]">
          <PinnedMessages
            channelId={projectId}
            channelName={projectName}
            onMessageClick={(messageId) => {
              setShowPinnedMessages(false);
              handleMessageSearch(projectId, messageId);
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
};