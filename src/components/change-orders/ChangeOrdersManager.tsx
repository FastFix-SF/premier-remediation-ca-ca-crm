import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  FileText, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
} from 'lucide-react';
import { useChangeOrders, useChangeOrderStats, ChangeOrder } from '@/hooks/useChangeOrders';
import { ChangeOrderDialog } from './ChangeOrderDialog';
import { ChangeOrderCard } from './ChangeOrderCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const STATUS_COLUMNS = [
  { key: 'on_hold', label: 'On Hold', color: 'bg-yellow-500/10 border-yellow-500/30' },
  { key: 'open', label: 'Open', color: 'bg-blue-500/10 border-blue-500/30' },
  { key: 'pending_approval', label: 'Pending Approval', color: 'bg-purple-500/10 border-purple-500/30' },
  { key: 'unbilled_approved', label: 'Unbilled/Approved', color: 'bg-green-500/10 border-green-500/30' },
  { key: 'billed', label: 'Billed', color: 'bg-emerald-500/10 border-emerald-500/30' },
  { key: 'denied', label: 'Denied', color: 'bg-red-500/10 border-red-500/30' },
] as const;

export function ChangeOrdersManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();

  const { data: orders = [], isLoading } = useChangeOrders();
  const { data: stats } = useChangeOrderStats();

  const filteredOrders = orders.filter(order => 
    order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.co_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.projects?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOrdersByStatus = (status: string) => 
    filteredOrders.filter(order => order.status === status);

  const handleEdit = (id: string) => {
    setSelectedOrderId(id);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedOrderId(undefined);
    setDialogOpen(true);
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Hold</CardTitle>
            <PauseCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.onHold || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.open || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingApproval || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unbilledApproved || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billed</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.billed || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.denied || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search change orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Change Order
        </Button>
      </div>

      {/* Kanban Board */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {STATUS_COLUMNS.map((column) => {
            const columnOrders = getOrdersByStatus(column.key);
            return (
              <div 
                key={column.key}
                className={`flex-shrink-0 w-72 rounded-lg border ${column.color}`}
              >
                <div className="p-3 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{column.label}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnOrders.length}
                    </Badge>
                  </div>
                </div>
                <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Loading...
                    </div>
                  ) : columnOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No change orders
                    </div>
                  ) : (
                    columnOrders.map((order) => (
                      <ChangeOrderCard 
                        key={order.id} 
                        order={order} 
                        onClick={() => handleEdit(order.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Dialog */}
      <ChangeOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        changeOrderId={selectedOrderId}
      />
    </div>
  );
}
