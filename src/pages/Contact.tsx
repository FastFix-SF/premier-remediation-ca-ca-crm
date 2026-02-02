
import React, { useState } from 'react';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { Button } from '../components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Mail, MapPin, Clock, Send, Loader2 } from 'lucide-react';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { useIsMobile } from '@/hooks/use-mobile';
import { companyConfig } from '@/config/company';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    service: '',
    referralSource: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.phone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-crm-lead', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          company: formData.company.trim(),
          service: formData.service,
          referralSource: formData.referralSource,
          message: formData.message.trim()
        }
      });

      if (error) {
        throw error;
      }

      // Clear form on success
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        company: '',
        service: '',
        referralSource: '',
        message: ''
      });

      toast({
        title: "Success!",
        description: "Thank you! Your quote request has been received and added to our system. We'll contact you within 24 hours.",
      });

    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: "Failed to Send",
        description: `There was an error submitting your request. Please try again or call us directly at ${companyConfig.phone}.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={`Contact ${companyConfig.name} - Get Your Free Quote Today`}
        description={`Contact ${companyConfig.name} for your ${companyConfig.address.region} metal roofing needs. Free estimates, same-day quotes, and expert consultation available.`}
      />
      <RoofingFriendHeader />
      
      <main className={isMobile ? "py-6" : "py-8 sm:py-12 lg:py-16"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className={isMobile ? "text-center mb-6" : "text-center mb-12 lg:mb-16"}>
            <h1 className={isMobile ? "text-2xl font-display font-bold text-foreground mb-2" : "text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4"}>
              Contact Us
            </h1>
            <p className={isMobile ? "text-base text-muted-foreground max-w-3xl mx-auto" : "text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"}>
              Ready to start your roofing project? Get in touch for a free consultation and same-day quote.
            </p>
          </div>

          <div className={isMobile ? "grid lg:grid-cols-2 gap-6" : "grid lg:grid-cols-2 gap-12 lg:gap-16"}>
            {/* Contact Form */}
            <div className="animate-fade-in">
              <h2 className={isMobile ? "text-xl font-bold text-foreground mb-4" : "text-2xl font-bold text-foreground mb-6"}>Get Your Free Quote</h2>
              <form onSubmit={handleSubmit} className={isMobile ? "space-y-4 bg-card/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-border/50" : "space-y-6 bg-card/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border/50"}>
                <div className={isMobile ? "space-y-4" : "grid sm:grid-cols-2 gap-4"}>
                  <div>
                    <label htmlFor="name" className={isMobile ? "block text-xs font-medium text-foreground mb-1" : "block text-sm font-medium text-foreground mb-2"}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className={isMobile ? "w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-md transition-all duration-200 hover:border-primary/50" : "w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-md transition-all duration-200 hover:border-primary/50"}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={isMobile ? "block text-xs font-medium text-foreground mb-1" : "block text-sm font-medium text-foreground mb-2"}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={isMobile ? "w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-md transition-all duration-200 hover:border-primary/50" : "w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-md transition-all duration-200 hover:border-primary/50"}
                      placeholder={companyConfig.phone}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className={isMobile ? "block text-xs font-medium text-foreground mb-1" : "block text-sm font-medium text-foreground mb-2"}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={isMobile ? "w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-md transition-all duration-200 hover:border-primary/50" : "w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-md transition-all duration-200 hover:border-primary/50"}
                    placeholder="your.email@example.com"
                  />
                </div>

                {!isMobile && (
                  <>
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
                        Address
                      </label>
                      <GooglePlacesAutocomplete
                        value={formData.address}
                        onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                        onPlaceSelected={(place) => {
                          console.log('Selected place:', place);
                        }}
                        placeholder="Start typing an address..."
                      />
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-md transition-all duration-200 hover:border-primary/50"
                        placeholder="Company name (optional)"
                      />
                    </div>
                  </>
                )}

                <div className={isMobile ? "space-y-4" : "grid sm:grid-cols-2 gap-4"}>
                  <div>
                    <label htmlFor="service" className={isMobile ? "block text-xs font-medium text-foreground mb-1" : "block text-sm font-medium text-foreground mb-2"}>
                      Service Needed
                    </label>
                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleInputChange}
                      className={isMobile ? "w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-md transition-all duration-200 hover:border-primary/50" : "w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-md transition-all duration-200 hover:border-primary/50"}
                    >
                      <option value="">Select a service</option>
                      <option value="residential-installation">Residential Installation</option>
                      <option value="commercial-roofing">Commercial Roofing</option>
                      <option value="roof-repair">Roof Repair</option>
                      <option value="roof-inspection">Roof Inspection</option>
                      <option value="storm-damage">Storm Damage Repair</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="consultation">Consultation Only</option>
                    </select>
                  </div>

                  {!isMobile && (
                    <div>
                      <label htmlFor="referralSource" className="block text-sm font-medium text-foreground mb-2">
                        How did you find us?
                      </label>
                      <select
                        id="referralSource"
                        name="referralSource"
                        value={formData.referralSource}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-md transition-all duration-200 hover:border-primary/50"
                      >
                        <option value="">Select an option</option>
                        <option value="google-search">Google Search</option>
                        <option value="referral-friend">Referral from Friend</option>
                        <option value="social-media">Social Media</option>
                        <option value="online-directory">Online Directory</option>
                        <option value="previous-customer">Previous Customer</option>
                        <option value="advertisement">Advertisement</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className={isMobile ? "block text-xs font-medium text-foreground mb-1" : "block text-sm font-medium text-foreground mb-2"}>
                    Project Details
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={isMobile ? 3 : 4}
                    value={formData.message}
                    onChange={handleInputChange}
                    className={isMobile ? "w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-md transition-all duration-200 hover:border-primary/50 resize-none" : "w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-md transition-all duration-200 hover:border-primary/50 resize-none"}
                    placeholder="Tell us about your project, timeline, and any specific requirements..."
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={isMobile ? "w-full bg-primary hover:bg-primary/90 hover:shadow-lg text-primary-foreground font-semibold px-6 py-2.5 text-sm rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-[1.02]" : "w-full sm:w-auto bg-primary hover:bg-primary/90 hover:shadow-xl text-primary-foreground font-semibold px-8 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] hover:-translate-y-0.5"}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className={isMobile ? "w-4 h-4 mr-2 animate-spin" : "w-5 h-5 mr-2 animate-spin"} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className={isMobile ? "w-4 h-4 mr-2" : "w-5 h-5 mr-2"} />
                      Get My Free Quote
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div className={isMobile ? "space-y-4 animate-fade-in" : "space-y-8 animate-fade-in"}>
              <div className={isMobile ? "bg-card/50 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-border/50" : "bg-card/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border/50"}>
                <h2 className={isMobile ? "text-xl font-bold text-foreground mb-4" : "text-2xl font-bold text-foreground mb-6"}>Get In Touch</h2>
                <div className={isMobile ? "space-y-3" : "space-y-6"}>
                  <div className={isMobile ? "flex items-start gap-3" : "flex items-start gap-4"}>
                    <div className={isMobile ? "w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0" : "w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0"}>
                      <Phone className={isMobile ? "w-5 h-5 text-primary" : "w-6 h-6 text-primary"} />
                    </div>
                    <div>
                      <h3 className={isMobile ? "font-semibold text-sm text-foreground mb-0.5" : "font-semibold text-foreground mb-1"}>Phone</h3>
                      <p className={isMobile ? "text-sm text-muted-foreground" : "text-muted-foreground"}>{companyConfig.phone}</p>
                      {!isMobile && <p className="text-sm text-muted-foreground">{companyConfig.hours.emergency}</p>}
                    </div>
                  </div>

                  <div className={isMobile ? "flex items-start gap-3" : "flex items-start gap-4"}>
                    <div className={isMobile ? "w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0" : "w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0"}>
                      <Mail className={isMobile ? "w-5 h-5 text-primary" : "w-6 h-6 text-primary"} />
                    </div>
                    <div>
                      <h3 className={isMobile ? "font-semibold text-sm text-foreground mb-0.5" : "font-semibold text-foreground mb-1"}>Email</h3>
                      <p className={isMobile ? "text-sm text-muted-foreground break-all" : "text-muted-foreground"}>{companyConfig.email}</p>
                    </div>
                  </div>

                  {!isMobile && (
                    <>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Service Area</h3>
                          <p className="text-muted-foreground">{companyConfig.address.region}</p>
                          <p className="text-sm text-muted-foreground">Serving {companyConfig.serviceAreas.length}+ locations</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Business Hours</h3>
                          <p className="text-muted-foreground">{companyConfig.hours.weekdays}</p>
                          <p className="text-muted-foreground">{companyConfig.hours.weekends}</p>
                          <p className="text-sm text-muted-foreground">Emergency calls available 24/7</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Stats - Hidden on mobile */}
              {!isMobile && (
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-6 shadow-md border border-primary/10 hover:shadow-lg transition-shadow duration-200">
                  <h3 className="font-semibold text-foreground mb-4">Why Choose Us?</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Projects Completed</span>
                      <span className="font-semibold text-foreground">500+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer Rating</span>
                      <span className="font-semibold text-foreground">4.9/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Warranty</span>
                      <span className="font-semibold text-foreground">{companyConfig.warranty.years} Years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Response Time</span>
                      <span className="font-semibold text-foreground">Same Day</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
