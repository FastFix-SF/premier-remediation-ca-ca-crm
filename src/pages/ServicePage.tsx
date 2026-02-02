import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { ServiceStructuredData, FAQStructuredData } from '../components/StructuredData';
import { Button } from '../components/ui/button';
import { Phone, Star, CheckCircle, icons, LucideIcon } from 'lucide-react';
import { useServiceBySlug, useAreas, useBusiness, useRatings } from '../hooks/useBusinessConfig';

// Helper to get icon component from string name
const getIcon = (iconName: string): LucideIcon => {
  const IconComponent = icons[iconName as keyof typeof icons];
  return IconComponent || CheckCircle;
};

const ServicePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const service = useServiceBySlug(slug || '');
  const areas = useAreas();
  const business = useBusiness();
  const ratings = useRatings();

  // If service not found, redirect to services page
  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const ServiceIcon = getIcon(service.icon);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={service.seoTitle || `${service.name} | ${business.name}`}
        description={service.seoDescription || service.description}
        keywords={service.seoKeywords?.join(', ')}
      />
      <ServiceStructuredData
        serviceName={service.name}
        location="San Francisco Bay Area"
      />
      {service.faqs && service.faqs.length > 0 && (
        <FAQStructuredData faqs={service.faqs} />
      )}

      <RoofingFriendHeader />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                {service.heroTitle || service.name}
                {service.heroHighlight && <span className="block text-accent">{service.heroHighlight}</span>}
              </h1>
              {service.heroSubheadline && (
                <p className="text-2xl text-white/95 mb-4 font-medium">
                  {service.heroSubheadline}
                </p>
              )}
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                {service.introText || service.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href={`tel:${business.phoneRaw}`}>
                  <Button size="lg">
                    <Phone className="w-5 h-5 mr-2" />
                    {business.hero?.ctaPrimary || 'Get Free Estimate'}
                  </Button>
                </a>
                <Link to="/contact">
                  <Button variant="white-outline" size="lg">
                    {business.hero?.ctaSecondary || 'View Our Work'}
                  </Button>
                </Link>
              </div>
              {ratings && (
                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/20">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <span className="text-white/90">
                    {ratings.average}/5 from {ratings.count}+ {ratings.platform || 'Bay Area'} reviews
                  </span>
                </div>
              )}
            </div>
            <div className="relative">
              {service.heroImage && (
                <img
                  src={service.heroImage}
                  alt={`${service.name} in the Bay Area`}
                  className="rounded-2xl shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {service.benefits && service.benefits.length > 0 && (
        <section className="py-16 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                Why Choose Our {service.name}?
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                {business.name} offers unmatched benefits for Bay Area property owners.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {service.benefits.map((benefit, index) => {
                const BenefitIcon = getIcon(benefit.icon);
                return (
                  <div key={index} className="text-center p-6 bg-background rounded-xl shadow-sm border border-border/50">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BenefitIcon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Process Steps Section */}
      {service.processSteps && service.processSteps.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                Our Process
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Simple, transparent steps from start to finish.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {service.processSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Section */}
      {service.trustSection && (
        <section className="py-16 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                {service.trustSection.title}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {service.trustSection.points.map((point, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-lg text-foreground">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Service Areas */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Serving Your Community
            </h2>
            <p className="text-lg text-muted-foreground">
              Professional {service.name.toLowerCase()} in your area
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {areas.slice(0, 12).map((area) => (
              <Link
                key={area.slug}
                to={`/roofing-services/${area.slug}`}
                className="p-4 bg-background border border-border/50 rounded-lg hover:border-primary/50 hover:shadow-md transition-all text-center"
              >
                <span className="font-medium text-foreground">{area.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {service.faqs && service.faqs.length > 0 && (
        <section className="py-16 bg-muted/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground">
                Get answers to common questions about {service.name.toLowerCase()}
              </p>
            </div>

            <div className="space-y-6">
              {service.faqs.map((faq, index) => (
                <div key={index} className="bg-background p-6 rounded-xl border border-border/50">
                  <h3 className="text-lg font-semibold text-foreground mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            {service.ctaText || 'Ready to Get Started?'}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {service.ctaSubtext || 'Get your free estimate today and see why customers trust us.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={`tel:${business.phoneRaw}`}>
              <Button size="lg">
                <Phone className="w-5 h-5 mr-2" />
                {business.hero?.ctaPrimary || 'Get Free Estimate'}
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

export default ServicePage;
