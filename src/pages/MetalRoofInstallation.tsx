import React from 'react';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { ServiceStructuredData, FAQStructuredData } from '../components/StructuredData';
import { Button } from '../components/ui/button';
import { Phone, CheckCircle, Star, Hammer, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const MetalRoofInstallation = () => {
  const faqs = [
    {
      question: "How long does metal roof installation take?",
      answer: "Installation timeframes vary by size: residential homes (2-5 days), small commercial (1-2 weeks), large facilities (3-6 weeks). Weather and roof complexity affect timing. We provide accurate timelines during estimation."
    },
    {
      question: "What's included in professional metal roof installation?",
      answer: "Complete installation includes tear-off (if needed), deck inspection/repair, underlayment, flashing, panels, trim, ventilation, and cleanup. We handle permits and inspections for a turnkey experience."
    },
    {
      question: "Do you install over existing roofs?",
      answer: "In many cases, yes. Metal roofing can often be installed over one layer of existing shingles, saving time and disposal costs. We evaluate each roof to determine the best approach."
    },
    {
      question: "What warranty comes with installation?",
      answer: "We provide comprehensive warranties: 25 years on materials, 10 years on workmanship. Manufacturer warranties extend up to 40+ years on premium systems."
    },
    {
      question: "How do you handle weather during installation?",
      answer: "We monitor weather closely and use protective measures. If rain threatens, we secure the work area with tarps. Safety is our priority - we don't work in unsafe conditions."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Professional Metal Roof Installation Bay Area | The Roofing Friend"
        description="Expert metal roof installation services in the Bay Area. Standing seam, R-panel, and corrugated systems. Licensed installers with 25-year warranty. Free estimates."
        keywords="metal roof installation, professional roof installation, Bay Area metal roofing, roof installers, metal roofing contractors"
      />
      <ServiceStructuredData serviceName="Metal Roof Installation" location="San Francisco Bay Area" />
      <FAQStructuredData faqs={faqs} />
      
      <RoofingFriendHeader />
      
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
              Professional Metal Roof
              <span className="block text-accent">Installation Services</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto">
              Expert installation of all metal roofing systems. From residential homes to commercial facilities, 
              we deliver precision craftsmanship with lasting results.
            </p>
            <Button size="lg">
              <Phone className="w-5 h-5 mr-2" />
              Get Installation Quote
            </Button>
          </div>
        </div>
      </section>

      {/* Installation Gallery */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Our Installation Work</h2>
            <p className="text-lg text-muted-foreground">Professional installations across the Bay Area</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative group overflow-hidden rounded-xl">
              <img 
                src="/lovable-uploads/861897a1-cf67-4ab9-b56c-370efa37dbb8.png" 
                alt="Blue standing seam metal roof installation" 
                className="w-full h-64 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-semibold">Standing Seam Installation</span>
              </div>
            </div>
            <div className="relative group overflow-hidden rounded-xl">
              <img 
                src="/lovable-uploads/d1ea871e-0c30-4de5-91ba-be03cfc9c55b.png" 
                alt="Asphalt shingle roof aerial view" 
                className="w-full h-64 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-semibold">Before: Traditional Roofing</span>
              </div>
            </div>
            <div className="relative group overflow-hidden rounded-xl">
              <img 
                src="/src/assets/residential-roofing-crew.jpg" 
                alt="Professional roofing crew installing metal roof" 
                className="w-full h-64 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-semibold">Professional Installation Team</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Our Installation Process</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: CheckCircle, title: "Site Assessment", desc: "Detailed evaluation and measurement" },
              { icon: Hammer, title: "Professional Installation", desc: "Expert craftsmanship and materials" },
              { icon: Shield, title: "Quality Assurance", desc: "Final inspection and warranty coverage" }
            ].map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="text-center p-6 bg-background rounded-xl">
                  <IconComponent className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Installation FAQ</h2>
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

export default MetalRoofInstallation;
