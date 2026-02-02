import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, MapPin, Edit2, Check, X, 
  DollarSign, Users, Package, TrendingUp, TrendingDown, Loader2,
  FileText, Briefcase, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClientFinancials } from '../hooks/useClientFinancials';
import { useClientLabor } from '../hooks/useClientLabor';
import { useClientMaterials } from '../hooks/useClientMaterials';
import { useUpdateProjectBudgets } from '../hooks/useUpdateProjectBudgets';
import { formatPhoneDisplay } from '@/lib/phoneUtils';
import { useNavigate } from 'react-router-dom';

interface ClientOverviewTabProps {
  projectId: string;
  clientName?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  address?: string | null;
  status: string;
}

const OVERHEAD_RATE = 0.08; // 8% system default

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'in_progress':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'completed':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'on_hold':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default:
      return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  }
};

export const ClientOverviewTab: React.FC<ClientOverviewTabProps> = ({
  projectId,
  clientName,
  clientPhone,
  clientEmail,
  address,
  status
}) => {
  const navigate = useNavigate();
  const { summary, isLoading: financialsLoading } = useClientFinancials(projectId);
  const { laborSummary, isLoading: laborLoading } = useClientLabor(projectId);
  const { materialsSummary, isLoading: materialsLoading } = useClientMaterials(projectId);
  const { updateBudgets, isUpdating } = useUpdateProjectBudgets(projectId);

  // Editing states
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [contractValue, setContractValue] = useState('0');
  
  const [isEditingEstimates, setIsEditingEstimates] = useState(false);
  const [estLabor, setEstLabor] = useState('0');
  const [estMaterials, setEstMaterials] = useState('0');
  const [estOverhead, setEstOverhead] = useState('0');

  const isLoading = financialsLoading || laborLoading || materialsLoading;

  // Sync local state with fetched data
  useEffect(() => {
    setContractValue(summary.contractValue.toString());
  }, [summary.contractValue]);

  useEffect(() => {
    setEstLabor(laborSummary.budgetedAmount.toString());
    setEstMaterials(materialsSummary.budgetedAmount.toString());
    // Calculate default overhead as 8% of estimated labor, or use existing if set
    const defaultOverhead = laborSummary.budgetedAmount * OVERHEAD_RATE;
    setEstOverhead(defaultOverhead.toString());
  }, [laborSummary.budgetedAmount, materialsSummary.budgetedAmount]);

  // Handlers for contract
  const handleSaveContract = () => {
    const amount = parseFloat(contractValue) || 0;
    updateBudgets.mutate({ contract_amount: amount });
    setIsEditingContract(false);
  };

  const handleCancelContract = () => {
    setContractValue(summary.contractValue.toString());
    setIsEditingContract(false);
  };

  // Handlers for estimates
  const handleSaveEstimates = () => {
    const labor = parseFloat(estLabor) || 0;
    const materials = parseFloat(estMaterials) || 0;
    const overhead = parseFloat(estOverhead) || 0;
    updateBudgets.mutate({ 
      budget_labor: labor, 
      budget_materials: materials, 
      budget_overhead: overhead 
    });
    setIsEditingEstimates(false);
  };

  const handleCancelEstimates = () => {
    setEstLabor(laborSummary.budgetedAmount.toString());
    setEstMaterials(materialsSummary.budgetedAmount.toString());
    setEstOverhead((laborSummary.budgetedAmount * OVERHEAD_RATE).toString());
    setIsEditingEstimates(false);
  };

  // Calculate actual overhead (8% of actual labor)
  const actualOverhead = laborSummary.totalCost * OVERHEAD_RATE;
  
  // Estimated totals
  const estLaborNum = parseFloat(estLabor) || 0;
  const estMaterialsNum = parseFloat(estMaterials) || 0;
  const estOverheadNum = parseFloat(estOverhead) || 0;
  const totalEstimated = estLaborNum + estMaterialsNum + estOverheadNum;

  // Actual totals
  const totalActualCost = laborSummary.totalCost + materialsSummary.totalCost + actualOverhead;
  
  // Variance calculations
  const laborVariance = estLaborNum - laborSummary.totalCost;
  const materialsVariance = estMaterialsNum - materialsSummary.totalCost;
  const overheadVariance = estOverheadNum - actualOverhead;
  const totalVariance = totalEstimated - totalActualCost;

  // Profit calculations
  const estGrossProfit = summary.contractValue - totalEstimated;
  const actGrossProfit = summary.contractValue - totalActualCost;
  const estProfitMargin = summary.contractValue > 0 ? (estGrossProfit / summary.contractValue) * 100 : 0;
  const actProfitMargin = summary.contractValue > 0 ? (actGrossProfit / summary.contractValue) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-4 pr-4">
        {/* Contact Info & Quick Actions */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Contact Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(status || 'pending')}>{status || 'pending'}</Badge>
                </div>
                {address && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <MapPin className="w-4 h-4 text-white/40 shrink-0" />
                    <span className="truncate">{address}</span>
                  </div>
                )}
                {clientPhone && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Phone className="w-4 h-4 text-white/40 shrink-0" />
                    <a href={`tel:${clientPhone}`} className="hover:text-white transition-colors">
                      {formatPhoneDisplay(clientPhone)}
                    </a>
                  </div>
                )}
                {clientEmail && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Mail className="w-4 h-4 text-white/40 shrink-0" />
                    <a href={`mailto:${clientEmail}`} className="hover:text-white transition-colors truncate">
                      {clientEmail}
                    </a>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
                  onClick={() => navigate(`/admin/projects/${projectId}`)}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  View Project
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  onClick={() => navigate(`/admin/projects/${projectId}/profitability`)}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Profitability
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Value - Editable */}
        <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Contract Value
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isEditingContract ? (
              <div className="flex items-center gap-2">
                <span className="text-xl text-white/60">$</span>
                <Input
                  type="number"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  className="bg-white/10 border-white/20 text-white text-2xl font-bold h-12 w-full"
                  autoFocus
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-emerald-400 hover:bg-emerald-500/20 shrink-0"
                  onClick={handleSaveContract}
                  disabled={isUpdating}
                >
                  <Check className="w-5 h-5" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-red-400 hover:bg-red-500/20 shrink-0"
                  onClick={handleCancelContract}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(summary.contractValue)}
                </span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => setIsEditingContract(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
            {summary.changeOrdersTotal > 0 && (
              <p className="text-xs text-white/60 mt-2">
                + {formatCurrency(summary.changeOrdersTotal)} in change orders = {formatCurrency(summary.revisedContractValue)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Estimated vs Actual Costs Comparison */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Estimated vs Actual Costs
              </CardTitle>
              {!isEditingEstimates && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-white/60 hover:text-white hover:bg-white/10 h-7 px-2"
                  onClick={() => setIsEditingEstimates(true)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit Estimates
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isEditingEstimates ? (
              <div className="space-y-3">
                {/* Editable Estimates */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-white/60 w-20">Est. Labor</span>
                    <span className="text-white/60">$</span>
                    <Input
                      type="number"
                      value={estLabor}
                      onChange={(e) => setEstLabor(e.target.value)}
                      className="bg-white/10 border-white/20 text-white h-8 flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-white/60 w-20">Est. Materials</span>
                    <span className="text-white/60">$</span>
                    <Input
                      type="number"
                      value={estMaterials}
                      onChange={(e) => setEstMaterials(e.target.value)}
                      className="bg-white/10 border-white/20 text-white h-8 flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-white/60 w-20">Est. Overhead</span>
                    <span className="text-white/60">$</span>
                    <Input
                      type="number"
                      value={estOverhead}
                      onChange={(e) => setEstOverhead(e.target.value)}
                      className="bg-white/10 border-white/20 text-white h-8 flex-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-400 hover:bg-red-500/20"
                    onClick={handleCancelEstimates}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    onClick={handleSaveEstimates}
                    disabled={isUpdating}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Comparison Table */}
                <div className="grid grid-cols-4 gap-2 text-xs text-white/50 pb-1 border-b border-white/10">
                  <span></span>
                  <span className="text-right">Estimated</span>
                  <span className="text-right">Actual</span>
                  <span className="text-right">Variance</span>
                </div>
                
                {/* Labor Row */}
                <div className="grid grid-cols-4 gap-2 items-center py-1">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-white/70">Labor</span>
                  </div>
                  <span className="text-xs text-white text-right">{formatCurrency(estLaborNum)}</span>
                  <span className="text-xs text-white text-right">{formatCurrency(laborSummary.totalCost)}</span>
                  <span className={`text-xs text-right ${laborVariance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {laborVariance >= 0 ? '+' : ''}{formatCurrency(laborVariance)}
                  </span>
                </div>

                {/* Materials Row */}
                <div className="grid grid-cols-4 gap-2 items-center py-1">
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-white/70">Materials</span>
                  </div>
                  <span className="text-xs text-white text-right">{formatCurrency(estMaterialsNum)}</span>
                  <span className="text-xs text-white text-right">{formatCurrency(materialsSummary.totalCost)}</span>
                  <span className={`text-xs text-right ${materialsVariance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {materialsVariance >= 0 ? '+' : ''}{formatCurrency(materialsVariance)}
                  </span>
                </div>

                {/* Overhead Row */}
                <div className="grid grid-cols-4 gap-2 items-center py-1">
                  <div className="flex items-center gap-1">
                    <Settings className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-white/70">Overhead</span>
                  </div>
                  <span className="text-xs text-white text-right">{formatCurrency(estOverheadNum)}</span>
                  <span className="text-xs text-white text-right">{formatCurrency(actualOverhead)}</span>
                  <span className={`text-xs text-right ${overheadVariance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {overheadVariance >= 0 ? '+' : ''}{formatCurrency(overheadVariance)}
                  </span>
                </div>

                {/* Total Row */}
                <div className="grid grid-cols-4 gap-2 items-center py-2 border-t border-white/10 mt-1">
                  <span className="text-xs font-semibold text-white">Total</span>
                  <span className="text-sm font-bold text-white text-right">{formatCurrency(totalEstimated)}</span>
                  <span className="text-sm font-bold text-white text-right">{formatCurrency(totalActualCost)}</span>
                  <span className={`text-sm font-bold text-right ${totalVariance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
                  </span>
                </div>

                <p className="text-[10px] text-white/40 mt-2">
                  Actual overhead = 8% of actual labor. Click Edit to set custom estimates.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Summary - Estimated vs Actual */}
        <div className="grid grid-cols-2 gap-3">
          <Card className={`border ${estGrossProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <CardContent className="p-3">
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Est. Gross Profit</p>
              <p className={`text-lg font-bold ${estGrossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(estGrossProfit)}
              </p>
              <p className={`text-xs ${estProfitMargin >= 20 ? 'text-emerald-400' : estProfitMargin >= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                {estProfitMargin.toFixed(1)}% margin
              </p>
            </CardContent>
          </Card>

          <Card className={`border ${actGrossProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <CardContent className="p-3">
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Act. Gross Profit</p>
              <p className={`text-lg font-bold ${actGrossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(actGrossProfit)}
              </p>
              <p className={`text-xs ${actProfitMargin >= 20 ? 'text-emerald-400' : actProfitMargin >= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                {actProfitMargin.toFixed(1)}% margin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Collection & Payment Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-white">{formatCurrency(summary.totalPaid)}</p>
              <p className="text-xs text-white/60">Collected</p>
            </CardContent>
          </Card>

          <Card className={`bg-white/5 border-white/10 ${summary.outstandingBalance > 0 ? 'border-amber-500/30' : ''}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-lg font-bold text-white">{formatCurrency(summary.outstandingBalance)}</p>
              <p className="text-xs text-white/60">Outstanding</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
            <p className="text-lg font-bold text-white">{summary.totalInvoiced > 0 ? Math.round((summary.totalPaid / summary.totalInvoiced) * 100) : 0}%</p>
            <p className="text-xs text-white/60">Collection</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
            <p className="text-lg font-bold text-white">{laborSummary.employeeCount}</p>
            <p className="text-xs text-white/60">Workers</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
            <p className="text-lg font-bold text-white">{materialsSummary.vendorCount}</p>
            <p className="text-xs text-white/60">Vendors</p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
