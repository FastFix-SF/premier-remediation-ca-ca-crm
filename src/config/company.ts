/**
 * Centralized Company Configuration
 *
 * This file imports from JSON config files for personalized tenant data.
 * All branding, contact info, services, and areas come from the JSON configs.
 */

import business from './business.json';
import services from './services.json';
import areas from './areas.json';
import navigation from './navigation.json';

// Type for the business.json structure
interface BusinessData {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  phoneRaw: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    full: string;
  };
  owner?: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  hours: string;
  certifications: string[];
  uniqueSellingPoints: string[];
  social: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    yelp?: string;
    youtube?: string;
    tiktok?: string;
    google?: string;
  };
  seo: {
    siteUrl: string;
    defaultTitle: string;
    titleTemplate: string;
    description: string;
    keywords: string[];
  };
  hero?: {
    headline: string;
    headlineHighlight: string;
    subheadline: string;
    ctaPrimary?: string;
    ctaSecondary?: string;
  };
  trustIndicators?: Array<{
    icon: string;
    text: string;
  }>;
  statistics?: Array<{
    icon: string;
    number: string;
    label: string;
    description: string;
  }>;
  certificationLogos?: Array<{
    src: string;
    alt: string;
  }>;
  ratings?: {
    average: string;
    count: string;
    platform?: string;
  };
}

const businessData = business as unknown as BusinessData;

export const companyConfig = {
  // Company Identity - loaded from business.json
  name: businessData.name,
  legalName: businessData.name,
  shortName: businessData.name,
  tagline: businessData.tagline || "",
  description: businessData.description || "",
  
  // Website URL (for payment links, sharing, etc.)
  websiteUrl: businessData.seo?.siteUrl || "",
  
  // Contact Information
  phone: businessData.phone || "",
  phoneRaw: businessData.phoneRaw || "",
  email: businessData.email || "",
  
  // Business Details
  licenseNumber: "",
  address: businessData.address || {
    street: "",
    city: "",
    state: "",
    zip: "",
    full: "",
  },
  
  // Hours of Operation
  hours: {
    weekdays: businessData.hours || "Mon - Fri: 8AM - 5PM",
    weekends: "Weekends: By Appointment",
    emergency: "",
    schema: "Mo-Fr 08:00-17:00",
  },
  
  // Service Areas - loaded from areas.json
  serviceAreas: (areas as any[]).map((a: any) => a.name || a.city || 'City'),

  // Social Media Links
  social: businessData.social || {},

  // Logo
  logo: businessData.logo || "",

  // SEO Defaults
  seo: {
    defaultTitle: businessData.seo?.defaultTitle || businessData.name,
    defaultDescription: businessData.seo?.description || businessData.description,
    defaultKeywords: businessData.seo?.keywords?.join(", ") || "",
    siteName: businessData.name,
    author: businessData.name,
  },

  // Ratings
  ratings: businessData.ratings || {
    average: "5.0",
    count: "0",
    best: "5",
    worst: "1",
  },

  // Pricing
  priceRange: "$$",

  // Services - loaded from services.json
  services: (services as any[]).map((s: any) => ({
    name: s.name || 'Service',
    path: `/services/${s.slug || s.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    slug: s.slug,
    shortDescription: s.shortDescription || '',
    isFeatured: s.isFeatured || false,
  })),

  // Navigation - loaded from navigation.json
  navigation: navigation as any,
  
  // Warranty Info
  warranty: {
    years: 0,
    description: "",
  },
  
  // Geo coordinates (for schema.org)
  coordinates: {
    lat: 0,
    lng: 0,
  },
} as const;

// Type for the company config
export type CompanyConfig = typeof companyConfig;

// Export navigation config for direct use
export const navigationConfig = navigation as {
  mainMenu: Array<{
    label: string;
    href: string;
    visible: boolean;
    children?: Array<{ label: string; href: string; description?: string }>;
  }>;
  footerMenu: {
    company: Array<{ label: string; href: string }>;
    services: Array<{ label: string; href: string }>;
    areas: Array<{ label: string; href: string }>;
  };
  servicesList: Array<{ slug: string; name: string; isFeatured?: boolean }>;
  areasList: Array<{ slug: string; city: string; state: string; isPrimary?: boolean }>;
};

// Export services and areas configs for direct access
export const servicesConfig = services as Array<{
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;
  icon?: string;
  heroImage?: string;
  isFeatured?: boolean;
}>;

export const areasConfig = areas as Array<{
  slug: string;
  name: string;
  fullName?: string;
  description?: string;
  heroImage?: string;
  neighborhoods?: string[];
}>;
