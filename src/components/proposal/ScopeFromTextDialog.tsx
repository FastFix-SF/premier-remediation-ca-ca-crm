import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Sparkles, Check, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScopeFromTextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScopeGenerated: (scope: string) => void;
}

export const ScopeFromTextDialog: React.FC<ScopeFromTextDialogProps> = ({
  open,
  onOpenChange,
  onScopeGenerated,
}) => {
  const [rawText, setRawText] = useState('');
  const [generatedScope, setGeneratedScope] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!rawText.trim()) {
      toast({
        title: 'No text provided',
        description: 'Please paste your quote or invoice data first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedScope('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-scope-of-work', {
        body: { rawText: rawText.trim() },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate scope');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.scopeOfWork) {
        setGeneratedScope(data.scopeOfWork);
        toast({
          title: 'Scope generated',
          description: 'Review the generated scope below and click "Use This Scope" to apply it.',
        });
      }
    } catch (error) {
      console.error('Error generating scope:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate scope of work',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseScope = () => {
    onScopeGenerated(generatedScope);
    onOpenChange(false);
    setRawText('');
    setGeneratedScope('');
    toast({
      title: 'Scope applied',
      description: 'The generated scope has been added to your proposal.',
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setRawText('');
    setGeneratedScope('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Scope from Text
          </DialogTitle>
          <DialogDescription>
            Paste your raw quote or invoice data below and AI will format it into a professional scope of work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Raw Text Input */}
          <div className="space-y-2">
            <Label htmlFor="raw-text" className="text-sm font-medium">
              Paste your quote/invoice data:
            </Label>
            <Textarea
              id="raw-text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Example:
Qty Unit Description
Roof removal
39.5 Sq. Remove and Haul away Existing flat roof
Low Slope
39.5 Sq. Apply one layer of CertainTeed SA Flintlastic...`}
              className="min-h-[150px] font-mono text-xs"
              disabled={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !rawText.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Scope of Work
              </>
            )}
          </Button>

          {/* Generated Preview */}
          {generatedScope && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Generated Scope Preview:
                </Label>
                <div className="p-3 bg-muted rounded-lg max-h-[250px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs font-mono">
                    {generatedScope}
                  </pre>
                </div>
                <Button
                  onClick={handleUseScope}
                  className="w-full"
                  variant="default"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Use This Scope
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
