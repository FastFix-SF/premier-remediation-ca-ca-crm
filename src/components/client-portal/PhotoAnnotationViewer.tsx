import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { X, Send, Circle, MapPin, Trash2, Check, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Annotation {
  id: string;
  photo_id: string;
  project_id: string;
  created_by: string;
  annotation_type: string;
  x_position: number;
  y_position: number;
  width?: number;
  height?: number;
  color: string;
  comment?: string;
  created_at: string;
}

interface Comment {
  id: string;
  photo_id: string;
  project_id: string;
  annotation_id?: string;
  created_by: string;
  created_by_name?: string;
  created_by_type: string;
  comment_text: string;
  is_resolved: boolean;
  created_at: string;
}

interface PhotoAnnotationViewerProps {
  isOpen: boolean;
  onClose: () => void;
  photo: {
    id: string;
    photo_url: string;
    caption?: string;
    photo_tag?: string;
  };
  projectId: string;
  clientName?: string;
}

export const PhotoAnnotationViewer: React.FC<PhotoAnnotationViewerProps> = ({
  isOpen,
  onClose,
  photo,
  projectId,
  clientName = 'Customer'
}) => {
  const queryClient = useQueryClient();
  const imageRef = useRef<HTMLDivElement>(null);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [pendingMarker, setPendingMarker] = useState<{ x: number; y: number } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);

  // Fetch annotations
  const { data: annotations = [] } = useQuery({
    queryKey: ['photo-annotations', photo.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photo_annotations')
        .select('*')
        .eq('photo_id', photo.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Annotation[];
    },
    enabled: isOpen
  });

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['photo-comments', photo.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photo_comments')
        .select('*')
        .eq('photo_id', photo.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Comment[];
    },
    enabled: isOpen
  });

  // Create annotation mutation
  const createAnnotation = useMutation({
    mutationFn: async ({ x, y, comment }: { x: number; y: number; comment: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create the annotation
      const { data: annotation, error: annotationError } = await supabase
        .from('photo_annotations')
        .insert({
          photo_id: photo.id,
          project_id: projectId,
          created_by: user?.id || '00000000-0000-0000-0000-000000000000',
          annotation_type: 'marker',
          x_position: x,
          y_position: y,
          color: '#ef4444',
          comment
        })
        .select()
        .maybeSingle();

      if (annotationError) throw annotationError;

      // Create the comment linked to annotation
      if (comment.trim()) {
        const { error: commentError } = await supabase
          .from('photo_comments')
          .insert({
            photo_id: photo.id,
            project_id: projectId,
            annotation_id: annotation.id,
            created_by: user?.id || '00000000-0000-0000-0000-000000000000',
            created_by_name: clientName,
            created_by_type: 'customer',
            comment_text: comment
          });

        if (commentError) throw commentError;
      }

      // Notify team members
      await supabase.functions.invoke('notify-photo-comment', {
        body: {
          projectId,
          photoId: photo.id,
          commentText: comment,
          commenterName: clientName,
          annotationType: 'marker'
        }
      });

      return annotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-annotations', photo.id] });
      queryClient.invalidateQueries({ queryKey: ['photo-comments', photo.id] });
      setPendingMarker(null);
      setCommentText('');
      setIsAddingMarker(false);
      toast.success('Comment added! Team has been notified.');
    },
    onError: (error) => {
      console.error('Error creating annotation:', error);
      toast.error('Failed to add comment');
    }
  });

  // Add standalone comment
  const addComment = useMutation({
    mutationFn: async (text: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('photo_comments')
        .insert({
          photo_id: photo.id,
          project_id: projectId,
          annotation_id: activeAnnotation,
          created_by: user?.id || '00000000-0000-0000-0000-000000000000',
          created_by_name: clientName,
          created_by_type: 'customer',
          comment_text: text
        });

      if (error) throw error;

      // Notify team members
      await supabase.functions.invoke('notify-photo-comment', {
        body: {
          projectId,
          photoId: photo.id,
          commentText: text,
          commenterName: clientName
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-comments', photo.id] });
      setCommentText('');
      toast.success('Comment sent! Team has been notified.');
    },
    onError: () => {
      toast.error('Failed to send comment');
    }
  });

  // Delete annotation
  const deleteAnnotation = useMutation({
    mutationFn: async (annotationId: string) => {
      const { error } = await supabase
        .from('photo_annotations')
        .delete()
        .eq('id', annotationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-annotations', photo.id] });
      queryClient.invalidateQueries({ queryKey: ['photo-comments', photo.id] });
      setActiveAnnotation(null);
      toast.success('Marker removed');
    }
  });

  // Handle image click for placing markers
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingMarker || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingMarker({ x, y });
  }, [isAddingMarker]);

  const handleSubmitMarker = () => {
    if (!pendingMarker || !commentText.trim()) {
      toast.error('Please add a comment for this marker');
      return;
    }
    createAnnotation.mutate({
      x: pendingMarker.x,
      y: pendingMarker.y,
      comment: commentText
    });
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    addComment.mutate(commentText);
  };

  // Get comments for an annotation
  const getAnnotationComments = (annotationId: string) => 
    comments.filter(c => c.annotation_id === annotationId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Image Section */}
          <div className="flex-1 flex flex-col bg-black/95">
            <DialogHeader className="p-4 bg-black/50">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-white flex items-center gap-2">
                  {photo.caption || 'Photo'}
                  {photo.photo_tag && (
                    <Badge variant="outline" className="text-white border-white/30">
                      {photo.photo_tag}
                    </Badge>
                  )}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isAddingMarker ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsAddingMarker(!isAddingMarker);
                      setPendingMarker(null);
                    }}
                    className={isAddingMarker ? "bg-red-500 hover:bg-red-600" : "text-white border-white/30"}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    {isAddingMarker ? 'Cancel' : 'Add Marker'}
                  </Button>
                </div>
              </div>
              {isAddingMarker && (
                <p className="text-sm text-white/70 mt-2">
                  Click on the image to place a marker, then add your comment
                </p>
              )}
            </DialogHeader>

            {/* Image with annotations */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
              <div 
                ref={imageRef}
                className={`relative max-h-full max-w-full ${isAddingMarker ? 'cursor-crosshair' : 'cursor-default'}`}
                onClick={handleImageClick}
              >
                <img 
                  src={photo.photo_url} 
                  alt={photo.caption || 'Photo'} 
                  className="max-h-[65vh] max-w-full object-contain rounded-lg"
                  draggable={false}
                />
                
                {/* Render existing annotations */}
                {annotations.map((annotation, index) => (
                  <div
                    key={annotation.id}
                    className={`absolute w-8 h-8 -ml-4 -mt-4 cursor-pointer transition-transform hover:scale-110 ${
                      activeAnnotation === annotation.id ? 'scale-125 z-20' : 'z-10'
                    }`}
                    style={{
                      left: `${annotation.x_position}%`,
                      top: `${annotation.y_position}%`
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAnnotation(activeAnnotation === annotation.id ? null : annotation.id);
                    }}
                  >
                    <div className="relative">
                      <Circle 
                        className="w-8 h-8 fill-red-500 text-white stroke-2" 
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Pending marker */}
                {pendingMarker && (
                  <div
                    className="absolute w-8 h-8 -ml-4 -mt-4 z-30 animate-pulse"
                    style={{
                      left: `${pendingMarker.x}%`,
                      top: `${pendingMarker.y}%`
                    }}
                  >
                    <Circle className="w-8 h-8 fill-yellow-500 text-white stroke-2" />
                  </div>
                )}
              </div>
            </div>

            {/* Pending marker comment input */}
            {pendingMarker && (
              <div className="p-4 bg-black/50 border-t border-white/10">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Describe the issue or comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
                    rows={2}
                  />
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handleSubmitMarker}
                      disabled={!commentText.trim() || createAnnotation.isPending}
                      size="sm"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setPendingMarker(null)}
                      className="text-white/70"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comments Sidebar */}
          <div className="w-80 bg-background border-l flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({comments.length})
              </h3>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {annotations.length === 0 && comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No comments yet. Click "Add Marker" to mark an area and leave a comment.
                  </p>
                ) : (
                  <>
                    {annotations.map((annotation, index) => {
                      const annotationComments = getAnnotationComments(annotation.id);
                      return (
                        <div 
                          key={annotation.id} 
                          className={`p-3 rounded-lg border transition-colors ${
                            activeAnnotation === annotation.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setActiveAnnotation(annotation.id)}
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              {annotationComments.map(comment => (
                                <div key={comment.id} className="mb-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                      {comment.created_by_name || 'Customer'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                                    </span>
                                  </div>
                                  <p className="text-sm">{comment.comment_text}</p>
                                </div>
                              ))}
                              {annotation.comment && annotationComments.length === 0 && (
                                <p className="text-sm">{annotation.comment}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAnnotation.mutate(annotation.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Standalone comments (not linked to annotations) */}
                    {comments.filter(c => !c.annotation_id).map(comment => (
                      <div key={comment.id} className="p-3 rounded-lg border">
                        <div className="flex items-start gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {(comment.created_by_name || 'C')[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {comment.created_by_name || 'Customer'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm">{comment.comment_text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Comment input */}
            {!isAddingMarker && !pendingMarker && (
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a general comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                  <Button 
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || addComment.isPending}
                    size="icon"
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
