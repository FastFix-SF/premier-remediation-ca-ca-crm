
import React from 'react';
import { Shield, Truck, Award } from 'lucide-react';

const HeroTrustIndicators = () => {
  const indicators = [
    {
      icon: Shield,
      text: '25-Year Warranty'
    },
    {
      icon: Truck,
      text: 'Free Bay Area Delivery'
    },
    {
      icon: Award,
      text: 'Locally Owned & Operated'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 pt-6 sm:pt-8 border-t border-white/20">
      {indicators.map((indicator, index) => {
        const IconComponent = indicator.icon;
        return (
          <div key={index} className="flex items-center justify-center lg:justify-start gap-2 text-white/90">
            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-accent shrink-0" />
            <span className="font-medium text-sm sm:text-base">{indicator.text}</span>
          </div>
        );
      })}
    </div>
  );
};

export default HeroTrustIndicators;
