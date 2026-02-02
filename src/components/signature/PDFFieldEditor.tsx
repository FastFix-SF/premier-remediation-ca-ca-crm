import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileSignature, Calendar, Type, Mail, User, CheckSquare } from 'lucide-react';
import { EnvelopeRecipient } from '@/hooks/useSignatureEnvelope';

interface Field {
  id: string;
  field_type: 'signature' | 'initial' | 'date' | 'text' | 'email' | 'name' | 'checkbox';
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  page_number: number;
  is_required: boolean;
  recipient_id?: string;
}

interface PDFFieldEditorProps {
  pdfUrl: string;
  recipients: EnvelopeRecipient[];
  fields: Field[];
  onFieldsChange: (fields: Field[]) => void;
}

const fieldTypes = [
  { type: 'signature', label: 'Signature', icon: FileSignature, color: 'bg-blue-100 border-blue-400' },
  { type: 'initial', label: 'Initial', icon: FileSignature, color: 'bg-green-100 border-green-400' },
  { type: 'date', label: 'Date', icon: Calendar, color: 'bg-purple-100 border-purple-400' },
  { type: 'text', label: 'Text', icon: Type, color: 'bg-gray-100 border-gray-400' },
  { type: 'email', label: 'Email', icon: Mail, color: 'bg-orange-100 border-orange-400' },
  { type: 'name', label: 'Name', icon: User, color: 'bg-pink-100 border-pink-400' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: 'bg-yellow-100 border-yellow-400' },
] as const;

export const PDFFieldEditor: React.FC<PDFFieldEditorProps> = ({
  pdfUrl,
  recipients,
  fields,
  onFieldsChange,
}) => {
  const [selectedFieldType, setSelectedFieldType] = useState<string>('signature');
  const [selectedRecipient, setSelectedRecipient] = useState<string>(recipients[0]?.email || '');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart) return;
    // Visual feedback could be added here
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !pdfContainerRef.current) return;

    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate field dimensions based on type
    const fieldDimensions = {
      signature: { width: 200, height: 60 },
      initial: { width: 80, height: 60 },
      date: { width: 150, height: 40 },
      text: { width: 200, height: 40 },
      email: { width: 200, height: 40 },
      name: { width: 200, height: 40 },
      checkbox: { width: 30, height: 30 },
    };

    const dimensions = fieldDimensions[selectedFieldType as keyof typeof fieldDimensions] || { width: 200, height: 60 };

    const newField: Field = {
      id: `field-${Date.now()}`,
      field_type: selectedFieldType as any,
      x_position: Math.min(dragStart.x, x),
      y_position: Math.min(dragStart.y, y),
      width: dimensions.width,
      height: dimensions.height,
      page_number: 1,
      is_required: true,
      recipient_id: selectedRecipient,
    };

    onFieldsChange([...fields, newField]);
    setIsDragging(false);
    setDragStart(null);
  };

  const removeField = (fieldId: string) => {
    onFieldsChange(fields.filter(f => f.id !== fieldId));
  };

  const getFieldColor = (fieldType: string) => {
    return fieldTypes.find(f => f.type === fieldType)?.color || 'bg-gray-100 border-gray-400';
  };

  return (
    <div className="space-y-4 p-4">
      <div className="border-b pb-4">
        <h3 className="font-medium mb-3">Field Tools</h3>
        
        <div className="space-y-3">
          <div>
            <Label className="text-sm mb-2 block">Select Recipient</Label>
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedRecipient}
              onChange={(e) => setSelectedRecipient(e.target.value)}
            >
              {recipients.map((recipient) => (
                <option key={recipient.email} value={recipient.email}>
                  {recipient.name} ({recipient.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Select Field Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {fieldTypes.map(({ type, label, icon: Icon }) => (
                <Button
                  key={type}
                  variant={selectedFieldType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFieldType(type)}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm mb-2 block">
          Click and drag to place {selectedFieldType} field
        </Label>
        <div
          ref={pdfContainerRef}
          className="relative border-2 border-dashed rounded-lg bg-muted/30 cursor-crosshair"
          style={{ minHeight: '600px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* PDF would be rendered here using react-pdf or PDF.js */}
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="font-medium">PDF Preview Area</p>
              <p className="text-sm mt-1">Click and drag to place fields</p>
            </div>
          </div>

          {/* Render existing fields */}
          {fields.map((field) => (
            <div
              key={field.id}
              className={`absolute border-2 ${getFieldColor(field.field_type)} rounded cursor-move flex items-center justify-center text-xs font-medium`}
              style={{
                left: field.x_position,
                top: field.y_position,
                width: field.width,
                height: field.height,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Remove this field?')) {
                  removeField(field.id);
                }
              }}
            >
              {field.field_type}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {fields.length} field(s) added. Click on a field to remove it.
        </p>
      </div>
    </div>
  );
};
