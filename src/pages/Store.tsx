
import React from 'react';
import SEOHead from '../components/SEOHead';
import Index from './Index';

const Store = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Metal Roofing Material Store - Bay Area | The Roofing Friend"
        description="Browse our extensive selection of premium metal roofing materials. Standing seam, R-panel, corrugated, and specialty panels with Bay Area delivery."
      />
      
      {/* Notice Banner */}
      <div className="w-full bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
              <span className="inline-block mr-2 text-yellow-600">⚠️</span>
              Our online material store will be fully available soon. In the meantime, call us at{' '}
              <a 
                href="tel:+14156971849" 
                className="font-semibold text-primary hover:text-primary/80 transition-colors underline md:no-underline"
              >
                (415) 697-1849
              </a>
              {' '}to place your order directly — we're happy to help!
            </p>
          </div>
        </div>
      </div>
      
      <main>
        <Index />
      </main>
    </div>
  );
};

export default Store;
