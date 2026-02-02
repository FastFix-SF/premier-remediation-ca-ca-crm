import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Star, Trophy, UserPlus, Trash2 } from 'lucide-react';
import { useCrews, useEmployeeScores } from '@/hooks/useEmployeeScores';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const CrewManager = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [newCrew, setNewCrew] = useState({ crew_name: '', specialty: '', description: '' });
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [memberRole, setMemberRole] = useState<string>('member');

  const { data: crews = [], isLoading } = useCrews();
  const { data: employees = [] } = useEmployeeScores();
  const { data: teamMembers = [] } = useTeamMembers();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCreateCrew = async () => {
    if (!newCrew.crew_name.trim()) {
      toast({ title: 'Error', description: 'Crew name is required', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('crews').insert({
        crew_name: newCrew.crew_name,
        specialty: newCrew.specialty || null,
        description: newCrew.description || null,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Crew created successfully' });
      setNewCrew({ crew_name: '', specialty: '', description: '' });
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ['crews'] });
    } catch (error) {
      console.error('Error creating crew:', error);
      toast({ title: 'Error', description: 'Failed to create crew', variant: 'destructive' });
    }
  };

  const handleAddMember = async () => {
    if (!selectedCrewId || !selectedMember) {
      toast({ title: 'Error', description: 'Please select a member', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('crew_memberships').insert({
        crew_id: selectedCrewId,
        user_id: selectedMember,
        role: memberRole,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Member added to crew' });
      setAddMemberDialogOpen(false);
      setSelectedMember('');
      setMemberRole('member');
      queryClient.invalidateQueries({ queryKey: ['crews'] });
      queryClient.invalidateQueries({ queryKey: ['employee-scores'] });
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({ 
        title: 'Error', 
        description: error.code === '23505' ? 'Member already in this crew' : 'Failed to add member', 
        variant: 'destructive' 
      });
    }
  };

  const handleRemoveMember = async (crewId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('crew_memberships')
        .delete()
        .eq('crew_id', crewId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Member removed from crew' });
      queryClient.invalidateQueries({ queryKey: ['crews'] });
      queryClient.invalidateQueries({ queryKey: ['employee-scores'] });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({ title: 'Error', description: 'Failed to remove member', variant: 'destructive' });
    }
  };

  const getCrewMembers = (crewName: string) => {
    return employees.filter(emp => emp.crew_name === crewName);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const specialties = [
    'TPO/PVC',
    'Metal Roofing',
    'Shingle',
    'Flat Roof',
    'Tile',
    'Slate',
    'Commercial',
    'Residential',
    'Repairs',
    'Maintenance',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Crew Management</h3>
          <p className="text-sm text-muted-foreground">
            Organize your workforce into specialized crews
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Crew
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Crew</DialogTitle>
              <DialogDescription>
                Add a new crew to organize your workforce
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="crew_name">Crew Name *</Label>
                <Input
                  id="crew_name"
                  placeholder="e.g., Crew A, TPO Specialists"
                  value={newCrew.crew_name}
                  onChange={(e) => setNewCrew({ ...newCrew, crew_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Select
                  value={newCrew.specialty}
                  onValueChange={(value) => setNewCrew({ ...newCrew, specialty: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map(spec => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the crew"
                  value={newCrew.description}
                  onChange={(e) => setNewCrew({ ...newCrew, description: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateCrew} className="w-full">
                Create Crew
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Crews Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading crews...</div>
      ) : crews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Crews Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first crew to organize your workforce
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Crew
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crews.map((crew) => {
            const members = getCrewMembers(crew.crew_name);
            
            return (
              <Card key={crew.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {crew.crew_name}
                      </CardTitle>
                      {crew.specialty && (
                        <CardDescription className="mt-1">
                          {crew.specialty}
                        </CardDescription>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{crew.member_count || 0}</div>
                      <div className="text-xs text-muted-foreground">members</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Crew Stats */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">Avg Score</span>
                    </div>
                    <Badge variant="secondary">
                      {crew.avg_score?.toFixed(0) || 0}
                    </Badge>
                  </div>

                  {/* Members List */}
                  <div className="space-y-2 mb-4">
                    {members.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No members yet
                      </p>
                    ) : (
                      members.slice(0, 5).map((member) => (
                        <div 
                          key={member.user_id} 
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(member.full_name, member.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {member.full_name || member.email}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="text-sm font-medium">
                                {member.score?.total_score?.toFixed(0) || 0}
                              </span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-6 h-6"
                              onClick={() => handleRemoveMember(crew.id, member.user_id)}
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                    {members.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{members.length - 5} more members
                      </p>
                    )}
                  </div>

                  {/* Add Member Button */}
                  <Dialog open={addMemberDialogOpen && selectedCrewId === crew.id} onOpenChange={(open) => {
                    setAddMemberDialogOpen(open);
                    if (open) setSelectedCrewId(crew.id);
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setSelectedCrewId(crew.id)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Member to {crew.crew_name}</DialogTitle>
                        <DialogDescription>
                          Select a team member to add to this crew
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Team Member</Label>
                          <Select value={selectedMember} onValueChange={setSelectedMember}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent>
                              {teamMembers
                                .filter(tm => !members.some(m => m.user_id === tm.user_id))
                                .map(tm => (
                                  <SelectItem key={tm.user_id} value={tm.user_id}>
                                    {tm.full_name || tm.email}
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Role in Crew</Label>
                          <Select value={memberRole} onValueChange={setMemberRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lead">Lead</SelectItem>
                              <SelectItem value="senior">Senior</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="apprentice">Apprentice</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddMember} className="w-full">
                          Add to Crew
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CrewManager;
