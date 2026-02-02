import React, { useState } from 'react';
import { X, FileText, FolderOpen, ExternalLink, File, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ReportViewerModal } from './ReportViewerModal';

interface ProjectDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  category: 'reports' | 'files';
  title: string;
}

export const ProjectDocumentsModal: React.FC<ProjectDocumentsModalProps> = ({
  isOpen,
  onClose,
  projectId,
  category,
  title,
}) => {
  const [selectedReport, setSelectedReport] = useState<{ id: string; url: string; name: string } | null>(null);
  const [docToDelete, setDocToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['project-documents', projectId, category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', category)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const getFileIcon = (fileType: string | null) => {
    if (fileType?.includes('html') || category === 'reports') {
      return <FileText className="h-5 w-5 text-primary" />;
    }
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const handleOpenDocument = async (doc: { id: string; file_url: string; name: string; file_type: string | null }) => {
    // Open reports in the in-app viewer
    if (category === 'reports' || doc.file_type?.includes('html')) {
      setSelectedReport({ id: doc.id, url: doc.file_url, name: doc.name });
      return;
    }

    // Default: download the file (more reliable than opening in a new tab on mobile)
    try {
      const res = await fetch(doc.file_url);
      if (!res.ok) throw new Error(`Download failed (${res.status})`);

      const blob = await res.blob();
      const fileName = doc.name || 'download';
      saveAs(blob, fileName);
      toast.success('Download started');
    } catch (e) {
      console.error('Download error:', e);

      // Fallback: try direct link download/open
      try {
        const link = document.createElement('a');
        link.href = doc.file_url;
        link.download = doc.name || 'download';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.message('If download is blocked, your browser will open the file instead.');
      } catch {
        window.open(doc.file_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', docToDelete.id);

      if (error) throw error;

      toast.success('File deleted');
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId, category] });
    } catch (e) {
      console.error('Delete error:', e);
      toast.error('Failed to delete file');
    } finally {
      setIsDeleting(false);
      setDocToDelete(null);
    }
  };

  return (
    <>
      <ReportViewerModal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        reportUrl={selectedReport?.url || ''}
        reportName={selectedReport?.name || ''}
        reportId={selectedReport?.id}
      />
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              {category === 'reports' ? (
                <FileText className="h-5 w-5" />
              ) : (
                <FolderOpen className="h-5 w-5" />
              )}
              {title}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(80vh-80px)]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                {category === 'reports' ? (
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                ) : (
                  <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                )}
                <p className="text-muted-foreground font-medium">
                  No {category} yet
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {category === 'reports' 
                    ? 'Create a report using the + button below'
                    : 'Upload files using the + button below'}
                </p>
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="w-full flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <button
                    onClick={() => handleOpenDocument(doc)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.name}</p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocToDelete({ id: doc.id, name: doc.name });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>

      <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{docToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
