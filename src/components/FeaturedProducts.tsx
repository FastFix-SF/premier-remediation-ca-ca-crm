import React from 'react';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

const FeaturedProducts = () => {
  const featuredProducts = [
    {
      id: 'r-panel-26',
      name: 'R-Panel 26 Gauge',
      description: 'Classic exposed fastener panel perfect for agricultural and commercial applications.',
      image: '/public/images/placeholder.png',
      price: '$2.85',
      unit: 'sq ft',
      badge: 'Best Seller'
    },
    {
      id: 'standing-seam-24',
      name: 'Standing Seam 24 Gauge',
      description: 'Premium concealed fastener system for superior weather protection.',
      image: '/public/images/placeholder.png',
      price: '$4.95',
      unit: 'sq ft',
      badge: 'Premium'
    },
    {
      id: 'multi-v-29',
      name: 'Multi-V 29 Gauge',
      description: 'Versatile panel with multiple rib configurations for residential use.',
      image: '/public/images/placeholder.png',
      price: '$3.25',
      unit: 'sq ft',
      badge: 'Popular'
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our most popular metal roofing panels, trusted by contractors nationwide for their quality and durability.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredProducts.map((product) => (
            <div key={product.id} className="group bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-smooth overflow-hidden">
              {/* Product Image */}
              <div className="aspect-[4/3] bg-muted/50 overflow-hidden relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.badge && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
                      {product.badge}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="text-xl font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-2xl font-bold text-foreground">{product.price}</span>
                    <span className="text-sm text-muted-foreground ml-1">per {product.unit}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1">
                    Quick Price Check
                  </Button>
                  <Button size="sm" className="flex-1">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline" className="group">
            View All Products
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;