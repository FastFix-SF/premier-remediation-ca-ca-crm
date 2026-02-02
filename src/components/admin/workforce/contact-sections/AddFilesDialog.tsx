import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDropzone } from 'react-dropzone';
import { FileText, Image, Upload, X, File, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContactDetails } from '@/hooks/useContactDetails';

interface AddFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId?: string;
}

type TabType = 'new-files' | 'gallery';

interface UploadedFile {
  file: File;
  preview?: string;
  uploading?: boolean;
  uploaded?: boolean;
}

const AddFilesDialog: React.FC<AddFilesDialogProps> = ({
  open,
  onOpenChange,
  contactId,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('new-files');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const { uploadFile, files } = useContactDetails(contactId);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSave = async () => {
    if (!contactId || uploadedFiles.length === 0) return;

    for (const item of uploadedFiles) {
      await uploadFile.mutateAsync({ contact_id: contactId, file: item.file });
    }
    
    handleClose();
  };

  const handleClose = () => {
    uploadedFiles.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setUploadedFiles([]);
    onOpenChange(false);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-sky-500" />;
    }
    if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-rose-500" />;
    }
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            <DialogTitle>Files & Photos</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex h-[400px]">
          {/* Left Sidebar */}
          <div className="w-40 bg-muted/30 border-r flex flex-col shrink-0">
            <button
              onClick={() => setActiveTab('new-files')}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-left transition-colors',
                activeTab === 'new-files'
                  ? 'bg-background text-foreground border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-background/50'
              )}
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">New Files</span>
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-left transition-colors',
                activeTab === 'gallery'
                  ? 'bg-background text-foreground border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-background/50'
              )}
            >
              <Image className="h-5 w-5" />
              <span className="text-sm font-medium">Gallery</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            {activeTab === 'new-files' && (
              <div className="h-full flex flex-col">
                <div
                  {...getRootProps()}
                  className={cn(
                    'flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors',
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/30 hover:border-primary/50'
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="relative mb-4">
                    <CloudUpload className="h-16 w-16 text-muted-foreground/50" />
                    <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
                      <Upload className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-sm text-foreground">
                    Click here or Drop files here to Upload
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">OR</p>
                  <p className="text-sm mt-1">
                    <span className="font-semibold">Browse Files</span>{' '}
                    <span className="text-muted-foreground">On Your Computer</span>
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <ScrollArea className="mt-4 max-h-32">
                    <div className="space-y-2">
                      {uploadedFiles.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                        >
                          {item.preview ? (
                            <img
                              src={item.preview}
                              alt=""
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            getFileIcon(item.file)
                          )}
                          <span className="text-sm flex-1 truncate">
                            {item.file.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="h-full">
                {files.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Image className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">
                      No files or photos available in gallery
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Files uploaded to this contact will appear here
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="grid grid-cols-3 gap-2">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(file.file_url, '_blank')}
                        >
                          {file.file_type?.startsWith('image/') ? (
                            <img
                              src={file.file_url}
                              alt={file.file_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center p-2">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground mt-1 truncate w-full text-center">
                                {file.file_name}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={uploadedFiles.length === 0 || uploadFile.isPending}
          >
            {uploadFile.isPending ? 'Uploading...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFilesDialog;
