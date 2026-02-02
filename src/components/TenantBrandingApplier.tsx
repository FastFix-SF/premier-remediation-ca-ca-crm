/**
 * TenantBrandingApplier
 *
 * This component applies tenant branding (colors) to CSS variables
 * when the tenant context is loaded. Add this as a child of TenantProvider.
 */

import { useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';

// Convert hex color to HSL string for CSS variables
function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse RGB values
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  // Return as "H S% L%" format for CSS
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function TenantBrandingApplier({ children }: { children: React.ReactNode }) {
  const { branding, tenant, isLoading } = useTenant();

  useEffect(() => {
    if (isLoading || !tenant) return;

    const root = document.documentElement;

    // Apply branding colors if available
    if (branding?.primary_color) {
      root.style.setProperty('--primary', hexToHsl(branding.primary_color));
      root.style.setProperty('--primary-hover', hexToHsl(branding.primary_color));
      console.log('[TenantBranding] Applied primary color:', branding.primary_color);
    }

    if (branding?.secondary_color) {
      root.style.setProperty('--secondary', hexToHsl(branding.secondary_color));
      console.log('[TenantBranding] Applied secondary color:', branding.secondary_color);
    }

    if (branding?.accent_color) {
      root.style.setProperty('--accent', hexToHsl(branding.accent_color));
      console.log('[TenantBranding] Applied accent color:', branding.accent_color);
    }

    // Update page title with tenant name
    if (tenant.name) {
      document.title = `${tenant.name} - CRM`;
    }

    // Update favicon if available
    if (branding?.favicon_url) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = branding.favicon_url;
      }
    }

  }, [branding, tenant, isLoading]);

  return <>{children}</>;
}
