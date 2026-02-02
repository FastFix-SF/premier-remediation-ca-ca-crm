import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Circle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTeamMember } from '@/hooks/useTeamMember';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DirectMessagesListProps {
  onStartDirectMessage: (userId: string, userName: string) => void;
}

export const DirectMessagesList: React.FC<DirectMessagesListProps> = ({
  onStartDirectMessage,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teamMembers, getInitials, getRoleColor } = useTeamMember();
  const [profilesMap, setProfilesMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url');
      
      if (profilesData) {
        setProfilesMap(new Map(profilesData.map(p => [p.id, p.avatar_url || ''])));
      }
    };

    fetchProfiles();
  }, []);

  const handleStartChat = (member: any) => {
    const channelId = `dm-${member.user_id}`;
    navigate(`/mobile/messages/chat/${channelId}`, {
      state: { 
        channelName: member.full_name || member.email?.split('@')[0] || 'Unknown',
        isDirect: true,
        targetUserId: member.user_id
      }
    });
  };

  // Mock online status - in real app, this would come from presence
  const getOnlineStatus = () => Math.random() > 0.5;

  return (
    <div className="space-y-1">
      <div className="px-4 py-2">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
          <MessageCircle className="w-4 h-4" />
          <span>Direct Messages</span>
        </h3>
      </div>
      
      {teamMembers.map((member) => {
        const isOnline = getOnlineStatus();
        const displayName = member.full_name || member.email?.split('@')[0] || 'Unknown User';
        
        return (
          <Card
            key={member.user_id}
            className="mx-2 p-0 cursor-pointer hover:bg-muted/50 transition-colors border-0 shadow-none"
            onClick={() => handleStartChat(member)}
          >
            <div className="flex items-center space-x-3 p-3">
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
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs px-2 py-0.5 ${getRoleColor(member.role)}`}
                    >
                      {member.role}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground truncate">
                    {isOnline ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};