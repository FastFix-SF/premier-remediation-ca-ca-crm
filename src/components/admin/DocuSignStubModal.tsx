import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DocuSignStubModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: string;
  contractUrl?: string;
}

export const DocuSignStubModal: React.FC<DocuSignStubModalProps> = ({
  isOpen,
  onClose,
  proposalId,
  contractUrl,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');

  const handleSendToDocuSign = () => {
    // This is a stub for future DocuSign integration
    toast({
      title: 'DocuSign Integration Coming Soon',
      description: `We'll send ${contractUrl || 'the contract'} to ${recipientEmail} once DocuSign is integrated.`,
    });
    
    // TODO: Save recipient email to proposal metadata for future use
    console.log('DocuSign stub:', { proposalId, recipientEmail, contractUrl });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send to DocuSign
          </DialogTitle>
          <DialogDescription>
            DocuSign integration is coming soon. Enter the recipient's email address to prepare for sending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient-email">Recipient Email</Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="customer@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>What happens next:</strong><br />
              Once DocuSign integration is complete, the contract will be sent electronically 
              for signature. You'll receive notifications when the contract is viewed and signed.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendToDocuSign}
            disabled={!recipientEmail || !recipientEmail.includes('@')}
          >
            Prepare for DocuSign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
