
import React, { useState } from 'react';
import CaliforniaCityList from './CaliforniaCityList';

const CaliforniaServiceMap: React.FC = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <section id="service-areas" className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Serving California's Bay Area
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Professional metal roofing services across 13 key locations in Northern California. 
            Click on any location to learn about our specialized services in your area.
          </p>
        </div>

        {/* Organized vertical layout */}
        <div className="bg-gradient-to-br from-card via-card to-background rounded-2xl p-6 sm:p-8 shadow-soft border overflow-hidden">
          {/* Subtle background overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl pointer-events-none"></div>
          
          {/* California Map - Now on top */}
          <div className="mb-8">
            <div className="relative aspect-[4/3] max-w-4xl mx-auto rounded-xl overflow-hidden bg-muted/30">
              {/* Loading placeholder */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 animate-pulse">
                  <div className="text-muted-foreground">Loading map...</div>
                </div>
              )}
              
              {/* California Map Image */}
              <img 
                src="/lovable-uploads/b377c72b-e3b3-4940-944e-7c7eb54d498c.png"
                alt="California Service Areas Map"
                className={`w-full h-full object-contain transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            </div>
          </div>

          {/* City List - Now underneath the map */}
          <div className="max-w-4xl mx-auto">
            <CaliforniaCityList />
          </div>
          
          {/* Enhanced Map Legend */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center justify-center gap-3 px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground border border-border/50">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary/30 animate-ping"></div>
                </div>
                <span className="font-medium">Service Locations</span>
              </div>
              <div className="w-px h-4 bg-border"></div>
              <span>Click a city to explore our local roofing services</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CaliforniaServiceMap;
