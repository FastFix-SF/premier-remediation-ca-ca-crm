import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import Header from '../components/Header';
import PriceCalculator from '../components/PriceCalculator';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

interface Product {
  id: string;
  title: string;
  img: string;
  gauge: string;
  color: string;
  profile: string;
  unit: string;
  pricePerUnit: number | null;
  description: string;
  coverWidth: string;
  grade: string;
  moistureLok: boolean;
}

interface ProductData {
  products: {
    roofing_panels: {
      id: string;
      title: string;
      panel_profile: string;
      finish_type: string;
      grade: string;
      gauge_range: string;
      cover_width_inches: string;
      colors_available: string;
      moisturelok_option: boolean;
      unit: string;
      category: string;
      image_url: string;
      price_per_unit?: number;
    }[];
  };
  metadata: any;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [measurement, setMeasurement] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch('/data/products.json');
      const data: ProductData = await response.json();
      
      const foundProduct = data.products.roofing_panels.find(p => p.id === id);
      
      if (foundProduct) {
        const transformedProduct: Product = {
          id: foundProduct.id,
          title: foundProduct.title,
          img: foundProduct.image_url,
          gauge: foundProduct.gauge_range,
          color: foundProduct.colors_available,
          profile: foundProduct.panel_profile,
          unit: foundProduct.unit,
          pricePerUnit: foundProduct.price_per_unit || null,
          description: `${foundProduct.finish_type} finish, Grade ${foundProduct.grade}`,
          coverWidth: foundProduct.cover_width_inches,
          grade: foundProduct.grade,
          moistureLok: foundProduct.moisturelok_option,
        };
        
        setProduct(transformedProduct);
      } else {
        setProduct(null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    // PriceCalculator handles adding to cart, this callback just for any post-add actions
  };

  const handleRequestQuote = () => {
    toast.success('Quote request submitted!', {
      description: 'Our team will contact you within 24 hours with a detailed quote.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-muted-foreground font-medium">Loading product...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/store')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200"
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
      
      {/* Breadcrumb & Cart */}
      <div className="bg-muted/30 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/store')}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-medium transition-colors duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              Back to Store
            </button>
            
            <button
              onClick={() => navigate('/cart')}
              className="relative inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Cart
              {state.totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {state.totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-2xl overflow-hidden border border-border">
              <img
                src={product.img}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info & Calculator */}
          <div className="space-y-6">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-lg border border-primary/20">
                {product.gauge}
              </span>
              <span className="px-3 py-1 bg-muted text-muted-foreground text-sm font-semibold rounded-lg">
                {product.profile}
              </span>
              {product.moistureLok && (
                <span className="px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-lg border border-accent/20">
                  MoistureLok
                </span>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-3">
                {product.title}
              </h1>
              <p className="text-muted-foreground text-lg">
                {product.description}
              </p>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-xl p-4 border border-border">
              <div>
                <div className="text-sm text-muted-foreground">Cover Width</div>
                <div className="font-semibold text-foreground">{product.coverWidth}"</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Grade</div>
                <div className="font-semibold text-foreground">{product.grade}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Unit</div>
                <div className="font-semibold text-foreground">{product.unit}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Colors</div>
                <div className="font-semibold text-foreground text-sm">
                  {product.color === 'N/A' ? 'Standard' : 'Multiple'}
                </div>
              </div>
            </div>

            {/* Price Calculator */}
            <PriceCalculator
              product={{
                id: product.id,
                title: product.title,
                img: product.img,
                unit: product.unit,
                pricePerUnit: product.pricePerUnit,
              }}
              measurement={measurement}
              setMeasurement={setMeasurement}
              onAddToCart={handleAddToCart}
              onRequestQuote={handleRequestQuote}
            />

            {/* Trust Badges */}
            <div className="flex items-center gap-4 pt-4 border-t border-border text-sm text-muted-foreground">
              <span>✓ Free shipping on orders $500+</span>
              <span>✓ Secure checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
