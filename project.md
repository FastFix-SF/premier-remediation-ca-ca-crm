# FastFix Multi-Tenant CRM - Project Documentation

## Production Stack - URLs & IDs

### Lovable (Frontend Hosting)

| Property | Value |
|----------|-------|
| **Project ID** | `e48134d4-1e37-4df9-b2e9-373e5ead16c5` |
| **Project URL** | https://lovable.dev/projects/e48134d4-1e37-4df9-b2e9-373e5ead16c5 |
| **Deployment URL** | https://e48134d4-1e37-4df9-b2e9-373e5ead16c5.lovableproject.com |
| **Deploy Method** | Share → Publish in Lovable UI |

### Supabase - Main Instance (CRM Data)

| Property | Value |
|----------|-------|
| **Project ID** | `mnitzgoythqqevhtkitj` |
| **API URL** | https://mnitzgoythqqevhtkitj.supabase.co |
| **Dashboard** | https://supabase.com/dashboard/project/mnitzgoythqqevhtkitj |
| **Edge Functions** | https://mnitzgoythqqevhtkitj.supabase.co/functions/v1 |
| **Storage** | https://mnitzgoythqqevhtkitj.supabase.co/storage/v1 |
| **Purpose** | CRM data: leads, projects, quotes, invoices, 270+ tables, 85 functions |

### Supabase - Multi-Tenant Instance (Shared)

| Property | Value |
|----------|-------|
| **Project ID** | `ktomefyeqmoxdinycowu` |
| **API URL** | https://ktomefyeqmoxdinycowu.supabase.co |
| **Dashboard** | https://supabase.com/dashboard/project/ktomefyeqmoxdinycowu |
| **Purpose** | Tenant management, subscriptions, feature flags |
| **Shared With** | `fastfixai` (same database) |

### Mobile App (Capacitor)

| Property | Value |
|----------|-------|
| **App ID** | `com.roofingfriend.app` |
| **App Name** | Roofing Friend |
| **Web Directory** | `dist` |
| **Platforms** | iOS, Android |

### Quick Links

```
Lovable Dashboard:  https://lovable.dev/projects/e48134d4-1e37-4df9-b2e9-373e5ead16c5
Main Supabase:      https://supabase.com/dashboard/project/mnitzgoythqqevhtkitj
MT Supabase:        https://supabase.com/dashboard/project/ktomefyeqmoxdinycowu
Edge Functions:     https://supabase.com/dashboard/project/mnitzgoythqqevhtkitj/functions
Deployed App:       https://e48134d4-1e37-4df9-b2e9-373e5ead16c5.lovableproject.com
```

---

## Production Deployment Architecture

### Hosting Platforms

| Platform | Purpose | Status |
|----------|---------|--------|
| **Lovable** | Primary deployment | Active |
| **Vercel** | Alternative/Secondary | Configured |
| **Capacitor** | Mobile native (iOS/Android) | Configured |

#### Lovable
- **Project ID:** `e48134d4-1e37-4df9-b2e9-373e5ead16c5`
- **Project URL:** https://lovable.dev/projects/e48134d4-1e37-4df9-b2e9-373e5ead16c5
- **Deployment URL:** https://e48134d4-1e37-4df9-b2e9-373e5ead16c5.lovableproject.com
- **Deploy method:** "Share -> Publish" in Lovable UI

#### Vercel
- Configuration in `vercel.json`
- SPA rewrite rules for client-side routing

#### Capacitor (Mobile)
- **App ID:** `com.roofingfriend.app`
- **App Name:** Roofing Friend
- **Web Directory:** `dist`

---

## Database: Supabase

### Why Two Supabase Projects?

This project uses a **multi-tenant SaaS architecture** with two separate Supabase instances:

| Project | ID | Purpose |
|---------|-----|---------|
| **Main App** | `mnitzgoythqqevhtkitj` | Primary application database |
| **Multi-Tenant** | `ktomefyeqmoxdinycowu` | Tenant isolation & management |

#### Main Project (`client.ts`)
- Single Supabase client for the core application
- Contains all business logic: leads, projects, quotes, invoices, employees, photos, AI analysis
- Houses 270+ tables and 85 Edge Functions

#### Multi-Tenant Project (`tenant-client.ts`)
- Implements tenant isolation via `x-tenant-id` header injection
- Provides tenant management functions:
  - `createTenantClient(tenantId)` - Creates scoped client per tenant
  - `listTenants()` - List all tenants (system managers only)
  - `createTenant()` - Onboard new tenants
  - `updateTenantSubscription()` - Manage subscription plans
  - `toggleTenantEdgeFunction()` - Per-tenant feature flags

