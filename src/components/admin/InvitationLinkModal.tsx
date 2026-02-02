import React, { useState } from 'react';
import { Copy, Check, Mail, Share } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface InvitationLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitationData: {
    url: string;
    email: string;
    name: string;
    role: string;
    expiresAt: string;
  };
}

export const InvitationLinkModal: React.FC<InvitationLinkModalProps> = ({
  isOpen,
  onClose,
  invitationData
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationData.url);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Invitation link has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link. Please select and copy manually.",
        variant: "destructive",
      });
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Invitation to join Roofing Friend Admin`);
    const body = encodeURIComponent(
      `Hi ${invitationData.name},\n\n` +
      `You've been invited to join the Roofing Friend admin team as a ${invitationData.role}.\n\n` +
      `Please click the link below to accept your invitation:\n` +
      `${invitationData.url}\n\n` +
      `This invitation will expire on ${new Date(invitationData.expiresAt).toLocaleDateString()} for security purposes.\n\n` +
      `Best regards,\nRoofing Friend Team`
    );
    window.open(`mailto:${invitationData.email}?subject=${subject}&body=${body}`);
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="w-5 h-5" />
            Invitation Link Generated
          </DialogTitle>
          <DialogDescription>
            Share this link with {invitationData.name} to complete their team invitation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invitation Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Invitation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{invitationData.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{invitationData.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="font-medium capitalize">{invitationData.role}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expires</Label>
                  <p className="font-medium">{formatExpiryDate(invitationData.expiresAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invitation Link */}
          <div className="space-y-3">
            <Label htmlFor="invitation-link">Invitation Link</Label>
            <div className="flex gap-2">
              <Input
                id="invitation-link"
                value={invitationData.url}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleEmailShare}
              className="flex-1"
              variant="outline"
            >
              <Mail className="w-4 h-4 mr-2" />
              Open in Email
            </Button>
            <Button
              onClick={handleCopyLink}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>

          {/* Instructions */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Share the invitation link with {invitationData.name} via your preferred method</p>
              <p>2. They'll use the link to create their account and set a password</p>
              <p>3. Once completed, they'll have {invitationData.role} access to the admin dashboard</p>
              <p className="text-amber-600">⚠️ This link expires in 7 days for security purposes</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};