import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Loader2, 
  Sparkles, 
  Check, 
  X, 
  Download,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

interface PhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  photo: {
    id: string;
    photo_url: string;
    caption?: string;
    project_id: string;
    photo_tag?: string | null;
  };
  onPhotoUpdated: () => void;
}

interface EditError {
  message: string;
  type: 'config' | 'quota' | 'size' | 'network' | 'validation' | 'api' | 'unknown';
  details?: any;
}

const PhotoEditor: React.FC<PhotoEditorProps> = ({ 
  isOpen, 
  onClose, 
  photo, 
  onPhotoUpdated 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [error, setError] = useState<EditError | null>(null);

  const handleAutoCleanup = async () => {
    // Clear previous errors
    setError(null);
    setIsProcessing(true);

    try {
      console.log('Starting AI auto-cleanup for image:', photo.photo_url);

      const { data, error: functionError } = await supabase.functions.invoke('edit-photo-ai', {
        body: {
          imageUrl: photo.photo_url,
          isAutoCleanup: true
        }
      });

      console.log('Supabase function response:', { data, error: functionError });

      if (functionError) {
        console.error('Supabase function error:', functionError);
        throw new Error(`Function call failed: ${functionError.message}`);
      }

      if (data?.error) {
        console.error('API error from function:', data);
        const errorType = data.errorType || 'unknown';
        throw { 
          message: data.error, 
          type: errorType,
          details: data.details 
        };
      }

      if (data?.editedImage) {
        setEditedImageUrl(data.editedImage);
        setShowComparison(true);
        toast.success(data.message || 'Imperfections removed successfully!');
        console.log('Photo cleanup completed successfully');
      } else {
        throw new Error('No cleaned image returned from the API');
      }
    } catch (error: any) {
      console.error('Error cleaning up photo:', error);
      
      let errorMessage = 'Failed to clean up photo. Please try again.';
      let errorType: EditError['type'] = 'unknown';

      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.type) {
        errorType = error.type;
      } else if (error.message?.includes('API key')) {
        errorType = 'config';
      } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
        errorType = 'quota';
      } else if (error.message?.includes('too large') || error.message?.includes('size')) {
        errorType = 'size';
      } else if (error.message?.includes('network') || error.name === 'TypeError') {
        errorType = 'network';
      }

      setError({
        message: errorMessage,
        type: errorType,
        details: error.details
      });

      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccept = async () => {
    if (!editedImageUrl) return;

    try {
      // Upload the edited image to Supabase storage
      const response = await fetch(editedImageUrl);
      const blob = await response.blob();
      
      const fileExt = 'png';
      const fileName = `${photo.project_id}/edited-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(fileName);

      // Update the photo record with the new URL
      const { error: updateError } = await supabase
        .from('project_photos')
        .update({ 
          photo_url: publicUrl,
          caption: photo.caption ? `${photo.caption} (AI-cleaned)` : 'AI-cleaned photo'
        })
        .eq('id', photo.id);

      if (updateError) throw updateError;

      toast.success('Photo updated successfully!');
      onPhotoUpdated();
      handleClose();
    } catch (error) {
      console.error('Error saving edited photo:', error);
      toast.error('Failed to save edited photo');
    }
  };

  const handleKeepBoth = async () => {
    if (!editedImageUrl) return;

    try {
      // Upload the edited image as a new photo
      const response = await fetch(editedImageUrl);
      const blob = await response.blob();
      
      const fileExt = 'png';
      const fileName = `${photo.project_id}/edited-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(fileName);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert new photo record
      const { error: insertError } = await supabase
        .from('project_photos')
        .insert({
          project_id: photo.project_id,
          photo_url: publicUrl,
          caption: photo.caption ? `${photo.caption} (AI-cleaned)` : 'AI-cleaned photo',
          is_visible_to_customer: true,
          uploaded_by: user.id,
          display_order: 0,
          photo_tag: photo.photo_tag,
          is_highlighted_before: false,
          is_highlighted_after: false
        });

      if (insertError) throw insertError;

      toast.success('Cleaned photo added as new photo!');
      onPhotoUpdated();
      handleClose();
    } catch (error) {
      console.error('Error adding edited photo:', error);
      toast.error('Failed to add edited photo');
    }
  };

  const handleClose = () => {
    setEditedImageUrl(null);
    setShowComparison(false);
    setError(null);
    onClose();
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const retryEdit = () => {
    setError(null);
    handleAutoCleanup();
  };

  const getErrorMessage = (error: EditError) => {
    switch (error.type) {
      case 'config':
        return {
          title: 'Configuration Error',
          message: 'ClipDrop API key is not configured properly. Please contact your administrator.',
          action: 'Contact Admin'
        };
      case 'quota':
        return {
          title: 'API Limit Reached',
          message: 'ClipDrop API quota has been exceeded. Please try again later or contact your administrator.',
          action: 'Try Later'
        };
      case 'size':
        return {
          title: 'Image Too Large',
          message: 'The image is too large for processing. Please use a smaller image (max 10MB).',
          action: 'Use Smaller Image'
        };
      case 'network':
        return {
          title: 'Connection Error',
          message: 'Network connection failed. Please check your internet connection and try again.',
          action: 'Retry'
        };
      case 'validation':
        return {
          title: 'Invalid Input',
          message: 'Please try again with a different image.',
          action: 'Try Again'
        };
      case 'api':
        return {
          title: 'API Error',
          message: 'The AI service encountered an error. Please try again with a different image.',
          action: 'Retry'
        };
      default:
        return {
          title: 'Processing Error',
          message: error.message || 'An unexpected error occurred while cleaning the image.',
          action: 'Retry'
        };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            AI Photo Auto-Retouch
            <Badge variant="outline" className="ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by AI
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Automatically remove imperfections, people, workers, trash, debris, tools, and any visual distractions from your project photos while keeping the lighting and perspective realistic.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <div>
                  <strong>{getErrorMessage(error).title}</strong>
                  <p>{getErrorMessage(error).message}</p>
                </div>
                {error.type !== 'config' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryEdit}
                    disabled={isProcessing}
                    className="mt-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    {getErrorMessage(error).action}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {!showComparison ? (
            <>
              {/* Original Photo Preview */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Original Photo</h3>
                <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video">
                  <img
                    src={photo.photo_url}
                    alt="Original photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Auto-Cleanup Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">AI Auto-Cleanup</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Our AI will automatically identify and remove imperfections such as workers, tools, debris, and other visual distractions while maintaining the natural lighting and perspective of your photo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAutoCleanup}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removing Imperfections...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Erase Imperfections
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Comparison View */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">AI Cleanup Results</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadImage(photo.photo_url, 'original-photo.jpg')}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Original
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadImage(editedImageUrl!, 'cleaned-photo.png')}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Cleaned
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Original</span>
                    </div>
                    <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video">
                      <img
                        src={photo.photo_url}
                        alt="Original photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Cleaned */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">AI Cleaned</span>
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Imperfections Removed
                      </Badge>
                    </div>
                    <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video">
                      <img
                        src={editedImageUrl!}
                        alt="Cleaned photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setShowComparison(false)}
                >
                  ← Back to Edit
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleClose}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleKeepBoth}
                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  >
                    Keep Both Photos
                  </Button>
                  <Button onClick={handleAccept}>
                    <Check className="w-4 h-4 mr-1" />
                    Replace Original
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoEditor;