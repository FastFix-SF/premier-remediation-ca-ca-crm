import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, File } from 'lucide-react';
import { useServiceTicketFiles } from '@/hooks/useServiceTickets';
import { formatDistanceToNow } from 'date-fns';

interface ServiceTicketDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  category: 'reports' | 'files';
  title: string;
}

export const ServiceTicketDocumentsModal: React.FC<ServiceTicketDocumentsModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  category,
  title
}) => {
  const { data: allFiles = [], isLoading } = useServiceTicketFiles(ticketId);
  
  // Filter files based on category
  const files = allFiles.filter(f => {
    const isImage = f.file_type?.startsWith('image/') || f.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    if (category === 'reports') {
      return f.file_type?.includes('pdf') || f.file_name?.toLowerCase().includes('report');
    }
    return !isImage; // Files = all non-image files
  });

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : files.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No {category} yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  {getFileIcon(file.file_name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)} • {formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(file.file_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
