
# Plan: Always Show Clickable Settings Access in Project Header

## Problem
When a project doesn't have a `client_name` assigned, the clickable button that opens the Project Settings modal is completely hidden. This means users cannot access the settings to edit or delete the project when no client name exists.

## Solution
Modify the client name button in `ProjectHeader.tsx` to always be visible:
- When `client_name` exists: Show the client name (current behavior)
- When `client_name` is empty: Show a placeholder text like "Add Client Name" with a subtle visual indicator

This ensures users can always tap to access the Project Settings modal regardless of whether client info has been added.

## File to Modify

**`src/mobile/components/ProjectHeader.tsx`**

### Change at Lines 169-179

**Before:**
```tsx
{/* Client Name with House Icon */}
{project.client_name && (
  <button onClick={onClientClick} className="flex items-center space-x-2 mb-2 group">
    <Home className="w-4 h-4 text-primary" />
    <span className="text-sm text-primary font-medium group-hover:underline">
      {project.client_name}
    </span>
    <ChevronRight className="w-3 h-3 text-primary opacity-60 ..." />
  </button>
)}
```

**After:**
```tsx
{/* Client Name with House Icon - Always visible */}
<button onClick={onClientClick} className="flex items-center space-x-2 mb-2 group">
  <Home className="w-4 h-4 text-primary" />
  <span className={`text-sm font-medium group-hover:underline ${
    project.client_name ? 'text-primary' : 'text-muted-foreground italic'
  }`}>
    {project.client_name || 'Add Client Name'}
  </span>
  <ChevronRight className="w-3 h-3 text-primary opacity-60 ..." />
</button>
```

## Visual Result

**Before (no client name):**
```
┌──────────────────────────────┐
│ Project Name                 │
│ 📍 123 Main Street          │
│                              │  ← Nothing here, can't access settings
│ 💰 Payments            >    │
└──────────────────────────────┘
```

**After (no client name):**
```
┌──────────────────────────────┐
│ Project Name                 │
│ 📍 123 Main Street          │
│ 🏠 Add Client Name      >   │  ← Always visible, opens settings
│ 💰 Payments            >    │
└──────────────────────────────┘
```

## Technical Notes

- Removes the conditional `{project.client_name && (...)}` wrapper
- Adds conditional styling: normal primary color when name exists, muted italic when placeholder
- Uses fallback text: `{project.client_name || 'Add Client Name'}`
- The `onClientClick` handler already opens the Project Settings modal where users can add/edit client info or delete the project
