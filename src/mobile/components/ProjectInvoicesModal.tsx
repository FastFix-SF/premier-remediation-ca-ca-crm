import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ArrowLeft, Plus, Receipt, Link2, Trash2, ChevronRight, DollarSign, Calendar, User, Mail, MapPin, FileText, Clock, Check, Package, Wrench, Truck, Users, MoreHorizontal, ChevronDown, ChevronUp, Phone, Camera, Image, X, Pencil, Save, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useProjectInvoices, useCreateProjectInvoice, useUpdateProjectInvoice, useDeleteProjectInvoice } from '@/mobile/hooks/useMobileInvoices';
import { Invoice, InvoiceItem, useInvoiceItems, useCreateInvoiceItem, useDeleteInvoiceItem, useUpdateInvoiceItem } from '@/hooks/useInvoices';
import { useAllInvoiceItems } from '@/mobile/hooks/useAllInvoiceItems';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useMobilePhotos } from '@/mobile/hooks/useMobilePhotos';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { companyConfig } from '@/config/company';

interface ProjectInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  clientName?: string;
  clientEmail?: string;
  address?: string;
}

type ViewState = 'list' | 'detail' | 'new';

export const ProjectInvoicesModal: React.FC<ProjectInvoicesModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  clientName,
  clientEmail,
  address
}) => {
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [localInvoice, setLocalInvoice] = useState<Partial<Invoice>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<InvoiceItem>>({});
  const [newItemPhoto, setNewItemPhoto] = useState<File | null>(null);
  const [newItemPhotoPreview, setNewItemPhotoPreview] = useState<string | null>(null);
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [photoPickerTarget, setPhotoPickerTarget] = useState<'new' | string | null>(null);
  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({
    item_type: 'labor',
    item_name: '',
    quantity: 1,
    unit_cost: 0,
    unit: 'EA',
    markup_percent: 0
  });
  
  // Fetch existing project photos
  const { data: projectPhotos = [] } = useMobilePhotos(projectId);

  const { data: invoices = [], isLoading } = useProjectInvoices(projectId);
  
  // Fetch all invoice items for the list view
  const invoiceIds = invoices.map(inv => inv.id);
  const { data: allInvoiceItems = {} } = useAllInvoiceItems(invoiceIds);
  
  const createInvoice = useCreateProjectInvoice();
  const updateInvoice = useUpdateProjectInvoice();
  const deleteInvoice = useDeleteProjectInvoice();
  
  // Invoice items hooks
  const { data: invoiceItems = [] } = useInvoiceItems(localInvoice.id);
  const createItem = useCreateInvoiceItem();
  const deleteItem = useDeleteInvoiceItem();
  const updateItem = useUpdateInvoiceItem();

  // Photo upload helper
  const uploadPhoto = async (file: File, itemId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${itemId}-${Date.now()}.${fileExt}`;
    const filePath = `${localInvoice.id}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('invoice-item-photos')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast({ title: 'Failed to upload photo', variant: 'destructive' });
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('invoice-item-photos')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  };

  const handleNewItemPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewItemPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItemPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExistingItemPhotoUpload = async (itemId: string, file: File) => {
    setUploadingPhotoFor(itemId);
    try {
      const photoUrl = await uploadPhoto(file, itemId);
      if (photoUrl) {
        await updateItem.mutateAsync({ id: itemId, photo_url: photoUrl });
        toast({ title: 'Photo uploaded' });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploadingPhotoFor(null);
    }
  };

  const openPhotoPicker = (target: 'new' | string) => {
    setPhotoPickerTarget(target);
    setShowPhotoPicker(true);
  };

  const selectProjectPhoto = async (photoUrl: string) => {
    if (photoPickerTarget === 'new') {
      // For new item, just set the preview
      setNewItemPhotoPreview(photoUrl);
      setNewItemPhoto(null); // Clear any uploaded file
    } else if (photoPickerTarget) {
      // For existing item, update directly
      setUploadingPhotoFor(photoPickerTarget);
      try {
        await updateItem.mutateAsync({ id: photoPickerTarget, photo_url: photoUrl });
        toast({ title: 'Photo added' });
      } catch (error) {
        console.error('Error setting photo:', error);
      } finally {
        setUploadingPhotoFor(null);
      }
    }
    setShowPhotoPicker(false);
    setPhotoPickerTarget(null);
  };

  const handleFileUploadFromPicker = async (file: File) => {
    if (photoPickerTarget === 'new') {
      // For new item
      setNewItemPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItemPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (photoPickerTarget) {
      // For existing item
      await handleExistingItemPhotoUpload(photoPickerTarget, file);
    }
    setShowPhotoPicker(false);
    setPhotoPickerTarget(null);
  };

  const calculatedSubtotal = invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0);
  
  // Update invoice totals when items change
  useEffect(() => {
    if (localInvoice.id && invoiceItems.length > 0) {
      const newTotal = calculatedSubtotal;
      if (newTotal !== localInvoice.total_amount) {
        setLocalInvoice(prev => ({
          ...prev,
          total_amount: newTotal,
          subtotal: newTotal,
          balance_due: newTotal
        }));
      }
    }
  }, [calculatedSubtotal, localInvoice.id]);

  const getItemTypeInfo = (type: string) => {
    switch (type) {
      case 'material':
        return { icon: Package, label: 'Material', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'labor':
        return { icon: Wrench, label: 'Labor', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'equipment':
        return { icon: Truck, label: 'Equipment', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      case 'subcontractor':
        return { icon: Users, label: 'Subcontractor', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      default:
        return { icon: MoreHorizontal, label: 'Other', color: 'bg-muted text-muted-foreground border-border' };
    }
  };

  const handleAddItem = async () => {
    if (!localInvoice.id) {
      toast({ title: 'Save invoice first', description: 'Please save the invoice before adding items', variant: 'destructive' });
      return;
    }
    if (!newItem.item_name) {
      toast({ title: 'Item name required', variant: 'destructive' });
      return;
    }

    const quantity = newItem.quantity || 1;
    const unitCost = newItem.unit_cost || 0;
    const markup = newItem.markup_percent || 0;
    const baseTotal = quantity * unitCost;
    const total = baseTotal + (baseTotal * markup / 100);

    try {
      const createdItem = await createItem.mutateAsync({
        invoice_id: localInvoice.id,
        item_type: newItem.item_type || 'labor',
        item_name: newItem.item_name,
        quantity,
        unit_cost: unitCost,
        unit: newItem.unit || 'EA',
        markup_percent: markup,
        total,
        is_taxable: false,
        display_order: invoiceItems.length
      });
      
      // Upload photo if one was selected
      if (newItemPhoto && createdItem.id) {
        const photoUrl = await uploadPhoto(newItemPhoto, createdItem.id);
        if (photoUrl) {
          await updateItem.mutateAsync({ id: createdItem.id, photo_url: photoUrl });
        }
      }
      
      setNewItem({
        item_type: 'labor',
        item_name: '',
        quantity: 1,
        unit_cost: 0,
        unit: 'EA',
        markup_percent: 0
      });
      setNewItemPhoto(null);
      setNewItemPhotoPreview(null);
      setShowAddItem(false);
      toast({ title: 'Item added' });
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!localInvoice.id) return;
    try {
      await deleteItem.mutateAsync({ id: itemId, invoiceId: localInvoice.id });
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const startEditingItem = (item: InvoiceItem) => {
    setEditingItemId(item.id);
    setEditingItem({
      item_type: item.item_type,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      unit: item.unit,
      markup_percent: item.markup_percent
    });
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    setEditingItem({});
  };

  const handleSaveEditedItem = async () => {
    if (!editingItemId || !editingItem.item_name) {
      toast({ title: 'Item name required', variant: 'destructive' });
      return;
    }

    const quantity = editingItem.quantity || 1;
    const unitCost = editingItem.unit_cost || 0;
    const markup = editingItem.markup_percent || 0;
    const baseTotal = quantity * unitCost;
    const total = baseTotal + (baseTotal * markup / 100);

    try {
      await updateItem.mutateAsync({
        id: editingItemId,
        item_type: editingItem.item_type,
        item_name: editingItem.item_name,
        quantity,
        unit_cost: unitCost,
        unit: editingItem.unit,
        markup_percent: markup,
        total
      });
      setEditingItemId(null);
      setEditingItem({});
      toast({ title: 'Item updated' });
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setViewState('list');
      setSelectedInvoice(null);
      setLocalInvoice({});
    }
  }, [isOpen]);

  const initNewInvoice = () => {
    // Generate invoice number
    const timestamp = Date.now().toString().slice(-6);
    const invoiceNumber = `INV-${timestamp}`;
    
    setLocalInvoice({
      project_id: projectId,
      project_name: projectName || 'Untitled Project',
      customer_name: clientName || '',
      customer_email: clientEmail || '',
      address: address || '',
      status: 'draft',
      invoice_number: invoiceNumber,
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      total_amount: 0,
      subtotal: 0,
      balance_due: 0,
      payment_terms: 'net30'
    });
    setViewState('new');
  };

  const openInvoiceDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setLocalInvoice(invoice);
    setViewState('detail');
  };

  const handleFieldChange = (field: keyof Invoice, value: any) => {
    setLocalInvoice(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!localInvoice.customer_name) {
      toast({ title: 'Customer name is required', variant: 'destructive' });
      return;
    }

    try {
      if (localInvoice.id) {
        await updateInvoice.mutateAsync({ ...localInvoice, id: localInvoice.id } as Invoice & { id: string });
        toast({ title: 'Invoice saved' });
      } else {
        const newInvoice = await createInvoice.mutateAsync(localInvoice);
        setSelectedInvoice(newInvoice);
        setLocalInvoice(newInvoice);
        toast({ title: 'Invoice created' });
      }
      setViewState('list');
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDelete = async () => {
    if (localInvoice.id) {
      await deleteInvoice.mutateAsync({ id: localInvoice.id, projectId });
      setViewState('list');
      setShowDeleteConfirm(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    handleFieldChange('status', status);
    if (localInvoice.id) {
      await updateInvoice.mutateAsync({ id: localInvoice.id, status });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'submitted':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'draft':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return '✓';
      case 'submitted':
        return '→';
      default:
        return '○';
    }
  };

  const renderListView = () => (
    <>
      <SheetHeader className="px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <SheetTitle className="text-xl font-semibold">Invoices</SheetTitle>
          <Button size="sm" onClick={initNewInvoice} className="rounded-full">
            <Plus className="w-4 h-4 mr-1.5" />
            New
          </Button>
        </div>
      </SheetHeader>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-pulse">Loading invoices...</div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Receipt className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">No invoices yet</p>
              <p className="text-sm text-muted-foreground/70 mb-6">Create your first invoice for this project</p>
              <Button onClick={initNewInvoice} className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          ) : (
            invoices.map((invoice) => {
              const items = allInvoiceItems[invoice.id] || [];
              const itemsWithPhotos = items.filter(item => item.photo_url);
              const itemsWithoutPhotos = items.filter(item => !item.photo_url);
              
              return (
                <Card 
                  key={invoice.id} 
                  className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98]"
                  onClick={() => openInvoiceDetail(invoice)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-base">
                            {invoice.invoice_number || 'Draft Invoice'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {invoice.customer_name}
                        </p>
                        <div className="flex items-center gap-3">
                          <Badge className={cn("text-xs", getStatusColor(invoice.status))}>
                            {getStatusIcon(invoice.status)} {invoice.status}
                          </Badge>
                          {invoice.created_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-lg text-foreground">
                          {formatCurrency(invoice.total_amount)}
                        </span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                    </div>
                    
                    {/* Services & Items Preview */}
                    {items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        {/* Photo Thumbnails Row */}
                        <div className="flex items-center gap-1.5 mb-2">
                          {itemsWithPhotos.slice(0, 4).map((item) => (
                            <div 
                              key={item.id} 
                              className="w-8 h-8 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border/50"
                            >
                              <img 
                                src={item.photo_url} 
                                alt={item.item_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {/* Show type icons for items without photos */}
                          {itemsWithoutPhotos.slice(0, Math.max(0, 4 - itemsWithPhotos.length)).map((item) => {
                            const { icon: Icon, color } = getItemTypeInfo(item.item_type);
                            return (
                              <div 
                                key={item.id} 
                                className={cn(
                                  "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 border",
                                  color
                                )}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                            );
                          })}
                          {/* Overflow indicator */}
                          {items.length > 4 && (
                            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0 border border-border/50">
                              <span className="text-xs font-medium text-muted-foreground">+{items.length - 4}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Items Summary */}
                        <p className="text-xs text-muted-foreground truncate">
                          {items.length} item{items.length !== 1 ? 's' : ''}: {items.slice(0, 2).map(i => i.item_name).join(', ')}
                          {items.length > 2 && '...'}
                        </p>
                      </div>
                    )}
                    
                    {/* Payment Link Button */}
                    {invoice.invoice_number && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`${companyConfig.websiteUrl}/invoice/${invoice.invoice_number}`, '_blank');
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Payment Link
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </>
  );

  const renderDetailView = () => (
    <>
      <SheetHeader className="px-4 py-3 border-b border-border shrink-0 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setViewState('list')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <SheetTitle className="text-lg font-semibold">
              {localInvoice.invoice_number || 'New Invoice'}
            </SheetTitle>
          </div>
          {localInvoice.id && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </SheetHeader>
      
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-6">
          {/* Status Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
            <div className="flex gap-2 flex-wrap">
              {['draft', 'approved', 'submitted', 'paid'].map((status) => (
                <button 
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={cn(
                    "flex-1 min-w-[70px] py-3 px-3 rounded-xl text-sm font-medium transition-all border-2",
                    localInvoice.status === status 
                      ? status === 'paid' 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600'
                        : status === 'approved'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-600'
                          : status === 'submitted'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted border-border text-foreground'
                      : 'bg-background border-border/50 text-muted-foreground hover:border-border'
                  )}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Receipt className="w-4 h-4" />
                <Label className="text-sm font-medium">Services & Items</Label>
              </div>
              {localInvoice.id && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full h-8"
                  onClick={() => setShowAddItem(!showAddItem)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {/* Add Item Form */}
            {localInvoice.id && (
              <Collapsible open={showAddItem} onOpenChange={setShowAddItem}>
                <CollapsibleContent>
                  <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Type</Label>
                          <Select 
                            value={newItem.item_type || 'labor'} 
                            onValueChange={(v) => setNewItem(prev => ({ ...prev, item_type: v }))}
                          >
                            <SelectTrigger className="h-10 rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="labor">Labor</SelectItem>
                              <SelectItem value="material">Material</SelectItem>
                              <SelectItem value="equipment">Equipment</SelectItem>
                              <SelectItem value="subcontractor">Subcontractor</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Unit</Label>
                          <Select 
                            value={newItem.unit || 'EA'} 
                            onValueChange={(v) => setNewItem(prev => ({ ...prev, unit: v }))}
                          >
                            <SelectTrigger className="h-10 rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EA">Each</SelectItem>
                              <SelectItem value="SF">Sq Ft</SelectItem>
                              <SelectItem value="LF">Lin Ft</SelectItem>
                              <SelectItem value="SQ">Square</SelectItem>
                              <SelectItem value="HR">Hour</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <Input
                          value={newItem.item_name || ''}
                          onChange={(e) => setNewItem(prev => ({ ...prev, item_name: e.target.value }))}
                          placeholder="Service or item description"
                          className="h-10 rounded-lg"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Quantity</Label>
                          <Input
                            type="number"
                            value={newItem.quantity || ''}
                            onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                            className="h-10 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Unit Price</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                              type="number"
                              value={newItem.unit_cost || ''}
                              onChange={(e) => setNewItem(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                              className="h-10 rounded-lg pl-7"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Photo Upload for New Item */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Proof Photo (Optional)</Label>
                        {newItemPhotoPreview ? (
                          <div className="relative w-full h-24 rounded-lg overflow-hidden bg-muted">
                            <img 
                              src={newItemPhotoPreview} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => {
                                setNewItemPhoto(null);
                                setNewItemPhotoPreview(null);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPhotoPicker('new')}
                            className="flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors"
                          >
                            <Camera className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Add Photo</span>
                          </button>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full h-10 rounded-lg" 
                        onClick={handleAddItem}
                        disabled={createItem.isPending}
                      >
                        {createItem.isPending ? 'Adding...' : 'Add Item'}
                      </Button>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Items List */}
            {!localInvoice.id ? (
              <Card className="border border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Save the invoice first to add line items
                  </p>
                </CardContent>
              </Card>
            ) : invoiceItems.length === 0 && !showAddItem ? (
              <Card className="border border-dashed">
                <CardContent className="p-6 text-center">
                  <Receipt className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-3">No items added yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAddItem(true)}
                    className="rounded-full"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add First Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {invoiceItems.map((item) => {
                  const typeInfo = getItemTypeInfo(item.item_type);
                  const TypeIcon = typeInfo.icon;
                  const isEditing = editingItemId === item.id;
                  
                  if (isEditing) {
                    // Edit mode UI
                    return (
                      <Card key={item.id} className="border-2 border-primary/30 bg-primary/5">
                        <CardContent className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Type</Label>
                              <Select 
                                value={editingItem.item_type || 'labor'} 
                                onValueChange={(v) => setEditingItem(prev => ({ ...prev, item_type: v }))}
                              >
                                <SelectTrigger className="h-10 rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="labor">Labor</SelectItem>
                                  <SelectItem value="material">Material</SelectItem>
                                  <SelectItem value="equipment">Equipment</SelectItem>
                                  <SelectItem value="subcontractor">Subcontractor</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Unit</Label>
                              <Select 
                                value={editingItem.unit || 'EA'} 
                                onValueChange={(v) => setEditingItem(prev => ({ ...prev, unit: v }))}
                              >
                                <SelectTrigger className="h-10 rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="EA">Each</SelectItem>
                                  <SelectItem value="SF">Sq Ft</SelectItem>
                                  <SelectItem value="LF">Lin Ft</SelectItem>
                                  <SelectItem value="SQ">Square</SelectItem>
                                  <SelectItem value="HR">Hour</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <Input
                              value={editingItem.item_name || ''}
                              onChange={(e) => setEditingItem(prev => ({ ...prev, item_name: e.target.value }))}
                              placeholder="Service or item description"
                              className="h-10 rounded-lg"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Quantity</Label>
                              <Input
                                type="number"
                                value={editingItem.quantity || ''}
                                onChange={(e) => setEditingItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                className="h-10 rounded-lg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Unit Price</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input
                                  type="number"
                                  value={editingItem.unit_cost || ''}
                                  onChange={(e) => setEditingItem(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                                  className="h-10 rounded-lg pl-7"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              className="flex-1 h-10 rounded-lg"
                              onClick={cancelEditingItem}
                            >
                              Cancel
                            </Button>
                            <Button 
                              className="flex-1 h-10 rounded-lg"
                              onClick={handleSaveEditedItem}
                              disabled={updateItem.isPending}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              {updateItem.isPending ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  // Normal display mode
                  return (
                    <Card key={item.id} className="bg-muted/30">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {/* Photo thumbnail or upload button */}
                          <div className="shrink-0">
                            {item.photo_url ? (
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted">
                                <img 
                                  src={item.photo_url} 
                                  alt="Proof" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openPhotoPicker(item.id)}
                                className="flex items-center justify-center w-14 h-14 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors bg-background/50"
                              >
                                {uploadingPhotoFor === item.id ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                                ) : (
                                  <Camera className="w-5 h-5 text-muted-foreground" />
                                )}
                              </button>
                            )}
                          </div>
                          
                          {/* Item details - clickable to edit */}
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => startEditingItem(item)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={cn("text-xs", typeInfo.color)}>
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {typeInfo.label}
                              </Badge>
                              <Pencil className="w-3 h-3 text-muted-foreground/50" />
                            </div>
                            <p className="font-medium text-sm truncate">{item.item_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} {item.unit} × {formatCurrency(item.unit_cost)}
                            </p>
                          </div>
                          
                          {/* Price and actions */}
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {formatCurrency(item.total)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Total Summary */}
            <Card className="overflow-hidden border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <span className="font-medium">Total</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(localInvoice.id ? calculatedSubtotal : (localInvoice.total_amount || 0))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dates Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <Label className="text-sm font-medium">Dates</Label>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <Input
                  type="date"
                  value={localInvoice.due_date || ''}
                  onChange={(e) => handleFieldChange('due_date', e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Customer Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <Label className="text-sm font-medium">Customer Details</Label>
            </div>
            <Card className="border border-border/50">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    Name
                  </Label>
                  <Input
                    value={localInvoice.customer_name || ''}
                    onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                    placeholder="Customer name"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={localInvoice.customer_email || ''}
                    onChange={(e) => handleFieldChange('customer_email', e.target.value)}
                    placeholder="customer@example.com"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    Phone
                  </Label>
                  <Input
                    type="tel"
                    value={localInvoice.customer_phone || ''}
                    onChange={(e) => handleFieldChange('customer_phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    Address
                  </Label>
                  <Input
                    value={localInvoice.address || ''}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    placeholder="Property address"
                    className="h-12 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Terms & Description */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Payment Terms
              </Label>
              <Select value={localInvoice.payment_terms || 'net30'} onValueChange={(v) => handleFieldChange('payment_terms', v)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                  <SelectItem value="net15">Net 15</SelectItem>
                  <SelectItem value="net30">Net 30</SelectItem>
                  <SelectItem value="net45">Net 45</SelectItem>
                  <SelectItem value="net60">Net 60</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Description
              </Label>
              <Textarea
                value={localInvoice.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Invoice description or scope of work..."
                rows={4}
                className="rounded-xl resize-none"
              />
            </div>
          </div>

          {/* Bottom padding for action buttons */}
          <div className="h-4" />
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="p-4 border-t border-border shrink-0 bg-background/95 backdrop-blur-sm space-y-3">
        <Button 
          className="w-full h-12 rounded-xl text-base font-semibold" 
          onClick={handleSave} 
          disabled={createInvoice.isPending || updateInvoice.isPending}
        >
          {localInvoice.id ? 'Save Changes' : 'Create Invoice'}
        </Button>
        {localInvoice.id && localInvoice.invoice_number && (
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl text-base" 
            onClick={async () => {
              // Use production domain for shareable invoice links
              const productionDomain = 'https://www.roofingfriend.com';
              const paymentUrl = `${productionDomain}/invoice/${localInvoice.invoice_number}`;
              try {
                await navigator.clipboard.writeText(paymentUrl);
                toast({ 
                  title: 'Payment Link Copied!', 
                  description: 'You can now share this link via text message.' 
                });
              } catch (error) {
                toast({ 
                  title: 'Copy failed', 
                  description: 'Please copy the link manually.', 
                  variant: 'destructive' 
                });
              }
            }}
          >
            <Link2 className="w-4 h-4 mr-2" />
            Copy Payment Link
          </Button>
        )}
      </div>
    </>
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0 flex flex-col">
          {viewState === 'list' && renderListView()}
          {(viewState === 'detail' || viewState === 'new') && renderDetailView()}
        </SheetContent>
      </Sheet>

      {/* Photo Picker Sheet */}
      <Sheet open={showPhotoPicker} onOpenChange={setShowPhotoPicker}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Select Photo</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4">
            {/* Upload new option */}
            <div>
              <label className="flex items-center justify-center gap-3 h-14 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <Camera className="w-5 h-5 text-primary" />
                <span className="font-medium text-primary">Take or Upload New Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUploadFromPicker(file);
                    }
                  }}
                />
              </label>
            </div>
            
            {/* Existing project photos */}
            {projectPhotos.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Or select from project photos</Label>
                <ScrollArea className="h-[calc(70vh-180px)]">
                  <div className="grid grid-cols-3 gap-2">
                    {projectPhotos.map((photo) => (
                      <button
                        key={photo.id}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary focus:border-primary transition-colors"
                        onClick={() => selectProjectPhoto(photo.photo_url)}
                      >
                        <img 
                          src={photo.photo_url} 
                          alt={photo.caption || 'Project photo'} 
                          className="w-full h-full object-cover"
                        />
                        {photo.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                            <p className="text-[10px] text-white truncate">{photo.caption}</p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            {projectPhotos.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No project photos available yet
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this invoice. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground rounded-xl">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
