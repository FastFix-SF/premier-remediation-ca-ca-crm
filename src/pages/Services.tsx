import React from 'react';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Button } from '../components/ui/button';
import { Home, Building2, Wrench, Zap, Shield, CheckCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Services = () => {
  const services = [
    {
      icon: Home,
      title: "Residential Roofing",
      description: "Premium metal roofing solutions for homes across the Bay Area. From standing seam to corrugated panels.",
      features: ["Standing Seam Systems", "R-Panel Installation", "Multi-V Panels", "Corrugated Metal", "Custom Colors", "Energy Efficient Options"],
      link: "/residential-roofing"
    },
    {
      icon: Building2,
      title: "Commercial & Industrial",
      description: "Large-scale roofing projects for businesses, warehouses, and industrial facilities with expert installation.",
      features: ["Warehouse Roofing", "Office Buildings", "Industrial Facilities", "Retail Centers", "Custom Fabrication", "Fast Installation"],
      link: "/commercial-roofing"
    },
    {
      icon: Wrench,
      title: "Repair & Maintenance",
      description: "Professional repair services to extend the life of your existing roof and prevent costly damage.",
      features: ["Metal Roof Installation", "Panel Replacement", "Fastener Replacement", "Sealant Application", "Gutter Repair", "Emergency Services"],
      link: "/roof-repair-maintenance"
    },
    {
      icon: Zap,
      title: "Premium Systems",
      description: "High-end metal roofing systems including standing seam and specialized panel installations.",
      features: ["Standing Seam Systems", "R-Panel Installation", "Metal Roof Panels", "Custom Fabrication", "Premium Materials", "Expert Installation"],
      link: "/standing-seam-systems"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Metal Roofing Installation Services - Bay Area | The Roofing Friend"
        description="Professional metal roofing installation services across the San Francisco Bay Area. Residential, commercial, repair, and emergency services available."
      />
      <RoofingFriendHeader />
      
      <main className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Installation Services
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional metal roofing installation and maintenance services across the San Francisco Bay Area. 
              Licensed, insured, and backed by our 25-year warranty.
            </p>
          </div>

          {/* Quick Service Links */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <Link to="/metal-roof-installation" className="p-4 bg-background border border-border/50 rounded-lg hover:border-primary/50 hover:shadow-md transition-all text-center">
              <span className="font-medium text-foreground">Metal Roof Installation</span>
            </Link>
            <Link to="/standing-seam-systems" className="p-4 bg-background border border-border/50 rounded-lg hover:border-primary/50 hover:shadow-md transition-all text-center">
              <span className="font-medium text-foreground">Standing Seam Systems</span>
            </Link>
            <Link to="/r-panel-installation" className="p-4 bg-background border border-border/50 rounded-lg hover:border-primary/50 hover:shadow-md transition-all text-center">
              <span className="font-medium text-foreground">R-Panel Installation</span>
            </Link>
            <Link to="/roof-repair-maintenance" className="p-4 bg-background border border-border/50 rounded-lg hover:border-primary/50 hover:shadow-md transition-all text-center">
              <span className="font-medium text-foreground">Repair & Maintenance</span>
            </Link>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {services.map((service, index) => (
              <div key={index} className="bg-card rounded-xl p-6 sm:p-8 shadow-soft border hover:shadow-card-hover transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                    <service.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">{service.title}</h2>
                </div>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {service.description}
                </p>

                <div className="space-y-3 mb-6">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link to={service.link}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Learn More
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Why Choose Us */}
          <div className="bg-primary/5 rounded-2xl p-8 sm:p-12 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Why Choose The Roofing Friend?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We're committed to delivering exceptional results with every project, backed by our experience and warranty.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">25-Year Warranty</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive warranty covering materials and workmanship for your peace of mind.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Licensed & Insured</h3>
                <p className="text-sm text-muted-foreground">
                  Fully licensed contractors with comprehensive insurance for your protection.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Same Day Quotes</h3>
                <p className="text-sm text-muted-foreground">
                  Fast, accurate estimates to get your roofing project started quickly.
                </p>
              </div>
            </div>
          </div>

          {/* Professional Team Showcase */}
          <div className="bg-primary/5 rounded-2xl p-8 sm:p-12 mb-16">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Professional Installation Team
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Our certified roofing professionals bring decades of experience to every project. Licensed, insured, and committed to excellence.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-muted-foreground">Licensed & Insured Contractors</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-muted-foreground">25+ Years Combined Experience</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-muted-foreground">Manufacturer Certified Installers</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img 
                  src="/src/assets/residential-roofing-crew.jpg" 
                  alt="Professional roofing crew installing metal roof"
                  className="rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Ready to Start Your Roofing Project?
            </h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Contact us today for a free consultation and same-day quote. Our experts are ready to help you choose the perfect roofing solution.
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-lg">
              <Phone className="w-5 h-5 mr-2" />
              Get Free Consultation
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Services;