#### Architecture Benefits
1. **Data Isolation** - Each tenant's data is logically separated using RLS policies and header-based routing
2. **Scalability** - Allows multiple roofing companies to use the same CRM with isolated data
3. **Security** - Tenant-scoped access prevents cross-tenant data leakage
4. **Flexibility** - Per-tenant feature toggles and subscription management

---

## CRM's Role in Multi-Tenant Architecture

### This Project's Perspective: TENANT ADMINISTRATOR

The CRM is the **tenant management and operations platform**. It controls tenant lifecycle, subscriptions, and feature access.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CRM PERSPECTIVE                                  │
│           "We MANAGE and CONTROL tenant operations"                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   CRM Admin Panel (System Managers)                                 │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  • Create new tenants                                       │  │
│   │  • Manage subscriptions (starter, pro, enterprise)          │  │
│   │  • Toggle edge functions per tenant                         │  │
│   │  • Track onboarding progress                                │  │
│   │  • View tenant configurations                               │  │
│   │  • Bulk enable/disable features by category                 │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │           MULTI-TENANT SUPABASE (ktomefyeqmoxdinycowu)      │  │
│   │                                                             │  │
│   │   RPC Functions CRM CALLS:                                  │  │
│   │   ├── list_tenants()              (view all tenants)        │  │
│   │   ├── create_tenant()             (onboard new client)      │  │
│   │   ├── get_tenant_config()         (fetch tenant settings)   │  │
│   │   ├── update_tenant_subscription() (change plan)            │  │
│   │   ├── toggle_tenant_edge_function() (feature flags)         │  │
│   │   ├── bulk_toggle_edge_functions() (batch feature toggle)   │  │
│   │   ├── update_onboarding_progress() (track setup)            │  │
│   │   └── execute_tenant_query()      (custom queries)          │  │
│   │                                                             │  │
│   │   Operations: RPC calls (stored procedures)                 │  │
│   │   Access pattern: Administrative/System-level operations    │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │          ROOFING COMPANY CRM USERS                          │  │
│   │   • Company A staff → sees only Company A data              │  │
│   │   • Company B staff → sees only Company B data              │  │
│   │   • Isolated via x-tenant-id header                         │  │
│   └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Quantified Usage

| Metric | Value |
|--------|-------|
| **RPC functions called** | 8 |
| **Client file** | `/src/integrations/supabase/tenant-client.ts` |
| **Files using MT client** | 7 |
| **UI components** | `TenantListPage`, `TenantDetailPage`, `TenantOnboardingWizard`, `FeatureFlagsForm` |
| **Context provider** | `TenantContext.tsx` |

### RPC Functions Used

| Function | Purpose | Called From |
|----------|---------|-------------|
| `list_tenants()` | Paginated tenant list with search/filter | `TenantListPage` |
| `create_tenant()` | Onboard new roofing company | `TenantOnboardingWizard` |
| `get_tenant_config()` | Fetch full tenant configuration | `TenantDetailPage` |
| `update_tenant_subscription()` | Change billing plan | `TenantDetailPage` |
| `toggle_tenant_edge_function()` | Enable/disable specific feature | `FeatureFlagsForm` |
| `bulk_toggle_edge_functions()` | Batch toggle by category | `FeatureFlagsForm` |
| `update_onboarding_progress()` | Track setup completion | `TenantOnboardingWizard` |
| `execute_tenant_query()` | Custom tenant-scoped queries | Various |

### Why CRM Uses This Shared Database

| Reason | Justification |
|--------|---------------|
| **Unified tenant registry** | One place to manage all tenants across products |
| **Subscription control** | CRM controls which features each tenant can access |
| **Feature flags** | Per-tenant edge function toggles affect both CRM and websites |
| **Onboarding coordination** | CRM tracks setup, FastFix.ai publishes content |

### Data Flow

```
CRM Admin ──RPC──▶ tenants table ◀──RPC── Feature checks
                  subscriptions
                  tenant_edge_functions
                  onboarding_progress
```

### Relationship to FastFix.ai

