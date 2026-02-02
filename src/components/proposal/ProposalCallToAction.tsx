import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  Phone, 
  Clock,
  AlertTriangle,
  FileText,
  ExternalLink
} from 'lucide-react';
import { type ProjectProposal } from '@/hooks/useProposalManagement';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { companyConfig } from '@/config/company';

interface ProposalCallToActionProps {
  proposal: ProjectProposal;
  onStatusUpdate: (status: string) => void;
}

export const ProposalCallToAction: React.FC<ProposalCallToActionProps> = ({
  proposal,
  onStatusUpdate
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [consultationDate, setConsultationDate] = useState<Date>();
  const [feedback, setFeedback] = useState('');
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  const isExpired = new Date(proposal.expires_at) < new Date();
  const daysUntilExpiry = Math.ceil((new Date(proposal.expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24));

  const handleAcceptProposal = async () => {
    setIsAccepting(true);
    try {
      await onStatusUpdate('accepted');
      toast.success('Proposal accepted successfully! We\'ll contact you within 24 hours to schedule your project.');
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error('Failed to accept proposal. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleScheduleConsultation = async () => {
    if (!consultationDate) {
      toast.error('Please select a consultation date');
      return;
    }

    try {
      await onStatusUpdate('negotiating');
      toast.success('Consultation request sent! We\'ll confirm your appointment shortly.');
    } catch (error) {
      console.error('Error scheduling consultation:', error);
      toast.error('Failed to schedule consultation. Please try again.');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast.error('Please provide your feedback');
      return;
    }

    try {
      // In a real implementation, this would save feedback to the database
      toast.success('Feedback submitted successfully. We\'ll review and get back to you.');
      setShowFeedbackDialog(false);
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    }
  };

  const getStatusMessage = () => {
    switch (proposal.status) {
      case 'accepted':
        return {
          title: 'Proposal Accepted',
          message: 'Thank you for accepting our proposal! We\'ll contact you within 24 hours to schedule your project.',
          variant: 'success' as const
        };
      case 'rejected':
        return {
          title: 'Proposal Declined',
          message: 'Thank you for your time. If you\'d like to discuss modifications, please contact us.',
          variant: 'destructive' as const
        };
      case 'negotiating':
        return {
          title: 'Under Review',
          message: 'We\'re reviewing your feedback and will get back to you soon with an updated proposal.',
          variant: 'secondary' as const
        };
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Ready to Get Started?</span>
          <div className="flex items-center gap-2">
            {isExpired ? (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Expired
              </Badge>
            ) : daysUntilExpiry <= 3 ? (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                Expires in {daysUntilExpiry} days
              </Badge>
            ) : (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                Valid until {format(new Date(proposal.expires_at), "MMM d, yyyy")}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Message */}
        {statusMessage && (
          <div className={cn(
            "p-4 rounded-lg border",
            statusMessage.variant === 'success' && "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
            statusMessage.variant === 'destructive' && "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
            statusMessage.variant === 'secondary' && "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
          )}>
            <h3 className="font-semibold mb-2">{statusMessage.title}</h3>
            <p className="text-sm">{statusMessage.message}</p>
          </div>
        )}

        {/* Proposal Actions */}
        {proposal.status === 'sent' && !isExpired && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">What would you like to do next?</h3>
              <p className="text-muted-foreground mb-6">
                Review our proposal and let us know how you'd like to proceed.
              </p>
            </div>

            <div className="grid gap-4">
              {/* Accept Proposal */}
              <Button 
                size="lg" 
                onClick={handleAcceptProposal}
                disabled={isAccepting}
                className="w-full h-auto p-6"
              >
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">Accept This Proposal</div>
                    <div className="text-sm opacity-90">Ready to move forward with this option</div>
                  </div>
                </div>
              </Button>

              {/* Schedule Consultation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="h-auto p-6"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        <div>
                          <div className="font-semibold">Schedule Consultation</div>
                          <div className="text-sm text-muted-foreground">
                            {consultationDate ? format(consultationDate, "MMM d, yyyy") : "Pick a date"}
                          </div>
                        </div>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={consultationDate}
                      onSelect={setConsultationDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                    {consultationDate && (
                      <div className="p-3 border-t">
                        <Button 
                          onClick={handleScheduleConsultation}
                          className="w-full"
                        >
                          Request Consultation
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Request Changes */}
                <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="h-auto p-6"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        <div>
                          <div className="font-semibold">Request Changes</div>
                          <div className="text-sm text-muted-foreground">Need modifications?</div>
                        </div>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Changes to Proposal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Let us know what you'd like to change about this proposal. 
                          We'll review your feedback and provide an updated quote.
                        </p>
                        <Textarea
                          placeholder="Tell us about any changes you'd like to see in materials, pricing, timeline, etc."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSubmitFeedback}>
                          Submit Feedback
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Questions? Let's Talk</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" asChild>
              <a href={`tel:${companyConfig.phoneRaw}`} className="flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" />
                Call Us: {companyConfig.phone}
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a 
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=sebastian@roofingfriend.com&su=${encodeURIComponent(`Proposal Response - ${proposal.property_address}`)}&body=${encodeURIComponent(`Hi Sebastian,\n\nI have reviewed the roofing proposal for ${proposal.property_address} and would like to accept this quote.\n\nProposal Details:\n- Project: ${proposal.project_type}\n- Address: ${proposal.property_address}\n- Proposal Number: ${proposal.proposal_number}\n\nPlease contact me at your earliest convenience to schedule the next steps.\n\nThank you,\n${proposal.client_name}`)}`}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                📧 Accept via Email
              </a>
            </Button>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <Button variant="ghost" size="sm" asChild>
              <a href="/about" target="_blank" className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                About Our Company
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/projects" target="_blank" className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                View Past Projects
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/contact" target="_blank" className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                Contact Information
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};