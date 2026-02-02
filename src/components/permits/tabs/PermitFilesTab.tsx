import React, { useRef } from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePermitFiles, useCreatePermitFile, useDeletePermitFile } from '@/hooks/usePermits';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PermitFilesTabProps {
  permitId: string;
}

export const PermitFilesTab: React.FC<PermitFilesTabProps> = ({ permitId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: files = [], isLoading } = usePermitFiles(permitId);
  const createFile = useCreatePermitFile();
  const deleteFile = useDeletePermitFile();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${permitId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('quote-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('quote-attachments')
        .getPublicUrl(fileName);

      await createFile.mutateAsync({
        permit_id: permitId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
      });
    } catch (error: any) {
      toast.error('Failed to upload file: ' + error.message);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile.mutateAsync({ fileId, permitId });
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (fileType?.includes('pdf')) {
      return <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center text-red-600 font-bold text-xs">PDF</div>;
    }
    if (fileType?.includes('image')) {
      return <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center text-blue-600"><FileText className="h-6 w-6" /></div>;
    }
    return <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-600"><FileText className="h-6 w-6" /></div>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <Plus className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">Add File</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* File List */}
          {isLoading ? (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
              Loading files...
            </div>
          ) : files.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
              No files uploaded yet
            </div>
          ) : (
            files.map((file) => (
              <div 
                key={file.id} 
                className="relative group aspect-square border rounded-lg p-2 flex flex-col items-center justify-center"
              >
                <a 
                  href={file.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col items-center"
                >
                  {getFileIcon(file.file_type)}
                  <span className="text-xs text-muted-foreground mt-2 truncate max-w-full px-1">
                    {file.file_name}
                  </span>
                </a>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(file.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
