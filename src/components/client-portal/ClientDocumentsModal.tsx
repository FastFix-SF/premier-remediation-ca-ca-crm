import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, File, Image, FileSpreadsheet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ClientDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}

interface Document {
  id: string;
  name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  category: string | null;
  uploaded_at: string;
}

export const ClientDocumentsModal: React.FC<ClientDocumentsModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName
}) => {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['client-documents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_documents')
        .select('id, name, file_url, file_size, file_type, category, uploaded_at')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: isOpen && !!projectId
  });

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-5 w-5" />;
    if (fileType.includes('image')) return <Image className="h-5 w-5 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    }
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = (doc: Document) => {
    window.open(doc.file_url, '_blank');
  };

  const getCategoryColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'contract': return 'bg-purple-500/10 text-purple-700';
      case 'invoice': return 'bg-green-500/10 text-green-700';
      case 'proposal': return 'bg-blue-500/10 text-blue-700';
      case 'permit': return 'bg-amber-500/10 text-amber-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Project Documents
          </DialogTitle>
          {projectName && (
            <p className="text-sm text-muted-foreground">{projectName}</p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-muted rounded-lg h-16" />
                ))}
              </div>
            ) : documents?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No documents shared yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents?.map(doc => (
                  <div 
                    key={doc.id} 
                    className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(parseISO(doc.uploaded_at), 'MMM d, yyyy')}</span>
                        {doc.file_size && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(doc.file_size)}</span>
                          </>
                        )}
                      </div>
                      {doc.category && (
                        <Badge variant="secondary" className={`mt-1 text-[10px] ${getCategoryColor(doc.category)}`}>
                          {doc.category}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
