import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Satellite, Ruler, FileText } from 'lucide-react';

const steps = [
  {
    icon: MapPin,
    title: 'Address Submitted',
    description: 'You provide your property address and project details through our secure form.'
  },
  {
    icon: Satellite,
    title: 'Aerial Analysis',
    description: 'We use high-resolution satellite imagery to analyze your roof structure and condition.'
  },
  {
    icon: Ruler,
    title: 'Precise Measurements',
    description: 'Our AI system calculates exact measurements, pitch, and material requirements.'
  },
  {
    icon: FileText,
    title: 'Professional Proposal',
    description: 'Receive a detailed quote with materials, timeline, and warranty information within 24 hours.'
  }
];

export function HowItWorks() {
  return (
    <section className="py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">How Our Automated Quoting Works</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Our advanced technology delivers accurate roofing quotes faster than traditional methods
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          return (
            <Card key={index} className="text-center relative">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <IconComponent className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </CardContent>
              
              {/* Arrow connector (hidden on last item and mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <div className="w-6 h-0.5 bg-border"></div>
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-border border-y-2 border-y-transparent"></div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium">Average delivery time: 18 hours</span>
        </div>
      </div>
    </section>
  );
}