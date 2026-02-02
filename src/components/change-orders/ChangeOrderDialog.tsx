import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  useChangeOrder, 
  useCreateChangeOrder, 
  useUpdateChangeOrder,
  ChangeOrder,
} from '@/hooks/useChangeOrders';
import { CODetailsTab } from './tabs/CODetailsTab';
import { COItemsTab } from './tabs/COItemsTab';
import { COFilesTab } from './tabs/COFilesTab';
import { CONotesTab } from './tabs/CONotesTab';
import { COStatusStepper } from './COStatusStepper';
import { toast } from 'sonner';

interface ChangeOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changeOrderId?: string;
  defaultProjectId?: string;
}

export function ChangeOrderDialog({ open, onOpenChange, changeOrderId: initialChangeOrderId, defaultProjectId }: ChangeOrderDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [currentChangeOrderId, setCurrentChangeOrderId] = useState<string | undefined>(initialChangeOrderId);
  
  const { data: changeOrder, isLoading } = useChangeOrder(currentChangeOrderId);
  const createMutation = useCreateChangeOrder();
  const updateMutation = useUpdateChangeOrder();

  const [formData, setFormData] = useState<Partial<ChangeOrder>>({
    title: '',
    description: '',
    status: 'open',
    date: new Date().toISOString().split('T')[0],
    requested_by: '',
    customer_co_number: '',
    time_delay: '',
    associated_rfi: '',
    estimated_cost: 0,
    profit_margin: 7,
    sub_total: 0,
    tax: 0,
    grand_total: 0,
    is_no_cost: false,
    project_id: defaultProjectId,
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCurrentChangeOrderId(initialChangeOrderId);
      setActiveTab('details');
    }
  }, [open, initialChangeOrderId]);

  useEffect(() => {
    if (changeOrder) {
      setFormData({
        title: changeOrder.title || '',
        description: changeOrder.description || '',
        status: changeOrder.status || 'open',
        date: changeOrder.date || new Date().toISOString().split('T')[0],
        project_id: changeOrder.project_id || undefined,
        customer_id: changeOrder.customer_id || undefined,
        requested_by: changeOrder.requested_by || '',
        customer_co_number: changeOrder.customer_co_number || '',
        time_delay: changeOrder.time_delay || '',
        associated_rfi: changeOrder.associated_rfi || '',
        project_manager_id: changeOrder.project_manager_id || undefined,
        estimator_id: changeOrder.estimator_id || undefined,
        estimated_cost: changeOrder.estimated_cost || 0,
        profit_margin: changeOrder.profit_margin || 7,
        sub_total: changeOrder.sub_total || 0,
        tax: changeOrder.tax || 0,
        grand_total: changeOrder.grand_total || 0,
        is_no_cost: changeOrder.is_no_cost || false,
        approved_by: changeOrder.approved_by || '',
      });
    } else if (!currentChangeOrderId) {
      setFormData({
        title: '',
        description: '',
        status: 'open',
        date: new Date().toISOString().split('T')[0],
        requested_by: '',
        customer_co_number: '',
        time_delay: '',
        associated_rfi: '',
        estimated_cost: 0,
        profit_margin: 7,
        sub_total: 0,
        tax: 0,
        grand_total: 0,
        is_no_cost: false,
        project_id: defaultProjectId,
      });
    }
  }, [changeOrder, currentChangeOrderId, defaultProjectId]);

  const handleSave = async () => {
    if (currentChangeOrderId) {
      await updateMutation.mutateAsync({ id: currentChangeOrderId, ...formData });
      toast.success('Change order updated');
    } else {
      const result = await createMutation.mutateAsync(formData);
      if (result?.id) {
        setCurrentChangeOrderId(result.id);
        toast.success('Change order created');
      }
    }
  };

  const handleTabChange = async (newTab: string) => {
    const requiresId = ['items', 'files', 'notes'].includes(newTab);
    
    if (requiresId && !currentChangeOrderId) {
      if (!formData.title?.trim()) {
        toast.error('Please enter a title before accessing this tab');
        return;
      }
      
      try {
        const result = await createMutation.mutateAsync(formData);
        if (result?.id) {
          setCurrentChangeOrderId(result.id);
          toast.success('Change order saved');
          setActiveTab(newTab);
        }
      } catch {
        toast.error('Failed to save change order');
      }
    } else {
      setActiveTab(newTab);
    }
  };

  const handleStatusChange = async (newStatus: ChangeOrder['status']) => {
    if (currentChangeOrderId) {
      await updateMutation.mutateAsync({ id: currentChangeOrderId, status: newStatus });
      setFormData(prev => ({ ...prev, status: newStatus }));
    }
  };

  const isEditing = !!currentChangeOrderId;

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      on_hold: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      open: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      pending_approval: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      unbilled_approved: 'bg-green-500/10 text-green-600 border-green-500/20',
      billed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      denied: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    return colors[status] || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>
              {isEditing ? 'Edit Change Order' : 'New Change Order'}
            </DialogTitle>
            {changeOrder?.co_number && (
              <Badge variant="outline" className="font-mono">
                {changeOrder.co_number}
              </Badge>
            )}
            {formData.status && (
              <Badge variant="outline" className={getStatusBadgeColor(formData.status)}>
                {formData.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {isLoading && currentChangeOrderId ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <>
            {isEditing && (
              <COStatusStepper 
                currentStatus={formData.status || 'open'} 
                onStatusChange={handleStatusChange}
              />
            )}

            <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <CODetailsTab
                  formData={formData}
                  setFormData={setFormData}
                  onSave={handleSave}
                  isEditing={isEditing}
                  isSaving={createMutation.isPending || updateMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="items" className="mt-4">
                <COItemsTab changeOrderId={currentChangeOrderId} />
              </TabsContent>

              <TabsContent value="files" className="mt-4">
                <COFilesTab changeOrderId={currentChangeOrderId} />
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <CONotesTab changeOrderId={currentChangeOrderId} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
