import React, { useCallback } from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useServiceTicketFiles } from '@/hooks/useServiceTickets';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';

interface ServiceTicketFilesTabProps {
  ticketId: string;
}

export const ServiceTicketFilesTab: React.FC<ServiceTicketFilesTabProps> = ({ ticketId }) => {
  const { data: files = [] } = useServiceTicketFiles(ticketId);
  const queryClient = useQueryClient();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `service-tickets/${ticketId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('project-photos')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('project-photos')
            .getPublicUrl(filePath);

          const { data: { user } } = await supabase.auth.getUser();

          await (supabase as any)
            .from('service_ticket_files')
            .insert({
              ticket_id: ticketId,
              file_name: file.name,
              file_url: urlData.publicUrl,
              file_type: file.type,
              file_size: file.size,
              uploaded_by: user?.id,
            });

          queryClient.invalidateQueries({ queryKey: ['service-ticket-files', ticketId] });
          toast.success(`Uploaded ${file.name}`);
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    },
    [ticketId, queryClient]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleDelete = async (fileId: string) => {
    try {
      await (supabase as any)
        .from('service_ticket_files')
        .delete()
        .eq('id', fileId);

      queryClient.invalidateQueries({ queryKey: ['service-ticket-files', ticketId] });
      toast.success('File deleted');
    } catch {
      toast.error('Failed to delete file');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span className="h-2 w-2 bg-green-500 rounded" />
          Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {/* Upload Box */}
          <div
            {...getRootProps()}
            className={`aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted'
            }`}
          >
            <input {...getInputProps()} />
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>

          {/* File Items */}
          {files.map((file) => (
            <div
              key={file.id}
              className="aspect-square border rounded-lg p-2 flex flex-col items-center justify-center relative group"
            >
              {file.file_type?.startsWith('image/') ? (
                <img
                  src={file.file_url}
                  alt={file.file_name}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="text-xs text-center mt-1 truncate w-full">
                {file.file_name}
              </span>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(file.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
