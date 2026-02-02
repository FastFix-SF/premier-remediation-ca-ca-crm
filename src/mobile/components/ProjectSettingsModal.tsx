import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Save, FileText, Tag, Pencil, X, Phone, Mail, MapPin, User, Building, Hash } from 'lucide-react';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { useMobileProjectUpdate, useMobileProjectDelete } from '@/mobile/hooks/useMobileProjectManagement';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMobilePermissions } from '@/mobile/hooks/useMobilePermissions';
import { LabelSelectionModal } from '@/mobile/components/tasks/LabelSelectionModal';
import { getAllLabels } from '@/mobile/constants/labels';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const { toast } = useToast();
  const { projectPermissions } = useMobilePermissions(project?.id);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: project?.name || '',
    address: project?.address || '',
    status: project?.status || 'active',
    project_type: project?.project_type || '',
    customer_email: project?.customer_email || '',
    client_name: project?.client_name || '',
    client_phone: project?.client_phone || '',
    additional_contact: project?.additional_contact || ''
  });
  const [selectedLabels, setSelectedLabels] = useState<string[]>(project?.labels || []);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [relatedInvoices, setRelatedInvoices] = useState<any[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const updateProjectMutation = useMobileProjectUpdate();
  const deleteProjectMutation = useMobileProjectDelete();

  // Reset edit mode and delete confirmation when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setShowDeleteConfirmation(false);
    }
  }, [isOpen]);

  // Update form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        address: project.address || '',
        status: project.status || 'active',
        project_type: project.project_type || '',
        customer_email: project.customer_email || '',
        client_name: project.client_name || '',
        client_phone: project.client_phone || '',
        additional_contact: project.additional_contact || ''
      });
      setSelectedLabels(project.labels || []);
    }
  }, [project]);

  const handleSave = async () => {
    if (!project?.id) return;

    await updateProjectMutation.mutateAsync({
      projectId: project.id,
      updates: { ...formData, labels: selectedLabels }
    });
    setIsEditMode(false);
    toast({
      title: "Success",
      description: "Project updated successfully",
    });
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (project) {
      setFormData({
        name: project.name || '',
        address: project.address || '',
        status: project.status || 'active',
        project_type: project.project_type || '',
        customer_email: project.customer_email || '',
        client_name: project.client_name || '',
        client_phone: project.client_phone || '',
        additional_contact: project.additional_contact || ''
      });
      setSelectedLabels(project.labels || []);
    }
    setIsEditMode(false);
  };

  const handleDelete = async () => {
    if (!project?.id) return;
    
    await deleteProjectMutation.mutateAsync(project.id);
    onClose();
  };

  const handleDeleteClick = async () => {
    if (!project?.id) return;

    // Check for related invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', project.id);

    if (error) {
      console.error('Error checking invoices:', error);
      toast({
        title: "Error",
        description: "Failed to check for related invoices",
        variant: "destructive",
      });
      return;
    }

    if (invoices && invoices.length > 0) {
      setRelatedInvoices(invoices);
      setShowInvoicesModal(true);
    } else {
      // No invoices, proceed with delete confirmation
      handleDelete();
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Invoice deleted successfully",
    });

    // Update the list
    const updatedInvoices = relatedInvoices.filter(inv => inv.id !== invoiceId);
    setRelatedInvoices(updatedInvoices);

    // If no more invoices, close modal and allow project deletion
    if (updatedInvoices.length === 0) {
      setShowInvoicesModal(false);
      toast({
        title: "Ready to Delete",
        description: "All invoices removed. You can now delete the project.",
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      case 'on_hold': return 'On Hold';
      default: return status;
    }
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'residential': return 'Residential';
      case 'commercial': return 'Commercial';
      case 'industrial': return 'Industrial';
      default: return type || 'Not set';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  // Read-only view component
  const ReadOnlyField = ({ icon: Icon, label, value, href }: { icon: any, label: string, value: string, href?: string }) => {
    const content = (
      <div className="flex items-start gap-3 py-2">
        <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium text-foreground truncate">{value || 'Not set'}</p>
        </div>
      </div>
    );

    if (href && value) {
      return (
        <a href={href} className="block hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors">
          {content}
        </a>
      );
    }

    return <div className="px-2 -mx-2">{content}</div>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md mx-auto"
        onInteractOutside={(e) => {
          // Prevent closing when clicking on Google Places autocomplete
          const target = e.target as HTMLElement;
          if (target.closest('.pac-container')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle>Project Details</DialogTitle>
          {!isEditMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(true)}
              className="h-8 px-3"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </DialogHeader>

        {!isEditMode ? (
          /* READ-ONLY VIEW */
          <div className="space-y-1">
            {/* Status Badge */}
            <div className="flex items-center gap-2 pb-2">
              <Badge className={getStatusColor(formData.status)}>
                {getStatusLabel(formData.status)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {getProjectTypeLabel(formData.project_type)}
              </span>
            </div>

            {/* Project Info */}
            <ReadOnlyField icon={Building} label="Project Name" value={formData.name} />
            <ReadOnlyField icon={MapPin} label="Address" value={formData.address} />
            
            <div className="border-t border-border/50 my-2" />
            
            {/* Client Info */}
            <ReadOnlyField icon={User} label="Client Name" value={formData.client_name} />
            <ReadOnlyField 
              icon={Phone} 
              label="Phone" 
              value={formData.client_phone}
              href={formData.client_phone ? `tel:${formData.client_phone}` : undefined}
            />
            <ReadOnlyField 
              icon={Mail} 
              label="Email" 
              value={formData.customer_email}
              href={formData.customer_email ? `mailto:${formData.customer_email}` : undefined}
            />
            {formData.additional_contact && (
              <ReadOnlyField icon={User} label="Additional Contact" value={formData.additional_contact} />
            )}

            {/* Labels */}
            {selectedLabels.length > 0 && (
              <>
                <div className="border-t border-border/50 my-2" />
                <div className="flex items-start gap-3 py-2 px-2 -mx-2">
                  <Tag className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1.5">Labels</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedLabels.map(labelId => {
                        const allLabels = getAllLabels();
                        const labelConfig = allLabels.find(l => l.id === labelId);
                        if (!labelConfig) return null;
                        return (
                          <Badge 
                            key={labelId}
                            className="text-[10px] px-1.5 py-0 text-white border-0"
                            style={{ backgroundColor: labelConfig.color }}
                          >
                            {labelConfig.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Delete Button (only in read mode for admins) */}
            {projectPermissions.canDelete && (
              <div className="pt-3 border-t">
                {showDeleteConfirmation ? (
                  <div className="space-y-3 p-3 border border-destructive/30 rounded-lg bg-destructive/5">
                    <div className="flex items-start gap-2">
                      <Trash2 className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Delete Project?</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Are you sure you want to delete this project? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setShowDeleteConfirmation(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="flex-1"
                        onClick={handleDeleteClick}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteConfirmation(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Delete Project
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* EDIT MODE */
          <div className="space-y-3">
            {/* Address - Full width */}
            <div>
              <Label htmlFor="address" className="text-xs text-muted-foreground">Address</Label>
              <GooglePlacesAutocomplete
                value={formData.address}
                onChange={(value) => handleChange('address', value)}
                placeholder="Enter address"
              />
            </div>

            {/* Project Name & Type - 2 columns */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="name" className="text-xs text-muted-foreground">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Name"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="project_type" className="text-xs text-muted-foreground">Type</Label>
                <Select value={formData.project_type} onValueChange={(value) => handleChange('project_type', value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Client Name & Phone - 2 columns */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="client_name" className="text-xs text-muted-foreground">Client Name</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => handleChange('client_name', e.target.value)}
                  placeholder="Name"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="client_phone" className="text-xs text-muted-foreground">Phone</Label>
                <Input
                  id="client_phone"
                  type="tel"
                  value={formData.client_phone}
                  onChange={(e) => handleChange('client_phone', e.target.value)}
                  placeholder="Phone"
                  className="h-9"
                />
              </div>
            </div>

            {/* Email & Additional Contact - 2 columns */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="customer_email" className="text-xs text-muted-foreground">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => handleChange('customer_email', e.target.value)}
                  placeholder="Email"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="additional_contact" className="text-xs text-muted-foreground">Alt. Contact</Label>
                <Input
                  id="additional_contact"
                  value={formData.additional_contact}
                  onChange={(e) => handleChange('additional_contact', e.target.value)}
                  placeholder="Optional"
                  className="h-9"
                />
              </div>
            </div>

            {/* Status & Labels - 2 columns */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="status" className="text-xs text-muted-foreground">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Labels</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-auto min-h-9 justify-start py-1.5"
                  onClick={() => setShowLabelModal(true)}
                >
                  {selectedLabels.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedLabels.map(labelId => {
                        const allLabels = getAllLabels();
                        const labelConfig = allLabels.find(l => l.id === labelId);
                        if (!labelConfig) return null;
                        return (
                          <Badge 
                            key={labelId}
                            className="text-[10px] px-1.5 py-0 text-white border-0"
                            style={{ backgroundColor: labelConfig.color }}
                          >
                            {labelConfig.name}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">Add labels</span>
                  )}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 h-9"
                size="sm"
              >
                <X className="w-4 h-4 mr-1.5" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateProjectMutation.isPending}
                className="flex-1 h-9"
                size="sm"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Invoices Modal */}
      <Dialog open={showInvoicesModal} onOpenChange={setShowInvoicesModal}>
        <DialogContent className="max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Related Invoices
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This project has {relatedInvoices.length} invoice(s). Please delete or reassign these invoices before deleting the project.
            </p>
            
            <div className="space-y-2">
              {relatedInvoices.map((invoice, index) => (
                <div key={invoice.id} className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">Invoice #{index + 1}</p>
                      <p className="text-sm text-muted-foreground">ID: {invoice.id}</p>
                      {invoice.invoice_number && (
                        <p className="text-sm">Number: {invoice.invoice_number}</p>
                      )}
                      {invoice.total && (
                        <p className="text-sm font-semibold">${invoice.total.toFixed(2)}</p>
                      )}
                      {invoice.status && (
                        <p className="text-xs text-muted-foreground capitalize">Status: {invoice.status}</p>
                      )}
                      {invoice.created_at && (
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteInvoice(invoice.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowInvoicesModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LabelSelectionModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        selectedLabels={selectedLabels}
        onConfirm={(labels) => {
          setSelectedLabels(labels);
          setShowLabelModal(false);
        }}
      />
    </Dialog>
  );
};
