import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  useChangeOrderFiles, 
  useUploadChangeOrderFile, 
  useDeleteChangeOrderFile 
} from '@/hooks/useChangeOrders';
import { useDropzone } from 'react-dropzone';
import { Plus, File, Trash2, Download, FileText, Image, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';

interface COFilesTabProps {
  changeOrderId?: string;
}

export function COFilesTab({ changeOrderId }: COFilesTabProps) {
  const { data: files = [], isLoading } = useChangeOrderFiles(changeOrderId);
  const uploadMutation = useUploadChangeOrderFile();
  const deleteMutation = useDeleteChangeOrderFile();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!changeOrderId) return;
    acceptedFiles.forEach(file => {
      uploadMutation.mutate({ changeOrderId, file });
    });
  }, [changeOrderId, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: !changeOrderId,
  });

  if (!changeOrderId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Save the change order first to upload files.
      </div>
    );
  }

  const getFileIcon = (type?: string | null) => {
    if (!type) return <File className="h-8 w-8" />;
    if (type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Plus className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to browse'}
        </p>
      </div>

      {/* Files Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No files uploaded yet</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map(file => (
            <Card key={file.id} className="group relative">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  {getFileIcon(file.file_type)}
                  <p className="mt-2 text-sm font-medium line-clamp-2">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(file.file_size)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => window.open(file.file_url, '_blank')}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteMutation.mutate({ id: file.id, changeOrderId })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
