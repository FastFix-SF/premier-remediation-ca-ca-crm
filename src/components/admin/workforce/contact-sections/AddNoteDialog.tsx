import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDropzone } from 'react-dropzone';
import { StickyNote, Plus, X, Image, FileText, File } from 'lucide-react';
import { useContactDetails } from '@/hooks/useContactDetails';

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId?: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
}

const AddNoteDialog: React.FC<AddNoteDialogProps> = ({
  open,
  onOpenChange,
  contactId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const { createNote } = useContactDetails(contactId);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, open: openFilePicker } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
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

  const handleSave = () => {
    if (!contactId) return;
    
    createNote.mutate(
      { contact_id: contactId, title, description },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    uploadedFiles.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setTitle('');
    setDescription('');
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-slate-600" />
            <DialogTitle>Note</DialogTitle>
          </div>
        </DialogHeader>

        <div {...getRootProps()} className="space-y-6 py-4">
          <input {...getInputProps()} />
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder=""
              className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=""
              className="min-h-[100px] border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary resize-y"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((item, index) => (
              <div
                key={index}
                className="relative h-24 w-24 bg-muted rounded-lg overflow-hidden group"
              >
                {item.preview ? (
                  <img
                    src={item.preview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    {getFileIcon(item.file)}
                  </div>
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 h-5 w-5 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            
            <button
              onClick={openFilePicker}
              className="h-24 w-24 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <Plus className="h-8 w-8 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleSave} 
            className="px-12"
            disabled={createNote.isPending}
          >
            {createNote.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteDialog;
