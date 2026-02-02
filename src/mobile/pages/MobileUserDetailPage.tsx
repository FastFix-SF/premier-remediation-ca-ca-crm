import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Check, MoreVertical, Pencil, ChevronRight, Shield, Crown, Users, Briefcase, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClassCodeSheet } from '@/mobile/components/users/ClassCodeSheet';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { useAdminStatus } from '@/hooks/useAdminStatus';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner', icon: Crown, color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  { value: 'admin', label: 'Admin', icon: Shield, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: 'leader', label: 'Leader', icon: Users, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  { value: 'sales', label: 'Sales', icon: Briefcase, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'contributor', label: 'Contributor', icon: UserCheck, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800/30' },
];

export const MobileUserDetailPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { toast } = useToast();
  const { data: adminStatus } = useAdminStatus();
  const canEdit = adminStatus?.isAdmin || adminStatus?.isOwner;
  
  const [showClassCodeSheet, setShowClassCodeSheet] = useState(false);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showRoleSheet, setShowRoleSheet] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  const { data: teamMember, refetch: refetchTeamMember } = useQuery({
    queryKey: ['team-member', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_directory')
        .select('user_id, email, full_name, role, secondary_role, status, phone_number, invited_at, class_code')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  const { data: userActivity } = useQuery({
    queryKey: ['user-activity', userId],
    queryFn: async () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 4);
      fiveDaysAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('time_clock')
        .select('clock_in, clock_out, total_hours')
        .eq('user_id', userId)
        .gte('clock_in', fiveDaysAgo.toISOString())
        .order('clock_in', { ascending: true });
      
      if (error) throw error;
      
      // Aggregate by date
      const dailyActivity: Record<string, number> = {};
      data?.forEach(entry => {
        const date = format(new Date(entry.clock_in), 'MMM dd');
        dailyActivity[date] = (dailyActivity[date] || 0) + (entry.total_hours || 0);
      });

      // Create array for last 5 days
      const result = [];
      for (let i = 4; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'MMM dd');
        result.push({
          date: dateStr,
          value: dailyActivity[dateStr] || 0
        });
      }
      
      return result;
    },
    enabled: !!userId
  });

  const lastFiveDays = userActivity || [];

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name: string | null) => {
    const colors = [
      'bg-orange-500', 'bg-blue-500', 'bg-pink-500', 
      'bg-green-500', 'bg-purple-500', 'bg-yellow-500'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  if (!teamMember) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/mobile/users-management')}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-semibold">User Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  const firstName = teamMember.full_name?.split(' ')[0] || '';
  const lastName = teamMember.full_name?.split(' ').slice(1).join(' ') || '';

  const handleOpenEditSheet = () => {
    setEditForm({
      first_name: firstName,
      last_name: lastName,
      email: !teamMember.email.match(/^\+?\d+$/) ? teamMember.email : '',
      phone_number: teamMember.phone_number || (teamMember.email.match(/^\+?\d+$/) ? teamMember.email.replace(/^\+1?/, '') : '')
    });
    setShowEditSheet(true);
  };

  const handleSaveEmployee = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const fullName = `${editForm.first_name} ${editForm.last_name}`.trim();
      
      // Determine the email to save - if user provided an email, use it; otherwise keep original
      const emailToSave = editForm.email.trim() || teamMember?.email || '';
      
      const { error } = await supabase
        .from('team_directory')
        .update({
          full_name: fullName || null,
          phone_number: editForm.phone_number || null,
          email: emailToSave,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Employee info updated successfully',
      });
      setShowEditSheet(false);
      refetchTeamMember();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to update employee info',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRole = (roleValue: string) => {
    const currentRoles = [teamMember?.role, teamMember?.secondary_role].filter(Boolean) as string[];
    
    if (currentRoles.includes(roleValue)) {
      // Remove the role - but ensure at least one role remains
      if (currentRoles.length <= 1) {
        toast({
          title: 'Cannot remove',
          description: 'User must have at least one role',
          variant: 'destructive',
        });
        return;
      }
      // Filter out the role being removed
      const newRoles = currentRoles.filter(r => r !== roleValue);
      handleSaveRoles(newRoles[0], null);
    } else {
      // Add the role - max 2 roles
      if (currentRoles.length >= 2) {
        toast({
          title: 'Maximum roles reached',
          description: 'Users can have at most 2 roles. Remove one first.',
          variant: 'destructive',
        });
        return;
      }
      // Add new role as secondary if primary exists
      if (currentRoles.length === 1) {
        handleSaveRoles(currentRoles[0], roleValue);
      } else {
        handleSaveRoles(roleValue, null);
      }
    }
  };

  const handleSaveRoles = async (primaryRole: string, secondaryRole: string | null) => {
    if (!userId) return;
    setIsSavingRole(true);
    try {
      const { error } = await supabase
        .from('team_directory')
        .update({ 
          role: primaryRole,
          secondary_role: secondaryRole 
        })
        .eq('user_id', userId);

      if (error) throw error;

      // If either role is admin/owner, also add to admin_users table
      const hasAdminRole = primaryRole === 'admin' || primaryRole === 'owner' || 
                           secondaryRole === 'admin' || secondaryRole === 'owner';
      
      if (hasAdminRole) {
        const { error: adminError } = await supabase
          .from('admin_users')
          .upsert({
            user_id: userId,
            email: teamMember?.email || '',
            is_active: true
          }, { onConflict: 'user_id' });

        if (adminError) console.error('Error adding to admin_users:', adminError);
      } else {
        // Remove from admin_users if no admin roles
        await supabase
          .from('admin_users')
          .delete()
          .eq('user_id', userId);
      }

      const roleNames = [primaryRole, secondaryRole].filter(Boolean).join(' + ');
      toast({
        title: 'Success',
        description: `Roles updated to ${roleNames}`,
      });
      refetchTeamMember();
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to update roles',
        variant: 'destructive',
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  const getCurrentRoles = () => {
    const roles = [];
    const primary = ROLE_OPTIONS.find(r => r.value === teamMember?.role);
    const secondary = ROLE_OPTIONS.find(r => r.value === teamMember?.secondary_role);
    if (primary) roles.push(primary);
    if (secondary) roles.push(secondary);
    return roles.length > 0 ? roles : [ROLE_OPTIONS[4]]; // Default to contributor
  };

  const getSelectedRoleValues = () => {
    return [teamMember?.role, teamMember?.secondary_role].filter(Boolean) as string[];
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/mobile/users-management')}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-semibold">{teamMember.full_name || teamMember.email}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowActionsSheet(true)}>
            <MoreVertical className="w-6 h-6 text-green-600" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-6">
        {/* User Info Card */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className={`w-24 h-24 ${getAvatarColor(teamMember.full_name)}`}>
              {userProfile?.avatar_url && (
                <AvatarImage src={userProfile.avatar_url} alt={teamMember.full_name || teamMember.email} />
              )}
              <AvatarFallback className="text-white font-semibold text-2xl">
                {getInitials(teamMember.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center gap-1">
              <Eye className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-muted-foreground">Last login</span>
              <span className="text-sm font-semibold">{format(new Date(), 'MM/dd/yyyy')}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(), 'h:mm a')}</span>
            </div>
            <div className="flex flex-col items-center gap-1 border-l border-border pl-4">
              <Check className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-muted-foreground">Date created</span>
              <span className="text-sm font-semibold">
                {teamMember.invited_at ? format(new Date(teamMember.invited_at), 'MM/dd/yyyy') : 'N/A'}
              </span>
              <span className="text-xs text-muted-foreground">
                {teamMember.invited_at ? format(new Date(teamMember.invited_at), 'h:mm a') : ''}
              </span>
            </div>
          </div>
        </div>

        {/* User Activity Chart */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Hours worked (Last 5 days)</h2>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-none">
            <CardContent className="p-4">
              {lastFiveDays.length > 0 && lastFiveDays.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={lastFiveDays}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.2)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                      stroke="rgba(59, 130, 246, 0.3)"
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                      stroke="rgba(59, 130, 246, 0.3)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No activity data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Personal Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Personal Details</h2>
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={handleOpenEditSheet}>
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">First Name</label>
              <div className="text-base font-medium">{firstName || 'N/A'}</div>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Last Name</label>
              <div className="text-base font-medium">{lastName || 'N/A'}</div>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-border">
            <label className="text-sm text-muted-foreground">Phone Number</label>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇺🇸</span>
              <span className="text-base">+1</span>
              <span className="text-base">
                {teamMember.phone_number || (teamMember.email.match(/^\+?\d+$/) ? teamMember.email.replace(/^\+1?/, '') : 'Not provided')}
              </span>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-border">
            <label className="text-sm text-muted-foreground">Email Address (optional)</label>
            <div className="text-base">
              {!teamMember.email.match(/^\+?\d+$/) ? teamMember.email : 'Not provided'}
            </div>
          </div>

          <div 
            className="space-y-1 pt-2 border-t border-border cursor-pointer"
            onClick={() => canEdit ? setShowClassCodeSheet(true) : null}
          >
            <label className="text-sm text-muted-foreground">Class Code</label>
            <div className="text-base">{teamMember.class_code || 'Not assigned'}</div>
          </div>
        </div>

        {/* Role & Status Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Role & Status</h2>
          
          <div 
            className={`flex items-center justify-between p-4 rounded-xl border border-border ${canEdit ? 'cursor-pointer active:bg-muted/50' : ''}`}
            onClick={() => canEdit && setShowRoleSheet(true)}
          >
            <div className="flex items-center gap-3">
              {(() => {
                const roles = getCurrentRoles();
                return (
                  <>
                    <div className="flex -space-x-2">
                      {roles.map((role, idx) => {
                        const IconComponent = role.icon;
                        return (
                          <div 
                            key={role.value} 
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${role.bgColor} border-2 border-background`}
                            style={{ zIndex: roles.length - idx }}
                          >
                            <IconComponent className={`w-5 h-5 ${role.color}`} />
                          </div>
                        );
                      })}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Current Role{roles.length > 1 ? 's' : ''}</div>
                      <div className="text-base font-semibold">{roles.map(r => r.label).join(' + ')}</div>
                    </div>
                  </>
                );
              })()}
            </div>
            {canEdit && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${teamMember.status === 'active' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                <Check className={`w-5 h-5 ${teamMember.status === 'active' ? 'text-green-500' : 'text-yellow-500'}`} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Account Status</div>
                <div className="text-base font-semibold capitalize">{teamMember.status || 'Active'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ClassCodeSheet
        isOpen={showClassCodeSheet}
        onClose={() => setShowClassCodeSheet(false)}
        currentClassCode={teamMember.class_code}
        userId={userId || ''}
        onSave={() => refetchTeamMember()}
      />

      {/* Edit Employee Sheet */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl p-4 bg-background z-50">
          <SheetHeader className="pb-4">
            <SheetTitle>Edit Employee Info</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <div className="flex items-center gap-2">
                <span className="text-lg">🇺🇸 +1</span>
                <Input
                  id="phone_number"
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="Phone number"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address (optional)</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Email address"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowEditSheet(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSaveEmployee} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Role Selection Sheet */}
      <Sheet open={showRoleSheet} onOpenChange={setShowRoleSheet}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl p-4 bg-background z-50">
          <SheetHeader className="pb-4">
            <SheetTitle>Select Roles (max 2)</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Select up to 2 roles. User will get privileges from all selected roles.
            </p>
          </SheetHeader>
          <div className="space-y-2">
            {ROLE_OPTIONS.map((role) => {
              const IconComponent = role.icon;
              const selectedRoles = getSelectedRoleValues();
              const isSelected = selectedRoles.includes(role.value);
              return (
                <button
                  key={role.value}
                  onClick={() => !isSavingRole && handleToggleRole(role.value)}
                  disabled={isSavingRole}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  } ${isSavingRole ? 'opacity-50' : ''}`}
                >
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${role.bgColor}`}>
                    <IconComponent className={`w-5 h-5 ${role.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{role.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="pt-4">
            <Button 
              className="w-full" 
              onClick={() => setShowRoleSheet(false)}
            >
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Actions Sheet */}
      <Sheet open={showActionsSheet} onOpenChange={setShowActionsSheet}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl p-0 bg-background/95 backdrop-blur-sm z-50">
          <div className="flex flex-col">
            <button
              onClick={() => {
                setShowActionsSheet(false);
                navigate(`/mobile/messages/chat/dm-${userId}`, {
                  state: { 
                    channelName: teamMember.full_name || teamMember.email 
                  }
                });
              }}
              className="w-full py-4 text-base text-blue-500 hover:bg-muted/50 transition-colors border-b border-border"
            >
              Chat
            </button>
            <button
              onClick={() => {
                setShowActionsSheet(false);
                // Get phone number from phone_number field or email if it's a phone format
                const phoneNumber = teamMember.phone_number || 
                  (teamMember.email.match(/^\+?\d+$/) ? teamMember.email : null);
                
                if (phoneNumber) {
                  // Format phone number with country code if needed
                  const formattedNumber = phoneNumber.startsWith('+') 
                    ? phoneNumber 
                    : `+1${phoneNumber.replace(/^\+1?/, '')}`;
                  // Open native SMS app
                  window.location.href = `sms:${formattedNumber}`;
                } else {
                  toast({
                    title: 'No phone number',
                    description: 'This user does not have a phone number',
                    variant: 'destructive',
                  });
                }
              }}
              className="w-full py-4 text-base text-blue-500 hover:bg-muted/50 transition-colors border-b border-border"
            >
              Send text message
            </button>
            <button
              onClick={() => {
                setShowActionsSheet(false);
                navigate('/mobile/users-management/archived');
              }}
              className="w-full py-4 text-base text-blue-500 hover:bg-muted/50 transition-colors border-b border-border"
            >
              Archive
            </button>
            <button
              onClick={() => {
                setShowActionsSheet(false);
                // Add delete logic here
              }}
              className="w-full py-4 text-base text-destructive hover:bg-muted/50 transition-colors border-b-8 border-border"
            >
              Delete
            </button>
            <button
              onClick={() => setShowActionsSheet(false)}
              className="w-full py-4 text-base text-blue-500 font-semibold hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
