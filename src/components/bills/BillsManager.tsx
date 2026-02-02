import { useState, useMemo } from 'react';
import { useBills, Bill, useCreateBill } from '@/hooks/useBills';
import { BillDialog } from './BillDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Loader2, Receipt, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { format, isAfter, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const BillsManager = () => {
  const { data: bills = [], isLoading } = useBills();
  const createBill = useCreateBill();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState('all');

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        bill.bill_number?.toLowerCase().includes(query) ||
        bill.vendor_name?.toLowerCase().includes(query) ||
        bill.project_name?.toLowerCase().includes(query) ||
        bill.description?.toLowerCase().includes(query)
      );
    });
  }, [bills, searchQuery]);

  const tableFilteredBills = useMemo(() => {
    if (tableFilter === 'all') return filteredBills;
    if (tableFilter === 'open') return filteredBills.filter(b => b.status === 'open' || b.status === 'partial');
    if (tableFilter === 'paid') return filteredBills.filter(b => b.status === 'paid');
    return filteredBills;
  }, [filteredBills, tableFilter]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const today = new Date();
    const last14Days = subDays(today, 14);
    const thisMonthStart = startOfMonth(today);
    const thisMonthEnd = endOfMonth(today);

    const recentPayments = bills
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + (b.paid || 0), 0);

    const unpaidBills = bills
      .filter(b => b.status !== 'paid' && b.status !== 'void')
      .reduce((sum, b) => sum + (b.balance_due || 0), 0);

    const overdueBills = bills.filter(b => 
      b.due_date && 
      isAfter(today, new Date(b.due_date)) && 
      b.status !== 'paid' && 
      b.status !== 'void'
    );

    const billsComingDue = bills.filter(b =>
      b.due_date &&
      isWithinInterval(new Date(b.due_date), { start: today, end: subDays(today, -7) }) &&
      b.status !== 'paid' &&
      b.status !== 'void'
    );

    return {
      recentPayments,
      unpaidBills,
      overdueCount: overdueBills.length,
      overdueAmount: overdueBills.reduce((sum, b) => sum + (b.balance_due || 0), 0),
      comingDueCount: billsComingDue.length,
      comingDueAmount: billsComingDue.reduce((sum, b) => sum + (b.balance_due || 0), 0),
    };
  }, [bills]);

  const handleCreateBill = async () => {
    const result = await createBill.mutateAsync({
      bill_number: `BILL-${Date.now().toString().slice(-6)}`,
      bill_date: new Date().toISOString().split('T')[0],
      status: 'open',
    });
    setSelectedBill(result);
    setDialogOpen(true);
  };

  const handleBillClick = (bill: Bill) => {
    setSelectedBill(bill);
    setDialogOpen(true);
  };

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  const getStatusBadge = (bill: Bill) => {
    const today = new Date();
    const isOverdue = bill.due_date && isAfter(today, new Date(bill.due_date)) && bill.status !== 'paid';
    
    if (bill.status === 'paid') {
      return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
    }
    if (bill.status === 'void') {
      return <Badge variant="secondary">Void</Badge>;
    }
    if (isOverdue) {
      return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
    }
    if (bill.status === 'partial') {
      return <Badge className="bg-yellow-100 text-yellow-700">Partial</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-700">Open</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Bills
          </h2>
          <p className="text-muted-foreground text-sm">
            {bills.length} total bills
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bills..."
              className="pl-9"
            />
          </div>
          <Button onClick={handleCreateBill} disabled={createBill.isPending}>
            {createBill.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            New Bill
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.recentPayments)}</div>
            <p className="text-xs text-muted-foreground">Total paid bills</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Bills</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.unpaidBills)}</div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdueAmount)}</div>
            <p className="text-xs text-muted-foreground">{stats.overdueCount} bills past due</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coming Due</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.comingDueAmount)}</div>
            <p className="text-xs text-muted-foreground">{stats.comingDueCount} bills due soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      <div className="flex-1 border rounded-lg overflow-hidden">
        <div className="p-4 bg-muted/30 border-b flex items-center gap-4">
          <Tabs value={tableFilter} onValueChange={setTableFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {tableFilteredBills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No bills found</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={handleCreateBill}>
              <Plus className="w-4 h-4" />
              Create First Bill
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Bill #</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Billable</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableFilteredBills.map((bill) => (
                <TableRow 
                  key={bill.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleBillClick(bill)}
                >
                  <TableCell className="font-medium">{bill.bill_number || '-'}</TableCell>
                  <TableCell>
                    {bill.due_date ? format(new Date(bill.due_date), 'MM/dd/yyyy') : '-'}
                  </TableCell>
                  <TableCell>{bill.vendor_name || '-'}</TableCell>
                  <TableCell>{bill.project_name || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{bill.description || '-'}</TableCell>
                  <TableCell>
                    <input 
                      type="checkbox" 
                      checked={bill.is_billable || false} 
                      readOnly 
                      className="pointer-events-none"
                    />
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(bill.total)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(bill.balance_due)}
                  </TableCell>
                  <TableCell>{getStatusBadge(bill)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog */}
      <BillDialog
        bill={selectedBill}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};
