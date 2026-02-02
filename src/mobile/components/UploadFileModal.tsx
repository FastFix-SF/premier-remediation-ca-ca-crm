import React, { useState, useRef } from 'react';
import { X, FileUp, Loader2, File, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const UploadFileModal: React.FC<UploadFileModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${projectId}/files/${fileName}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('contracts')
          .getPublicUrl(filePath);

        // Save document record
        const { error: dbError } = await supabase
          .from('project_documents')
          .insert({
            project_id: projectId,
            name: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type,
            category: 'files',
            description: `Uploaded on ${new Date().toLocaleDateString()}`,
          });

        if (dbError) throw dbError;
      }

      toast.success(`${selectedFiles.length} file(s) uploaded successfully!`);
      setSelectedFiles([]);
      onClose();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-xl p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Upload Files</SheetTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[calc(70vh-80px)]">
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* File Input Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <FileUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Tap to select files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {selectedFiles.length} file(s) selected
                </p>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => removeFile(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <Button
              className="w-full"
              disabled={selectedFiles.length === 0 || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File(s)` : 'Files'}
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
