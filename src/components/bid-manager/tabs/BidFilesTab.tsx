import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Trash2, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBidPackageFiles } from '@/hooks/useBidManager';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BidFilesTabProps {
  bidPackageId?: string;
}

export function BidFilesTab({ bidPackageId }: BidFilesTabProps) {
  const [uploading, setUploading] = useState(false);
  const { data: files = [], isLoading } = useBidPackageFiles(bidPackageId);
  const queryClient = useQueryClient();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!bidPackageId) return;

    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      for (const file of acceptedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${bidPackageId}/${Date.now()}-${file.name}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('quote-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('quote-attachments')
          .getPublicUrl(fileName);

        // Create file record
        const { error: dbError } = await supabase
          .from('bid_package_files')
          .insert({
            bid_package_id: bidPackageId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: userData.user?.id,
          });

        if (dbError) throw dbError;
      }

      queryClient.invalidateQueries({ queryKey: ['bid-package-files', bidPackageId] });
      toast.success(`${acceptedFiles.length} file(s) uploaded`);
    } catch (error: any) {
      toast.error('Failed to upload files: ' + error.message);
    } finally {
      setUploading(false);
    }
  }, [bidPackageId, queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: !bidPackageId || uploading,
  });

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!bidPackageId) return;

    try {
      const { error } = await supabase
        .from('bid_package_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['bid-package-files', bidPackageId] });
      toast.success('File deleted');
    } catch (error: any) {
      toast.error('Failed to delete file: ' + error.message);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!bidPackageId) {
    return <div className="text-center py-8 text-muted-foreground">Save the bid package first to add files.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Uploading...</span>
          </div>
        ) : isDragActive ? (
          <div className="flex items-center justify-center gap-2">
            <Upload className="h-6 w-6" />
            <span>Drop files here</span>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              Drag and drop files here, or click to select
            </p>
          </div>
        )}
      </div>

      {/* Files List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No files uploaded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{file.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.file_size)} • {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => handleDelete(file.id, file.file_name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
