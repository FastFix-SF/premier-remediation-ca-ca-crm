
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, Phone, MapPin, ShoppingCart, User, X } from 'lucide-react';
import { companyConfig } from '@/config/company';
import { useMainMenu, useServiceNavigation, useAreas } from '@/hooks/useBusinessConfig';


const RoofingFriendHeader = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Load navigation from navigation.json
  const mainMenu = useMainMenu();

  // Fallback: Load services and areas for populating children if not in navigation.json
  const serviceNavItems = useServiceNavigation();
  const areas = useAreas();

  // Build area navigation items (first 8 areas for dropdown)
  const areaNavItems = areas.slice(0, 8).map(area => ({
    label: area.name,
    path: `/roofing-services/${area.slug}`
  }));

  // Build navigation items from navigation.json, with fallback children from services/areas
  const navigationItems = useMemo(() => {
    return mainMenu.map(item => {
      // Convert href to path for compatibility
      const navItem: any = {
        label: item.label,
        path: item.href,
      };

      // If this is the Services menu, populate children from services if not present
      if (item.label === 'Services' && (!item.children || item.children.length === 0)) {
        navItem.submenu = serviceNavItems.length > 0 ? serviceNavItems : undefined;
      } else if (item.label === 'Service Areas' && (!item.children || item.children.length === 0)) {
        navItem.submenu = areaNavItems.length > 0 ? areaNavItems : undefined;
        navItem.mobileOnly = true;
      } else if (item.children && item.children.length > 0) {
        navItem.submenu = item.children.map(child => ({
          label: child.label,
          path: child.href
        }));
      }

      return navItem;
    });
  }, [mainMenu, serviceNavItems, areaNavItems]);

  return (
    <header className="bg-background border-b border-border shadow-card sticky top-0 z-50">
      {/* Top bar with contact info - Hidden on mobile */}
      <div className="bg-primary text-primary-foreground py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <a href={`tel:${companyConfig.phoneRaw}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                <Phone className="w-4 h-4" />
                <span>{companyConfig.phone}</span>
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Serving {companyConfig.address.region}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span>Free Estimates • Licensed & Insured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-1.5 sm:space-x-2 hover:opacity-80 transition-opacity"
            >
              <img 
                src={companyConfig.logo}
                alt={companyConfig.name}
                className="h-8 sm:h-10 lg:h-12 w-auto object-contain"
              />
              <div className="hidden xs:block">
                <div className="text-sm sm:text-base lg:text-lg font-display font-bold text-primary whitespace-nowrap">
                  {companyConfig.name}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  {companyConfig.tagline}
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-4 lg:gap-5 xl:gap-6 2xl:gap-8">
            {navigationItems.filter(item => !item.mobileOnly).map((item) => (
              <div key={item.label} className="relative group">
                <button
                  onClick={() => {
                    navigate(item.path);
                    window.scrollTo(0, 0);
                  }}
                  className="text-foreground hover:text-primary font-medium transition-colors py-2 text-sm whitespace-nowrap"
                >
                  {item.label}
                </button>
                {item.submenu && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-background border border-border rounded-lg shadow-card-hover opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      {item.submenu.map((subitem) => (
                        <button
                          key={subitem.label}
                          onClick={() => {
                            navigate(subitem.path);
                            window.scrollTo(0, 0);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors"
                        >
                          {subitem.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-2 lg:gap-3">
            <Button 
              onClick={() => {
                navigate('/store');
                window.scrollTo(0, 0);
              }}
              variant="outline" 
              size="sm" 
              className="hidden sm:flex items-center gap-1.5 text-xs lg:text-sm px-2 lg:px-3 h-8 lg:h-9"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden lg:inline">Store</span>
            </Button>
            
            <Button 
              onClick={() => {
                navigate('/contact');
                window.scrollTo(0, 0);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm px-2 sm:px-3 lg:px-4 h-8 lg:h-9 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Request Free Consultation</span>
              <span className="sm:hidden">Get Quote</span>
            </Button>

            {/* Mobile menu trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="xl:hidden h-8 w-8 p-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={companyConfig.logo}
                        alt={companyConfig.name}
                        className="h-10 w-auto object-contain"
                      />
                      <div>
                        <div className="text-base font-display font-bold text-primary">
                          {companyConfig.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {companyConfig.tagline}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact info - Mobile */}
                  <div className="p-4 bg-primary text-primary-foreground sm:hidden">
                    <div className="flex flex-col gap-2">
                      <a href={`tel:${companyConfig.phoneRaw}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                        <Phone className="w-4 h-4" />
                        <span className="text-lg font-bold text-orange-400">{companyConfig.phone}</span>
                      </a>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>Serving {companyConfig.address.region}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <nav className="flex flex-col gap-2">
                      {navigationItems.map((item) => (
                        <div key={item.label}>
                          <button
                            onClick={() => {
                              if (item.path === '/#service-areas') {
                                navigate('/');
                                setTimeout(() => {
                                  const element = document.getElementById('service-areas');
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }, 100);
                              } else {
                                navigate(item.path);
                                window.scrollTo(0, 0);
                              }
                              setIsOpen(false);
                            }}
                            className="text-left text-foreground hover:text-primary font-medium transition-colors py-3 px-2 block w-full text-base rounded-md hover:bg-muted/50"
                          >
                            {item.label}
                          </button>
                          {item.submenu && (
                            <div className="ml-6 flex flex-col gap-1 mt-1">
                              {item.submenu.map((subitem) => (
                                <button
                                  key={subitem.label}
                                  onClick={() => {
                                    navigate(subitem.path);
                                    window.scrollTo(0, 0);
                                    setIsOpen(false);
                                  }}
                                  className="text-left text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-2 block w-full rounded-md hover:bg-muted/30"
                                >
                                  {subitem.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </nav>
                  </div>

                  {/* Action buttons */}
                  <div className="p-4 sm:p-6 border-t">
                    <div className="flex flex-col gap-3">
                      
                      <Button 
                        onClick={() => {
                          navigate('/store');
                          window.scrollTo(0, 0);
                          setIsOpen(false);
                        }}
                        variant="outline" 
                        className="w-full justify-center"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Material Store
                      </Button>
                      <Button 
                        onClick={() => {
                          navigate('/contact');
                          window.scrollTo(0, 0);
                          setIsOpen(false);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground w-full justify-center"
                      >
                        Request Free Consultation
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default RoofingFriendHeader;
