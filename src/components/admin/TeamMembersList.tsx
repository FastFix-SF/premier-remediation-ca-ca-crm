import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, UserCheck, UserX, Shield, Crown, Settings, Eye, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { useAdminStatus } from '../../hooks/useAdminStatus';
import { useIsMobile } from '@/hooks/use-mobile';
import { InvitationLinkModal } from './InvitationLinkModal';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface TeamMember {
  user_id: string;
  email: string;
  full_name?: string;
  role: string;
  role_label: string;
  status: 'active' | 'invited' | 'disabled' | 'pending_approval';
  invited_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
  phone_number?: string | null;
}

interface TeamInvitation {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  expires_at: string;
  created_at: string;
}

interface TeamStats {
  total: number;
  active: number;
  invited: number;
  disabled: number;
}

const TeamMembersList = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats>({ total: 0, active: 0, invited: 0, disabled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState({
    email: '',
    full_name: '',
    role: 'contributor' as 'owner' | 'admin' | 'leader' | 'contributor' | 'sales'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [invitationData, setInvitationData] = useState<{
    url: string;
    email: string;
    name: string;
    role: string;
    expiresAt: string;
  } | null>(null);
  const { toast } = useToast();
  const { data: adminStatus } = useAdminStatus();
  const isMobile = useIsMobile();
  const currentUserCanEdit = adminStatus?.isAdmin; // For now, treating all admins as having edit permissions

  useEffect(() => {
    fetchTeamMembers();
  }, [searchQuery]);

  const fetchTeamMembers = async () => {
    let timeoutId: NodeJS.Timeout;
    
    try {
      setLoading(true);
      setError(null);
      
      // 10-second timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timed out')), 10000);
      });
      
      const fetchPromise = supabase.rpc('get_team_members', {
        q: searchQuery || null,
        page: 1,
        page_size: 100
      });
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      if (error) throw error;
      
      const members = data || [];
      
      // Fetch avatar_url from profiles for each member
      const memberIds = members.map((m: TeamMember) => m.user_id).filter(Boolean);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', memberIds);
      
      const avatarMap = new Map(profilesData?.map(p => [p.id, p.avatar_url]) || []);
      
      const membersWithAvatars = members.map((member: TeamMember) => ({
        ...member,
        avatar_url: member.user_id ? avatarMap.get(member.user_id) || null : null,
      }));
      
      setTeamMembers(membersWithAvatars);
      
      // Calculate stats
      const total = members.length;
      const active = members.filter((m: TeamMember) => m.status === 'active').length;
      const invited = members.filter((m: TeamMember) => m.status === 'invited').length;
      const disabled = members.filter((m: TeamMember) => m.status === 'disabled').length;
      
      setStats({ total, active, invited, disabled });
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      const errorMessage = error.message === 'Request timed out' 
        ? 'Request timed out. Please try again.' 
        : 'Failed to load team members.';
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeoutId!);
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.email || !newMember.full_name || !newMember.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: newMember.email,
          full_name: newMember.full_name,
          role: newMember.role
        }
      });

      if (error) throw error;

      if (data?.success && data?.invitationUrl) {
        // Show invitation link modal instead of just a toast
        setInvitationData({
          url: data.invitationUrl,
          email: newMember.email,
          name: newMember.full_name,
          role: newMember.role,
          expiresAt: data.expiresAt
        });
        setShowInvitationModal(true);
        setShowAddDialog(false);
        setNewMember({ email: '', full_name: '', role: 'contributor' });
        await fetchTeamMembers(); // Refresh the list
      } else {
        throw new Error(data?.error || "Failed to generate invitation");
      }
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditMember = async () => {
    if (!editingMember) return;

    try {
      setIsUpdating(true);
      
      // Only allow editing of basic info and role for active users
      // Status transitions are automatic (invited -> active -> disabled)
      const { error } = await supabase
        .from('team_directory')
        .update({
          email: editingMember.email,
          full_name: editingMember.full_name,
          role: editingMember.role
          // Status is NOT manually editable - it's system controlled
        })
        .eq('user_id', editingMember.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team member updated successfully",
      });

      setShowEditDialog(false);
      setEditingMember(null);
      fetchTeamMembers();
    } catch (error) {
      console.error('Error updating team member:', error);
      toast({
        title: "Error",
        description: "Failed to update team member",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      setIsDeleting(true);
      console.log('Attempting to delete member:', memberToDelete);
      
      // Delete by user_id if available, otherwise by email
      let query = supabase.from('team_directory').delete();
      
      if (memberToDelete.user_id) {
        query = query.eq('user_id', memberToDelete.user_id);
      } else {
        query = query.eq('email', memberToDelete.email);
      }
      
      const { error } = await query;

      if (error) {
        console.error('Delete error details:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Team member removed successfully",
      });

      setShowDeleteDialog(false);
      setMemberToDelete(null);
      fetchTeamMembers();
    } catch (error: any) {
      console.error('Error deleting team member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove team member",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResendInvite = async (email: string) => {
    if (!currentUserCanEdit) return;

    try {
      setIsResending(true);

      // Get the team member details for resending
      const { data: teamMember, error: getError } = await supabase
        .from('team_directory')
        .select('email, full_name, role')
        .eq('email', email)
        .maybeSingle();

      if (getError || !teamMember) {
        toast({
          title: "Member Not Found",
          description: "Could not find team member details.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: teamMember.email,
          full_name: teamMember.full_name,
          role: teamMember.role
        }
      });

      if (error) throw error;

      if (data?.success && data?.invitationUrl) {
        // Show invitation link modal for resent invitations too
        setInvitationData({
          url: data.invitationUrl,
          email: teamMember.email,
          name: teamMember.full_name,
          role: teamMember.role,
          expiresAt: data.expiresAt
        });
        setShowInvitationModal(true);
        await fetchTeamMembers(); // Refresh the list
      } else {
        throw new Error(data?.error || "Failed to generate invitation");
      }
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast({
        title: "Failed to Resend Invite",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleDisableUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('team_directory')
        .update({ status: 'disabled' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "User Disabled",
        description: "User account has been disabled",
      });

      fetchTeamMembers();
    } catch (error) {
      console.error('Error disabling user:', error);
      toast({
        title: "Error",
        description: "Failed to disable user",
        variant: "destructive",
      });
    }
  };

  const handleEnableUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('team_directory')
        .update({ status: 'active' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "User Enabled",
        description: "User account has been enabled",
      });

      fetchTeamMembers();
    } catch (error) {
      console.error('Error enabling user:', error);
      toast({
        title: "Error",
        description: "Failed to enable user",
        variant: "destructive",
      });
    }
  };

  const handleApproveUser = async (userId: string, email: string) => {
    try {
      // Update by user_id if available, otherwise by email
      let query = supabase
        .from('team_directory')
        .update({ status: 'active' });
      
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('email', email);
      }

      const { error } = await query;

      if (error) throw error;

      toast({
        title: "User Approved",
        description: "User has been approved and can now access the system",
      });

      fetchTeamMembers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'leader': return <Settings className="w-4 h-4" />;
      case 'contributor': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'leader': return 'bg-green-100 text-green-800 border-green-200';
      case 'contributor': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'invited': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disabled': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending_approval': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading team members...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-destructive text-center">
          <p className="font-medium">Failed to load team members</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={fetchTeamMembers} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Users className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium">No team members found</p>
          <p className="text-sm text-muted-foreground">Start by adding your first team member</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invited</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invited}</div>
            <p className="text-xs text-muted-foreground">Pending invitations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disabled</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.disabled}</div>
            <p className="text-xs text-muted-foreground">Disabled accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage team member access and permissions</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
              />
              {currentUserCanEdit && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center justify-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Add Member</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                      <DialogDescription>Add a new member to your team.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Phone Number *</Label>
                        <Input
                          id="email"
                          type="tel"
                          value={newMember.email}
                          onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={newMember.full_name}
                          onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={newMember.role} onValueChange={(value: any) => setNewMember({ ...newMember, role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="leader">Leader</SelectItem>
                            <SelectItem value="contributor">Contributor</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddMember} disabled={isCreating}>
                          {isCreating ? 'Adding...' : 'Add Member'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          {isMobile ? (
            <div className="space-y-3">
              {teamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No team members found.</div>
              ) : (
                teamMembers.map((member) => (
                  <div key={member.user_id} className="bg-card border rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {(member.full_name || member.email)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{member.full_name || (member.email?.includes('@placeholder.local') ? 'Team Member' : member.email.split('@')[0])}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {member.email?.includes('@placeholder.local') ? member.phone_number : member.email}
                        </div>
                      </div>
                      {currentUserCanEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingMember(member); setShowEditDialog(true); }}>
                              <Edit className="w-4 h-4 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setMemberToDelete(member); setShowDeleteDialog(true); }} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getRoleColor(member.role)}>
                          {getRoleIcon(member.role)}
                          <span className="ml-1">{member.role_label}</span>
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(member.status)}>
                          <span className="capitalize text-xs">{member.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(member.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No team members found.
                      </TableCell>
                    </TableRow>
                  ) : (
                  teamMembers.map((member) => (
                     <TableRow key={member.user_id}>
                       <TableCell>
                         <div className="flex items-center gap-3">
                           <Avatar className="w-10 h-10">
                             <AvatarImage src={member.avatar_url || undefined} />
                             <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                               {(member.full_name || member.email)[0].toUpperCase()}
                             </AvatarFallback>
                           </Avatar>
                            <div>
                              <div className="font-medium">{member.full_name || (member.email?.includes('@placeholder.local') ? 'Team Member' : member.email.split('@')[0])}</div>
                              <div className="text-sm text-muted-foreground">
                                {member.email?.includes('@placeholder.local') ? member.phone_number : member.email}
                              </div>
                            </div>
                         </div>
                       </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleColor(member.role)}>
                          <div className="flex items-center space-x-1">
                            {getRoleIcon(member.role)}
                            <span>{member.role_label}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(member.status)}>
                          <div className="flex items-center space-x-1">
                            {member.status === 'active' ? <UserCheck className="w-3 h-3" /> : 
                             member.status === 'invited' ? <Eye className="w-3 h-3" /> : 
                             member.status === 'pending_approval' ? <Clock className="w-3 h-3" /> :
                             <UserX className="w-3 h-3" />}
                            <span className="capitalize">{member.status.replace('_', ' ')}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                       <TableCell>
                         <div className="flex items-center space-x-2">
                           {member.status === 'pending_approval' && currentUserCanEdit && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleApproveUser(member.user_id, member.email)}
                               className="text-green-600 hover:text-green-700"
                             >
                               <UserCheck className="w-4 h-4 mr-1" />
                               Approve
                             </Button>
                           )}
                           {member.status !== 'disabled' && member.status !== 'pending_approval' && currentUserCanEdit && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleDisableUser(member.user_id)}
                               className="text-red-600 hover:text-red-700"
                             >
                               <UserX className="w-4 h-4 mr-1" />
                               Disable
                             </Button>
                           )}
                           {member.status === 'disabled' && currentUserCanEdit && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleEnableUser(member.user_id)}
                               className="text-green-600 hover:text-green-700"
                             >
                               <UserCheck className="w-4 h-4 mr-1" />
                               Enable
                             </Button>
                           )}
                           {member.status === 'invited' && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleResendInvite(member.email)}
                               disabled={isResending}
                             >
                               <UserCheck className="w-4 h-4 mr-1" />
                               {isResending ? 'Sending...' : 'Resend Invite'}
                             </Button>
                           )}
                           {currentUserCanEdit && (
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="sm">
                                   <Settings className="w-4 h-4" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                 <DropdownMenuItem
                                   onClick={() => {
                                     setEditingMember(member);
                                     setShowEditDialog(true);
                                   }}
                                 >
                                   <Edit className="w-4 h-4 mr-2" />
                                   Edit Details
                                 </DropdownMenuItem>
                                 <DropdownMenuItem
                                   onClick={() => {
                                     setMemberToDelete(member);
                                     setShowDeleteDialog(true);
                                   }}
                                   className="text-red-600"
                                 >
                                   <Trash2 className="w-4 h-4 mr-2" />
                                   Remove Member
                                 </DropdownMenuItem>
                               </DropdownMenuContent>
                             </DropdownMenu>
                           )}
                         </div>
                       </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>Update team member information.</DialogDescription>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editingMember.phone_number || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, phone_number: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="edit-full_name">Full Name</Label>
                <Input
                  id="edit-full_name"
                  value={editingMember.full_name || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editingMember.role} onValueChange={(value: any) => setEditingMember({ ...editingMember, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="leader">Leader</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div>
                 <Label htmlFor="edit-status">Account Status</Label>
                 <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted">
                   <Badge variant="outline" className={getStatusColor(editingMember.status)}>
                     {editingMember.status === 'active' ? <UserCheck className="w-3 h-3 mr-1" /> : 
                      editingMember.status === 'invited' ? <Eye className="w-3 h-3 mr-1" /> : 
                      <UserX className="w-3 h-3 mr-1" />}
                     <span className="capitalize">{editingMember.status}</span>
                   </Badge>
                   <span className="text-sm text-muted-foreground">
                     {editingMember.status === 'invited' 
                       ? 'User must accept invitation to become active' 
                       : editingMember.status === 'active' 
                         ? 'User has full access to the system'
                         : 'User access is disabled'}
                   </span>
                 </div>
                 <p className="text-xs text-muted-foreground mt-1">
                   Status is automatically managed by the system
                 </p>
               </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditMember} disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Member'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{memberToDelete?.email}" from the team? This action cannot be undone and will revoke their access to the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invitation Link Modal */}
      {invitationData && (
        <InvitationLinkModal
          isOpen={showInvitationModal}
          onClose={() => setShowInvitationModal(false)}
          invitationData={invitationData}
        />
      )}
    </div>
  );
};

export default TeamMembersList;