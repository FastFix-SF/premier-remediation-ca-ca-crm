import React from 'react';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { ServiceStructuredData, FAQStructuredData } from '../components/StructuredData';
import { Button } from '../components/ui/button';
import { OptimizedImage } from '../components/ui/optimized-image';
import { Phone, CheckCircle, Star, Layers, Zap, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const MetalRoofPanels = () => {
  const faqs = [
    {
      question: "What types of metal roofing panels do you offer?",
      answer: "We install standing seam, R-panel, corrugated, and multi-V panel systems. Standing seam offers premium aesthetics and performance, R-panel provides excellent value, and corrugated is ideal for agricultural and industrial applications."
    },
    {
      question: "Which metal roof panel is best for my project?",
      answer: "It depends on your needs: Standing seam for residential and premium commercial projects, R-panel for cost-effective commercial applications, corrugated for agricultural/industrial use. We'll recommend the best option based on your building, budget, and climate."
    },
    {
      question: "How are metal roof panels installed?",
      answer: "Installation varies by panel type. Standing seam uses concealed fasteners for a clean look, R-panel uses exposed fasteners, and corrugated typically overlaps with screws. All installations include proper underlayment and flashing for weather protection."
    },
    {
      question: "What gauge metal should I choose?",
      answer: "We typically use 24-26 gauge steel for residential and light commercial, 22-24 gauge for heavy commercial and industrial. Thicker gauges offer better durability and wind resistance. We'll specify the right gauge for your application."
    },
    {
      question: "Do you offer different colors and finishes?",
      answer: "Yes, we offer a wide range of colors in both painted and Kynar 500® finishes. Kynar 500® provides superior fade and chalk resistance with longer warranties. We can help you choose colors that complement your building and environment."
    }
  ];

  const panelTypes = [
    {
      icon: Layers,
      title: "Standing Seam",
      description: "Premium concealed fastener system with superior weather protection and sleek appearance.",
      features: ["Concealed fasteners", "40+ year lifespan", "Superior weather seal", "Modern aesthetics"],
      image: "/lovable-uploads/e38fb4df-7d2e-46af-847f-533d8f57166b.png"
    },
    {
      icon: Zap,
      title: "R-Panel",
      description: "Cost-effective exposed fastener system ideal for commercial and agricultural buildings.",
      features: ["Exposed fastener system", "Excellent value", "Quick installation", "Versatile applications"],
      image: "/lovable-uploads/46e86e6f-b5da-4830-bf41-b71314e8818a.png"
    },
    {
      icon: Shield,
      title: "Multi-V Panel",
      description: "Attractive ribbed panel system combining performance with traditional metal roofing aesthetics.",
      features: ["Traditional appearance", "Strong rib design", "Residential/commercial", "Multiple color options"],
      image: "/lovable-uploads/0d76378a-7b98-4fbd-a8d5-ec44aab639bf.png"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Metal Roof Panels Bay Area - Standing Seam, R-Panel | The Roofing Friend"
        description="Professional metal roof panel installation in the Bay Area. Standing seam, R-panel, corrugated, and multi-V systems. Expert installation with 25-year warranty."
        keywords="metal roof panels, standing seam roofing, R-panel installation, corrugated metal roofing, Bay Area metal panels, metal roofing systems"
      />
      <ServiceStructuredData 
        serviceName="Metal Roof Panel Installation" 
        location="San Francisco Bay Area"
      />
      <FAQStructuredData faqs={faqs} />
      
      <RoofingFriendHeader />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
              Premium Metal Roof
              <span className="block text-accent">Panel Systems</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto">
              Expert installation of standing seam, R-panel, and specialty metal roofing systems. 
              Built for Bay Area weather with superior materials and craftsmanship.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary font-semibold">
                <Phone className="w-5 h-5 mr-2" />
                Get Panel Quote
              </Button>
              <Link to="/products">
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                  Browse Materials
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4 mt-8 justify-center">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>
              <span className="text-white/90">Expert installation since 2010</span>
            </div>
          </div>
        </div>
      </section>

      {/* Panel Types Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Metal Panel Systems We Install
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Choose from our premium selection of metal roofing panels, each engineered for specific applications and performance requirements.
            </p>
          </div>
          
          <div className="space-y-12">
            {panelTypes.map((panel, index) => {
              const IconComponent = panel.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div key={index} className={`grid lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:grid-flow-col-dense' : ''}`}>
                  <div className={isEven ? 'lg:order-1' : 'lg:order-2'}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-foreground">{panel.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                      {panel.description}
                    </p>
                    <ul className="space-y-2">
                      {panel.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={isEven ? 'lg:order-2' : 'lg:order-1'}>
                    <OptimizedImage
                      src={panel.image}
                      alt={`${panel.title} metal roofing installation example`}
                      className="rounded-2xl shadow-lg w-full"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      quality={85}
                      priority={index === 0}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Materials & Finishes */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-6">
                Premium Materials & Finishes
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Steel Gauges Available</h3>
                  <p className="text-muted-foreground">22, 24, and 26 gauge galvanized and Galvalume® steel options</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Paint Systems</h3>
                  <p className="text-muted-foreground">Standard polyester and premium Kynar 500® PVDF finishes</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Color Selection</h3>
                  <p className="text-muted-foreground">Wide range of standard and custom colors to match any design</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Specialty Options</h3>
                  <p className="text-muted-foreground">Aluminum panels, copper, and zinc for unique architectural requirements</p>
                </div>
              </div>
            </div>
            <div className="bg-background p-8 rounded-2xl border border-border/50">
              <h3 className="text-2xl font-display font-bold text-foreground mb-6">Panel Comparison</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="font-medium">Standing Seam</span>
                  <span className="text-primary font-semibold">Premium Choice</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="font-medium">R-Panel</span>
                  <span className="text-primary font-semibold">Best Value</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="font-medium">Multi-V Panel</span>
                  <span className="text-primary font-semibold">Traditional Style</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="font-medium">Corrugated</span>
                  <span className="text-primary font-semibold">Industrial Use</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Metal Panel FAQ
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about metal roofing panels
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-background p-6 rounded-xl border border-border/50 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground mb-3">{faq.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            Choose the Right Panel System
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get expert guidance on selecting and installing the perfect metal panel system for your project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary font-semibold">
              <Phone className="w-5 h-5 mr-2" />
              (510) 555-ROOF
            </Button>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                Free Consultation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MetalRoofPanels;