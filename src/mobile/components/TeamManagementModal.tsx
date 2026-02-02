import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { useMobileTeamAssignment, useMobileAvailableTeamMembers } from '@/mobile/hooks/useMobileProjectManagement';
import { useTeamMember } from '@/hooks/useTeamMember';
import { useMobilePermissions } from '@/mobile/hooks/useMobilePermissions';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentTeam: any[];
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  projectId,
  currentTeam
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [profilesMap, setProfilesMap] = useState<Map<string, string>>(new Map());
  
  const { addTeamMember, removeTeamMember } = useMobileTeamAssignment();
  const getAvailableTeamMembers = useMobileAvailableTeamMembers();
  const { getInitials, getDisplayName, getMemberByUserId } = useTeamMember();
  const { projectPermissions } = useMobilePermissions(projectId);

  const canManageTeam = projectPermissions.canManageTeam;

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    // Get the team member's role from team_directory
    const teamMember = getMemberByUserId(selectedUserId);
    const role = teamMember?.role || 'contributor';

    await addTeamMember.mutateAsync({
      projectId,
      userId: selectedUserId,
      role
    });

    setSelectedUserId('');
  };

  const handleRemoveMember = async (assignmentId: string) => {
    await removeTeamMember.mutateAsync({ assignmentId, projectId });
  };

  const loadAvailableMembers = async () => {
    await getAvailableTeamMembers.mutateAsync();
  };

  const availableMembers = getAvailableTeamMembers.data || [];
  const unassignedMembers = availableMembers.filter(
    member => !currentTeam.some(teamMember => teamMember.user_id === member.user_id)
  );

  React.useEffect(() => {
    if (isOpen) {
      loadAvailableMembers();
      // Fetch profile pictures
      const fetchProfiles = async () => {
        const { data } = await supabase.from('profiles').select('id, avatar_url');
        if (data) {
          setProfilesMap(new Map(data.map(p => [p.id, p.avatar_url || ''])));
        }
      };
      fetchProfiles();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Team Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Team Members */}
          <div>
            <h3 className="font-medium text-sm text-foreground mb-3">Current Team</h3>
            <div className="space-y-2">
              {currentTeam.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      {profilesMap.get(member.user_id) && (
                        <AvatarImage src={profilesMap.get(member.user_id)} alt={getDisplayName(member.user_id)} />
                      )}
                      <AvatarFallback className="text-xs">
                        {getInitials(getDisplayName(member.user_id))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {getDisplayName(member.user_id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getMemberByUserId(member.user_id)?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {member.role}
                    </Badge>
                    {canManageTeam && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removeTeamMember.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {currentTeam.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No team members assigned
                </p>
              )}
            </div>
          </div>

          {/* Add New Member */}
          {canManageTeam ? (
            <div className="border-t pt-4">
              <h3 className="font-medium text-sm text-foreground mb-3">Add Team Member</h3>
              
              <div className="space-y-3">
                {unassignedMembers.length > 0 ? (
                  <>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {unassignedMembers.map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.full_name} ({member.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleAddMember}
                      disabled={!selectedUserId || addTeamMember.isPending}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {addTeamMember.isPending ? 'Adding...' : 'Add Member'}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    All team members are already assigned to this project
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="border-t pt-4">
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Only admins and project owners can manage team members.
                </p>
                <p className="text-xs text-muted-foreground">
                  Contact an administrator to add or remove team members.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};