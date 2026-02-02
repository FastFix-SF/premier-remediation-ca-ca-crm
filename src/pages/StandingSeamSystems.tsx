
import React from 'react';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { ServiceStructuredData, FAQStructuredData } from '../components/StructuredData';
import { Button } from '../components/ui/button';
import { Phone, CheckCircle, Star, Shield, Zap, Home, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const StandingSeamSystems = () => {
  const faqs = [
    {
      question: "What makes standing seam metal roofing superior?",
      answer: "Standing seam systems offer unmatched durability with concealed fasteners, superior weather resistance, and thermal expansion accommodation. The raised seams create a distinctive architectural look while preventing water infiltration."
    },
    {
      question: "How long do standing seam roofs last?",
      answer: "Standing seam metal roofs typically last 40-70+ years with minimal maintenance. Premium materials like aluminum and steel with proper coatings can exceed manufacturer warranties of 30-50 years."
    },
    {
      question: "Are standing seam roofs energy efficient?",
      answer: "Yes, standing seam roofs reflect solar heat, reducing cooling costs by 10-25%. Light-colored finishes and proper ventilation systems maximize energy savings and comfort."
    },
    {
      question: "What's the installation process like?",
      answer: "Professional installation includes deck preparation, underlayment, panel installation with mechanical seaming, trim work, and ventilation. Most residential projects complete in 3-7 days depending on complexity."
    },
    {
      question: "Can standing seam be installed over existing roofs?",
      answer: "Often yes, over one layer of existing shingles. We evaluate structural capacity, deck condition, and local codes to determine the best approach for your specific project."
    }
  ];

  const benefits = [
    { icon: Shield, title: "Superior Weather Protection", desc: "Concealed fasteners and interlocking seams" },
    { icon: Zap, title: "Energy Efficient", desc: "Reflective surfaces reduce cooling costs" },
    { icon: Award, title: "Architectural Beauty", desc: "Clean lines and premium appearance" },
    { icon: Home, title: "Long-Term Value", desc: "40-70+ year lifespan with warranties" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Standing Seam Metal Roofing Systems Bay Area | The Roofing Friend"
        description="Premium standing seam metal roofing installation in the Bay Area. Superior durability, energy efficiency, and architectural beauty. Licensed contractors with 25-year warranty."
        keywords="standing seam metal roofing, standing seam installation, Bay Area metal roofing, premium metal roofs, energy efficient roofing"
      />
      <ServiceStructuredData serviceName="Standing Seam Metal Roofing" location="San Francisco Bay Area" />
      <FAQStructuredData faqs={faqs} />
      
      <RoofingFriendHeader />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
              Standing Seam
              <span className="block text-accent">Metal Roofing Systems</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto">
              Premium standing seam metal roofing with superior durability, energy efficiency, and architectural elegance. 
              The gold standard for modern metal roofing systems.
            </p>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary font-semibold">
              <Phone className="w-5 h-5 mr-2" />
              Get Standing Seam Quote
            </Button>
          </div>
        </div>
      </section>

      {/* Project Gallery */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Standing Seam Project Gallery</h2>
            <p className="text-lg text-muted-foreground">Real installations showcasing the beauty and precision of our standing seam systems</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative group overflow-hidden rounded-xl">
              <img 
                src="/lovable-uploads/6de4cfe5-4045-4cd3-9817-efd4f195826f.png" 
                alt="Modern standing seam metal roof installation" 
                className="w-full h-64 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-semibold">Modern Residential Installation</span>
              </div>
            </div>
            <div className="relative group overflow-hidden rounded-xl">
              <img 
                src="/src/assets/standing-seam-detail.jpg" 
                alt="Standing seam metal roofing construction" 
                className="w-full h-64 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-semibold">Professional Installation Process</span>
              </div>
            </div>
            <div className="relative group overflow-hidden rounded-xl">
              <img 
                src="/lovable-uploads/13a34bd2-b773-4011-9afe-89b1fe841801.png" 
                alt="Dark standing seam metal roof" 
                className="w-full h-64 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-semibold">Premium Dark Finish</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Why Choose Standing Seam?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Standing seam metal roofing represents the pinnacle of roofing technology, combining durability with architectural sophistication.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-6">Technical Excellence</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Concealed Fastener System</h3>
                    <p className="text-sm text-muted-foreground">No exposed fasteners means superior weather resistance and longevity</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Thermal Movement Accommodation</h3>
                    <p className="text-sm text-muted-foreground">Panels expand and contract naturally without stress or buckling</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Premium Material Options</h3>
                    <p className="text-sm text-muted-foreground">Aluminum, steel, copper, and zinc in various profiles and finishes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Mechanical Seaming</h3>
                    <p className="text-sm text-muted-foreground">Double-lock seams create watertight connections</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/lovable-uploads/da3b4687-8f9e-49ca-9cae-55c0a50d4eed.png" 
                alt="Contemporary home with standing seam metal roof" 
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Standing Seam FAQ</h2>
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

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">
            Ready for Premium Standing Seam?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the ultimate in metal roofing technology. Contact us for a consultation and discover why standing seam is the preferred choice for discerning homeowners.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Phone className="w-5 h-5 mr-2" />
              Schedule Consultation
            </Button>
            <Link to="/projects">
              <Button size="lg" variant="outline">
                View More Projects
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StandingSeamSystems;
