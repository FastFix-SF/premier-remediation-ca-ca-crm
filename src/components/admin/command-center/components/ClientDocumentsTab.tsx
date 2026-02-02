import React, { useState } from 'react';
import { FileText, Upload, ExternalLink, Loader2, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useClientDocuments } from '../hooks/useClientDocuments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientDocumentsTabProps {
  projectId: string;
}

const getStatusBadge = (status: string | null) => {
  if (!status) return 'bg-gray-500/20 text-gray-400';
  const statusLower = status.toLowerCase();
  if (['signed', 'approved', 'accepted'].includes(statusLower)) {
    return 'bg-green-500/20 text-green-400';
  }
  if (['pending', 'draft', 'sent'].includes(statusLower)) {
    return 'bg-amber-500/20 text-amber-400';
  }
  return 'bg-gray-500/20 text-gray-400';
};

const getDocTypeIcon = (type: string) => {
  switch (type) {
    case 'contract': return '📄';
    case 'proposal': return '📋';
    default: return '📁';
  }
};

export const ClientDocumentsTab: React.FC<ClientDocumentsTabProps> = ({ projectId }) => {
  const { allDocuments, documentsByCategory, isLoading } = useClientDocuments(projectId);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${projectId}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('project-documents')
          .getPublicUrl(filePath);

        await supabase.from('project_documents').insert({
          project_id: projectId,
          name: file.name,
          file_url: urlData.publicUrl,
          file_type: fileExt,
          file_size: file.size,
          category: 'General'
        });
      }
      toast.success('Documents uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  const categories = Object.keys(documentsByCategory);

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-6 pr-4">
        {/* Upload Button */}
        <div className="flex justify-end">
          <label>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
              disabled={uploading}
              asChild
            >
              <span className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload Document
              </span>
            </Button>
          </label>
        </div>

        {allDocuments.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No documents for this project</p>
            <p className="text-sm text-white/40 mt-1">Upload contracts, proposals, and other files</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {category} ({documentsByCategory[category].length})
              </h4>
              <div className="space-y-2">
                {documentsByCategory[category].map((doc) => (
                  <Card key={doc.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getDocTypeIcon(doc.type)}</span>
                          <div>
                            <p className="text-sm font-medium text-white">{doc.name}</p>
                            <p className="text-xs text-white/60">
                              {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.status && (
                            <Badge className={getStatusBadge(doc.status)}>{doc.status}</Badge>
                          )}
                          {doc.fileUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-white/60 hover:text-white"
                              onClick={() => window.open(doc.fileUrl!, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};
