import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Crown, Shield, Star, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useTeamMember } from '@/hooks/useTeamMember';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const TeamMemberList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teamMembers, getInitials, getRoleColor, loading } = useTeamMember();
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3" />;
      case 'admin':
        return <Shield className="w-3 h-3" />;
      case 'leader':
        return <Star className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      case 'leader':
        return 'Leader';
      case 'contributor':
        return 'Contributor';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading team...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border p-4 z-10">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Team Members</h1>
            <p className="text-sm text-muted-foreground flex items-center space-x-2">
              <span>{teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}</span>
              <MessageCircle className="w-4 h-4" />
              <span>Tap to message</span>
            </p>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="flex-1 overflow-y-auto">
        {teamMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No team members</h3>
            <p className="text-sm text-muted-foreground">
              Team members will appear here
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {teamMembers.map((member) => (
              <Card
                key={member.user_id}
                className="p-0 border-0 shadow-none cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleStartChat(member)}
              >
                <div className="flex items-center space-x-3 p-4">
                  {/* Member Avatar */}
                  <div className="flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      {profilesMap.get(member.user_id) && (
                        <AvatarImage src={profilesMap.get(member.user_id)} alt={member.full_name || member.email} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.full_name || member.email)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-medium text-foreground truncate">
                        {member.full_name || member.email.split('@')[0]}
                      </h3>
                      {getRoleIcon(member.role) && (
                        <div className={getRoleColor(member.role)}>
                          {getRoleIcon(member.role)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="secondary"
                        className="text-xs"
                      >
                        {getRoleLabel(member.role)}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">Online</span>
                      </div>
                    </div>

                    {member.email !== (member.full_name && member.email) && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {member.email}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};