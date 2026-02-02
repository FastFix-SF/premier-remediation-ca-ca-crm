import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { OptimizedImage } from './ui/optimized-image';
import PanelCalculator from './PanelCalculator';
import { useCart } from '../contexts/CartContext';
import { usePanelPricing } from '@/hooks/usePanelPricing';
import { toast } from 'sonner';
import { ArrowDown, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  img: string;
  gauge: string;
  color: string;
  support: string;
  unit: string;
  pricePerUnit: number | null;
  description: string;
}

interface ProductCalculatorDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductCalculatorDialog: React.FC<ProductCalculatorDialogProps> = ({
  product,
  open,
  onOpenChange,
}) => {
  const { addToCart } = useCart();
  const { getPrice, getPricesForProduct, loading: pricingLoading } = usePanelPricing();
  const [measurement, setMeasurement] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Get the effective price - either from pricing CSV or product data
  const effectivePrice = useMemo(() => {
    if (!product) return null;
    
    // First try to get price from the pricing CSV
    const csvPrice = getPrice(product.title, product.color, product.gauge);
    if (csvPrice !== null) {
      return csvPrice;
    }
    
    // Fall back to product's pricePerUnit
    return product.pricePerUnit;
  }, [product, getPrice]);

  // Get available price variants for this product
  const priceVariants = useMemo(() => {
    if (!product) return [];
    return getPricesForProduct(product.title);
  }, [product, getPricesForProduct]);

  if (!product) return null;

  const handleAddToCart = () => {
    onOpenChange(false);
    setMeasurement(1);
    setSelectedVariant(null);
  };

  const handleRequestQuote = () => {
    toast.success("Quote request submitted!", {
      description: "We'll get back to you with pricing shortly.",
      duration: 2000,
    });
    onOpenChange(false);
  };

  // Simple calculator for non-LF products
  const SimpleCalculator = () => {
    const calculateTotal = () => {
      if (!effectivePrice) return 0;
      return effectivePrice * measurement;
    };

    const getInputLabel = () => {
      switch (product.unit) {
        case 'SQ':
          return 'Square Feet';
        case 'EA':
          return 'Quantity';
        default:
          return 'Amount';
      }
    };

    const handleSimpleAddToCart = () => {
      if (!effectivePrice) return;

      const cartItem = {
        productId: product.id,
        title: selectedVariant || product.title,
        img: product.img,
        unit: product.unit,
        pricePerUnit: effectivePrice,
        quantity: measurement,
        totalPrice: calculateTotal(),
      };

      addToCart(cartItem);
      
      toast.success("Added to cart!", {
        description: `${product.title} has been added to your cart.`,
        duration: 2000,
      });

      handleAddToCart();
    };

    if (pricingLoading) {
      return (
        <div className="pt-4 flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading pricing...</span>
        </div>
      );
    }

    if (!effectivePrice) {
      return (
        <div className="pt-4">
          <div className="bg-muted p-6 rounded-lg mb-6 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Custom Pricing Available</h3>
            <p className="text-muted-foreground">This product requires custom pricing based on your specific requirements.</p>
          </div>

          <button
            onClick={handleRequestQuote}
            className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors duration-200"
          >
            Request Quote
          </button>
        </div>
      );
    }

    return (
      <div className="pt-4">
        {/* Variant selector if multiple prices available */}
        {priceVariants.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Variant
            </label>
            <select
              value={selectedVariant || ''}
              onChange={(e) => setSelectedVariant(e.target.value || null)}
              className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
            >
              <option value="">Default ({product.gauge})</option>
              {priceVariants.map((v, i) => (
                <option key={i} value={v.variant}>
                  {v.variant} - ${v.price.toFixed(2)}/LF
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            {getInputLabel()}
          </label>
          <input
            type="number"
            min={product.unit === 'EA' ? '1' : '0.01'}
            step={product.unit === 'EA' ? '1' : '0.01'}
            value={measurement}
            onChange={(e) => setMeasurement(Number(e.target.value))}
            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
          />
        </div>

        <div className="bg-primary/5 p-6 rounded-lg mb-6 border border-primary/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Price per {product.unit}:</span>
            <span className="font-medium text-foreground">${effectivePrice.toFixed(2)}</span>
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
          onClick={handleSimpleAddToCart}
          className="w-full bg-accent text-accent-foreground py-3 px-6 rounded-lg font-semibold text-lg hover:bg-accent/90 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          Add to Cart
          <ArrowDown className="w-5 h-5 rotate-[-90deg]" />
        </button>
      </div>
    );
  };

  // Determine if we should show panel calculator (LF products with pricing)
  const showPanelCalculator = product.unit === 'LF' && effectivePrice !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{product.title}</DialogTitle>
        </DialogHeader>

        {/* Product Info */}
        <div className="flex gap-4 mb-4">
          <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
            <OptimizedImage
              src={product.img}
              alt={product.title}
              className="w-full h-full object-cover"
              sizes="96px"
              quality={75}
            />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md">
                {product.gauge}
              </span>
              <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-md">
                {product.color}
              </span>
              <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-md">
                {product.support}
              </span>
              {effectivePrice && (
                <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded-md">
                  ${effectivePrice.toFixed(2)}/{product.unit}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{product.description}</p>
          </div>
        </div>

        {/* Calculator */}
        {pricingLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading pricing...</span>
          </div>
        ) : showPanelCalculator ? (
          <PanelCalculator
            product={{ ...product, pricePerUnit: effectivePrice! }}
            onAddToCart={handleAddToCart}
          />
        ) : (
          <SimpleCalculator />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductCalculatorDialog;
