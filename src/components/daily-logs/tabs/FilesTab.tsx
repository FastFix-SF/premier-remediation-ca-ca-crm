import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Plus, Trash2, Image, FileText, Upload, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DailyLogFile,
  useAddDailyLogFile,
  useDeleteDailyLogFile,
} from '@/hooks/useDailyLogs';

interface FilesTabProps {
  dailyLogId: string;
  files: DailyLogFile[];
}

export const FilesTab: React.FC<FilesTabProps> = ({ dailyLogId, files }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const addMutation = useAddDailyLogFile();
  const deleteMutation = useDeleteDailyLogFile();

  const photos = files.filter((f) => f.category === 'photo');
  const documents = files.filter((f) => f.category === 'document');

  const uploadFile = async (file: File, category: 'photo' | 'document') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${dailyLogId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('project-photos')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('project-photos')
      .getPublicUrl(fileName);

    return {
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      category,
    };
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], category: 'photo' | 'document') => {
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          const fileData = await uploadFile(file, category);
          await addMutation.mutateAsync({
            daily_log_id: dailyLogId,
            ...fileData,
            description: null,
            uploaded_by: null,
          });
        }
        toast({ title: 'Files uploaded successfully' });
      } catch (error: any) {
        toast({
          title: 'Upload failed',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
      }
    },
    [dailyLogId, addMutation, toast]
  );

  const photoDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'photo'),
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    disabled: uploading,
  });

  const docDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'document'),
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    disabled: uploading,
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Photos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Image className="w-4 h-4" />
            Photos ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...photoDropzone.getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-4 ${
              photoDropzone.isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...photoDropzone.getInputProps()} />
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {uploading ? 'Uploading...' : 'Drop photos here or click to upload'}
            </p>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group rounded-lg overflow-hidden border bg-muted"
                >
                  <img
                    src={photo.file_url}
                    alt={photo.file_name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPreviewUrl(photo.file_url)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate({ id: photo.id, dailyLogId })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...docDropzone.getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-4 ${
              docDropzone.isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...docDropzone.getInputProps()} />
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {uploading ? 'Uploading...' : 'Drop documents here or click to upload'}
            </p>
          </div>

          {documents.length > 0 && (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate({ id: doc.id, dailyLogId })}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Photo Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
