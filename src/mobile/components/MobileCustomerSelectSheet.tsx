import React, { useState } from 'react';
import { Search, Plus, Star, ChevronLeft, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCustomers, DirectoryContact } from '@/hooks/useDirectoryContacts';
import { MobileAddCustomerSheet } from './MobileAddCustomerSheet';

interface MobileCustomerSelectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomer: { id: string; name: string } | null;
  onSelect: (customer: { id: string; name: string } | null) => void;
}

export const MobileCustomerSelectSheet: React.FC<MobileCustomerSelectSheetProps> = ({
  open,
  onOpenChange,
  selectedCustomer,
  onSelect,
}) => {
  const [search, setSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const { data: customers = [], isLoading } = useCustomers();

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
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="sticky top-0 z-10 bg-background border-b p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <SheetTitle className="flex-1">Select Customer</SheetTitle>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setShowAddCustomer(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 rounded-xl"
                />
              </div>
              
              {/* Favorites filter */}
              <div className="flex items-center gap-2 mt-3">
                <Checkbox
                  id="favorites-mobile"
                  checked={showFavoritesOnly}
                  onCheckedChange={(checked) => setShowFavoritesOnly(checked as boolean)}
                />
                <label
                  htmlFor="favorites-mobile"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Show Favorites Only
                </label>
              </div>
            </SheetHeader>

            {/* Customer List */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">No customers found</h3>
                  <p className="text-muted-foreground text-sm">
                    {search ? 'Try a different search' : 'Add your first customer'}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowAddCustomer(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </div>
              ) : (
                <div className="py-2">
                  {filteredCustomers.map((customer) => {
                    const name = getCustomerDisplayName(customer);
                    const isSelected = selectedCustomer?.id === customer.id;
                    
                    return (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {getInitials(name)}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{name}</span>
                            {customer.is_favorite && (
                              <Star className="h-4 w-4 text-orange-500 fill-orange-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">Customer</span>
                        </div>
                        
                        {isSelected && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Currently Selected Footer */}
            {selectedCustomer && (
              <div className="sticky bottom-0 border-t bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Selected</p>
                    <p className="font-semibold">{selectedCustomer.name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelect(null)}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Customer Sheet */}
      <MobileAddCustomerSheet
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        onCustomerCreated={(customer) => {
          onSelect(customer);
          setShowAddCustomer(false);
        }}
      />
    </>
  );
};
