# Mobile App Isolation Guide

## Overview
This guide explains the route-based isolation system implemented to protect the existing web application from mobile app development changes.

## Architecture

### 1. Route Isolation
- **Mobile Routes**: All mobile app routes are prefixed with `/mobile/*`
- **Web Routes**: All existing routes (`/`, `/admin/*`, `/projects/*`, etc.)
- **Strict Separation**: Mobile code only executes on mobile routes

### 2. Context Providers

#### MobileProvider (`src/contexts/MobileContext.tsx`)
- Provides mobile state throughout the app
- Detects mobile routes and PWA mode
- Offers guard functions for safe development

#### MobileAppGuard (`src/mobile/components/guards/MobileAppGuard.tsx`)
- Protects mobile routes from non-mobile access
- Optionally requires PWA mode for certain features

### 3. Development Safety

#### Guard Functions
```typescript
// Execute code only on mobile routes
const { executeIfMobile } = useMobileGuard();
executeIfMobile(() => {
  // Mobile-only code here
});

// Safe component rendering
const { renderForMobile, renderForWeb } = useMobileGuards();
```

#### Route Validation
```typescript
import { validateRouteIntegrity } from '@/utils/mobileIsolation';

// In development, check for route conflicts
validateRouteIntegrity();
```

## Usage Guidelines

### ✅ Safe Mobile Development
```typescript
// Use mobile context
const { isMobileRoute } = useMobileContext();

// Guard mobile features
if (isMobileRoute) {
  // Mobile-specific logic
}

// Use mobile-only components
<MobileOnly>
  <MobileSpecificComponent />
</MobileOnly>
```

### ❌ Avoid These Patterns
```typescript
// Don't modify shared components directly
// Instead, create mobile variants

// Don't use mobile hooks in web routes
// Use isolation guards instead

// Don't modify global state without guards
// Use context-aware state management
```

## Data Flow

### Admin ↔ Mobile Communication
- **Shared Database**: Both use same Supabase instance
- **Shared Types**: Common data models in `src/shared/types.ts`
- **Real-time Sync**: React Query ensures data consistency
- **Authentication**: Unified auth across both interfaces

### File Structure
```
src/
├── contexts/
│   └── MobileContext.tsx        # Mobile state management
├── mobile/                      # Mobile-only code
│   ├── components/
│   │   └── guards/              # Mobile route guards
│   ├── hooks/                   # Mobile-specific hooks
│   └── pages/                   # Mobile pages
├── shared/                      # Shared code (safe to modify)
│   └── types.ts                # Common data models
└── utils/
    └── mobileIsolation.ts      # Development safety utilities
```

## Development Workflow

### Adding Mobile Features
1. Create components in `src/mobile/` directory
2. Use `MobileProvider` for context
3. Apply guards for safety
4. Test route isolation

### Modifying Shared Code
1. Check if change affects web routes
2. Use conditional rendering if needed
3. Test both mobile and web interfaces
4. Use TypeScript for type safety

## Testing

### Route Isolation Tests
```typescript
// Verify mobile routes don't affect web
expect(mobileComponent).not.toRenderOn('/admin');

// Verify web routes don't break mobile
expect(webComponent).not.toRenderOn('/mobile/home');
```

### Development Checks
- Console warnings for cross-contamination
- TypeScript errors for unsafe patterns
- Runtime guards in development mode

## Best Practices

1. **Keep Routes Separate**: Never mix mobile and web route logic
2. **Use Guards**: Always guard mobile-specific code
3. **Test Isolation**: Verify changes don't affect other interfaces
4. **Document Changes**: Update this guide when adding features
5. **Monitor Console**: Watch for isolation warnings during development

## Emergency Rollback

If mobile development breaks web functionality:
1. Check console for isolation warnings
2. Disable mobile routes temporarily
3. Use git to revert mobile-specific changes
4. Test web functionality thoroughly

## Support

For questions about the isolation system:
- Check console warnings for guidance
- Review `useMobileGuards` hooks
- Examine existing mobile components for patterns
- Test changes on both interfaces before deployment