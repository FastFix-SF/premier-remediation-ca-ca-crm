export type AdminNavMatch = {
  url: string;
  label: string;
  mainTab?: string;
  subtab?: string;
};

type Entry = {
  label: string;
  url: string;
  synonyms: string[];
};

const ENTRIES: Entry[] = [
  // ===== SALES =====
  { label: 'Leads', url: '/admin?tab=sales&subtab=leads', synonyms: ['leads', 'lead', 'sales leads', 'pipeline', 'crm', 'customers', 'prospects', 'potential customers'] },
  { label: 'Quotes', url: '/admin?tab=sales&subtab=quotes', synonyms: ['quotes', 'quote', 'quote requests', 'pricing', 'price quote', 'quotations', 'bids'] },
  { label: 'Proposals', url: '/admin?tab=sales&subtab=proposals', synonyms: ['proposals', 'proposal', 'sales proposal', 'project proposal', 'bid proposal'] },
  { label: 'Contracts', url: '/admin?tab=sales&subtab=contracts', synonyms: ['contracts', 'contract', 'agreements', 'agreement', 'signed contracts', 'customer contracts'] },

  // ===== PROJECT MANAGEMENT =====
  { label: 'Projects', url: '/admin?tab=project-management&subtab=projects', synonyms: ['projects', 'project list', 'project management', 'project-management', 'active projects', 'job list', 'jobs'] },
  { label: 'Daily Logs', url: '/admin?tab=project-management&subtab=daily-logs', synonyms: ['daily logs', 'daily log', 'logs', 'dailylogs', 'field logs', 'site logs', 'daily reports', 'day logs'] },
  { label: 'Schedule', url: '/admin?tab=project-management&subtab=schedule', synonyms: ['schedule', 'project schedule', 'calendar', 'scheduling', 'job schedule', 'work schedule', 'appointments'] },
  { label: 'To-Dos', url: '/admin?tab=project-management&subtab=todos', synonyms: ['todos', 'to-dos', 'to dos', 'to do', 'todo', 'task list', 'checklist', 'action items'] },
  { label: 'Work Orders', url: '/admin?tab=project-management&subtab=work-orders', synonyms: ['work orders', 'work order', 'workorders', 'wo', 'work tickets', 'job orders'] },
  { label: 'Inspections', url: '/admin?tab=project-management&subtab=inspections', synonyms: ['inspections', 'inspection', 'inspect', 'building inspection', 'code inspection', 'final inspection'] },
  { label: 'Punchlists', url: '/admin?tab=project-management&subtab=punchlists', synonyms: ['punchlists', 'punch list', 'punch lists', 'punchlist', 'snag list', 'deficiency list', 'corrections'] },
  { label: 'Service Tickets', url: '/admin?tab=project-management&subtab=service-tickets', synonyms: ['service tickets', 'service ticket', 'servicetickets', 'warranty', 'repair ticket', 'service call', 'maintenance request'] },
  { label: 'Permits', url: '/admin?tab=project-management&subtab=permits', synonyms: ['permits', 'permit', 'building permit', 'construction permit', 'permit applications', 'permitting'] },

  // ===== WORKFORCE =====
  { label: 'Workforce Summary', url: '/admin?tab=workforce&subtab=summary', synonyms: ['workforce summary', 'summary', 'workforce overview', 'team overview', 'staff summary', 'employee summary'] },
  { label: 'Directory', url: '/admin?tab=workforce&subtab=directory', synonyms: ['directory', 'team directory', 'employee directory', 'staff directory', 'contacts', 'contact list', 'people', 'team members'] },
  { label: 'Opportunities', url: '/admin?tab=workforce&subtab=opportunities', synonyms: ['opportunities', 'opportunity', 'job opportunities', 'openings', 'positions'] },
  { label: 'Timesheets', url: '/admin?tab=workforce&subtab=timesheets', synonyms: ['timesheets', 'timesheet', 'time sheets', 'time tracking', 'hours', 'time cards', 'time clock', 'punch clock', 'attendance'] },
  { label: 'Scheduling', url: '/admin?tab=workforce&subtab=scheduling', synonyms: ['scheduling', 'schedule workforce', 'crew scheduling', 'staff scheduling', 'employee scheduling', 'shift scheduling', 'dispatch'] },
  { label: 'Tasks', url: '/admin?tab=workforce&subtab=tasks', synonyms: ['tasks', 'task', 'employee tasks', 'assignments', 'assigned tasks'] },
  { label: 'Requests', url: '/admin?tab=workforce&subtab=requests', synonyms: ['requests', 'request', 'time off', 'pto', 'vacation requests', 'leave requests'] },
  { label: 'Scoring', url: '/admin?tab=workforce&subtab=scoring', synonyms: ['scoring', 'leaderboard', 'rankings', 'performance', 'employee scores', 'gamification'] },
  { label: 'Users', url: '/admin?tab=workforce&subtab=users', synonyms: ['users', 'user', 'user management', 'user accounts', 'team users'] },
  { label: 'Incidents', url: '/admin?tab=workforce&subtab=incidents', synonyms: ['incidents', 'incident', 'incident reports', 'accidents', 'safety incidents', 'injury reports'] },
  { label: 'Safety Meetings', url: '/admin?tab=workforce&subtab=safety-meetings', synonyms: ['safety meetings', 'safety meeting', 'safetymeetings', 'toolbox talks', 'safety training', 'safety briefing'] },

  // ===== FINANCIALS =====
  { label: 'Estimates', url: '/admin?tab=financials&subtab=estimates', synonyms: ['estimates', 'estimate', 'cost estimates', 'project estimates', 'estimating', 'takeoffs'] },
  { label: 'Bid Manager', url: '/admin?tab=financials&subtab=bid-manager', synonyms: ['bid manager', 'bidmanager', 'bids', 'bid packages', 'bidding', 'bid management', 'tender'] },
  { label: 'Change Orders', url: '/admin?tab=financials&subtab=change-orders', synonyms: ['change orders', 'change order', 'changeorders', 'co', 'extras', 'variations', 'modifications'] },
  { label: 'Invoices', url: '/admin?tab=financials&subtab=invoices', synonyms: ['invoices', 'invoice', 'billing', 'bills to customers', 'ar', 'accounts receivable', 'receivables'] },
  { label: 'Payments', url: '/admin?tab=financials&subtab=payments', synonyms: ['payments', 'payment', 'received payments', 'customer payments', 'collections'] },
  { label: 'Expenses', url: '/admin?tab=financials&subtab=expenses', synonyms: ['expenses', 'expense', 'costs', 'spending', 'expenditures', 'receipts'] },
  { label: 'Purchase Orders', url: '/admin?tab=financials&subtab=purchase-orders', synonyms: ['purchase orders', 'purchase order', 'purchaseorders', 'po', 'pos', 'material orders', 'supplier orders'] },
  { label: 'Sub-Contracts', url: '/admin?tab=financials&subtab=sub-contracts', synonyms: ['sub contracts', 'sub contract', 'subcontracts', 'subcontractor agreements', 'sub agreements', 'subcontractor contracts'] },
  { label: 'Bills', url: '/admin?tab=financials&subtab=bills', synonyms: ['bills', 'bill', 'vendor bills', 'ap', 'accounts payable', 'payables', 'supplier invoices'] },
  { label: 'Transaction Log', url: '/admin?tab=financials&subtab=transaction-log', synonyms: ['transaction log', 'transactions', 'transaction', 'financial log', 'money log', 'ledger'] },

  // ===== DOCUMENTS =====
  { label: 'Files & Photos', url: '/admin?tab=documents&subtab=files-photos', synonyms: ['files', 'photos', 'files and photos', 'files-photos', 'pictures', 'images', 'documents', 'uploads', 'attachments', 'media'] },
  { label: 'Reports', url: '/admin?tab=documents&subtab=reports', synonyms: ['reports', 'report', 'project reports', 'pdf reports', 'generate report'] },
  { label: 'Forms & Checklists', url: '/admin?tab=documents&subtab=forms-checklists', synonyms: ['forms', 'checklists', 'checklist', 'forms-checklists', 'templates', 'form templates'] },
  { label: 'RFI & Notices', url: '/admin?tab=documents&subtab=rfi-notices', synonyms: ['rfi', 'rfis', 'notices', 'notice', 'rfi-notices', 'request for information', 'questions', 'clarifications'] },
  { label: 'Submittals', url: '/admin?tab=documents&subtab=submittals', synonyms: ['submittals', 'submittal', 'shop drawings', 'product submittals', 'material submittals'] },
  { label: 'Vehicle Logs', url: '/admin?tab=documents&subtab=vehicle-logs', synonyms: ['vehicle logs', 'vehicle log', 'vehicle-logs', 'truck logs', 'fleet logs', 'mileage', 'vehicle tracking'] },
  { label: 'Equipment Logs', url: '/admin?tab=documents&subtab=equipment-logs', synonyms: ['equipment logs', 'equipment log', 'equipment-logs', 'tool logs', 'machinery logs', 'equipment tracking'] },
  { label: 'Notes', url: '/admin?tab=documents&subtab=notes', synonyms: ['notes', 'note', 'project notes', 'meeting notes', 'field notes'] },
  { label: 'Send Email', url: '/admin?tab=documents&subtab=send-email', synonyms: ['send email', 'email', 'send-email', 'compose email', 'new email', 'email customer'] },
  { label: 'Document Writer', url: '/admin?tab=documents&subtab=document-writer', synonyms: ['document writer', 'document-writer', 'write document', 'create document', 'doc writer', 'letter writer'] },

  // ===== SETTINGS =====
  { label: 'Team Board', url: '/admin?tab=settings&subtab=team-board', synonyms: ['team board', 'teamboard', 'team-board', 'org chart', 'organization', 'team structure'] },
  { label: 'Feedback', url: '/admin?tab=settings&subtab=feedback', synonyms: ['feedback', 'user feedback', 'app feedback', 'suggestions'] },
  { label: 'General', url: '/admin?tab=settings&subtab=general', synonyms: ['general', 'general settings', 'basic settings', 'company settings'] },
  { label: 'Storage', url: '/admin?tab=settings&subtab=storage', synonyms: ['storage', 'file storage', 'storage settings', 'cloud storage'] },
  { label: 'Integrations', url: '/admin?tab=settings&subtab=integrations', synonyms: ['integrations', 'integration', 'connect', 'connections', 'apps', 'third party', 'api'] },

  // ===== MAIN TABS (fallback) =====
  { label: 'Home', url: '/admin?tab=home', synonyms: ['home', 'dashboard', 'main', 'overview', 'start'] },
  { label: 'Sales', url: '/admin?tab=sales', synonyms: ['sales', 'sales tab', 'crm tab'] },
  { label: 'Projects', url: '/admin?tab=project-management', synonyms: ['projects tab', 'project management tab', 'pm tab'] },
  { label: 'Workforce', url: '/admin?tab=workforce', synonyms: ['workforce', 'workforce tab', 'team', 'employees', 'staff', 'hr'] },
  { label: 'Financials', url: '/admin?tab=financials', synonyms: ['financials', 'finance', 'financial', 'money', 'accounting', 'finances'] },
  { label: 'Analytics', url: '/admin?tab=analytics', synonyms: ['analytics', 'reports', 'data', 'metrics', 'kpi', 'statistics', 'insights'] },
  { label: 'Documents', url: '/admin?tab=documents', synonyms: ['documents', 'docs', 'files tab', 'document management'] },
  { label: 'Settings', url: '/admin?tab=settings', synonyms: ['settings', 'preferences', 'config', 'configuration', 'options', 'admin settings'] },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsPhrase(haystack: string, phrase: string): boolean {
  const p = phrase.trim();
  if (!p) return false;
  // word-boundary-ish match to avoid "files" matching "profiles"
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|\\s)${escaped}(\\s|$)`);
  return re.test(haystack);
}

export function resolveAdminNavigation(text: string): AdminNavMatch | null {
  const n = normalize(text)
    // common relation words that show up in phrases like "quotes inside sales"
    .replace(/\b(inside of|inside|under|within|in|the|to|go|take me|show me|open|navigate)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Prefer longer synonyms first ("work orders" before "work")
  const entries = [...ENTRIES].sort((a, b) => {
    const aLen = Math.max(...a.synonyms.map(s => s.length));
    const bLen = Math.max(...b.synonyms.map(s => s.length));
    return bLen - aLen;
  });

  for (const entry of entries) {
    for (const syn of entry.synonyms) {
      const s = normalize(syn);
      if (containsPhrase(n, s)) {
        const tabMatch = entry.url.match(/[?&]tab=([^&]+)/);
        const subtabMatch = entry.url.match(/[?&]subtab=([^&]+)/);
        return {
          url: entry.url,
          label: entry.label,
          mainTab: tabMatch?.[1],
          subtab: subtabMatch?.[1],
        };
      }
    }
  }

  return null;
}

export function resolveAdminNavigationUrl(text: string): string | null {
  return resolveAdminNavigation(text)?.url || null;
}

// Helper to get all available navigation options (useful for autocomplete/suggestions)
export function getAllNavigationOptions(): { label: string; url: string; category: string }[] {
  return ENTRIES.map(entry => {
    const tabMatch = entry.url.match(/[?&]tab=([^&]+)/);
    const tab = tabMatch?.[1] || 'other';
    
    const categoryMap: Record<string, string> = {
      'sales': 'Sales',
      'project-management': 'Project Management',
      'workforce': 'Workforce',
      'financials': 'Financials',
      'documents': 'Documents',
      'settings': 'Settings',
      'home': 'Main',
      'analytics': 'Main'
    };
    
    return {
      label: entry.label,
      url: entry.url,
      category: categoryMap[tab] || 'Other'
    };
  });
}
