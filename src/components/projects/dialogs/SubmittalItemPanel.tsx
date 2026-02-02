import React, { useCallback } from 'react';
import { X, Upload, FileText, Image, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface SubmittalItemPanelProps {
  itemId: string;
  submittalId: string;
  onClose: () => void;
}

export const SubmittalItemPanel: React.FC<SubmittalItemPanelProps> = ({
  itemId,
  submittalId,
  onClose,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch item details
  const { data: item, isLoading } = useQuery({
    queryKey: ['submittal-item-detail', itemId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('submittal_items')
        .select('*')
        .eq('id', itemId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
  });

  // Fetch attachments
  const { data: attachments = [] } = useQuery({
    queryKey: ['submittal-item-attachments', itemId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('submittal_item_attachments')
        .select('*')
        .eq('submittal_item_id', itemId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!itemId,
  });

  // Update item mutation
  const updateItem = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await (supabase as any)
        .from('submittal_items')
        .update(updates)
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submittal-item-detail', itemId] });
      queryClient.invalidateQueries({ queryKey: ['submittal-items', submittalId] });
    },
  });

  // Upload attachment mutation
  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${itemId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('submittal-attachments')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('submittal-attachments')
        .getPublicUrl(fileName);

      const { error: insertError } = await (supabase as any)
        .from('submittal_item_attachments')
        .insert([{
          submittal_item_id: itemId,
          name: file.name,
          url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
        }]);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submittal-item-attachments', itemId] });
      toast({ title: 'File uploaded successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to upload file', variant: 'destructive' });
    },
  });

  // Delete attachment mutation
  const deleteAttachment = useMutation({
    mutationFn: async (attachmentId: string) => {
      const { error } = await (supabase as any)
        .from('submittal_item_attachments')
        .delete()
        .eq('id', attachmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submittal-item-attachments', itemId] });
      toast({ title: 'File deleted' });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      uploadAttachment.mutate(file);
    });
  }, [uploadAttachment]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const handleFieldUpdate = (field: string, value: any) => {
    updateItem.mutate({ [field]: value });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const isImage = (fileType: string) => fileType?.startsWith('image/');

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-[400px] bg-background border-l shadow-lg z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-background border-l shadow-lg z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Item #{item?.item_number}</h3>
          <p className="text-sm text-muted-foreground">{item?.name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Item #</Label>
            <Input
              value={item?.item_number || ''}
              onChange={(e) => handleFieldUpdate('item_number', e.target.value)}
              className="bg-muted/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              value={item?.name || ''}
              onChange={(e) => handleFieldUpdate('name', e.target.value)}
              className="bg-muted/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Plan Sheet Numbers</Label>
            <Input
              value={item?.plan_sheet_numbers || ''}
              onChange={(e) => handleFieldUpdate('plan_sheet_numbers', e.target.value)}
              placeholder="e.g., A-101"
              className="bg-muted/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Manufacturer</Label>
            <Input
              value={item?.manufacturer || ''}
              onChange={(e) => handleFieldUpdate('manufacturer', e.target.value)}
              placeholder="Enter manufacturer"
              className="bg-muted/30"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Spec Section</Label>
          <Input
            value={item?.spec_section || ''}
            onChange={(e) => handleFieldUpdate('spec_section', e.target.value)}
            placeholder="e.g., 07 31 00"
            className="bg-muted/30"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Textarea
            value={item?.description || ''}
            onChange={(e) => handleFieldUpdate('description', e.target.value)}
            placeholder="Add description..."
            rows={3}
            className="bg-muted/30"
          />
        </div>

        {/* Files Section */}
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Files</Label>
          
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? "Drop files here..." : "Drag & drop files or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOC, DOCX, Images
            </p>
          </div>

          {/* Attachments Grid */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {attachments.map((attachment: any) => (
                <div 
                  key={attachment.id} 
                  className="relative group rounded-lg border overflow-hidden bg-muted/20"
                >
                  {isImage(attachment.file_type) ? (
                    <img 
                      src={attachment.url} 
                      alt={attachment.name}
                      className="w-full h-20 object-cover"
                    />
                  ) : (
                    <div className="w-full h-20 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-white hover:text-destructive hover:bg-white/20"
                      onClick={() => deleteAttachment.mutate(attachment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="px-2 py-1 text-xs truncate bg-background/80">
                    {attachment.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* External Approver Response Section */}
        <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            External Approver Response
          </h4>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select 
              value={item?.response_status || ''} 
              onValueChange={(value) => handleFieldUpdate('response_status', value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="approved-as-noted">Approved as Noted</SelectItem>
                <SelectItem value="revise-resubmit">Revise & Resubmit</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date Sent</Label>
              <Input
                type="date"
                value={item?.date_sent ? format(new Date(item.date_sent), 'yyyy-MM-dd') : ''}
                onChange={(e) => handleFieldUpdate('date_sent', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date Received</Label>
              <Input
                type="date"
                value={item?.date_received ? format(new Date(item.date_received), 'yyyy-MM-dd') : ''}
                onChange={(e) => handleFieldUpdate('date_received', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Response Note</Label>
            <Textarea
              value={item?.response_note || ''}
              onChange={(e) => handleFieldUpdate('response_note', e.target.value)}
              placeholder="Add response notes..."
              rows={3}
              className="bg-background"
            />
          </div>
        </div>

        {/* Timeline Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timeline</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Created</span>
              <span className="ml-auto text-muted-foreground">
                {item?.created_at ? format(new Date(item.created_at), 'MMM d, yyyy h:mm a') : '-'}
              </span>
            </div>
            {item?.date_sent && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Sent</span>
                <span className="ml-auto text-muted-foreground">
                  {format(new Date(item.date_sent), 'MMM d, yyyy')}
                </span>
              </div>
            )}
            {item?.date_received && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Received</span>
                <span className="ml-auto text-muted-foreground">
                  {format(new Date(item.date_received), 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
