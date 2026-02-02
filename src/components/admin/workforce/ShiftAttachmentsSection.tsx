import React, { useRef, useState } from 'react';
import { Button } from '../../ui/button';
import { Paperclip, Plus, Trash2, Image as ImageIcon, FileText, X, Eye } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useToast } from '../../../hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';

interface Attachment {
  id?: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

interface ShiftAttachmentsSectionProps {
  shiftId: string;
  attachments: Attachment[];
  isEditing: boolean;
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

export const ShiftAttachmentsSection: React.FC<ShiftAttachmentsSectionProps> = ({ 
  shiftId, 
  attachments, 
  isEditing,
  onAttachmentsChange 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const newAttachments: Attachment[] = [];

    for (const file of files) {
      try {
        const fileName = `${shiftId}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('shift-attachments')
          .upload(fileName, file);

        if (error) {
          // If bucket doesn't exist, create blob URL as fallback
          const blobUrl = URL.createObjectURL(file);
          newAttachments.push({
            name: file.name,
            url: blobUrl,
            type: file.type,
            size: file.size
          });
        } else {
          const { data: urlData } = supabase.storage
            .from('shift-attachments')
            .getPublicUrl(data.path);
          
          newAttachments.push({
            name: file.name,
            url: urlData.publicUrl,
            type: file.type,
            size: file.size
          });
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    }

    onAttachmentsChange([...attachments, ...newAttachments]);
    setUploading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(updated);
  };

  const isImage = (type: string) => type.startsWith('image/');

  const getFileIcon = (type: string) => {
    if (isImage(type)) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          Attachments {attachments.length > 0 && `(${attachments.length})`}
        </h4>
        {isEditing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Attachments Grid */}
      {attachments.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {attachments.map((attachment, index) => (
            <div 
              key={index} 
              className="relative group border rounded-lg overflow-hidden bg-muted/30"
            >
              {isImage(attachment.type) ? (
                <div 
                  className="aspect-square cursor-pointer"
                  onClick={() => setPreviewImage(attachment.url)}
                >
                  <img 
                    src={attachment.url} 
                    alt={attachment.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ) : (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square flex flex-col items-center justify-center p-2 hover:bg-muted/50 transition-colors"
                >
                  {getFileIcon(attachment.type)}
                  <span className="text-xs text-center mt-1 truncate w-full px-1">
                    {attachment.name}
                  </span>
                </a>
              )}
              {isEditing && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveAttachment(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No attachments added
        </p>
      )}

      {uploading && (
        <p className="text-sm text-muted-foreground text-center">Uploading...</p>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img 
              src={previewImage} 
              alt="Preview" 
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
