import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProposalManagement, ProposalPhoto } from '@/hooks/useProposalManagement';
import { cn } from '@/lib/utils';

interface BeforeAfterGalleryProps {
  proposalId?: string;
  isEditing: boolean;
}

export const BeforeAfterGallery: React.FC<BeforeAfterGalleryProps> = ({
  proposalId,
  isEditing
}) => {
  const { fetchProposalPhotos, uploadProposalPhoto } = useProposalManagement();
  const [comparePosition, setComparePosition] = useState(10);
  const [isDragging, setIsDragging] = useState(false);

  const { data: photos = [] } = useQuery({
    queryKey: ['proposal-photos', proposalId],
    queryFn: () => proposalId ? fetchProposalPhotos(proposalId) : Promise.resolve([]),
    enabled: !!proposalId
  });

  const beforePhotos = photos.filter(photo => photo.photo_type === 'before');
  const afterPhotos = photos.filter(photo => photo.photo_type === 'after');
  const [selectedBefore, setSelectedBefore] = useState(0);
  const [selectedAfter, setSelectedAfter] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[], photoType: 'before' | 'after') => {
    if (!proposalId) return;

    acceptedFiles.forEach(file => {
      uploadProposalPhoto.mutate({
        proposalId,
        file,
        photoType,
        description: `${photoType.charAt(0).toUpperCase() + photoType.slice(1)} photo`
      });
    });
  }, [proposalId, uploadProposalPhoto]);

  const beforeDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'before'),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    disabled: !isEditing
  });

  const afterDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'after'),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    disabled: !isEditing
  });

  const handleInteractionStart = (clientX: number, target: EventTarget | null) => {
    setIsDragging(true);
    updateComparePosition(clientX, target as HTMLElement);
  };

  const handleInteractionMove = (clientX: number, target: EventTarget | null) => {
    if (!isDragging) return;
    updateComparePosition(clientX, target as HTMLElement);
  };

  const handleInteractionEnd = () => {
    setIsDragging(false);
  };

  const updateComparePosition = (clientX: number, element: HTMLElement) => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setComparePosition(Math.min(100, Math.max(0, percentage)));
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleInteractionStart(e.clientX, e.currentTarget);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleInteractionMove(e.clientX, e.currentTarget);
  };

  const handleMouseUp = () => {
    handleInteractionEnd();
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleInteractionStart(touch.clientX, e.currentTarget);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleInteractionMove(touch.clientX, e.currentTarget);
  };

  const handleTouchEnd = () => {
    handleInteractionEnd();
  };

  const currentBeforePhoto = beforePhotos[selectedBefore];
  const currentAfterPhoto = afterPhotos[selectedAfter];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Before & After Comparison
          <Badge variant="outline" className="ml-auto">
            {beforePhotos.length} Before • {afterPhotos.length} After
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Areas */}
        {isEditing && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Before Photos Upload */}
            <div className="space-y-2">
              <Label>Before Photos</Label>
              <div
                {...beforeDropzone.getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  beforeDropzone.isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
              >
                <input {...beforeDropzone.getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drop before photos here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Google Maps screenshots, existing roof photos
                </p>
              </div>
            </div>

            {/* After Photos Upload */}
            <div className="space-y-2">
              <Label>After Photos / Mockups</Label>
              <div
                {...afterDropzone.getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  afterDropzone.isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
              >
                <input {...afterDropzone.getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drop after photos here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  AI-generated mockups, concept renders
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Viewer */}
        {currentBeforePhoto && currentAfterPhoto && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Interactive Comparison</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Drag the slider to compare</span>
              </div>
            </div>
            
            <div 
              className="relative w-full h-96 overflow-hidden rounded-lg border bg-muted cursor-col-resize select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'none' }}
            >
              {/* Before Image (base layer - shows 90% at startup) */}
              <img
                src={currentBeforePhoto.photo_url}
                alt="Before"
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* After Image (clipped overlay - shows 10% at startup, reveals as slider moves right) */}
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}
              >
                <img
                  src={currentAfterPhoto.photo_url}
                  alt="After"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Slider Handle */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
                style={{ left: `${comparePosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-1 h-4 bg-gray-400 mx-0.5"></div>
                  <div className="w-1 h-4 bg-gray-400 mx-0.5"></div>
                </div>
              </div>
              
              {/* Labels */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                Before
              </div>
              <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                After
              </div>
            </div>
          </div>
        )}

        {/* Photo Thumbnails */}
        {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
          <div className="space-y-4">
            {beforePhotos.length > 0 && (
              <div>
                <Label className="mb-2 block">Before Photos ({beforePhotos.length})</Label>
                <div className="flex gap-2 overflow-x-auto">
                  {beforePhotos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedBefore(index)}
                      className={cn(
                        "flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden",
                        selectedBefore === index ? "border-primary" : "border-muted"
                      )}
                    >
                      <img
                        src={photo.photo_url}
                        alt={`Before ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {afterPhotos.length > 0 && (
              <div>
                <Label className="mb-2 block">After Photos ({afterPhotos.length})</Label>
                <div className="flex gap-2 overflow-x-auto">
                  {afterPhotos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedAfter(index)}
                      className={cn(
                        "flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden",
                        selectedAfter === index ? "border-primary" : "border-muted"
                      )}
                    >
                      <img
                        src={photo.photo_url}
                        alt={`After ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {beforePhotos.length === 0 && afterPhotos.length === 0 && !isEditing && (
          <div className="text-center py-12 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No before/after photos available yet</p>
            {isEditing && <p className="text-sm mt-1">Upload photos to get started</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};