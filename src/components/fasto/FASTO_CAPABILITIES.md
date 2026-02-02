# Fasto Voice Assistant - Capabilities Reference

> **Last Updated:** 2025-01-18
> 
> This file documents all Fasto capabilities and expected data formats.
> Update this file whenever you make changes that affect voice commands.

## Data Formats

### Time Formats
- **Shifts/Scheduling**: Uses **12-hour AM/PM format**
  - ✅ Correct: "9:00 AM", "2:30 PM", "10:00 PM"
  - ❌ Wrong: "09:00", "14:30", "22:00" (24-hour format)
- Fasto automatically converts 24-hour to 12-hour format

### Date Formats
- Accepts: "January 15, 2025", "2025-01-15", "tomorrow", "next Monday"
- Returns: ISO format (YYYY-MM-DD) for database operations

### Currency
- Format: USD with 2 decimal places (e.g., "$1,250.00")

---

## Supported Actions

### 📅 Scheduling (`useFastoScheduleActions.ts`)

| Action | Voice Command Examples | Parameters |
|--------|------------------------|------------|
| Create Shift | "Schedule John for tomorrow 9 AM to 5 PM" | employee, project, date, startTime (12h), endTime (12h) |
| Update Shift | "Change the shift to start at 10 AM" | shiftId, partial data |
| Delete Shift | "Cancel tomorrow's shift" | shiftId |

### 👥 Leads (`useFastoLeadActions.ts` - if exists)

| Action | Voice Command Examples | Parameters |
|--------|------------------------|------------|
| Create Lead | "Add a new lead John Smith" | name, email, phone, address |
| Update Status | "Mark the lead as qualified" | leadId, status |
| Add Note | "Add a note: customer interested in solar" | leadId, note |
| Assign | "Assign this lead to Sarah" | leadId, assigneeId |

### 📋 Projects

| Action | Voice Command Examples | Parameters |
|--------|------------------------|------------|
| View Project | "Show me the Oak Street project" | projectId or name |
| Update Status | "Mark project as in progress" | projectId, status |

### 💰 Invoices

| Action | Voice Command Examples | Parameters |
|--------|------------------------|------------|
| Create Invoice | "Create an invoice for $5,000" | projectId, amount, items |
| Send Invoice | "Send the invoice to the client" | invoiceId |

### 📝 Work Orders

| Action | Voice Command Examples | Parameters |
|--------|------------------------|------------|
| Create Work Order | "Create a work order for roof repair" | projectId, description, assignee |
| Complete Work Order | "Mark the work order as complete" | workOrderId |

### 🧭 Navigation

| Action | Voice Command Examples | Parameters |
|--------|------------------------|------------|
| Navigate | "Go to the schedule page" | page/route |
| Open Tab | "Open the financials tab" | tabName |

---

## Status Values

### Lead Statuses
- `new`, `contacted`, `qualified`, `proposal`, `won`, `lost`

### Project Statuses  
- `pending`, `in_progress`, `on_hold`, `completed`, `cancelled`

### Invoice Statuses
- `draft`, `sent`, `paid`, `overdue`, `cancelled`

### Shift/Schedule Statuses
- `scheduled`, `in_progress`, `completed`, `cancelled`

---

## Context Management

Fasto maintains context via `FastoContext` (session storage):
- Last active lead, project, invoice, shift IDs
- Current tab/subtab for navigation
- Conversation history for follow-up commands

Example flow:
1. "Show me the Johnson project" → Sets lastProjectId
2. "Create an invoice for it" → Uses lastProjectId automatically

---

## Integration Points

### UI Automation
Fasto uses `data-fasto-*` attributes to interact with UI:
- `data-fasto-action="shift-create"` - Clickable actions
- `data-fasto-field="shift-date"` - Form fields to fill
- `data-fasto-dialog="shift-dialog"` - Dialogs to wait for

### Data Refresh
After mutations, Fasto dispatches `fasto-data-refresh` events to invalidate React Query caches.

---

## Changelog

| Date | Change |
|------|--------|
| 2025-01-18 | Changed shift times from 24h to 12h AM/PM format |
| 2025-01-18 | Created this capabilities document |
