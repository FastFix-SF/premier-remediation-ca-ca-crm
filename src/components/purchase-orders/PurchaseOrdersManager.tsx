import { useState } from 'react';
import { usePurchaseOrders, PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { POCard } from './POCard';
import { PODialog } from './PODialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Loader2, ShoppingCart } from 'lucide-react';

const PO_COLUMNS = [
  { key: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { key: 'pricing_requested', label: 'Pricing Requested', color: 'bg-yellow-500' },
  { key: 'approved', label: 'Approved', color: 'bg-blue-500' },
  { key: 'submitted', label: 'Submitted', color: 'bg-purple-500' },
  { key: 'received', label: 'Received', color: 'bg-green-500' },
  { key: 'closed', label: 'Closed', color: 'bg-emerald-500' },
];

export const PurchaseOrdersManager = () => {
  const { purchaseOrders, isLoading, createPurchaseOrder } = usePurchaseOrders();
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPOs = purchaseOrders?.filter((po) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      po.title?.toLowerCase().includes(query) ||
      po.supplier?.toLowerCase().includes(query) ||
      po.po_number?.toLowerCase().includes(query) ||
      po.ship_to?.toLowerCase().includes(query)
    );
  });

  const getPOsByStatus = (status: string) => {
    return filteredPOs?.filter((po) => (po.status || 'draft') === status) || [];
  };

  const handleCreatePO = async () => {
    const result = await createPurchaseOrder.mutateAsync({
      title: 'New Purchase Order',
      status: 'draft',
      order_date: new Date().toISOString().split('T')[0],
    });
    setSelectedPO(result);
    setDialogOpen(true);
  };

  const handleCardClick = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Purchase Orders
          </h2>
          <p className="text-muted-foreground text-sm">
            {purchaseOrders?.length || 0} total orders
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search purchase orders..."
              className="pl-9"
            />
          </div>
          <Button onClick={handleCreatePO} disabled={createPurchaseOrder.isPending}>
            {createPurchaseOrder.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            New PO
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 h-full">
          {PO_COLUMNS.map((column) => {
            const columnPOs = getPOsByStatus(column.key);
            return (
              <div key={column.key} className="flex flex-col bg-muted/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-medium text-xs">{column.label}</h3>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {columnPOs.length}
                  </span>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-3 pr-2">
                    {columnPOs.map((po) => (
                      <POCard
                        key={po.id}
                        po={po}
                        onClick={() => handleCardClick(po)}
                      />
                    ))}
                    {columnPOs.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-xs">
                        No orders
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog */}
      <PODialog
        po={selectedPO}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};
