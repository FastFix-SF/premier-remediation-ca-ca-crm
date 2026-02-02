
import React from 'react';
import { OptimizedImage } from '../ui/optimized-image';
import { MapPin, Calendar, Wrench } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  location?: string;
  project_type?: string;
  project_category?: string;
  roof_type?: string;
  materials_used?: string[];
  completed_date?: string;
  photos?: {
    id: string;
    photo_url: string;
    thumbnail_url?: string;
    photo_type: 'before' | 'after' | 'during' | null;
    is_featured?: boolean;
  }[];
}

interface ProjectCardProps {
  project: Project;
  index: number;
  onClick: () => void;
}

const ProjectCard = ({ project, index, onClick }: ProjectCardProps) => {
  const afterPhoto = project.photos?.find(p => p.photo_type === 'after');
  const beforePhoto = project.photos?.find(p => p.photo_type === 'before');
  const displayPhoto = afterPhoto || beforePhoto;

  return (
    <div 
      className="bg-white rounded-xl p-4 sm:p-6 shadow-lg transform transition-all duration-700 hover:scale-105 cursor-pointer group"
      onClick={onClick}
      style={{
        animation: `float 6s ease-in-out infinite alternate`,
        animationDelay: `${index * 0.5}s`
      }}
    >
      {/* Project Image */}
      <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-lg mb-3 sm:mb-4 flex items-center justify-center overflow-hidden relative group-hover:shadow-lg transition-shadow">
        {displayPhoto ? (
          <OptimizedImage 
            src={displayPhoto.thumbnail_url || displayPhoto.photo_url} 
            alt={project.name}
            className="w-full h-full object-cover"
            sizes="(max-width: 640px) 45vw, 20vw"
            quality={80}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <Wrench className="w-8 h-8 sm:w-12 sm:h-12 text-primary opacity-60" />
          </div>
        )}
        {/* Type Label */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
          {(project.project_category || project.project_type) 
            ? `${project.project_category || project.project_type}${project.roof_type ? ` • ${project.roof_type}` : ''}`
            : (project.roof_type || 'Metal Roofing')}
        </div>
      </div>
      
      {/* Project Details */}
      <div className="space-y-2">
        <div className="text-sm sm:text-base text-foreground font-semibold line-clamp-1">
          {project.name}
        </div>
        
        {project.location && (
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
          <span>{project.completed_date || '2024'}</span>
        </div>
        
        <div className="text-xs sm:text-sm text-muted-foreground">
          {project.materials_used?.[0] || 'Premium Materials'}
        </div>
        
      </div>
    </div>
  );
};

export default ProjectCard;
