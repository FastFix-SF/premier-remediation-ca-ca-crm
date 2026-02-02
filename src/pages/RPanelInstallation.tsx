
import React from 'react';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { ServiceStructuredData, FAQStructuredData } from '../components/StructuredData';
import { Button } from '../components/ui/button';
import { Phone, CheckCircle, Star, DollarSign, Clock, Hammer } from 'lucide-react';
import { Link } from 'react-router-dom';

const RPanelInstallation = () => {
  const faqs = [
    {
      question: "What is R-Panel metal roofing?",
      answer: "R-Panel is a popular exposed fastener metal roofing system with distinctive ribs every 12 inches. It's cost-effective, durable, and suitable for both residential and commercial applications, offering excellent value for money."
    },
    {
      question: "How much does R-Panel installation cost?",
      answer: "R-Panel installation typically costs $8-12 per square foot, making it one of the most affordable metal roofing options. Costs vary based on gauge, coating, roof complexity, and local factors. We provide free detailed estimates."
    },
    {
      question: "What's the difference between R-Panel and other metal roofing?",
      answer: "R-Panel uses exposed fasteners (screws visible on surface) unlike standing seam systems. This makes it more affordable to install but requires periodic fastener maintenance. It's ideal for agricultural, commercial, and budget-conscious residential projects."
    },
    {
      question: "How long does R-Panel roofing last?",
      answer: "Quality R-Panel roofing lasts 25-40 years with proper installation and maintenance. Regular fastener inspection and replacement every 10-15 years helps maximize lifespan. We offer 25-year material warranties."
    },
    {
      question: "Can R-Panel be used on residential homes?",
      answer: "Absolutely! R-Panel is increasingly popular for residential use, especially in rural areas, modern farmhouse designs, and cost-conscious builds. It provides excellent weather protection at an affordable price point."
    },
    {
      question: "What maintenance does R-Panel require?",
      answer: "R-Panel requires periodic fastener inspection and replacement (every 10-15 years), gutter cleaning, and occasional panel touch-up. Overall maintenance is minimal compared to traditional roofing materials."
    }
  ];

  const benefits = [
    { icon: DollarSign, title: "Cost Effective", desc: "Most affordable metal roofing option" },
    { icon: Clock, title: "Quick Install", desc: "Faster installation saves labor costs" },
    { icon: Hammer, title: "Versatile Use", desc: "Perfect for residential and commercial" },
    { icon: CheckCircle, title: "Proven Performance", desc: "25-40 year lifespan with warranty" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="R-Panel Metal Roofing Installation Bay Area | The Roofing Friend"
        description="Affordable R-Panel metal roofing installation in the Bay Area. Cost-effective, durable, and versatile for residential and commercial projects. Free estimates available."
        keywords="R-panel metal roofing, R panel installation, affordable metal roofing, Bay Area R-panel, exposed fastener roofing"
      />
      <ServiceStructuredData 
        serviceName="R-Panel Metal Roofing Installation" 
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
                R-Panel Metal Roofing
                <span className="block text-accent">Installation</span>
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                The most cost-effective metal roofing solution. Durable, versatile, and perfect 
                for residential, commercial, and agricultural applications.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary font-semibold">
                  <Phone className="w-5 h-5 mr-2" />
                  Get R-Panel Quote
                </Button>
                <Link to="/contact">
                  <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                    View R-Panel Projects
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-white/90">4.8/5 from cost-conscious customers</span>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/src/assets/r-panel-installation.jpg"
                alt="R-Panel metal roofing installation project"
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
              Why Choose R-Panel Roofing?
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              R-Panel offers the perfect balance of affordability, durability, and performance for a wide range of applications.
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

      {/* Applications Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Perfect for Multiple Applications
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Residential Homes</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Modern farmhouse designs</li>
                <li>• Budget-conscious builds</li>
                <li>• Rural and suburban homes</li>
                <li>• Garage and outbuilding roofs</li>
              </ul>
            </div>
            <div className="bg-background p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Commercial Buildings</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Warehouses and storage facilities</li>
                <li>• Retail and office buildings</li>
                <li>• Manufacturing facilities</li>
                <li>• Automotive service centers</li>
              </ul>
            </div>
            <div className="bg-background p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-4">Agricultural Buildings</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Barns and livestock shelters</li>
                <li>• Equipment storage buildings</li>
                <li>• Processing facilities</li>
                <li>• Greenhouses and nurseries</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              R-Panel Installation FAQ
            </h2>
            <p className="text-lg text-muted-foreground">
              Common questions about R-Panel metal roofing installation and maintenance
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
            Ready for Affordable R-Panel Roofing?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get the best value in metal roofing with professional R-Panel installation. Free estimates available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary font-semibold">
              <Phone className="w-5 h-5 mr-2" />
              (510) 555-ROOF
            </Button>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                Get Free R-Panel Quote
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RPanelInstallation;
