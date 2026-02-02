import React, { useCallback } from 'react';
import { Upload, File, Trash2, Download, FileText, Image, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { Estimate, useEstimateFiles, useCreateEstimateFile, useDeleteEstimateFile } from '@/hooks/useEstimates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EstimateFilesTabProps {
  estimate: Estimate;
}

export function EstimateFilesTab({ estimate }: EstimateFilesTabProps) {
  const { data: files = [], isLoading } = useEstimateFiles(estimate.id);
  const createFile = useCreateEstimateFile();
  const deleteFile = useDeleteEstimateFile();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${estimate.id}/${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('quote-attachments')
          .upload(fileName, file);
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from('quote-attachments')
          .getPublicUrl(fileName);
        
        await createFile.mutateAsync({
          estimate_id: estimate.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  }, [estimate.id, createFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleDelete = async (fileId: string) => {
    await deleteFile.mutateAsync({ id: fileId, estimateId: estimate.id });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string | null) => {
    if (!type) return File;
    if (type.includes('image')) return Image;
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
    if (type.includes('pdf')) return FileText;
    return File;
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-primary font-medium">Drop the files here...</p>
            ) : (
              <>
                <p className="font-medium mb-1">Drag & drop files here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading files...</p>
          ) : files.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No files uploaded yet. Drag and drop files above to upload.
            </p>
          ) : (
            <div className="space-y-3">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.file_type);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                      <FileIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file_size)} • Uploaded {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(file.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
