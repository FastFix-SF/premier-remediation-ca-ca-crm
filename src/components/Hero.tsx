import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ShoppingCart, Shield, Truck, Award } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 opacity-20 bg-white/5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center py-20 lg:py-32">
          {/* Content */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-display font-bold leading-tight">
                Premium Metal
                <span className="block text-accent">Roofing Solutions</span>
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 leading-relaxed">
                Professional-grade panels, trim, and accessories for contractors and homeowners who demand excellence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/products')}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Shop Products
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-4 text-lg rounded-xl"
              >
                Get Quote
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-8 pt-8 border-t border-white/20">
              <div className="flex items-center gap-2 text-white/90">
                <Shield className="w-5 h-5 text-accent" />
                <span className="font-medium">25-Year Warranty</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Truck className="w-5 h-5 text-accent" />
                <span className="font-medium">Free Shipping $500+</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Award className="w-5 h-5 text-accent" />
                <span className="font-medium">Made in USA</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Animation */}
          <div className="relative">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
              <div className="grid grid-cols-2 gap-4">
                {/* Animated Panel Cards */}
                {[1, 2, 3, 4].map((item, index) => (
                  <div 
                    key={item}
                    className="bg-white rounded-xl p-4 shadow-lg transform transition-transform duration-700"
                    style={{
                      animation: `float 6s ease-in-out infinite alternate`,
                      animationDelay: `${index * 0.5}s`
                    }}
                  >
                    <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg mb-2 flex items-center justify-center">
                      <div className="w-8 h-8 bg-primary rounded opacity-80"></div>
                    </div>
                    <div className="text-xs text-foreground font-medium">
                      {item === 1 && "R-Panel"}
                      {item === 2 && "Standing Seam"}
                      {item === 3 && "Multi-V"}
                      {item === 4 && "Corrugated"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item === 1 && "26 Gauge"}
                      {item === 2 && "24 Gauge"}
                      {item === 3 && "29 Gauge"}
                      {item === 4 && "26 Gauge"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;