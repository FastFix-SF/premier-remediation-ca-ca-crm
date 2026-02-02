/**
 * Hook to get tenant-specific company configuration
 * Falls back to static companyConfig if no tenant is resolved
 */

import { useTenant } from '../contexts/TenantContext';
import { companyConfig } from '../config/company';

export interface TenantCompanyConfig {
  // Identity
  name: string;
  shortName: string;
  tagline?: string;
  description?: string;

  // Contact
  phone?: string;
  phoneRaw?: string;
  email?: string;

  // Address
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    full?: string;
  };

  // Branding
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  heroImage?: string;

  // Business details
  licenseNumber?: string;
  ownerName?: string;
  yearsInBusiness?: number;

  // Meta
  tenantId?: string;
  isLoading: boolean;
  isResolved: boolean;
}

export function useTenantConfig(): TenantCompanyConfig {
  const { tenant, profile, branding, isLoading } = useTenant();

  // If tenant is resolved, use dynamic data
  if (tenant && profile) {
    return {
      // Identity
      name: profile.business_name || companyConfig.name,
      shortName: profile.business_name || companyConfig.shortName,
      tagline: profile.tagline || companyConfig.tagline,
      description: profile.description || companyConfig.description,

      // Contact
      phone: profile.phone || companyConfig.phone,
      phoneRaw: profile.phone?.replace(/\D/g, '') || companyConfig.phoneRaw,
      email: profile.email || companyConfig.email,

      // Address
      address: {
        street: profile.address_line_1 || companyConfig.address.street,
        city: profile.city || companyConfig.address.city,
        state: profile.state || companyConfig.address.state,
        zip: profile.zip_code || companyConfig.address.zip,
        full: [
          profile.address_line_1,
          profile.city,
          profile.state,
          profile.zip_code,
        ].filter(Boolean).join(', ') || companyConfig.address.full,
      },

      // Branding
      logo: branding?.logo_url || companyConfig.logo,
      primaryColor: branding?.primary_color || undefined,
      secondaryColor: branding?.secondary_color || undefined,
      accentColor: branding?.accent_color || undefined,
      heroImage: branding?.hero_image_url || undefined,

      // Business details
      licenseNumber: profile.license_number || companyConfig.licenseNumber,
      ownerName: profile.owner_name || undefined,
      yearsInBusiness: profile.years_in_business || undefined,

      // Meta
      tenantId: tenant.id,
      isLoading,
      isResolved: true,
    };
  }

  // Fall back to static config
  return {
    name: companyConfig.name,
    shortName: companyConfig.shortName,
    tagline: companyConfig.tagline,
    description: companyConfig.description,
    phone: companyConfig.phone,
    phoneRaw: companyConfig.phoneRaw,
    email: companyConfig.email,
    address: companyConfig.address,
    logo: companyConfig.logo,
    licenseNumber: companyConfig.licenseNumber,
    isLoading,
    isResolved: false,
  };
}

/**
 * Apply tenant branding colors to CSS variables
 * Call this in a useEffect to dynamically update the theme
 */
export function applyTenantBranding(branding: TenantCompanyConfig): void {
  if (!branding.primaryColor) return;

  const root = document.documentElement;

  // Convert hex to HSL for CSS variables
  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  if (branding.primaryColor) {
    root.style.setProperty('--primary', hexToHsl(branding.primaryColor));
  }
  if (branding.secondaryColor) {
    root.style.setProperty('--secondary', hexToHsl(branding.secondaryColor));
  }
  if (branding.accentColor) {
    root.style.setProperty('--accent', hexToHsl(branding.accentColor));
  }
}
