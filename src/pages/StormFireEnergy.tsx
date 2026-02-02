import React from 'react';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { ServiceStructuredData, FAQStructuredData } from '../components/StructuredData';
import { Button } from '../components/ui/button';
import { Phone, CheckCircle, Star, Zap, Shield, AlertTriangle, Flame, CloudRain } from 'lucide-react';
import { Link } from 'react-router-dom';

const StormFireEnergy = () => {
  const faqs = [
    {
      question: "How does metal roofing perform in storms?",
      answer: "Metal roofing excels in severe weather with wind resistance up to 140+ mph, impact resistance from hail, and no risk of fire spread. The interlocking panels and secure fastening systems provide superior protection compared to traditional roofing materials."
    },
    {
      question: "What fire ratings do metal roofs have?",
      answer: "Metal roofing achieves Class A fire ratings - the highest available. It's non-combustible, won't ignite from flying embers, and can help prevent fire spread. This makes it ideal for wildfire-prone areas in California."
    },
    {
      question: "How much energy can I save with a metal roof?",
      answer: "Metal roofing can reduce cooling costs by 10-25% through reflective coatings and thermal barriers. Cool roof technologies reflect solar heat, while proper ventilation and insulation further improve energy efficiency."
    },
    {
      question: "Do metal roofs qualify for insurance discounts?",
      answer: "Many insurance companies offer discounts for metal roofing due to superior storm and fire resistance. Discounts can range from 5-35% depending on your location and specific metal roofing system installed."
    },
    {
      question: "What's the lifespan of metal roofing in extreme conditions?",
      answer: "Quality metal roofing systems last 40-70+ years even in harsh conditions. They're designed to withstand repeated storm cycles, extreme temperatures, and UV exposure while maintaining structural integrity and appearance."
    }
  ];

  const benefits = [
    {
      icon: AlertTriangle,
      title: "Storm Protection",
      description: "Superior resistance to high winds, hail, and severe weather conditions with interlocking panel systems.",
      features: ["140+ mph wind resistance", "Impact-resistant coatings", "No uplift in extreme weather", "Hail damage protection"]
    },
    {
      icon: Flame,
      title: "Fire Safety",
      description: "Class A fire rating provides maximum protection against wildfire and reduces insurance premiums.",
      features: ["Non-combustible material", "No ember ignition", "Prevents fire spread", "Wildfire zone approved"]
    },
    {
      icon: Zap,
      title: "Energy Efficiency",
      description: "Advanced reflective coatings and thermal barriers significantly reduce cooling costs year-round.",
      features: ["Cool roof technology", "10-25% energy savings", "Reflective coatings", "Thermal barrier systems"]
    },
    {
      icon: Shield,
      title: "Insurance Benefits",
      description: "Qualify for significant insurance discounts due to superior protection and reduced claim risks.",
      features: ["5-35% premium discounts", "Reduced claim frequency", "Lower deductibles", "Enhanced coverage"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Storm, Fire & Energy Solutions - Metal Roofing Bay Area | The Roofing Friend"
        description="Protect your property with storm-resistant, fire-safe, energy-efficient metal roofing. Reduce insurance costs and energy bills while ensuring maximum protection."
        keywords="storm resistant roofing, fire safe roofing, energy efficient roofing, metal roof insurance discounts, wildfire protection, hail resistant roofing"
      />
      <ServiceStructuredData 
        serviceName="Storm, Fire & Energy Solutions" 
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
                Storm, Fire & Energy
                <span className="block text-accent">Protection Solutions</span>
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Advanced metal roofing systems designed for extreme weather, fire safety, and maximum energy efficiency. 
                Protect your investment while reducing insurance and energy costs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary font-semibold">
                  <Phone className="w-5 h-5 mr-2" />
                  Get Protection Assessment
                </Button>
                <Link to="/projects">
                  <Button variant="white-outline" size="lg">
                    View Storm Projects
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-white/90">Maximum protection rated systems</span>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/lovable-uploads/967e2aeb-672d-4fa3-a50d-6273ecf5553a.png"
                alt="Storm and fire resistant metal roofing installation"
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
              Triple Protection Benefits
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our metal roofing systems provide comprehensive protection against storms, fires, and energy waste.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="bg-background rounded-xl p-6 sm:p-8 shadow-soft border hover:shadow-card-hover transition-shadow">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">{benefit.title}</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {benefit.description}
                  </p>

                  <div className="space-y-3">
                    {benefit.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Protection Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Advanced Protection Features
            </h2>
            <p className="text-lg text-muted-foreground">
              Engineered for California's challenging climate and weather conditions
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Class A Fire Rating',
              'Wind Resistance 140+ MPH', 
              'Impact Resistant Coatings',
              'Cool Roof Technology',
              'Thermal Barrier Systems',
              'Insurance Premium Discounts',
              'Wildfire Zone Approved',
              'Energy Star Qualified',
              'Hail Impact Certified'
            ].map((feature) => (
              <div key={feature} className="p-4 bg-background border border-border/50 rounded-lg text-center">
                <span className="font-medium text-foreground">{feature}</span>
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
              Protection & Efficiency FAQ
            </h2>
            <p className="text-lg text-muted-foreground">
              Common questions about storm, fire, and energy protection
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
            Maximum Protection Starts Here
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get a comprehensive assessment of your property's protection needs and energy savings potential.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary font-semibold">
              <Phone className="w-5 h-5 mr-2" />
              (510) 555-ROOF
            </Button>
            <Link to="/contact">
              <Button variant="white-outline" size="lg">
                Schedule Assessment
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StormFireEnergy;
