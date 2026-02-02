import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Users, Layout, Send, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SignatureRecipientManager } from './SignatureRecipientManager';
import { SignatureFieldEditor } from './SignatureFieldEditor';
import type { EnvelopeRecipient } from '@/types/signature';
import { supabase } from '@/integrations/supabase/client';
import { downloadPDFWithImages } from '@/utils/pdfWithImages';

interface SignatureEnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractUrl: string;
  proposalId?: string;
  clientEmail: string;
  clientName: string;
}

export const SignatureEnvelopeModal: React.FC<SignatureEnvelopeModalProps> = ({
  isOpen,
  onClose,
  contractUrl,
  proposalId,
  clientEmail,
  clientName,
}) => {
  const [currentTab, setCurrentTab] = useState('document');
  const [subject, setSubject] = useState(
    clientName ? `Signature Request: Agreement for ${clientName}` : 'Signature Request: Agreement'
  );
  const [message, setMessage] = useState('Please review and sign the attached agreement.');
  
  // Initialize recipients - only add initial recipient if email is provided
  const [recipients, setRecipients] = useState<Partial<EnvelopeRecipient>[]>(() => {
    if (clientEmail && clientEmail.trim() !== '') {
      return [{
        name: clientName || '',
        email: clientEmail,
        role: 'signer',
        signing_order: 1,
        status: 'pending',
      }];
    }
    return [];
  });
  
  const [fields, setFields] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Load draft on mount
  useEffect(() => {
    if (!proposalId || draftLoaded) return;

    const loadDraft = async () => {
      try {
        console.log('[Envelope Draft] Loading draft for proposal:', proposalId);
        const { data, error } = await supabase
          .from('envelope_drafts')
          .select('*')
          .eq('proposal_id', proposalId)
          .maybeSingle();

        if (error) {
          console.error('[Envelope Draft] Error loading draft:', error);
          return;
        }

        if (data) {
          console.log('[Envelope Draft] Draft loaded:', {
            recipientsCount: Array.isArray(data.recipients) ? data.recipients.length : 0,
            fieldsCount: Array.isArray(data.fields) ? data.fields.length : 0,
            hasImageFields: Array.isArray(data.fields) ? (data.fields as any[]).some(f => f.field_type === 'image') : false
          });
          setSubject(data.subject || subject);
          setMessage(data.message || message);
          setRecipients((data.recipients as Partial<EnvelopeRecipient>[]) || recipients);
          setFields((data.fields as any[]) || []);
        } else {
          console.log('[Envelope Draft] No draft found for this proposal');
        }
      } catch (error) {
        console.error('[Envelope Draft] Error loading draft:', error);
      } finally {
        setDraftLoaded(true);
      }
    };

    loadDraft();
  }, [proposalId, draftLoaded]);

  // Auto-save draft (debounced)
  useEffect(() => {
    if (!proposalId || !draftLoaded) return;

    const timeoutId = setTimeout(async () => {
      try {
        console.log('[Envelope Draft] Auto-saving draft:', { proposalId, fieldsCount: fields.length });
        const { error } = await supabase
          .from('envelope_drafts')
          .upsert({
            proposal_id: proposalId,
            subject,
            message,
            recipients,
            fields,
          }, {
            onConflict: 'proposal_id'
          });

        if (error) {
          console.error('[Envelope Draft] Error saving draft:', error);
        } else {
          console.log('[Envelope Draft] Draft saved successfully');
        }
      } catch (error) {
        console.error('[Envelope Draft] Error saving draft:', error);
      }
    }, 500); // Reduced debounce to 500ms for faster saves

    return () => clearTimeout(timeoutId);
  }, [proposalId, subject, message, recipients, fields, draftLoaded]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (proposalId && draftLoaded) {
        supabase
          .from('envelope_drafts')
          .upsert({
            proposal_id: proposalId,
            subject,
            message,
            recipients,
            fields,
          }, {
            onConflict: 'proposal_id'
          })
          .then(({ error }) => {
            if (error) console.error('[Envelope Draft] Error saving on unmount:', error);
          });
      }
    };
  }, [proposalId, subject, message, recipients, fields, draftLoaded]);

  const handleAddRecipient = () => {
    setRecipients([
      ...recipients,
      {
        name: '',
        email: '',
        role: 'signer',
        signing_order: recipients.length + 1,
        status: 'pending',
      },
    ]);
  };

  const handleUpdateRecipient = (index: number, updates: Partial<EnvelopeRecipient>) => {
    const newRecipients = [...recipients];
    newRecipients[index] = { ...newRecipients[index], ...updates };
    setRecipients(newRecipients);
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleDownloadWithImages = async () => {
    setIsLoading(true);
    try {
      // Get only image fields
      const imageFields = fields.filter(f => f.field_type === 'image' && f.image_url);
      
      if (imageFields.length === 0) {
        toast({
          title: 'No Images',
          description: 'There are no images to embed in the PDF.',
          variant: 'destructive',
        });
        return;
      }

      await downloadPDFWithImages(
        contractUrl,
        imageFields,
        `contract-${clientName || 'agreement'}-edited.pdf`
      );

      toast({
        title: 'Downloaded!',
        description: 'Contract with embedded images has been downloaded.',
      });
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download PDF with images.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEnvelope = async () => {
    console.log('[Signature Envelope] Attempting to send via DocuSign, URL:', contractUrl);
    
    // Validate recipients
    const invalidRecipients = recipients.filter(r => !r.name || !r.email);
    if (invalidRecipients.length > 0) {
      toast({
        title: 'Invalid Recipients',
        description: 'Please fill in all recipient details.',
        variant: 'destructive',
      });
      return;
    }

    // Validate fields
    if (fields.length === 0) {
      toast({
        title: 'No Fields',
        description: 'Please add at least one signature field.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Signature Envelope] Sending envelope via DocuSign:', {
        subject,
        message,
        recipients,
        fields,
        contractUrl,
      });

      const { data, error } = await supabase.functions.invoke('docusign-send', {
        body: {
          documentUrl: contractUrl,
          documentName: 'Contract Agreement',
          recipients: recipients.map(r => ({
            name: r.name,
            email: r.email,
            role: r.role,
            signing_order: r.signing_order,
          })),
          fields: fields,
          emailSubject: subject,
          emailMessage: message,
          proposalId: proposalId,
        },
      });

      if (error) {
        console.error('[DocuSign] Edge function error:', error);
        throw new Error(error.message || 'Failed to communicate with DocuSign service');
      }

      if (data?.error) {
        console.error('[DocuSign] API error:', data.error);
        throw new Error(data.error);
      }

      console.log('[Signature Envelope] DocuSign envelope created:', data);

      toast({
        title: 'Sent via DocuSign!',
        description: `Envelope ID: ${data.envelopeId}. The signature request has been sent to all recipients.`,
      });
      onClose();
    } catch (error: any) {
      console.error('[Signature Envelope] Error sending envelope:', error);
      
      let errorMessage = error.message || 'Failed to send signature request via DocuSign.';
      let errorTitle = 'DocuSign Error';
      
      // Provide specific error messages based on error type
      if (errorMessage.includes('base64') || errorMessage.includes('decode')) {
        errorTitle = 'Private Key Format Error';
        errorMessage = 'The DocuSign private key is not properly formatted. Please verify the DOCUSIGN_PRIVATE_KEY secret contains a valid PKCS#8 key.';
      } else if (errorMessage.includes('PKCS')) {
        errorTitle = 'Key Format Issue';
        errorMessage = errorMessage; // Use the detailed message from the edge function
      } else if (errorMessage.includes('JWT generation')) {
        errorTitle = 'Authentication Failed';
        errorMessage = 'Failed to authenticate with DocuSign. Please verify your Integration Key, User ID, and Private Key are correct.';
      } else if (errorMessage.includes('empty')) {
        errorTitle = 'Missing Private Key';
        errorMessage = 'The DocuSign private key is empty or invalid. Please configure the DOCUSIGN_PRIVATE_KEY secret.';
      } else if (errorMessage.includes('Missing DocuSign credentials')) {
        errorTitle = 'Configuration Required';
        errorMessage = 'DocuSign integration is not configured. Please set up all required DocuSign secrets.';
      } else if (errorMessage.includes('Failed to download document')) {
        errorTitle = 'Document Access Error';
        errorMessage = 'Could not access the contract document. Please ensure the document is properly uploaded.';
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Send for Signature</DialogTitle>
          <DialogDescription>
            Configure recipients and signature fields for this contract
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col">
          <div className="bg-muted/50 rounded-xl p-1.5 inline-flex">
            <TabsList variant="segmented">
              <TabsTrigger variant="segmented" value="document" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Document
              </TabsTrigger>
              <TabsTrigger variant="segmented" value="recipients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recipients
              </TabsTrigger>
              <TabsTrigger variant="segmented" value="fields" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Fields
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="document" className="space-y-4 m-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Email Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter a message for recipients"
                    rows={4}
                  />
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Document</h4>
                  <p className="text-sm text-muted-foreground">
                    Contract Agreement PDF
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recipients" className="m-0">
              <SignatureRecipientManager
                recipients={recipients}
                onAddRecipient={handleAddRecipient}
                onUpdateRecipient={handleUpdateRecipient}
                onRemoveRecipient={handleRemoveRecipient}
              />
            </TabsContent>

            <TabsContent value="fields" className="m-0">
              <SignatureFieldEditor
                documentUrl={contractUrl}
                recipients={recipients}
                fields={fields}
                onFieldsChange={setFields}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {currentTab === 'fields' && fields.some(f => f.field_type === 'image' && f.image_url) && (
              <Button 
                variant="outline" 
                onClick={handleDownloadWithImages} 
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            {currentTab === 'document' && (
              <Button onClick={() => setCurrentTab('recipients')}>
                Next: Recipients
              </Button>
            )}
            {currentTab === 'recipients' && (
              <Button onClick={() => setCurrentTab('fields')}>
                Next: Add Fields
              </Button>
            )}
            {currentTab === 'fields' && (
              <Button onClick={handleSendEnvelope} disabled={isLoading}>
                <Send className="h-4 w-4 mr-2" />
                Send for Signature
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
