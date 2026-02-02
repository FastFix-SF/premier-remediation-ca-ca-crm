import React, { useState, useMemo } from 'react';
import { Plus, Search, LayoutGrid, List, Filter, ChevronRight, Calendar, User, MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEstimates, ESTIMATE_STATUSES, Estimate } from '@/hooks/useEstimates';
import { CreateEstimateDialog } from './CreateEstimateDialog';
import { EstimateDetailView } from './EstimateDetailView';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function EstimatesManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  
  const { data: estimates = [], isLoading } = useEstimates();

  const filteredEstimates = useMemo(() => {
    if (!searchQuery) return estimates;
    const query = searchQuery.toLowerCase();
    return estimates.filter(estimate => 
      estimate.customer_name?.toLowerCase().includes(query) ||
      estimate.customer_address?.toLowerCase().includes(query) ||
      estimate.estimate_number?.toLowerCase().includes(query) ||
      estimate.title?.toLowerCase().includes(query)
    );
  }, [estimates, searchQuery]);

  const estimatesByStatus = useMemo(() => {
    const grouped: Record<string, Estimate[]> = {};
    ESTIMATE_STATUSES.forEach(status => {
      grouped[status.value] = filteredEstimates.filter(e => e.status === status.value);
    });
    return grouped;
  }, [filteredEstimates]);

  const statusTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    ESTIMATE_STATUSES.forEach(status => {
      totals[status.value] = estimatesByStatus[status.value]?.reduce((sum, e) => sum + (e.grand_total || 0), 0) || 0;
    });
    return totals;
  }, [estimatesByStatus]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (selectedEstimate) {
    return (
      <EstimateDetailView 
        estimate={selectedEstimate} 
        onBack={() => setSelectedEstimate(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Estimates</h2>
          <p className="text-muted-foreground">Manage your project estimates and bids</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Estimate
        </Button>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search estimates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading estimates...</div>
      ) : viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ESTIMATE_STATUSES.map((status) => (
            <div key={status.value} className="flex-shrink-0 w-80">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", status.color)} />
                      <CardTitle className="text-sm font-medium">{status.label}</CardTitle>
                      <Badge variant="secondary" className="ml-1">
                        {estimatesByStatus[status.value]?.length || 0}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {formatCurrency(statusTotals[status.value])}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto">
                  {estimatesByStatus[status.value]?.map((estimate) => (
                    <EstimateCard 
                      key={estimate.id} 
                      estimate={estimate} 
                      onClick={() => setSelectedEstimate(estimate)}
                    />
                  ))}
                  {estimatesByStatus[status.value]?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No estimates
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Estimate #</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Address</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Total</th>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEstimates.map((estimate) => {
                    const statusInfo = ESTIMATE_STATUSES.find(s => s.value === estimate.status);
                    return (
                      <tr 
                        key={estimate.id} 
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedEstimate(estimate)}
                      >
                        <td className="p-4 font-medium">{estimate.estimate_number}</td>
                        <td className="p-4">{estimate.customer_name || '-'}</td>
                        <td className="p-4 max-w-[200px] truncate">{estimate.customer_address || '-'}</td>
                        <td className="p-4">
                          <Badge className={cn(statusInfo?.color, 'text-white')}>
                            {statusInfo?.label || estimate.status}
                          </Badge>
                        </td>
                        <td className="p-4 font-medium">{formatCurrency(estimate.grand_total || 0)}</td>
                        <td className="p-4 text-muted-foreground">
                          {format(new Date(estimate.estimate_date), 'MMM d, yyyy')}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {estimate.expiration_date 
                            ? format(new Date(estimate.expiration_date), 'MMM d, yyyy')
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredEstimates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No estimates found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <CreateEstimateDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        onSuccess={(estimate) => setSelectedEstimate(estimate)}
      />
    </div>
  );
}

function EstimateCard({ estimate, onClick }: { estimate: Estimate; onClick: () => void }) {
  const statusInfo = ESTIMATE_STATUSES.find(s => s.value === estimate.status);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: statusInfo?.color?.replace('bg-', '').includes('blue') ? '#3b82f6' : 
        statusInfo?.color?.replace('bg-', '').includes('yellow') ? '#eab308' :
        statusInfo?.color?.replace('bg-', '').includes('purple') ? '#a855f7' :
        statusInfo?.color?.replace('bg-', '').includes('orange') ? '#f97316' :
        statusInfo?.color?.replace('bg-', '').includes('green') ? '#22c55e' :
        statusInfo?.color?.replace('bg-', '').includes('emerald') ? '#10b981' :
        statusInfo?.color?.replace('bg-', '').includes('red') ? '#ef4444' : '#6b7280' }}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{estimate.estimate_number}</p>
            <p className="font-medium text-sm line-clamp-1">
              {estimate.customer_address || estimate.title || 'Untitled Estimate'}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <DollarSign className="h-3 w-3" />
          <span className="font-semibold text-foreground">
            {formatCurrency(estimate.grand_total || 0)}
          </span>
        </div>

        {estimate.customer_name && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{estimate.customer_name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {estimate.project_type && (
            <Badge variant="outline" className="text-xs">
              {estimate.project_type}
            </Badge>
          )}
          {estimate.sector && (
            <Badge variant="outline" className="text-xs">
              {estimate.sector?.replace('_', ' ')}
            </Badge>
          )}
        </div>

        {estimate.expiration_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Expires {format(new Date(estimate.expiration_date), 'MMM d')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
