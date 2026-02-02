import { useState } from "react";
import { SubContract, useSubContractBills } from "@/hooks/useSubContracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SubContractBillsTabProps {
  subContract: SubContract;
}

export function SubContractBillsTab({ subContract }: SubContractBillsTabProps) {
  const { data: bills = [], isLoading } = useSubContractBills(subContract.id);
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddBill = async () => {
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('sub_contract_bills')
        .insert([{
          sub_contract_id: subContract.id,
          bill_number: `BILL-${Date.now().toString().slice(-6)}`,
          bill_date: new Date().toISOString().split('T')[0],
        }]);
      
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['sub-contract-bills', subContract.id] });
      toast.success('Bill added');
    } catch (error) {
      console.error(error);
      toast.error('Failed to add bill');
    } finally {
      setIsAdding(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Bills</h3>
        <Button onClick={handleAddBill} disabled={isAdding} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Bill
        </Button>
      </div>

      {bills.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No bills recorded for this sub-contract</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={handleAddBill} disabled={isAdding}>
            <Plus className="w-4 h-4" />
            Add First Bill
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Bill #</TableHead>
                <TableHead>Bill Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => {
                const balance = (bill.total || 0) - (bill.paid || 0);
                const isPaid = balance <= 0 && (bill.total || 0) > 0;
                const isOverdue = bill.due_date && new Date(bill.due_date) < new Date() && !isPaid;
                
                return (
                  <TableRow key={bill.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{bill.bill_number || '-'}</TableCell>
                    <TableCell>
                      {bill.bill_date ? format(new Date(bill.bill_date), 'MM/dd/yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {bill.due_date ? format(new Date(bill.due_date), 'MM/dd/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(bill.total)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(bill.paid)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(balance)}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        isPaid 
                          ? 'bg-green-100 text-green-700' 
                          : isOverdue 
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }>
                        {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary */}
      {bills.length > 0 && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <span className="text-sm text-muted-foreground">Total Billed</span>
            <p className="text-lg font-semibold">
              {formatCurrency(bills.reduce((sum, b) => sum + (b.total || 0), 0))}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Total Paid</span>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(bills.reduce((sum, b) => sum + (b.paid || 0), 0))}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Outstanding</span>
            <p className="text-lg font-semibold text-orange-600">
              {formatCurrency(bills.reduce((sum, b) => sum + ((b.total || 0) - (b.paid || 0)), 0))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
