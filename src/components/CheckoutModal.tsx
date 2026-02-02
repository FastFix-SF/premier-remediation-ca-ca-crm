import React, { useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/contexts/CartContext';
import { useStoreAuth } from '@/hooks/useStoreAuth';

// Initialize Stripe with publishable key from environment
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, items }) => {
  const { user } = useStoreAuth();

  const fetchClientSecret = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { 
        items, 
        embedded: true,
        userId: user?.id || null,
        customerName: user?.user_metadata?.display_name || null,
        customerPhone: user?.phone || null,
        customerEmail: user?.email || null,
      }
    });

    if (error || data?.error) {
      console.error('Checkout error:', error || data?.error);
      throw new Error(data?.error || 'Failed to create checkout session');
    }

    return data.clientSecret;
  }, [items, user]);

  const options = { fetchClientSecret };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 overflow-hidden bg-background border-border max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Complete Your Purchase</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
            <EmbeddedCheckout className="min-h-[400px]" />
          </EmbeddedCheckoutProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
