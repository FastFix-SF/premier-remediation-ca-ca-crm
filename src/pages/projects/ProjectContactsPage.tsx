import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Phone, Mail, Building2, User, Plus, Trash2, Edit, 
  Star, Search, Users 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const CONTACT_ROLES = [
  'Customer',
  'Property Owner',
  'Inspector',
  'Subcontractor',
  'Supplier',
  'Architect',
  'General Contractor',
  'Other',
];

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

interface ContactFormData {
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  is_primary: boolean;
}

const initialFormData: ContactFormData = {
  name: '',
  role: '',
  company: '',
  email: '',
  phone: '',
  notes: '',
  is_primary: false,
};

export const ProjectContactsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['project-contacts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_contacts')
        .select('*')
        .eq('project_id', id)
        .order('is_primary', { ascending: false })
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const { error } = await supabase
        .from('project_contacts')
        .insert({
          project_id: id,
          ...data,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-contacts', id] });
      toast({ title: 'Success', description: 'Contact added successfully' });
      setIsDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add contact', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ contactId, data }: { contactId: string; data: ContactFormData }) => {
      const { error } = await supabase
        .from('project_contacts')
        .update(data)
        .eq('id', contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-contacts', id] });
      toast({ title: 'Success', description: 'Contact updated successfully' });
      setIsDialogOpen(false);
      setEditingContact(null);
      setFormData(initialFormData);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update contact', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('project_contacts')
        .delete()
        .eq('id', contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-contacts', id] });
      toast({ title: 'Success', description: 'Contact deleted' });
    },
  });

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }
    
    if (editingContact) {
      updateMutation.mutate({ contactId: editingContact, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (contact: any) => {
    setFormData({
      name: contact.name,
      role: contact.role || '',
      company: contact.company || '',
      email: contact.email || '',
      phone: contact.phone || '',
      notes: contact.notes || '',
      is_primary: contact.is_primary || false,
    });
    setEditingContact(contact.id);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingContact(null);
    setFormData(initialFormData);
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      contact.company?.toLowerCase().includes(searchLower) ||
      contact.role?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower)
    );
  });

  if (projectLoading || contactsLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <ProjectSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <ProjectSidebar />
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{project?.name} - Contacts</h1>
            <p className="text-muted-foreground">{contacts.length} contacts</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => open ? setIsDialogOpen(true) : handleDialogClose()}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(v) => setFormData({ ...formData, role: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_ROLES.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Company name"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_primary"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_primary">Primary Contact</Label>
                </div>
                <Button 
                  onClick={handleSubmit} 
                  className="w-full"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending 
                    ? 'Saving...' 
                    : editingContact ? 'Update Contact' : 'Add Contact'
                  }
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Contacts Grid */}
        {filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Contacts Yet</h3>
                <p className="text-muted-foreground mb-4">Add your first contact to this project</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{contact.name}</h3>
                          {contact.is_primary && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        {contact.role && (
                          <Badge variant="secondary" className="mt-1">{contact.role}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(contact)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(contact.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {contact.company && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span>{contact.company}</span>
                      </div>
                    )}
                    {contact.email && (
                      <a 
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                      >
                        <Mail className="w-4 h-4" />
                        <span>{contact.email}</span>
                      </a>
                    )}
                    {contact.phone && (
                      <a 
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                      >
                        <Phone className="w-4 h-4" />
                        <span>{contact.phone}</span>
                      </a>
                    )}
                  </div>
                  
                  {contact.notes && (
                    <p className="mt-4 text-sm text-muted-foreground border-t pt-3">
                      {contact.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectContactsPage;
