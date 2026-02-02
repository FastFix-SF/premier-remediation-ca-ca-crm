import React, { useRef, useState } from 'react';
import { Camera, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface ServiceTicketPhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
}

export const ServiceTicketPhotoCaptureModal: React.FC<ServiceTicketPhotoCaptureModalProps> = ({
  isOpen,
  onClose,
  ticketId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
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
      toast.success('Photos uploaded successfully');
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Photos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Button
            variant="outline"
            className="w-full h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="w-8 h-8 text-primary" />
            <span>Take Photo</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <ImageIcon className="w-8 h-8 text-primary" />
            <span>Choose from Gallery</span>
          </Button>
        </div>

        {uploading && (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Uploading...</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
      </DialogContent>
    </Dialog>
  );
};
