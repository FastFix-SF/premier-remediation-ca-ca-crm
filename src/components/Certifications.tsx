
import React from 'react';
import { OptimizedImage } from './ui/optimized-image';

const Certifications = () => {
  return (
    <section className="py-8 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Certified & Trusted
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Proudly serving our community with certified excellence
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 flex-wrap">
          <div className="flex items-center justify-center">
            <OptimizedImage 
              src="/lovable-uploads/sheffield-metals.png" 
              alt="Sheffield Metals International - Authorized Partner" 
              className="h-16 sm:h-20 w-auto"
              sizes="(max-width: 640px) 64px, 80px"
              quality={90}
            />
          </div>

          <div className="flex items-center justify-center">
            <OptimizedImage 
              src="/lovable-uploads/mcelroy-metal.png" 
              alt="McElroy Metal - Employee Owned Partner" 
              className="h-16 sm:h-20 w-auto"
              sizes="(max-width: 640px) 64px, 80px"
              quality={90}
            />
          </div>

          <div className="flex items-center justify-center">
            <OptimizedImage 
              src="/lovable-uploads/098b81b7-04a4-437e-a932-055123a686f4.png" 
              alt="Locally Owned & Operated - Certified by MainShares" 
              className="h-20 sm:h-24 w-auto"
              sizes="(max-width: 640px) 80px, 96px"
              quality={90}
              priority
            />
          </div>
          
          <div className="flex items-center justify-center">
            <OptimizedImage 
              src="/lovable-uploads/afc27bc0-c297-477c-8a08-885dae4e6d70.png" 
              alt="Veteran Owned Business" 
              className="h-16 sm:h-20 w-auto"
              sizes="(max-width: 640px) 64px, 80px"
              quality={90}
              priority
            />
          </div>

          <div className="flex items-center justify-center">
            <OptimizedImage 
              src="/lovable-uploads/taylor-metal.png" 
              alt="Taylor Metal Products - Authorized Supplier" 
              className="h-14 sm:h-16 w-auto"
              sizes="(max-width: 640px) 56px, 64px"
              quality={90}
            />
          </div>

          <div className="flex items-center justify-center">
            <OptimizedImage 
              src="/lovable-uploads/gaf-master-elite.png" 
              alt="GAF Master Elite Residential Roofing Contractor" 
              className="h-20 sm:h-24 w-auto"
              sizes="(max-width: 640px) 80px, 96px"
              quality={90}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Certifications;
