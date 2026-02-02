import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CheckCircle, 
  MessageCircle, 
  Phone, 
  Calendar,
  Download,
  Share2,
  Clock,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionsProps {
  proposal: any;
  onAccept?: () => void;
  onSchedule?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  isClientView?: boolean;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  proposal,
  onAccept,
  onSchedule,
  onShare,
  onExport,
  isClientView = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);

  const totalPrice = proposal?.pricing_items?.reduce((sum: number, item: any) => 
    sum + (item.is_optional ? 0 : item.total_price), 0
  ) || 0;

  if (!isClientView) {
    return (
      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        <Button 
          onClick={onShare}
          className="shadow-lg hover:shadow-xl transition-all"
          size="sm"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        
        <Button 
          onClick={onExport}
          variant="outline"
          className="shadow-lg hover:shadow-xl transition-all block w-full"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>
    );
  }

  return (
    <>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Get In Touch</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Call Direct</p>
                    <p className="text-muted-foreground">(555) 123-ROOF</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Live Chat</p>
                    <p className="text-muted-foreground">Available 8 AM - 6 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Schedule Consultation</p>
                    <p className="text-muted-foreground">Free on-site evaluation</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center pt-4">
              <Button onClick={onAccept} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Ready to Proceed? Accept Proposal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};