| This Project (CRM) | Sister Project (FastFix.ai) |
|--------------------|------------------------------|
| **Role**: Tenant administrator | **Role**: Content publisher |
| **Writes**: Tenant lifecycle, subscriptions, feature flags | **Writes**: Business content (profiles, branding, services) |
| **Users**: System managers, roofing company staff | **Users**: FastFix.ai admins deploying client sites |
| **RPCs**: `create_tenant`, `update_subscription`, etc. | **Tables**: `mt_business_*` |

### Why Both Projects Share This Database

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SHARED MULTI-TENANT SUPABASE                      │
│                     (ktomefyeqmoxdinycowu)                          │
├──────────────────────────────┬──────────────────────────────────────┤
│         FastFix.ai           │              CRM                     │
│      (Content Layer)         │       (Operations Layer)             │
├──────────────────────────────┼──────────────────────────────────────┤
│  mt_business_profiles        │  tenants                             │
│  mt_business_branding        │  subscriptions                       │
│  mt_business_services        │  tenant_edge_functions               │
│  mt_business_service_areas   │  onboarding_progress                 │
│  mt_business_faqs            │  tenant_settings                     │
├──────────────────────────────┴──────────────────────────────────────┤
│                         SHARED                                      │
│  Both reference same tenant_id / business_id                        │
│  Content + Operations = Complete tenant management                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Justification for sharing:**
1. **Same tenant identity** - `tenant_id` in CRM = `business_id` in FastFix.ai
2. **Feature flags affect both** - Toggling "SMS" in CRM disables it on website too
3. **Subscription controls access** - CRM subscription tier limits FastFix.ai features
4. **Single billing relationship** - One Supabase project = one invoice
5. **No sync complexity** - Avoids cross-database replication and consistency issues

---

## Database Statistics

- **Tables:** 270+
- **Edge Functions:** 85
- **Migrations:** 324
- **RLS Policies:** Comprehensive coverage

### Key Supabase Resources

| Path | Description |
|------|-------------|
| `/supabase/functions/` | 85 Edge Functions (AI, integrations, business logic) |
| `/supabase/migrations/` | 324 SQL migration files |
| `/supabase/config.toml` | Local development configuration |
| `/src/integrations/supabase/client.ts` | Main Supabase client |
| `/src/integrations/supabase/tenant-client.ts` | Multi-tenant client |
| `/src/integrations/supabase/types.ts` | Auto-generated TypeScript types |

---

## Environment Variables

### Required Variables

```env
VITE_SUPABASE_PROJECT_ID      # Main Supabase project ID
VITE_SUPABASE_PUBLISHABLE_KEY # Supabase anon/public key
VITE_SUPABASE_URL             # Supabase API URL
VITE_FUNCTIONS_BASE           # Edge Functions base URL
```

### Feature Flags

```env
VITE_ENABLE_MAPLIBRE="0"      # MapLibre GL rendering (0=disabled, 1=enabled)
VITE_PROFIT_V2="1"            # Profit view v2 (0=disabled, 1=enabled)
```

### Additional Variables (Optional)

```env
VITE_SUPABASE_ANON_KEY        # Mobile auth key
VITE_TURN_URL                 # WebRTC TURN server URL
VITE_TURN_USERNAME            # WebRTC credentials
VITE_TURN_CREDENTIAL          # WebRTC password
```

---

## Tech Stack

### Frontend
- **Build Tool:** Vite + SWC
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn-ui + Radix UI
- **State Management:** TanStack Query
- **Animations:** Framer Motion

### Maps & Geolocation
- Mapbox GL
- MapLibre GL
- Leaflet
- Turf.js

### Mobile
- Capacitor 7.4.4
- Push Notifications
- Geolocation
- Status Bar management

### Integrations
- Stripe (payments)
- CompanyCam (photo management)
- Google Maps API
- Nearmap (aerial imagery)
- DocuSign
- Bland AI (voice)

---

## Build Scripts

```bash
npm run dev        # Start dev server (port 8080)
npm run build      # Production build
npm run build:dev  # Development build
npm run lint       # ESLint validation
npm run preview    # Preview production build
```

---

## Project Structure

```
/src
├── /api                 # API integration layer
├── /components          # React components
├── /config              # Business rules, services config
├── /contexts            # React contexts (Auth, Tenant, etc.)
├── /hooks               # Custom React hooks
├── /integrations        # External service integrations
│   └── /supabase        # Supabase clients & types
├── /mobile              # Mobile-specific components
├── /pages               # Desktop page components
└── /utils               # Helper functions

/supabase
├── /functions           # 85 Edge Functions
├── /migrations          # 324 SQL migrations
└── config.toml          # Supabase configuration
```
