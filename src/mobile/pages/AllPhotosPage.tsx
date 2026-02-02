import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAllPhotos, GroupedPhotos, PhotoWithDetails } from '../hooks/useAllPhotos';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

const PhotoCard: React.FC<{
  photo: PhotoWithDetails;
  onClick: () => void;
}> = ({ photo, onClick }) => (
  <div 
    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group shadow-sm"
    onClick={onClick}
  >
    <img 
      src={photo.photo_url} 
      alt={photo.caption || 'Project photo'}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
      decoding="async"
    />
    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    
    {/* Uploader initials badge */}
    <div className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-white/95 shadow-md flex items-center justify-center">
      <span className="text-[10px] font-semibold text-gray-800">
        {photo.uploader_initials}
      </span>
    </div>
    
    {/* Photo tag badge */}
    {photo.photo_tag && (
      <div className="absolute top-2 right-2">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-[10px] px-1.5 py-0.5 font-medium",
            photo.photo_tag === 'before' && "bg-amber-100 text-amber-800",
            photo.photo_tag === 'after' && "bg-emerald-100 text-emerald-800"
          )}
        >
          {photo.photo_tag}
        </Badge>
      </div>
    )}
  </div>
);

const DateGroup: React.FC<{
  group: GroupedPhotos;
  onPhotoClick: (photo: PhotoWithDetails) => void;
}> = ({ group, onPhotoClick }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between px-1">
      <h3 className="text-sm font-semibold text-foreground">
        {group.dateLabel}
      </h3>
      <span className="text-xs text-muted-foreground">
        {group.photos.length} photo{group.photos.length !== 1 ? 's' : ''}
      </span>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {group.photos.map(photo => (
        <PhotoCard 
          key={photo.id} 
          photo={photo} 
          onClick={() => onPhotoClick(photo)}
        />
      ))}
    </div>
  </div>
);

