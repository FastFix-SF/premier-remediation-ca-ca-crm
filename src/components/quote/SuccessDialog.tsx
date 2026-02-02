import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowDown, X } from 'lucide-react';

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerName?: string;
}

export function SuccessDialog({ isOpen, onClose, customerName }: SuccessDialogProps) {
  const scrollToHowItWorks = () => {
    const howItWorksSection = document.querySelector('#how-it-works');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: 'smooth' });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <DialogTitle className="text-xl font-semibold">
                Thanks{customerName ? `, ${customerName}` : ''}! Your quote request is in.
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              We'll analyze your roof with aerial imagery and send a detailed proposal. 
              A specialist may text if we need a quick photo.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">What happens next:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>Our AI analyzes your property using satellite imagery</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>We calculate precise measurements and material requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span>You'll receive a detailed proposal within 24 hours</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={scrollToHowItWorks}
              variant="outline"
              className="flex-1"
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              View Next Steps
            </Button>
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Questions? Call us at{' '}
              <a href="tel:+1-555-ROOFING" className="text-primary hover:underline font-medium">
                (555) ROOFING
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}