import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { Upload, Grid, Image as ImageIcon, Tag } from 'lucide-react';
import { useProposalManagement, ProposalPhoto } from '@/hooks/useProposalManagement';
import { cn } from '@/lib/utils';

interface ProposalGalleryProps {
  proposalId?: string;
  isEditing: boolean;
}

export const ProposalGallery: React.FC<ProposalGalleryProps> = ({
  proposalId,
  isEditing
}) => {
  const { fetchProposalPhotos, uploadProposalPhoto } = useProposalManagement();

  const { data: photos = [] } = useQuery({
    queryKey: ['proposal-photos', proposalId],
    queryFn: () => proposalId ? fetchProposalPhotos(proposalId) : Promise.resolve([]),
    enabled: !!proposalId
  });

  const referencePhotos = photos.filter(photo => photo.photo_type === 'reference');
  const progressPhotos = photos.filter(photo => photo.photo_type === 'progress');

  const onDrop = useCallback((acceptedFiles: File[], photoType: 'reference' | 'progress') => {
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

  const referenceDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'reference'),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    disabled: !isEditing
  });

  const progressDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'progress'),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    disabled: !isEditing
  });

  const getPhotoTypeColor = (type: string) => {
    switch (type) {
      case 'reference': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'progress': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const PhotoGrid: React.FC<{ photos: ProposalPhoto[], title: string, dropzone?: any }> = ({ 
    photos, 
    title, 
    dropzone 
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Grid className="h-5 w-5" />
          {title}
        </h3>
        <Badge variant="outline">
          {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
        </Badge>
      </div>

      {isEditing && dropzone && (
        <div
          {...dropzone.getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            dropzone.isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
        >
          <input {...dropzone.getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop {title.toLowerCase()} here or click to browse
          </p>
        </div>
      )}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative">
              <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                <img
                  src={photo.photo_url}
                  alt={photo.description || 'Project photo'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              
              {/* Photo Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(photo.photo_url, '_blank')}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  View Full
                </Button>
              </div>

              {/* Photo Type Badge */}
              <div className="absolute top-2 right-2">
                <Badge className={cn("text-xs", getPhotoTypeColor(photo.photo_type))}>
                  <Tag className="h-3 w-3 mr-1" />
                  {photo.photo_type}
                </Badge>
              </div>

              {/* Description */}
              {photo.description && (
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black/80 text-white text-xs p-2 rounded truncate">
                    {photo.description}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No {title.toLowerCase()} available</p>
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid className="h-5 w-5" />
          Project Gallery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Reference Photos */}
        <PhotoGrid 
          photos={referencePhotos}
          title="Reference Photos"
          dropzone={isEditing ? referenceDropzone : undefined}
        />

        {/* Progress Photos */}
        <PhotoGrid 
          photos={progressPhotos}
          title="Progress Photos"
          dropzone={isEditing ? progressDropzone : undefined}
        />

        {/* Empty State */}
        {referencePhotos.length === 0 && progressPhotos.length === 0 && !isEditing && (
          <div className="text-center py-12 text-muted-foreground">
            <Grid className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No project photos available yet</p>
          </div>
        )}

        {/* Photo Stats */}
        {(referencePhotos.length > 0 || progressPhotos.length > 0) && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Total Photos: {referencePhotos.length + progressPhotos.length}
              </span>
              <div className="flex items-center gap-4">
                <span>{referencePhotos.length} Reference</span>
                <span>{progressPhotos.length} Progress</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};