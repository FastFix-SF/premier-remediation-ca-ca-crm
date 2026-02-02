import React, { useRef, useState } from 'react';
import { Upload, File } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface ServiceTicketUploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
}

export const ServiceTicketUploadFileModal: React.FC<ServiceTicketUploadFileModalProps> = ({
  isOpen,
  onClose,
  ticketId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `service-tickets/${ticketId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(filePath);

        const { data: { user } } = await supabase.auth.getUser();

        await (supabase as any)
          .from('service_ticket_files')
          .insert({
            ticket_id: ticketId,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: user?.id
          });
      }

      queryClient.invalidateQueries({ queryKey: ['service-ticket-files', ticketId] });
      toast.success('Files uploaded successfully');
      setSelectedFiles([]);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Button
            variant="outline"
            className="w-full h-32 flex flex-col items-center justify-center gap-2 border-dashed"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-8 h-8 text-muted-foreground" />
            <span className="text-muted-foreground">Click to select files</span>
          </Button>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected files:</p>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm bg-muted/50 rounded p-2">
                  <File className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className="w-full"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </DialogContent>
    </Dialog>
  );
};
