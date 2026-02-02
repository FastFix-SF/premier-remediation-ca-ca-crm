import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddNewUserSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddNewUserSheet = ({ isOpen, onClose, onSuccess }: AddNewUserSheetProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sendInvite, setSendInvite] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    classCode: '',
  });

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: 'Missing Information',
        description: 'Please provide at least first and last name',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email) {
      toast({
        title: 'Email Required',
        description: 'Email address is required to send an invitation',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: formData.email,
          full_name: `${formData.firstName} ${formData.lastName}`,
          role: 'contributor',
        },
      });

      if (error) throw error;

      toast({
        title: 'User Added',
        description: sendInvite ? 'Invitation sent successfully' : 'User added successfully',
      });

      onSuccess();
      onClose();
      setFormData({ firstName: '', lastName: '', phone: '', email: '', classCode: '' });
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: 'Error',
        description: 'Failed to add user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">👋</span>
          </div>
          <DrawerTitle className="text-lg font-semibold">
            Add a new user
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-8 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <Label htmlFor="send-invite" className="text-base">Send an invite message</Label>
            <Switch 
              id="send-invite"
              checked={sendInvite}
              onCheckedChange={setSendInvite}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
                <Input
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
                  <span className="text-2xl">🇺🇸</span>
                  <span className="text-sm">+1</span>
                </div>
                <Input
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="flex-1"
                />
              </div>

              <Input
                type="email"
                placeholder="Email Address (optional)"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              {showMore && (
                <Input
                  placeholder="Class Code"
                  value={formData.classCode}
                  onChange={(e) => setFormData({ ...formData, classCode: e.target.value })}
                />
              )}

              <button
                onClick={() => setShowMore(!showMore)}
                className="text-blue-600 text-sm font-medium"
              >
                {showMore ? '- Show less' : '+ Show more'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-teal-500 hover:bg-teal-600"
            >
              {loading ? 'Adding...' : 'Add user'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
