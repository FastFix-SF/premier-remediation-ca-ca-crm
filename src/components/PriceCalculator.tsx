
import React from 'react';
import { ArrowDown } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import PanelCalculator from './PanelCalculator';

interface Product {
  id: string;
  title: string;
  img: string;
  unit: string;
  pricePerUnit: number | null;
}

interface PriceCalculatorProps {
  product: Product;
  measurement: number;
  setMeasurement: (value: number) => void;
  onAddToCart: () => void;
  onRequestQuote: () => void;
}

const PriceCalculator = ({ 
  product, 
  measurement, 
  setMeasurement, 
  onAddToCart, 
  onRequestQuote 
}: PriceCalculatorProps) => {
  const { addToCart } = useCart();

  // Use PanelCalculator for LF (linear feet) products
  if (product.pricePerUnit && product.unit === 'LF') {
    return (
      <PanelCalculator 
        product={{ ...product, pricePerUnit: product.pricePerUnit }} 
        onAddToCart={onAddToCart} 
      />
    );
  }

  const calculateTotal = () => {
    if (!product || !product.pricePerUnit) return 0;
    return product.pricePerUnit * measurement;
  };

  const getInputLabel = () => {
    switch (product?.unit) {
      case 'SQ':
        return 'Square Feet';
      case 'EA':
        return 'Quantity';
      default:
        return 'Amount';
    }
  };

  const getInputPlaceholder = () => {
    switch (product?.unit) {
      case 'SQ':
        return 'Enter square feet (e.g., 40.2)';
      case 'EA':
        return 'Enter quantity (e.g., 5)';
      default:
        return 'Enter amount';
    }
  };

  const getInputStep = () => {
    return product?.unit === 'EA' ? '1' : '0.01';
  };

  const getInputMin = () => {
    return product?.unit === 'EA' ? '1' : '0.01';
  };

  const handleAddToCart = () => {
    if (!product.pricePerUnit) return;

    const cartItem = {
      productId: product.id,
      title: product.title,
      img: product.img,
      unit: product.unit,
      pricePerUnit: product.pricePerUnit,
      quantity: measurement,
      totalPrice: calculateTotal(),
    };

    addToCart(cartItem);
    
    toast.success("Added to cart!", {
      description: `${product.title} has been added to your cart.`,
      duration: 2000,
    });

    onAddToCart();
  };

  if (product.pricePerUnit) {
    return (
      <div className="border-t pt-8">
        <h3 className="text-xl font-bold text-foreground mb-4">Configure Your Order</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            {getInputLabel()}
          </label>
          <input
            type="number"
            min={getInputMin()}
            step={getInputStep()}
            value={measurement}
            onChange={(e) => setMeasurement(Number(e.target.value))}
            placeholder={getInputPlaceholder()}
            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
          />
        </div>

        <div className="bg-primary/5 p-6 rounded-lg mb-6 border border-primary/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Price per {product.unit}:</span>
            <span className="font-medium text-foreground">${product.pricePerUnit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">{getInputLabel()}:</span>
            <span className="font-medium text-foreground">{measurement} {product.unit}</span>
          </div>
          <hr className="my-3 border-border" />
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-foreground">Total:</span>
            <span className="text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full bg-accent text-accent-foreground py-3 px-6 rounded-lg font-semibold text-lg hover:bg-accent/90 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          Add to Cart
          <ArrowDown className="w-5 h-5 rotate-[-90deg]" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t pt-8">
      <div className="bg-muted p-6 rounded-lg mb-6 text-center">
        <h3 className="text-xl font-bold text-foreground mb-2">Custom Pricing Available</h3>
        <p className="text-muted-foreground">This product requires custom pricing based on your specific requirements.</p>
      </div>

      <button
        onClick={onRequestQuote}
        className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors duration-200"
      >
        Request Quote
      </button>
    </div>
  );
};

export default PriceCalculator;
