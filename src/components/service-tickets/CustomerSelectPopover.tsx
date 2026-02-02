import React, { useState } from 'react';
import { Search, Plus, User, Star, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useCustomers, DirectoryContact } from '@/hooks/useDirectoryContacts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface CustomerSelectPopoverProps {
  selectedCustomer: { id: string; name: string } | null;
  onSelect: (customer: { id: string; name: string } | null) => void;
}

export const CustomerSelectPopover: React.FC<CustomerSelectPopoverProps> = ({
  selectedCustomer,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const { data: customers = [], isLoading } = useCustomers();
  const queryClient = useQueryClient();

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.company?.toLowerCase().includes(search.toLowerCase()) ||
      customer.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.last_name?.toLowerCase().includes(search.toLowerCase());
    
    if (showFavoritesOnly) {
      return matchesSearch && customer.is_favorite;
    }
    return matchesSearch;
  });

  const getCustomerDisplayName = (customer: DirectoryContact) => {
    if (customer.company) return customer.company;
    if (customer.contact_name) return customer.contact_name;
    return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unnamed';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSelectCustomer = (customer: DirectoryContact) => {
    onSelect({ id: customer.id, name: getCustomerDisplayName(customer) });
    setOpen(false);
    setSearch('');
  };

  const handleClearCustomer = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 font-normal"
          >
            {selectedCustomer ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-primary">
                    {getInitials(selectedCustomer.name)}
                  </span>
                </div>
                <span className="truncate">{selectedCustomer.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Select customer...</span>
            )}
            {selectedCustomer ? (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 cursor-pointer"
                onClick={handleClearCustomer}
              />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for Customer"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setShowAddCustomer(true);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="favorites-only"
                checked={showFavoritesOnly}
                onCheckedChange={(checked) => setShowFavoritesOnly(checked as boolean)}
              />
              <label
                htmlFor="favorites-only"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Show Favorites Only
              </label>
            </div>
          </div>

          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No customers found
              </div>
            ) : (
              <div className="py-1">
                {filteredCustomers.map((customer) => {
                  const name = getCustomerDisplayName(customer);
                  return (
                    <button
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {getInitials(name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm truncate block">{name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">Customer</span>
                      <Star
                        className={`h-4 w-4 shrink-0 ${
                          customer.is_favorite
                            ? 'text-orange-500 fill-orange-500'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <AddCustomerDialog
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        onCustomerCreated={(customer) => {
          queryClient.invalidateQueries({ queryKey: ['directory-contacts', 'customer'] });
          onSelect(customer);
          setShowAddCustomer(false);
        }}
      />
    </>
  );
};

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (customer: { id: string; name: string }) => void;
}

const AddCustomerDialog: React.FC<AddCustomerDialogProps> = ({
  open,
  onOpenChange,
  onCustomerCreated,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    first_name: '',
    last_name: '',
    phone: '',
    phone_ext: '',
    phone2: '',
    phone2_ext: '',
    cell: '',
    email: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          metadata: {
            phone_ext: formData.phone_ext || null,
            phone2: formData.phone2 || null,
            phone2_ext: formData.phone2_ext || null,
            address2: formData.address2 || null,
          },
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      const name = formData.company || 
        `${formData.first_name} ${formData.last_name}`.trim() || 
        'New Customer';
      
      toast.success('Customer created successfully');
      onCustomerCreated({ id: data.id, name });
      
      // Reset form
      setFormData({
        company: '',
        first_name: '',
        last_name: '',
        phone: '',
        phone_ext: '',
        phone2: '',
        phone2_ext: '',
        cell: '',
        email: '',
        address: '',
        address2: '',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add Customer
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company & Name Section */}
          <div className="space-y-4 border-l-2 border-muted pl-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Company</label>
              <Input
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="Company name"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">First Name</label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder="First name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  placeholder="Last name"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-4 border-l-2 border-muted pl-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="Phone"
                    className="mt-1"
                  />
                </div>
                <div className="w-16">
                  <label className="text-sm font-medium text-muted-foreground">Ext.</label>
                  <Input
                    value={formData.phone_ext}
                    onChange={(e) => handleChange('phone_ext', e.target.value)}
                    placeholder="Ext."
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground">Phone 2</label>
                  <Input
                    value={formData.phone2}
                    onChange={(e) => handleChange('phone2', e.target.value)}
                    placeholder="Phone 2"
                    className="mt-1"
                  />
                </div>
                <div className="w-16">
                  <label className="text-sm font-medium text-muted-foreground">Ext.</label>
                  <Input
                    value={formData.phone2_ext}
                    onChange={(e) => handleChange('phone2_ext', e.target.value)}
                    placeholder="Ext."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cell</label>
                <Input
                  value={formData.cell}
                  onChange={(e) => handleChange('cell', e.target.value)}
                  placeholder="Cell phone"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Email address"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4 border-l-2 border-muted pl-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Street</label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Street address"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Street 2</label>
              <Input
                value={formData.address2}
                onChange={(e) => handleChange('address2', e.target.value)}
                placeholder="Apt, Suite, etc."
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="City"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">State</label>
                <Input
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="State"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Zip</label>
                <Input
                  value={formData.zip}
                  onChange={(e) => handleChange('zip', e.target.value)}
                  placeholder="ZIP"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
