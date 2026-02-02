import React, { useState, useEffect } from 'react';
import { Camera, Image, Trash2, Eye, EyeOff, Star, MoreVertical, Edit, Download, ChevronLeft, ChevronRight, X, MessageSquare, Check, Play, Video, DownloadCloud, Wrench, Loader2 } from 'lucide-react';
import { ZoomableImage } from '@/components/ui/zoomable-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useMobilePermissions } from '../hooks/useMobilePermissions';
import { useMobilePhotoUpdateCaption, useMobilePhotoUpdateRecommendation } from '../hooks/useMobilePhotos';
import { MobilePhotoEditor } from '@/mobile/components/MobilePhotoEditor';
import { useToast } from '@/hooks/use-toast';
import { MobileProjectVideo } from '@/mobile/hooks/useMobileVideos';

interface ProjectPhotoGalleryProps {
  projectId: string;
  photos: any[];
  videos?: MobileProjectVideo[];
  onDeletePhoto: (photoId: string) => void;
  onDeleteVideo?: (videoId: string) => void;
  onToggleVisibility?: (photoId: string, isVisible: boolean) => void;
  onSetHighlight?: (photoId: string, type: 'before' | 'after') => void;
  onUpdatePhoto?: (photoId: string, updatedPhoto: File) => void;
  onTakePhoto?: () => void;
  initialPhotoIndex?: number | null;
}

