import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { MessageSquare, Eye, Users, Edit, MapPin, Trash2, User, Mail, Phone, Building2, Calendar, Home, FileText, Globe, Clock, Briefcase, HardHat } from 'lucide-react';

// Helper to get initials
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingDescription, setEditingDescription] = useState(false);
  const [editDescriptionValue, setEditDescriptionValue] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editRoofType, setEditRoofType] = useState('');
  const [savingClassification, setSavingClassification] = useState(false);

  // Customer Info editing
  const [editingCustomerInfo, setEditingCustomerInfo] = useState(false);
  const [customerInfoForm, setCustomerInfoForm] = useState({
    client_name: '',
    customer_email: '',
    client_phone: '',
    source: '',
    company_name: '',
    project_manager_id: '',
    site_manager_id: '',
    sales_representative_id: '',
  });
  const [savingCustomerInfo, setSavingCustomerInfo] = useState(false);

  // Property Details editing
  const [editingPropertyDetails, setEditingPropertyDetails] = useState(false);
  const [propertyDetailsForm, setPropertyDetailsForm] = useState({
    property_type: '',
    timeline: '',
  });
  const [savingPropertyDetails, setSavingPropertyDetails] = useState(false);

  // Roof Specs editing
  const [editingRoofSpecs, setEditingRoofSpecs] = useState(false);
  const [roofSpecsForm, setRoofSpecsForm] = useState({
    existing_roof: '',
    wanted_roof: '',
    existing_roof_deck: '',
    wanted_roof_deck: '',
    insulation: '',
  });
  const [savingRoofSpecs, setSavingRoofSpecs] = useState(false);

  // Contractor/Management Company editing
  const [editingContractorInfo, setEditingContractorInfo] = useState(false);
  const [contractorInfoForm, setContractorInfoForm] = useState({
    is_contractor_managed: false,
    contractor_company_name: '',
    contractor_contact_person: '',
    contractor_phone: '',
    contractor_email: '',
    contractor_address: '',
  });
  const [savingContractorInfo, setSavingContractorInfo] = useState(false);

  const { data: project, isLoading, refetch } = useQuery({
    queryKey: ['project-details', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_assignments (customer_email, customer_id)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      
      setEditDescriptionValue(data.description || '');
      setEditCategory(data.project_category || '');
      setEditRoofType(data.roof_type || '');
      
      return data;
    },
    enabled: !!id,
  });

  // Set form values when project data loads
  useEffect(() => {
    if (project) {
      setCustomerInfoForm({
        client_name: project.client_name || '',
        customer_email: project.customer_email || '',
        client_phone: project.client_phone || '',
        source: project.source || '',
        company_name: project.company_name || '',
        project_manager_id: project.project_manager_id || '',
        site_manager_id: project.site_manager_id || '',
        sales_representative_id: project.sales_representative_id || '',
      });
      setPropertyDetailsForm({
        property_type: project.property_type || '',
        timeline: project.timeline || '',
      });
      setRoofSpecsForm({
        existing_roof: project.existing_roof || '',
        wanted_roof: project.wanted_roof || '',
        existing_roof_deck: project.existing_roof_deck || '',
        wanted_roof_deck: project.wanted_roof_deck || '',
        insulation: project.insulation || '',
      });
      setContractorInfoForm({
        is_contractor_managed: project.is_contractor_managed || false,
        contractor_company_name: project.contractor_company_name || '',
        contractor_contact_person: project.contractor_contact_person || '',
        contractor_phone: project.contractor_phone || '',
        contractor_email: project.contractor_email || '',
        contractor_address: project.contractor_address || '',
      });
    }
  }, [project]);

  // Fetch all team members for manager dropdowns (with avatars)
  const { data: allTeamMembers } = useQuery({
    queryKey: ['all-team-members-with-avatars'],
    queryFn: async () => {
      const { data: teamData, error: teamError } = await supabase
        .from('team_directory')
        .select('user_id, full_name, email, role')
        .eq('status', 'active')
        .order('full_name');
      
      if (teamError) throw teamError;
      
      // Fetch profiles with avatars
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url');
      
      // Create a map of user_id to avatar_url
      const avatarMap = new Map(profilesData?.map(p => [p.id, p.avatar_url]) || []);
      
      // Merge the data
      return teamData?.map(member => ({
        ...member,
        avatar_url: member.user_id ? avatarMap.get(member.user_id) || null : null,
      })) || [];
    },
  });

  // Fetch team members for managers display
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members-for-project', project?.project_manager_id, project?.site_manager_id, project?.sales_representative_id],
    queryFn: async () => {
      const ids = [project?.project_manager_id, project?.site_manager_id, project?.sales_representative_id].filter(Boolean);
      if (ids.length === 0) return {};
      
      const { data, error } = await supabase
        .from('team_directory')
        .select('user_id, full_name, email')
        .in('user_id', ids);
      
      if (error) throw error;
      
      const memberMap: Record<string, string> = {};
      data?.forEach(m => {
        memberMap[m.user_id] = m.full_name || 'Unknown';
      });
      return memberMap;
    },
    enabled: !!(project?.project_manager_id || project?.site_manager_id || project?.sales_representative_id),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'planning': return 'bg-amber-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const saveDescriptionEdit = async () => {
    if (!project) return;
    setSavingDescription(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ description: editDescriptionValue })
        .eq('id', project.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Project story updated successfully' });
      setEditingDescription(false);
      refetch();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update project story', variant: 'destructive' });
    } finally {
      setSavingDescription(false);
    }
  };

  const handleVisibilityToggle = async (isPublic: boolean) => {
    if (!project) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_public: !isPublic })
        .eq('id', project.id);

      if (error) throw error;
      toast({ title: 'Success', description: `Project is now ${!isPublic ? 'public' : 'private'}` });
      refetch();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update visibility', variant: 'destructive' });
    }
  };

  const handleFeaturedToggle = async (isFeatured: boolean) => {
    if (!project) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_featured: !isFeatured })
        .eq('id', project.id);

      if (error) throw error;
      toast({ title: 'Success', description: `Project is now ${!isFeatured ? 'featured' : 'unfeatured'}` });
      refetch();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update featured status', variant: 'destructive' });
    }
  };

  const saveClassification = async () => {
    if (!project) return;
    setSavingClassification(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          project_category: editCategory || null,
          roof_type: editRoofType || null,
          project_type: editCategory || null,
        })
        .eq('id', project.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Project classification updated successfully' });
      refetch();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update project classification', variant: 'destructive' });
    } finally {
      setSavingClassification(false);
    }
  };

  const saveCustomerInfo = async () => {
    if (!project) return;
    setSavingCustomerInfo(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          client_name: customerInfoForm.client_name || null,
          customer_email: customerInfoForm.customer_email || null,
          client_phone: customerInfoForm.client_phone || null,
          source: customerInfoForm.source || null,
          company_name: customerInfoForm.company_name || null,
          project_manager_id: customerInfoForm.project_manager_id || null,
          site_manager_id: customerInfoForm.site_manager_id || null,
          sales_representative_id: customerInfoForm.sales_representative_id || null,
        })
        .eq('id', project.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Customer information updated successfully' });
      setEditingCustomerInfo(false);
      refetch();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update customer information', variant: 'destructive' });
    } finally {
      setSavingCustomerInfo(false);
    }
  };

  const savePropertyDetails = async () => {
    if (!project) return;
    setSavingPropertyDetails(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          property_type: propertyDetailsForm.property_type || null,
          timeline: propertyDetailsForm.timeline || null,
        })
        .eq('id', project.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Property details updated successfully' });
      setEditingPropertyDetails(false);
      refetch();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update property details', variant: 'destructive' });
    } finally {
      setSavingPropertyDetails(false);
    }
  };

  const saveRoofSpecs = async () => {
    if (!project) return;
    setSavingRoofSpecs(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          existing_roof: roofSpecsForm.existing_roof || null,
          wanted_roof: roofSpecsForm.wanted_roof || null,
          existing_roof_deck: roofSpecsForm.existing_roof_deck || null,
          wanted_roof_deck: roofSpecsForm.wanted_roof_deck || null,
          insulation: roofSpecsForm.insulation || null,
        })
        .eq('id', project.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Roof specifications updated successfully' });
      setEditingRoofSpecs(false);
      refetch();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update roof specifications', variant: 'destructive' });
    } finally {
      setSavingRoofSpecs(false);
    }
  };

  const saveContractorInfo = async () => {
    if (!project) return;
    setSavingContractorInfo(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          is_contractor_managed: contractorInfoForm.is_contractor_managed,
          contractor_company_name: contractorInfoForm.contractor_company_name || null,
          contractor_contact_person: contractorInfoForm.contractor_contact_person || null,
          contractor_phone: contractorInfoForm.contractor_phone || null,
          contractor_email: contractorInfoForm.contractor_email || null,
          contractor_address: contractorInfoForm.contractor_address || null,
        })
        .eq('id', project.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Contractor information updated successfully' });
      setEditingContractorInfo(false);
      refetch();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update contractor information', variant: 'destructive' });
    } finally {
      setSavingContractorInfo(false);
    }
  };

  const deleteProject = async () => {
    if (!project || !confirm('Are you sure you want to delete this project?')) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Project deleted successfully' });
      navigate('/admin');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete project', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <ProjectSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex">
        <ProjectSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <ProjectSidebar />
      <div className="flex-1 px-6 py-6 space-y-6 overflow-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.address && (
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {project.address}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(project.status)}>
              {project.status?.replace('_', ' ')}
            </Badge>
            {project.is_featured && (
              <Badge className="bg-accent text-accent-foreground">Featured</Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingCustomerInfo(!editingCustomerInfo)}
                className="h-6"
              >
                <Edit className="w-3 h-3 mr-1" />
                {editingCustomerInfo ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  {editingCustomerInfo ? (
                    <Input
                      value={customerInfoForm.client_name}
                      onChange={(e) => setCustomerInfoForm({...customerInfoForm, client_name: e.target.value})}
                      placeholder="Client name"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {project.client_name || 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  {editingCustomerInfo ? (
                    <Input
                      type="email"
                      value={customerInfoForm.customer_email}
                      onChange={(e) => setCustomerInfoForm({...customerInfoForm, customer_email: e.target.value})}
                      placeholder="Email address"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {project.customer_email || 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  {editingCustomerInfo ? (
                    <Input
                      type="tel"
                      value={customerInfoForm.client_phone}
                      onChange={(e) => setCustomerInfoForm({...customerInfoForm, client_phone: e.target.value})}
                      placeholder="Phone number"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {project.client_phone || 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Company Name</Label>
                  {editingCustomerInfo ? (
                    <Input
                      value={customerInfoForm.company_name}
                      onChange={(e) => setCustomerInfoForm({...customerInfoForm, company_name: e.target.value})}
                      placeholder="Company name"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-2 mt-1">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {project.company_name || 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Source</Label>
                  {editingCustomerInfo ? (
                    <Select 
                      value={customerInfoForm.source} 
                      onValueChange={(v) => setCustomerInfoForm({...customerInfoForm, source: v === 'none' ? '' : v})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center gap-2">—  None</div>
                        </SelectItem>
                        <SelectItem value="Website">
                          <div className="flex items-center gap-2">🌐 Website</div>
                        </SelectItem>
                        <SelectItem value="Referral">
                          <div className="flex items-center gap-2">🤝 Referral</div>
                        </SelectItem>
                        <SelectItem value="Google">
                          <div className="flex items-center gap-2">🔍 Google</div>
                        </SelectItem>
                        <SelectItem value="Social Media">
                          <div className="flex items-center gap-2">📱 Social Media</div>
                        </SelectItem>
                        <SelectItem value="Door Knock">
                          <div className="flex items-center gap-2">🚪 Door Knock</div>
                        </SelectItem>
                        <SelectItem value="Other">
                          <div className="flex items-center gap-2">📋 Other</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-2 mt-1">
                      {project.source === 'Website' && '🌐 '}
                      {project.source === 'Referral' && '🤝 '}
                      {project.source === 'Google' && '🔍 '}
                      {project.source === 'Social Media' && '📱 '}
                      {project.source === 'Door Knock' && '🚪 '}
                      {project.source === 'Other' && '📋 '}
                      {project.source || 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Project Manager</Label>
                  {editingCustomerInfo ? (
                    <Select 
                      value={customerInfoForm.project_manager_id} 
                      onValueChange={(v) => setCustomerInfoForm({...customerInfoForm, project_manager_id: v === 'none' ? '' : v})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">—</div>
                            <span>Not assigned</span>
                          </div>
                        </SelectItem>
                        {allTeamMembers?.map(m => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={m.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">{getInitials(m.full_name || m.email)}</AvatarFallback>
                              </Avatar>
                              <span>{m.full_name || m.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm mt-1">
                      {(() => {
                        const manager = allTeamMembers?.find(m => m.user_id === project.project_manager_id);
                        return manager ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={manager.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">{getInitials(manager.full_name || manager.email)}</AvatarFallback>
                            </Avatar>
                            <span>{manager.full_name || manager.email}</span>
                          </div>
                        ) : 'Not assigned';
                      })()}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Site Manager</Label>
                  {editingCustomerInfo ? (
                    <Select 
                      value={customerInfoForm.site_manager_id} 
                      onValueChange={(v) => setCustomerInfoForm({...customerInfoForm, site_manager_id: v === 'none' ? '' : v})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">—</div>
                            <span>Not assigned</span>
                          </div>
                        </SelectItem>
                        {allTeamMembers?.map(m => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={m.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">{getInitials(m.full_name || m.email)}</AvatarFallback>
                              </Avatar>
                              <span>{m.full_name || m.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm mt-1">
                      {(() => {
                        const manager = allTeamMembers?.find(m => m.user_id === project.site_manager_id);
                        return manager ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={manager.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">{getInitials(manager.full_name || manager.email)}</AvatarFallback>
                            </Avatar>
                            <span>{manager.full_name || manager.email}</span>
                          </div>
                        ) : 'Not assigned';
                      })()}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Sales Representative</Label>
                  {editingCustomerInfo ? (
                    <Select 
                      value={customerInfoForm.sales_representative_id} 
                      onValueChange={(v) => setCustomerInfoForm({...customerInfoForm, sales_representative_id: v === 'none' ? '' : v})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select rep" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">—</div>
                            <span>Not assigned</span>
                          </div>
                        </SelectItem>
                        {allTeamMembers?.map(m => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={m.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">{getInitials(m.full_name || m.email)}</AvatarFallback>
                              </Avatar>
                              <span>{m.full_name || m.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm mt-1">
                      {(() => {
                        const rep = allTeamMembers?.find(m => m.user_id === project.sales_representative_id);
                        return rep ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={rep.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">{getInitials(rep.full_name || rep.email)}</AvatarFallback>
                            </Avatar>
                            <span>{rep.full_name || rep.email}</span>
                          </div>
                        ) : 'Not assigned';
                      })()}
                    </div>
                  )}
                </div>
              </div>
              {editingCustomerInfo && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={saveCustomerInfo} disabled={savingCustomerInfo}>
                    {savingCustomerInfo ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contractor / Management Company */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <HardHat className="w-5 h-5" />
                Contractor / Management Company
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingContractorInfo(!editingContractorInfo)}
                className="h-6"
              >
                <Edit className="w-3 h-3 mr-1" />
                {editingContractorInfo ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Toggle for contractor managed */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">This project is managed by a contractor/third party</Label>
                </div>
                {editingContractorInfo ? (
                  <Switch
                    checked={contractorInfoForm.is_contractor_managed}
                    onCheckedChange={(checked) => setContractorInfoForm({...contractorInfoForm, is_contractor_managed: checked})}
                  />
                ) : (
                  <Badge variant={project.is_contractor_managed ? "default" : "secondary"}>
                    {project.is_contractor_managed ? "Yes" : "No"}
                  </Badge>
                )}
              </div>

              {/* Contractor details - show when contractor managed or in edit mode */}
              {(project.is_contractor_managed || editingContractorInfo) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Company Name</Label>
                    {editingContractorInfo ? (
                      <Input
                        value={contractorInfoForm.contractor_company_name}
                        onChange={(e) => setContractorInfoForm({...contractorInfoForm, contractor_company_name: e.target.value})}
                        placeholder="Company name"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium flex items-center gap-2 mt-1">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {project.contractor_company_name || 'Not provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Contact Person</Label>
                    {editingContractorInfo ? (
                      <Input
                        value={contractorInfoForm.contractor_contact_person}
                        onChange={(e) => setContractorInfoForm({...contractorInfoForm, contractor_contact_person: e.target.value})}
                        placeholder="Contact name"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {project.contractor_contact_person || 'Not provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone Number</Label>
                    {editingContractorInfo ? (
                      <Input
                        type="tel"
                        value={contractorInfoForm.contractor_phone}
                        onChange={(e) => setContractorInfoForm({...contractorInfoForm, contractor_phone: e.target.value})}
                        placeholder="Phone number"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {project.contractor_phone || 'Not provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    {editingContractorInfo ? (
                      <Input
                        type="email"
                        value={contractorInfoForm.contractor_email}
                        onChange={(e) => setContractorInfoForm({...contractorInfoForm, contractor_email: e.target.value})}
                        placeholder="Email address"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {project.contractor_email || 'Not provided'}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Company Address</Label>
                    {editingContractorInfo ? (
                      <Input
                        value={contractorInfoForm.contractor_address}
                        onChange={(e) => setContractorInfoForm({...contractorInfoForm, contractor_address: e.target.value})}
                        placeholder="Company address"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {project.contractor_address || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {editingContractorInfo && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={saveContractorInfo} disabled={savingContractorInfo}>
                    {savingContractorInfo ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="w-5 h-5" />
                Property Details
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingPropertyDetails(!editingPropertyDetails)}
                className="h-6"
              >
                <Edit className="w-3 h-3 mr-1" />
                {editingPropertyDetails ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Address</Label>
                <p className="text-sm font-medium flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {project.address || 'Not provided'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Project Type</Label>
                  <p className="text-sm font-medium mt-1">
                    {project.project_type === 'residential-installation' && '🏠 Residential Installation'}
                    {project.project_type === 'residential-repair' && '🔧 Residential Repair'}
                    {project.project_type === 'commercial-installation' && '🏢 Commercial Installation'}
                    {project.project_type === 'commercial-repair' && '🔨 Commercial Repair'}
                    {project.project_type === 'inspection' && '🔍 Inspection'}
                    {project.project_type === 'Residential' && '🏠 Residential'}
                    {project.project_type === 'Commercial' && '🏢 Commercial'}
                    {!project.project_type && 'Not specified'}
                    {project.project_type && !['residential-installation', 'residential-repair', 'commercial-installation', 'commercial-repair', 'inspection', 'Residential', 'Commercial'].includes(project.project_type) && `🔨 ${project.project_type}`}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Property Type</Label>
                  {editingPropertyDetails ? (
                    <Select 
                      value={propertyDetailsForm.property_type} 
                      onValueChange={(v) => setPropertyDetailsForm({...propertyDetailsForm, property_type: v === 'none' ? '' : v})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—  None</SelectItem>
                        <SelectItem value="single-family">
                          <div className="flex items-center gap-2">🏡 Single Family</div>
                        </SelectItem>
                        <SelectItem value="multi-family">
                          <div className="flex items-center gap-2">🏘️ Multi Family</div>
                        </SelectItem>
                        <SelectItem value="commercial">
                          <div className="flex items-center gap-2">🏢 Commercial</div>
                        </SelectItem>
                        <SelectItem value="industrial">
                          <div className="flex items-center gap-2">🏭 Industrial</div>
                        </SelectItem>
                        <SelectItem value="condo">
                          <div className="flex items-center gap-2">🏠 Condo</div>
                        </SelectItem>
                        <SelectItem value="townhouse">
                          <div className="flex items-center gap-2">🏘️ Townhouse</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">
                      {project.property_type === 'single-family' && '🏡 Single Family'}
                      {project.property_type === 'multi-family' && '🏘️ Multi Family'}
                      {project.property_type === 'commercial' && '🏢 Commercial'}
                      {project.property_type === 'industrial' && '🏭 Industrial'}
                      {project.property_type === 'condo' && '🏠 Condo'}
                      {project.property_type === 'townhouse' && '🏘️ Townhouse'}
                      {!project.property_type && 'Not specified'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Timeline</Label>
                  {editingPropertyDetails ? (
                    <Select 
                      value={propertyDetailsForm.timeline} 
                      onValueChange={(v) => setPropertyDetailsForm({...propertyDetailsForm, timeline: v === 'none' ? '' : v})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—  None</SelectItem>
                        <SelectItem value="ASAP">
                          <div className="flex items-center gap-2">🚨 ASAP</div>
                        </SelectItem>
                        <SelectItem value="Within 1 month">
                          <div className="flex items-center gap-2">📅 Within 1 month</div>
                        </SelectItem>
                        <SelectItem value="Within 3 months">
                          <div className="flex items-center gap-2">📆 Within 3 months</div>
                        </SelectItem>
                        <SelectItem value="Within 6 months">
                          <div className="flex items-center gap-2">🗓️ Within 6 months</div>
                        </SelectItem>
                        <SelectItem value="Just planning">
                          <div className="flex items-center gap-2">💭 Just planning</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">
                      {project.timeline === 'ASAP' && '🚨 ASAP'}
                      {project.timeline === 'Within 1 month' && '📅 Within 1 month'}
                      {project.timeline === 'Within 3 months' && '📆 Within 3 months'}
                      {project.timeline === 'Within 6 months' && '🗓️ Within 6 months'}
                      {project.timeline === 'Just planning' && '💭 Just planning'}
                      {!project.timeline && 'Not specified'}
                    </p>
                  )}
                </div>
              </div>
              {editingPropertyDetails && (
                <div className="flex justify-end">
                  <Button onClick={savePropertyDetails} disabled={savingPropertyDetails}>
                    {savingPropertyDetails ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="text-sm font-medium flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {format(new Date(project.created_at), 'MM/dd/yyyy')}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                  <p className="text-sm font-medium flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {project.start_date ? format(new Date(project.start_date), 'MM/dd/yyyy') : 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">End Date</Label>
                  <p className="text-sm font-medium flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {project.end_date ? format(new Date(project.end_date), 'MM/dd/yyyy') : 'Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roof Specifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <HardHat className="w-5 h-5" />
                Roof Specifications
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingRoofSpecs(!editingRoofSpecs)}
                className="h-6"
              >
                <Edit className="w-3 h-3 mr-1" />
                {editingRoofSpecs ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Existing Roof</Label>
                  {editingRoofSpecs ? (
                    <Input
                      value={roofSpecsForm.existing_roof}
                      onChange={(e) => setRoofSpecsForm({...roofSpecsForm, existing_roof: e.target.value})}
                      placeholder="e.g., Asphalt Shingles"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{project.existing_roof || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Wanted Roof</Label>
                  {editingRoofSpecs ? (
                    <Input
                      value={roofSpecsForm.wanted_roof}
                      onChange={(e) => setRoofSpecsForm({...roofSpecsForm, wanted_roof: e.target.value})}
                      placeholder="e.g., Standing Seam Metal"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{project.wanted_roof || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Existing Roof Deck</Label>
                  {editingRoofSpecs ? (
                    <Select 
                      value={roofSpecsForm.existing_roof_deck} 
                      onValueChange={(v) => setRoofSpecsForm({...roofSpecsForm, existing_roof_deck: v === 'none' ? '' : v})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select deck type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="OSB (Oriented Strand Board)">OSB (Oriented Strand Board)</SelectItem>
                        <SelectItem value="Plywood">Plywood</SelectItem>
                        <SelectItem value="Skip Sheathing">Skip Sheathing</SelectItem>
                        <SelectItem value="Tongue and Groove">Tongue and Groove</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">{project.existing_roof_deck || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Wanted Roof Deck</Label>
                  {editingRoofSpecs ? (
                    <Select 
                      value={roofSpecsForm.wanted_roof_deck} 
                      onValueChange={(v) => setRoofSpecsForm({...roofSpecsForm, wanted_roof_deck: v === 'none' ? '' : v})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select deck type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="OSB (Oriented Strand Board)">OSB (Oriented Strand Board)</SelectItem>
                        <SelectItem value="Plywood">Plywood</SelectItem>
                        <SelectItem value="Skip Sheathing">Skip Sheathing</SelectItem>
                        <SelectItem value="Tongue and Groove">Tongue and Groove</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">{project.wanted_roof_deck || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Insulation</Label>
                  {editingRoofSpecs ? (
                    <Input
                      value={roofSpecsForm.insulation}
                      onChange={(e) => setRoofSpecsForm({...roofSpecsForm, insulation: e.target.value})}
                      placeholder='e.g., 1/2"'
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{project.insulation || 'Not specified'}</p>
                  )}
                </div>
              </div>
              {editingRoofSpecs && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={saveRoofSpecs} disabled={savingRoofSpecs}>
                    {savingRoofSpecs ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Notes & Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Project Notes & Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Project Story</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingDescription(!editingDescription);
                      setEditDescriptionValue(project.description || '');
                    }}
                    className="h-6"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    {editingDescription ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
                {editingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editDescriptionValue}
                      onChange={(e) => setEditDescriptionValue(e.target.value)}
                      placeholder="Enter the project story description..."
                      rows={4}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={saveDescriptionEdit} disabled={savingDescription}>
                      {savingDescription ? 'Saving...' : 'Save Story'}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {project.description || 'No description provided'}
                  </p>
                )}
              </div>

              {project.original_scope && (
                <div>
                  <Label className="text-xs text-muted-foreground">Original Scope</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{project.original_scope}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Classification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Project Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Roof Type</Label>
                  <Select value={editRoofType} onValueChange={setEditRoofType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select roof type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="Standing Seam">Standing Seam</SelectItem>
                      <SelectItem value="Metal Panels">Metal Panels</SelectItem>
                      <SelectItem value="Stone Coated">Stone Coated</SelectItem>
                      <SelectItem value="Shingles">Shingles</SelectItem>
                      <SelectItem value="Tile Roof">Tile Roof</SelectItem>
                      <SelectItem value="Flat Roof">Flat Roof</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={saveClassification} disabled={savingClassification} className="w-full">
                {savingClassification ? 'Saving...' : 'Save Classification'}
              </Button>
            </CardContent>
          </Card>

          {/* Visibility Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Visibility & Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Public Visibility</Label>
                  <p className="text-sm text-muted-foreground">Allow this project to be visible to customers</p>
                </div>
                <Switch
                  checked={project.is_public || false}
                  onCheckedChange={() => handleVisibilityToggle(project.is_public || false)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Featured Project</Label>
                  <p className="text-sm text-muted-foreground">Highlight this project on the website</p>
                </div>
                <Switch
                  checked={project.is_featured || false}
                  onCheckedChange={() => handleFeaturedToggle(project.is_featured || false)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.project_assignments && project.project_assignments.length > 0 ? (
                <div className="space-y-2">
                  {project.project_assignments.map((assignment: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{assignment.customer_email}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No customer assignments</p>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="destructive" onClick={deleteProject} className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Project
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
