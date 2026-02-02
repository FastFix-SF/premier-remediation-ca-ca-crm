import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InviteLinkSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteLinkSheet = ({ isOpen, onClose }: InviteLinkSheetProps) => {
  const { toast } = useToast();
  const inviteLink = `${window.location.origin}/invite`;

  const handleShareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join our team',
          text: 'You have been invited to join our team!',
          url: inviteLink,
        });
      } else {
        await navigator.clipboard.writeText(inviteLink);
        toast({
          title: 'Link Copied',
          description: 'Invite link copied to clipboard',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: 'Link Copied',
        description: 'Invite link copied to clipboard',
      });
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LinkIcon className="w-10 h-10 text-blue-600" />
          </div>
          <DrawerTitle className="text-lg font-semibold mb-2">
            General link
          </DrawerTitle>
          <p className="text-sm text-muted-foreground">
            Share this link with people so they can request to join the app. All requests will be pending an admin's approval
          </p>
        </DrawerHeader>
        
        <div className="px-4 pb-8 space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm truncate">{inviteLink}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleCopyLink}
            >
              Preview
            </Button>
            <Button
              onClick={handleShareLink}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Share link
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
