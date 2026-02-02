import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { 
  PenTool, 
  Type, 
  Calendar, 
  Mail, 
  Hash, 
  CheckSquare,
  User,
  Building,
  AlertCircle,
  Image,
  X
} from 'lucide-react';
import type { EnvelopeRecipient, DocumentField } from '@/types/signature';
import { ImageFieldUpload } from './ImageFieldUpload';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker with better error handling
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SignatureFieldEditorProps {
  documentUrl: string;
  recipients: Partial<EnvelopeRecipient>[];
  fields: any[];
  onFieldsChange: (fields: any[]) => void;
}

const fieldTypes = [
  { value: 'signature', label: 'Signature', icon: PenTool, color: 'text-blue-500' },
  { value: 'initial', label: 'Initial', icon: PenTool, color: 'text-purple-500' },
  { value: 'date', label: 'Date', icon: Calendar, color: 'text-green-500' },
  { value: 'text', label: 'Text', icon: Type, color: 'text-gray-500' },
  { value: 'email', label: 'Email', icon: Mail, color: 'text-orange-500' },
  { value: 'number', label: 'Number', icon: Hash, color: 'text-yellow-500' },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: 'text-pink-500' },
  { value: 'name', label: 'Name', icon: User, color: 'text-indigo-500' },
  { value: 'company', label: 'Company', icon: Building, color: 'text-teal-500' },
  { value: 'image', label: 'Image', icon: Image, color: 'text-cyan-500' },
];

