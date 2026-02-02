import React, { useState } from 'react';
import { ChevronLeft, User, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface MobileAddCustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (customer: { id: string; name: string }) => void;
}

export const MobileAddCustomerSheet: React.FC<MobileAddCustomerSheetProps> = ({
  open,
  onOpenChange,
  onCustomerCreated,
}) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    first_name: '',
    last_name: '',
    phone: '',
    cell: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.company && !formData.first_name && !formData.last_name) {
      toast.error('Please enter a company name or contact name');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('directory_contacts')
        .insert({
          contact_type: 'customer',
          company: formData.company || null,
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          contact_name: formData.first_name && formData.last_name 
            ? `${formData.first_name} ${formData.last_name}` 
            : null,
          phone: formData.phone || null,
          cell: formData.cell || null,
          email: formData.email || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip: formData.zip || null,
          is_active: true,
          is_favorite: false,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      const name = formData.company || 
        `${formData.first_name} ${formData.last_name}`.trim() || 
        'New Customer';
      
      queryClient.invalidateQueries({ queryKey: ['directory-contacts', 'customer'] });
      toast.success('Customer created successfully');
      onCustomerCreated({ id: data.id, name });
      
      // Reset form
      setFormData({
        company: '',
        first_name: '',
        last_name: '',
        phone: '',
        cell: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip: '',
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      company: '',
      first_name: '',
      last_name: '',
      phone: '',
      cell: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip: '',
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="sticky top-0 z-10 bg-background border-b p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <SheetTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Add Customer
              </SheetTitle>
            </div>
          </SheetHeader>

          {/* Form Content */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Company & Name Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <User className="h-4 w-4" />
                  Contact Details
                </div>
                
                <div>
                  <label className="text-sm font-medium">Company</label>
                  <Input
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="Company name"
                    className="mt-1.5 h-12 rounded-xl"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      placeholder="First"
                      className="mt-1.5 h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      placeholder="Last"
                      className="mt-1.5 h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <Phone className="h-4 w-4" />
                  Contact Info
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="mt-1.5 h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cell</label>
                    <Input
                      type="tel"
                      value={formData.cell}
                      onChange={(e) => handleChange('cell', e.target.value)}
                      placeholder="(555) 987-6543"
                      className="mt-1.5 h-12 rounded-xl"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@example.com"
                    className="mt-1.5 h-12 rounded-xl"
                  />
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <MapPin className="h-4 w-4" />
                  Address
                </div>
                
                <div>
                  <label className="text-sm font-medium">Street Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="123 Main St"
                    className="mt-1.5 h-12 rounded-xl"
                  />
                </div>
                
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm font-medium">City</label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="City"
                      className="mt-1.5 h-12 rounded-xl"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-sm font-medium">State</label>
                    <Input
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      placeholder="TX"
                      className="mt-1.5 h-12 rounded-xl"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">ZIP</label>
                    <Input
                      value={formData.zip}
                      onChange={(e) => handleChange('zip', e.target.value)}
                      placeholder="75001"
                      className="mt-1.5 h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Submit Button */}
          <div className="sticky bottom-0 border-t bg-background p-4">
            <Button
              className="w-full h-14 text-lg rounded-xl"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Add Customer'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
