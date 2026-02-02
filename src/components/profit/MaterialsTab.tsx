import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Package, Receipt } from "lucide-react";
import { AddMaterialDialog } from "./AddMaterialDialog";
import { UploadInvoiceDialog } from "./UploadInvoiceDialog";
import { CreateBillDialog } from "./CreateBillDialog";
import { ReceiptCard } from "./ReceiptCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MaterialsTabProps {
  projectId: string;
  dateRange: { from: Date; to: Date };
  materialsData: any;
  onRefresh?: () => void;
}

interface GroupedReceipt {
  fileUrl: string | null;
  vendor: string;
  date: string;
  items: any[];
}

export function MaterialsTab({ projectId, dateRange, materialsData, onRefresh }: MaterialsTabProps) {
  const [showAddMaterialDialog, setShowAddMaterialDialog] = useState(false);
  const [showUploadInvoiceDialog, setShowUploadInvoiceDialog] = useState(false);
  const [showCreateBillDialog, setShowCreateBillDialog] = useState(false);
  
  // Load paid status from localStorage
  const [materialsPaid, setMaterialsPaid] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem(`materials-paid-${projectId}`);
    return stored ? JSON.parse(stored) : {};
  });
  
  const { toast } = useToast();

  // Group materials by file_url (receipt/invoice)
  const groupedReceipts = useMemo(() => {
    const groups: Record<string, GroupedReceipt> = {};
    
    materialsData.items.forEach((item: any) => {
      const key = item.file_url || 'manual-entries';
      
      if (!groups[key]) {
        groups[key] = {
          fileUrl: item.file_url || null,
          vendor: item.vendor || 'Unknown Vendor',
          date: item.date || new Date().toISOString(),
          items: [],
        };
      }
      
      groups[key].items.push(item);
      
      // Use the earliest date from items as the receipt date
      if (item.date && new Date(item.date) < new Date(groups[key].date)) {
        groups[key].date = item.date;
      }
    });
    
    // Sort by date descending (most recent first)
    return Object.values(groups).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [materialsData.items]);

  const toggleMaterialPaid = (materialId: string) => {
    setMaterialsPaid(prev => {
      const updated = { ...prev, [materialId]: !prev[materialId] };
      localStorage.setItem(`materials-paid-${projectId}`, JSON.stringify(updated));
      return updated;
    });
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleMarkReceived = async (materialId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { error } = await supabase
        .from('project_materials')
        .update({ 
          status: 'received',
          delivery_date: new Date().toISOString().split('T')[0],
          checked_by: userId
        })
        .eq('id', materialId);

      if (error) throw error;

      toast({
        title: "Material Updated",
        description: "Material marked as received successfully.",
      });
    } catch (error) {
      console.error('Error updating material:', error);
      toast({
        title: "Error",
        description: "Failed to update material status.",
        variant: "destructive",
      });
    }
  };

  const handleMarkReturned = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('project_materials')
        .update({ 
          status: 'returned',
          is_returned: true,
          return_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', materialId);

      if (error) throw error;

      toast({
        title: "Material Returned",
        description: "Material marked as returned successfully.",
      });
    } catch (error) {
      console.error('Error returning material:', error);
      toast({
        title: "Error",
        description: "Failed to return material.",
        variant: "destructive",
      });
    }
  };

  const totalCost = materialsData.total_cost || 0;

  return (
    <div className="space-y-6">
      {/* Materials Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Materials Summary</CardTitle>
          <CardDescription>
            Track material orders, deliveries, and costs for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Cost</span>
                <span className="text-2xl font-bold">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Line Items</span>
                <span className="font-medium">{materialsData.totalLineItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vendors</span>
                <span className="font-medium">{materialsData.uniqueVendors}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bills Pending</span>
                <span className="font-medium text-yellow-600">{materialsData.pendingBills}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deliveries Pending</span>
                <span className="font-medium text-orange-600">{materialsData.pendingDeliveries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Partial Deliveries</span>
                <span className="font-medium text-red-600">{materialsData.partialDeliveries}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => setShowCreateBillDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Bill
            </Button>
            <Button 
              onClick={() => setShowAddMaterialDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Add Material
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowUploadInvoiceDialog(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Invoice
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowUploadInvoiceDialog(true)}
              className="flex items-center gap-2"
            >
              <Receipt className="h-4 w-4" />
              Upload Receipt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Receipts & Invoices - Full Width Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Receipts & Invoices
            {groupedReceipts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {groupedReceipts.length} receipt{groupedReceipts.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            All materials are grouped by receipt with item names and details visible
          </CardDescription>
        </CardHeader>
        <CardContent>
          {groupedReceipts.length > 0 ? (
            <div className="space-y-4">
              {groupedReceipts.map((receipt, index) => (
                <ReceiptCard
                  key={receipt.fileUrl || `manual-${index}`}
                  fileUrl={receipt.fileUrl}
                  vendor={receipt.vendor}
                  date={receipt.date}
                  items={receipt.items}
                  onMarkReceived={handleMarkReceived}
                  onMarkReturned={handleMarkReturned}
                  materialsPaid={materialsPaid}
                  toggleMaterialPaid={toggleMaterialPaid}
                  onItemsUpdated={onRefresh}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No receipts or invoices yet</p>
              <p className="text-sm">Upload a receipt or invoice to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reconciliation */}
      {materialsData.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <h4 className="font-medium">Review Potential Duplicates</h4>
                <p className="text-sm text-muted-foreground">
                  Check for duplicate entries from different sources
                </p>
              </div>
              <Button variant="outline">
                Review Duplicates
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateBillDialog
        open={showCreateBillDialog}
        onOpenChange={setShowCreateBillDialog}
        projectId={projectId}
      />

      <AddMaterialDialog 
        open={showAddMaterialDialog}
        onOpenChange={setShowAddMaterialDialog}
        projectId={projectId}
      />
      
      <UploadInvoiceDialog 
        open={showUploadInvoiceDialog}
        onOpenChange={setShowUploadInvoiceDialog}
        projectId={projectId}
      />
    </div>
  );
}