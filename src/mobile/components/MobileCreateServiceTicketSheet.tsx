import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Zap, 
  User, 
  FileText, 
  MapPin, 
  Clock, 
  ChevronRight,
  X,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateServiceTicket, TICKET_STATUSES } from '@/hooks/useServiceTickets';
import { MobileCustomerSelectSheet } from './MobileCustomerSelectSheet';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  customer_id: z.string().optional(),
  service_address: z.string().optional(),
  service_city: z.string().optional(),
  service_state: z.string().optional(),
  service_zip: z.string().optional(),
  status: z.string().default('unscheduled'),
  duration_hours: z.coerce.number().min(0).default(1),
});

interface MobileCreateServiceTicketSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileCreateServiceTicketSheet: React.FC<MobileCreateServiceTicketSheetProps> = ({
  open,
  onOpenChange,
}) => {
  const createTicket = useCreateServiceTicket();
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('unscheduled');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      customer_id: '',
      service_address: '',
      service_city: '',
      service_state: '',
      service_zip: '',
      status: 'unscheduled',
      duration_hours: 1,
    },
  });

  const handleCustomerSelect = (customer: { id: string; name: string } | null) => {
    setSelectedCustomer(customer);
    form.setValue('customer_id', customer?.id || '');
  };

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
    form.setValue('status', status);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createTicket.mutateAsync(values);
    form.reset();
    setSelectedCustomer(null);
    setSelectedStatus('unscheduled');
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    setSelectedCustomer(null);
    setSelectedStatus('unscheduled');
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="sticky top-0 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleClose}
                >
                  <X className="h-5 w-5" />
                </Button>
                <SheetTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  New Service Ticket
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={createTicket.isPending}
                >
                  <Check className="h-5 w-5" />
                </Button>
              </div>
            </SheetHeader>

            {/* Form Content */}
            <ScrollArea className="flex-1">
              <Form {...form}>
                <form className="p-4 space-y-6 pb-8">
                  {/* Title Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <FileText className="h-4 w-4" />
                      Basic Info
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Title *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Roof Leak Repair, Gutter Cleaning" 
                              className="h-12 text-base rounded-xl"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the service needed..."
                              className="min-h-[100px] text-base rounded-xl resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Customer Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <User className="h-4 w-4" />
                      Customer
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setShowCustomerSelect(true)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                    >
                      {selectedCustomer ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {selectedCustomer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{selectedCustomer.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Select a customer...</span>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Status Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <Clock className="h-4 w-4" />
                      Status & Duration
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {TICKET_STATUSES.slice(0, 4).map((status) => (
                        <button
                          key={status.key}
                          type="button"
                          onClick={() => handleStatusSelect(status.key)}
                          className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                            selectedStatus === status.key
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card hover:bg-muted/50'
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>

                    <FormField
                      control={form.control}
                      name="duration_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Estimated Duration (hours)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.5" 
                              className="h-12 text-base rounded-xl"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Address Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <MapPin className="h-4 w-4" />
                      Service Location
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="service_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Street Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123 Main St"
                              className="h-12 text-base rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-5 gap-3">
                      <FormField
                        control={form.control}
                        name="service_city"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="City"
                                className="h-12 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="service_state"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="TX"
                                className="h-12 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="service_zip"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>ZIP</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="75001"
                                className="h-12 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    disabled={createTicket.isPending}
                  >
                    {createTicket.isPending ? 'Creating...' : 'Create Service Ticket'}
                  </Button>
                </form>
              </Form>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Customer Selection Sheet */}
      <MobileCustomerSelectSheet
        open={showCustomerSelect}
        onOpenChange={setShowCustomerSelect}
        selectedCustomer={selectedCustomer}
        onSelect={(customer) => {
          handleCustomerSelect(customer);
          setShowCustomerSelect(false);
        }}
      />
    </>
  );
};
