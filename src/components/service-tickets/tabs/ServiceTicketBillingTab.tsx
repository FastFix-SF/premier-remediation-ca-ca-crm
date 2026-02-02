import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useServiceTicketInvoices, useServiceTicketPayments } from '@/hooks/useServiceTickets';
import { format } from 'date-fns';

interface ServiceTicketBillingTabProps {
  ticketId: string;
}

export const ServiceTicketBillingTab: React.FC<ServiceTicketBillingTabProps> = ({ ticketId }) => {
  const { data: invoices = [] } = useServiceTicketInvoices(ticketId);
  const { data: payments = [] } = useServiceTicketPayments(ticketId);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0);

  return (
    <div className="space-y-6">
      {/* Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-2 w-2 bg-green-500 rounded" />
              Invoices
            </CardTitle>
            <Badge variant="outline" className="text-green-600">
              💰 ${totalInvoiced.toFixed(2)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Invoice #</th>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-right p-3 text-sm font-medium">Amount</th>
                  <th className="text-right p-3 text-sm font-medium">Paid</th>
                  <th className="text-right p-3 text-sm font-medium">Balance</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t">
                    <td className="p-3 text-sm">{invoice.invoice_number}</td>
                    <td className="p-3 text-sm">
                      {format(new Date(invoice.invoice_date), 'MM/dd/yyyy')}
                    </td>
                    <td className="p-3 text-sm text-right">${invoice.amount.toFixed(2)}</td>
                    <td className="p-3 text-sm text-right">${invoice.paid_amount.toFixed(2)}</td>
                    <td className="p-3 text-sm text-right">${invoice.balance.toFixed(2)}</td>
                    <td className="p-3">
                      <Badge
                        variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                        className={
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'submitted'
                            ? 'bg-orange-100 text-orange-800'
                            : ''
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No invoices
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-2 w-2 bg-blue-500 rounded" />
              Payments
            </CardTitle>
            <Badge variant="outline" className="text-green-600">
              💰 ${totalPaid.toFixed(2)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Payment Note</th>
                  <th className="text-right p-3 text-sm font-medium">Amount</th>
                  <th className="text-left p-3 text-sm font-medium">Type</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t">
                    <td className="p-3 text-sm">
                      {format(new Date(payment.payment_date), 'MM/dd/yyyy')}
                    </td>
                    <td className="p-3 text-sm">{payment.payment_note || '-'}</td>
                    <td className="p-3 text-sm text-right">${payment.amount.toFixed(2)}</td>
                    <td className="p-3 text-sm">{payment.payment_type}</td>
                    <td className="p-3">
                      <Badge
                        className={
                          payment.status === 'received'
                            ? 'bg-green-100 text-green-800'
                            : ''
                        }
                      >
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No payments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
