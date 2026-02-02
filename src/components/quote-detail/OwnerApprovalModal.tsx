import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface OwnerApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (signatureDataUrl: string) => Promise<void>;
  quoteName: string;
}

export const OwnerApprovalModal: React.FC<OwnerApprovalModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  quoteName,
}) => {
  const sigPad = useRef<SignatureCanvas>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClear = () => {
    sigPad.current?.clear();
  };

  const handleApprove = async () => {
    if (sigPad.current?.isEmpty()) {
      toast.error('Please provide your signature');
      return;
    }

    setIsSubmitting(true);
    try {
      const signatureDataUrl = sigPad.current?.toDataURL();
      if (signatureDataUrl) {
        await onApprove(signatureDataUrl);
        onClose();
      }
    } catch (error) {
      console.error('Error approving quote:', error);
      toast.error('Failed to approve quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Owner Approval Required</DialogTitle>
          <DialogDescription>
            By signing below, you approve quote "{quoteName}" and mark it as ready to send as a proposal to the client.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border-2 border-border rounded-lg overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigPad}
              canvasProps={{
                className: 'w-full h-48 cursor-crosshair',
              }}
              backgroundColor="#ffffff"
              penColor="#000000"
            />
          </div>
          
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Sign above to approve</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              Clear Signature
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={isSubmitting}>
            {isSubmitting ? 'Approving...' : 'Approve & Mark Ready'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
