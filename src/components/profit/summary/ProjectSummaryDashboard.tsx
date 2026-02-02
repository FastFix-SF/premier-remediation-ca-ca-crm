import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  ClipboardList, 
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Wrench
} from 'lucide-react';
import { StatusPipeline } from './StatusPipeline';
import { ContractSummaryCard } from './ContractSummaryCard';
import { ActionItemsPanel } from './ActionItemsPanel';
import { RecentActivityTimeline } from './RecentActivityTimeline';
import { useProjectSummary } from '@/hooks/useProjectSummary';
import { cn } from '@/lib/utils';
import { ChangeOrderDialog } from '@/components/change-orders/ChangeOrderDialog';
import { AddPunchlistDialog } from '@/components/projects/dialogs/AddPunchlistDialog';
import { AddInspectionDialog } from '@/components/projects/dialogs/AddInspectionDialog';
import { CreateServiceTicketDialog } from '@/components/service-tickets/CreateServiceTicketDialog';

interface ProjectSummaryDashboardProps {
  projectId: string;
  project: any;
  profitData?: any;
}

export const ProjectSummaryDashboard: React.FC<ProjectSummaryDashboardProps> = ({
  projectId,
  project,
  profitData
}) => {
  const { data: summaryData, isLoading } = useProjectSummary(projectId);
  
  // Dialog states
  const [showChangeOrderDialog, setShowChangeOrderDialog] = useState(false);
  const [showPunchlistDialog, setShowPunchlistDialog] = useState(false);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [showServiceTicketDialog, setShowServiceTicketDialog] = useState(false);

  // Build activity timeline from all data sources
  const buildActivityTimeline = () => {
    const activities: any[] = [];
    
    // Add change orders
    summaryData?.changeOrders.forEach(co => {
      activities.push({
        id: `co-${co.id}`,
        type: 'change_order',
        title: `Change Order: ${co.title}`,
        description: `${co.change_order_number} - $${co.amount.toLocaleString()}`,
        timestamp: co.created_at,
        status: co.status,
      });
    });
    
    // Add inspections
    summaryData?.inspections.forEach(insp => {
      activities.push({
        id: `insp-${insp.id}`,
        type: 'inspection',
        title: `Inspection: ${insp.title}`,
        description: insp.inspector_name ? `Inspector: ${insp.inspector_name}` : undefined,
        timestamp: insp.created_at,
        status: insp.status,
      });
    });
    
    // Add punchlist items
    summaryData?.punchlists.slice(0, 3).forEach(pl => {
      activities.push({
        id: `pl-${pl.id}`,
        type: 'punchlist',
        title: `Punchlist: ${pl.title}`,
        description: pl.location,
        timestamp: pl.created_at,
        status: pl.status,
      });
    });
    
    // Sort by timestamp
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading summary...</p>
        </div>
      </div>
    );
  }

  const contractSummary = summaryData?.contractSummary || {
    originalContract: 0,
    approvedChangeOrders: 0,
    pendingChangeOrders: 0,
    revisedContract: 0,
    retention: 10,
    retentionAmount: 0,
  };

  const actionItems = summaryData?.actionItems || {
    openPunchlists: 0,
    pendingInspections: 0,
    pendingChangeOrders: 0,
    overdueItems: 0,
  };

  // AI Health Insights (simple heuristic-based for now)
  const getProjectHealthInsights = () => {
    const insights: { type: 'success' | 'warning' | 'danger'; message: string }[] = [];
    
    if (profitData?.gp_percentage >= 25) {
      insights.push({ type: 'success', message: 'Excellent profit margin above 25%' });
    } else if (profitData?.gp_percentage < 10) {
      insights.push({ type: 'danger', message: 'Profit margin below target - review costs' });
    }
    
    if (actionItems.overdueItems > 0) {
      insights.push({ type: 'danger', message: `${actionItems.overdueItems} overdue punchlist items need attention` });
    }
    
    if (actionItems.pendingChangeOrders > 0) {
      insights.push({ type: 'warning', message: `${actionItems.pendingChangeOrders} change orders pending approval` });
    }
    
    if (actionItems.pendingInspections > 0) {
      insights.push({ type: 'warning', message: `${actionItems.pendingInspections} inspections scheduled` });
    }
    
    if (insights.length === 0) {
      insights.push({ type: 'success', message: 'Project is on track with no immediate concerns' });
    }
    
    return insights;
  };

  const healthInsights = getProjectHealthInsights();

  return (
    <div className="space-y-6">
      {/* Status Pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Project Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusPipeline 
            currentStatus={project?.status || 'pending'} 
          />
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Summary */}
        <ContractSummaryCard {...contractSummary} />

        {/* Action Items */}
        <ActionItemsPanel {...actionItems} />

        {/* AI Health Insights */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Project Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthInsights.map((insight, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg",
                    insight.type === 'success' && "bg-green-500/10",
                    insight.type === 'warning' && "bg-amber-500/10",
                    insight.type === 'danger' && "bg-destructive/10"
                  )}
                >
                  {insight.type === 'success' && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  )}
                  {insight.type === 'warning' && (
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  )}
                  {insight.type === 'danger' && (
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  )}
                  <span className={cn(
                    "text-sm",
                    insight.type === 'success' && "text-green-700",
                    insight.type === 'warning' && "text-amber-700",
                    insight.type === 'danger' && "text-destructive"
                  )}>
                    {insight.message}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            {profitData && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">GP Margin</p>
                    <p className={cn(
                      "text-lg font-bold",
                      profitData.gp_percentage >= 20 ? "text-green-600" : 
                      profitData.gp_percentage >= 10 ? "text-amber-600" : "text-destructive"
                    )}>
                      {profitData.gp_percentage?.toFixed(1) || '0'}%
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Costs to Date</p>
                    <p className="text-lg font-bold">
                      ${((profitData.total_labor_cost || 0) + (profitData.total_materials_cost || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <RecentActivityTimeline activities={buildActivityTimeline()} />

      {/* Quick Actions Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowChangeOrderDialog(true)}>
              <Plus className="h-4 w-4" />
              Add Change Order
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowPunchlistDialog(true)}>
              <ClipboardList className="h-4 w-4" />
              New Punchlist Item
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowInspectionDialog(true)}>
              <Search className="h-4 w-4" />
              Schedule Inspection
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowServiceTicketDialog(true)}>
              <Wrench className="h-4 w-4" />
              Service Ticket
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ChangeOrderDialog
        open={showChangeOrderDialog}
        onOpenChange={setShowChangeOrderDialog}
        defaultProjectId={projectId}
      />
      
      <AddPunchlistDialog
        open={showPunchlistDialog}
        onOpenChange={setShowPunchlistDialog}
        projectId={projectId}
      />
      
      <AddInspectionDialog
        open={showInspectionDialog}
        onOpenChange={setShowInspectionDialog}
        projectId={projectId}
      />
      
      <CreateServiceTicketDialog
        open={showServiceTicketDialog}
        onOpenChange={setShowServiceTicketDialog}
        defaultAddress={project?.address || ''}
      />
    </div>
  );
};
