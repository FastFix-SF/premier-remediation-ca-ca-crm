import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ZoomIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Screenshot {
  url: string;
  uploaded_at: string;
  caption?: string;
}

interface ScreenshotUploaderProps {
  deliverableId: string;
  screenshots: Screenshot[];
  onScreenshotsChange: (screenshots: Screenshot[]) => void;
}

export function ScreenshotUploader({
  deliverableId,
  screenshots,
  onScreenshotsChange,
}: ScreenshotUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const newScreenshots: Screenshot[] = [];

    try {
      for (const file of acceptedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${deliverableId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('client-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('client-attachments')
          .getPublicUrl(fileName);

        newScreenshots.push({
          url: publicUrl,
          uploaded_at: new Date().toISOString(),
        });
      }

      const updatedScreenshots = [...screenshots, ...newScreenshots];

      const { error: updateError } = await supabase
        .from('client_deliverables')
        .update({
          screenshots: updatedScreenshots as unknown as null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliverableId);

      if (updateError) throw updateError;

      onScreenshotsChange(updatedScreenshots);
      toast.success(`${newScreenshots.length} screenshot(s) uploaded`);
    } catch (error) {
      console.error('Error uploading screenshots:', error);
      toast.error('Failed to upload screenshots');
    } finally {
      setUploading(false);
    }
  }, [deliverableId, screenshots, onScreenshotsChange]);

  const handleDelete = async (urlToDelete: string) => {
    try {
      const updatedScreenshots = screenshots.filter(s => s.url !== urlToDelete);

      const { error } = await supabase
        .from('client_deliverables')
        .update({
          screenshots: updatedScreenshots as unknown as null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliverableId);

      if (error) throw error;

      onScreenshotsChange(updatedScreenshots);
      toast.success('Screenshot removed');
    } catch (error) {
      console.error('Error deleting screenshot:', error);
      toast.error('Failed to remove screenshot');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    disabled: uploading,
  });

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Uploading...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Upload className="w-4 h-4" />
            <span className="text-sm">
              {isDragActive ? 'Drop files here...' : 'Drag & drop or click to upload'}
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail Grid */}
      {screenshots.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {screenshots.map((screenshot, index) => (
            <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={screenshot.url}
                alt={`Screenshot ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-7 h-7 text-white hover:bg-white/20"
                  onClick={() => setPreviewUrl(screenshot.url)}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-7 h-7 text-white hover:bg-red-500/50"
                  onClick={() => handleDelete(screenshot.url)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Screenshot preview"
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
