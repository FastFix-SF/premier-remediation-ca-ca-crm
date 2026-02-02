
import React from 'react';
import { Shield, Users, MapPin, Clock, Award, Wrench } from 'lucide-react';
import { companyConfig } from '@/config/company';

interface Statistic {
  icon: React.ElementType;
  number: string;
  label: string;
  description: string;
}

const statistics: Statistic[] = [
  {
    icon: Users,
    number: '500+',
    label: 'Projects Completed',
    description: `Successful installations across the ${companyConfig.address.region}`
  },
  {
    icon: MapPin,
    number: String(companyConfig.serviceAreas.length),
    label: 'Service Areas',
    description: `Covering all major ${companyConfig.address.region} locations`
  },
  {
    icon: Shield,
    number: String(companyConfig.warranty.years),
    label: 'Year Warranty',
    description: 'Comprehensive coverage on all installations'
  },
  {
    icon: Clock,
    number: '24/7',
    label: 'Emergency Service',
    description: 'Round-the-clock support when you need it'
  },
  {
    icon: Award,
    number: '15+',
    label: 'Years Experience',
    description: 'Trusted expertise in metal roofing'
  },
  {
    icon: Wrench,
    number: '100%',
    label: 'Licensed & Insured',
    description: 'Fully certified and protected work'
  }
];

const StatisticsSection = () => {
  return (
    <section className="py-12 lg:py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
            Why Choose {companyConfig.shortName}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Trusted by hundreds of customers across the {companyConfig.address.region} for premium metal roofing solutions.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 lg:gap-8">
          {statistics.map((stat, index) => (
            <div 
              key={index}
              className="group text-center p-6 bg-background rounded-xl shadow-sm hover:shadow-md transition-shadow hover:shadow-card-hover hover-scale active:scale-[0.98] animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 ring-1 ring-primary/20 transition-transform group-hover:scale-110 group-hover:-rotate-3 group-active:scale-95">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                {stat.number}
              </div>
              <div className="font-semibold text-foreground mb-1 text-sm lg:text-base">
                {stat.label}
              </div>
              <div className="text-xs lg:text-sm text-muted-foreground leading-tight">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
