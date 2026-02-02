import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, FileText, Image, File } from 'lucide-react';

interface AddSubmittalItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submittalId: string;
  onItemAdded?: () => void;
}

interface UploadedFile {
  file: File;
  preview?: string;
}

export const AddSubmittalItemDialog: React.FC<AddSubmittalItemDialogProps> = ({
  open,
  onOpenChange,
  submittalId,
  onItemAdded,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [itemNumber, setItemNumber] = useState('');
  const [name, setName] = useState('');
  const [planSheetNumbers, setPlanSheetNumbers] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [specSection, setSpecSection] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  
  // External response state
  const [externalStatus, setExternalStatus] = useState('');
  const [dateSent, setDateSent] = useState('');
  const [dateReceived, setDateReceived] = useState('');
  const [responseNote, setResponseNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current items count for auto-numbering
  const { data: existingItems = [] } = useQuery({
    queryKey: ['submittal-items', submittalId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('submittal_items')
        .select('id')
        .eq('submittal_id', submittalId);
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const resetForm = () => {
    setItemNumber('');
    setName('');
    setPlanSheetNumbers('');
    setManufacturer('');
    setSpecSection('');
    setDescription('');
    setExternalStatus('');
    setDateSent('');
    setDateReceived('');
    setResponseNote('');
    files.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate item number if not provided
      const finalItemNumber = itemNumber.trim() || `${(existingItems.length + 1).toString().padStart(2, '0')}`;
      
      // Insert submittal item
      const { data: newItem, error: itemError } = await (supabase as any)
        .from('submittal_items')
        .insert([{
          submittal_id: submittalId,
          item_number: finalItemNumber,
          name: name.trim(),
          plan_sheet_numbers: planSheetNumbers.trim() || null,
          manufacturer: manufacturer.trim() || null,
          spec_section: specSection.trim() || null,
          description: description.trim() || null,
          status: externalStatus || 'pending',
          date_sent: dateSent ? new Date(dateSent).toISOString() : null,
          date_received: dateReceived ? new Date(dateReceived).toISOString() : null,
          response_note: responseNote.trim() || null,
          order_index: existingItems.length,
        }])
        .select()
        .maybeSingle();

      if (itemError) throw itemError;

      // Upload files and create attachments
      if (files.length > 0 && newItem) {
        for (const uploadedFile of files) {
          const fileName = `${submittalId}/${newItem.id}/${Date.now()}-${uploadedFile.file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('submittal-attachments')
            .upload(fileName, uploadedFile.file);

          if (uploadError) {
            console.error('File upload error:', uploadError);
            continue;
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('submittal-attachments')
            .getPublicUrl(fileName);

          await (supabase as any)
            .from('submittal_item_attachments')
            .insert([{
              submittal_item_id: newItem.id,
              name: uploadedFile.file.name,
              url: publicUrl,
              file_type: uploadedFile.file.type,
              file_size: uploadedFile.file.size,
            }]);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['submittal-items', submittalId] });
      queryClient.invalidateQueries({ queryKey: ['submittal-item-attachments'] });
      toast({ title: 'Item added successfully' });
      resetForm();
      onItemAdded?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast({ title: 'Failed to add item', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-semibold">Add Submittal Item</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Row 1: Item # and Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Item #</Label>
              <Input
                value={itemNumber}
                onChange={(e) => setItemNumber(e.target.value)}
                placeholder="Auto-generated"
                className="bg-muted/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item name"
                className="bg-muted/30"
              />
            </div>
          </div>

          {/* Row 2: Plan Sheet Numbers and Manufacturer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Plan Sheet Numbers</Label>
              <Input
                value={planSheetNumbers}
                onChange={(e) => setPlanSheetNumbers(e.target.value)}
                placeholder="e.g., A-101, A-102"
                className="bg-muted/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Manufacturer</Label>
              <Input
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Manufacturer name"
                className="bg-muted/30"
              />
            </div>
          </div>

          {/* Row 3: Spec Section */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Spec Section</Label>
            <Input
              value={specSection}
              onChange={(e) => setSpecSection(e.target.value)}
              placeholder="e.g., 07 31 00"
              className="bg-muted/30"
            />
          </div>

          {/* Row 4: Description */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Item description..."
              rows={3}
              className="bg-muted/30"
            />
          </div>

          {/* Row 5: Files */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Files</Label>
            <div className="flex flex-wrap gap-2">
              {files.map((f, index) => (
                <div
                  key={index}
                  className="relative group h-16 w-16 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden"
                >
                  {f.preview ? (
                    <img src={f.preview} alt={f.file.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      {getFileIcon(f.file)}
                      <span className="text-[10px] truncate max-w-[56px]">{f.file.name.split('.').pop()}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <div
                {...getRootProps()}
                className={`h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* External Approver Response Card */}
          <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              External Approver Response
            </h4>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={externalStatus} onValueChange={setExternalStatus}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="z-[10001]">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="approved-as-noted">Approved as Noted</SelectItem>
                  <SelectItem value="revise-resubmit">Revise & Resubmit</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Date Sent</Label>
                <Input
                  type="date"
                  value={dateSent}
                  onChange={(e) => setDateSent(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Date Received</Label>
                <Input
                  type="date"
                  value={dateReceived}
                  onChange={(e) => setDateReceived(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Response Note</Label>
              <Textarea
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                placeholder="External response notes..."
                rows={2}
                className="bg-background"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
