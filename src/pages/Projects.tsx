import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ScrollLink from '../components/ui/scroll-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Slider } from '../components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import {
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Eye, 
  Phone,
  Mail,
  ChevronLeft,
  ChevronsLeftRight,
  X,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { format } from 'date-fns';
import ProjectCard from '../components/ProjectCard';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { ImageFit } from '../components/ui/ImageFit';
import { type CarouselApi, Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel';
import { useIsMobile } from '../hooks/use-mobile';
import { useOptimizedDrag } from '../hooks/useOptimizedDrag';
import { useBusiness, useAreas, useServices } from '../hooks/useBusinessConfig';
interface Project {
  id: string;
  name: string;
  description?: string;
  address?: string;
  project_type?: string;
  project_category?: string;
  roof_type?: string;
  created_at: string;
  is_public?: boolean;
  is_featured?: boolean;
}

interface ProjectPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  uploaded_at: string;
  photo_tag: 'before' | 'after' | null;
  is_highlighted_before?: boolean;
  is_highlighted_after?: boolean;
}

const Projects = () => {
  const { id: projectId } = useParams();
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectPhotos, setProjectPhotos] = useState<ProjectPhoto[]>([]);
  const [allProjectPhotos, setAllProjectPhotos] = useState<ProjectPhoto[]>([]);
  const [projectPhotoMap, setProjectPhotoMap] = useState<Record<string, ProjectPhoto[]>>({});
  const [loading, setLoading] = useState(true);
  const [comparisonSlider, setComparisonSlider] = useState([50]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
const [filterCategory, setFilterCategory] = useState<'all' | 'residential' | 'commercial'>('all');
const [filterRoof, setFilterRoof] = useState<'all' | 'standing_seam' | 'metal_panels' | 'stone_coated' | 'shingles' | 'flat_roof'>('all');
const { toast } = useToast();
  const isMobile = useIsMobile();

  // Business config for dynamic content
  const business = useBusiness();
  const areas = useAreas();
  const services = useServices();

  // Build dynamic area text
  const primaryArea = areas[0]?.name || 'your area';
  const areaText = areas.length > 1 ? `${primaryArea} and surrounding areas` : primaryArea;

  // Get primary service type for generic project descriptions
  const primaryService = services[0]?.name || 'our services';
  
  // Initialize optimized drag handlers to prevent forced reflows
  const { createMouseDragHandler, createTouchDragHandler, createHoverHandler } = useOptimizedDrag();

  // Carousel state for highlighting the active card CTA
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => {
      try {
        setActiveIndex(carouselApi.selectedScrollSnap());
      } catch {
        // no-op
      }
    };
    carouselApi.on('select', onSelect);
    onSelect();
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    fetchProjects();
    
    // Set up real-time subscription for project updates
    const instanceId = Math.random().toString(36).substring(7);
    const subscription = supabase
      .channel(`projects-updates-${instanceId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' }, 
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (projectId && (projects.length > 0 || featuredProjects.length > 0)) {
      const project = [...projects, ...featuredProjects].find(p => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        fetchProjectPhotos(project.id);
        
        // Handle scroll to transformation section if hash is present
        setTimeout(() => {
          if (location.hash === '#transformation') {
            const transformationElement = document.getElementById('transformation');
            if (transformationElement) {
              transformationElement.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }
          }
        }, 100);
      }
    } else {
      setSelectedProject(null);
    }
  }, [projectId, projects, featuredProjects, location.hash]);

  const fetchProjects = async () => {
    try {
      // Fetch regular projects
      const { data: regularData, error: regularError } = await supabase
        .from('projects')
        .select('*')
        .eq('is_public', true)
        .eq('is_featured', false)
        .order('created_at', { ascending: false });

      if (regularError) throw regularError;
      
      // Fetch featured projects (max 3)
      const { data: featuredData, error: featuredError } = await supabase
        .from('projects')
        .select('*')
        .eq('is_public', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (featuredError) throw featuredError;
      
      console.log('Fetched regular projects:', regularData);
      console.log('Fetched featured projects:', featuredData);
      
      setProjects(regularData || []);
      setFeaturedProjects(featuredData || []);

      // Fetch photos for all projects
      const allProjectIds = [
        ...(regularData || []).map(p => p.id),
        ...(featuredData || []).map(p => p.id)
      ];
      
      if (allProjectIds.length > 0) {
        await fetchAllProjectPhotos(allProjectIds);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProjectPhotos = async (projectIds: string[]) => {
    try {
      // Fetch only tagged photos for public projects (before/after only)
      const { data: allPhotos, error } = await supabase
        .from('project_photos')
        .select('*')
        .in('project_id', projectIds)
        .not('photo_tag', 'is', null)
        .order('uploaded_at', { ascending: true });

      if (error) throw error;
      
      const photosToUse = allPhotos || [];
      console.log('Fetched photos for all projects:', photosToUse.length);

      // Group photos by project
      const photoMap: Record<string, ProjectPhoto[]> = {};
      photosToUse.forEach(photo => {
        const validatedPhoto = {
          ...photo,
          photo_tag: validatePhotoTag(photo.photo_tag)
        };
        
        if (!photoMap[photo.project_id]) {
          photoMap[photo.project_id] = [];
        }
        photoMap[photo.project_id].push(validatedPhoto);
      });

      console.log('Photo map:', photoMap);
      setProjectPhotoMap(photoMap);
    } catch (error) {
      console.error('Error fetching project photos:', error);
    }
  };

  const fetchProjectPhotos = async (projectId: string) => {
    try {
      console.log('Fetching photos for project:', projectId);
      
      // Fetch only tagged photos for public viewing (before/after only)
      const { data: allPhotos, error } = await supabase
        .from('project_photos')
        .select('*')
        .eq('project_id', projectId)
        .not('photo_tag', 'is', null)
        .order('uploaded_at', { ascending: true });

      if (error) throw error;
      
      console.log('All photos fetched:', allPhotos);
      
      // Validate and cast photo_tag values for all photos
      const validatedPhotos: ProjectPhoto[] = (allPhotos || []).map(photo => ({
        ...photo,
        photo_tag: validatePhotoTag(photo.photo_tag)
      }));
      
      setAllProjectPhotos(validatedPhotos);
      setProjectPhotos(validatedPhotos);
    } catch (error) {
      console.error('Error fetching project photos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch project photos",
        variant: "destructive",
      });
    }
  };

  const validatePhotoTag = (tag: any): 'before' | 'after' | null => {
    if (tag === 'before' || tag === 'after') {
      return tag;
    }
    return null;
  };

  const getPhotoTagBadge = (tag: 'before' | 'after' | null) => {
    if (tag === 'before') {
      return <Badge className="absolute top-2 left-2 bg-blue-600 text-white">Before</Badge>;
    }
    if (tag === 'after') {
      return <Badge className="absolute top-2 left-2 bg-green-600 text-white">After</Badge>;
    }
    // Since untagged photos won't be shown to customers, this should never render
    return null;
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % projectPhotos.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + projectPhotos.length) % projectPhotos.length);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevImage(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nextImage(); }
      if (e.key === 'Escape') { e.preventDefault(); setLightboxOpen(false); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, prevImage, nextImage]);

// Simple filter (AND across groups), newest first
const toSlug = (s?: string | null) =>
  s ? s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') : '';

type CategorySlug = 'residential' | 'commercial';
const CATEGORY_OPTIONS: { label: string; slug: CategorySlug }[] = [
  { label: 'Residential', slug: 'residential' },
  { label: 'Commercial', slug: 'commercial' },
];

type RoofSlug = 'standing_seam' | 'metal_panels' | 'stone_coated' | 'shingles' | 'flat_roof';
const ROOF_OPTIONS: { label: string; slug: RoofSlug }[] = [
  { label: 'Standing Seam', slug: 'standing_seam' },
  { label: 'Metal Panels', slug: 'metal_panels' },
  { label: 'Stone Coated', slug: 'stone_coated' },
  { label: 'Shingles', slug: 'shingles' },
  { label: 'Flat Roof', slug: 'flat_roof' },
];



const filteredProjects = projects
  .filter(project => {
    const projectCategorySlug = toSlug(project.project_category || project.project_type || '');
    const projectRoofSlug = toSlug(project.roof_type || '');
    const matchesCategory = filterCategory === 'all' || projectCategorySlug === filterCategory;
    const matchesRoof = filterRoof === 'all' || projectRoofSlug === filterRoof;
    return matchesCategory && matchesRoof;
  })
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

const totalCount = projects.length;
const shownCount = filteredProjects.length;

// Filters are always shown for customers (simple view)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-white">
        <RoofingFriendHeader />
        <div className="w-full flex items-center justify-center py-12 sm:py-16 lg:py-20">
          <div className="text-center px-4">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">Loading our amazing projects...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // If viewing a specific project, show detailed view
  if (selectedProject && projectId) {
    const beforePhotos = projectPhotos.filter(photo => photo.photo_tag === 'before');
    const afterPhotos = projectPhotos.filter(photo => photo.photo_tag === 'after');
    const primaryBefore = beforePhotos.find(p => p.is_highlighted_before) || beforePhotos[0];
    const primaryAfter = afterPhotos.find(p => p.is_highlighted_after) || afterPhotos[0];

    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-white">
        <RoofingFriendHeader />
        
        {/* Hero Section with Navigation */}
        <div className="w-full bg-white border-b shadow-sm sticky top-0 z-40">
          <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="flex items-center justify-between h-12 sm:h-14 lg:h-16">
              <ScrollLink to="/projects" className="flex items-center space-x-1 sm:space-x-2 text-primary hover:text-primary/80">
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base font-medium">Back to Projects</span>
              </ScrollLink>
              <div className="text-center">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Project Details</h1>
              </div>
              <div className="w-16 sm:w-20 lg:w-24"></div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-12">
          <div className="w-full space-y-8 sm:space-y-10 lg:space-y-12">
            {/* Project Header */}
            <div className="text-center space-y-3 sm:space-y-4 lg:space-y-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight px-2">
                {selectedProject.name}
              </h2>
              <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 lg:gap-6 text-sm sm:text-base text-gray-500 px-4">
                {selectedProject.address && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm lg:text-base">{selectedProject.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm lg:text-base">Completed {format(new Date(selectedProject.created_at), 'MMMM yyyy')}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm lg:text-base">{allProjectPhotos.length} Total Photos</span>
                </div>
                {(selectedProject.project_category || selectedProject.project_type || selectedProject.roof_type) && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 sm:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm">
                      {(selectedProject.project_category || selectedProject.project_type) || 'Project'}
                      {selectedProject.roof_type ? ` • ${selectedProject.roof_type}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Before & After Showcase */}
            {(primaryBefore || primaryAfter) && (
              <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden" id="transformation">
                <div className="p-4 sm:p-6 lg:p-8 text-center bg-gradient-to-r from-primary/5 to-primary/10">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Amazing Transformation</h3>
                  <p className="text-sm sm:text-base text-gray-600">See the incredible before and after results</p>
                </div>
                
                <div className="p-4 sm:p-6 lg:p-8">
                {primaryBefore && primaryAfter ? (
                    <div 
                      className="relative w-full rounded-xl overflow-hidden bg-secondary aspect-[4/3] md:aspect-video"
                      data-comparison-container
                      onMouseMove={createHoverHandler((percentage) => setComparisonSlider([percentage]))}
                    >
                      {/* After image (full area) */}
                      <div className="absolute inset-0">
                        <ImageFit
                          src={primaryAfter.photo_url}
                          alt="After transformation"
                          mode="contain"
                        />
                      </div>
                      
                      {/* Before image (clipped by slider) */}
                      <div 
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: `inset(0 ${100 - comparisonSlider[0]}% 0 0)` }}
                      >
                        <ImageFit
                          src={primaryBefore.photo_url}
                          alt="Before transformation"
                          mode="contain"
                        />
                      </div>
                      
                      {/* Slider handle */}
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
                        style={{ left: `${comparisonSlider[0]}%` }}
                      >
                        <div 
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-primary cursor-grab active:cursor-grabbing pointer-events-auto touch-none"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const container = e.currentTarget.closest('[data-comparison-container]') as HTMLElement;
                            if (!container) return;
                            createMouseDragHandler(container, (percentage) => setComparisonSlider([percentage]));
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            const container = e.currentTarget.closest('[data-comparison-container]') as HTMLElement;
                            if (!container) return;
                            createTouchDragHandler(container, (percentage) => setComparisonSlider([percentage]));
                          }}
                        >
                          <ChevronsLeftRight className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      
                      {/* Labels */}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-blue-600 text-white text-sm px-3 py-1">Before</Badge>
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-600 text-white text-sm px-3 py-1">After</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {primaryBefore && (
                        <div className="relative">
                          <img
                            src={primaryBefore.photo_url}
                            alt="Before"
                            className="w-full h-64 md:h-80 object-cover rounded-xl"
                          />
                          <Badge className="absolute top-4 left-4 bg-blue-600 text-white">Before</Badge>
                        </div>
                      )}
                      {primaryAfter && (
                        <div className="relative">
                          <img
                            src={primaryAfter.photo_url}
                            alt="After"
                            className="w-full h-64 md:h-80 object-cover rounded-xl"
                          />
                          <Badge className="absolute top-4 left-4 bg-green-600 text-white">After</Badge>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {primaryBefore && primaryAfter && (
                    <div className="mt-6">
                      <Slider
                        value={comparisonSlider}
                        onValueChange={setComparisonSlider}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>← Before</span>
                        <span>After →</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            {projectPhotos.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Project Gallery</h3>
                      <p className="text-gray-600 mt-1">{projectPhotos.length} photos showcasing our craftsmanship</p>
                    </div>
                    <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          View Full Gallery
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {projectPhotos.map((photo, index) => (
                      <div 
                        key={photo.id} 
                        className="relative group cursor-pointer overflow-hidden rounded-lg hover:shadow-lg transition-all duration-300"
                        onClick={() => openLightbox(index)}
                      >
                        <img
                          src={photo.photo_url}
                          alt={photo.caption || `Project photo ${index + 1}`}
                          className="w-full h-40 md:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {getPhotoTagBadge(photo.photo_tag)}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 border-b bg-gradient-to-r from-gray-50 to-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900">Project Gallery</h3>
                  <p className="text-gray-600 mt-1">Check back soon for photo updates</p>
                </div>
                
                <div className="p-8 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <Eye className="w-12 h-12 text-gray-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Photos Coming Soon!</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Our team is hard at work documenting this project. Check back soon to see the amazing transformation photos!
                  </p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Check for Updates
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8 md:p-12 text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready for Your Transformation?</h3>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Get a free, no-obligation estimate for your project.
                  Our experts will assess your needs and provide a detailed quote.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href={`tel:${business.phoneRaw}`}>
                    <Button size="lg" className="bg-accent hover:bg-accent/90">
                      Call for Free Estimate
                    </Button>
                  </a>
                  <a href="/contact">
                    <Button variant="outline" size="lg" className="px-8 py-4 text-lg rounded-xl border-2">
                      Email Us
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* More Projects CTA */}
            {business.social?.google && (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Want to see even more of our work?</p>
                <Button variant="outline" asChild className="rounded-xl">
                  <a
                    href={business.social.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    View Our Google Profile
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Lightbox Modal */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-6xl w-full p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>Project Gallery</DialogTitle>
              <DialogDescription>
                Photo {lightboxIndex + 1} of {projectPhotos.length}
              </DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <div className="relative mx-auto w-full max-w-5xl h-[min(80vh,70vw)] max-h-[calc(100vh-160px)] rounded-xl overflow-hidden bg-background">
                {projectPhotos[lightboxIndex] && (
                  <>
                    <ImageFit
                      src={projectPhotos[lightboxIndex].photo_url}
                      alt={projectPhotos[lightboxIndex].caption || `Project photo ${lightboxIndex + 1}`}
                      mode="contain"
                    />
                    {projectPhotos.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute left-4 top-1/2 -translate-y-1/2"
                          onClick={prevImage}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                          onClick={nextImage}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="p-4 pt-0">
              {projectPhotos[lightboxIndex]?.caption && (
                <p className="text-center text-muted-foreground">
                  {projectPhotos[lightboxIndex].caption}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Sticky CTA Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <a href={`tel:${business.phoneRaw}`}>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 shadow-2xl px-6 py-4 text-base font-semibold rounded-xl"
            >
              <Phone className="w-5 h-5 mr-2" />
              Get Free Estimate
            </Button>
          </a>
        </div>

        <Footer />
      </div>
    );
  }

  // Main projects gallery view
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-white overflow-x-hidden">
      <RoofingFriendHeader />
      
      {/* Hero Section */}
      <div className="w-full bg-white border-b shadow-sm">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 md:py-16 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Our Project Portfolio
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl 2xl:text-3xl text-gray-600 max-w-7xl mx-auto leading-relaxed px-2">
            See the quality and results our team delivers for {areaText} homes and businesses.
          </p>
        </div>
      </div>

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <div className="w-full bg-gray-50 py-8 sm:py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl 2xl:text-5xl font-bold text-gray-900 mb-2 sm:mb-4">Featured Projects</h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl 2xl:text-2xl text-gray-600 px-2 max-w-4xl mx-auto">Showcase of our most exceptional transformations</p>
            </div>
            
            <div className={`
              grid gap-4 sm:gap-6 md:gap-8 w-full
              ${featuredProjects.length === 1 ? 'grid-cols-1 place-items-center max-w-md mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}
            `}>
              {featuredProjects.map((project) => (
                <div key={project.id} className="featured-card w-full h-full">
                  <ProjectCard 
                    project={project} 
                    photos={projectPhotoMap[project.id] || []}
                    showFeaturedBadge={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        
<div className="w-full sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
  <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-12">
    <div className="py-3 sm:py-4 flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:gap-6 w-full">
        <div className="w-full flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Category</span>
          <ToggleGroup
            type="single"
            value={filterCategory}
            onValueChange={(v) => setFilterCategory((v as any) || 'all')}
            className="flex min-w-0"
            aria-label="Filter by category"
          >
            <ToggleGroupItem value="all" aria-label="All categories" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">All</ToggleGroupItem>
            {CATEGORY_OPTIONS.map((opt) => (
              <ToggleGroupItem key={opt.slug} value={opt.slug} aria-label={opt.label} className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap flex-shrink-0">
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="w-full flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Roof</span>
          <ToggleGroup
            type="single"
            value={filterRoof}
            onValueChange={(v) => setFilterRoof((v as any) || 'all')}
            className="flex min-w-0"
            aria-label="Filter by roof type"
          >
            <ToggleGroupItem value="all" aria-label="All roof types" className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">All</ToggleGroupItem>
            {ROOF_OPTIONS.map((opt) => (
              <ToggleGroupItem key={opt.slug} value={opt.slug} aria-label={opt.label} className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap flex-shrink-0">
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap pt-2 lg:pt-0 flex-shrink-0" aria-live="polite">
        {shownCount} of {totalCount} projects
      </div>
    </div>
  </div>
</div>

        {/* Projects Carousel */}
        {filteredProjects.length > 0 ? (
          <div className="w-full mb-12 sm:mb-16 md:mb-20">
            <Carousel opts={{ align: 'start', loop: true, dragFree: isMobile }} setApi={setCarouselApi} className="w-full">
              <CarouselContent className="-ml-2 sm:-ml-4">
                {filteredProjects.map((project, index) => (
                  <CarouselItem key={project.id} className="pl-2 sm:pl-4 basis-[85%] xs:basis-[75%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5">
                    <div className="w-full">
                      <ProjectCard project={project} photos={projectPhotoMap[project.id] || []} highlightCTA={index === activeIndex} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious variant="secondary" size="icon" className="z-30 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full shadow-lg hover:shadow-xl ring-2 ring-primary/40 animate-enter hover-scale pulse transition-smooth left-2 sm:left-4" />
              <CarouselNext variant="secondary" size="icon" className="z-30 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full shadow-lg hover:shadow-xl ring-2 ring-primary/40 animate-enter hover-scale pulse transition-smooth right-2 sm:right-4" />
              {/* Edge fade hints on mobile */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-4 sm:w-6 bg-gradient-to-r from-background to-transparent md:hidden" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-4 sm:w-6 bg-gradient-to-l from-background to-transparent md:hidden" aria-hidden="true" />
            </Carousel>
            <div className="mt-2 sm:mt-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground md:hidden animate-fade-in">
              <ChevronsLeftRight className="h-3 w-3 sm:h-4 sm:w-4 text-primary animate-pulse" />
              <span>Swipe to see more</span>
            </div>
          </div>
        ) : (
/* Empty State */
<div className="text-center py-12 sm:py-16 md:py-20">
  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto mb-6 sm:mb-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary/40 to-accent/40 rounded-full flex items-center justify-center">
      <Eye className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
    </div>
  </div>
  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
    No projects match those filters.
  </h3>
  <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
    Try adjusting your filters or clear them to see all projects.
  </p>
  <Button 
    variant="outline" 
    size="lg"
    onClick={() => { setFilterCategory('all'); setFilterRoof('all'); }}
    className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl"
  >
    Clear Filters
  </Button>
</div>
        )}

        {/* Conversion Section */}
        <div className="w-full bg-gradient-to-r from-primary to-primary/90 rounded-2xl sm:rounded-3xl shadow-2xl text-white p-6 sm:p-8 md:p-12 lg:p-16 text-center mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Ready for Your Transformation?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl mb-6 sm:mb-8 md:mb-10 opacity-90 max-w-5xl mx-auto leading-relaxed px-2">
            Get a free, no-obligation estimate for your project.
            Our experts will assess your needs and provide a detailed quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-center">
            <a href={`tel:${business.phoneRaw}`} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 text-sm sm:text-base md:text-lg lg:text-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl w-full sm:w-auto"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 sm:mr-3" />
                Get Free Estimate
              </Button>
            </a>
            <a href="/contact" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-white text-white hover:bg-white hover:text-primary px-6 sm:px-8 md:px-10 py-3 sm:py-4 text-sm sm:text-base md:text-lg lg:text-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl w-full sm:w-auto"
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 sm:mr-3" />
                Email Us
              </Button>
            </a>
          </div>
        </div>

        {/* Trust Section */}
        {business.social?.google && (
          <div className="w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12 text-center">
            {/* Google Profile Button */}
            <div className="pt-6 sm:pt-8 border-t border-gray-200">
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg lg:text-xl px-2">Want to see even more of our work?</p>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg lg:text-xl border-2 hover:shadow-lg transition-all duration-300 rounded-xl w-full sm:w-auto max-w-md"
              >
                <a
                  href={business.social.google}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center"
                >
                  View Our Google Profile
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button
          size={isMobile ? "default" : "lg"}
          onClick={() => window.location.href = `tel:${business.phoneRaw}`}
          className="bg-accent hover:bg-accent/90 shadow-2xl px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-semibold rounded-xl animate-pulse-cta hover:animate-glow hover:scale-105 transition-all"
        >
          <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Get Free Estimate</span>
          <span className="xs:hidden">Call Now</span>
        </Button>
      </div>

      <Footer />
    </div>
  );
};

export default Projects;
