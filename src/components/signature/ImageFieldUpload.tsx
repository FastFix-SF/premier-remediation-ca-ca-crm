import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';

interface ImageFieldUploadProps {
  open: boolean;
  onClose: () => void;
  onImageUploaded: (imageUrl: string) => void;
}

export const ImageFieldUpload: React.FC<ImageFieldUploadProps> = ({
  open,
  onClose,
  onImageUploaded,
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `contract-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);

      onImageUploaded(publicUrl);
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Image for Contract</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!previewUrl ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to select an image
                </p>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-contain border rounded-lg"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload & Place Image'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  Change
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
