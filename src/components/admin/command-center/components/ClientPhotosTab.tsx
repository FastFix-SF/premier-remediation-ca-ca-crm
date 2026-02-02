import React from 'react';
import { Image, Loader2, Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useClientPhotos } from '../hooks/useClientPhotos';

interface ClientPhotosTabProps {
  projectId: string;
}

export const ClientPhotosTab: React.FC<ClientPhotosTabProps> = ({ projectId }) => {
  const { photos, beforePhotos, afterPhotos, isLoading } = useClientPhotos(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-white/60">
        <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No photos for this project</p>
        <p className="text-sm text-white/40 mt-1">Project photos will appear here</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-6 pr-4">
        {/* Before/After Section */}
        {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
          <div>
            <h4 className="text-sm font-medium text-white/80 mb-3">Before & After</h4>
            <div className="grid grid-cols-2 gap-3">
              {beforePhotos.length > 0 && (
                <div>
                  <Badge className="bg-red-500/20 text-red-400 mb-2">Before</Badge>
                  <div className="aspect-video rounded-lg overflow-hidden bg-white/5">
                    <img 
                      src={beforePhotos[0].url} 
                      alt="Before" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              {afterPhotos.length > 0 && (
                <div>
                  <Badge className="bg-green-500/20 text-green-400 mb-2">After</Badge>
                  <div className="aspect-video rounded-lg overflow-hidden bg-white/5">
                    <img 
                      src={afterPhotos[0].url} 
                      alt="After" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photo Gallery */}
        <div>
          <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
            <Image className="w-4 h-4" />
            All Photos ({photos.length})
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div 
                key={photo.id} 
                className="relative aspect-square rounded-lg overflow-hidden bg-white/5 group cursor-pointer"
                onClick={() => window.open(photo.url, '_blank')}
              >
                <img 
                  src={photo.url} 
                  alt={photo.caption || 'Project photo'} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                  <div className="p-2 w-full">
                    {photo.tag && (
                      <Badge className="bg-white/20 text-white text-xs mb-1">{photo.tag}</Badge>
                    )}
                    <p className="text-xs text-white/80 truncate">{photo.caption || format(new Date(photo.uploadedAt), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                {(photo.isBefore || photo.isAfter) && (
                  <Badge className={`absolute top-1 left-1 text-xs ${photo.isBefore ? 'bg-red-500/80' : 'bg-green-500/80'}`}>
                    {photo.isBefore ? 'Before' : 'After'}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
