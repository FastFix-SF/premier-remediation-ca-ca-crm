import React from 'react';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { ServiceStructuredData, FAQStructuredData } from '../components/StructuredData';
import { Button } from '../components/ui/button';
import { Phone, CheckCircle, Star, Building, Shield, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const CommercialRoofing = () => {
  const faqs = [
    {
      question: "What's the best roofing system for commercial warehouses?",
      answer: "For warehouses, we recommend TPO membrane systems or metal roofing. TPO offers excellent durability and energy efficiency, while metal systems provide superior longevity. Both are ideal for large flat or low-slope commercial roofs."
    },
    {
      question: "How much does commercial roofing cost per square foot?",
      answer: "Commercial roofing costs vary by system: TPO $4-8/sq ft, metal roofing $6-12/sq ft, built-up roofing $3-7/sq ft. Factors include roof size, accessibility, and complexity. We provide detailed estimates for accurate budgeting."
    },
    {
      question: "How long does commercial roof installation take?",
      answer: "Installation timeframes depend on roof size and weather. Typical commercial projects: small buildings (2-5 days), medium warehouses (1-2 weeks), large facilities (3-6 weeks). We work efficiently to minimize business disruption."
    },
    {
      question: "Do you work on occupied buildings?",
      answer: "Yes, we specialize in occupied building roofing with minimal disruption. We coordinate schedules, provide dust barriers, maintain safety protocols, and work around your business operations."
    },
    {
      question: "What warranties do you offer on commercial roofing?",
      answer: "We provide comprehensive warranties: 10-25 years on materials, 5-10 years on workmanship. Many manufacturers offer extended warranties for certified installations. We handle all warranty service directly."
    }
  ];

  const services = [
    { icon: Building, title: "TPO Membrane", desc: "Energy-efficient single-ply roofing" },
    { icon: Shield, title: "Metal Roofing", desc: "Standing seam and R-panel systems" },
    { icon: Truck, title: "Built-Up Roofing", desc: "Traditional multi-layer systems" },
    { icon: CheckCircle, title: "Roof Coatings", desc: "Extend roof life and improve efficiency" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Commercial & Industrial Roofing Bay Area | The Roofing Friend"
        description="Professional commercial roofing services in the Bay Area. TPO membrane, metal roofing, and industrial solutions. Licensed, insured, and experienced with large-scale projects."
        keywords="commercial roofing, industrial roofing, warehouse roofing, TPO membrane, commercial metal roofing, Bay Area commercial roofers"
      />
      <ServiceStructuredData 
        serviceName="Commercial & Industrial Roofing" 
        location="San Francisco Bay Area"
      />
      <FAQStructuredData faqs={faqs} />
      
      <RoofingFriendHeader />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                Commercial & Industrial
                <span className="block text-accent">Roofing Solutions</span>
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Professional roofing systems for warehouses, offices, retail, and industrial facilities. 
                Minimize downtime with expert installation and service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg">
                  <Phone className="w-5 h-5 mr-2" />
                  Get Commercial Quote
                </Button>
                <Link to="/projects">
                  <Button variant="white-outline" size="lg">
                    View Commercial Projects
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-white/90">Trusted by 200+ Bay Area businesses</span>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/lovable-uploads/ca855586-06fd-4a60-85bd-8d0f368602e3.png"
                alt="Professional commercial warehouse roofing in Tracy, CA"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Commercial Roofing Systems
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We specialize in durable, cost-effective roofing solutions for all types of commercial and industrial buildings.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div key={index} className="text-center p-6 bg-background rounded-xl shadow-sm border border-border/50">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{service.title}</h3>
                  <p className="text-muted-foreground">{service.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Industries Served */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Industries We Serve
            </h2>
            <p className="text-lg text-muted-foreground">
              Expert commercial roofing for diverse Bay Area businesses and facilities
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Warehouses & Distribution Centers',
              'Manufacturing Facilities', 
              'Office Buildings',
              'Retail & Shopping Centers',
              'Schools & Educational Facilities',
              'Healthcare Facilities',
              'Government Buildings',
              'Religious Institutions',
              'Multi-Family Housing'
            ].map((industry) => (
              <div key={industry} className="p-4 bg-background border border-border/50 rounded-lg text-center">
                <span className="font-medium text-foreground">{industry}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Commercial Roofing FAQ
            </h2>
            <p className="text-lg text-muted-foreground">
              Common questions about commercial and industrial roofing projects
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-background p-6 rounded-xl border border-border/50">
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
            Protect Your Business Investment
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get a comprehensive commercial roofing assessment and proposal. Licensed, insured, and experienced.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              <Phone className="w-5 h-5 mr-2" />
              (510) 555-ROOF
            </Button>
            <Link to="/contact">
              <Button variant="white-outline" size="lg">
                Schedule Site Visit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CommercialRoofing;
