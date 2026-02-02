import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollLink from './ui/scroll-link';
import { Download } from 'lucide-react';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Linkedin, Zap } from 'lucide-react';
import { Youtube } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { companyConfig } from '@/config/company';
import { useFooterMenu, useAreas } from '@/hooks/useBusinessConfig';

const Footer = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const footerMenu = useFooterMenu();
  const areas = useAreas();
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const {
        outcome
      } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      // Fallback for iOS or already installed
      alert('To install this app:\n\n1. Tap the Share button\n2. Select "Add to Home Screen"\n3. Tap "Add"');
    }
  };
  const currentYear = new Date().getFullYear();
  
  const handleServiceClick = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };
  const handleLocationClick = (locationSlug: string) => {
    navigate(`/roofing-services/${locationSlug}`);
    window.scrollTo(0, 0);
  };
  return <footer className="bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className={isMobile ? "py-6" : "py-12 lg:py-16"}>
          <div className={isMobile ? "grid lg:grid-cols-4 gap-6" : "grid lg:grid-cols-4 gap-8 lg:gap-12"}>
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className={isMobile ? "flex items-center space-x-2 mb-3" : "flex items-center space-x-3 mb-6"}>
                <img src={companyConfig.logo} alt={companyConfig.name} className={isMobile ? "w-10 h-10" : "w-12 h-12"} />
                <div>
                  <h3 className={isMobile ? "text-base font-display font-bold text-white" : "text-lg font-display font-bold text-white"}>
                    {companyConfig.name}
                  </h3>
                  <p className={isMobile ? "text-xs text-white/80" : "text-sm text-white/80"}>{companyConfig.tagline}</p>
                </div>
              </div>
              {!isMobile && (
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                  {companyConfig.description}
                </p>
              )}
              
              {/* Social Links */}
              <div className={isMobile ? "flex flex-wrap gap-1.5" : "flex flex-wrap gap-2"}>
                <a href={companyConfig.social.youtube} target="_blank" rel="noopener noreferrer" className={isMobile ? "w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors" : "w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"}>
                  <Youtube className="w-4 h-4 text-white" />
                </a>
                <a href={companyConfig.social.instagram} target="_blank" rel="noopener noreferrer" className={isMobile ? "w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors" : "w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"}>
                  <Instagram className="w-4 h-4 text-white" />
                </a>
                <a href={companyConfig.social.facebook} target="_blank" rel="noopener noreferrer" className={isMobile ? "w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors" : "w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"}>
                  <Facebook className="w-4 h-4 text-white" />
                </a>
                <a href={companyConfig.social.tiktok} target="_blank" rel="noopener noreferrer" className={isMobile ? "w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors" : "w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"}>
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
                <a href={companyConfig.social.google} target="_blank" rel="noopener noreferrer" className={isMobile ? "w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors" : "w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"}>
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </a>
                <a href={companyConfig.social.yelp} target="_blank" rel="noopener noreferrer" className={isMobile ? "w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors" : "w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"}>
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.111 18.226c-.141.969-2.119 3.483-3.029 3.75-.524.154-.914-.238-1.054-.681-.147-.466-.123-.893-.123-.893l.331-3.683c.04-.461.268-.734.642-.85 1.113-.344 3.092-.853 3.233-1.822 0 0 .04-.308-.172-.479-.398-.32-1.414.062-1.918.062-.504 0-1.054-.236-1.503.093-.449.329-.324.86-.324.86l1.314 3.518c.106.28-.086.575-.432.613-.346.04-.623-.154-.828-.479l-2.712-4.298c-.288-.45-.123-.893.205-1.222.328-.329.86-.329 1.222-.205l4.298 2.712c.324.205.518.482.479.828-.04.346-.332.537-.612.431l-3.518-1.314s-.531-.125-.86.324c-.329.449-.093.999-.093 1.503 0 .504-.382 1.52-.062 1.918.171.212.479.172.479.172zm-8.39-9.131l3.684-.332s.427.024.893.123c.44.14.835.53.681 1.054-.267.91-2.781 2.888-3.75 3.029 0 0-.308.04-.479-.172-.32-.398.062-1.414.062-1.918 0-.504-.236-1.054.093-1.503.329-.449.86-.324.86-.324l3.518 1.314c.28.106.575-.086.613-.432.04-.346-.154-.623-.479-.828l-4.298-2.712c-.45-.288-.893-.123-1.222.205-.329.328-.329.86-.205 1.222l2.712 4.298c.205.324.482.518.828.479.346-.04.537-.332.431-.612l-1.314-3.518s-.125-.531.324-.86c.449-.329.999-.093 1.503-.093.504 0 1.52-.382 1.918-.062.212.171.172.479.172.479z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className={isMobile ? "font-semibold text-sm text-white mb-2" : "font-semibold text-white mb-4"}>Quick Links</h4>
              <ul className={isMobile ? "space-y-1.5" : "space-y-3"}>
                {footerMenu?.company?.length > 0 ? (
                  footerMenu.company.map((link, index) => (
                    <li key={index}>
                      <ScrollLink to={link.href} className={isMobile ? "text-white/80 hover:text-white transition-colors text-xs" : "text-white/80 hover:text-white transition-colors text-sm"}>
                        {link.label}
                      </ScrollLink>
                    </li>
                  ))
                ) : (
                  <>
                    <li><ScrollLink to="/" className={isMobile ? "text-white/80 hover:text-white transition-colors text-xs" : "text-white/80 hover:text-white transition-colors text-sm"}>Home</ScrollLink></li>
                    <li><ScrollLink to="/about" className={isMobile ? "text-white/80 hover:text-white transition-colors text-xs" : "text-white/80 hover:text-white transition-colors text-sm"}>About Us</ScrollLink></li>
                    <li><ScrollLink to="/contact" className={isMobile ? "text-white/80 hover:text-white transition-colors text-xs" : "text-white/80 hover:text-white transition-colors text-sm"}>Contact</ScrollLink></li>
                  </>
                )}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className={isMobile ? "font-semibold text-sm text-white mb-2" : "font-semibold text-white mb-4"}>Services</h4>
              <ul className={isMobile ? "space-y-1.5" : "space-y-3"}>
                {companyConfig.services.slice(0, isMobile ? 4 : companyConfig.services.length).map((service, index) => <li key={index}>
                    <button onClick={() => handleServiceClick(service.path)} className={isMobile ? "text-white/80 hover:text-white transition-colors text-xs text-left" : "text-white/80 hover:text-white transition-colors text-sm text-left"}>
                      {service.name}
                    </button>
                  </li>)}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className={isMobile ? "font-semibold text-sm text-white mb-2" : "font-semibold text-white mb-4"}>Contact Info</h4>
              <div className={isMobile ? "space-y-2" : "space-y-4"}>
                <div className={isMobile ? "flex items-start space-x-2" : "flex items-start space-x-3"}>
                  <Phone className={isMobile ? "w-3.5 h-3.5 text-white mt-0.5 shrink-0" : "w-4 h-4 text-white mt-0.5 shrink-0"} />
                  <div>
                    <a href={`tel:${companyConfig.phoneRaw}`} className={isMobile ? "text-xs font-medium text-white hover:text-accent transition-colors" : "text-sm font-medium text-white hover:text-accent transition-colors"}>
                      {companyConfig.phone}
                    </a>
                    {!isMobile && <p className="text-xs text-white/80">{companyConfig.hours.emergency}</p>}
                  </div>
                </div>
                
                <div className={isMobile ? "flex items-start space-x-2" : "flex items-start space-x-3"}>
                  <Mail className={isMobile ? "w-3.5 h-3.5 text-white mt-0.5 shrink-0" : "w-4 h-4 text-white mt-0.5 shrink-0"} />
                  <div>
                    <p className={isMobile ? "text-xs text-white break-all" : "text-sm text-white"}>{companyConfig.email}</p>
                  </div>
                </div>
                
                {!isMobile && (
                  <>
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-4 h-4 text-white mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-white">{companyConfig.address.region}</p>
                        <p className="text-xs text-white/80">Serving {companyConfig.serviceAreas.length}+ locations</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Clock className="w-4 h-4 text-white mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-white">{companyConfig.hours.weekdays}</p>
                        <p className="text-xs text-white/80">{companyConfig.hours.weekends}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Service Areas - Hidden on mobile */}
        {!isMobile && areas.length > 0 && (
          <div className="border-t border-white/20 py-8">
            <h4 className="font-semibold text-white mb-4 text-center">Service Areas</h4>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {areas.map((area, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationClick(area.slug)}
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  {area.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className={isMobile ? "border-t border-white/20 py-4" : "border-t border-white/20 py-6"}>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className={isMobile ? "text-xs text-white/80 text-center md:text-left" : "text-sm text-white/80 text-center md:text-left"}>
              © {currentYear} {companyConfig.name}{isMobile ? '' : `. All rights reserved. | Licensed & Insured | ${companyConfig.licenseNumber}`}
            </div>
            <div className={isMobile ? "flex flex-col items-center space-y-2" : "flex items-center space-x-6"}>
              {!isMobile && (
                <>
                  <ScrollLink to="/privacy" className="text-sm text-white/80 hover:text-white transition-colors">
                    Privacy Policy
                  </ScrollLink>
                  <ScrollLink to="/terms" className="text-sm text-white/80 hover:text-white transition-colors">
                    Terms of Service
                  </ScrollLink>
                </>
              )}
              <a href="https://fastfix.ai/" target="_blank" rel="noopener noreferrer" className={isMobile ? "inline-flex items-center space-x-1.5 bg-[#1a237e] hover:bg-[#283593] px-2 py-1 rounded-lg border border-[#3949ab]/30 transition-colors" : "inline-flex items-center space-x-2 bg-[#1a237e] hover:bg-[#283593] px-3 py-1.5 rounded-lg border border-[#3949ab]/30 transition-colors"}>
                <Zap className={isMobile ? "w-3 h-3 text-white" : "w-4 h-4 text-white"} />
                <span className={isMobile ? "text-[10px] font-medium text-white tracking-wide" : "text-xs font-medium text-white tracking-wide"}>POWERED BY FASTFIX.AI</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;
