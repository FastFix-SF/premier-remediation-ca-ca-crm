/**
 * ThemeProvider Component
 * 
 * Applies dynamic theme colors from business.json config to CSS custom properties.
 * This enables tenant-specific branding colors to be applied at runtime.
 */

import { useEffect } from 'react';
import { useBusiness } from '@/hooks/useBusinessConfig';

/**
 * Converts a hex color to HSL format string for CSS custom properties.
 * Returns format: "H S% L%" (e.g., "205 50% 21%")
 */
function hexToHSL(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');
  
  // Parse hex values
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
  if (!result) {
    console.warn(`Invalid hex color: ${hex}, using fallback`);
    return "0 0% 0%";
  }

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const business = useBusiness();

  useEffect(() => {
    if (business?.colors) {
      const root = document.documentElement;
      
      // Apply primary color
      if (business.colors.primary) {
        const primaryHSL = hexToHSL(business.colors.primary);
        root.style.setProperty('--primary', primaryHSL);
        // Also set primary-foreground for contrast
        root.style.setProperty('--primary-foreground', '0 0% 100%');
      }
      
      // Apply secondary color
      if (business.colors.secondary) {
        const secondaryHSL = hexToHSL(business.colors.secondary);
        root.style.setProperty('--secondary', secondaryHSL);
      }
      
      // Apply accent color
      if (business.colors.accent) {
        const accentHSL = hexToHSL(business.colors.accent);
        root.style.setProperty('--accent', accentHSL);
      }
      
      console.log('[ThemeProvider] Applied tenant colors:', {
        primary: business.colors.primary,
        secondary: business.colors.secondary,
        accent: business.colors.accent,
      });
    }
  }, [business?.colors]);

  return <>{children}</>;
}

export default ThemeProvider;
