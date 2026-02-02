import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ZoomableImage } from '@/components/ui/zoomable-image';

interface ServiceTicketPhotoGalleryProps {
  ticketId: string;
  photos: any[];
  initialPhotoIndex?: number | null;
  onTakePhoto?: () => void;
}

export const ServiceTicketPhotoGallery: React.FC<ServiceTicketPhotoGalleryProps> = ({
  ticketId,
  photos,
  initialPhotoIndex,
  onTakePhoto
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(initialPhotoIndex ?? null);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (initialPhotoIndex !== null && initialPhotoIndex !== undefined) {
      setSelectedIndex(initialPhotoIndex);
    }
  }, [initialPhotoIndex]);

  const handleDelete = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;
    
    setDeleting(true);
    try {
      await (supabase as any)
        .from('service_ticket_files')
        .delete()
        .eq('id', photoId);
      
      queryClient.invalidateQueries({ queryKey: ['service-ticket-files', ticketId] });
      toast.success('Photo deleted');
      setSelectedIndex(null);
    } catch (error) {
      toast.error('Failed to delete photo');
    } finally {
      setDeleting(false);
    }
  };

  if (selectedIndex !== null && photos[selectedIndex]) {
    const photo = photos[selectedIndex];
    return (
      <div className="space-y-4">
        <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
          <ZoomableImage 
            src={photo.file_url} 
            alt={photo.file_name}
            className="w-full h-full object-contain"
            containerClassName="w-full h-full flex items-center justify-center"
          />
          
          {/* Navigation arrows */}
          {selectedIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedIndex(selectedIndex - 1)}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          {selectedIndex < photos.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedIndex(selectedIndex + 1)}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setSelectedIndex(null)}
          >
            Back to Gallery
          </Button>
          <Button 
            variant="destructive"
            size="icon"
            onClick={() => handleDelete(photo.id)}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          {selectedIndex + 1} of {photos.length}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {photos.length === 0 ? (
        <div className="text-center py-8">
          <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No photos yet</p>
          {onTakePhoto && (
            <Button onClick={onTakePhoto} className="mt-4">
              <Camera className="w-4 h-4 mr-2" />
              Take First Photo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setSelectedIndex(index)}
              className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
            >
              <img 
                src={photo.file_url} 
                alt={photo.file_name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
      
      {photos.length > 0 && onTakePhoto && (
        <Button onClick={onTakePhoto} variant="outline" className="w-full">
          <Camera className="w-4 h-4 mr-2" />
          Add More Photos
        </Button>
      )}
    </div>
  );
};
