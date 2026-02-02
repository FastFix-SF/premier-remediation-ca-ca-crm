import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Search, ExternalLink, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FilterChip from '@/components/filters/FilterChip';
import { useIsMobile } from '@/hooks/use-mobile';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  project_name: string;
  total_amount: number;
  balance_due: number;
  status: string;
  due_date: string;
  created_at: string;
  paid_at: string | null;
}

type FilterType = 'all' | 'submitted' | 'paid' | 'due_1_30' | 'due_61_90' | 'due_91_plus' | 'in_collection' | 'write_off';

export function InvoicesManager() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'destructive';
      case 'in_collection':
        return 'destructive';
      case 'write_off':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filterInvoice = (invoice: Invoice): boolean => {
    if (selectedFilter === 'all') return true;
    
    if (selectedFilter === 'submitted') {
      return invoice.status === 'pending';
    }
    
    if (selectedFilter === 'paid') {
      return invoice.status === 'paid';
    }
    
    if (selectedFilter === 'in_collection') {
      return invoice.status === 'in_collection';
    }
    
    if (selectedFilter === 'write_off') {
      return invoice.status === 'write_off';
    }
    
    // For overdue filters
    if (invoice.status !== 'pending' && invoice.status !== 'overdue') return false;
    
    const daysOverdue = getDaysOverdue(invoice.due_date);
    
    if (selectedFilter === 'due_1_30') {
      return daysOverdue >= 1 && daysOverdue <= 30;
    }
    
    if (selectedFilter === 'due_61_90') {
      return daysOverdue >= 61 && daysOverdue <= 90;
    }
    
    if (selectedFilter === 'due_91_plus') {
      return daysOverdue >= 91;
    }
    
    return true;
  };

  const filteredInvoices = invoices
    .filter(filterInvoice)
    .filter(
      (invoice) =>
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.project_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getFilterCounts = () => {
    return {
      all: invoices.length,
      submitted: invoices.filter((i) => i.status === 'pending').length,
      paid: invoices.filter((i) => i.status === 'paid').length,
      due_1_30: invoices.filter((i) => {
        const days = getDaysOverdue(i.due_date);
        return (i.status === 'pending' || i.status === 'overdue') && days >= 1 && days <= 30;
      }).length,
      due_61_90: invoices.filter((i) => {
        const days = getDaysOverdue(i.due_date);
        return (i.status === 'pending' || i.status === 'overdue') && days >= 61 && days <= 90;
      }).length,
      due_91_plus: invoices.filter((i) => {
        const days = getDaysOverdue(i.due_date);
        return (i.status === 'pending' || i.status === 'overdue') && days >= 91;
      }).length,
      in_collection: invoices.filter((i) => i.status === 'in_collection').length,
      write_off: invoices.filter((i) => i.status === 'write_off').length,
    };
  };

  const filterCounts = getFilterCounts();

  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === 'pending').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.total_amount, 0),
    totalOutstanding: invoices.reduce((sum, i) => sum + i.balance_due, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {!isMobile && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        )}

        {!isMobile && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(stats.totalOutstanding)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Invoices</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <FilterChip
              label="All"
              selected={selectedFilter === 'all'}
              onClick={() => setSelectedFilter('all')}
              count={filterCounts.all}
            />
            <FilterChip
              label="Submitted"
              selected={selectedFilter === 'submitted'}
              onClick={() => setSelectedFilter('submitted')}
              count={filterCounts.submitted}
            />
            <FilterChip
              label="Paid"
              selected={selectedFilter === 'paid'}
              onClick={() => setSelectedFilter('paid')}
              count={filterCounts.paid}
            />
            <FilterChip
              label="Due 1-30 Days"
              selected={selectedFilter === 'due_1_30'}
              onClick={() => setSelectedFilter('due_1_30')}
              count={filterCounts.due_1_30}
            />
            <FilterChip
              label="Due 61-90 Days"
              selected={selectedFilter === 'due_61_90'}
              onClick={() => setSelectedFilter('due_61_90')}
              count={filterCounts.due_61_90}
            />
            <FilterChip
              label="Due 91+ Days"
              selected={selectedFilter === 'due_91_plus'}
              onClick={() => setSelectedFilter('due_91_plus')}
              count={filterCounts.due_91_plus}
            />
            <FilterChip
              label="In Collection"
              selected={selectedFilter === 'in_collection'}
              onClick={() => setSelectedFilter('in_collection')}
              count={filterCounts.in_collection}
            />
            <FilterChip
              label="Write-Off"
              selected={selectedFilter === 'write_off'}
              onClick={() => setSelectedFilter('write_off')}
              count={filterCounts.write_off}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No invoices match your search.' : 'No invoices found.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance Due</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{invoice.customer_name}</div>
                            <div className="text-sm text-muted-foreground">{invoice.customer_email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.project_name}</TableCell>
                      <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell>
                        <span className={invoice.balance_due > 0 ? 'text-warning font-medium' : ''}>
                          {formatCurrency(invoice.balance_due)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status) as any}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/invoice/${invoice.invoice_number}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
