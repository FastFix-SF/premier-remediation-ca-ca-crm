import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wrench, Package, FileText, Image as ImageIcon } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface InvoiceItem {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total: number;
  photo_url?: string;
  description?: string;
}

export const InvoicePayment = () => {
  const { invoiceNumber } = useParams();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [balanceDue, setBalanceDue] = useState(0);
  const [creditCardFee, setCreditCardFee] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceNumber) {
      fetchInvoice();
    }
  }, [invoiceNumber]);

  useEffect(() => {
    if (invoice) {
      if (selectedPayment === 'credit_card') {
        const fee = invoice.total_amount * 0.03;
        setCreditCardFee(fee);
        setBalanceDue(invoice.total_amount + fee);
      } else {
        setCreditCardFee(0);
        setBalanceDue(invoice.total_amount);
      }
    }
  }, [selectedPayment, invoice]);

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('invoice_number', invoiceNumber)
        .maybeSingle();

      if (error) throw error;
      setInvoice(data);
      setBalanceDue(data.total_amount);

      // Fetch invoice items
      if (data?.id) {
        const { data: items, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', data.id)
          .order('display_order');

        if (!itemsError && items) {
          setInvoiceItems(items as InvoiceItem[]);
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoice',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getItemTypeIcon = (itemType: string) => {
    switch (itemType?.toLowerCase()) {
      case 'labor':
        return <Wrench className="h-4 w-4" />;
      case 'material':
        return <Package className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getItemTypeBadgeColor = (itemType: string) => {
    switch (itemType?.toLowerCase()) {
      case 'labor':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'material':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleStripePayment = async () => {
    setProcessing(true);
    try {
      // Validate amount
      if (balanceDue <= 0) {
        throw new Error('Invalid payment amount');
      }

      // First update the invoice
      await updateInvoice();

      console.log('Invoking create-invoice-checkout with:', {
        invoiceNumber: invoice.invoice_number,
        amount: balanceDue,
        customerEmail: invoice.customer_email,
      });

      const { data, error } = await supabase.functions.invoke('create-invoice-checkout', {
        body: {
          invoiceNumber: invoice.invoice_number,
          amount: balanceDue,
          customerEmail: invoice.customer_email,
        },
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error('No client secret returned');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Unable to initialize payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const updateInvoice = async () => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          payment_method: selectedPayment,
          credit_card_fee: creditCardFee,
          balance_due: balanceDue,
        })
        .eq('id', invoice.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payment method updated',
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto bg-card border rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <h1 className="text-2xl font-bold">The Roofing Friend Inc.</h1>
          <p className="text-sm">244 Harbison Dr, Hayward, CA 94544</p>
          <p className="text-sm">510-670-1907 | info@theroof.info</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-3 gap-4 border-b pb-4">
            <div>
              <p className="text-sm text-muted-foreground">INVOICE #</p>
              <p className="font-semibold">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">DATE</p>
              <p className="font-semibold">{new Date(invoice.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">DUE</p>
              <p className="font-semibold">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon Receipt'}</p>
            </div>
          </div>

          {/* Customer & Project Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 border-b pb-1">CUSTOMER</h3>
              <p>{invoice.customer_name}</p>
              {invoice.customer_email && <p className="text-sm text-muted-foreground">{invoice.customer_email}</p>}
              {invoice.customer_phone && <p className="text-sm text-muted-foreground">{invoice.customer_phone}</p>}
            </div>
            <div>
              <h3 className="font-semibold mb-2 border-b pb-1">PROJECT</h3>
              <p>{invoice.project_name}</p>
              {invoice.project_address && <p className="text-sm text-muted-foreground">{invoice.project_address}</p>}
            </div>
          </div>

          {/* Description */}
          {invoice.description && (
            <div>
              <h3 className="font-semibold mb-2 border-b pb-1">DESCRIPTION</h3>
              <p className="text-sm">{invoice.description}</p>
            </div>
          )}

          {/* Line Items */}
          <div>
            <h3 className="font-semibold mb-3 border-b pb-1">SERVICES & ITEMS</h3>
            {invoiceItems.length > 0 ? (
              <div className="space-y-3">
                {invoiceItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 border rounded-lg bg-muted/30">
                    {/* Photo or Icon */}
                    <div className="flex-shrink-0">
                      {item.photo_url ? (
                        <button
                          onClick={() => setSelectedPhoto(item.photo_url!)}
                          className="w-14 h-14 rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors"
                        >
                          <img 
                            src={item.photo_url} 
                            alt={item.item_name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center border">
                          {getItemTypeIcon(item.item_type)}
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getItemTypeBadgeColor(item.item_type)}`}>
                          {item.item_type || 'Service'}
                        </span>
                      </div>
                      <p className="font-medium text-sm truncate">{item.item_name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.quantity} {item.unit} × ${item.unit_cost?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    {/* Total */}
                    <div className="flex-shrink-0 text-right">
                      <p className="font-semibold">${item.total?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground border rounded-lg">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No itemized details available</p>
              </div>
            )}
          </div>

          {/* Photo Lightbox */}
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-3xl p-2">
              {selectedPhoto && (
                <img 
                  src={selectedPhoto} 
                  alt="Item photo" 
                  className="w-full h-auto rounded-lg"
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Payment Methods */}
          <div>
            <h3 className="font-semibold mb-3">PAYMENT METHOD:</h3>
            <div className="space-y-2">
              {['check', 'zelle', 'credit_card', 'ach'].map((method) => (
                <label key={method} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPayment === method}
                    onChange={() => setSelectedPayment(method)}
                    className="w-4 h-4"
                  />
                  <span className="capitalize">{method.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({invoice.tax_rate}%)</span>
              <span>${invoice.tax_amount.toFixed(2)}</span>
            </div>
            {creditCardFee > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Credit Card Processing Fee (3%)</span>
                <span>${creditCardFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Total</span>
              <span>${invoice.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Balance Due</span>
              <span>${balanceDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Terms */}
          {invoice.payment_terms && (
            <div className="border p-4 rounded bg-muted/50">
              <h3 className="font-semibold mb-2">TERMS & CONDITIONS</h3>
              <p className="text-sm whitespace-pre-wrap">{invoice.payment_terms}</p>
            </div>
          )}

          {/* Stripe Payment Embed */}
          {selectedPayment === 'credit_card' && (
            <div className="border rounded-lg p-6 bg-muted/30">
              <h3 className="font-semibold mb-4">Credit Card Payment</h3>
              {!clientSecret ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click below to proceed to our secure payment page powered by Stripe.
                  </p>
                  <Button 
                    onClick={handleStripePayment} 
                    disabled={processing}
                    className="w-full"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading payment form...
                      </>
                    ) : (
                      `Pay $${balanceDue.toFixed(2)} with Credit Card`
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    A 3% processing fee has been added for credit card payments
                  </p>
                </>
              ) : (
                <div className="mt-4">
                  <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ clientSecret }}
                  >
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              )}
            </div>
          )}

          {/* Other Payment Methods */}
          {selectedPayment && selectedPayment !== 'credit_card' && (
            <div className="border rounded-lg p-6 bg-muted/30">
              <h3 className="font-semibold mb-4">Payment Instructions</h3>
              {selectedPayment === 'check' && (
                <div className="space-y-2 text-sm">
                  <p><strong>Make check payable to:</strong> The Roofing Friend Inc.</p>
                  <p><strong>Mail to:</strong> 244 Jackson St, Hayward, CA 94544</p>
                  <p className="text-muted-foreground">Please include invoice number on the check</p>
                </div>
              )}
              {selectedPayment === 'zelle' && (
                <div className="space-y-4 text-sm">
                  <p><strong>Send payment to:</strong> roofingfriend@gmail.com</p>
                  <p className="text-muted-foreground">Please include invoice number in the note</p>
                  <div className="flex justify-center mt-4">
                    <img 
                      src="/zelle-qr.png" 
                      alt="Zelle QR Code" 
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                </div>
              )}
              {selectedPayment === 'ach' && (
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">ACH Bank Transfer Details</p>
                  <p><strong>Routing Number:</strong> 322271627</p>
                  <p><strong>Account Number:</strong> 855937857</p>
                </div>
              )}
              <Button 
                onClick={updateInvoice} 
                className="w-full mt-4"
                size="lg"
              >
                Confirm Payment Method
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
