import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateServiceTicket, TICKET_STATUSES } from '@/hooks/useServiceTickets';
import { toast } from 'sonner';

interface ServiceTicketSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: any;
}

export const ServiceTicketSettingsModal: React.FC<ServiceTicketSettingsModalProps> = ({
  isOpen,
  onClose,
  ticket
}) => {
  const updateTicket = useUpdateServiceTicket();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_hours: '',
    access_gate_code: '',
    service_address: '',
    service_city: '',
    service_state: '',
    service_zip: '',
    service_notes: '',
    internal_notes: ''
  });

  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title || '',
        description: ticket.description || '',
        status: ticket.status || 'unscheduled',
        scheduled_date: ticket.scheduled_date || '',
        scheduled_time: ticket.scheduled_time || '',
        duration_hours: ticket.duration_hours?.toString() || '',
        access_gate_code: ticket.access_gate_code || '',
        service_address: ticket.service_address || '',
        service_city: ticket.service_city || '',
        service_state: ticket.service_state || '',
        service_zip: ticket.service_zip || '',
        service_notes: ticket.service_notes || '',
        internal_notes: ticket.internal_notes || ''
      });
    }
  }, [ticket]);

  const handleSave = async () => {
    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.id,
        updates: {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time,
          duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
          access_gate_code: formData.access_gate_code,
          service_address: formData.service_address,
          service_city: formData.service_city,
          service_state: formData.service_state,
          service_zip: formData.service_zip,
          service_notes: formData.service_notes,
          internal_notes: formData.internal_notes
        }
      });
      onClose();
    } catch (error: any) {
      // Error is already handled in the hook
      console.error('Save failed:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {TICKET_STATUSES.map((status) => (
                  <SelectItem key={status.key} value={status.key}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Service Date</Label>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Service Time</Label>
              <Input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Duration (Hours)</Label>
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Access/Gate Code</Label>
              <Input
                value={formData.access_gate_code}
                onChange={(e) => setFormData({ ...formData, access_gate_code: e.target.value })}
                placeholder="Gate code"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Service Address</Label>
            <Input
              value={formData.service_address}
              onChange={(e) => setFormData({ ...formData, service_address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formData.service_city}
                onChange={(e) => setFormData({ ...formData, service_city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={formData.service_state}
                onChange={(e) => setFormData({ ...formData, service_state: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ZIP Code</Label>
            <Input
              value={formData.service_zip}
              onChange={(e) => setFormData({ ...formData, service_zip: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Service Notes</Label>
            <Textarea
              value={formData.service_notes}
              onChange={(e) => setFormData({ ...formData, service_notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea
              value={formData.internal_notes}
              onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={updateTicket.isPending}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
