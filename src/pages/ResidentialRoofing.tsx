import React from 'react';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { ServiceStructuredData, FAQStructuredData } from '../components/StructuredData';
import { Button } from '../components/ui/button';
import { Phone, CheckCircle, Star, Shield, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const ResidentialRoofing = () => {
  const faqs = [
    {
      question: "How much does a residential metal roof cost?",
      answer: "Residential metal roofing costs typically range from $8-$16 per square foot installed, depending on the material type, roof complexity, and local factors. Standing seam systems are premium options, while R-panel systems offer excellent value. We provide free detailed estimates."
    },
    {
      question: "Do metal roofs increase home value?",
      answer: "Yes, metal roofs can increase home value by 1-6% and offer up to 85% return on investment. They're attractive to buyers due to their durability, energy efficiency, and low maintenance requirements."
    },
    {
      question: "How long do residential metal roofs last?",
      answer: "Quality metal roofs last 40-70+ years with minimal maintenance, compared to 15-20 years for asphalt shingles. We offer 25-year warranties on our installations."
    },
    {
      question: "Are metal roofs noisy during rain?",
      answer: "Modern metal roofs with proper insulation and underlayment are no noisier than other roofing materials. Professional installation includes sound-dampening techniques."
    },
    {
      question: "Can metal roofs withstand Bay Area weather?",
      answer: "Absolutely. Metal roofs excel in Bay Area conditions - they're fire-resistant (crucial for wildfire zones), earthquake-safe due to light weight, and handle coastal salt air better than other materials."
    }
  ];

  const benefits = [
    { icon: Shield, title: "Fire Resistance", desc: "Class A fire rating for wildfire protection" },
    { icon: Award, title: "Energy Efficient", desc: "Reduces cooling costs by up to 25%" },
    { icon: Clock, title: "Long Lasting", desc: "40-70+ year lifespan with minimal maintenance" },
    { icon: CheckCircle, title: "Weather Resistant", desc: "Handles wind, hail, and seismic activity" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Residential Metal Roofing Installation Bay Area | The Roofing Friend"
        description="Expert residential metal roof installation in the Bay Area. Standing seam, R-panel, and corrugated options. 25-year warranty, fire-resistant, energy-efficient. Free estimates."
        keywords="residential metal roofing, home metal roof installation, Bay Area residential roofing, standing seam residential, metal roof contractors"
      />
      <ServiceStructuredData 
        serviceName="Residential Metal Roofing Installation" 
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
                Residential Metal Roofing
                <span className="block text-accent">Bay Area Experts</span>
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Transform your home with premium metal roofing. Fire-resistant, energy-efficient, 
                and built to last 40-70+ years. Perfect for Bay Area homes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="tel:+14156971849">
                  <Button size="lg">
                    <Phone className="w-5 h-5 mr-2" />
                    Get Free Estimate
                  </Button>
                </a>
                <Link to="/contact">
                  <Button variant="white-outline" size="lg">
                    View Our Work
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-white/90">4.9/5 from 150+ Bay Area homeowners</span>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/lovable-uploads/2ec5247c-14cb-4a9b-9fe1-fd72913ad3e7.png"
                alt="Beautiful residential metal roof installation in Castro Valley"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Why Choose Metal Roofing for Your Home?
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Metal roofing offers unmatched benefits for Bay Area homeowners, from fire protection to energy savings.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="text-center p-6 bg-background rounded-xl shadow-sm border border-border/50">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Serving Bay Area Communities
            </h2>
            <p className="text-lg text-muted-foreground">
              Professional residential metal roofing installation across the San Francisco Bay Area
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'San Francisco', 'Santa Clara', 'Walnut Creek', 'Tiburon',
              'San Anselmo', 'Los Gatos', 'Santa Rosa', 'Modesto',
              'Petaluma', 'Santa Cruz', 'Kentfield', 'Alameda County'
            ].map((location) => (
              <Link 
                key={location}
                to={`/roofing-services/${location.toLowerCase().replace(/\s+/g, '-')}`}
                className="p-4 bg-background border border-border/50 rounded-lg hover:border-primary/50 hover:shadow-md transition-all text-center"
              >
                <span className="font-medium text-foreground">{location}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Get answers to common questions about residential metal roofing
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
            Ready for Your New Metal Roof?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join hundreds of satisfied Bay Area homeowners. Get your free estimate today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+14156971849">
              <Button size="lg">
                <Phone className="w-5 h-5 mr-2" />
                Get Free Estimate
              </Button>
            </a>
            <Link to="/contact">
              <Button variant="white-outline" size="lg">
                Request Quote Online
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ResidentialRoofing;
