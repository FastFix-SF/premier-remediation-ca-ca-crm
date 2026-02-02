import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Map of data types to their React Query cache keys
 * When Fasto modifies data, we invalidate all related queries
 */
const DATA_TYPE_QUERY_KEYS: Record<string, string[]> = {
  // CRM & Sales
  leads: ['leads', 'quoter-leads', 'fasto-new-leads', 'lead-details', 'lead-stats'],
  proposals: ['proposals', 'proposal-details'],
  quotes: ['quotes', 'quote-requests'],
  
  // Projects
  projects: ['projects', 'project-details', 'projects-with-photos', 'project-financials'],
  
  // Financial
  invoices: ['invoices', 'invoice-details', 'project-invoices'],
  bills: ['bills', 'bill-details'],
  expenses: ['expenses', 'expense-details'],
  payments: ['payments', 'payment-details', 'invoice-payments'],
  'purchase-orders': ['purchase-orders', 'po-details'],
  estimates: ['estimates', 'estimate-items', 'project-estimates'],
  'change-orders': ['change-orders', 'change-order-details', 'change-order-items'],
  
  // Workforce
  employees: ['team-directory', 'team-members', 'employees'],
  'team-directory': ['team-directory', 'team-members', 'employees'],
  'time-clock': ['time-clock', 'attendance', 'timesheets', 'who-clocked-in'],
  attendance: ['attendance', 'time-clock', 'timesheets'],
  schedules: ['schedules', 'job-schedules', 'schedule-details'],
  
  // Operations
  'work-orders': ['work-orders', 'work-order-details'],
  'service-tickets': ['service-tickets', 'ticket-details'],
  inspections: ['inspections', 'project-inspections'],
  punchlists: ['punchlists', 'project-punchlists', 'punchlist-items'],
  'daily-logs': ['daily-logs', 'project-daily-logs', 'daily-log-entries'],
  permits: ['permits', 'project-permits'],
  todos: ['todos', 'tasks', 'mobile-tasks', 'mobile-task-detail'],
  
  // Tasks - comprehensive coverage for mobile and admin
  'team-tasks': ['mobile-tasks', 'mobile-task-detail', 'team-tasks', 'tasks', 'todos'],
  'mobile-tasks': ['mobile-tasks', 'mobile-task-detail', 'team-tasks', 'tasks', 'todos'],
  tasks: ['mobile-tasks', 'mobile-task-detail', 'team-tasks', 'tasks', 'todos'],
  
  // Directory
  'directory-contacts': ['directory-contacts', 'contacts', 'vendors', 'subcontractors'],
  
  // Safety
  incidents: ['incidents', 'incident-notes'],
  'safety-meetings': ['safety-meetings'],
};

interface FastoDataRefreshEvent extends CustomEvent {
  detail: {
    dataTypes: string[];
  };
}

/**
 * Hook that listens for Fasto data modification events and invalidates
 * the appropriate React Query caches for instant UI updates
 */
export function useFastoDataRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleDataRefresh = (e: Event) => {
      const event = e as FastoDataRefreshEvent;
      const { dataTypes } = event.detail;
      
      console.log('[useFastoDataRefresh] Invalidating caches for:', dataTypes);
      
      dataTypes.forEach(dataType => {
        const queryKeys = DATA_TYPE_QUERY_KEYS[dataType] || [dataType];
        
        queryKeys.forEach(key => {
          console.log(`[useFastoDataRefresh] Invalidating query: ${key}`);
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      });
    };

    window.addEventListener('fasto-data-refresh', handleDataRefresh);
    
    return () => {
      window.removeEventListener('fasto-data-refresh', handleDataRefresh);
    };
  }, [queryClient]);
}

/**
 * Dispatch a data refresh event manually if needed
 */
export function dispatchFastoDataRefresh(dataTypes: string[]) {
  window.dispatchEvent(
    new CustomEvent('fasto-data-refresh', {
      detail: { dataTypes }
    })
  );
}
