import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Upload, FileText, X, Check, Edit2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const UploadInvoiceDialog: React.FC<UploadInvoiceDialogProps> = ({
  open,
  onOpenChange,
  projectId
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [step, setStep] = useState<'upload' | 'review' | 'complete'>('upload');
  const { toast } = useToast();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
    }
  });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    try {
      setUploading(true);
      setProgress(0);
      const uploadedFiles = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress((i / files.length) * 100);

        // Upload file to Supabase Storage (invoices bucket)
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Generate signed URL with 1 hour expiration for AI processing
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('invoices')
          .createSignedUrl(fileName, 3600);

        if (signedUrlError) throw signedUrlError;

        uploadedFiles.push({
          name: file.name,
          url: signedUrlData.signedUrl,
          type: file.type
        });
      }

      setProgress(100);
      
      // Call AI extraction edge function for each file
      const allExtractedData = [];
      let hadPdfError = false;
      
      for (const uploadedFile of uploadedFiles) {
        try {
          console.log('Extracting materials from:', uploadedFile.name);
          
          const { data: extractionData, error: extractionError } = await supabase.functions.invoke(
            'extract-invoice-materials',
            {
              body: {
                fileUrl: uploadedFile.url,
                fileName: uploadedFile.name
              }
            }
          );

          // Check for PDF error in the response data
          if (extractionData?.error && extractionData.error.includes('PDF files are not supported')) {
            hadPdfError = true;
            toast({
              title: "PDF Not Supported",
              description: "Please upload your invoice as an image (JPG, PNG) or take a screenshot of the PDF.",
              variant: "destructive",
            });
            continue; // Skip to next file
          }

          if (extractionError) {
            console.error('Extraction error:', extractionError);
            toast({
              title: "Extraction Failed",
              description: extractionError.message || 'Failed to extract materials from invoice',
              variant: "destructive",
            });
            continue; // Skip to next file
          }

          if (extractionData?.success && extractionData.materials) {
            allExtractedData.push(...extractionData.materials.map((item: any) => ({
              ...item,
              file_url: uploadedFile.url
            })));
          } else {
            console.warn('No materials extracted from:', uploadedFile.name);
          }
        } catch (err) {
          console.error('Failed to extract from file:', uploadedFile.name, err);
          toast({
            title: "Extraction Error",
            description: `Failed to process ${uploadedFile.name}`,
            variant: "destructive",
          });
        }
      }

      // Only show "No Materials Found" if we didn't have PDF errors
      if (allExtractedData.length === 0 && !hadPdfError) {
        toast({
          title: "No Materials Found",
          description: "No material items could be extracted from the uploaded files",
          variant: "destructive",
        });
        setStep('upload');
        return;
      }
      
      // If we had PDF errors and no materials, go back to upload step
      if (allExtractedData.length === 0 && hadPdfError) {
        setStep('upload');
        return;
      }

      setExtractedData(allExtractedData.map((item, index) => ({
        ...item,
        id: `temp-${index}`,
        selected: true
      })));

      setStep('review');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload and process files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const saveExtractedData = async () => {
    try {
      setUploading(true);
      const selectedItems = extractedData.filter(item => item.selected);

      const { error } = await supabase
        .from('project_materials')
        .insert(
          selectedItems.map(item => ({
            project_id: projectId,
            date: item.date,
            vendor: item.vendor,
            item_code: item.item_code || null,
            item_description: item.item_description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            tax_amount: item.tax_amount,
            total_amount: item.total_amount,
            source: 'upload',
            file_url: item.file_url
          }))
        );

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${selectedItems.length} material items`,
      });

      setStep('complete');
    } catch (error) {
      console.error('Error saving extracted data:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save extracted material data",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setExtractedData([]);
    setStep('upload');
    setProgress(0);
    onOpenChange(false);
  };

  const toggleItemSelection = (index: number) => {
    setExtractedData(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateItemField = (index: number, field: string, value: any) => {
    setExtractedData(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      // Recalculate total if quantity or unit_price changes
      if (field === 'quantity' || field === 'unit_price') {
        updated.total_amount = (updated.quantity || 0) * (updated.unit_price || 0) + (updated.tax_amount || 0);
      }
      return updated;
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Invoice / Receipt</DialogTitle>
          <DialogDescription>
            Upload image files (JPG, PNG) of your invoices and we'll extract material data using AI
          </DialogDescription>
          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> For PDF invoices, please take a screenshot or save as an image first. Our AI works best with JPG and PNG formats.
            </p>
          </div>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            {/* File Drop Zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p>Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-lg font-medium">
                    Drag & drop invoice images here, or click to select
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports JPG, PNG, and other image formats
                  </p>
                </div>
              )}
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({files.length})</Label>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <Label>Processing Files...</Label>
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground">
                  Uploading and extracting data with AI
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={uploadFiles}
                disabled={files.length === 0 || uploading}
              >
                {uploading ? 'Processing...' : 'Upload & Extract'}
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Review Extracted Data</h3>
              <p className="text-sm text-muted-foreground">
                Review and select items to add to your project materials
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {extractedData.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    item.selected ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Selection checkbox and description */}
                      <div className="flex items-center space-x-2">
                        <div 
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${
                            item.selected ? 'border-primary bg-primary' : 'border-muted-foreground/25'
                          }`}
                          onClick={() => toggleItemSelection(index)}
                        >
                          {item.selected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <Input
                          value={item.item_description}
                          onChange={(e) => updateItemField(index, 'item_description', e.target.value)}
                          className="flex-1 font-medium h-8"
                          placeholder="Item description"
                        />
                      </div>
                      
                      {/* Editable fields in grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">Vendor</Label>
                          <Input
                            value={item.vendor}
                            onChange={(e) => updateItemField(index, 'vendor', e.target.value)}
                            className="h-7 text-sm"
                            placeholder="Vendor"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Date</Label>
                          <Input
                            type="date"
                            value={item.date?.split('T')[0] || ''}
                            onChange={(e) => updateItemField(index, 'date', e.target.value)}
                            className="h-7 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Quantity</Label>
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              value={item.quantity || ''}
                              onChange={(e) => updateItemField(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="h-7 text-sm w-16"
                              placeholder="Qty"
                            />
                            <Input
                              value={item.unit || ''}
                              onChange={(e) => updateItemField(index, 'unit', e.target.value)}
                              className="h-7 text-sm w-14"
                              placeholder="Unit"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Unit Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_price || ''}
                            onChange={(e) => updateItemField(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="h-7 text-sm"
                            placeholder="$0.00"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Total display */}
                    <div className="text-right min-w-[100px]">
                      <div className="text-lg font-bold">{formatCurrency(item.total_amount)}</div>
                      {item.tax_amount > 0 && (
                        <div className="text-sm text-muted-foreground">
                          +{formatCurrency(item.tax_amount)} tax
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {extractedData.filter(item => item.selected).length} of {extractedData.length} items selected
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Back
                </Button>
                <Button
                  onClick={saveExtractedData}
                  disabled={extractedData.filter(item => item.selected).length === 0 || uploading}
                >
                  {uploading ? 'Saving...' : 'Add to Project'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <Check className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Materials Added Successfully</h3>
            <p className="text-muted-foreground mb-6">
              The extracted material data has been added to your project
            </p>
            <Button onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};