import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Sparkles, QrCode, MapPin, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SelectedProject {
  id: string;
  name: string;
  address: string;
  description?: string;
  project_type?: string;
  roof_type?: string;
}

interface AIReviewQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProject?: SelectedProject | null;
}

export const AIReviewQRModal: React.FC<AIReviewQRModalProps> = ({ 
  isOpen, 
  onClose,
  selectedProject 
}) => {
  // Generate QR code URL with project info
  const qrCodeUrl = useMemo(() => {
    if (!selectedProject) return '/ai-review-qr.png';
    
    // Create a customer review URL with project ID
    const baseUrl = window.location.origin;
    const reviewUrl = `${baseUrl}/customer-review/${selectedProject.id}`;
    
    // Use QR code API to generate dynamic QR
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(reviewUrl)}&bgcolor=ffffff&color=000000&margin=10`;
  }, [selectedProject]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
        <DialogHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-full">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Review Assistant
          </DialogTitle>
          
          {selectedProject ? (
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-center gap-2 text-foreground font-medium">
                <Building className="w-4 h-4 text-primary" />
                <span>{selectedProject.name}</span>
              </div>
              {selectedProject.address && (
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedProject.address}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Scan to leave a Google or Yelp review in under 1 minute
            </p>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {/* QR Code Container */}
          <div className="flex justify-center">
            <div className="relative p-4 bg-white rounded-2xl shadow-lg border-2 border-dashed border-primary/30">
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-primary rounded-full animate-pulse" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
              
              <img 
                src={qrCodeUrl} 
                alt="AI Review QR Code" 
                className="w-48 h-48 mx-auto"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center space-x-2 text-sm font-medium text-foreground">
              <QrCode className="w-4 h-4 text-primary" />
              <span>Point your camera at the QR code</span>
            </div>
            
            <div className="flex items-center justify-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-accent text-accent animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Your feedback helps us serve you better
            </p>
          </div>

          {/* Action Button */}
          <Button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
