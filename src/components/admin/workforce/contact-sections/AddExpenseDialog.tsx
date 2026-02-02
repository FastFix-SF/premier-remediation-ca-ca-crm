import React, { useState } from 'react';
import { Receipt, ExternalLink, CreditCard, Search, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVendors } from '@/hooks/useDirectoryContacts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  onSubmit?: (data: ExpenseFormData) => void;
}

interface ExpenseFormData {
  project: string;
  total: string;
  vendor: string;
  expenseName: string;
  account: string;
  bankAccount: string;
  billable: boolean;
}

const ACCOUNT_OPTIONS = [
  'Employee',
  'Company',
  '4671',
  'Cash',
  'Chase Checking',
  'Chase Credit Card',
];

const BANK_ACCOUNT_OPTIONS = [
  'ACH',
  'Card 5207',
  'Cash',
  'Chase Checking 7857',
  'Credit card 0886',
  'Credit card 3864',
  'Credit card 4457',
  'Credit card 4671',
  'Credit card 6604',
  'Credit card 7009',
  'Credit card 7017',
  'Credit card 7025',
  'Credit card 7033',
  'Pedro 0495 or 0773 (Reimbursable)',
  'Personal credit card',
];

const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({
  open,
  onOpenChange,
  contactId,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    project: '',
    total: '',
    vendor: '',
    expenseName: '',
    account: '',
    bankAccount: '',
    billable: false,
  });

  const [accountSearch, setAccountSearch] = useState('');
  const [bankAccountSearch, setBankAccountSearch] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [bankAccountOpen, setBankAccountOpen] = useState(false);
  const [customAccounts, setCustomAccounts] = useState<string[]>([]);
  const [customBankAccounts, setCustomBankAccounts] = useState<string[]>([]);

  // Fetch projects from database
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, address')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch vendors from directory_contacts
  const { data: vendors = [] } = useVendors();

  const allAccounts = [...ACCOUNT_OPTIONS, ...customAccounts];
  const allBankAccounts = [...BANK_ACCOUNT_OPTIONS, ...customBankAccounts];

  const filteredAccounts = allAccounts.filter((acc) =>
    acc.toLowerCase().includes(accountSearch.toLowerCase())
  );

  const filteredBankAccounts = allBankAccounts.filter((acc) =>
    acc.toLowerCase().includes(bankAccountSearch.toLowerCase())
  );

  const handleAddAccount = () => {
    const trimmedSearch = accountSearch.trim();
    if (trimmedSearch) {
      if (!allAccounts.includes(trimmedSearch)) {
        setCustomAccounts([...customAccounts, trimmedSearch]);
      }
      setFormData({ ...formData, account: trimmedSearch });
      setAccountSearch('');
      setAccountOpen(false);
    }
  };

  const handleAddBankAccount = () => {
    const trimmedSearch = bankAccountSearch.trim();
    if (trimmedSearch) {
      if (!allBankAccounts.includes(trimmedSearch)) {
        setCustomBankAccounts([...customBankAccounts, trimmedSearch]);
      }
      setFormData({ ...formData, bankAccount: trimmedSearch });
      setBankAccountSearch('');
      setBankAccountOpen(false);
    }
  };

  const handleSubmit = () => {
    onSubmit?.(formData);
    onOpenChange(false);
    // Reset form
    setFormData({
      project: '',
      total: '',
      vendor: '',
      expenseName: '',
      account: '',
      bankAccount: '',
      billable: false,
    });
  };

  const selectedVendor = vendors.find((v) => v.id === formData.vendor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">Add Expense</DialogTitle>
        </DialogHeader>

        <div className="border-l-2 border-primary/20 pl-6 space-y-6">
          {/* Project */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Project <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.project}
              onValueChange={(value) =>
                setFormData({ ...formData, project: value })
              }
            >
              <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name || project.address || 'Unnamed Project'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total & Vendor Row */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Total <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  value={formData.total}
                  onChange={(e) =>
                    setFormData({ ...formData, total: e.target.value })
                  }
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  className="border-0 border-b rounded-none pl-4 focus-visible:ring-0 focus-visible:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Vendor <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={formData.vendor}
                    onValueChange={(value) =>
                      setFormData({ ...formData, vendor: value })
                    }
                  >
                    <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.company || vendor.contact_name || vendor.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>

          {/* Expense Name */}
          <div className="space-y-2">
            <Label htmlFor="expenseName" className="text-sm font-medium">
              Expense Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="expenseName"
              value={formData.expenseName}
              onChange={(e) =>
                setFormData({ ...formData, expenseName: e.target.value })
              }
              placeholder="Enter expense name"
              className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
            />
          </div>

          {/* Account & Bank Account Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Account with searchable dropdown */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Account <span className="text-destructive">*</span>
              </Label>
              <Popover open={accountOpen} onOpenChange={setAccountOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={accountOpen}
                    className="w-full justify-between font-normal border-0 border-b rounded-none px-0 hover:bg-transparent"
                  >
                    {formData.account || (
                      <span className="text-muted-foreground">Select account</span>
                    )}
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 bg-background border shadow-lg z-50" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddAccount();
                        }
                      }}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    <button
                      onClick={handleAddAccount}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add New: Type Name & Press Enter
                    </button>
                    {filteredAccounts.map((account) => (
                      <button
                        key={account}
                        onClick={() => {
                          setFormData({ ...formData, account });
                          setAccountOpen(false);
                          setAccountSearch('');
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm hover:bg-muted',
                          formData.account === account && 'bg-muted'
                        )}
                      >
                        {account}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Bank Account with searchable dropdown */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Bank Account <span className="text-destructive">*</span>
              </Label>
              <Popover open={bankAccountOpen} onOpenChange={setBankAccountOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={bankAccountOpen}
                    className="w-full justify-between font-normal border-0 border-b rounded-none px-0 hover:bg-transparent"
                  >
                    {formData.bankAccount || (
                      <span className="text-muted-foreground">Select bank account</span>
                    )}
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 bg-background border shadow-lg z-50" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search..."
                      value={bankAccountSearch}
                      onChange={(e) => setBankAccountSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddBankAccount();
                        }
                      }}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    <button
                      onClick={handleAddBankAccount}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add New: Type Name & Press Enter
                    </button>
                    {filteredBankAccounts.map((account) => (
                      <button
                        key={account}
                        onClick={() => {
                          setFormData({ ...formData, bankAccount: account });
                          setBankAccountOpen(false);
                          setBankAccountSearch('');
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm hover:bg-muted',
                          formData.bankAccount === account && 'bg-muted'
                        )}
                      >
                        {account}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Billable Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="billable-expense"
              checked={formData.billable}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, billable: checked as boolean })
              }
            />
            <Label htmlFor="billable-expense" className="text-sm font-medium cursor-pointer">
              Billable
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Expense</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseDialog;
