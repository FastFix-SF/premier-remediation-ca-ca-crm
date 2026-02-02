import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Trash2, 
  File, 
  FileImage, 
  FileText, 
  Loader2, 
  Upload, 
  ExternalLink 
} from 'lucide-react';

interface ExpenseFile {
  id: string;
  expense_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
}

interface ExpenseFilesTabProps {
  expenseId: string;
}

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File;
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ExpenseFilesTab = ({ expenseId }: ExpenseFilesTabProps) => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data: files, isLoading } = useQuery({
    queryKey: ['expense-files', expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_files')
        .select('*')
        .eq('expense_id', expenseId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as ExpenseFile[];
    },
    enabled: !!expenseId,
  });

  const deleteFile = useMutation({
    mutationFn: async (file: ExpenseFile) => {
      // Delete from storage
      const fileName = file.file_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('expense-files')
          .remove([`${expenseId}/${fileName}`]);
      }
      
      // Delete from database
      const { error } = await supabase
        .from('expense_files')
        .delete()
        .eq('id', file.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-files', expenseId] });
      toast.success('File deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete file: ' + error.message);
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${expenseId}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('expense-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('expense-files')
          .getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await supabase
          .from('expense_files')
          .insert({
            expense_id: expenseId,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
          });

        if (dbError) throw dbError;
      }

      queryClient.invalidateQueries({ queryKey: ['expense-files', expenseId] });
      toast.success(`${acceptedFiles.length} file(s) uploaded`);
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  }, [expenseId, queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop files here...' : 'Drag & drop files or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground">
              Images, PDFs, Word docs (max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Files List */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {files && files.length > 0 ? (
            files.map((file) => {
              const FileIcon = getFileIcon(file.file_type);
              const isImage = file.file_type?.startsWith('image/');

              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 group"
                >
                  {isImage ? (
                    <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={file.file_url}
                        alt={file.file_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <FileIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)} • {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(file.file_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteFile.mutate(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <File className="h-8 w-8 mb-2" />
              <p className="text-sm">No files uploaded</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
