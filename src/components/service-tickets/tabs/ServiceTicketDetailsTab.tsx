import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ServiceTicket, useUpdateServiceTicket } from '@/hooks/useServiceTickets';
import { format } from 'date-fns';
import { Pencil, Save, X } from 'lucide-react';
import { CustomerSelectPopover } from '../CustomerSelectPopover';
import { TechnicianSelectPopover } from '../TechnicianSelectPopover';
import { notifyServiceTicketAssignment } from '@/utils/sendSmsNotification';
import { useToast } from '@/hooks/use-toast';

interface ServiceTicketDetailsTabProps {
  ticket: ServiceTicket;
}

export const ServiceTicketDetailsTab: React.FC<ServiceTicketDetailsTabProps> = ({ ticket }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(
    ticket.customer_id && ticket.customer?.name 
      ? { id: ticket.customer_id, name: ticket.customer.name }
      : null
  );
  const [selectedTechnician, setSelectedTechnician] = useState<{ id: string; name: string } | null>(
    null // Will be populated if ticket has assigned_technician
  );
  const [formData, setFormData] = useState({
    scheduled_date: ticket.scheduled_date || '',
    scheduled_time: ticket.scheduled_time || '',
    duration_hours: ticket.duration_hours?.toString() || '',
    description: ticket.description || '',
    service_notes: ticket.service_notes || '',
  });

  const updateTicket = useUpdateServiceTicket();
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      scheduled_date: ticket.scheduled_date || '',
      scheduled_time: ticket.scheduled_time || '',
      duration_hours: ticket.duration_hours?.toString() || '',
      description: ticket.description || '',
      service_notes: ticket.service_notes || '',
    });
    setSelectedCustomer(
      ticket.customer_id && ticket.customer?.name 
        ? { id: ticket.customer_id, name: ticket.customer.name }
        : null
    );
  }, [ticket]);

  const handleCustomerSelect = async (customer: { id: string; name: string } | null) => {
    setSelectedCustomer(customer);
    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.id,
        updates: {
          customer_id: customer?.id || null,
        },
      });
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  };

  const handleTechnicianSelect = async (technician: { id: string; name: string } | null) => {
    setSelectedTechnician(technician);
    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.id,
        updates: {
          assigned_technician_id: technician?.id || null,
        },
      });

      // Send SMS notification to the newly assigned technician
      if (technician) {
        const fullAddress = [
          ticket.service_address,
          ticket.service_city,
          ticket.service_state,
          ticket.service_zip
        ].filter(Boolean).join(', ');

        const result = await notifyServiceTicketAssignment(
          technician.id,
          ticket.ticket_number,
          ticket.title,
          ticket.scheduled_date,
          ticket.scheduled_time,
          fullAddress || null
        );

        if (result.success) {
          toast({
            title: "Notification sent",
            description: `${technician.name} has been notified about this assignment.`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to update technician:', error);
    }
  };

  const handleSave = async () => {
    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.id,
        updates: {
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time,
          duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
          description: formData.description,
          service_notes: formData.service_notes,
        },
      });
      setIsEditing(false);
    } catch (error) {
      // Error is handled in the hook
      console.error('Save failed:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      scheduled_date: ticket.scheduled_date || '',
      scheduled_time: ticket.scheduled_time || '',
      duration_hours: ticket.duration_hours?.toString() || '',
      description: ticket.description || '',
      service_notes: ticket.service_notes || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-2 w-2 bg-red-500 rounded" />
              Details
            </CardTitle>
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateTicket.isPending}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Service Date</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm">
                  {ticket.scheduled_date
                    ? format(new Date(ticket.scheduled_date), 'MM/dd/yyyy')
                    : 'Select Date'}
                </p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Service Time</Label>
              {isEditing ? (
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm">
                  {ticket.scheduled_time || 'Select Time'}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Customer</Label>
              <div className="mt-1">
                <CustomerSelectPopover
                  selectedCustomer={selectedCustomer}
                  onSelect={handleCustomerSelect}
                />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Duration (Hours)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                  className="mt-1"
                  placeholder="1"
                />
              ) : (
                <p className="text-sm">{ticket.duration_hours || 1} Hour</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Invoiced To</Label>
              <p className="text-sm text-muted-foreground">If Not Customer</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Service Technician</Label>
              <div className="mt-1">
                <TechnicianSelectPopover
                  selectedTechnician={selectedTechnician}
                  onSelect={handleTechnicianSelect}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Description</Label>
            {isEditing ? (
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter service description..."
                className="mt-1"
                rows={3}
              />
            ) : (
              <p className="text-sm">{ticket.description || 'Service Description'}</p>
            )}
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Service Notes</Label>
            {isEditing ? (
              <Textarea
                value={formData.service_notes}
                onChange={(e) => setFormData({ ...formData, service_notes: e.target.value })}
                placeholder="Enter service notes..."
                className="mt-1"
                rows={3}
              />
            ) : (
              <p className="text-sm">{ticket.service_notes || 'Service Notes'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="h-2 w-2 bg-orange-500 rounded" />
            Custom Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label className="text-muted-foreground text-sm">Text Area</Label>
            <p className="text-sm text-muted-foreground">Text Area</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
