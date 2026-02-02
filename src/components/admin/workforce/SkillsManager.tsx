import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, Award, Plus, CheckCircle, Calendar, AlertTriangle } from 'lucide-react';
import { useEmployeeScores } from '@/hooks/useEmployeeScores';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const SkillsManager = () => {
  const [activeTab, setActiveTab] = useState('skills');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    skill_category: 'general',
    proficiency_level: 3,
    years_experience: 0,
  });
  const [newCert, setNewCert] = useState({
    certification_name: '',
    certification_type: 'trade',
    issued_date: '',
    expiry_date: '',
    issuing_body: '',
  });

  const { data: teamMembers = [] } = useTeamMembers();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all skills
  const { data: allSkills = [] } = useQuery({
    queryKey: ['all-employee-skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_skills')
        .select('*')
        .order('skill_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch all certifications
  const { data: allCerts = [] } = useQuery({
    queryKey: ['all-employee-certifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_certifications')
        .select('*')
        .order('certification_name');
      if (error) throw error;
      return data;
    },
  });

  const skillCategories = [
    { value: 'roof_type', label: 'Roof Type' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'general', label: 'General' },
    { value: 'safety', label: 'Safety' },
  ];

  const certTypes = [
    { value: 'safety', label: 'Safety' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'trade', label: 'Trade' },
    { value: 'license', label: 'License' },
  ];

  const commonSkills = [
    'TPO Installation',
    'PVC Installation',
    'Metal Roofing',
    'Shingle Installation',
    'Flat Roof Repair',
    'Tile Installation',
    'Slate Work',
    'Skylight Installation',
    'Flashing',
    'Gutters',
    'Membrane Welding',
    'Torch Down',
    'Spray Foam',
    'Coatings',
    'Crane Operation',
    'Forklift',
    'Safety Rigging',
    'Blueprint Reading',
    'Estimating',
    'Project Management',
  ];

  const commonCerts = [
    'OSHA 10',
    'OSHA 30',
    'GAF Master Elite',
    'Firestone Certified',
    'Johns Manville Certified',
    'Carlisle Applicator',
    'Fall Protection Certified',
    'First Aid/CPR',
    'Confined Space Entry',
    'Aerial Lift Certified',
    'Roofing Contractor License',
  ];

  const handleAddSkill = async () => {
    if (!selectedUserId || !newSkill.skill_name) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('employee_skills').insert({
        user_id: selectedUserId,
        skill_name: newSkill.skill_name,
        skill_category: newSkill.skill_category,
        proficiency_level: newSkill.proficiency_level,
        years_experience: newSkill.years_experience,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Skill added successfully' });
      setIsAddingSkill(false);
      setNewSkill({ skill_name: '', skill_category: 'general', proficiency_level: 3, years_experience: 0 });
      setSelectedUserId('');
      queryClient.invalidateQueries({ queryKey: ['all-employee-skills'] });
      queryClient.invalidateQueries({ queryKey: ['employee-scores'] });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.code === '23505' ? 'Skill already exists for this user' : 'Failed to add skill', 
        variant: 'destructive' 
      });
    }
  };

  const handleAddCert = async () => {
    if (!selectedUserId || !newCert.certification_name) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('employee_certifications').insert({
        user_id: selectedUserId,
        certification_name: newCert.certification_name,
        certification_type: newCert.certification_type,
        issued_date: newCert.issued_date || null,
        expiry_date: newCert.expiry_date || null,
        issuing_body: newCert.issuing_body || null,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Certification added successfully' });
      setIsAddingCert(false);
      setNewCert({ certification_name: '', certification_type: 'trade', issued_date: '', expiry_date: '', issuing_body: '' });
      setSelectedUserId('');
      queryClient.invalidateQueries({ queryKey: ['all-employee-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['employee-scores'] });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.code === '23505' ? 'Certification already exists for this user' : 'Failed to add certification', 
        variant: 'destructive' 
      });
    }
  };

  const handleVerifySkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('employee_skills')
        .update({ verified_at: new Date().toISOString(), verified_by: user?.id })
        .eq('id', skillId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Skill verified' });
      queryClient.invalidateQueries({ queryKey: ['all-employee-skills'] });
      queryClient.invalidateQueries({ queryKey: ['employee-scores'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to verify skill', variant: 'destructive' });
    }
  };

  const getInitials = (userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId);
    if (member?.full_name) {
      return member.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return member?.email?.slice(0, 2).toUpperCase() || '??';
  };

  const getMemberName = (userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId);
    return member?.full_name || member?.email || 'Unknown';
  };

  const getMemberAvatar = (userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId);
    return member?.avatar_url || null;
  };

  const getProficiencyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Basic';
      case 3: return 'Intermediate';
      case 4: return 'Advanced';
      case 5: return 'Expert';
      default: return 'Unknown';
    }
  };

  // Group skills by category
  const skillsByCategory = allSkills.reduce((acc, skill) => {
    const cat = skill.skill_category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, typeof allSkills>);

  // Find expiring certs
  const expiringCerts = allCerts.filter(cert => {
    if (!cert.expiry_date) return false;
    const expiryDate = new Date(cert.expiry_date);
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <div className="bg-muted/50 rounded-xl p-1.5 inline-flex">
            <TabsList variant="segmented">
              <TabsTrigger variant="segmented" value="skills" className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Skills ({allSkills.length})
              </TabsTrigger>
              <TabsTrigger variant="segmented" value="certifications" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Certifications ({allCerts.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex gap-2">
            <Dialog open={isAddingSkill} onOpenChange={setIsAddingSkill}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Skill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Employee Skill</DialogTitle>
                  <DialogDescription>Record a skill for a team member</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Team Member *</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map(tm => (
                          <SelectItem key={tm.user_id} value={tm.user_id}>
                            {tm.full_name || tm.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Skill Name *</Label>
                    <Select 
                      value={newSkill.skill_name} 
                      onValueChange={(v) => setNewSkill({ ...newSkill, skill_name: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select or type skill" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonSkills.map(skill => (
                          <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select 
                      value={newSkill.skill_category} 
                      onValueChange={(v) => setNewSkill({ ...newSkill, skill_category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {skillCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Proficiency Level (1-5)</Label>
                    <Select 
                      value={String(newSkill.proficiency_level)} 
                      onValueChange={(v) => setNewSkill({ ...newSkill, proficiency_level: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Beginner</SelectItem>
                        <SelectItem value="2">2 - Basic</SelectItem>
                        <SelectItem value="3">3 - Intermediate</SelectItem>
                        <SelectItem value="4">4 - Advanced</SelectItem>
                        <SelectItem value="5">5 - Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Years of Experience</Label>
                    <Input
                      type="number"
                      min="0"
                      value={newSkill.years_experience}
                      onChange={(e) => setNewSkill({ ...newSkill, years_experience: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <Button onClick={handleAddSkill} className="w-full">Add Skill</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddingCert} onOpenChange={setIsAddingCert}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Certification
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Certification</DialogTitle>
                  <DialogDescription>Record a certification for a team member</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Team Member *</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map(tm => (
                          <SelectItem key={tm.user_id} value={tm.user_id}>
                            {tm.full_name || tm.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Certification Name *</Label>
                    <Select 
                      value={newCert.certification_name} 
                      onValueChange={(v) => setNewCert({ ...newCert, certification_name: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select certification" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonCerts.map(cert => (
                          <SelectItem key={cert} value={cert}>{cert}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select 
                      value={newCert.certification_type} 
                      onValueChange={(v) => setNewCert({ ...newCert, certification_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {certTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Issuing Body</Label>
                    <Input
                      placeholder="e.g., OSHA, GAF"
                      value={newCert.issuing_body}
                      onChange={(e) => setNewCert({ ...newCert, issuing_body: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Issued Date</Label>
                      <Input
                        type="date"
                        value={newCert.issued_date}
                        onChange={(e) => setNewCert({ ...newCert, issued_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Expiry Date</Label>
                      <Input
                        type="date"
                        value={newCert.expiry_date}
                        onChange={(e) => setNewCert({ ...newCert, expiry_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddCert} className="w-full">Add Certification</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Skills Tab */}
        <TabsContent value="skills">
          {expiringCerts.length > 0 && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Expiring Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringCerts.map(cert => (
                    <div key={cert.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={getMemberAvatar(cert.user_id) || undefined} />
                          <AvatarFallback>{getInitials(cert.user_id)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{getMemberName(cert.user_id)}</p>
                          <p className="text-sm text-muted-foreground">{cert.certification_name}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Expires {format(new Date(cert.expiry_date!), 'MMM d, yyyy')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">{category.replace('_', ' ')} Skills</CardTitle>
                  <CardDescription>{skills.length} skills recorded</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {skills.map(skill => (
                      <div 
                        key={skill.id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={getMemberAvatar(skill.user_id) || undefined} />
                            <AvatarFallback>{getInitials(skill.user_id)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{skill.skill_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getMemberName(skill.user_id)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {getProficiencyLabel(skill.proficiency_level)}
                          </Badge>
                          {skill.verified_at ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleVerifySkill(skill.id)}
                            >
                              Verify
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCerts.map(cert => {
              const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date();
              const isExpiringSoon = cert.expiry_date && 
                new Date(cert.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                !isExpired;

              return (
                <Card 
                  key={cert.id}
                  className={
                    isExpired ? 'border-red-200 bg-red-50' : 
                    isExpiringSoon ? 'border-yellow-200 bg-yellow-50' : ''
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={getMemberAvatar(cert.user_id) || undefined} />
                          <AvatarFallback>{getInitials(cert.user_id)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{getMemberName(cert.user_id)}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {cert.certification_type}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={isExpired ? 'destructive' : isExpiringSoon ? 'secondary' : 'default'}
                      >
                        {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold">{cert.certification_name}</p>
                      {cert.issuing_body && (
                        <p className="text-sm text-muted-foreground">
                          Issued by: {cert.issuing_body}
                        </p>
                      )}
                      {cert.expiry_date && (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          <span className={isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-700' : ''}>
                            {isExpired ? 'Expired' : 'Expires'}: {format(new Date(cert.expiry_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SkillsManager;
