
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from './ProjectCard';
import { useBusiness, useAreas } from '@/hooks/useBusinessConfig';

interface Project {
  id: string;
  name: string;
  location?: string;
  project_type?: string;
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

interface HeroProjectShowcaseProps {
  projects: Project[];
  isLoading: boolean;
  videoSrc?: string;
}

const HeroProjectShowcase = ({ projects, isLoading, videoSrc }: HeroProjectShowcaseProps) => {
  const navigate = useNavigate();
  const business = useBusiness();
  const areas = useAreas();
  const [showVideo, setShowVideo] = useState(!!videoSrc);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [videoLoading, setVideoLoading] = useState(!!videoSrc);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Build dynamic area text
  const primaryArea = areas[0]?.name || 'your area';
  const areaText = areas.length > 1
    ? `${primaryArea} and surrounding areas`
    : primaryArea;

  // Calculate years in business
  const yearsInBusiness = business.yearsInBusiness || (business.foundedYear ? new Date().getFullYear() - business.foundedYear : null);

  const handleVideoEnd = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowVideo(false);
      setVideoLoading(false);
    }, 500);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video failed to load:', e);
    setShowVideo(false);
    setVideoLoading(false);
  };

  const handleVideoCanPlay = () => {
    console.log('Video ready to play');
    setVideoLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Fallback to projects if video takes too long (3 seconds)
  React.useEffect(() => {
    if (videoSrc && showVideo) {
      timeoutRef.current = setTimeout(() => {
        console.log('Video timeout - showing projects');
        setShowVideo(false);
        setVideoLoading(false);
      }, 3000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [videoSrc, showVideo]);

  return (
    <div className="relative mt-0 lg:mt-0">
      <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl overflow-hidden">
        {showVideo && videoSrc ? (
          <div 
            className={`w-full aspect-video rounded-xl overflow-hidden transition-all duration-500 relative ${
              isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {videoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              muted
              playsInline
              preload="metadata"
              onEnded={handleVideoEnd}
              onError={handleVideoError}
              onCanPlay={handleVideoCanPlay}
              className="w-full h-full object-cover scale-110"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animationDuration: '600ms'
                }}
              >
                <ProjectCard 
                  project={project}
                  index={index}
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-3 sm:mt-4 lg:mt-6 text-center">
          <p className="text-white/80 text-xs sm:text-sm lg:text-base">
            {isLoading ? 'Loading recent projects...' : `Recent completed projects in ${areaText}`}
          </p>
          {yearsInBusiness && (
            <p className="text-white/60 text-xs sm:text-xs lg:text-sm mt-1">
              Serving the community for {yearsInBusiness}+ years
            </p>
          )}
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 lg:-top-4 lg:-right-4 bg-accent text-accent-foreground rounded-full px-2 py-1 sm:px-3 sm:py-1 lg:px-4 lg:py-2 text-xs sm:text-xs lg:text-sm font-semibold shadow-lg">
        Free Estimates
      </div>
    </div>
  );
};

export default HeroProjectShowcase;
