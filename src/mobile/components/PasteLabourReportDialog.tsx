import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardPaste, Search, Plus, Loader2, FileText, Upload, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { extractPdfText } from '@/utils/extractPdfText';

interface ParsedItem {
  id: string;
  qty: number;
  unit: string;
  description: string;
  formatted: string;
  selected: boolean;
}

interface PasteLabourReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

// Parse labor report text into structured items
function parseLabourReport(rawText: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  
  // Skip section headers and total lines
  const skipPatterns = [
    /^(All Project Labor|Roof removal Labor|Standing Seam Labor|Sheet Metal Labor|Guters and spouts Labor)/i,
    /^(Labor Total|Total Labor Cost):/i,
    /^Qty\s+Unit/i, // Header row
  ];
  
  // Main pattern to extract: qty, unit, price, description, total
  // Pattern: "3.0 Count $125.00 Flash Existing 2x4 Skylight up to 4x4 $375.00"
  const linePattern = /^(\d+\.?\d*)\s+(Count|Sq\.?|Ft\.?|LF|SF|EA)\s+\$[\d.,]+\s+(.+?)\s+\$[\d.,]+$/i;
  
  // Split into lines and process
  const lines = rawText.split(/\n/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Skip headers and totals
    if (skipPatterns.some(pattern => pattern.test(line))) continue;
    
    const match = line.match(linePattern);
    if (match) {
      const qty = parseFloat(match[1]);
      const unit = match[2];
      let description = match[3].trim();
      
      // Check if next line is a continuation (doesn't start with a number)
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.match(/^\d/) && !skipPatterns.some(p => p.test(nextLine))) {
          // This might be a continuation - check if it doesn't match our pattern
          if (!nextLine.match(linePattern)) {
            description += ' ' + nextLine;
            i++; // Skip the next line since we've consumed it
          }
        }
      }
      
      // Format quantity - remove decimal if whole number
      const qtyFormatted = qty % 1 === 0 ? qty.toString() : qty.toFixed(1);
      const formatted = `${qtyFormatted} ${description}`;
      
      items.push({
        id: `item-${items.length}-${Date.now()}`,
        qty,
        unit,
        description,
        formatted,
        selected: true,
      });
    }
  }
  
  return items;
}

// Alternative parser that handles the raw copy-paste format better
function parseLabourReportFlexible(rawText: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const seen = new Set<string>();
  
  // Skip patterns
  const skipPatterns = [
    /Labor Total:/i,
    /Total Labor Cost:/i,
    /^Qty\s+Unit/i,
    /^\$/,
  ];
  
  // Match pattern: number, unit type, price, description, final price
  // This regex handles the messy format better
  const regex = /(\d+\.?\d*)\s+(Count|Sq\.?|Ft\.?|LF|SF|EA)\s+\$[\d.,]+\s+(.+?)(?=\s+\$[\d.,]+(?:\s|$)|\s+\d+\.?\d*\s+(?:Count|Sq|Ft|LF|SF|EA)|$)/gi;
  
  let match;
  while ((match = regex.exec(rawText)) !== null) {
    const qty = parseFloat(match[1]);
    const unit = match[2];
    let description = match[3].trim();
    
    // Clean up description - remove trailing prices or partial matches
    description = description.replace(/\s+\$[\d.,]+$/, '').trim();
    
    // Skip if description is empty or looks like a header
    if (!description || skipPatterns.some(p => p.test(description))) continue;
    
    // Create unique key to avoid duplicates
    const key = `${qty}-${description.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    
    // Format quantity
    const qtyFormatted = qty % 1 === 0 ? qty.toString() : qty.toFixed(1);
    const formatted = `${qtyFormatted} ${description}`;
    
    items.push({
      id: `item-${items.length}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      qty,
      unit,
      description,
      formatted,
      selected: true,
    });
  }
  
  return items;
}