export const ProjectPhotoGallery: React.FC<ProjectPhotoGalleryProps> = ({
  projectId,
  photos,
  videos = [],
  onDeletePhoto,
  onDeleteVideo,
  onToggleVisibility,
  onSetHighlight,
  onUpdatePhoto,
  onTakePhoto,
  initialPhotoIndex
}) => {
  const { user } = useAuth();
  const { projectPermissions } = useMobilePermissions(projectId);
  const { toast } = useToast();
  const updateCaptionMutation = useMobilePhotoUpdateCaption();
  const updateRecommendationMutation = useMobilePhotoUpdateRecommendation();
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(initialPhotoIndex ?? null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [isEditingRecommendation, setIsEditingRecommendation] = useState(false);
  const [recommendationText, setRecommendationText] = useState('');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Combine photos and videos into a unified media array
  const allMedia = [
    ...photos.map(p => ({ ...p, type: 'photo' as const, url: p.photo_url })),
    ...videos.map(v => ({ ...v, type: 'video' as const, url: v.video_url }))
  ].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());

  const selectedMedia = selectedMediaIndex !== null ? allMedia[selectedMediaIndex] : null;
  const selectedVideo = selectedVideoIndex !== null ? videos[selectedVideoIndex] : null;

  // For backward compatibility
  const selectedPhotoIndex = selectedMediaIndex;
  const selectedPhoto = selectedMedia?.type === 'photo' ? selectedMedia : null;

  // Sync carousel position when selectedMediaIndex changes
  useEffect(() => {
    if (carouselApi && selectedMediaIndex !== null) {
      carouselApi.scrollTo(selectedMediaIndex);
    }
  }, [carouselApi, selectedMediaIndex]);

  // Update selectedMediaIndex when carousel slides
  useEffect(() => {
    if (!carouselApi) return;
    
    const onSelect = () => {
      const newIndex = carouselApi.selectedScrollSnap();
      setSelectedMediaIndex(newIndex);
      // Reset editing states when changing media
      setIsEditingCaption(false);
      setCaptionText('');
      setIsEditingRecommendation(false);
      setRecommendationText('');
    };
    
    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  const openPhotoAtIndex = (index: number) => {
    // Find the index in allMedia for this photo
    const photoItem = photos[index];
    const mediaIndex = allMedia.findIndex(m => m.id === photoItem.id && m.type === 'photo');
    setSelectedMediaIndex(mediaIndex >= 0 ? mediaIndex : null);
    setIsEditingCaption(false);
    setCaptionText('');
    setIsEditingRecommendation(false);
    setRecommendationText('');
  };

  const openMediaAtIndex = (index: number) => {
    setSelectedMediaIndex(index);
    setIsEditingCaption(false);
    setCaptionText('');
    setIsEditingRecommendation(false);
    setRecommendationText('');
  };

  const openVideoPlayer = (videoIndex: number) => {
    // Find the index in allMedia for this video
    const videoItem = videos[videoIndex];
    const mediaIndex = allMedia.findIndex(m => m.id === videoItem.id && m.type === 'video');
    setSelectedMediaIndex(mediaIndex >= 0 ? mediaIndex : null);
  };

  const closePhotoModal = () => {
    setSelectedMediaIndex(null);
    setIsEditingCaption(false);
    setCaptionText('');
    setIsEditingRecommendation(false);
    setRecommendationText('');
  };

  const goToPrevPhoto = () => {
    if (selectedMediaIndex !== null && selectedMediaIndex > 0) {
      setSelectedMediaIndex(selectedMediaIndex - 1);
    }
  };

  const goToNextPhoto = () => {
    if (selectedMediaIndex !== null && selectedMediaIndex < allMedia.length - 1) {
      setSelectedMediaIndex(selectedMediaIndex + 1);
    }
  };

  const canEdit = projectPermissions.canEdit;

  // Convert image URL to File for editing
  const convertUrlToFile = async (url: string, filename: string): Promise<File> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error('Error converting URL to file:', error);
      throw error;
    }
  };

  const handleEditPhoto = async (photo: any) => {
    try {
      const file = await convertUrlToFile(photo.photo_url, `photo_${photo.id}.jpg`);
      setEditingFile(file);
      setIsEditing(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load photo for editing",
        variant: "destructive"
      });
    }
  };

  const handleSaveEditedPhoto = async (editedFile: File) => {
    if (selectedPhoto && onUpdatePhoto) {
      setIsSaving(true);
      try {
        await onUpdatePhoto(selectedPhoto.id, editedFile);
        toast({
          title: "Success",
          description: "Photo updated successfully"
        });
        // Only close dialogs after successful save
        setIsEditing(false);
        setEditingFile(null);
        closePhotoModal();
      } catch (error) {
        console.error('Failed to save edited photo:', error);
        toast({
          title: "Error", 
          description: "Failed to update photo",
          variant: "destructive"
        });
        // Don't close on error - let user try again
      } finally {
        setIsSaving(false);
      }
    } else {
      // No update handler, just close
      setIsEditing(false);
      setEditingFile(null);
    }
  };

  const handleCancelEdit = () => {
    if (isSaving) return; // Prevent canceling while saving
    setIsEditing(false);
    setEditingFile(null);
  };

  const handleDeleteWithLoading = async (mediaId: string, mediaType: 'photo' | 'video') => {
    console.log('[Delete] Starting delete for', mediaType, mediaId);
    setDeletingMediaId(mediaId);
    setIsDeleting(true);

    let timeoutId: number | null = null;

    try {
      const deletePromise = Promise.resolve(
        mediaType === 'photo' ? onDeletePhoto(mediaId) : onDeleteVideo?.(mediaId)
      );

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(new Error('Delete operation timed out'));
        }, 15000);
      });

      console.log('[Delete] Awaiting delete operation...');
      await Promise.race([deletePromise, timeoutPromise]);
      console.log('[Delete] Delete completed successfully');

      // Close dialogs only on success
      setDeleteConfirmOpen(false);
      closePhotoModal();
    } catch (error) {
      console.error('[Delete] Failed to delete media:', error);
      const isTimeout = error instanceof Error && error.message.includes('timed out');
      toast({
        title: isTimeout ? 'Taking too long' : 'Error',
        description: isTimeout
          ? 'Delete is taking too long. Please check your connection and try again.'
          : `Failed to delete ${mediaType}`,
        variant: 'destructive',
      });
      // Keep dialogs open on error so user can retry
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      console.log('[Delete] Cleanup - resetting states');
      setIsDeleting(false);
      setDeletingMediaId(null);
    }
  };

  const handleDownloadPhoto = async (photo: any) => {
    try {
      const response = await fetch(photo.photo_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo_${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Downloaded",
        description: "Photo saved to device"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download photo",
        variant: "destructive"
      });
    }
  };

  const handleDownloadAllPhotos = async () => {
    if (photos.length === 0) {
      toast({
        title: "No photos",
        description: "There are no photos to download",
        variant: "destructive"
      });
      return;
    }

    setIsDownloadingAll(true);
    let downloadedCount = 0;
    
    try {
      for (const photo of photos) {
        try {
          const response = await fetch(photo.photo_url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `photo_${photo.id}.jpg`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          downloadedCount++;
          // Small delay between downloads to prevent browser blocking
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Failed to download photo ${photo.id}:`, error);
        }
      }
      
      toast({
        title: "Download complete",
        description: `Downloaded ${downloadedCount} of ${photos.length} photos`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download photos",
        variant: "destructive"
      });
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Photo Editor Modal
  if (isEditing && editingFile) {
    return (
      <Dialog open={isEditing} onOpenChange={(open) => !isSaving && !open && setIsEditing(false)}>
        <DialogContent className="p-0 max-w-full h-screen max-h-screen border-0 rounded-none bg-background">
          <MobilePhotoEditor
            imageFile={editingFile}
            onSave={handleSaveEditedPhoto}
            onCancel={handleCancelEdit}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base flex items-center space-x-2">
            <Image className="w-4 h-4" />
            <span>Project Photos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 sm:py-12 px-4">
            <Camera className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-muted-foreground/30" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-1 sm:mb-2">No photos yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">Start documenting this project by capturing photos</p>
            <Button className="shadow-card hover:shadow-card-hover text-sm h-9 sm:h-10" onClick={onTakePhoto}>
              <Camera className="w-4 h-4 mr-2" />
              Take First Photo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center space-x-2">
            <Image className="w-4 h-4" />
            <span>Media ({allMedia.length})</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {photos.length > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 sm:h-9 px-2 sm:px-3 text-xs"
                onClick={handleDownloadAllPhotos}
                disabled={isDownloadingAll}
              >
                <DownloadCloud className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {isDownloadingAll ? 'Downloading...' : 'Download All'}
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-8 w-8 sm:h-9 sm:w-9 p-0" onClick={onTakePhoto}>
              <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Featured Photos */}
        {photos.some(p => p.is_highlighted_before || p.is_highlighted_after) && (
          <div>
            <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">Featured Photos</h4>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
              {photos
                .filter(p => p.is_highlighted_before || p.is_highlighted_after)
                .map((photo, idx) => {
                  const fullIndex = photos.findIndex(p => p.id === photo.id);
                  return (
                  <div key={photo.id} className="relative group">
                    <div className="relative aspect-square overflow-hidden rounded-lg border shadow-card">
                      <img
                        src={photo.photo_url}
                        alt={photo.caption || 'Featured photo'}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => openPhotoAtIndex(fullIndex)}
                      />
                      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
                        <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                          {photo.is_highlighted_before ? 'Before' : 'After'}
                        </Badge>
                      </div>
                      {photo.is_highlighted_after && (
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 fill-current" />
                        </div>
                      )}
                    </div>
                  </div>
                )})}
            </div>
          </div>
        )}

        {/* All Media Grid */}
        <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5 sm:gap-2">
          {allMedia.map((media, index) => (
            <div key={media.id} className="relative group">
              <div className="relative aspect-square overflow-hidden rounded-md sm:rounded-lg border">
                {media.type === 'photo' ? (
                  <>
                    <img
                      src={media.url}
                      alt={media.caption || 'Project photo'}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => openMediaAtIndex(index)}
                      loading="lazy"
                      decoding="async"
                    />
                    {/* Uploader initials badge */}
                    <div className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-white/95 shadow-sm flex items-center justify-center z-10">
                      <span className="text-[9px] font-semibold text-gray-800">
                        {media.uploader_initials || '??'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div 
                    className="w-full h-full bg-muted cursor-pointer relative"
                    onClick={() => openMediaAtIndex(index)}
                  >
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    {/* Play icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-5 h-5 sm:w-6 sm:h-6 text-foreground ml-0.5" />
                      </div>
                    </div>
                    {/* Video badge */}
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
                      <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 gap-1">
                        <Video className="w-2.5 h-2.5" />
                        Video
                      </Badge>
                    </div>
                  </div>
                )}
                
                {/* Overlay with metadata */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute bottom-0.5 left-7 right-0.5 sm:bottom-1 sm:left-8 sm:right-1">
                    <p className="text-white text-[9px] xs:text-[10px] sm:text-xs truncate">
                      {format(new Date(media.uploaded_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>

                {/* Edit Actions */}
                {canEdit && (
                  <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 p-0 bg-black/50 text-white hover:bg-black/70">
                          <MoreVertical className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {media.type === 'photo' && onToggleVisibility && (
                          <DropdownMenuItem onClick={() => onToggleVisibility(media.id, !media.is_visible_to_customer)}>
                            {media.is_visible_to_customer ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                            <span className="text-xs sm:text-sm">{media.is_visible_to_customer ? 'Hide from customer' : 'Show to customer'}</span>
                          </DropdownMenuItem>
                        )}
                        {media.type === 'photo' && onSetHighlight && (
                          <>
                            <DropdownMenuItem onClick={() => onSetHighlight(media.id, 'before')}>
                              <span className="text-xs sm:text-sm">Set as Before</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSetHighlight(media.id, 'after')}>
                              <span className="text-xs sm:text-sm">Set as After</span>
                            </DropdownMenuItem>
                          </>
                        )}
                        {(media.uploaded_by === user?.id || canEdit) && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteWithLoading(media.id, media.type)}
                            disabled={isDeleting}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            <span className="text-xs sm:text-sm">Delete</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                
                {/* Deleting overlay */}
                {deletingMediaId === media.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-md sm:rounded-lg">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Media Detail Modal with Carousel */}
        {selectedMedia && (
          <Dialog open={selectedMediaIndex !== null} onOpenChange={(open) => { if (!open && !isDeleting) closePhotoModal(); }}>
            <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] p-0">
              <DialogHeader className="p-3 sm:p-4 pb-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base sm:text-lg">
                    {selectedMedia.type === 'video' ? 'Video' : 'Photo'} {(selectedMediaIndex ?? 0) + 1} of {allMedia.length}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (isDeleting) return;
                      closePhotoModal();
                    }}
                    disabled={isDeleting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto">
                {/* Swipeable Carousel */}
                <div className="relative">
                  <Carousel 
                    setApi={setCarouselApi}
                    opts={{ startIndex: selectedMediaIndex ?? 0, loop: false }}
                    className="w-full"
                  >
                    <CarouselContent>
                      {allMedia.map((media, index) => (
                        <CarouselItem key={media.id}>
                          {media.type === 'photo' ? (
                            <ZoomableImage
                              src={media.url}
                              alt={media.caption || 'Project photo'}
                              className="w-full max-h-[50vh] sm:max-h-[60vh] object-contain"
                              containerClassName="w-full h-[50vh] sm:h-[60vh] rounded-lg border bg-muted/30 flex items-center justify-center"
                            />
                          ) : (
                            <div className="w-full h-[50vh] sm:h-[60vh] rounded-lg border bg-black flex items-center justify-center">
                              <video
                                src={media.url}
                                controls
                                autoPlay
                                className="w-full h-full object-contain rounded-lg"
                                playsInline
                                preload="metadata"
                                onError={(e) => console.error('Video playback error:', e)}
                              >
                                <source src={media.url} type="video/mp4" />
                                <source src={media.url} type="video/quicktime" />
                                Your browser does not support video playback.
                              </video>
                            </div>
                          )}
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                  
                  {/* Navigation Arrows */}
                  {allMedia.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-background/80 backdrop-blur-sm z-10"
                        onClick={goToPrevPhoto}
                        disabled={selectedMediaIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-background/80 backdrop-blur-sm z-10"
                        onClick={goToNextPhoto}
                        disabled={selectedMediaIndex === allMedia.length - 1}
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </>
                  )}
                  
                  {/* Dot Indicators */}
                  {allMedia.length > 1 && allMedia.length <= 10 && (
                    <div className="flex justify-center gap-1.5 mt-3">
                      {allMedia.map((media, index) => (
                        <button
                          key={media.id}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === selectedMediaIndex 
                              ? 'bg-primary' 
                              : 'bg-muted-foreground/30'
                          }`}
                          onClick={() => openMediaAtIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Notes/Caption + Actions */}
                {selectedMedia?.type === 'photo' && selectedPhoto ? (
                  <>
                    {/* Notes/Caption Section */}
                    <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Notes
                        </p>
                        {!isEditingCaption && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary"
                            onClick={() => {
                              setCaptionText(selectedPhoto.caption || '');
                              setIsEditingCaption(true);
                            }}
                          >
                            {selectedPhoto.caption ? 'Edit' : 'Add Notes'}
                          </Button>
                        )}
                      </div>

                      {isEditingCaption ? (
                        <div className="space-y-2">
                          <Textarea
                            value={captionText}
                            onChange={(e) => setCaptionText(e.target.value)}
                            placeholder="Add notes about this photo..."
                            className="min-h-[80px] text-sm resize-none"
                            autoFocus
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                setIsEditingCaption(false);
                                setCaptionText('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 text-xs"
                              disabled={updateCaptionMutation.isPending}
                              onClick={async () => {
                                await updateCaptionMutation.mutateAsync({
                                  photoId: selectedPhoto.id,
                                  caption: captionText,
                                });
                                setIsEditingCaption(false);
                              }}
                            >
                              {updateCaptionMutation.isPending ? (
                                'Saving...'
                              ) : (
                                <>
                                  <Check className="w-3 h-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-muted-foreground break-words">
                          {selectedPhoto.caption || 'No notes added yet'}
                        </p>
                      )}
                    </div>

                    {/* Recommendations Section */}
                    <div className="space-y-2 border rounded-lg p-3 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-amber-600" />
                          <span>Recommendations</span>
                          <span className="text-[10px] text-muted-foreground font-normal">(for customer)</span>
                        </p>
                        {!isEditingRecommendation && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-amber-600 hover:text-amber-700"
                            onClick={() => {
                              setRecommendationText(selectedPhoto.recommendation || '');
                              setIsEditingRecommendation(true);
                            }}
                          >
                            {selectedPhoto.recommendation ? 'Edit' : 'Add'}
                          </Button>
                        )}
                      </div>

                      {isEditingRecommendation ? (
                        <div className="space-y-2">
                          <Textarea
                            value={recommendationText}
                            onChange={(e) => setRecommendationText(e.target.value)}
                            placeholder="Add repair recommendations for the customer..."
                            className="min-h-[80px] text-sm resize-none"
                            autoFocus
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                setIsEditingRecommendation(false);
                                setRecommendationText('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-amber-600 hover:bg-amber-700"
                              disabled={updateRecommendationMutation.isPending}
                              onClick={async () => {
                                await updateRecommendationMutation.mutateAsync({
                                  photoId: selectedPhoto.id,
                                  recommendation: recommendationText,
                                });
                                setIsEditingRecommendation(false);
                              }}
                            >
                              {updateRecommendationMutation.isPending ? (
                                'Saving...'
                              ) : (
                                <>
                                  <Check className="w-3 h-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-muted-foreground break-words">
                          {selectedPhoto.recommendation || 'No recommendations added yet'}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
                      <div className="space-y-0.5 sm:space-y-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(selectedPhoto.uploaded_at), "MMM d, yyyy 'at' h:mm a")}
                          {selectedPhoto.uploader_name && ` • ${selectedPhoto.uploader_name}`}
                        </p>
                        {selectedPhoto.file_size && (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {(selectedPhoto.file_size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Download Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                          onClick={() => handleDownloadPhoto(selectedPhoto)}
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                          <span className="hidden xs:inline sm:inline">Save</span>
                        </Button>

                        {/* Edit Button */}
                        {(selectedPhoto.uploaded_by === user?.id || canEdit) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                            onClick={() => handleEditPhoto(selectedPhoto)}
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                            <span className="hidden xs:inline sm:inline">Edit</span>
                          </Button>
                        )}

                        {/* Delete Button */}
                        {(selectedPhoto.uploaded_by === user?.id || canEdit) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteWithLoading(selectedPhoto.id, 'photo')}
                            disabled={isDeleting}
                          >
                            {isDeleting && deletingMediaId === selectedPhoto.id ? (
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin sm:mr-2" />
                            ) : (
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                            )}
                            <span className="hidden xs:inline sm:inline">
                              {isDeleting && deletingMediaId === selectedPhoto.id ? 'Deleting...' : 'Delete'}
                            </span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {selectedMedia?.uploaded_at ? format(new Date(selectedMedia.uploaded_at), "MMM d, yyyy 'at' h:mm a") : ''}
                      </p>
                      {'file_size' in (selectedMedia || {}) && (selectedMedia as any)?.file_size && (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {(((selectedMedia as any).file_size as number) / 1024 / 1024).toFixed(1)} MB
                        </p>
                      )}
                    </div>

                    {/* Download Video */}
                    {selectedMedia?.type === 'video' && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
                      >
                        <a href={selectedMedia.url} download>
                          <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                          <span className="hidden xs:inline sm:inline">Download</span>
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};