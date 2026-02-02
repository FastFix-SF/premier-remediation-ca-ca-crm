import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ZoomableImage } from "@/components/ui/zoomable-image";
import { format } from "date-fns";
import { Check, Circle, ZoomIn, FileText, Package, DollarSign, CheckCircle2, Clock, Receipt, Eye, Pencil, Save, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MaterialItem {
  id: string;
  date: string;
  status: string;
  vendor: string;
  item?: string;
  item_description?: string;
  item_code?: string;
  quantity_ordered?: number;
  quantity?: number;
  quantity_received?: number;
  quantity_remaining?: number;
  unit_price: number;
  total_amount?: number;
  material_bills?: { bill_number: string } | null;
  profiles?: { display_name: string } | null;
}

interface EditableItem {
  id: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  isDeleted?: boolean;
}

interface ReceiptCardProps {
  fileUrl: string | null;
  vendor: string;
  date: string;
  items: MaterialItem[];
  onMarkReceived: (id: string) => void;
  onMarkReturned: (id: string) => void;
  materialsPaid: Record<string, boolean>;
  toggleMaterialPaid: (id: string) => void;
  onItemsUpdated?: () => void;
}

export function ReceiptCard({
  fileUrl,
  vendor,
  date,
  items,
  onMarkReceived,
  onMarkReturned,
  materialsPaid,
  toggleMaterialPaid,
  onItemsUpdated,
}: ReceiptCardProps) {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<EditableItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const totalAmount = items.reduce((sum, item) => sum + (item.total_amount || 0), 0);
  const itemCount = items.length;
  const receivedCount = items.filter(item => item.status === 'received').length;
  const pendingCount = items.filter(item => item.status === 'pending').length;
  const returnedCount = items.filter(item => item.status === 'returned').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'returned':
        return <Circle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/50';
      case 'returned':
        return 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/50';
      default:
        return 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50';
    }
  };

  const startEditing = () => {
    setEditedItems(items.map(item => ({
      id: item.id,
      item_description: item.item_description || item.item || item.item_code || '',
      quantity: item.quantity_ordered || item.quantity || 0,
      unit_price: item.unit_price || 0,
      total_amount: item.total_amount || 0,
      isDeleted: false,
    })));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedItems([]);
  };

  const updateEditedItem = (id: string, field: keyof EditableItem, value: string | number | boolean) => {
    setEditedItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      // Auto-calculate total when quantity or unit_price changes
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? Number(value) : item.quantity;
        const price = field === 'unit_price' ? Number(value) : item.unit_price;
        updated.total_amount = qty * price;
      }
      
      return updated;
    }));
  };

  const markItemForDeletion = (id: string) => {
    setEditedItems(prev => prev.map(item => 
      item.id === id ? { ...item, isDeleted: true } : item
    ));
  };

  const restoreItem = (id: string) => {
    setEditedItems(prev => prev.map(item => 
      item.id === id ? { ...item, isDeleted: false } : item
    ));
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      // Delete items marked for deletion
      const itemsToDelete = editedItems.filter(item => item.isDeleted);
      if (itemsToDelete.length > 0) {
        const deleteIds = itemsToDelete.map(item => item.id);
        const { data: deletedRows, error } = await supabase
          .from('project_materials')
          .delete()
          .in('id', deleteIds)
          .select();
        
        if (error) throw error;
        
        if (!deletedRows || deletedRows.length !== deleteIds.length) {
          throw new Error(`Failed to delete some items - you may not have permission`);
        }
      }

      // Update remaining items
      const itemsToUpdate = editedItems.filter(item => !item.isDeleted);
      for (const editedItem of itemsToUpdate) {
        const { error } = await supabase
          .from('project_materials')
          .update({
            item_description: editedItem.item_description,
            quantity_ordered: editedItem.quantity,
            quantity: editedItem.quantity,
            unit_price: editedItem.unit_price,
            total_amount: editedItem.total_amount,
          })
          .eq('id', editedItem.id);

        if (error) throw error;
      }

      toast({
        title: "Changes Saved",
        description: `Updated ${itemsToUpdate.length} items${itemsToDelete.length > 0 ? `, deleted ${itemsToDelete.length} items` : ''}.`,
      });
      
      setIsEditing(false);
      setEditedItems([]);
      setShowDetailsDialog(false);
      onItemsUpdated?.();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntireReceipt = async () => {
    setIsDeleting(true);
    try {
      // Delete all items in batch with verification
      const itemIds = items.map(item => item.id);
      const { data: deletedRows, error } = await supabase
        .from('project_materials')
        .delete()
        .in('id', itemIds)
        .select();
      
      if (error) throw error;
      
      // Check if all rows were deleted
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error('No items were deleted - you may not have permission to delete materials');
      }
      
      if (deletedRows.length !== items.length) {
        throw new Error(`Only deleted ${deletedRows.length} of ${items.length} items - permission issue`);
      }

      toast({
        title: "Receipt Deleted",
        description: `Deleted ${items.length} items from ${vendor}.`,
      });
      
      setShowDetailsDialog(false);
      onItemsUpdated?.();
    } catch (error: any) {
      console.error('Error deleting receipt:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { data: deletedRows, error } = await supabase
        .from('project_materials')
        .delete()
        .eq('id', itemId)
        .select();
      
      if (error) throw error;
      
      // Check if the row was actually deleted
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error('Item was not deleted - you may not have permission to delete materials');
      }

      toast({
        title: "Item Deleted",
        description: "The item has been removed.",
      });
      
      onItemsUpdated?.();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getEditedTotal = () => {
    return editedItems
      .filter(item => !item.isDeleted)
      .reduce((sum, item) => sum + (item.total_amount || 0), 0);
  };

  const activeEditedItems = editedItems.filter(item => !item.isDeleted);
  const deletedEditedItems = editedItems.filter(item => item.isDeleted);

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{vendor || 'Unknown Vendor'}</h3>
                <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              <p className="text-sm text-muted-foreground">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Main Content - Two Panel Layout */}
          <div className="flex flex-col lg:flex-row">
            {/* Left Panel - Receipt Image */}
            {fileUrl && (
              <div className="lg:w-64 lg:flex-shrink-0 p-4 border-b lg:border-b-0 lg:border-r bg-muted/10">
                <div 
                  className="relative group cursor-pointer rounded-lg overflow-hidden border bg-background"
                  onClick={() => setShowImageDialog(true)}
                >
                  <img
                    src={fileUrl}
                    alt="Receipt"
                    className="w-full h-48 lg:h-64 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-black/90 rounded-full p-3">
                      <ZoomIn className="h-6 w-6" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">Click to view full size</p>
              </div>
            )}

            {/* No image placeholder */}
            {!fileUrl && (
              <div className="lg:w-64 lg:flex-shrink-0 p-4 border-b lg:border-b-0 lg:border-r bg-muted/10 flex items-center justify-center">
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No receipt image</p>
                </div>
              </div>
            )}

            {/* Right Panel - Items List */}
            <div className="flex-1 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Items Purchased</h4>
                <div className="flex gap-2">
                  {receivedCount > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {receivedCount} received
                    </Badge>
                  )}
                  {pendingCount > 0 && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800">
                      <Clock className="h-3 w-3 mr-1" />
                      {pendingCount} pending
                    </Badge>
                  )}
                  {returnedCount > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800">
                      {returnedCount} returned
                    </Badge>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      item.status === 'received' 
                        ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
                        : item.status === 'returned'
                        ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.item_description || item.item || item.item_code || 'Unknown Item'}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity_ordered || item.quantity || 0} × {formatCurrency(item.unit_price || 0)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold">{formatCurrency(item.total_amount || 0)}</p>
                      <Badge variant="secondary" className={`text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats & Actions */}
              <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{itemCount} items</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowDetailsDialog(true);
                      startEditing();
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Items
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDetailsDialog(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Size Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{vendor} - {formatDate(date)}</DialogTitle>
          </DialogHeader>
          <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
            {fileUrl && (
              <ZoomableImage
                src={fileUrl}
                alt="Receipt"
                className="w-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Details Dialog with Edit Mode */}
      <Dialog open={showDetailsDialog} onOpenChange={(open) => {
        if (!open) {
          cancelEditing();
        }
        setShowDetailsDialog(open);
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="block">{vendor}</span>
                  <span className="text-sm font-normal text-muted-foreground">{formatDate(date)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={startEditing}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit All
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Receipt
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Entire Receipt?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all {items.length} items from {vendor}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={deleteEntireReceipt}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete All Items'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isSaving}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveChanges} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Receipt Image */}
            {fileUrl && (
              <div className="lg:col-span-1">
                <div className="sticky top-0">
                  <p className="text-sm font-medium mb-2">Receipt Image</p>
                  <div 
                    className="rounded-lg overflow-hidden border cursor-pointer"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      setShowImageDialog(true);
                    }}
                  >
                    <img
                      src={fileUrl}
                      alt="Receipt"
                      className="w-full object-contain max-h-96"
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">Click to zoom</p>
                </div>
              </div>
            )}

            {/* Full Items Table */}
            <div className={fileUrl ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <p className="text-sm font-medium mb-2">
                {isEditing ? (
                  <>
                    Items ({activeEditedItems.length})
                    <span className="text-primary ml-2">— Editing Mode</span>
                    {deletedEditedItems.length > 0 && (
                      <span className="text-destructive ml-2">({deletedEditedItems.length} to delete)</span>
                    )}
                  </>
                ) : (
                  `All Items (${items.length})`
                )}
              </p>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Item Name</TableHead>
                      <TableHead className="text-center w-24">Qty</TableHead>
                      <TableHead className="text-right w-28">Unit Price</TableHead>
                      <TableHead className="text-right w-28">Total</TableHead>
                      <TableHead className="text-center w-24">Status</TableHead>
                      {!isEditing && <TableHead className="text-center w-16">Paid</TableHead>}
                      <TableHead className="text-right w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isEditing ? (
                      <>
                        {activeEditedItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Input
                                value={item.item_description}
                                onChange={(e) => updateEditedItem(item.id, 'item_description', e.target.value)}
                                className="h-8"
                                placeholder="Item name"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateEditedItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="h-8 text-center w-20"
                                min={0}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => updateEditedItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="h-8 text-right w-24"
                                min={0}
                                step={0.01}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.total_amount}
                                onChange={(e) => updateEditedItem(item.id, 'total_amount', parseFloat(e.target.value) || 0)}
                                className="h-8 text-right w-24"
                                min={0}
                                step={0.01}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className={getStatusColor(items.find(i => i.id === item.id)?.status || 'pending')}>
                                {items.find(i => i.id === item.id)?.status || 'pending'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markItemForDeletion(item.id)}
                                className="h-7 text-xs text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {deletedEditedItems.map((item) => (
                          <TableRow key={item.id} className="bg-destructive/10 opacity-60">
                            <TableCell colSpan={5} className="text-muted-foreground line-through">
                              {item.item_description} — {formatCurrency(item.total_amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => restoreItem(item.id)}
                                className="h-7 text-xs"
                              >
                                Undo
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.item_description || item.item || item.item_code || 'Unknown Item'}</TableCell>
                          <TableCell className="text-center">{item.quantity_ordered || item.quantity || 0}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price || 0)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.total_amount || 0)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={materialsPaid[item.id] || false}
                              onCheckedChange={() => toggleMaterialPaid(item.id)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {item.status !== 'received' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onMarkReceived(item.id)}
                                  className="h-7 text-xs"
                                >
                                  Received
                                </Button>
                              )}
                              {item.status !== 'returned' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onMarkReturned(item.id)}
                                  className="h-7 text-xs text-amber-600 hover:text-amber-700"
                                >
                                  Returned
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete "{item.item_description || item.item || 'this item'}". This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteItem(item.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete Item
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Summary */}
              <div className="mt-4 p-4 bg-muted/30 rounded-lg flex items-center justify-between">
                <div className="flex gap-4 text-sm">
                  <span><strong>{receivedCount}</strong> received</span>
                  <span><strong>{pendingCount}</strong> pending</span>
                  {returnedCount > 0 && <span><strong>{returnedCount}</strong> returned</span>}
                </div>
                <div className="text-lg font-bold">
                  Total: {formatCurrency(isEditing ? getEditedTotal() : totalAmount)}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
