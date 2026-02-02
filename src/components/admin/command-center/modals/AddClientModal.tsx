import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PLAN_OPTIONS, STATUS_OPTIONS, INDUSTRIES, COMPANY_SIZES, LEAD_SOURCES, TIMEZONES, CONTACT_METHODS } from '../constants/clientConstants';
import { formatPhoneForStorage } from '@/lib/phoneUtils';

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient: any | null;
  onSuccess: () => void;
}

export function AddClientModal({ open, onOpenChange, editingClient, onSuccess }: AddClientModalProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    business_name: '',
    phone: '',
    email: '',
    secondary_phone: '',
    secondary_email: '',
    preferred_contact_method: 'phone',
    website: '',
    timezone: 'America/Los_Angeles',
    address: '',
    industry: '',
    company_size: '',
    lead_source: '',
    service_area: '',
    instagram_handle: '',
    facebook_url: '',
    tiktok_handle: '',
    google_business_url: '',
    status: 'ACTIVE',
    plan_type: '',
    monthly_value: '',
    notes: '',
  });

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name || '',
        contact_name: editingClient.contact_name || '',
        business_name: editingClient.business_name || '',
        phone: editingClient.phone || '',
        email: editingClient.email || '',
        secondary_phone: editingClient.secondary_phone || '',
        secondary_email: editingClient.secondary_email || '',
        preferred_contact_method: editingClient.preferred_contact_method || 'phone',
        website: editingClient.website || '',
        timezone: editingClient.timezone || 'America/Los_Angeles',
        address: editingClient.address || '',
        industry: editingClient.industry || '',
        company_size: editingClient.company_size || '',
        lead_source: editingClient.lead_source || '',
        service_area: editingClient.service_area || '',
        instagram_handle: editingClient.instagram_handle || '',
        facebook_url: editingClient.facebook_url || '',
        tiktok_handle: editingClient.tiktok_handle || '',
        google_business_url: editingClient.google_business_url || '',
        status: editingClient.status || 'ACTIVE',
        plan_type: editingClient.plan_type || '',
        monthly_value: editingClient.monthly_value?.toString() || '',
        notes: editingClient.notes || '',
      });
    } else {
      setFormData({
        name: '', contact_name: '', business_name: '', phone: '', email: '',
        secondary_phone: '', secondary_email: '', preferred_contact_method: 'phone',
        website: '', timezone: 'America/Los_Angeles', address: '', industry: '',
        company_size: '', lead_source: '', service_area: '', instagram_handle: '',
        facebook_url: '', tiktok_handle: '', google_business_url: '', status: 'ACTIVE',
        plan_type: '', monthly_value: '', notes: '',
      });
    }
  }, [editingClient, open]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Client name is required');
      return;
    }

    setSaving(true);
    try {
      const clientData = {
        name: formData.name,
        contact_name: formData.contact_name || null,
        business_name: formData.business_name || null,
        phone: formData.phone ? formatPhoneForStorage(formData.phone) : null,
        email: formData.email || null,
        secondary_phone: formData.secondary_phone ? formatPhoneForStorage(formData.secondary_phone) : null,
        secondary_email: formData.secondary_email || null,
        preferred_contact_method: formData.preferred_contact_method,
        website: formData.website || null,
        timezone: formData.timezone,
        address: formData.address || null,
        industry: formData.industry || null,
        company_size: formData.company_size || null,
        lead_source: formData.lead_source || null,
        service_area: formData.service_area || null,
        instagram_handle: formData.instagram_handle || null,
        facebook_url: formData.facebook_url || null,
        tiktok_handle: formData.tiktok_handle || null,
        google_business_url: formData.google_business_url || null,
        status: formData.status,
        plan_type: formData.plan_type || null,
        monthly_value: formData.monthly_value ? parseFloat(formData.monthly_value) : null,
        notes: formData.notes || null,
      };

      if (editingClient) {
        const { error } = await supabase.from('sales_clients').update(clientData).eq('id', editingClient.id);
        if (error) throw error;
        toast.success('Client updated');
      } else {
        const { error } = await supabase.from('sales_clients').insert(clientData);
        if (error) throw error;
        toast.success('Client created');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="contact" className="mt-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} placeholder="Primary contact" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Secondary Phone</Label>
                <Input value={formData.secondary_phone} onChange={(e) => setFormData({ ...formData, secondary_phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Preferred Contact</Label>
                <Select value={formData.preferred_contact_method} onValueChange={(v) => setFormData({ ...formData, preferred_contact_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTACT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select value={formData.industry} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company Size</Label>
                <Select value={formData.company_size} onValueChange={(v) => setFormData({ ...formData, company_size: v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Area</Label>
                <Input value={formData.service_area} onChange={(e) => setFormData({ ...formData, service_area: e.target.value })} placeholder="Bay Area, CA" />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={formData.timezone} onValueChange={(v) => setFormData({ ...formData, timezone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input value={formData.instagram_handle} onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })} placeholder="@handle" />
              </div>
              <div className="space-y-2">
                <Label>TikTok</Label>
                <Input value={formData.tiktok_handle} onChange={(e) => setFormData({ ...formData, tiktok_handle: e.target.value })} placeholder="@handle" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input value={formData.facebook_url} onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })} placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Google Business URL</Label>
              <Input value={formData.google_business_url} onChange={(e) => setFormData({ ...formData, google_business_url: e.target.value })} placeholder="https://g.page/..." />
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={formData.plan_type} onValueChange={(v) => setFormData({ ...formData, plan_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select plan..." /></SelectTrigger>
                  <SelectContent>{PLAN_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Value ($)</Label>
                <Input type="number" value={formData.monthly_value} onChange={(e) => setFormData({ ...formData, monthly_value: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Lead Source</Label>
                <Select value={formData.lead_source} onValueChange={(v) => setFormData({ ...formData, lead_source: v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editingClient ? 'Update' : 'Create'} Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
