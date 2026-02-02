import React, { useState } from 'react';
import { ArrowLeft, Check, MoreHorizontal, Send, Printer, FileDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Estimate, ESTIMATE_STATUSES, useUpdateEstimate, useDeleteEstimate } from '@/hooks/useEstimates';
import { EstimateDetailsTab } from './tabs/EstimateDetailsTab';
import { EstimateItemsTab } from './tabs/EstimateItemsTab';
import { EstimateTermsTab } from './tabs/EstimateTermsTab';
import { EstimateScopeTab } from './tabs/EstimateScopeTab';
import { EstimateBiddingTab } from './tabs/EstimateBiddingTab';
import { EstimateFilesTab } from './tabs/EstimateFilesTab';
import { EstimateCoverSheetTab } from './tabs/EstimateCoverSheetTab';
import { EstimateNotesTab } from './tabs/EstimateNotesTab';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EstimateDetailViewProps {
  estimate: Estimate;
  onBack: () => void;
}

const STATUS_ORDER = ['bidding', 'on_hold', 'pending_approval', 'completed', 'approved'];

export function EstimateDetailView({ estimate, onBack }: EstimateDetailViewProps) {
  const [activeTab, setActiveTab] = useState('details');
  const updateEstimate = useUpdateEstimate();
  const deleteEstimate = useDeleteEstimate();

  const statusInfo = ESTIMATE_STATUSES.find(s => s.value === estimate.status);
  const currentStatusIndex = STATUS_ORDER.indexOf(estimate.status);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateEstimate.mutateAsync({
      id: estimate.id,
      status: newStatus,
    });
  };

  const handleDelete = async () => {
    await deleteEstimate.mutateAsync(estimate.id);
    onBack();
  };

  const sidebarTabs = [
    { id: 'details', label: 'Details' },
    { id: 'items', label: 'Items' },
    { id: 'terms', label: 'Terms' },
    { id: 'scope', label: 'Scope of Work' },
    { id: 'bidding', label: 'Bidding' },
    { id: 'files', label: 'Files' },
    { id: 'cover-sheet', label: 'Cover Sheet' },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {estimate.customer_address || estimate.title || 'Estimate'}
              </h1>
              <Badge className={cn(statusInfo?.color, 'text-white')}>
                {statusInfo?.label || estimate.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {estimate.estimate_number} • Created {format(new Date(estimate.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            Send
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ESTIMATE_STATUSES.map((status) => (
                <DropdownMenuItem 
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  disabled={estimate.status === status.value}
                >
                  Move to {status.label}
                </DropdownMenuItem>
              ))}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Estimate
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Estimate</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this estimate? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status Stepper */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            {STATUS_ORDER.map((status, index) => {
              const statusData = ESTIMATE_STATUSES.find(s => s.value === status);
              const isCompleted = currentStatusIndex > index;
              const isCurrent = estimate.status === status;
              
              return (
                <React.Fragment key={status}>
                  <div className="flex flex-col items-center gap-2">
                    <div 
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        isCompleted ? "bg-primary text-primary-foreground" :
                        isCurrent ? statusData?.color + " text-white" :
                        "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className={cn(
                      "text-xs whitespace-nowrap",
                      isCurrent ? "font-medium" : "text-muted-foreground"
                    )}>
                      {statusData?.label}
                    </span>
                  </div>
                  {index < STATUS_ORDER.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2",
                      currentStatusIndex > index ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
        {/* Sidebar Navigation */}
        <Card className="h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {sidebarTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Tab Content */}
        <div>
          {activeTab === 'details' && <EstimateDetailsTab estimate={estimate} />}
          {activeTab === 'items' && <EstimateItemsTab estimate={estimate} />}
          {activeTab === 'terms' && <EstimateTermsTab estimate={estimate} />}
          {activeTab === 'scope' && <EstimateScopeTab estimate={estimate} />}
          {activeTab === 'bidding' && <EstimateBiddingTab estimate={estimate} />}
          {activeTab === 'files' && <EstimateFilesTab estimate={estimate} />}
          {activeTab === 'cover-sheet' && <EstimateCoverSheetTab estimate={estimate} />}
          {activeTab === 'notes' && <EstimateNotesTab estimate={estimate} />}
        </div>
      </div>
    </div>
  );
}
