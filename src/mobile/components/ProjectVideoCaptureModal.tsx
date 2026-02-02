import React, { useState, useRef } from 'react';
import { X, Video, Upload, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useMobileVideoUpload } from '@/mobile/hooks/useMobileVideos';

interface ProjectVideoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const ProjectVideoCaptureModal: React.FC<ProjectVideoCaptureModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadMutation = useMobileVideoUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        return;
      }
      
      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        return;
      }
      
      setSelectedFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate progress since we can't track real upload progress easily
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);
    
    try {
      await uploadMutation.mutateAsync({
        projectId,
        file: selectedFile,
        caption: caption || undefined,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset and close
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setCaption('');
    setUploadProgress(0);
    setIsUploading(false);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Add Video
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Video className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground mb-1">Select a video</p>
              <p className="text-xs text-muted-foreground">
                MP4, MOV, or WebM up to 100MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Video Preview */}
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  src={videoPreviewUrl || undefined}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>

              {/* File Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[200px]">
                  {selectedFile.name}
                </span>
                <span className="text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>

              {/* Caption Input */}
              <div className="space-y-2">
                <Label htmlFor="caption">Caption (optional)</Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a description..."
                  className="resize-none"
                  rows={2}
                />
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {selectedFile && !isUploading && (
              <Button
                variant="outline"
                onClick={() => {
                  if (videoPreviewUrl) {
                    URL.revokeObjectURL(videoPreviewUrl);
                  }
                  setSelectedFile(null);
                  setVideoPreviewUrl(null);
                }}
                className="flex-1"
              >
                Change
              </Button>
            )}
            <Button
              onClick={selectedFile ? handleUpload : () => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : selectedFile ? (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Select Video
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
