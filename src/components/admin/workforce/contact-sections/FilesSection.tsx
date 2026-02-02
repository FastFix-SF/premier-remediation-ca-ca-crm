import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Trash2, FileText, Image, Download } from 'lucide-react';
import { format } from 'date-fns';
import AddFilesDialog from './AddFilesDialog';
import { useContactDetails } from '@/hooks/useContactDetails';

interface FilesSectionProps {
  contactId?: string;
}

const FilesSection: React.FC<FilesSectionProps> = ({ contactId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { files, filesLoading, deleteFile } = useContactDetails(contactId);

  const handleDeleteFile = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteFile.mutate(fileId);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType?: string) => {
    if (fileType?.startsWith('image/')) {
      return <Image className="h-5 w-5 text-sky-500" />;
    }
    return <FileText className="h-5 w-5 text-rose-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Files</h3>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add File
        </Button>
      </div>

      {filesLoading ? (
        <div className="bg-background rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">Loading files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="bg-background rounded-lg border p-8 text-center">
          <div className="text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-foreground mb-2">No Files Yet</h3>
            <p className="text-sm">Click "Add File" to upload files for this contact.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="bg-background rounded-lg border p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                {getFileIcon(file.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.file_size)} • {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(file.file_url, '_blank')}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteFile(file.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddFilesDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        contactId={contactId}
      />
    </div>
  );
};

export default FilesSection;