export const SignatureFieldEditor: React.FC<SignatureFieldEditorProps> = ({
  documentUrl,
  recipients,
  fields,
  onFieldsChange,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [selectedFieldType, setSelectedFieldType] = useState<string>('signature');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [pendingImageField, setPendingImageField] = useState<{
    pageNumber: number;
    x: number;
    y: number;
  } | null>(null);
  const [draggingField, setDraggingField] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Get valid recipients
  const validRecipients = recipients.filter(r => r.email && r.email.trim() !== '' && r.role === 'signer');

  // Set initial recipient when valid recipients change
  useEffect(() => {
    if (validRecipients.length > 0 && !selectedRecipient) {
      setSelectedRecipient(validRecipients[0].email!);
    }
  }, [validRecipients.length]);

  useEffect(() => {
    console.log('[PDF Editor] Component mounted with URL:', documentUrl);
    console.log('[PDF Editor] Recipients:', recipients);
    console.log('[PDF Editor] Valid recipients:', validRecipients);
    console.log('[PDF Editor] Selected recipient:', selectedRecipient);
  }, [documentUrl, recipients, validRecipients, selectedRecipient]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('[PDF Editor] PDF loaded successfully, pages:', numPages);
    setNumPages(numPages);
    setIsLoading(false);
    setLoadError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('[PDF Editor] PDF load error:', error);
    setLoadError(error.message || 'Failed to load PDF');
    setIsLoading(false);
  };

  const handlePageClick = (pageNumber: number) => (event: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedRecipient || validRecipients.length === 0) {
      toast({
        title: 'No Recipient Selected',
        description: 'Please add and select a recipient before placing fields.',
        variant: 'destructive',
      });
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // If image field type, open upload dialog
    if (selectedFieldType === 'image') {
      setPendingImageField({ pageNumber, x, y });
      setImageUploadOpen(true);
      return;
    }

    const recipient = recipients.find(r => r.email === selectedRecipient);
    if (!recipient) return;

    const newField = {
      id: `temp-${Date.now()}`,
      field_type: selectedFieldType,
      page_number: pageNumber,
      x_position: x,
      y_position: y,
      width: selectedFieldType === 'signature' ? 25 : 15,
      height: selectedFieldType === 'signature' ? 8 : 5,
      is_required: true,
      recipient_id: recipient.email,
      recipient_name: recipient.name,
    };

    onFieldsChange([...fields, newField]);
  };

  const handleImageUploaded = (imageUrl: string) => {
    if (!pendingImageField) return;

    const recipient = recipients.find(r => r.email === selectedRecipient);
    if (!recipient) return;

    const width = 60;
    const height = 40;

    const newField = {
      id: `temp-${Date.now()}`,
      field_type: 'image',
      page_number: pendingImageField.pageNumber,
      x_position: pendingImageField.x - (width / 2),
      y_position: pendingImageField.y - (height / 2),
      width,
      height,
      is_required: false,
      recipient_id: recipient.email,
      recipient_name: recipient.name,
      image_url: imageUrl,
    };

    onFieldsChange([...fields, newField]);
    setPendingImageField(null);
  };

  const handleRemoveField = (fieldId: string) => {
    onFieldsChange(fields.filter(f => f.id !== fieldId));
  };

  const handleFieldMouseDown = (e: React.MouseEvent, field: any) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    setDraggingField(field.id);
    setDragOffset({
      x: ((e.clientX - rect.left) / parentRect.width) * 100,
      y: ((e.clientY - rect.top) / parentRect.height) * 100,
    });
  };

  const handlePageMouseMove = (pageNumber: number) => (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingField) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onFieldsChange(fields.map(f => {
      if (f.id === draggingField && f.page_number === pageNumber) {
        return {
          ...f,
          x_position: x - dragOffset.x,
          y_position: y - dragOffset.y,
        };
      }
      return f;
    }));
  };

  const handleMouseUp = () => {
    setDraggingField(null);
  };

  const getFieldColor = (fieldType: string) => {
    const field = fieldTypes.find(f => f.value === fieldType);
    return field?.color || 'text-gray-500';
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-300px)]">
      {/* Left Side - Field Palette */}
      <div className="w-64 space-y-4">
        {/* Field Type Palette */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Field Type</label>
          <div className="grid grid-cols-1 gap-2">
            {fieldTypes.map((type) => {
              const isSelected = selectedFieldType === type.value;
              return (
                <Button
                  key={type.value}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFieldType(type.value)}
                  className="justify-start transition-all"
                >
                  <type.icon className={`h-4 w-4 mr-2 ${isSelected ? '' : type.color}`} />
                  {type.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Recipient Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium mb-2 block">Assign To</label>
          {validRecipients.length === 0 ? (
            <div className="p-3 border border-destructive/50 bg-destructive/10 rounded-md text-sm text-destructive">
              No recipients available. Please go to the Recipients tab and add at least one signer.
            </div>
          ) : (
            <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
              <SelectTrigger>
                <SelectValue placeholder="Select a recipient" />
              </SelectTrigger>
              <SelectContent>
                {validRecipients.map((recipient, index) => (
                  <SelectItem key={index} value={recipient.email!}>
                    {recipient.name} ({recipient.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Field Count */}
        <div className="border rounded-lg p-3 bg-muted/50">
          <div className="text-sm font-medium mb-1">Fields Added</div>
          <div className="text-2xl font-bold text-primary">{fields.length}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Click on the PDF to place fields
          </div>
        </div>
      </div>

      {/* Right Side - PDF Preview */}
      <div className="flex-1 border rounded-lg overflow-hidden bg-muted/30">
        <div className="h-full flex flex-col">
          {/* Zoom Controls */}
          <div className="flex items-center justify-between p-3 bg-background border-b gap-2">
            <span className="text-sm font-medium">
              {numPages ? `${numPages} ${numPages === 1 ? 'Page' : 'Pages'}` : 'Loading...'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                disabled={isLoading}
              >
                -
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScale(Math.min(2, scale + 0.1))}
                disabled={isLoading}
              >
                +
              </Button>
            </div>
          </div>

          {loadError && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load PDF: {loadError}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* PDF Document - Continuous Scroll */}
          <ScrollArea className="flex-1">
            <div className="p-4 flex flex-col items-center gap-4">
              <Document
                file={documentUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="p-8 text-center">
                    <div className="animate-pulse">Loading PDF document...</div>
                  </div>
                }
                error={
                  <div className="p-8 text-center text-destructive">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Failed to load PDF</p>
                  </div>
                }
              >
                {Array.from(new Array(numPages), (el, index) => {
                  const pageNum = index + 1;
                  return (
                    <div key={`page_${pageNum}`} className="relative mb-4">
                      <div 
                        className="relative inline-block" 
                        onClick={handlePageClick(pageNum)}
                        onMouseMove={handlePageMouseMove(pageNum)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      >
                        <Page
                          pageNumber={pageNum}
                          scale={scale}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          loading={<div className="p-4 text-center">Loading page {pageNum}...</div>}
                        />
                        
                        {/* Render fields on this page */}
                        {fields
                          .filter(f => f.page_number === pageNum)
                          .map((field) => {
                            const fieldType = fieldTypes.find(ft => ft.value === field.field_type);
                            const Icon = fieldType?.icon || PenTool;
                            
                            // Render image fields differently
                            if (field.field_type === 'image' && field.image_url) {
                              return (
                                <div
                                  key={field.id}
                                  className="absolute border-2 border-primary cursor-move group transition-all"
                                  style={{
                                    left: `${field.x_position}%`,
                                    top: `${field.y_position}%`,
                                    width: `${field.width}%`,
                                    height: `${field.height}%`,
                                  }}
                                  onMouseDown={(e) => handleFieldMouseDown(e, field)}
                                >
                                  <img 
                                    src={field.image_url} 
                                    alt="Contract" 
                                    className="w-full h-full object-contain pointer-events-none"
                                  />
                                  <button
                                    type="button"
                                    className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-xl border-2 border-background flex items-center justify-center z-[100]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveField(field.id);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                  <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Drag to move
                                  </div>
                                </div>
                              );
                            }
                            
                            return (
                              <div
                                key={field.id}
                                className="absolute border-2 border-dashed bg-opacity-20 cursor-pointer group hover:bg-opacity-40 transition-all flex items-center justify-center"
                                style={{
                                  left: `${field.x_position}%`,
                                  top: `${field.y_position}%`,
                                  width: `${field.width}%`,
                                  height: `${field.height}%`,
                                  borderColor: '#3b82f6',
                                  backgroundColor: '#3b82f620',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveField(field.id);
                                }}
                              >
                                <div className="flex items-center gap-1 text-xs font-medium text-primary">
                                  <Icon className="h-3 w-3" />
                                  {fieldType?.label || field.field_type}
                                </div>
                                <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  Click to remove
                                </div>
                              </div>
                            );
                          })}
                      </div>
                      
                      {/* Page number label */}
                      <div className="text-center text-xs text-muted-foreground mt-2">
                        Page {pageNum}
                      </div>
                    </div>
                  );
                })}
              </Document>
            </div>
          </ScrollArea>
        </div>
      </div>

      <ImageFieldUpload
        open={imageUploadOpen}
        onClose={() => {
          setImageUploadOpen(false);
          setPendingImageField(null);
        }}
        onImageUploaded={handleImageUploaded}
      />
    </div>
  );
};
