# Fasto Sync Guide

> How to keep Fasto updated when you make changes to the app.

## When to Update Fasto

Update Fasto's configuration whenever you:

1. **Change data formats** (time from 24h→12h, date formats, currencies)
2. **Add new features/modules** (new entity types, new actions)
3. **Rename fields or entities** (database columns, UI labels)
4. **Change validation rules** (required fields, allowed values)
5. **Modify status values** (lead stages, project statuses)
6. **Add new navigation routes** (pages, tabs)

---

## Update Checklist

When making changes that affect Fasto:

### Step 1: Update Capabilities Reference
- [ ] Edit `src/components/fasto/FASTO_CAPABILITIES.md`
- [ ] Update the "Last Updated" date
- [ ] Add entry to the Changelog section

### Step 2: Update Action Handlers
- [ ] Modify relevant `useFasto*Actions.ts` file
- [ ] Add format conversion if data formats changed
- [ ] Update validation logic if rules changed

### Step 3: Update UI Attributes (if needed)
- [ ] Add/update `data-fasto-action` on buttons
- [ ] Add/update `data-fasto-field` on form inputs
- [ ] Add/update `data-fasto-dialog` on dialogs

### Step 4: Update AI Agent Prompt (if using ElevenLabs/OpenAI)
- [ ] Go to your AI agent configuration
- [ ] Update the system prompt with new capabilities
- [ ] Test voice commands for affected features

---

## File Locations

| Purpose | File Path |
|---------|-----------|
| Capabilities Reference | `src/components/fasto/FASTO_CAPABILITIES.md` |
| Schedule Actions | `src/components/fasto/useFastoScheduleActions.ts` |
| Action Types & Context | `src/components/fasto/fastoActionApi.ts` |
| Visual Automation | `src/components/fasto/FastoVisualAutomation.ts` |
| Data Refresh | `src/hooks/useFastoDataRefresh.ts` |

---

## Format Conversion Utilities

When you change data formats, add conversion utilities to normalize both old and new formats:

### Time Format (24h ↔ 12h)

```typescript
// In useFastoScheduleActions.ts

function convertTo12Hour(time24: string): string {
  // Handle already-converted times
  if (time24.includes('AM') || time24.includes('PM')) {
    return time24;
  }
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function normalizeTimeFormat(time: string): string {
  if (!time) return '';
  // If already 12-hour format, return as-is
  if (time.includes('AM') || time.includes('PM')) {
    return time;
  }
  // Convert 24-hour to 12-hour
  return convertTo12Hour(time);
}
```

---

## AI Agent Prompt Template

If you're using ElevenLabs or another AI voice provider, include this in your system prompt:

```
You are Fasto, a voice assistant for a roofing contractor management app.

## Available Actions

### Scheduling
- Create shifts: Specify employee, project, date, start time, end time
- Times use 12-hour AM/PM format (e.g., "9 AM", "5:30 PM")

### Leads
- Create leads, update status, add notes, assign to team members
- Statuses: new, contacted, qualified, proposal, won, lost

### Projects
- View and update project details
- Statuses: pending, in_progress, on_hold, completed, cancelled

### Navigation
- Navigate to: schedule, leads, projects, invoices, reports
- Open specific tabs within pages

## Important Notes
- When user says a time without AM/PM, infer based on context
  (work hours are typically 6 AM - 8 PM)
- Confirm important actions before executing
- Use context from previous commands when available
```

---

## Testing Voice Commands

After making changes, test these voice commands:

### Scheduling
- "Schedule a shift for tomorrow from 9 AM to 5 PM"
- "Create a shift at 2 PM"
- "Update the shift to end at 6:30 PM"

### Navigation
- "Go to the schedule"
- "Open the leads page"
- "Show me invoices"

### Context
- "Show me the Johnson project" → "Create an invoice for it"
- "Schedule John for tomorrow" → "Change it to Friday"

---

## Troubleshooting

### Common Issues

**Problem:** Fasto sends wrong time format
**Solution:** Check `normalizeTimeFormat()` is called on all time inputs

**Problem:** New action not recognized
**Solution:** 
1. Verify action type added to `FASTO_ACTIONS` constant
2. Add handler in appropriate `useFasto*Actions` hook
3. Update AI agent prompt if using external AI

**Problem:** UI automation fails
**Solution:**
1. Check `data-fasto-*` attributes are present
2. Verify selectors in `FastoVisualAutomation.ts`
3. Check timing with `waitForElement()` delays

---

## Why Can't Fasto Auto-Update?

The AI agent (ElevenLabs, OpenAI, etc.) runs on external servers with a fixed configuration. It cannot automatically read your codebase. The best approach is:

1. **Automatic format conversion** - Handle multiple formats in handlers
2. **Centralized documentation** - Single source of truth in `FASTO_CAPABILITIES.md`
3. **Sync checklist** - Reminder of what to update

For a more automated approach, you could:
- Build a script that generates the AI prompt from `FASTO_CAPABILITIES.md`
- Create an admin UI to update the AI agent configuration
- Use a webhook to push updates (requires AI provider support)
