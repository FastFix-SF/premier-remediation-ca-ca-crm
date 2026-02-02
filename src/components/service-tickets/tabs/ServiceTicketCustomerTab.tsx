import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ServiceTicket, useUpdateServiceTicket } from '@/hooks/useServiceTickets';
import { Pencil, Save, X, Link2, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServiceTicketCustomerTabProps {
  ticket: ServiceTicket;
}

export const ServiceTicketCustomerTab: React.FC<ServiceTicketCustomerTabProps> = ({ ticket }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    service_address: ticket.service_address || '',
    service_city: ticket.service_city || '',
    service_state: ticket.service_state || '',
    service_zip: ticket.service_zip || '',
    access_gate_code: ticket.access_gate_code || '',
    internal_notes: ticket.internal_notes || '',
  });

  const updateTicket = useUpdateServiceTicket();

  useEffect(() => {
    setFormData({
      service_address: ticket.service_address || '',
      service_city: ticket.service_city || '',
      service_state: ticket.service_state || '',
      service_zip: ticket.service_zip || '',
      access_gate_code: ticket.access_gate_code || '',
      internal_notes: ticket.internal_notes || '',
    });
  }, [ticket]);

  const handleSave = async () => {
    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.id,
        updates: formData,
      });
      setIsEditing(false);
    } catch (error) {
      // Error is handled in the hook
      console.error('Save failed:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      service_address: ticket.service_address || '',
      service_city: ticket.service_city || '',
      service_state: ticket.service_state || '',
      service_zip: ticket.service_zip || '',
      access_gate_code: ticket.access_gate_code || '',
      internal_notes: ticket.internal_notes || '',
    });
    setIsEditing(false);
  };

  const handleShareWithCustomer = async () => {
    setIsGeneratingLink(true);
    try {
      let token = (ticket as any).customer_access_token;
      
      // Generate token if not exists
      if (!token) {
        const { data, error } = await supabase.rpc('generate_service_ticket_token', {
          p_ticket_id: ticket.id,
        });
        if (error) throw error;
        token = data;
      }
      
      const shareUrl = `${window.location.origin}/service-ticket/view?token=${token}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "Customer view link has been copied to clipboard.",
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Error",
        description: "Failed to generate share link.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const fullAddress = [
    formData.service_address,
    formData.service_city,
    formData.service_state,
    formData.service_zip,
  ]
    .filter(Boolean)
    .join(', ');

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
          <div>
            <Label className="text-muted-foreground text-sm">Customer</Label>
            <p className="text-sm">{ticket.customer?.name || 'No customer'}</p>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Company Name</Label>
            <p className="text-sm text-muted-foreground">Company Name</p>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Location</Label>
            <p className="text-sm text-muted-foreground">Location (if other than Address)</p>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Internal Notes</Label>
            {isEditing ? (
              <Textarea
                value={formData.internal_notes}
                onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                placeholder="Write some notes (if needed)..."
                className="mt-1"
                rows={3}
              />
            ) : (
              <p className="text-sm">{ticket.internal_notes || 'Write some notes (if needed)'}</p>
            )}
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Email</Label>
            <p className="text-sm">{ticket.customer?.email || '-'}</p>
          </div>

          {/* Share with Customer Button */}
          <div className="pt-2 border-t">
            <Button 
              onClick={handleShareWithCustomer} 
              disabled={isGeneratingLink}
              className="w-full"
              variant="outline"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  {isGeneratingLink ? 'Generating...' : 'Share with Customer'}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Generates a link customers can use to view this ticket
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Address */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-2 w-2 bg-green-500 rounded" />
              Service Address
            </CardTitle>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-sm">Access/Gate Code</Label>
            {isEditing ? (
              <Input
                value={formData.access_gate_code}
                onChange={(e) => setFormData({ ...formData, access_gate_code: e.target.value })}
                placeholder="Enter access/gate code..."
                className="mt-1"
              />
            ) : (
              <p className="text-sm">{ticket.access_gate_code || 'Access/Gate Code'}</p>
            )}
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Street Address</Label>
            {isEditing ? (
              <Input
                value={formData.service_address}
                onChange={(e) => setFormData({ ...formData, service_address: e.target.value })}
                placeholder="Enter street address..."
                className="mt-1"
              />
            ) : (
              <p className="text-sm">{ticket.service_address || 'No address'}</p>
            )}
          </div>

          {isEditing && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-muted-foreground text-sm">City</Label>
                <Input
                  value={formData.service_city}
                  onChange={(e) => setFormData({ ...formData, service_city: e.target.value })}
                  placeholder="City"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">State</Label>
                <Input
                  value={formData.service_state}
                  onChange={(e) => setFormData({ ...formData, service_state: e.target.value })}
                  placeholder="State"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">ZIP</Label>
                <Input
                  value={formData.service_zip}
                  onChange={(e) => setFormData({ ...formData, service_zip: e.target.value })}
                  placeholder="ZIP"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {!isEditing && ticket.service_city && (
            <div>
              <Label className="text-muted-foreground text-sm">City, State ZIP</Label>
              <p className="text-sm">
                {ticket.service_city}, {ticket.service_state} {ticket.service_zip}
              </p>
            </div>
          )}

          {/* Map */}
          <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
            {fullAddress ? (
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0, borderRadius: '0.5rem' }}
                src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(fullAddress)}`}
                allowFullScreen
              />
            ) : (
              'No address to display'
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
