import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { useInvoiceFiles, useUploadInvoiceFile, useDeleteInvoiceFile } from '@/hooks/useInvoices';
import { format } from 'date-fns';

interface InvoiceFilesTabProps {
  invoiceId: string;
}

export function InvoiceFilesTab({ invoiceId }: InvoiceFilesTabProps) {
  const { data: files = [], isLoading } = useInvoiceFiles(invoiceId);
  const uploadFile = useUploadInvoiceFile();
  const deleteFile = useDeleteInvoiceFile();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await uploadFile.mutateAsync({ invoiceId, file });
    }
  }, [invoiceId, uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading files...</div>;

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, Images, Word documents
        </p>
      </div>

      {/* Files List */}
      <div className="space-y-2">
        {files.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No files uploaded yet</p>
        ) : (
          files.map((file) => (
            <Card key={file.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size || 0)} • {format(new Date(file.uploaded_at || ''), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteFile.mutate({ id: file.id, invoiceId })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
