import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { LogOut, Calendar, MapPin, Camera, MessageSquare, Download, Share2, ArrowRight } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  start_date?: string;
  end_date?: string;
  address?: string;
  project_type?: string;
}

interface ProjectPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  uploaded_at: string;
  display_order: number;
  photo_tag: 'before' | 'after' | null;
  is_highlighted_before?: boolean;
  is_highlighted_after?: boolean;
}

interface ProjectUpdate {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

// Helper function to validate and cast photo_tag values
const validatePhotoTag = (tag: any): 'before' | 'after' | null => {
  if (tag === 'before' || tag === 'after') {
    return tag;
  }
  return null;
};

const CustomerDashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectPhotos, setProjectPhotos] = useState<ProjectPhoto[]>([]);
  const [allProjectPhotos, setAllProjectPhotos] = useState<ProjectPhoto[]>([]);
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparisonSlider, setComparisonSlider] = useState([50]);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProjects();
  }, [user, navigate]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      
      if (data && data.length > 0) {
        setSelectedProject(data[0]);
        fetchProjectDetails(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    try {
      // Fetch all photos for count
      const { data: allPhotos, error: allPhotosError } = await supabase
        .from('project_photos')
        .select('*')
        .eq('project_id', projectId)
        .order('display_order', { ascending: true })
        .order('uploaded_at', { ascending: true });

      if (allPhotosError) throw allPhotosError;
      
      // Validate and cast photo_tag values for all photos
      const validatedAllPhotos = (allPhotos || []).map(photo => ({
        ...photo,
        photo_tag: validatePhotoTag(photo.photo_tag)
      }));
      
      setAllProjectPhotos(validatedAllPhotos);

      // Fetch photos visible to customer
      const { data: photos, error: photosError } = await supabase
        .from('project_photos')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_visible_to_customer', true)
        .order('display_order', { ascending: true })
        .order('uploaded_at', { ascending: true });

      if (photosError) throw photosError;
      
      // Validate and cast photo_tag values for visible photos
      const validatedPhotos: ProjectPhoto[] = (photos || []).map(photo => ({
        ...photo,
        photo_tag: validatePhotoTag(photo.photo_tag)
      }));
      
      setProjectPhotos(validatedPhotos);

      // Fetch updates
      const { data: updates, error: updatesError } = await supabase
        .from('project_updates')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_visible_to_customer', true)
        .order('created_at', { ascending: false });

      if (updatesError) throw updatesError;
      setProjectUpdates(updates || []);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadPhoto = (photoUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sharePhoto = async (photoUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Project Photo',
          text: 'Check out this progress photo from my roofing project!',
          url: photoUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(photoUrl);
      toast({
        title: "Copied!",
        description: "Photo URL copied to clipboard",
      });
    }
  };

  // Get before and after photos
  const beforePhotos = projectPhotos.filter(photo => photo.photo_tag === 'before');
  const afterPhotos = projectPhotos.filter(photo => photo.photo_tag === 'after');
  const otherPhotos = projectPhotos.filter(photo => !photo.photo_tag);

  // Get the highlighted photos for the main slider (or fallback to first available)
  const primaryBefore = beforePhotos.find(p => p.is_highlighted_before) || beforePhotos[0];
  const primaryAfter = afterPhotos.find(p => p.is_highlighted_after) || afterPhotos[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md">
                <div className="w-5 h-5 bg-white rounded-sm"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Projects</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.email}</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No projects assigned</h3>
              <p className="text-muted-foreground">
                You don't have any projects assigned to you yet. Please contact your contractor.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Project List */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold mb-4">Your Projects</h2>
              <div className="space-y-4">
                {projects.map((project) => (
                  <Card 
                    key={project.id}
                    className={`cursor-pointer transition-all ${
                      selectedProject?.id === project.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => {
                      setSelectedProject(project);
                      fetchProjectDetails(project.id);
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {project.project_type && (
                        <CardDescription>{project.project_type}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Project Details */}
            <div className="lg:col-span-3">
              {selectedProject ? (
                <div className="space-y-6">
                  {/* Project Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl">{selectedProject.name}</CardTitle>
                          {selectedProject.description && (
                            <CardDescription className="mt-2 text-base">
                              {selectedProject.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge className={getStatusColor(selectedProject.status)}>
                          {selectedProject.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedProject.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                            <span>{selectedProject.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <span>Started {format(new Date(selectedProject.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Before & After Showcase */}
                  {(primaryBefore || primaryAfter) && (
                    <Card className="overflow-hidden">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ArrowRight className="w-5 h-5" />
                          Project Transformation
                        </CardTitle>
                        <CardDescription>
                          See how your project has transformed over time
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {primaryBefore && primaryAfter ? (
                          <div className="relative h-96 overflow-hidden rounded-lg bg-gray-100">
                            {/* After image (full width) */}
                            <img
                              src={primaryAfter.photo_url}
                              alt="After"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            
                            {/* Before image (clipped by slider) */}
                            <div 
                              className="absolute inset-0 overflow-hidden"
                              style={{ clipPath: `inset(0 ${100 - comparisonSlider[0]}% 0 0)` }}
                            >
                              <img
                                src={primaryBefore.photo_url}
                                alt="Before"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* Slider handle */}
                            <div 
                              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                              style={{ left: `${comparisonSlider[0]}%` }}
                            >
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                                <ArrowRight className="w-4 h-4" />
                              </div>
                            </div>
                            
                            {/* Labels */}
                            <div className="absolute top-4 left-4">
                              <Badge variant="secondary" className="bg-black/70 text-white">
                                Before
                              </Badge>
                            </div>
                            <div className="absolute top-4 right-4">
                              <Badge variant="secondary" className="bg-black/70 text-white">
                                After
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {primaryBefore && (
                              <div className="relative">
                                <img
                                  src={primaryBefore.photo_url}
                                  alt="Before"
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                                <Badge className="absolute top-2 left-2 bg-blue-100 text-blue-800">
                                  Before
                                </Badge>
                              </div>
                            )}
                            {primaryAfter && (
                              <div className="relative">
                                <img
                                  src={primaryAfter.photo_url}
                                  alt="After"
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                                <Badge className="absolute top-2 left-2 bg-green-100 text-green-800">
                                  After
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {primaryBefore && primaryAfter && (
                          <div className="mt-4">
                            <Slider
                              value={comparisonSlider}
                              onValueChange={setComparisonSlider}
                              max={100}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-sm text-muted-foreground mt-1">
                              <span>Before</span>
                              <span>After</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Project Photos */}
                  {otherPhotos.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Camera className="w-5 h-5" />
                          Additional Project Photos ({otherPhotos.length})
                        </CardTitle>
                        <CardDescription>
                          Chronological timeline of your project progress
                          {allProjectPhotos.length > projectPhotos.length && (
                            <span className="block mt-1 text-xs">
                              ({allProjectPhotos.length} total photos uploaded, {projectPhotos.length} visible to you)
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {otherPhotos.map((photo) => (
                            <div key={photo.id} className="relative group">
                              <img
                                src={photo.photo_url}
                                alt={photo.caption || 'Project photo'}
                                className="w-full h-48 object-cover rounded-lg shadow-md"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => downloadPhoto(photo.photo_url, `project-photo-${photo.id}.jpg`)}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => sharePhoto(photo.photo_url)}
                                  >
                                    <Share2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(photo.uploaded_at), 'MMM d, yyyy h:mm a')}
                                </p>
                                {photo.caption && (
                                  <p className="text-sm font-medium">{photo.caption}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Project Updates */}
                  {projectUpdates.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Project Updates ({projectUpdates.length})
                        </CardTitle>
                        <CardDescription>
                          Latest updates from your contractor
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {projectUpdates.map((update) => (
                            <div key={update.id} className="border-l-4 border-primary pl-4 pb-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">{update.title}</h4>
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(update.created_at), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                              <p className="text-muted-foreground">{update.content}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {projectPhotos.length === 0 && projectUpdates.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Camera className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No updates yet</h3>
                        <p className="text-muted-foreground">
                          Your contractor will share photos and updates as work progresses.
                          {allProjectPhotos.length > 0 && (
                            <span className="block mt-2 text-sm">
                              ({allProjectPhotos.length} photos have been uploaded and are being reviewed)
                            </span>
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Select a project</h3>
                    <p className="text-muted-foreground">
                      Choose a project from the left to view its details and progress.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
