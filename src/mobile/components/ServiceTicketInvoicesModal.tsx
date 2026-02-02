import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Receipt, DollarSign } from 'lucide-react';
import { useServiceTicketInvoices, useServiceTicketPayments } from '@/hooks/useServiceTickets';
import { formatDistanceToNow } from 'date-fns';

interface ServiceTicketInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketTitle: string;
  customerName?: string;
  customerEmail?: string;
  address?: string;
}

export const ServiceTicketInvoicesModal: React.FC<ServiceTicketInvoicesModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketTitle,
  customerName,
  customerEmail,
  address
}) => {
  const { data: invoices = [], isLoading: invoicesLoading } = useServiceTicketInvoices(ticketId);
  const { data: payments = [], isLoading: paymentsLoading } = useServiceTicketPayments(ticketId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      case 'partial': return 'bg-amber-100 text-amber-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalPaid = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
  const balance = totalInvoiced - totalPaid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Payments - {ticketTitle}</DialogTitle>
        </DialogHeader>
        
        {/* Customer Info */}
        {customerName && (
          <div className="py-2 border-b">
            <p className="text-sm font-medium">{customerName}</p>
            {customerEmail && <p className="text-xs text-muted-foreground">{customerEmail}</p>}
            {address && <p className="text-xs text-muted-foreground">{address}</p>}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 py-4">
          <Card className="bg-muted/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Invoiced</p>
              <p className="text-lg font-semibold">${totalInvoiced.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-lg font-semibold text-emerald-600">${totalPaid.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className={balance > 0 ? "bg-amber-50" : "bg-muted/50"}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={`text-lg font-semibold ${balance > 0 ? 'text-amber-600' : ''}`}>
                ${balance.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Invoices Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Invoices
              </h4>
            </div>
            
            {invoicesLoading ? (
              <p className="text-center text-muted-foreground py-4">Loading...</p>
            ) : invoices.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No invoices yet</p>
            ) : (
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="bg-muted/30">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(invoice.invoice_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${invoice.amount.toLocaleString()}</p>
                          <Badge className={getStatusColor(invoice.status)} variant="outline">
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Payments Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Payments
              </h4>
            </div>
            
            {paymentsLoading ? (
              <p className="text-center text-muted-foreground py-4">Loading...</p>
            ) : payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No payments recorded</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <Card key={payment.id} className="bg-emerald-50/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{payment.payment_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="font-semibold text-emerald-600">
                          +${payment.amount.toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
