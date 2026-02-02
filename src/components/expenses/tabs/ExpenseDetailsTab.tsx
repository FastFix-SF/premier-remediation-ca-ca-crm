import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Expense } from '@/hooks/useExpenses';
import { Store, Calendar, DollarSign, User, FileText, Banknote, Hash, Layers } from 'lucide-react';

interface ExpenseDetailsTabProps {
  expense: Expense;
  onChange: (field: keyof Expense, value: any) => void;
}

const EXPENSE_TYPES = [
  { value: 'material', label: 'Material' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'labor', label: 'Labor' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'other', label: 'Other' },
];

const ACCOUNT_TYPES = [
  { value: 'Company', label: 'Company' },
  { value: 'Employee', label: 'Employee' },
];

export const ExpenseDetailsTab = ({ expense, onChange }: ExpenseDetailsTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column - Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
          <FileText className="h-4 w-4" />
          Details
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Expense Name</Label>
            <Input
              value={expense.expense_name || ''}
              onChange={(e) => onChange('expense_name', e.target.value)}
              placeholder="Enter expense name"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Store className="h-3 w-3" /> Vendor
            </Label>
            <Input
              value={expense.vendor || ''}
              onChange={(e) => onChange('vendor', e.target.value)}
              placeholder="Enter vendor"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Reason</Label>
            <Textarea
              value={expense.reason || ''}
              onChange={(e) => onChange('reason', e.target.value)}
              placeholder="Enter reason for expense"
              className="mt-1 min-h-[80px]"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" /> Employee
            </Label>
            <Input
              value={expense.employee_name || ''}
              onChange={(e) => onChange('employee_name', e.target.value)}
              placeholder="Enter employee name"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Layers className="h-3 w-3" /> Type
            </Label>
            <Select
              value={expense.expense_type || 'material'}
              onValueChange={(value) => onChange('expense_type', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Hash className="h-3 w-3" /> Ref #
            </Label>
            <Input
              value={expense.ref_number || ''}
              onChange={(e) => onChange('ref_number', e.target.value)}
              placeholder="Reference number"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Right Column - Financials */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
          <DollarSign className="h-4 w-4" />
          Financials
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Total Amount</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                value={expense.amount || ''}
                onChange={(e) => onChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Account</Label>
            <Select
              value={expense.account || 'Company'}
              onValueChange={(value) => onChange('account', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Banknote className="h-3 w-3" /> Bank Account
            </Label>
            <Input
              value={expense.bank_account || ''}
              onChange={(e) => onChange('bank_account', e.target.value)}
              placeholder="Enter bank account"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Cost Code</Label>
            <Input
              value={expense.cost_code || ''}
              onChange={(e) => onChange('cost_code', e.target.value)}
              placeholder="Enter cost code"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Expense Date
            </Label>
            <Input
              type="date"
              value={expense.expense_date || ''}
              onChange={(e) => onChange('expense_date', e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <Label className="text-sm">Billable</Label>
            <Switch
              checked={expense.is_billable || false}
              onCheckedChange={(checked) => onChange('is_billable', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
