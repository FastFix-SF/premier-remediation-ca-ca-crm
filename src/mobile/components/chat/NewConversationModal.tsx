import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageCircle, Users, Circle, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useTeamMember } from '@/hooks/useTeamMember';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teamMembers, getInitials, getRoleColor, getCurrentUserDisplayName } = useTeamMember();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [profilesMap, setProfilesMap] = useState<Map<string, string>>(new Map());

  // Filter out current user from team members list
  const otherTeamMembers = teamMembers.filter(member => member.user_id !== user?.id);

  // Fetch profile pictures
  React.useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('id, avatar_url');
      if (data) {
        setProfilesMap(new Map(data.map(p => [p.id, p.avatar_url || ''])));
      }
    };
    fetchProfiles();
  }, []);

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleStartDirectMessage = async (member: any) => {
    try {
      const channelId = `dm-${member.user_id}`;
      const channelName = member.full_name || member.email?.split('@')[0] || 'Unknown';

      // Check if conversation already exists
      const { data: existingMessages } = await supabase
        .from('team_chats')
        .select('id')
        .eq('channel_name', channelName)
        .limit(1);

      // Navigate to the conversation (existing or new)
      navigate(`/mobile/messages/chat/${channelId}`, {
        state: { 
          channelName,
          isDirect: true,
          targetUserId: member.user_id
        }
      });
      onClose();
    } catch (error) {
      console.error('Error starting direct message:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (selectedMembers.length === 0) return;
    
    if (selectedMembers.length === 1) {
      // Single member selected - start direct message
      const member = teamMembers.find(m => m.user_id === selectedMembers[0]);
      if (member) {
        await handleStartDirectMessage(member);
      }
      return;
    }

    try {
      // Multiple members - create group
      const finalGroupName = groupName.trim() || `Group with ${selectedMembers.length} members`;
      const channelId = `group-${Date.now()}`;
      
      navigate(`/mobile/messages/chat/${channelId}`, {
        state: { 
          channelName: finalGroupName,
          isDirect: false,
          isNewGroup: true,
          groupMembers: selectedMembers
        }
      });
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const resetModal = () => {
    setSelectedMembers([]);
    setGroupName('');
    setIsCreatingGroup(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Mock online status - in real app, this would come from presence
  const getOnlineStatus = () => Math.random() > 0.5;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              {isCreatingGroup ? 'Create Group Chat' : 'New Conversation'}
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Toggle between direct and group chat */}
          <div className="flex space-x-2 mb-4">
            <Button
              variant={!isCreatingGroup ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setIsCreatingGroup(false);
                setSelectedMembers([]);
                setGroupName('');
              }}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Direct Message
            </Button>
            <Button
              variant={isCreatingGroup ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsCreatingGroup(true)}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              Group Chat
            </Button>
          </div>

          {/* Group name input (only for group chat) */}
          {isCreatingGroup && (
            <div className="mb-4">
              <Input
                placeholder="Group name (optional)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Selected members preview (only for group chat) */}
          {isCreatingGroup && selectedMembers.length > 0 && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-2">
                Selected ({selectedMembers.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map(userId => {
                  const member = otherTeamMembers.find(m => m.user_id === userId);
                  const displayName = member?.full_name || member?.email?.split('@')[0] || 'Unknown';
                  return (
                    <Badge key={userId} variant="secondary" className="text-xs">
                      {displayName}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Team members list */}
          <div className="flex-1 overflow-y-auto space-y-1">
            <div className="px-2 py-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Team Members ({otherTeamMembers.length})
              </h3>
            </div>
            
            {otherTeamMembers.map((member) => {
              const isOnline = getOnlineStatus();
              const displayName = member.full_name || member.email?.split('@')[0] || 'Unknown User';
              const isSelected = selectedMembers.includes(member.user_id);
              
              return (
                <div
                  key={member.user_id}
                  className={`flex items-center space-x-3 p-3 mx-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    if (isCreatingGroup) {
                      handleMemberToggle(member.user_id);
                    } else {
                      handleStartDirectMessage(member);
                    }
                  }}
                >
                  {/* Selection indicator for group chat */}
                  {isCreatingGroup && (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-primary border-primary' 
                        : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  )}

                  {/* User Avatar with Online Status */}
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      {profilesMap.get(member.user_id) && (
                        <AvatarImage src={profilesMap.get(member.user_id)} alt={displayName} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      <Circle
                        className={`w-3 h-3 ${
                          isOnline 
                            ? 'fill-green-500 text-green-500' 
                            : 'fill-muted-foreground/30 text-muted-foreground/30'
                        }`}
                      />
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {displayName}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs px-2 py-0.5 ${getRoleColor(member.role)}`}
                      >
                        {member.role}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {isOnline ? 'Online' : 'Last seen recently'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create group button (only for group chat with selected members) */}
          {isCreatingGroup && selectedMembers.length > 0 && (
            <div className="pt-4 border-t border-border">
              <Button
                onClick={handleCreateGroup}
                className="w-full"
                size="lg"
              >
                Create {selectedMembers.length === 1 ? 'Direct Message' : 'Group Chat'}
                {selectedMembers.length > 1 && ` (${selectedMembers.length} members)`}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};