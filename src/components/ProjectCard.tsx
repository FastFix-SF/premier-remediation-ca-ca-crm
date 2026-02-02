
import React from 'react';
import { MapPin, Calendar, ArrowRight, Eye, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

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
  photo_tag: 'before' | 'after' | null;
  is_highlighted_after?: boolean;
}

interface ProjectCardProps {
  project: Project;
  photos?: ProjectPhoto[];
  highlightCTA?: boolean;
  showFeaturedBadge?: boolean;
}

const ProjectCard = ({ project, photos = [], highlightCTA, showFeaturedBadge = false }: ProjectCardProps) => {
  const isMobile = useIsMobile();
  
  // Find the best photo to display (prioritize highlighted after photo, then any after photo, then any photo)
  const featuredPhoto = photos.find(p => p.is_highlighted_after && p.photo_tag === 'after') ||
                       photos.find(p => p.photo_tag === 'after') ||
                       photos[0];

  console.log('ProjectCard - Project:', project.name, 'Photos:', photos.length, 'Featured photo:', featuredPhoto);

  return (
    <Link to={`/projects/${project.id}#transformation`} className="block h-full">
      <div className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-500 overflow-hidden border border-gray-100 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer h-full flex flex-col">
        {/* Project Image */}
      <div className={cn(
        "relative w-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-t-2xl",
        isMobile && showFeaturedBadge ? "aspect-[16/9]" : "aspect-[16/10]"
      )}>
        {featuredPhoto ? (
          <>
            <img
              src={featuredPhoto.photo_url}
              alt={project.name}
              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={(e) => {
                console.error('Failed to load image:', featuredPhoto.photo_url);
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* After Badge */}
            {featuredPhoto.photo_tag === 'after' && (
              <div className={cn(
                "absolute bg-green-600 text-white rounded-full font-semibold shadow-lg",
                isMobile && showFeaturedBadge ? "top-2 left-2 px-2 py-1 text-xs" : "top-4 left-4 px-3 py-1.5 text-sm"
              )}>
                After
              </div>
            )}
            {featuredPhoto.photo_tag === 'before' && (
              <div className={cn(
                "absolute bg-blue-600 text-white rounded-full font-semibold shadow-lg",
                isMobile && showFeaturedBadge ? "top-2 left-2 px-2 py-1 text-xs" : "top-4 left-4 px-3 py-1.5 text-sm"
              )}>
                Before
              </div>
            )}
            
            {/* Featured Badge */}
            {showFeaturedBadge && project.is_featured && (
              <div className={cn("absolute", isMobile ? "top-2 right-2" : "top-4 right-4")}>
                <Badge className={cn(
                  "bg-gradient-to-r from-accent to-accent-foreground text-white font-semibold flex items-center gap-1",
                  isMobile ? "px-2 py-0.5 text-xs" : "px-3 py-1"
                )}>
                  <Star className={cn("fill-current", isMobile ? "w-2.5 h-2.5" : "w-3 h-3")} />
                  Featured
                </Badge>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <div className="w-8 h-8 bg-primary/40 rounded"></div>
              </div>
              <p className="text-sm text-muted-foreground font-medium">Project Photos</p>
            </div>
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className={cn(
        "flex-1 flex flex-col",
        isMobile && showFeaturedBadge ? "p-3 space-y-2" : "p-6 space-y-4"
      )}>
      {/* Project Classification Badge */}
      {(project.project_category || project.project_type || project.roof_type) && (
        <div className={cn(
          "inline-flex items-center rounded-full font-semibold bg-primary/10 text-primary",
          isMobile && showFeaturedBadge ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
        )}>
          {(project.project_category || project.project_type) || 'Project'}
          {project.roof_type ? ` • ${project.roof_type}` : ''}
        </div>
      )}

        {/* Project Name */}
        <h3 className={cn(
          "font-bold text-gray-900 leading-tight line-clamp-2",
          isMobile && showFeaturedBadge ? "text-base" : "text-xl"
        )}>
          {project.name}
        </h3>

        {/* Address */}
        {project.address && (
          <div className={cn("flex items-center gap-2 text-gray-600", isMobile && showFeaturedBadge && "gap-1.5")}>
            <MapPin className={cn("shrink-0", isMobile && showFeaturedBadge ? "w-3 h-3" : "w-4 h-4")} />
            <span className={cn("truncate", isMobile && showFeaturedBadge ? "text-xs" : "text-sm")}>{project.address}</span>
          </div>
        )}

        {/* Completion Date */}
        <div className={cn("flex items-center gap-2 text-gray-600", isMobile && showFeaturedBadge && "gap-1.5")}>
          <Calendar className={cn("shrink-0", isMobile && showFeaturedBadge ? "w-3 h-3" : "w-4 h-4")} />
          <span className={cn(isMobile && showFeaturedBadge ? "text-xs" : "text-sm")}>
            Completed {format(new Date(project.created_at), 'MMMM yyyy')}
          </span>
        </div>

        {/* Photo Count - Only show if there are photos */}
        {photos.length > 0 && (
          <div className={cn("flex items-center gap-2 text-gray-600", isMobile && showFeaturedBadge && "gap-1.5")}>
            <Eye className={cn("shrink-0", isMobile && showFeaturedBadge ? "w-3 h-3" : "w-4 h-4")} />
            <span className={cn(isMobile && showFeaturedBadge ? "text-xs" : "text-sm")}>
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </span>
          </div>
        )}


        {/* View Project Button */}
        <div className="mt-auto">
          <div 
            className={cn(
              "inline-flex items-center justify-center w-full bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:bg-accent group-hover:shadow-accent/25",
              isMobile && showFeaturedBadge ? "py-2 px-4 text-sm" : "py-3 px-6",
              highlightCTA && "ring-2 ring-primary/60 ring-offset-2 ring-offset-white pulse"
            )}
          >
            View Project
            <ArrowRight className={cn(
              "ml-2 group-hover:translate-x-1 transition-transform duration-300",
              isMobile && showFeaturedBadge ? "w-4 h-4" : "w-5 h-5"
            )} />
          </div>
          {highlightCTA && (
            <p className="mt-2 text-center text-xs text-muted-foreground md:hidden animate-fade-in">
              Tap to see more photos
            </p>
          )}
        </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
