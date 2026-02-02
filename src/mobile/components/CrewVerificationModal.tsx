import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Check, Plus, Users, Clock, X, UserPlus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMember } from '@/hooks/useTeamMember';
import { UserSelectionSheet } from './UserSelectionSheet';

interface CrewMember {
  id: string;
  user_id: string;
  employee_name: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
  break_time_minutes: number;
  status: string;
  avatarUrl?: string;
  // Tracking edits
  originalClockIn: string | null;
  originalClockOut: string | null;
  editedClockIn: string;
  editedClockOut: string;
  isConfirmed: boolean;
  isEdited: boolean;
  // Source tracking
  source: 'assigned' | 'clocked' | 'added';
  hasTimeEntry: boolean;
  isNewEntry: boolean;
}

interface CrewVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  projectId: string;
  projectName: string;
  leaderClockIn: string;
  leaderClockOut: string;
}

export const CrewVerificationModal: React.FC<CrewVerificationModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  projectId,
  projectName,
  leaderClockIn,
  leaderClockOut
}) => {
  const { user } = useAuth();
  const { teamMembers, getDisplayName } = useTeamMember();
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  // Fetch assigned members and clocked-in members
  const fetchCrewMembers = useCallback(async () => {
    if (!projectId || !user?.id) return;
    
    setLoading(true);
    try {
      // 1. Get assigned members from project_team_assignments
      const { data: assignedData, error: assignedError } = await supabase
        .from('project_team_assignments')
        .select(`
          user_id,
          team_directory!inner(user_id, full_name, email)
        `)
        .eq('project_id', projectId)
        .neq('user_id', user.id);

      if (assignedError) {
        console.error('Error fetching assigned members:', assignedError);
      }

      // 2. Get time_clock entries for this project overlapping with leader's shift
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_clock')
        .select('id, user_id, employee_name, clock_in, clock_out, total_hours, break_time_minutes, status')
        .eq('job_id', projectId)
        .neq('user_id', user.id)
        .lte('clock_in', leaderClockOut)
        .order('clock_in');

      if (timeError) {
        console.error('Error fetching time entries:', timeError);
      }

      // Filter time entries to only those overlapping with leader's shift
      const filteredTimeEntries = (timeEntries || []).filter(entry => {
        const entryClockOut = entry.clock_out || new Date().toISOString();
        return entryClockOut >= leaderClockIn;
      });

      // Create a map of user_id to time entry
      const timeEntryMap = new Map<string, typeof filteredTimeEntries[0]>();
      filteredTimeEntries.forEach(entry => {
        timeEntryMap.set(entry.user_id, entry);
      });

      // Create set of assigned user IDs
      const assignedUserIds = new Set((assignedData || []).map(a => a.user_id));

      // Collect all user IDs for avatar fetching
      const allUserIds = new Set<string>();
      (assignedData || []).forEach(a => allUserIds.add(a.user_id));
      filteredTimeEntries.forEach(e => allUserIds.add(e.user_id));

      // Fetch profile avatars
      if (allUserIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', Array.from(allUserIds));
        
        const avatarMap: Record<string, string> = {};
        (profiles || []).forEach(p => {
          if (p.avatar_url) avatarMap[p.id] = p.avatar_url;
        });
        setProfilesMap(avatarMap);
      }

      // Default times based on leader's shift
      const defaultClockIn = format(new Date(leaderClockIn), 'h:mm a');
      const defaultClockOut = format(new Date(leaderClockOut), 'h:mm a');

      // Build crew members list
      const members: CrewMember[] = [];

      // Process assigned members first
      (assignedData || []).forEach(assignment => {
        const teamDir = assignment.team_directory as unknown as { user_id: string; full_name: string; email: string };
        const timeEntry = timeEntryMap.get(assignment.user_id);
        const hasTimeEntry = !!timeEntry;

        let editedClockIn = defaultClockIn;
        let editedClockOut = defaultClockOut;

        if (timeEntry) {
          editedClockIn = format(new Date(timeEntry.clock_in), 'h:mm a');
          editedClockOut = timeEntry.clock_out 
            ? format(new Date(timeEntry.clock_out), 'h:mm a')
            : defaultClockOut;
        }

        members.push({
          id: timeEntry?.id || `assigned-${assignment.user_id}`,
          user_id: assignment.user_id,
          employee_name: teamDir?.full_name || teamDir?.email || 'Unknown',
          clock_in: timeEntry?.clock_in || null,
          clock_out: timeEntry?.clock_out || null,
          total_hours: timeEntry?.total_hours || null,
          break_time_minutes: timeEntry?.break_time_minutes || 0,
          status: timeEntry?.status || 'no_entry',
          originalClockIn: timeEntry?.clock_in || null,
          originalClockOut: timeEntry?.clock_out || null,
          editedClockIn,
          editedClockOut,
          isConfirmed: hasTimeEntry, // Auto-confirm if they have time entry
          isEdited: false,
          source: 'assigned',
          hasTimeEntry,
          isNewEntry: !hasTimeEntry
        });
      });

      // Add clocked-in members who are NOT assigned
      filteredTimeEntries.forEach(entry => {
        if (!assignedUserIds.has(entry.user_id)) {
          const clockOutTime = entry.clock_out || leaderClockOut;
          members.push({
            id: entry.id,
            user_id: entry.user_id,
            employee_name: entry.employee_name || 'Unknown',
            clock_in: entry.clock_in,
            clock_out: entry.clock_out,
            total_hours: entry.total_hours,
            break_time_minutes: entry.break_time_minutes || 0,
            status: entry.status,
            originalClockIn: entry.clock_in,
            originalClockOut: entry.clock_out,
            editedClockIn: format(new Date(entry.clock_in), 'h:mm a'),
            editedClockOut: format(new Date(clockOutTime), 'h:mm a'),
            isConfirmed: true,
            isEdited: false,
            source: 'clocked',
            hasTimeEntry: true,
            isNewEntry: false
          });
        }
      });

      setCrewMembers(members);
    } catch (error) {
      console.error('Error loading crew members:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.id, leaderClockIn, leaderClockOut]);

  useEffect(() => {
    if (isOpen) {
      fetchCrewMembers();
    }
  }, [isOpen, fetchCrewMembers]);

  const handleTimeChange = (memberId: string, field: 'editedClockIn' | 'editedClockOut', value: string) => {
    setCrewMembers(prev => prev.map(member => {
      if (member.id === memberId) {
        const updated = { ...member, [field]: value };
        
        if (member.hasTimeEntry && member.originalClockIn) {
          // Check if times have been edited from original
          const originalInTime = format(new Date(member.originalClockIn), 'h:mm a');
          const originalOutTime = member.originalClockOut 
            ? format(new Date(member.originalClockOut), 'h:mm a')
            : format(new Date(leaderClockOut), 'h:mm a');
          
          updated.isEdited = updated.editedClockIn !== originalInTime || 
                             updated.editedClockOut !== originalOutTime;
        } else {
          // New entries are always considered "edited" (new)
          updated.isEdited = true;
        }
        return updated;
      }
      return member;
    }));
  };

  const handleConfirmToggle = (memberId: string) => {
    setCrewMembers(prev => prev.map(member => {
      if (member.id === memberId) {
        return { ...member, isConfirmed: !member.isConfirmed };
      }
      return member;
    }));
  };

  const handleAddMembers = (selectedUserIds: string[]) => {
    const defaultClockIn = format(new Date(leaderClockIn), 'h:mm a');
    const defaultClockOut = format(new Date(leaderClockOut), 'h:mm a');

    const existingUserIds = new Set(crewMembers.map(m => m.user_id));
    
    const newMembers: CrewMember[] = selectedUserIds
      .filter(userId => !existingUserIds.has(userId) && userId !== user?.id)
      .map(userId => {
        const teamMember = teamMembers.find(m => m.user_id === userId);
        return {
          id: `added-${userId}`,
          user_id: userId,
          employee_name: teamMember?.full_name || teamMember?.email || 'Unknown',
          clock_in: null,
          clock_out: null,
          total_hours: null,
          break_time_minutes: 0,
          status: 'added',
          originalClockIn: null,
          originalClockOut: null,
          editedClockIn: defaultClockIn,
          editedClockOut: defaultClockOut,
          isConfirmed: true,
          isEdited: true,
          source: 'added' as const,
          hasTimeEntry: false,
          isNewEntry: true
        };
      });

    if (newMembers.length > 0) {
      setCrewMembers(prev => [...prev, ...newMembers]);
      toast.success(`Added ${newMembers.length} member${newMembers.length > 1 ? 's' : ''}`);
    }
    setShowAddMember(false);
  };

  const calculateHours = (clockIn: string, clockOut: string, breakMinutes: number): number => {
    const [inHours, inMinutes] = clockIn.split(':').map(Number);
    const [outHours, outMinutes] = clockOut.split(':').map(Number);
    
    const inTotalMinutes = inHours * 60 + inMinutes;
    const outTotalMinutes = outHours * 60 + outMinutes;
    
    const workedMinutes = outTotalMinutes - inTotalMinutes - breakMinutes;
    return Math.max(0, workedMinutes / 60);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      const leaderName = getDisplayName(user.id);
      const shiftDate = format(new Date(leaderClockIn), 'yyyy-MM-dd');
      
      // Process each crew member
      for (const member of crewMembers) {
        if (!member.isConfirmed) continue; // Skip unconfirmed members
        
        if (member.isNewEntry || (member.isEdited && member.hasTimeEntry)) {
          // Create a shift request for new entries or edits
          const notes = member.isNewEntry
            ? `Hours added by crew leader ${leaderName} for ${projectName}. Time: ${member.editedClockIn} - ${member.editedClockOut}`
            : `Hours edited by crew leader ${leaderName}. Original: ${member.originalClockIn ? format(new Date(member.originalClockIn), 'h:mm a') : 'N/A'} - ${member.originalClockOut ? format(new Date(member.originalClockOut), 'h:mm a') : 'Active'}. New: ${member.editedClockIn} - ${member.editedClockOut}`;

          const { error } = await supabase
            .from('employee_requests')
            .insert({
              user_id: member.user_id,
              request_type: 'shift',
              status: 'pending',
              shift_start_date: shiftDate,
              shift_clock_in: member.editedClockIn,
              shift_clock_out: member.editedClockOut,
              notes,
              submitted_by: user.id
            });

          if (error) {
            console.error('Error creating shift request for', member.employee_name, error);
            toast.error(`Failed to submit request for ${member.employee_name}`);
          }
        }
      }

      const requestCount = crewMembers.filter(m => 
        m.isConfirmed && (m.isNewEntry || (m.isEdited && m.hasTimeEntry))
      ).length;

      if (requestCount > 0) {
        toast.success(`${requestCount} shift request${requestCount > 1 ? 's' : ''} submitted for approval`);
      } else {
        toast.success('Crew verification completed');
      }
      
      onComplete();
    } catch (error) {
      console.error('Error submitting crew verification:', error);
      toast.error('Failed to submit crew verification');
    } finally {
      setSubmitting(false);
    }
  };

  const assignedMembers = crewMembers.filter(m => m.source === 'assigned');
  const clockedNotAssigned = crewMembers.filter(m => m.source === 'clocked');
  const addedMembers = crewMembers.filter(m => m.source === 'added');
  
  const confirmedCount = crewMembers.filter(m => m.isConfirmed).length;
  const pendingRequestCount = crewMembers.filter(m => 
    m.isConfirmed && (m.isNewEntry || (m.isEdited && m.hasTimeEntry))
  ).length;

  const renderMemberCard = (member: CrewMember) => (
    <div 
      key={member.id}
      className={`border rounded-xl p-4 transition-colors ${
        member.isConfirmed ? 'border-primary/30 bg-primary/5' : 'border-muted bg-muted/30'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={member.isConfirmed}
          onCheckedChange={() => handleConfirmToggle(member.id)}
          className="mt-1"
        />
        
        {/* Avatar */}
        <Avatar className="w-10 h-10">
          <AvatarImage src={profilesMap[member.user_id]} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {getInitials(member.employee_name)}
          </AvatarFallback>
        </Avatar>
        
        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium truncate">{member.employee_name}</p>
            {member.hasTimeEntry ? (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                Clocked
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                No Entry
              </Badge>
            )}
            {member.isEdited && member.hasTimeEntry && (
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">
                Edited
              </Badge>
            )}
            {member.source === 'added' && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                Added
              </Badge>
            )}
          </div>
          
          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <Label className="text-xs text-muted-foreground">Clock In</Label>
              <Input
                type="time"
                value={member.editedClockIn}
                onChange={(e) => handleTimeChange(member.id, 'editedClockIn', e.target.value)}
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Clock Out</Label>
              <Input
                type="time"
                value={member.editedClockOut}
                onChange={(e) => handleTimeChange(member.id, 'editedClockOut', e.target.value)}
                className="mt-1 h-9"
              />
            </div>
          </div>
          
          {/* Calculated Hours */}
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">
              {calculateHours(member.editedClockIn, member.editedClockOut, member.break_time_minutes).toFixed(1)} hrs
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={isOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[90vh] rounded-t-3xl overflow-hidden flex flex-col" 
          hideClose
        >
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Who was here with you?
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {projectName}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {format(new Date(leaderClockIn), 'EEE, MMM d')}
              </span>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : crewMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No team members assigned or clocked in</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowAddMember(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add crew members
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Assigned to Project Section */}
                {assignedMembers.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                      Assigned to Project ({assignedMembers.length})
                    </p>
                    <div className="space-y-3">
                      {assignedMembers.map(renderMemberCard)}
                    </div>
                  </div>
                )}

                {/* Clocked In (Not Assigned) Section */}
                {clockedNotAssigned.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                      Clocked In (Not Assigned) ({clockedNotAssigned.length})
                    </p>
                    <div className="space-y-3">
                      {clockedNotAssigned.map(renderMemberCard)}
                    </div>
                  </div>
                )}

                {/* Added Members Section */}
                {addedMembers.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                      Added by You ({addedMembers.length})
                    </p>
                    <div className="space-y-3">
                      {addedMembers.map(renderMemberCard)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add Member Button */}
            {!loading && (
              <Button
                variant="outline"
                className="w-full mt-4 border-dashed"
                onClick={() => setShowAddMember(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add crew member not listed
              </Button>
            )}
          </div>

          {/* Footer */}
          <div className="border-t pt-4 pb-6 space-y-3">
            {pendingRequestCount > 0 && (
              <p className="text-sm text-center text-muted-foreground">
                {pendingRequestCount} request{pendingRequestCount > 1 ? 's' : ''} will be sent for admin approval
              </p>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-full"
                onClick={onClose}
              >
                Skip
              </Button>
              <Button
                className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm ({confirmedCount})
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* User Selection Sheet for Adding Members */}
      <UserSelectionSheet
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        selectedUserIds={crewMembers.map(m => m.user_id)}
        onSelectUsers={handleAddMembers}
      />
    </>
  );
};
