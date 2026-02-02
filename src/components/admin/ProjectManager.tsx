import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Plus, Eye, Edit, MapPin, Camera, EyeOff, Star, TrendingUp, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';
import { useProjectManagement } from '../../hooks/use-project-management';
import { useProjectsWithPhotos, type ProjectWithPhoto } from '../../hooks/useProjectsWithPhotos';
import FiltersBar from '@/components/filters/FiltersBar';
import type { CategoryValue, RoofTypeValue } from '@/components/filters/FiltersBar';
const ProjectManager = () => {
  const navigate = useNavigate();
  const {
    projects,
    allProjects,
    loading,
    searchQuery,
    setSearchQuery,
    refetch
  } = useProjectsWithPhotos();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const {
    toast
  } = useToast();
  const {
    updateProjectVisibility
  } = useProjectManagement();

  // Filters (Admin parity)
  const [selectedCategories, setSelectedCategories] = useState<CategoryValue[]>([]);
  const [selectedRoofTypes, setSelectedRoofTypes] = useState<RoofTypeValue[]>([]);
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'photos'>('newest');
  const categories = useMemo(() => [{
    label: 'Residential',
    value: 'Residential' as CategoryValue
  }, {
    label: 'Commercial',
    value: 'Commercial' as CategoryValue
  }], []);
  const roofTypes = useMemo(() => [{
    label: 'Standing Seam',
    value: 'Standing Seam' as RoofTypeValue
  }, {
    label: 'Metal Panels',
    value: 'Metal Panels' as RoofTypeValue
  }, {
    label: 'Stone Coated',
    value: 'Stone Coated' as RoofTypeValue
  }, {
    label: 'Shingles',
    value: 'Shingles' as RoofTypeValue
  }, {
    label: 'Flat Roof',
    value: 'Flat Roof' as RoofTypeValue
  }], []);
  const hasActiveFilters = selectedCategories.length > 0 || selectedRoofTypes.length > 0 || sortOption !== 'newest';
  const filteredProjects = useMemo(() => {
    let list = [...projects];
    if (selectedCategories.length > 0) {
      list = list.filter(p => p.project_category ? selectedCategories.includes(p.project_category as CategoryValue) : false);
    }
    if (selectedRoofTypes.length > 0) {
      list = list.filter(p => p.roof_type ? selectedRoofTypes.includes(p.roof_type as RoofTypeValue) : false);
    }

    // Sort by featured status first, then by selected sort option
    list.sort((a, b) => {
      // Featured projects come first
      if (a.is_featured !== b.is_featured) {
        return a.is_featured ? -1 : 1;
      }

      // Then apply the selected sort option
      if (sortOption === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortOption === 'photos') {
        // Sort by projects with photos first
        const aHasPhoto = a.best_photo ? 1 : 0;
        const bHasPhoto = b.best_photo ? 1 : 0;
        if (aHasPhoto !== bHasPhoto) {
          return bHasPhoto - aHasPhoto;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        // 'newest' 
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
  }, [projects, selectedCategories, selectedRoofTypes, sortOption]);
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedRoofTypes([]);
    setSortOption('newest');
  };
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    project_category: '',
    roof_type: '',
    project_type: '',
    address: '',
    start_date: '',
    end_date: '',
    customer_emails: '',
    is_public: false
  });
  const createProject = async () => {
    try {
      const {
        data: {
          user
        },
        error: userError
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      const {
        data: projectData,
        error: projectError
      } = await supabase.from('projects').insert({
        name: newProject.name,
        description: newProject.description,
        // Keep legacy project_type in sync for backward compatibility
        project_type: newProject.project_category || null,
        // New classification fields
        project_category: newProject.project_category || null,
        roof_type: newProject.roof_type || null,
        address: newProject.address,
        start_date: newProject.start_date || null,
        end_date: newProject.end_date || null,
        status: 'planning',
        created_by: user.id,
        is_public: newProject.is_public
      }).select().maybeSingle();
      if (projectError) throw projectError;

      // Add customer assignments if provided
      if (newProject.customer_emails.trim()) {
        const emails = newProject.customer_emails.split(',').map(email => email.trim());
        const assignments = emails.map(email => ({
          project_id: projectData.id,
          customer_email: email,
          assigned_by: user.id
        }));
        const {
          error: assignmentError
        } = await supabase.from('project_assignments').insert(assignments);
        if (assignmentError) throw assignmentError;
      }
      toast({
        title: "Success",
        description: "Project created successfully"
      });
      setShowCreateDialog(false);
      setNewProject({
        name: '',
        description: '',
        project_category: '',
        roof_type: '',
        project_type: '',
        address: '',
        start_date: '',
        end_date: '',
        customer_emails: '',
        is_public: false
      });
      refetch();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    }
  };
  const handleVisibilityToggle = async (projectId: string, currentVisibility: boolean) => {
    const newVisibility = !currentVisibility;
    try {
      const {
        error
      } = await supabase.from('projects').update({
        is_public: newVisibility
      }).eq('id', projectId);
      if (error) throw error;
      toast({
        title: "Success",
        description: `Project ${newVisibility ? 'made public' : 'made private'} successfully`
      });
      refetch();
    } catch (error) {
      console.error('Error updating project visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update project visibility",
        variant: "destructive"
      });
    }
  };
  const handleFeaturedToggle = async (projectId: string, currentFeatured: boolean) => {
    const newFeatured = !currentFeatured;
    try {
      const {
        error
      } = await supabase.from('projects').update({
        is_featured: newFeatured
      }).eq('id', projectId);
      if (error) {
        if (error.message.includes('Cannot feature more than 3 projects')) {
          toast({
            title: "Limit Reached",
            description: "You can only feature 3 projects at a time. Please unfeature another project first.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }
      toast({
        title: "Success",
        description: `Project ${newFeatured ? 'featured' : 'unfeatured'} successfully`
      });
      refetch();
    } catch (error) {
      console.error('Error updating project featured status:', error);
      toast({
        title: "Error",
        description: "Failed to update project featured status",
        variant: "destructive"
      });
    }
  };
  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const {
        error
      } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
      refetch();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'on_hold':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="space-y-6" data-component="ProjectManager" data-file="src/components/admin/ProjectManager.tsx">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Project Management</h2>
          <p className="text-muted-foreground">Manage customer projects, visibility, and assignments</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Project
        </Button>
      </div>

      {/* Smart Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search projects by name, address, customer email, or status..." className="pl-10 h-12 text-base border-2 focus:border-primary" />
        {searchQuery && <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>}
      </div>

      {/* Search Results Summary */}
      {searchQuery && <div className="text-sm text-muted-foreground">
          Found {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} matching "{searchQuery}"
        </div>}

      {/* Admin Filters Bar */}
      <FiltersBar className="bg-card border rounded-lg p-4" categories={categories} roofTypes={roofTypes} selectedCategories={selectedCategories} selectedRoofTypes={selectedRoofTypes} onToggleCategory={v => setSelectedCategories(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])} onToggleRoofType={v => setSelectedRoofTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])} sort={sortOption} onSortChange={setSortOption} onClearAll={clearAllFilters} resultCount={filteredProjects.length} totalCount={allProjects.length} />

      {/* Modern Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProjects.map(project => <Card key={project.id} className={`group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${project.is_featured ? 'ring-2 ring-accent' : ''}`} onClick={() => navigate(`/admin/projects/${project.id}/details`)}>
            {/* Hero Image Section */}
            <div className="relative h-48 overflow-hidden bg-muted">
              {project.best_photo ? <img src={project.best_photo.photo_url} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <Camera className="w-12 h-12 text-muted-foreground/50" />
                </div>}
              
              {/* Status and Featured Overlays */}
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className={`${getStatusColor(project.status)} shadow-sm`}>
                  {project.status.replace('_', ' ')}
                </Badge>
                {project.is_featured && <Badge className="bg-accent text-accent-foreground shadow-sm">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Featured
                  </Badge>}
              </div>
              
              {/* Visibility Indicator */}
              <div className="absolute top-3 right-3">
                {project.is_public ? <div className="bg-green-500 text-white p-1.5 rounded-full shadow-sm">
                    <Eye className="w-3 h-3" />
                  </div> : <div className="bg-gray-400 text-white p-1.5 rounded-full shadow-sm">
                    <EyeOff className="w-3 h-3" />
                  </div>}
              </div>
              
              {/* Gradient Overlay for Text Readability */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
              
              {/* Project Name Overlay */}
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="font-semibold text-white text-lg truncate drop-shadow-sm">
                  {project.name}
                </h3>
                {project.address && <p className="text-white/90 text-sm truncate mt-1 drop-shadow-sm">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {project.address}
                  </p>}
              </div>
            </div>

            {/* Card Content */}
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Project Details */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {format(new Date(project.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                
                {project.project_category && <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="outline" className="text-xs">
                      {project.project_category}
                    </Badge>
                  </div>}
                
                {project.roof_type && <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Roof</span>
                    <Badge variant="outline" className="text-xs">
                      {project.roof_type}
                    </Badge>
                  </div>}

                {/* Quick Actions - Revealed on Hover */}
                
              </div>
            </CardContent>
          </Card>)}
      </div>

      {filteredProjects.length === 0 && <Card className="col-span-full">
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? `No projects found matching "${searchQuery}"` : 'No projects match those filters'}
              </h3>
              <div className="flex gap-2 justify-center">
                {searchQuery && <Button onClick={() => setSearchQuery('')} variant="outline">
                    Clear search
                  </Button>}
                <Button onClick={clearAllFilters}>Clear all filters</Button>
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project and configure its visibility settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input id="name" value={newProject.name} onChange={e => setNewProject({
              ...newProject,
              name: e.target.value
            })} placeholder="Enter project name" />
            </div>
            
            <div>
              <Label htmlFor="address">Property Address</Label>
              <Input id="address" value={newProject.address} onChange={e => setNewProject({
              ...newProject,
              address: e.target.value
            })} placeholder="Enter property address" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project_category">Project Category</Label>
                <Select value={newProject.project_category} onValueChange={value => setNewProject({
                ...newProject,
                project_category: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Residential">Residential</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="roof_type">Roof Type</Label>
                <Select value={newProject.roof_type} onValueChange={value => setNewProject({
                ...newProject,
                roof_type: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select roof type" />
                  </SelectTrigger>
                  <SelectContent>
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

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={newProject.description} onChange={e => setNewProject({
              ...newProject,
              description: e.target.value
            })} placeholder="Project description" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" type="date" value={newProject.start_date} onChange={e => setNewProject({
                ...newProject,
                start_date: e.target.value
              })} />
              </div>
              
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" type="date" value={newProject.end_date} onChange={e => setNewProject({
                ...newProject,
                end_date: e.target.value
              })} />
              </div>
            </div>

            <div>
              <Label htmlFor="customer_emails">Customer Emails (comma-separated)</Label>
              <Input id="customer_emails" value={newProject.customer_emails} onChange={e => setNewProject({
              ...newProject,
              customer_emails: e.target.value
            })} placeholder="customer1@email.com, customer2@email.com" />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="is_public" checked={newProject.is_public} onCheckedChange={checked => setNewProject({
              ...newProject,
              is_public: checked
            })} />
              <Label htmlFor="is_public">Make project public</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createProject} disabled={!newProject.name.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>;
};
export default ProjectManager;