import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, FileSpreadsheet, File } from 'lucide-react';

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const DOCUMENT_CATEGORIES = [
  { value: 'contracts', label: 'Contracts' },
  { value: 'permits', label: 'Permits' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'photos', label: 'Photos' },
  { value: 'reports', label: 'Reports' },
  { value: 'general', label: 'General' },
];

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileSpreadsheet;
  if (fileType.includes('pdf') || fileType.includes('word')) return FileText;
  return File;
};

export const AddDocumentDialog: React.FC<AddDocumentDialogProps> = ({
  open,
  onOpenChange,
  projectId,
}) => {
  const [category, setCategory] = useState('general');
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'application/vnd.ms-excel': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
    },
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const fileName = `${projectId}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('contracts')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from('project_documents')
          .insert({
            project_id: projectId,
            name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            file_type: file.type,
            category: category,
          });

        if (dbError) throw dbError;
      }

      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-document-counts', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-document-items', projectId] });
      
      toast({ title: 'Success', description: `${selectedFiles.length} document(s) uploaded successfully` });
      setSelectedFiles([]);
      setCategory('general');
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: 'Failed to upload document(s)', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            {isDragActive ? (
              <p className="text-primary text-sm">Drop files here...</p>
            ) : (
              <>
                <p className="font-medium text-sm mb-1">Drag & drop files here</p>
                <p className="text-xs text-muted-foreground">
                  or click to browse
                </p>
              </>
            )}
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected Files</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => {
                  const Icon = getFileIcon(file.type);
                  return (
                    <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 px-2 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={selectedFiles.length === 0 || uploading}
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddDocumentDialog;
