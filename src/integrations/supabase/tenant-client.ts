import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Multi-tenant project URL and key from environment
const MULTI_TENANT_URL = import.meta.env.VITE_SUPABASE_TENANT_URL || "";
const MULTI_TENANT_KEY = import.meta.env.VITE_SUPABASE_TENANT_KEY || "";

// Create a tenant-aware Supabase client
export function createTenantClient(tenantId: string | null): SupabaseClient<Database> {
  const headers: Record<string, string> = {};

  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  return createClient<Database>(MULTI_TENANT_URL, MULTI_TENANT_KEY, {
    global: {
      headers,
    },
  });
}

// Default client for multi-tenant operations (without specific tenant context)
export const multiTenantSupabase = createClient<Database>(MULTI_TENANT_URL, MULTI_TENANT_KEY);

// Helper to call tenant-scoped RPC functions
export async function callTenantRpc<T = any>(
  tenantId: string,
  functionName: string,
  params: Record<string, any> = {}
): Promise<{ data: T | null; error: any }> {
  const client = createTenantClient(tenantId);
  const { data, error } = await client.rpc(functionName as any, params);
  return { data: data as T, error };
}

// Helper to execute a raw query against tenant schema
export async function executeTenantQuery<T = any>(
  tenantId: string,
  query: string
): Promise<{ data: T | null; error: any }> {
  const client = createTenantClient(tenantId);
  const { data, error } = await client.rpc('execute_tenant_query', {
    p_tenant_id: tenantId,
    p_query: query,
  });
  return { data: data as T, error };
}

// List tenants function for system managers
export async function listTenants(options?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: any[] | null; error: any }> {
  const { data, error } = await multiTenantSupabase.rpc('list_tenants', {
    p_search: options?.search || null,
    p_status: options?.status || null,
    p_limit: options?.limit || 50,
    p_offset: options?.offset || 0,
  });
  return { data, error };
}

// Get full tenant configuration
export async function getTenantConfig(tenantId: string): Promise<{ data: any | null; error: any }> {
  const { data, error } = await multiTenantSupabase.rpc('get_tenant_config', {
    p_tenant_id: tenantId,
  });
  return { data, error };
}

// Create a new tenant
export async function createTenant(options: {
  tenantName: string;
  adminEmail: string;
  slug?: string;
  planSlug?: string;
}): Promise<{ data: any | null; error: any }> {
  const { data, error } = await multiTenantSupabase.rpc('create_tenant', {
    p_tenant_name: options.tenantName,
    p_admin_email: options.adminEmail,
    p_slug: options.slug || null,
    p_plan_slug: options.planSlug || 'starter',
  });
  return { data, error };
}

// Update tenant subscription
export async function updateTenantSubscription(
  tenantId: string,
  planSlug: string,
  billingCycle: 'monthly' | 'yearly' = 'monthly'
): Promise<{ data: any | null; error: any }> {
  const { data, error } = await multiTenantSupabase.rpc('update_tenant_subscription', {
    p_tenant_id: tenantId,
    p_plan_slug: planSlug,
    p_billing_cycle: billingCycle,
  });
  return { data, error };
}

// Toggle edge function for tenant
export async function toggleTenantEdgeFunction(
  tenantId: string,
  functionSlug: string,
  enabled: boolean
): Promise<{ data: any | null; error: any }> {
  const { data, error } = await multiTenantSupabase.rpc('toggle_tenant_edge_function', {
    p_tenant_id: tenantId,
    p_function_slug: functionSlug,
    p_enabled: enabled,
  });
  return { data, error };
}

// Bulk toggle edge functions by category
export async function bulkToggleEdgeFunctions(
  tenantId: string,
  category: string,
  enabled: boolean
): Promise<{ data: any | null; error: any }> {
  const { data, error } = await multiTenantSupabase.rpc('bulk_toggle_edge_functions', {
    p_tenant_id: tenantId,
    p_category: category,
    p_enabled: enabled,
  });
  return { data, error };
}

// Update onboarding progress
export async function updateOnboardingProgress(
  tenantId: string,
  step: string,
  completed: boolean = true
): Promise<{ data: any | null; error: any }> {
  const { data, error } = await multiTenantSupabase.rpc('update_onboarding_progress', {
    p_tenant_id: tenantId,
    p_step: step,
    p_completed: completed,
  });
  return { data, error };
}
