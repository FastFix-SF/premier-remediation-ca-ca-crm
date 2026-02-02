import React from 'react';
import { Shield, Truck, Award, Clock, CheckCircle, Star } from 'lucide-react';
import { companyConfig } from '@/config/company';

const TrustBadges = () => {
  const badges = [
    {
      icon: Shield,
      title: `${companyConfig.warranty.years}-Year Warranty`,
      description: 'Comprehensive coverage on all metal roofing panels'
    },
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders over $500 within continental US'
    },
    {
      icon: Award,
      title: 'Made in USA',
      description: 'Premium quality American-manufactured materials'
    },
    {
      icon: Clock,
      title: 'Fast Delivery',
      description: '3-5 business days to most locations'
    },
    {
      icon: CheckCircle,
      title: 'Quality Tested',
      description: 'All products meet ASTM standards'
    },
    {
      icon: Star,
      title: '5-Star Service',
      description: 'Rated excellent by contractors nationwide'
    }
  ];

  return (
    <section className="py-16 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-4">
            Why Choose {companyConfig.shortName}?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're committed to providing the highest quality materials and service in the roofing industry.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {badges.map((badge, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <badge.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm">
                {badge.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;