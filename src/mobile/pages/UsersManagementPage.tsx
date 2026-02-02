import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, UserPlus, Star, Crown, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AddUserOptionsSheet } from '@/mobile/components/users/AddUserOptionsSheet';
import { AddNewUserSheet } from '@/mobile/components/users/AddNewUserSheet';
import { InviteLinkSheet } from '@/mobile/components/users/InviteLinkSheet';
import { UserRequestCard } from '@/mobile/components/users/UserRequestCard';
import { ApprovalSheet } from '@/mobile/components/users/ApprovalSheet';
import { ActiveShiftsPanel } from '@/mobile/components/users/ActiveShiftsPanel';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  user_id: string | null;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
}

export const UsersManagementPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showAddUserSheet, setShowAddUserSheet] = useState(false);
  const [showInviteLinkSheet, setShowInviteLinkSheet] = useState(false);
  const [showApprovalSheet, setShowApprovalSheet] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TeamMember | null>(null);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: teamMembers = [], isLoading, refetch } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_directory')
        .select('user_id, email, full_name, role, status')
        .order('full_name');
      
      if (error) throw error;
      return data as TeamMember[];
    }
  });

  const { data: adminUsers = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get users from admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('is_active', true);
      
      if (adminError) throw adminError;

      // Get owners from team_directory table
      const { data: ownerData, error: ownerError } = await supabase
        .from('team_directory')
        .select('user_id')
        .eq('role', 'owner')
        .eq('status', 'active');

      if (ownerError) throw ownerError;

      // Combine both lists and remove duplicates
      const adminIds = adminData?.map(u => u.user_id) || [];
      const ownerIds = ownerData?.map(u => u.user_id) || [];
      return [...new Set([...adminIds, ...ownerIds])];
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: profilesMap = new Map() } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url');
      
      return new Map(profilesData?.map(p => [p.id, p.avatar_url || '']) || []);
    }
  });

  const isCurrentUserAdmin = currentUser ? adminUsers.includes(currentUser.id) : false;

  const { data: pendingRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_directory')
        .select('user_id, email, full_name, role, status')
        .eq('status', 'pending_approval')
        .order('invited_at', { ascending: false });
      
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: isCurrentUserAdmin
  });

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name: string | null) => {
    const colors = [
      'bg-orange-500', 'bg-blue-500', 'bg-pink-500', 
      'bg-green-500', 'bg-purple-500', 'bg-yellow-500',
      'bg-red-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const isAdmin = (userId: string | null) => {
    return userId ? adminUsers.includes(userId) : false;
  };

  const isOwner = (role: string) => {
    return role === 'owner';
  };

  const getRoleBadge = (role: string) => {
    const roleStyles: Record<string, { bg: string; text: string; label: string }> = {
      owner: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Owner' },
      admin: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', label: 'Admin' },
      leader: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Leader' },
      contributor: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Contributor' },
      sales: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', label: 'Sales' },
      collaborator: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', label: 'Collaborator' },
    };
    
    return roleStyles[role] || { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', label: role || 'Unknown' };
  };

  const handleOptionSelect = (option: 'contacts' | 'new' | 'link') => {
    setShowOptionsSheet(false);
    
    if (option === 'contacts') {
      toast({
        title: 'Coming Soon',
        description: 'Contact sync feature will be available soon',
      });
    } else if (option === 'new') {
      setShowAddUserSheet(true);
    } else if (option === 'link') {
      setShowInviteLinkSheet(true);
    }
  };

  const handleAddUserSuccess = () => {
    refetch();
  };

  const handleApproveClick = (request: TeamMember) => {
    setSelectedRequest(request);
    setShowApprovalSheet(true);
  };

  const handleApproveUser = async (role: string, isAdmin: boolean) => {
    if (!selectedRequest?.user_id) return;

    try {
      // Update team_directory status and role
      const { error: updateError } = await supabase
        .from('team_directory')
        .update({ 
          status: 'active',
          role: role
        })
        .eq('user_id', selectedRequest.user_id);

      if (updateError) throw updateError;

      // If admin access selected, add to admin_users
      if (isAdmin) {
        await (supabase as any)
          .from('admin_users')
          .upsert({
            user_id: selectedRequest.user_id,
            is_active: true
          }, {
            onConflict: 'user_id'
          });
      }

      toast({
        title: 'User approved',
        description: `${selectedRequest.full_name || selectedRequest.email} has been granted access`,
      });

      refetchRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve user',
        variant: 'destructive',
      });
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = !searchQuery || 
      member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'users') {
      // Show all users regardless of status or role
      return matchesSearch;
    } else if (activeTab === 'admins') {
      return matchesSearch && member.status === 'active' && isAdmin(member.user_id);
    } else if (activeTab === 'sales') {
      return matchesSearch && member.status === 'active' && member.role === 'sales';
    } else {
      return matchesSearch;
    }
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/mobile/admin')}
              className="shrink-0"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-semibold">Users</h1>
          </div>
          <Button
            size="icon"
            className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700"
            onClick={() => setShowOptionsSheet(true)}
          >
            <UserPlus className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="px-4 pt-4">
          <div className="bg-muted/50 rounded-xl p-1.5">
            <TabsList variant="segmented" className={`w-full grid ${isCurrentUserAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger variant="segmented" value="users">Users</TabsTrigger>
              <TabsTrigger variant="segmented" value="admins">Admins</TabsTrigger>
              <TabsTrigger variant="segmented" value="sales">Sales</TabsTrigger>
              {isCurrentUserAdmin && (
                <TabsTrigger variant="segmented" value="requests">Requests</TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-muted/50 border-none h-12 rounded-xl"
            />
          </div>
        </div>

        {/* User Lists */}
        <TabsContent value="users" className="px-4 space-y-2 mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            filteredMembers.map((member) => {
              const roleBadge = getRoleBadge(member.role);
              return (
                <div 
                  key={member.email} 
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
                  onClick={() => member.user_id && navigate(`/mobile/users/${member.user_id}`)}
                >
                  <Avatar className={`w-12 h-12 ${getAvatarColor(member.full_name)}`}>
                    {member.user_id && profilesMap.get(member.user_id) && (
                      <AvatarImage src={profilesMap.get(member.user_id)} alt={member.full_name || member.email} />
                    )}
                    <AvatarFallback className="text-white font-semibold">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="text-base font-medium block truncate">{member.full_name || member.email}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleBadge.bg} ${roleBadge.text}`}>
                    {roleBadge.label}
                  </span>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="admins" className="px-4 space-y-2 mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No admins found</div>
          ) : (
            filteredMembers.map((member) => (
              <div 
                key={member.email} 
                className="flex items-center gap-3 py-3 cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
                onClick={() => member.user_id && navigate(`/mobile/users/${member.user_id}`)}
              >
                <div className="relative">
                  <Avatar className={`w-12 h-12 ${getAvatarColor(member.full_name)}`}>
                    {member.user_id && profilesMap.get(member.user_id) && (
                      <AvatarImage src={profilesMap.get(member.user_id)} alt={member.full_name || member.email} />
                    )}
                    <AvatarFallback className="text-white font-semibold">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  {isOwner(member.role) ? (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                      <Crown className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                </div>
                <span className="text-base font-medium">{member.full_name || member.email}</span>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="sales" className="px-4 space-y-2 mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No sales team members found</div>
          ) : (
            filteredMembers.map((member) => (
              <div 
                key={member.email} 
                className="flex items-center gap-3 py-3 cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
                onClick={() => member.user_id && navigate(`/mobile/users/${member.user_id}`)}
              >
                <Avatar className={`w-12 h-12 ${getAvatarColor(member.full_name)}`}>
                  {member.user_id && profilesMap.get(member.user_id) && (
                    <AvatarImage src={profilesMap.get(member.user_id)} alt={member.full_name || member.email} />
                  )}
                  <AvatarFallback className="text-white font-semibold">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-base font-medium">{member.full_name || member.email}</span>
              </div>
            ))
          )}
        </TabsContent>

        {isCurrentUserAdmin && (
          <>
            <TabsContent value="requests" className="px-4 space-y-3 mt-4">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <UserRequestCard
                    key={request.user_id || request.email}
                    name={request.full_name || 'Phone User'}
                    phone={request.email}
                    onApprove={() => handleApproveClick(request)}
                    userId={request.user_id || undefined}
                    avatarUrl={request.user_id ? profilesMap.get(request.user_id) : null}
                  />
                ))
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Add User Sheets */}
      <AddUserOptionsSheet
        isOpen={showOptionsSheet}
        onClose={() => setShowOptionsSheet(false)}
        onSelectOption={handleOptionSelect}
      />
      
      <AddNewUserSheet
        isOpen={showAddUserSheet}
        onClose={() => setShowAddUserSheet(false)}
        onSuccess={handleAddUserSuccess}
      />
      
      <InviteLinkSheet
        isOpen={showInviteLinkSheet}
        onClose={() => setShowInviteLinkSheet(false)}
      />

      {selectedRequest && (
        <ApprovalSheet
          isOpen={showApprovalSheet}
          onClose={() => {
            setShowApprovalSheet(false);
            setSelectedRequest(null);
          }}
          onApprove={handleApproveUser}
          userName={selectedRequest.full_name || selectedRequest.email}
        />
      )}
    </div>
  );
};
