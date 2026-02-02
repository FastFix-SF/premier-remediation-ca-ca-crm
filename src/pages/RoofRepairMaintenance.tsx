import React from 'react';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { ServiceStructuredData, FAQStructuredData } from '../components/StructuredData';
import { Button } from '../components/ui/button';
import { Phone, Wrench, Shield, Clock } from 'lucide-react';

const RoofRepairMaintenance = () => {
  const faqs = [
    {
      question: "How do I know if my roof needs repair?",
      answer: "Warning signs include: visible leaks, missing/loose panels, rust spots, damaged flashing, or interior water stains. Schedule an inspection if your roof is over 15 years old or after severe weather."
    },
    {
      question: "Can you repair all types of metal roofs?",
      answer: "Yes, we repair standing seam, R-panel, corrugated, and specialty metal roofing systems. Our technicians are trained on all major manufacturers and panel types."
    },
    {
      question: "How much do roof repairs typically cost?",
      answer: "Repair costs vary widely: minor fixes ($200-500), moderate repairs ($500-2000), major repairs ($2000-5000+). We provide detailed estimates after inspection."
    },
    {
      question: "Do you offer emergency roof repair?",
      answer: "Yes, we provide 24/7 emergency services for urgent leaks and storm damage. We'll secure your property immediately and schedule permanent repairs."
    },
    {
      question: "How often should I maintain my metal roof?",
      answer: "Annual inspections are recommended, with cleaning every 2-3 years. Coastal properties may need more frequent maintenance due to salt exposure."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Metal Roof Repair & Maintenance Bay Area | The Roofing Friend"
        description="Expert metal roof repair and maintenance services. Emergency repairs, leak fixes, and preventive maintenance. 24/7 service available. Licensed and insured."
        keywords="roof repair, metal roof maintenance, emergency roof repair, roof leak repair, Bay Area roof repair"
      />
      <ServiceStructuredData serviceName="Roof Repair & Maintenance" location="San Francisco Bay Area" />
      <FAQStructuredData faqs={faqs} />
      
      <RoofingFriendHeader />
      
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
            Metal Roof Repair &
            <span className="block text-accent">Maintenance Services</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Expert repair and maintenance services to extend your roof's life. Emergency repairs available 24/7.
          </p>
          <Button size="lg">
            <Phone className="w-5 h-5 mr-2" />
            Emergency Service: (510) 555-ROOF
          </Button>
        </div>
      </section>

      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Wrench, title: "Expert Repairs", desc: "All metal roofing systems" },
              { icon: Clock, title: "24/7 Emergency", desc: "Urgent leak response" },
              { icon: Shield, title: "Preventive Care", desc: "Extend roof lifespan" }
            ].map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div key={index} className="text-center p-6 bg-background rounded-xl">
                  <IconComponent className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-muted-foreground">{service.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Repair & Maintenance FAQ</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-background p-6 rounded-xl border border-border/50">
                <h3 className="text-lg font-semibold text-foreground mb-3">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RoofRepairMaintenance;