export const PasteLabourReportDialog: React.FC<PasteLabourReportDialogProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Mode: 'select' = initial choice, 'paste' = text input, 'upload' = PDF upload
  const [mode, setMode] = useState<'select' | 'paste' | 'upload'>('select');
  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const handleParse = () => {
    const items = parseLabourReportFlexible(rawText);
    setParsedItems(items);
    setIsParsed(true);
    
    if (items.length === 0) {
      toast({
        title: 'No items found',
        description: 'Could not parse any labor items from the text. Please check the format.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: `Found ${items.length} items`,
        description: 'Review and select items to add to the scope.',
      });
    }
  };
  
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Step 1: Extract text from PDF
      setIsExtracting(true);
      console.log('[PasteLabourReportDialog] Extracting text from PDF:', file.name);
      const extractedText = await extractPdfText(file);
      console.log('[PasteLabourReportDialog] Extracted text length:', extractedText.length);
      setIsExtracting(false);
      
      if (!extractedText.trim()) {
        toast({
          title: 'Empty PDF',
          description: 'Could not extract any text from the PDF. Try the paste method instead.',
          variant: 'destructive',
        });
        return;
      }
      
      // Step 2: Parse with AI
      setIsParsing(true);
      console.log('[PasteLabourReportDialog] Calling AI to parse labor items...');
      
      const { data, error } = await supabase.functions.invoke('parse-labor-pdf', {
        body: { rawText: extractedText }
      });
      
      if (error) {
        console.error('[PasteLabourReportDialog] AI parsing error:', error);
        throw new Error(error.message || 'Failed to parse labor report');
      }
      
      const aiItems = data?.items || [];
      console.log('[PasteLabourReportDialog] AI returned items:', aiItems.length);
      
      if (aiItems.length === 0) {
        toast({
          title: 'No items found',
          description: 'AI could not find any labor items in the PDF. Try the paste method instead.',
          variant: 'destructive',
        });
        setIsParsing(false);
        return;
      }
      
      // Convert AI items to our format
      const parsedItems: ParsedItem[] = aiItems.map((item: any, index: number) => {
        const qty = item.qty || 1;
        const qtyFormatted = qty % 1 === 0 ? qty.toString() : qty.toFixed(1);
        return {
          id: `ai-item-${index}-${Date.now()}`,
          qty,
          unit: item.unit || 'Count',
          description: item.description,
          formatted: `${qtyFormatted} ${item.description}`,
          selected: true,
        };
      });
      
      setParsedItems(parsedItems);
      setIsParsed(true);
      setIsParsing(false);
      
      toast({
        title: `Found ${parsedItems.length} items! ✨`,
        description: 'AI successfully parsed the labor report. Review and select items.',
      });
      
    } catch (error: any) {
      console.error('[PasteLabourReportDialog] Error processing PDF:', error);
      setIsExtracting(false);
      setIsParsing(false);
      
      // Handle specific error codes
      if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        toast({
          title: 'Please wait',
          description: 'Rate limit exceeded. Try again in a moment.',
          variant: 'destructive',
        });
      } else if (error.message?.includes('402') || error.message?.includes('credits')) {
        toast({
          title: 'AI credits exhausted',
          description: 'Try the paste method instead.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Could not read PDF',
          description: 'Try a different file or use the paste method instead.',
          variant: 'destructive',
        });
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleToggleItem = (itemId: string) => {
    setParsedItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };
  
  const handleSelectAll = () => {
    const allSelected = parsedItems.every(item => item.selected);
    setParsedItems(items =>
      items.map(item => ({ ...item, selected: !allSelected }))
    );
  };
  
  const handleAddToScope = async () => {
    if (!user) return;
    
    const selectedItems = parsedItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select at least one item to add.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const inserts = selectedItems.map(item => ({
        project_id: projectId,
        user_id: user.id,
        notes: item.formatted,
        status: 'note',
        is_completed: false,
      }));
      
      const { error } = await supabase
        .from('project_status_updates')
        .insert(inserts);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['mobile-project-status-updates', projectId] });
      
      toast({
        title: `Added ${selectedItems.length} items! ✓`,
        description: 'Labor report items have been added to the scope.',
      });
      
      handleClose();
    } catch (error) {
      console.error('Failed to add items:', error);
      toast({
        title: 'Oops!',
        description: 'Failed to add items. Try again!',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    setRawText('');
    setParsedItems([]);
    setIsParsed(false);
    setMode('select');
    setIsExtracting(false);
    setIsParsing(false);
    onClose();
  };
  
  const handleBack = () => {
    if (isParsed) {
      setIsParsed(false);
      setParsedItems([]);
    } else {
      setMode('select');
      setRawText('');
    }
  };
  
  const selectedCount = parsedItems.filter(item => item.selected).length;
  
  // Determine dialog title and icon based on mode
  const getHeaderContent = () => {
    if (mode === 'select') {
      return {
        icon: <ClipboardPaste className="w-5 h-5 text-white" />,
        title: 'Import Labor Report',
        description: 'Choose how to import your labor report data',
      };
    }
    if (mode === 'upload') {
      return {
        icon: <FileText className="w-5 h-5 text-white" />,
        title: 'Upload PDF',
        description: 'Select a labor report PDF file',
      };
    }
    return {
      icon: <ClipboardPaste className="w-5 h-5 text-white" />,
      title: 'Paste Labor Report',
      description: 'Paste labor report data to extract scope items',
    };
  };
  
  const header = getHeaderContent();
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
              {header.icon}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{header.title}</DialogTitle>
              <DialogDescription className="text-xs">
                {header.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Mode Selection */}
          {mode === 'select' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                How would you like to import?
              </p>
              
              <Button
                variant="outline"
                onClick={() => setMode('paste')}
                className="w-full h-auto p-4 flex items-start gap-4 rounded-xl border-2 border-border/50 hover:border-blue-400/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <ClipboardPaste className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Paste Text</p>
                  <p className="text-xs text-muted-foreground">Copy from document & paste</p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setMode('upload')}
                className="w-full h-auto p-4 flex items-start gap-4 rounded-xl border-2 border-border/50 hover:border-cyan-400/50 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Upload PDF</p>
                  <p className="text-xs text-muted-foreground">AI-powered parsing (recommended)</p>
                </div>
              </Button>
            </div>
          )}
          
          {/* Paste Text Mode */}
          {mode === 'paste' && !isParsed && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Paste your labor report data:
                </label>
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="3.0 Count $125.00 Flash Existing 2x4 Skylight up to 4x4 $375.00..."
                  className="min-h-[200px] resize-none rounded-xl border-2 border-border/50 focus:border-blue-400/50 bg-muted/30 text-sm font-mono"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="rounded-xl gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleParse}
                  disabled={!rawText.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white gap-2"
                >
                  <Search className="h-4 w-4" />
                  Parse & Preview
                </Button>
              </div>
            </>
          )}
          
          {/* Upload PDF Mode */}
          {mode === 'upload' && !isParsed && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
              
              {isExtracting || isParsing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      {isExtracting ? 'Extracting text...' : 'Parsing with AI...'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isExtracting ? 'Reading your PDF file' : 'Finding labor items'}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      const file = files[0];
                      if (file.type === 'application/pdf') {
                        // Trigger the same handler as file input
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        if (fileInputRef.current) {
                          fileInputRef.current.files = dataTransfer.files;
                          fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                      } else {
                        toast({
                          title: 'Invalid file type',
                          description: 'Please drop a PDF file.',
                          variant: 'destructive',
                        });
                      }
                    }
                  }}
                  className={`flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                    isDragOver 
                      ? 'border-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/30 scale-[1.02]' 
                      : 'border-border/50 hover:border-cyan-400/50 hover:bg-cyan-50/30 dark:hover:bg-cyan-950/10'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                    isDragOver 
                      ? 'bg-gradient-to-br from-cyan-200 to-blue-200 dark:from-cyan-800/50 dark:to-blue-800/50 scale-110' 
                      : 'bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30'
                  }`}>
                    <Upload className={`w-8 h-8 transition-all ${isDragOver ? 'text-cyan-700 dark:text-cyan-300' : 'text-cyan-600 dark:text-cyan-400'}`} />
                  </div>
                  <p className="font-medium text-foreground">
                    {isDragOver ? 'Drop PDF here' : 'Tap to select PDF'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                </div>
              )}
              
              {!isExtracting && !isParsing && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="w-full rounded-xl gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </>
          )}
          
          {/* Preview & Select (shared by both flows) */}
          {isParsed && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {parsedItems.length} items found
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {parsedItems.every(item => item.selected) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {parsedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      item.selected
                        ? 'border-blue-400/50 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-border/50 bg-muted/30'
                    }`}
                  >
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => handleToggleItem(item.id)}
                      className="mt-0.5 h-5 w-5 rounded-md border-2 border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <p className={`text-sm leading-relaxed flex-1 ${
                      item.selected ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {item.formatted}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 rounded-xl gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleAddToScope}
                  disabled={selectedCount === 0 || isSubmitting}
                  className="flex-1 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add {selectedCount} to Scope
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
