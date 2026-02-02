import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useStoreAuth } from '@/hooks/useStoreAuth';
import Header from '../components/Header';
import CheckoutModal from '../components/CheckoutModal';
import AuthPromptModal from '../components/store/AuthPromptModal';
import { toast } from 'sonner';

const Cart = () => {
  const navigate = useNavigate();
  const { state, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useStoreAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case 'LF':
        return 'Linear Feet';
      case 'SQ':
        return 'Square Feet';
      case 'EA':
        return 'Quantity';
      default:
        return 'Amount';
    }
  };

  const getInputStep = (unit: string) => {
    return unit === 'EA' ? 1 : 0.01;
  };

  const handleQuantityChange = (productId: string, newQuantity: number, unit: string) => {
    const minValue = unit === 'EA' ? 1 : 0.01;
    if (newQuantity >= minValue) {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (state.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    setShowCheckout(true);
  };

  const handleRequestQuote = () => {
    toast.success('Quote request submitted! Our team will contact you within 24 hours with a detailed quote.');
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Start adding some roofing materials to your cart.</p>
            <button
              onClick={() => navigate('/store')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors duration-200"
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
          <button
            onClick={clearCart}
            className="text-destructive hover:text-destructive/80 font-medium transition-colors duration-200"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {state.items.map((item) => (
              <div key={item.productId} className="bg-card rounded-lg border border-border shadow-sm p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded-lg bg-muted"
                  />
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-sm text-muted-foreground">
                        ${item.pricePerUnit.toFixed(2)} per {item.unit}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-foreground">
                          {getUnitLabel(item.unit)}:
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.quantity - getInputStep(item.unit), item.unit)}
                            className="p-1 rounded border border-border hover:bg-muted"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.productId, Number(e.target.value), item.unit)}
                            step={getInputStep(item.unit)}
                            min={item.unit === 'EA' ? '1' : '0.01'}
                            className="w-20 px-2 py-1 text-center border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                          />
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.quantity + getInputStep(item.unit), item.unit)}
                            className="p-1 rounded border border-border hover:bg-muted"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-primary">
                          ${item.totalPrice.toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-foreground mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items ({state.totalItems})</span>
                  <span className="font-medium text-foreground">${state.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-muted-foreground">Calculated at checkout</span>
                </div>
                <hr className="border-border my-4" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-foreground">Estimated Total</span>
                  <span className="text-primary">${state.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-accent text-accent-foreground py-3 px-6 rounded-lg font-semibold hover:bg-accent/90 transition-colors duration-200"
                >
                  Proceed to Checkout
                </button>
                
                <button
                  onClick={handleRequestQuote}
                  className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors duration-200"
                >
                  Request Quote
                </button>
                
                <button
                  onClick={() => navigate('/store')}
                  className="w-full bg-muted text-muted-foreground py-3 px-6 rounded-lg font-semibold hover:bg-muted/80 transition-colors duration-200"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        items={state.items}
      />

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        open={showAuthPrompt}
        onOpenChange={setShowAuthPrompt}
        title="Sign in to checkout"
        description="Create an account or sign in to complete your purchase."
      />
    </div>
  );
};

export default Cart;
