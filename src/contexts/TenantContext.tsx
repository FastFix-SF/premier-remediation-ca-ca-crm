import React, { createContext, useContext, useMemo } from 'react';
import { useBusiness } from '../hooks/useBusinessConfig';

/**
 * Simplified TenantContext for tenant CRMs
 *
 * This version loads tenant data from local JSON config files (business.json)
 * instead of querying the multi-tenant Supabase database.
 *
 * Tenant CRMs are standalone apps that don't need to query the MT database.
 */

// Types for tenant data (simplified)
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface TenantProfile {
  business_id: string;
  business_name: string;
  tagline?: string;
  description?: string;
  phone?: string;
  email?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface TenantBranding {
  business_id: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}

export interface TenantContextValue {
  // Core tenant state
  tenant: Tenant | null;
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;

  // Tenant configuration
  profile: TenantProfile | null;
  branding: TenantBranding | null;
  whitelabel: null;
  subscription: null;

  // Feature flags (all enabled for standalone tenant CRMs)
  features: Record<string, boolean>;
  isFeatureEnabled: (featureSlug: string) => boolean;

  // Tenant-aware Supabase client helper
  getTenantHeader: () => Record<string, string>;

  // Tenant switching (not applicable for single-tenant CRMs)
  availableTenants: Tenant[];
  switchTenant: (tenantId: string) => Promise<void>;

  // Refresh functions
  refreshTenant: () => Promise<void>;
  refreshFeatures: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Helper hook for checking if tenant is ready
export const useTenantReady = () => {
  const { tenant, isLoading } = useTenant();
  return !isLoading && tenant !== null;
};

// Helper hook for feature flags
export const useFeature = (featureSlug: string) => {
  const { isFeatureEnabled } = useTenant();
  return isFeatureEnabled(featureSlug);
};

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  // Load business data from local JSON config
  const business = useBusiness();

  // Generate a tenant-like ID from the business name
  const tenantId = useMemo(() => {
    if (!business?.name) return null;
    return business.name.toLowerCase().replace(/\s+/g, '-');
  }, [business?.name]);

  // Build tenant object from local config
  const tenant: Tenant | null = useMemo(() => {
    if (!business?.name) return null;
    return {
      id: tenantId || 'local-tenant',
      name: business.name,
      slug: tenantId || 'local-tenant',
      created_at: new Date().toISOString(),
    };
  }, [business?.name, tenantId]);

  // Build profile from local config
  const profile: TenantProfile | null = useMemo(() => {
    if (!business) return null;
    return {
      business_id: tenantId || 'local-tenant',
      business_name: business.name,
      tagline: business.tagline,
      description: business.description,
      phone: business.phone,
      email: business.email,
      address_line_1: business.address?.street,
      city: business.address?.city,
      state: business.address?.state,
      zip_code: business.address?.zip,
    };
  }, [business, tenantId]);

  // Build branding from local config
  const branding: TenantBranding | null = useMemo(() => {
    if (!business) return null;
    return {
      business_id: tenantId || 'local-tenant',
      logo_url: business.logo,
      logo_dark_url: (business as any).logoDark,
      favicon_url: (business as any).favicon,
      primary_color: business.colors?.primary,
      secondary_color: business.colors?.secondary,
      accent_color: business.colors?.accent,
    };
  }, [business, tenantId]);

  // All features enabled for standalone tenant CRMs
  const isFeatureEnabled = (featureSlug: string): boolean => true;

  // No-op functions for compatibility
  const getTenantHeader = (): Record<string, string> => {
    if (!tenantId) return {};
    return { 'x-tenant-id': tenantId };
  };

  const switchTenant = async (_tenantId: string): Promise<void> => {
    console.warn('Tenant switching not available in standalone CRM mode');
  };

  const refreshTenant = async (): Promise<void> => {
    // No-op - data comes from static JSON files
  };

  const refreshFeatures = async (): Promise<void> => {
    // No-op - all features enabled
  };

  // Memoize context value
  const value = useMemo<TenantContextValue>(() => ({
    tenant,
    tenantId,
    isLoading: false,
    error: null,
    profile,
    branding,
    whitelabel: null,
    subscription: null,
    features: {},
    isFeatureEnabled,
    getTenantHeader,
    availableTenants: tenant ? [tenant] : [],
    switchTenant,
    refreshTenant,
    refreshFeatures,
  }), [tenant, tenantId, profile, branding]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
