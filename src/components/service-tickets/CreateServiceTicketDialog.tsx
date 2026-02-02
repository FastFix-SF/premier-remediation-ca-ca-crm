import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateServiceTicket, TICKET_STATUSES } from '@/hooks/useServiceTickets';
import { CustomerSelectPopover } from './CustomerSelectPopover';

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

interface CreateServiceTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAddress?: string;
  defaultProjectId?: string;
}

export const CreateServiceTicketDialog: React.FC<CreateServiceTicketDialogProps> = ({
  open,
  onOpenChange,
  defaultAddress,
  defaultProjectId,
}) => {
  const createTicket = useCreateServiceTicket();
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      customer_id: '',
      service_address: defaultAddress || '',
      service_city: '',
      service_state: '',
      service_zip: '',
      status: 'unscheduled',
      duration_hours: 1,
    },
  });

  // Update form when defaultAddress changes
  React.useEffect(() => {
    if (defaultAddress && open) {
      form.setValue('service_address', defaultAddress);
    }
  }, [defaultAddress, open, form]);

  const handleCustomerSelect = (customer: { id: string; name: string } | null) => {
    setSelectedCustomer(customer);
    form.setValue('customer_id', customer?.id || '');
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createTicket.mutateAsync(values);
    form.reset();
    setSelectedCustomer(null);
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setSelectedCustomer(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Service Ticket</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Roof Repair, Gutter Cleaning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_id"
              render={() => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <FormControl>
                    <CustomerSelectPopover
                      selectedCustomer={selectedCustomer}
                      onSelect={handleCustomerSelect}
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Service description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TICKET_STATUSES.map((status) => (
                          <SelectItem key={status.key} value={status.key}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (hours)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="service_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Street address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="service_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP</FormLabel>
                    <FormControl>
                      <Input placeholder="ZIP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTicket.isPending}>
                {createTicket.isPending ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