const FullScreenViewer: React.FC<{
  photo: PhotoWithDetails | null;
  photos: PhotoWithDetails[];
  onClose: () => void;
  onNavigate: (photo: PhotoWithDetails) => void;
}> = ({ photo, photos, onClose, onNavigate }) => {
  const navigate = useNavigate();
  const currentIndex = photos.findIndex(p => p.id === photo?.id);
  
  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Swipe state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const swipeThreshold = 50;
  const swipeTimeThreshold = 300;
  
  // Reset zoom when photo changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [photo?.id]);
  
  const goToProject = () => {
    if (photo) {
      navigate(`/mobile/projects/${photo.project_id}`);
    }
  };
  
  const goPrev = useCallback(() => {
    if (currentIndex > 0 && scale === 1) {
      onNavigate(photos[currentIndex - 1]);
    }
  }, [currentIndex, photos, onNavigate, scale]);
  
  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1 && scale === 1) {
      onNavigate(photos[currentIndex + 1]);
    }
  }, [currentIndex, photos, onNavigate, scale]);
  
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 4));
  };
  
  const zoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };
  
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Handle touch events for swipe and pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      if (scale > 1) setIsDragging(true);
    } else if (e.touches.length === 2) {
      // Pinch start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastPinchDistRef.current = dist;
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && lastTouchRef.current) {
      const touch = e.touches[0];
      
      if (scale > 1 && isDragging) {
        // Pan when zoomed
        const deltaX = touch.clientX - lastTouchRef.current.x;
        const deltaY = touch.clientY - lastTouchRef.current.y;
        setPosition(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      }
    } else if (e.touches.length === 2 && lastPinchDistRef.current) {
      // Pinch zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - lastPinchDistRef.current;
      const zoomDelta = delta * 0.01;
      
      setScale(prev => {
        const newScale = Math.max(1, Math.min(4, prev + zoomDelta));
        if (newScale === 1) setPosition({ x: 0, y: 0 });
        return newScale;
      });
      
      lastPinchDistRef.current = dist;
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    lastPinchDistRef.current = null;
    
    // Detect swipe (only when not zoomed)
    if (scale === 1 && touchStartRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      
      // Check for horizontal swipe
      if (Math.abs(deltaX) > swipeThreshold && 
          Math.abs(deltaX) > Math.abs(deltaY) * 2 && 
          deltaTime < swipeTimeThreshold) {
        if (deltaX > 0) {
          goPrev();
        } else {
          goNext();
        }
      }
    }
    
    touchStartRef.current = null;
    lastTouchRef.current = null;
  };
  
  // Double tap to zoom
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = (e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      if (scale > 1) {
        resetZoom();
      } else {
        setScale(2);
      }
    }
    lastTapRef.current = now;
  };
  
  if (!photo) return null;
  
  return (
    <Dialog open={!!photo} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 border-0 bg-black">
        <div className="relative w-full h-full flex flex-col select-none">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
              <div className="text-center">
                <p className="text-white/90 text-sm font-medium">{photo.project_name}</p>
                <p className="text-white/60 text-xs">{photo.uploader_name}</p>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={zoomOut}
                  disabled={scale <= 1}
                  className="text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <ZoomOut className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={zoomIn}
                  disabled={scale >= 4}
                  className="text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <ZoomIn className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Navigation arrows */}
          {scale === 1 && currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 w-10 h-10 rounded-full bg-black/30"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          {scale === 1 && currentIndex < photos.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 w-10 h-10 rounded-full bg-black/30"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}
          
          {/* Image container with touch handling */}
          <div 
            ref={containerRef}
            className="flex-1 flex items-center justify-center overflow-hidden touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => { handleTouchEnd(e); handleDoubleTap(e); }}
          >
            <img 
              src={photo.photo_url} 
              alt={photo.caption || 'Photo'}
              className="max-w-full max-h-full object-contain transition-transform duration-100"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              }}
              draggable={false}
            />
          </div>
          
          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="space-y-3">
              {photo.caption && (
                <p className="text-white/90 text-sm text-center">{photo.caption}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs">
                  {new Date(photo.uploaded_at).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
                <div className="flex items-center gap-2">
                  {scale > 1 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetZoom}
                      className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Reset
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={goToProject}
                    className="text-xs"
                  >
                    View Project
                  </Button>
                </div>
              </div>
              {/* Navigation hint */}
              <div className="flex justify-center">
                <span className="text-white/40 text-xs">
                  {scale === 1 
                    ? `${currentIndex + 1} of ${photos.length} • Swipe or tap arrows`
                    : 'Pinch or buttons to zoom • Double-tap to reset'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const AllPhotosPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{ tag?: string }>({});
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithDetails | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  
  const { ref: loadMoreRef, inView } = useInView();
  
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useAllPhotos(filters);
  
  // Auto-load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // Flatten all photos for the viewer navigation
  const allPhotos = useMemo(() => {
    return data?.pages.flatMap(page => page.photos) || [];
  }, [data]);
  
  // Merge grouped photos from all pages
  const groupedPhotos = useMemo(() => {
    if (!data?.pages) return [];
    
    const allGrouped: Record<string, GroupedPhotos> = {};
    
    data.pages.forEach(page => {
      page.grouped.forEach(group => {
        if (!allGrouped[group.date]) {
          allGrouped[group.date] = { ...group, photos: [] };
        }
        allGrouped[group.date].photos.push(...group.photos);
      });
    });
    
    return Object.values(allGrouped).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [data]);
  
  const totalPhotos = allPhotos.length;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/mobile/projects')}
              className="h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Company Feed</h1>
              <p className="text-xs text-muted-foreground">
                {totalPhotos.toLocaleString()} photos
              </p>
            </div>
          </div>
          
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={cn(
                  "gap-2",
                  activeFilterCount > 0 && "border-primary text-primary"
                )}
              >
                <Filter className="w-4 h-4" />
                Filter
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Photo Tag</label>
                  <Select
                    value={filters.tag || 'all'}
                    onValueChange={(value) => setFilters(f => ({ ...f, tag: value === 'all' ? undefined : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All photos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All photos</SelectItem>
                      <SelectItem value="before">Before</SelectItem>
                      <SelectItem value="after">After</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {activeFilterCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setFilters({});
                      setFilterOpen(false);
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-6 pb-24">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-48" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(j => (
                    <Skeleton key={j} className="aspect-square rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : groupedPhotos.length === 0 ? (
          // Empty state
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No photos found</h3>
            <p className="text-sm text-muted-foreground">
              {activeFilterCount > 0 
                ? 'Try adjusting your filters'
                : 'Photos from projects will appear here'
              }
            </p>
          </div>
        ) : (
          // Photo groups
          <>
            {groupedPhotos.map(group => (
              <DateGroup 
                key={group.date} 
                group={group} 
                onPhotoClick={setSelectedPhoto}
              />
            ))}
            
            {/* Load more trigger */}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Loading more...</span>
                </div>
              )}
              {!hasNextPage && allPhotos.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  You've seen all {totalPhotos} photos
                </p>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Full screen viewer */}
      <FullScreenViewer
        photo={selectedPhoto}
        photos={allPhotos}
        onClose={() => setSelectedPhoto(null)}
        onNavigate={setSelectedPhoto}
      />
    </div>
  );
};

export default AllPhotosPage;
