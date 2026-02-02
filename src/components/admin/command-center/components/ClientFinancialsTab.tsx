import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, TrendingDown, Users, Package, FileText, ExternalLink } from 'lucide-react';
import { useClientFinancials } from '../hooks/useClientFinancials';
import { useClientLabor } from '../hooks/useClientLabor';
import { useClientMaterials } from '../hooks/useClientMaterials';
import { useNavigate } from 'react-router-dom';
import { ProjectInvoicesModal } from '@/mobile/components/ProjectInvoicesModal';

interface ClientFinancialsTabProps {
  projectId: string;
  projectName?: string;
  clientName?: string;
  clientEmail?: string;
  address?: string;
}

export const ClientFinancialsTab: React.FC<ClientFinancialsTabProps> = ({ 
  projectId,
  projectName,
  clientName,
  clientEmail,
  address
}) => {
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const { summary, invoices, isLoading: financialsLoading } = useClientFinancials(projectId);
  const { laborSummary, isLoading: laborLoading } = useClientLabor(projectId);
  const { materialsSummary, isLoading: materialsLoading } = useClientMaterials(projectId);
  const navigate = useNavigate();

  const isLoading = financialsLoading || laborLoading || materialsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={() => setShowInvoicesModal(true)}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Manage Invoices
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate(`/admin/projects/${projectId}/profitability`)}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View Full Profitability
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Contract Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary.contractValue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalPaid)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-500" />
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.outstandingBalance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Labor Costs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Labor Costs
            </CardTitle>
            <Badge variant={laborSummary.isOverBudget ? "destructive" : "default"}>
              {laborSummary.isOverBudget ? 'Over Budget' : 'On Track'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Budgeted</p>
              <p className="text-xl font-semibold">{formatCurrency(laborSummary.budgetedAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actual</p>
              <p className="text-xl font-semibold">{formatCurrency(laborSummary.totalCost)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Variance</p>
              <p className={`text-xl font-semibold ${laborSummary.variance >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {laborSummary.variance >= 0 ? '+' : ''}{formatCurrency(laborSummary.variance)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Total Hours: {laborSummary.totalHours.toFixed(1)}</p>
          </div>
          <Button 
            variant="link" 
            className="mt-2 p-0 h-auto"
            onClick={() => navigate(`/admin/projects/${projectId}/profitability`)}
          >
            View Labor Details →
          </Button>
        </CardContent>
      </Card>

      {/* Materials Costs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Materials Costs
            </CardTitle>
            <Badge variant={materialsSummary.isOverBudget ? "destructive" : "default"}>
              {materialsSummary.isOverBudget ? 'Over Budget' : 'On Track'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Budgeted</p>
              <p className="text-xl font-semibold">{formatCurrency(materialsSummary.budgetedAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actual</p>
              <p className="text-xl font-semibold">{formatCurrency(materialsSummary.totalCost)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Variance</p>
              <p className={`text-xl font-semibold ${materialsSummary.variance >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {materialsSummary.variance >= 0 ? '+' : ''}{formatCurrency(materialsSummary.variance)}
              </p>
            </div>
          </div>
          <Button 
            variant="link" 
            className="mt-4 p-0 h-auto"
            onClick={() => navigate(`/admin/projects/${projectId}/materials`)}
          >
            View Materials Details →
          </Button>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Invoice #{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(invoice.total_amount || 0)}</p>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No invoices yet</p>
          )}
        </CardContent>
      </Card>

      {/* Invoice Modal */}
      <ProjectInvoicesModal
        isOpen={showInvoicesModal}
        onClose={() => setShowInvoicesModal(false)}
        projectId={projectId}
        projectName={projectName || 'Project'}
        clientName={clientName}
        clientEmail={clientEmail}
        address={address}
      />
    </div>
  );
};
