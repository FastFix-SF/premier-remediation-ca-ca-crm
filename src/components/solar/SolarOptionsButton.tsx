import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Sun } from 'lucide-react';
import { SolarGalleryModal } from './SolarGalleryModal';

const SolarOptionsButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    setIsModalOpen(true);
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'solar_cta_click', {
        placement: 'hero'
      });
    }
  };

  return (
    <>
      <Button 
        size="lg" 
        onClick={handleClick}
        className="bg-slate-900 text-white hover:bg-slate-800 font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto ring-1 ring-white/10 relative overflow-hidden group animate-solar-flow"
        style={{
          backgroundImage: 'url(/images/ui/solar-grid.svg)',
          backgroundSize: '16px 16px',
          backgroundRepeat: 'repeat'
        }}
        aria-label="Explore solar panel options for metal roofs"
      >
        <Sun className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-glow" />
        <span className="hidden sm:inline">Solar Options</span>
        <span className="sm:hidden">Solar</span>
      </Button>

      <SolarGalleryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default SolarOptionsButton;