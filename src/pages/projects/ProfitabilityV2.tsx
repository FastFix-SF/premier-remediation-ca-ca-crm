import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDateRangePicker } from '@/components/ui/calendar-date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calculator, DollarSign, TrendingUp, Users, Package, Settings, AlertTriangle, FileText, Upload, ClipboardList, AlertCircle, Building } from 'lucide-react';
import { FinancialSections } from '@/components/profit/v2/FinancialSections';
import { KpiCard } from '@/components/profit/v2/KpiCard';
import { ProgressStat } from '@/components/profit/v2/ProgressStat';
import { DataStatusChips } from '@/components/profit/v2/DataStatusChips';
import { EditableValue, EditableBadgeValue } from '@/components/profit/v2/EditableValue';
import { LaborTab } from '@/components/profit/LaborTab';
import { MaterialsTab } from '@/components/profit/MaterialsTab';
import { PhotosTab } from '@/components/profit/PhotosTab';
import { ReportsTab } from '@/components/profit/ReportsTab';
import { IncidentsTab } from '@/components/profit/IncidentsTab';
import { RatingTab } from '@/components/profit/RatingTab';
import { CreateInvoiceDialog } from '@/components/profit/CreateInvoiceDialog';
import { getProfitInputs, getActuals } from '@/api/profitability';
import { compute, statusBadge, formatCurrency, formatPercent } from '@/lib/profitMath';
import { ProfitInputs, Actuals, ProfitCalculation, StatusBadge as StatusBadgeType } from '@/types/profitability';
import { useProjectProfitability } from '@/hooks/useProjectProfitability';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BackgroundButton } from '@/components/admin/BackgroundButton';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';

// ============= HELPER FUNCTIONS =============

const safe = (n?: number) => Number.isFinite(n!) ? n! : 0;
const pct = (num: number, den: number) => den > 0 ? num / den : 0;
type BandType = 'ok' | 'warn' | 'bad' | 'neutral';
const band = (ratio: number): BandType => {
  if (!Number.isFinite(ratio)) return 'neutral';
  if (ratio <= 1.0) return 'ok';
  if (ratio <= 1.10) return 'warn';
  return 'bad';
};
const bandToColor = (b: BandType) => b === 'ok' ? 'bg-emerald-500' : b === 'warn' ? 'bg-amber-500' : b === 'bad' ? 'bg-rose-500' : 'bg-slate-300';
const statusText = (b: BandType) => b === 'ok' ? 'On Track' : b === 'warn' ? 'At Risk' : b === 'bad' ? 'Over Budget' : '—';

// ============= MISSION CONTROL UI COMPONENTS =============

type Light = "GREEN" | "AMBER" | "RED";
const StatusBadge: React.FC<{
  state: Light;
  label?: string;
}> = ({
  state,
  label
}) => {
  const colorMap = {
    GREEN: "bg-emerald-100 text-emerald-800 border-emerald-300",
    AMBER: "bg-amber-100 text-amber-800 border-amber-300",
    RED: "bg-rose-100 text-rose-800 border-rose-300"
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colorMap[state]}`} title={state === "GREEN" ? "On target or better" : state === "AMBER" ? "Slightly behind target - corrective action may be needed" : "Corrective action required"}>
      <span className="h-2 w-2 rounded-full bg-current/80" aria-hidden="true" />
      {label ?? state}
    </span>;
};
const ListTile: React.FC<{
  title: string;
  subtitle?: string;
  meta?: string;
  onClick?: () => void;
}> = ({
  title,
  subtitle,
  meta,
  onClick
}) => <div className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-2 -mx-2 rounded cursor-pointer transition-colors" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick?.()}>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
    </div>
    {meta && <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{meta}</span>}
  </div>;
const ProgressBarSimple: React.FC<{
  value: number;
}> = ({
  value
}) => {
  const r = isFinite(value) ? Math.min(value, 1.3) : 0;
  const b = band(r);
  return <div className="h-2 w-full rounded bg-slate-100">
      <div className={`h-2 rounded transition-all ${bandToColor(b)}`} style={{
      width: `${Math.max(0, r * 100)}%`
    }} />
    </div>;
};

// Donut component for Gross Profit visualization
const Donut: React.FC<{
  value: number;
  target: number;
}> = ({
  value,
  target
}) => {
  const ratio = target > 0 ? Math.min(Math.max(value / target, 0), 1.5) : 0;
  const b = band(ratio);
  const colorMap = {
    ok: '#10B981',
    warn: '#F59E0B',
    bad: '#EF4444',
    neutral: '#64748b'
  };
  const color = colorMap[b];
  const percentage = Math.round(ratio * 100);
  return <div className="relative h-16 w-16 flex-shrink-0">
      <svg className="transform -rotate-90" viewBox="0 0 36 36">
        {/* Background circle */}
        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="3" />
        {/* Progress circle */}
        <circle cx="18" cy="18" r="15.9155" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${Math.min(ratio * 100, 150)}, 100`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{
        color
      }}>{percentage}%</span>
      </div>
    </div>;
};
const ProgressBar: React.FC<{
  label: string;
  value: string;
  progress: number;
  tone?: 'success' | 'danger' | 'neutral';
}> = ({
  label,
  value,
  progress,
  tone = 'neutral'
}) => {
  const toneColors = {
    success: 'bg-emerald-500',
    danger: 'bg-rose-500',
    neutral: 'bg-blue-500'
  };
  return <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-slate-600">{value}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full transition-all ${toneColors[tone]}`} style={{
        width: `${Math.min(progress * 100, 100)}%`
      }} role="progressbar" aria-valuenow={progress * 100} aria-valuemin={0} aria-valuemax={100} />
      </div>
    </div>;
};

