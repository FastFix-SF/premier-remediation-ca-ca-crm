import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Plus, Image as ImageIcon, FileText, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface TaskAttachment {
  id?: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

interface TaskAttachmentsSectionProps {
  taskId: string;
  attachments: TaskAttachment[];
  onAttachmentsChange: (attachments: TaskAttachment[]) => void;
}

export const TaskAttachmentsSection: React.FC<TaskAttachmentsSectionProps> = ({
  taskId,
  attachments,
  onAttachmentsChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const newAttachments: TaskAttachment[] = [];

    for (const file of files) {
      try {
        const fileName = `${taskId}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('task-attachments')
          .upload(fileName, file);

        if (error) {
          // Fallback to blob URL if upload fails
          const blobUrl = URL.createObjectURL(file);
          newAttachments.push({
            name: file.name,
            url: blobUrl,
            type: file.type,
            size: file.size,
          });
        } else {
          const { data: urlData } = supabase.storage
            .from('task-attachments')
            .getPublicUrl(data.path);

          newAttachments.push({
            name: file.name,
            url: urlData.publicUrl,
            type: file.type,
            size: file.size,
          });
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    onAttachmentsChange([...attachments, ...newAttachments]);
    setUploading(false);

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
        <h4 className="text-sm font-semibold flex items-center gap-2 text-white/80">
          <Paperclip className="w-4 h-4" />
          Attachments {attachments.length > 0 && `(${attachments.length})`}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-white/60 hover:text-white"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
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
        <div className="grid grid-cols-3 gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="relative group border border-white/10 rounded-lg overflow-hidden bg-white/5"
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
                  className="aspect-square flex flex-col items-center justify-center p-2 hover:bg-white/10 transition-colors"
                >
                  {getFileIcon(attachment.type)}
                  <span className="text-xs text-center mt-1 truncate w-full px-1 text-white/60">
                    {attachment.name}
                  </span>
                </a>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveAttachment(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/40 text-center py-4">
          No attachments added
        </p>
      )}

      {uploading && (
        <p className="text-sm text-indigo-400 text-center">Uploading...</p>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Image Preview</DialogTitle>
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
