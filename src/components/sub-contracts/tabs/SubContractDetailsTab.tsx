import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubContract, SubContractItem, useSubContractItems } from "@/hooks/useSubContracts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface SubContractDetailsTabProps {
  subContract: SubContract;
  onChange: (field: string, value: any) => void;
}

export function SubContractDetailsTab({ subContract, onChange }: SubContractDetailsTabProps) {
  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name').order('name');
      return data || [];
    },
  });

  const { data: subcontractors } = useQuery({
    queryKey: ['subcontractors-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('directory_contacts')
        .select('id, company, contact_name')
        .eq('contact_type', 'subcontractor')
        .order('company');
      return data || [];
    },
  });

  const { data: items = [] } = useSubContractItems(subContract.id);

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  const formatPercent = (value: number | null, total: number | null) => {
    if (!value || !total || total === 0) return '0.00%';
    return `${((value / total) * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-muted/50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Total:</span>
          <span className="font-semibold">{formatCurrency(subContract.total)}</span>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive" className="text-xs">
            Billed Amount: {formatCurrency(subContract.billed_amount)}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Total Retainage: {formatCurrency(subContract.total_retainage)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Remaining Retainage: {formatCurrency(subContract.remaining_retainage)}
          </Badge>
        </div>
      </div>

      {/* Details Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Project</Label>
          <Select
            value={subContract.project_id || ''}
            onValueChange={(v) => onChange('project_id', v || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Subcontractor</Label>
          <Select
            value={subContract.subcontractor_id || ''}
            onValueChange={(v) => onChange('subcontractor_id', v || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subcontractor" />
            </SelectTrigger>
            <SelectContent>
              {subcontractors?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.company || s.contact_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={subContract.date || ''}
            onChange={(e) => onChange('date', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Work Retainage %</Label>
          <Input
            type="number"
            step="0.01"
            value={subContract.work_retainage_percent || ''}
            onChange={(e) => onChange('work_retainage_percent', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label>Total</Label>
          <Input
            type="number"
            step="0.01"
            value={subContract.total || ''}
            onChange={(e) => onChange('total', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label>Paid</Label>
          <Input
            type="number"
            step="0.01"
            value={subContract.paid || ''}
            onChange={(e) => onChange('paid', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Original Scope Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Original Scope
          </h3>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(subContract.total)}
          </span>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">Type</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Cost Code</TableHead>
                <TableHead className="text-right">QTY</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Billed</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No items added yet
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.item_type || '-'}</TableCell>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.cost_code || '-'}</TableCell>
                    <TableCell className="text-right">{item.quantity || 0}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_cost)}</TableCell>
                    <TableCell>{item.unit || '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.billed)} ({formatPercent(item.billed, item.total)})
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.remaining)} ({formatPercent(item.remaining, item.total)})
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