// Mock data functions (replace with real integrations)
const mockChat = (projectId: string) => [{
  id: '1',
  snippet: 'Crew en route to site',
  from: 'John (Foreman)',
  ts: '30m ago'
}, {
  id: '2',
  snippet: 'Need approval on change order',
  from: 'Sarah (PM)',
  ts: '1h ago'
}, {
  id: '3',
  snippet: 'Materials delivered successfully',
  from: 'Mike (Logistics)',
  ts: '2h ago'
}];
const mockFiles = (projectId: string) => [{
  id: '1',
  kind: 'Contract',
  name: 'Master Agreement',
  status: 'Signed'
}, {
  id: '2',
  kind: 'Quote',
  name: 'Initial Estimate',
  status: 'Accepted'
}, {
  id: '3',
  kind: 'Proposal',
  name: 'Change Order #1',
  status: 'Pending'
}];
const getHealthStatus = (calc: ProfitCalculation, inputs: ProfitInputs): Light => {
  const actualMargin = calc.actMargin;
  const targetMargin = inputs.targetMarginPct ?? 0.20;
  const delta = (actualMargin - targetMargin) * 100;
  if (delta >= 0) return "GREEN";
  if (delta >= -3) return "AMBER";
  return "RED";
};
const MissionControl: React.FC<{
  projectId: string;
  calc: ProfitCalculation;
  inputs: ProfitInputs;
  actuals: Actuals;
}> = ({
  projectId,
  calc,
  inputs,
  actuals
}) => {
  const healthStatus = getHealthStatus(calc, inputs);
  const estLabor = safe(inputs.est.laborCost);
  const estMat = safe(inputs.est.materialsCost);
  const estOh = safe(inputs.est.overheadCost);
  const actLabor = safe(actuals.labor.cost + (actuals.labor.burdenCost ?? 0));
  const actMat = safe(actuals.materials.cost);
  const actOh = safe(actuals.overhead.cost);
  const laborRatio = estLabor > 0 ? actLabor / estLabor : 0;
  const materialsRatio = estMat > 0 ? actMat / estMat : 0;
  const overheadRatio = estOh > 0 ? actOh / estOh : 0;
  const laborBand = band(laborRatio);
  const materialsBand = band(materialsRatio);
  const overheadBand = band(overheadRatio);
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem(`mission-checklist-${projectId}`);
    return stored ? JSON.parse(stored) : {
      'safety-briefing': false,
      'materials-staged': false,
      'crew-assigned': false,
      'permits-verified': false
    };
  });
  const updateChecklist = (key: string, value: boolean) => {
    const updated = {
      ...checklist,
      [key]: value
    };
    setChecklist(updated);
    localStorage.setItem(`mission-checklist-${projectId}`, JSON.stringify(updated));
  };
  const checklistItems = [{
    key: 'safety-briefing',
    label: 'Safety briefing completed'
  }, {
    key: 'materials-staged',
    label: 'Materials staged on site'
  }, {
    key: 'crew-assigned',
    label: 'Crew assignments confirmed'
  }, {
    key: 'permits-verified',
    label: 'Permits and compliance verified'
  }];
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const alerts: Array<{
    id: string;
    text: string;
    level: 'danger' | 'warning';
  }> = [];
  if (calc.variance.labor > inputs.est.laborCost * 0.1) {
    alerts.push({
      id: 'labor',
      text: 'Labor costs exceed estimate by >10%',
      level: 'danger'
    });
  }
  if (calc.variance.materials > inputs.est.materialsCost * 0.1) {
    alerts.push({
      id: 'materials',
      text: 'Materials costs exceed estimate by >10%',
      level: 'danger'
    });
  }
  if (actuals.labor.otHours > actuals.labor.regHours * 0.15) {
    alerts.push({
      id: 'overtime',
      text: 'Overtime exceeds 15% of regular hours',
      level: 'warning'
    });
  }
  return <aside className="w-full xl:w-80 space-y-4 xl:sticky xl:top-6" role="complementary" aria-label="Mission Control" id="mission-control">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Mission Control</h3>
        <StatusBadge state={healthStatus} />
      </div>
      
      <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-card">
        <div className="text-sm font-semibold">SITREP — Budget Usage</div>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">Labor</span>
              <span className={`${laborBand === 'ok' ? 'text-emerald-600' : laborBand === 'warn' ? 'text-amber-600' : 'text-rose-600'}`}>
                {Math.round(laborRatio * 100)}%
              </span>
            </div>
            <ProgressBarSimple value={laborRatio} />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">Materials</span>
              <span className={`${materialsBand === 'ok' ? 'text-emerald-600' : materialsBand === 'warn' ? 'text-amber-600' : 'text-rose-600'}`}>
                {Math.round(materialsRatio * 100)}%
              </span>
            </div>
            <ProgressBarSimple value={materialsRatio} />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">Overhead</span>
              <span className={`${overheadBand === 'ok' ? 'text-emerald-600' : overheadBand === 'warn' ? 'text-amber-600' : 'text-rose-600'}`}>
                {Math.round(overheadRatio * 100)}%
              </span>
            </div>
            <ProgressBarSimple value={overheadRatio} />
          </div>
        </div>
      </div>
      
      <div className="rounded-xl border border-slate-200 p-4 bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">SOP — Pre-Launch Checklist</div>
          <span className="text-xs text-slate-500">{completedCount}/{checklistItems.length}</span>
        </div>
        <div className="space-y-2">
          {checklistItems.map(item => <label key={item.key} className="flex items-center space-x-2 cursor-pointer group">
              <input type="checkbox" checked={checklist[item.key]} onChange={e => updateChecklist(item.key, e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className={`text-sm ${checklist[item.key] ? 'line-through text-slate-400' : 'text-slate-700 group-hover:text-slate-900'}`}>
                {item.label}
              </span>
            </label>)}
        </div>
      </div>
      
      {alerts.length > 0 && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="text-sm font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-800" />
            <span className="text-amber-800">INTEL — Alerts & Risks</span>
          </div>
          <div className="space-y-2">
            {alerts.map(alert => <div key={alert.id} className="text-sm text-amber-800 flex items-start gap-2">
                <StatusBadge state={alert.level === 'danger' ? 'RED' : 'AMBER'} label={alert.level.toUpperCase()} />
                <span className="flex-1">{alert.text}</span>
              </div>)}
          </div>
        </div>}
      
      <div className="rounded-xl border border-slate-200 p-4 bg-card">
        <div className="text-sm font-semibold mb-2">COMMS — Recent Activity</div>
        <div className="space-y-1">
          {mockChat(projectId).map(m => <ListTile key={m.id} title={m.snippet} subtitle={m.from} meta={m.ts} />)}
        </div>
      </div>
      
      <div className="rounded-xl border border-slate-200 p-4 bg-card">
        <div className="text-sm font-semibold mb-2">DOCS — Key Files</div>
        <div className="space-y-1">
          {mockFiles(projectId).map(f => <ListTile key={f.id} title={f.name} subtitle={f.kind} meta={f.status} />)}
        </div>
      </div>
    </aside>;
};
export const ProfitabilityV2 = () => {
  const ENABLE_MISSION_UI = true; // Mission Control UI enabled by default

  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState('labor');
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date()
  });
  const [project, setProject] = useState<any>(null);
  const [inputs, setInputs] = useState<ProfitInputs | null>(null);
  const [actuals, setActuals] = useState<Actuals | null>(null);
  const [calc, setCalc] = useState<ProfitCalculation | null>(null);
  const [badge, setBadge] = useState<StatusBadgeType | null>(null);
  const [loading, setLoading] = useState(true);
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({
    background: 'linear-gradient(135deg, rgb(249 250 251) 0%, rgb(255 255 255) 100%)'
  });
  const [paymentsPaid, setPaymentsPaid] = useState<Record<string, boolean>>({});

  // Invoice dialog state
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(0);

  // Use existing hook to get real data for tabs
  const {
    profitData,
    laborData,
    materialsData,
    isLoading: isProfitLoading,
    syncProjectLabor,
    refreshData
  } = useProjectProfitability(id!, dateRange);

  // Update actuals when laborData or materialsData changes
  useEffect(() => {
    if (laborData || materialsData) {
      setActuals(prev => ({
        ...prev!,
        labor: {
          regHours: laborData?.regular_hours || 0,
          otHours: laborData?.overtime_hours || 0,
          cost: laborData?.total_cost || 0,
          burdenCost: 0,
          // TODO: Calculate burden from labor_burden_config
          employees: laborData?.employees?.length || 0
        },
        materials: {
          items: materialsData?.items?.length || 0,
          cost: materialsData?.total_cost || 0,
          vendors: materialsData?.uniqueVendors || 0
        },
        period: prev?.period || {
          start: dateRange.from.toISOString(),
          end: dateRange.to.toISOString()
        },
        overhead: prev?.overhead || {
          cost: 0
        }
      }));
    }
  }, [laborData, materialsData, dateRange]);

  // Recalculate profitability when actuals or inputs change
  useEffect(() => {
    if (inputs && actuals) {
      const calculation = compute(inputs, actuals);
      const statusBadgeData = statusBadge(calculation.variance.marginPctDelta);
      setCalc(calculation);
      setBadge(statusBadgeData);
    }
  }, [inputs, actuals]);
  useEffect(() => {
    const loadPageBackground = async () => {
      try {
        const {
          data
        } = await supabase.from('app_config').select('value').eq('key', 'PROFIT_PAGE_BACKGROUND_STYLE');
        if (data && data[0]) {
          const savedBackground = JSON.parse(data[0].value);
          setBackgroundStyle(savedBackground);
        }
      } catch (error) {
        console.error('Failed to load page background:', error);
      }
    };
    loadPageBackground();
  }, []);
  const togglePaymentPaid = async (paymentKey: string) => {
    const newPaidStatus = !paymentsPaid[paymentKey];
    try {
      // Update invoice status in database
      const {
        error
      } = await supabase.from('invoices').update({
        status: newPaidStatus ? 'paid' : 'pending',
        paid_at: newPaidStatus ? new Date().toISOString() : null
      }).eq('project_id', id).eq('description', paymentKey === 'first' ? 'First Payment' : paymentKey === 'materials' ? 'Materials Payment' : paymentKey === 'final' ? 'Final Payment' : 'Custom Payment');
      if (error) throw error;
      const updated = {
        ...paymentsPaid,
        [paymentKey]: newPaidStatus
      };
      setPaymentsPaid(updated);
      toast({
        title: "Success",
        description: `Invoice marked as ${newPaidStatus ? 'paid' : 'unpaid'}`
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive"
      });
    }
  };
  useEffect(() => {
    if (id) {
      loadData();
      loadPaymentStatus();
    }
  }, [id, dateRange]);
  const loadPaymentStatus = async () => {
    try {
      const {
        data: invoices,
        error
      } = await supabase.from('invoices').select('description, status').eq('project_id', id).eq('status', 'paid');
      if (error) throw error;
      const paidStatus: Record<string, boolean> = {};
      invoices?.forEach(invoice => {
        if (invoice.description?.includes('First Payment')) paidStatus['first'] = true;
        if (invoice.description?.includes('Materials Payment')) paidStatus['materials'] = true;
        if (invoice.description?.includes('Final Payment')) paidStatus['final'] = true;
        if (invoice.description?.includes('Custom Payment')) paidStatus['custom'] = true;
      });
      setPaymentsPaid(paidStatus);
    } catch (error) {
      console.error('Error loading payment status:', error);
    }
  };
  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const {
        data: projectData,
        error: projectError
      } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch profit inputs and actuals (stubs for now)
      const profitInputs = await getProfitInputs(id!);
      const actualsData = await getActuals(id!, dateRange.from.toISOString(), dateRange.to.toISOString());
      setInputs(profitInputs);
      // Initial actuals will be updated by the useEffect when laborData/materialsData loads
      setActuals(actualsData);

      // Calculate metrics
      const calculation = compute(profitInputs, actualsData);
      const statusBadgeData = statusBadge(calculation.variance.marginPctDelta);
      setCalc(calculation);
      setBadge(statusBadgeData);
    } catch (error) {
      console.error('Error loading profitability data:', error);
      toast({
        title: "Error",
        description: "Failed to load profitability data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSyncLabor = async () => {
    if (!project?.connectteam_job_id) {
      toast({
        title: "ConnectTeam Not Linked",
        description: "Please link a ConnectTeam job first to sync labor data",
        variant: "destructive"
      });
      return;
    }
    try {
      await syncProjectLabor();
      toast({
        title: "Success",
        description: "Labor data synced successfully"
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync labor data from ConnectTeam",
        variant: "destructive"
      });
    }
  };

  // Save project budget field to database
  const saveProjectBudget = async (field: string, value: number) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ [field]: value })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setInputs(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        if (field === 'contract_amount') {
          updated.contractValue = value;
        } else if (field === 'budget_labor') {
          updated.est = { ...updated.est, laborCost: value };
        } else if (field === 'budget_materials') {
          updated.est = { ...updated.est, materialsCost: value };
        } else if (field === 'budget_overhead') {
          updated.est = { ...updated.est, overheadCost: value };
        }
        return updated;
      });
      
      toast({ title: "Saved", description: "Budget updated successfully" });
    } catch (error) {
      console.error('Error saving budget:', error);
      toast({ 
        title: "Error", 
        description: "Failed to save budget", 
        variant: "destructive" 
      });
      throw error;
    }
  };
  if (loading || isProfitLoading) {
    return <div className="min-h-screen flex bg-background">
        <ProjectSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profitability dashboard...</p>
          </div>
        </div>
      </div>;
  }
  if (!project || !inputs || !actuals || !calc || !badge) {
    return <div className="min-h-screen flex bg-background">
        <ProjectSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Data Not Available</h2>
            <p className="text-muted-foreground mb-4">Unable to load profitability data.</p>
            <Button onClick={() => navigate('/admin')}>Back to Projects</Button>
          </div>
        </div>
      </div>;
  }
  const laborStatus = calc.variance.labor <= 0 ? 'on-track' : calc.variance.labor <= inputs.est.laborCost * 0.1 ? 'at-risk' : 'over-budget';
  const materialsStatus = calc.variance.materials <= 0 ? 'on-track' : calc.variance.materials <= inputs.est.materialsCost * 0.1 ? 'at-risk' : 'over-budget';
  const overheadStatus = calc.variance.overhead <= 0 ? 'on-track' : calc.variance.overhead <= inputs.est.overheadCost * 0.1 ? 'at-risk' : 'over-budget';

  // Legacy UI (when feature flag is off)
  if (!ENABLE_MISSION_UI) {
    return <div className="min-h-screen flex bg-background">
      <ProjectSidebar />
      <div className="flex-1 p-6 max-w-7xl space-y-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.name} - Profitability</h1>
            <p className="text-muted-foreground">{project.property_address}</p>
          </div>
          <div className="flex items-center space-x-4">
            <CalendarDateRangePicker date={dateRange} onDateChange={setDateRange} align="end" />
            <Badge variant={badge.tone === 'success' ? 'default' : badge.tone === 'warning' ? 'secondary' : 'destructive'}>
              {badge.label}
            </Badge>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Contract Value" value={formatCurrency(inputs.contractValue)} icon={<DollarSign className="h-5 w-5" />} tooltip="Total contract value agreed with customer" />
          
          <KpiCard title="Estimated Cost" value={formatCurrency(calc.estTotal)} icon={<Calculator className="h-5 w-5" />} badges={[{
            label: 'Labor',
            value: formatCurrency(inputs.est.laborCost)
          }, {
            label: 'Materials',
            value: formatCurrency(inputs.est.materialsCost)
          }, {
            label: 'Overhead',
            value: formatCurrency(inputs.est.overheadCost)
          }]} tooltip="Est Labor + Est Materials + Est Overhead" />

          <KpiCard title="Actual Cost" value={formatCurrency(calc.actTotal)} icon={<TrendingUp className="h-5 w-5" />} badges={[{
            label: 'Labor',
            value: formatCurrency(actuals.labor.cost + (actuals.labor.burdenCost ?? 0))
          }, {
            label: 'Materials',
            value: formatCurrency(actuals.materials.cost)
          }, {
            label: 'Overhead',
            value: formatCurrency(actuals.overhead.cost)
          }]} tooltip="Actual Labor (Base + Burden) + Actual Materials + Actual Overhead" />

          <KpiCard title="Gross Profit" value={`${formatCurrency(calc.actGP)} (${formatPercent(calc.actMargin)})`} description={`Target: ${formatPercent(inputs.targetMarginPct ?? 0.20)}`} icon={<DollarSign className="h-5 w-5" />} tooltip="Contract – Actual Cost / Contract × 100" />
        </div>

        {/* Budget vs Actual Progress Cards */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Budget vs Actual</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProgressStat label="Labor" estimate={inputs.est.laborCost} actual={actuals.labor.cost + (actuals.labor.burdenCost ?? 0)} status={laborStatus} subMetrics={[{
              label: 'Regular Hours',
              value: `${actuals.labor.regHours.toFixed(1)} hrs`
            }, {
              label: 'Overtime Hours',
              value: `${actuals.labor.otHours.toFixed(1)} hrs`
            }, {
              label: 'Active Crew',
              value: `${actuals.labor.employees ?? 0} employees`
            }]} />

            <ProgressStat label="Materials" estimate={inputs.est.materialsCost} actual={actuals.materials.cost} status={materialsStatus} subMetrics={[{
              label: 'Items',
              value: `${actuals.materials.items}`
            }, {
              label: 'Vendors',
              value: `${actuals.materials.vendors ?? 0}`
            }]} />

            <ProgressStat label="Overhead" estimate={inputs.est.overheadCost} actual={actuals.overhead.cost} status={overheadStatus} />
          </div>
        </div>


        {/* Data Context */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <DataStatusChips timesheetsConnected={false} billsConnected={false} quoteLinked={!!inputs.quoteId} quoteId={inputs.quoteId} />
          <p className="text-xs text-muted-foreground">
            Period: {new Date(actuals.period.start).toLocaleDateString()} - {new Date(actuals.period.end).toLocaleDateString()}
          </p>
        </div>

        {/* Tabs - Keep existing functionality */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full h-12">
            <TabsTrigger value="labor" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Labor</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Materials</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center space-x-2">
              <span>Photos</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <span>Reports</span>
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center space-x-2">
              <span>Incidents</span>
            </TabsTrigger>
            <TabsTrigger value="rating" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Rating</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="labor">
            <LaborTab projectId={id!} dateRange={dateRange} laborData={laborData} onSyncLabor={handleSyncLabor} />
          </TabsContent>

          <TabsContent value="materials">
            <MaterialsTab projectId={id!} dateRange={dateRange} materialsData={materialsData} onRefresh={refreshData} />
          </TabsContent>

          <TabsContent value="photos">
            <PhotosTab projectId={id!} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab projectId={id!} dateRange={dateRange} laborData={laborData} />
          </TabsContent>

          <TabsContent value="incidents">
            <IncidentsTab projectId={id!} />
          </TabsContent>

          <TabsContent value="rating">
            <RatingTab projectId={id!} project={project} profitData={profitData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
  }

  // Mission Control UI (when feature flag is on)
  const healthStatus = getHealthStatus(calc, inputs);

  // Calculate status metrics
  const contract = safe(inputs.contractValue);
  const estLabor = safe(inputs.est.laborCost);
  const estMat = safe(inputs.est.materialsCost);
  const estOh = safe(inputs.est.overheadCost);
  const estTot = calc.estTotal;
  const actLabor = safe(actuals.labor.cost + (actuals.labor.burdenCost ?? 0));
  const actMat = safe(actuals.materials.cost);
  const actOh = safe(actuals.overhead.cost);
  const actTot = calc.actTotal;
  const grossProfit = calc.actGP;
  const grossPct = calc.actMargin;
  const targetGross = inputs.targetMarginPct ?? 0.20;
  const overallStatus = grossPct >= targetGross ? 'On Track' : grossPct >= targetGross - 0.02 ? 'At Risk' : 'Off Track';
  const overallColor = overallStatus === 'On Track' ? 'text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200' : overallStatus === 'At Risk' ? 'text-amber-600 bg-amber-50 ring-1 ring-amber-200' : 'text-rose-600 bg-rose-50 ring-1 ring-rose-200';
  const handleBackgroundChange = (newBackgroundStyle: React.CSSProperties) => {
    setBackgroundStyle(newBackgroundStyle);
  };
  const handleCreateInvoice = async (paymentType: string, daysUntilDue: number = 15) => {
    if (!project || !calc || !inputs) return;

    // Generate invoice number
    const invoiceNumber = `CC_${project.id.slice(0, 8)}-${Date.now().toString().slice(-4)}`;

    // Calculate dates
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + daysUntilDue);

    // Format dates as MM/DD/YYYY
    const formatDate = (date: Date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    // Determine amount based on payment type and payment schedule
    let amount = 0;
    let description = '';

    // Try to use payment schedule from proposal
    if (inputs.paymentSchedule?.milestones) {
      const milestones = inputs.paymentSchedule.milestones;
      switch (paymentType) {
        case 'First Payment':
          const deposit = milestones.find((m: any) => m.id === 'deposit' || m.isDeposit);
          amount = deposit?.amount || inputs.contractValue * 0.33;
          description = deposit?.label || 'Initial deposit for project commencement';
          break;
        case 'Materials Payment':
          const material = milestones.find((m: any) => m.id === 'material');
          amount = material?.amount || inputs.contractValue * 0.33;
          description = material?.label || 'Payment for materials and supplies';
          break;
        case 'Final Payment':
          const final = milestones.find((m: any) => m.id === 'final' || m.isFinal);
          amount = final?.amount || inputs.contractValue * 0.34;
          description = final?.label || 'Final payment upon project completion';
          break;
        default:
          amount = inputs.contractValue * 0.25; // Custom payment
          description = `${paymentType} payment`;
      }
    } else {
      // Fallback to percentage-based if no payment schedule
      switch (paymentType) {
        case 'First Payment':
          amount = inputs.contractValue * 0.33; // 33% deposit
          description = 'Initial deposit for project commencement';
          break;
        case 'Materials Payment':
          amount = inputs.contractValue * 0.33; // 33% materials
          description = 'Payment for materials and supplies';
          break;
        case 'Final Payment':
          amount = inputs.contractValue * 0.34; // Remaining 34%
          description = 'Final payment upon project completion';
          break;
        default:
          amount = inputs.contractValue * 0.25; // Custom payment
          description = `${paymentType} payment`;
      }
    }

    // Add 3% credit card processing fee
    const subtotal = amount;
    const creditCardFee = subtotal * 0.03;
    const total = subtotal + creditCardFee;

    // Generate and download PDF first
    const {
      downloadInvoice
    } = await import('@/lib/invoiceGenerator');
    downloadInvoice({
      invoiceNumber,
      date: formatDate(today),
      dueDate: formatDate(dueDate),
      customerName: project.client_name || 'Customer',
      customerContact: project.customer_email || '',
      projectAddress: project.property_address || '',
      projectNumber: project.id.slice(0, 8),
      description,
      total: subtotal
    });

    // Create invoice record and open payment page
    createInvoice({
      invoiceNumber,
      projectId: project.id,
      customerName: project.client_name || 'Customer',
      customerEmail: project.customer_email || '',
      projectName: project.project_name || '',
      projectAddress: project.property_address || '',
      description,
      subtotal: subtotal,
      total: subtotal,
      paymentType,
      daysUntilDue
    });
  };
  const laborRatio = estLabor > 0 ? actLabor / estLabor : 0;
  const materialsRatio = estMat > 0 ? actMat / estMat : 0;
  const overheadRatio = estOh > 0 ? actOh / estOh : 0;
  const laborBand = band(laborRatio);
  const materialsBand = band(materialsRatio);
  const overheadBand = band(overheadRatio);
  return <div className="min-h-screen flex" style={backgroundStyle}>
      <ProjectSidebar />
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 md:py-6 max-w-[1600px] space-y-3 md:space-y-6 overflow-auto">

        {/* SITREP Header - Sticky */}
        

        {/* Two Column Layout */}
        <div className="flex flex-col xl:flex-row gap-3 md:gap-6">
          {/* Main Content - Left Column */}
          <div className="flex-1 space-y-3 md:space-y-6 min-w-0" id="sitrep-section">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {/* Contract Value - Editable */}
              <div className="relative overflow-hidden rounded-xl border border-slate-200/60 p-4 md:p-5 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Contract</span>
                  </div>
                  <EditableValue 
                    value={contract} 
                    onSave={(v) => saveProjectBudget('contract_amount', v)} 
                    size="lg"
                    className="text-2xl md:text-3xl"
                  />
                </div>
              </div>

              {/* Estimated Cost - Editable */}
              <div className="relative overflow-hidden rounded-xl border border-slate-200/60 p-4 md:p-5 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-card shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <Calculator className="h-4 w-4 text-violet-600" />
                    </div>
                    <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Estimated</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-foreground mb-2">{formatCurrency(estTot)}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <EditableBadgeValue 
                      label="L" 
                      value={estLabor} 
                      onSave={(v) => saveProjectBudget('budget_labor', v)} 
                      className="text-[10px] md:text-xs px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                    />
                    <EditableBadgeValue 
                      label="M" 
                      value={estMat} 
                      onSave={(v) => saveProjectBudget('budget_materials', v)} 
                      className="text-[10px] md:text-xs px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                    />
                    <EditableBadgeValue 
                      label="O" 
                      value={estOh} 
                      onSave={(v) => saveProjectBudget('budget_overhead', v)} 
                      className="text-[10px] md:text-xs px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                    />
                  </div>
                </div>
              </div>

              {/* Actual Cost */}
              <div className="relative overflow-hidden rounded-xl border border-slate-200/60 p-4 md:p-5 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-card shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Actual</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-foreground mb-2">{formatCurrency(actTot)}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] md:text-xs px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">L {formatCurrency(actLabor)}</span>
                    <span className="text-[10px] md:text-xs px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">M {formatCurrency(actMat)}</span>
                    <span className="text-[10px] md:text-xs px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">O {formatCurrency(actOh)}</span>
                  </div>
                </div>
              </div>

              {/* Gross Profit */}
              <div className={`relative overflow-hidden rounded-xl border p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow ${grossPct >= targetGross ? 'border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-card' : grossPct >= targetGross - 0.02 ? 'border-amber-200/60 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-card' : 'border-rose-200/60 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-card'}`}>
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 ${grossPct >= targetGross ? 'bg-emerald-500/5' : grossPct >= targetGross - 0.02 ? 'bg-amber-500/5' : 'bg-rose-500/5'}`} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${grossPct >= targetGross ? 'bg-emerald-500/10' : grossPct >= targetGross - 0.02 ? 'bg-amber-500/10' : 'bg-rose-500/10'}`}>
                      <DollarSign className={`h-4 w-4 ${grossPct >= targetGross ? 'text-emerald-600' : grossPct >= targetGross - 0.02 ? 'text-amber-600' : 'text-rose-600'}`} />
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${grossPct >= targetGross ? 'text-emerald-600' : grossPct >= targetGross - 0.02 ? 'text-amber-600' : 'text-rose-600'}`}>Profit</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block">
                      <Donut value={grossPct} target={targetGross} />
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(grossProfit)}</div>
                      <div className="text-lg font-semibold text-muted-foreground">{formatPercent(grossPct)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-current/10">
                    <span className="text-xs text-muted-foreground">Target: {formatPercent(targetGross)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${grossPct >= targetGross ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300' : grossPct >= targetGross - 0.02 ? 'text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300' : 'text-rose-700 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300'}`}>
                      {grossPct >= targetGross ? '+' : ''}{formatPercent(grossPct - targetGross)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget vs Actual */}
            <div>
              <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-4">Budget vs Actual</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {/* Labor */}
                <div className="relative overflow-hidden rounded-xl border border-slate-200/60 p-4 md:p-5 bg-gradient-to-br from-sky-50/50 to-white dark:from-sky-950/10 dark:to-card shadow-sm hover:shadow-md transition-all">
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-sky-500/5 rounded-full" />
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-sky-500/10">
                          <Users className="h-3.5 w-3.5 text-sky-600" />
                        </div>
                        <span className="text-sm font-bold text-foreground">Labor</span>
                      </div>
                      <span className={`text-[10px] md:text-xs px-2 py-1 rounded-full font-semibold ${laborBand === 'ok' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40' : laborBand === 'warn' ? 'text-amber-700 bg-amber-100 dark:bg-amber-900/40' : laborBand === 'bad' ? 'text-rose-700 bg-rose-100 dark:bg-rose-900/40' : 'text-slate-600 bg-slate-100'}`}>
                        {statusText(laborBand)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-muted-foreground">Est: <span className="font-medium text-foreground">{formatCurrency(estLabor)}</span></span>
                      <span className="font-bold text-foreground">{formatCurrency(actLabor)}</span>
                    </div>
                    <ProgressBarSimple value={laborRatio} />
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-lg font-bold text-foreground">{actuals.labor.regHours.toFixed(1)}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Reg Hrs</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-lg font-bold text-foreground">{actuals.labor.otHours.toFixed(1)}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">OT Hrs</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-lg font-bold text-foreground">{actuals.labor.employees ?? 0}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Crew</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Materials */}
                <div className="relative overflow-hidden rounded-xl border border-slate-200/60 p-4 md:p-5 bg-gradient-to-br from-orange-50/50 to-white dark:from-orange-950/10 dark:to-card shadow-sm hover:shadow-md transition-all">
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-orange-500/5 rounded-full" />
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-orange-500/10">
                          <Package className="h-3.5 w-3.5 text-orange-600" />
                        </div>
                        <span className="text-sm font-bold text-foreground">Materials</span>
                      </div>
                      <span className={`text-[10px] md:text-xs px-2 py-1 rounded-full font-semibold ${materialsBand === 'ok' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40' : materialsBand === 'warn' ? 'text-amber-700 bg-amber-100 dark:bg-amber-900/40' : materialsBand === 'bad' ? 'text-rose-700 bg-rose-100 dark:bg-rose-900/40' : 'text-slate-600 bg-slate-100'}`}>
                        {statusText(materialsBand)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-muted-foreground">Est: <span className="font-medium text-foreground">{formatCurrency(estMat)}</span></span>
                      <span className="font-bold text-foreground">{formatCurrency(actMat)}</span>
                    </div>
                    <ProgressBarSimple value={materialsRatio} />
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-lg font-bold text-foreground">{actuals.materials.items}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Items</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-lg font-bold text-foreground">{actuals.materials.vendors ?? 0}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Vendors</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overhead */}
                <div className="relative overflow-hidden rounded-xl border border-slate-200/60 p-4 md:p-5 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-800/20 dark:to-card shadow-sm hover:shadow-md transition-all">
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-slate-500/5 rounded-full" />
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-500/10">
                          <Building className="h-3.5 w-3.5 text-slate-600" />
                        </div>
                        <span className="text-sm font-bold text-foreground">Overhead</span>
                      </div>
                      <span className={`text-[10px] md:text-xs px-2 py-1 rounded-full font-semibold ${overheadBand === 'ok' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40' : overheadBand === 'warn' ? 'text-amber-700 bg-amber-100 dark:bg-amber-900/40' : overheadBand === 'bad' ? 'text-rose-700 bg-rose-100 dark:bg-rose-900/40' : 'text-slate-600 bg-slate-100'}`}>
                        {statusText(overheadBand)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-muted-foreground">Est: <span className="font-medium text-foreground">{formatCurrency(estOh)}</span></span>
                      <span className="font-bold text-foreground">{formatCurrency(actOh)}</span>
                    </div>
                    <ProgressBarSimple value={overheadRatio} />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Sections */}
            <FinancialSections projectId={id || ''} />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 md:space-y-4">
              {/* Status Strip Above Tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 md:px-4 md:py-3 bg-muted/30 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {false ? '✓ Timesheets' : 'No Timesheets'}
                  </span>
                  <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {false ? '✓ Bills' : 'No Bills'}
                  </span>
                  {inputs.quoteId && <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-blue-100 text-blue-700">
                      Quote Linked
                    </span>}
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  {new Date(actuals.period.start).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })} - {new Date(actuals.period.end).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
                </p>
              </div>
              
              {/* Quick Actions Dock - Hide on mobile */}
              <div className="hidden md:flex flex-wrap items-center gap-2 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mr-2">Quick Actions</span>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Create Bill</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Add Material</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Upload Invoice</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Add Report</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Report Incident</span>
                </Button>
              </div>
              
              <TabsList className="grid grid-cols-7 w-full h-10 md:h-12">
                <TabsTrigger value="invoices" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm">
                  <FileText className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Invoices</span>
                </TabsTrigger>
                <TabsTrigger value="labor" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Users className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Labor</span>
                </TabsTrigger>
                <TabsTrigger value="materials" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Package className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Materials</span>
                </TabsTrigger>
                <TabsTrigger value="photos" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm">
                  <span>Photos</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm">
                  <span>Reports</span>
                </TabsTrigger>
                <TabsTrigger value="incidents" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm">
                  <span className="hidden sm:inline">Incidents</span>
                  <span className="sm:hidden">Inc.</span>
                </TabsTrigger>
                <TabsTrigger value="rating" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Rating</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="invoices">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* First Payment */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
                      <span className="font-medium">First Payment</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={paymentsPaid['first'] || false} onChange={() => togglePaymentPaid('first')} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                          <span className="text-sm text-muted-foreground">Paid</span>
                        </label>
                        <Button size="sm" onClick={() => {
                        const deposit = inputs?.paymentSchedule?.milestones?.find((m: any) => m.id === 'deposit' || m.isDeposit);
                        const amount = deposit?.amount || (inputs?.contractValue || 0) * 0.33;
                        setSelectedPaymentType('First Payment');
                        setSelectedAmount(amount);
                        setIsInvoiceDialogOpen(true);
                      }}>Create Invoice</Button>
                      </div>
                    </div>
                    
                    {/* Materials Payment */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
                      <span className="font-medium">Materials Payment</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={paymentsPaid['materials'] || false} onChange={() => togglePaymentPaid('materials')} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                          <span className="text-sm text-muted-foreground">Paid</span>
                        </label>
                        <Button size="sm" onClick={() => {
                        const material = inputs?.paymentSchedule?.milestones?.find((m: any) => m.id === 'material');
                        const amount = material?.amount || (inputs?.contractValue || 0) * 0.33;
                        setSelectedPaymentType('Materials Payment');
                        setSelectedAmount(amount);
                        setIsInvoiceDialogOpen(true);
                      }}>Create Invoice</Button>
                      </div>
                    </div>
                    
                    {/* Final Payment */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
                      <span className="font-medium">Final Payment</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={paymentsPaid['final'] || false} onChange={() => togglePaymentPaid('final')} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                          <span className="text-sm text-muted-foreground">Paid</span>
                        </label>
                        <Button size="sm" onClick={() => {
                        const final = inputs?.paymentSchedule?.milestones?.find((m: any) => m.id === 'final' || m.isFinal);
                        const amount = final?.amount || (inputs?.contractValue || 0) * 0.34;
                        setSelectedPaymentType('Final Payment');
                        setSelectedAmount(amount);
                        setIsInvoiceDialogOpen(true);
                      }}>Create Invoice</Button>
                      </div>
                    </div>
                    
                    {/* Add Custom Section */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-dashed border-border bg-muted/30 hover:bg-accent/5 transition-colors">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <span className="text-lg">+</span>
                        Add Payment Section
                      </Button>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={paymentsPaid['custom'] || false} onChange={() => togglePaymentPaid('custom')} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                          <span className="text-sm text-muted-foreground">Paid</span>
                        </label>
                        <Button size="sm" onClick={() => {
                        const amount = (inputs?.contractValue || 0) * 0.25;
                        setSelectedPaymentType('Custom Payment');
                        setSelectedAmount(amount);
                        setIsInvoiceDialogOpen(true);
                      }}>Create Invoice</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="labor">
                <LaborTab projectId={id!} dateRange={dateRange} laborData={laborData} onSyncLabor={handleSyncLabor} />
              </TabsContent>

              <TabsContent value="materials">
                <MaterialsTab projectId={id!} dateRange={dateRange} materialsData={materialsData} onRefresh={refreshData} />
              </TabsContent>

              <TabsContent value="photos">
                <PhotosTab projectId={id!} />
              </TabsContent>

              <TabsContent value="reports">
                <ReportsTab projectId={id!} dateRange={dateRange} laborData={laborData} />
              </TabsContent>

              <TabsContent value="incidents">
                <IncidentsTab projectId={id!} />
              </TabsContent>

              <TabsContent value="rating">
                <RatingTab projectId={id!} project={project} profitData={profitData} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Mission Control - Right Column (Sticky) */}
          <MissionControl projectId={id!} calc={calc} inputs={inputs} actuals={actuals} />
        </div>
      </div>

      {/* Invoice Configuration Dialog */}
      <CreateInvoiceDialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen} paymentType={selectedPaymentType} baseAmount={selectedAmount} onConfirm={daysUntilDue => handleCreateInvoice(selectedPaymentType, daysUntilDue)} />
    </div>;
};

// Helper function to create invoice
const createInvoice = async (data: any) => {
  try {
    const {
      data: invoice,
      error
    } = await supabase.from('invoices').insert({
      invoice_number: data.invoiceNumber,
      project_id: data.projectId,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      project_name: data.projectName,
      project_address: data.projectAddress,
      description: data.paymentType,
      subtotal: data.subtotal,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: data.total,
      balance_due: data.total,
      status: 'pending',
      due_date: new Date(Date.now() + (data.daysUntilDue || 15) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_terms: `Payment Due Upon Receipt\n\nKindly note that payment is due upon receipt of this invoice. If payment is not received within ${data.daysUntilDue || 15} days, we will apply the following charges:\n\n1. Annual Interest Rate: 21% per annum\n2. Daily Interest Rate: 0.058% per day\n\nThese charges will be levied for any outstanding payments beyond the due date. We appreciate your prompt attention to this matter. Thank you.`
    }).select().maybeSingle();
    if (error) throw error;

    // Open invoice payment page in new tab
    window.open(`/invoice/${invoice.invoice_number}`, '_blank');
  } catch (error) {
    console.error('Error creating invoice:', error);
  }
};