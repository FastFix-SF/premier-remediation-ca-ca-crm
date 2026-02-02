import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { OptimizedImage } from './ui/optimized-image';
import ProductCalculatorDialog from './ProductCalculatorDialog';
import AuthPromptModal from './store/AuthPromptModal';
import { useStoreAuth } from '@/hooks/useStoreAuth';
import { usePanelPricing } from '@/hooks/usePanelPricing';

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

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid' }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useStoreAuth();
  const { getPrice, loading: pricingLoading } = usePanelPricing();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  // Get effective price from CSV or fallback to product data
  const effectivePrice = useMemo(() => {
    if (pricingLoading) return product.pricePerUnit;
    const csvPrice = getPrice(product.title, product.color, product.gauge);
    return csvPrice ?? product.pricePerUnit;
  }, [product, getPrice, pricingLoading]);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAuthenticated) {
      setDialogOpen(true);
    } else {
      setAuthPromptOpen(true);
    }
  };

  const handleImageClick = () => {
    navigate(`/store/product/${product.id}`);
  };

  if (viewMode === 'list') {
    return (
      <>
        <div className="group bg-card rounded-lg border shadow-card hover:shadow-card-hover transition-smooth p-6">
          <div className="flex gap-6">
            <div 
              className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
              onClick={handleImageClick}
            >
              <OptimizedImage
                src={product.img}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="80px"
                quality={75}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {product.title}
              </h3>
              
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md">
                  {product.gauge}
                </span>
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-md">
                  {product.color}
                </span>
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-md">
                  {product.support}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col justify-between items-end text-right min-w-0">
              {effectivePrice ? (
                <div className="mb-4">
                  <div className="text-xl font-bold text-foreground">
                    ${effectivePrice.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    per {product.unit}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="text-lg font-semibold text-foreground">
                    Request Quote
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Custom Pricing
                  </div>
                </div>
              )}
              
              <Button 
                size="sm"
                onClick={handleSelect}
              >
                Select Product
              </Button>
            </div>
          </div>
        </div>
        <ProductCalculatorDialog
          product={product}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
        <AuthPromptModal
          open={authPromptOpen}
          onOpenChange={setAuthPromptOpen}
        />
      </>
    );
  }

  return (
    <>
      <div className="group bg-card rounded-lg border shadow-card hover:shadow-card-hover transition-smooth overflow-hidden">
        <div 
          className="aspect-[4/3] bg-muted overflow-hidden cursor-pointer"
          onClick={handleImageClick}
        >
          <OptimizedImage
            src={product.img}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={80}
          />
        </div>
        
        <div className="p-4">
          <div className="flex flex-wrap gap-1 mb-3">
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md">
              {product.gauge}
            </span>
            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-md">
              {product.color}
            </span>
            <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-md">
              {product.support}
            </span>
          </div>
          
          <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            {effectivePrice ? (
              <div>
                <div className="text-lg font-bold text-foreground">
                  ${effectivePrice.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  per {product.unit}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Request Quote
                </div>
                <div className="text-xs text-muted-foreground">
                  Custom Pricing
                </div>
              </div>
            )}
          </div>
          
          <Button 
            size="sm" 
            className="w-full"
            onClick={handleSelect}
          >
            Select Product
          </Button>
        </div>
      </div>
      <ProductCalculatorDialog
        product={product}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
      <AuthPromptModal
        open={authPromptOpen}
        onOpenChange={setAuthPromptOpen}
      />
    </>
  );
};

export default ProductCard;
