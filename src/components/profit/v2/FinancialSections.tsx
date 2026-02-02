import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Receipt, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface FinancialSection {
  id: string;
  label: string;
  count: number;
  total: number;
  addLabel: string;
}

interface TimeCardEntry {
  id: string;
  user_id: string;
  employee_name: string;
  clock_in: string;
  clock_out: string | null;
  total_hours: number | null;
  status: string;
}

interface FinancialSectionRowProps {
  section: FinancialSection;
  isExpanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  children?: React.ReactNode;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatHours = (hours: number | null): string => {
  if (!hours) return '0:00';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
};

const FinancialSectionRow: React.FC<FinancialSectionRowProps> = ({
  section,
  isExpanded,
  onToggle,
  onAdd,
  children,
}) => {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-card overflow-hidden">
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            )}
          </button>
          <span className="font-semibold text-foreground">
            {section.label} ({section.count})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
            <Receipt className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-sm font-medium text-foreground">{formatCurrency(section.total)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {section.addLabel}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          {children || (
            <p className="text-sm text-muted-foreground text-center py-4">
              No {section.label.toLowerCase()} yet. Click "+ {section.addLabel}" to add one.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface FinancialSectionsProps {
  projectId: string;
}

export const FinancialSections: React.FC<FinancialSectionsProps> = ({ projectId }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Fetch time clock entries for this project
  const fetchTimeCards = async (): Promise<TimeCardEntry[]> => {
    // Cast to any to avoid deep type instantiation error from Supabase generated types
    const client = supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: TimeCardEntry[] | null; error: Error | null }> } } } };
    
    const { data, error } = await client
      .from('time_clock')
      .select('id, user_id, employee_name, clock_in, clock_out, total_hours, status')
      .eq('project_id', projectId)
      .order('clock_in', { ascending: false });
    
    if (error) throw error;
    return data ?? [];
  };

  const { data: timeCards = [] } = useQuery({
    queryKey: ['project-time-cards', projectId],
    queryFn: fetchTimeCards,
    enabled: !!projectId,
  });

  const totalTimeCardHours = timeCards.reduce((sum, tc) => sum + (tc.total_hours || 0), 0);

  // Define sections in the specified order
  const sections: FinancialSection[] = [
    { id: 'estimates', label: 'Estimates', count: 0, total: 0, addLabel: 'Estimate' },
    { id: 'invoices', label: 'Invoices', count: 0, total: 0, addLabel: 'Invoice' },
    { id: 'payments', label: 'Payments', count: 0, total: 0, addLabel: 'Payment' },
    { id: 'purchase-orders', label: 'Purchase Orders', count: 0, total: 0, addLabel: 'Purchase Order' },
    { id: 'bills', label: 'Bills', count: 0, total: 0, addLabel: 'Bill' },
    { id: 'change-orders', label: 'Change Orders', count: 0, total: 0, addLabel: 'Change Order' },
    { id: 'expenses', label: 'Expenses', count: 0, total: 0, addLabel: 'Expense' },
    { id: 'sub-contractors', label: 'Sub-Contractors', count: 0, total: 0, addLabel: 'Sub-Contract' },
    { id: 'time-cards', label: 'Time Cards', count: timeCards.length, total: totalTimeCardHours, addLabel: 'Time Card' },
    { id: 'work-orders', label: 'Work Orders', count: 0, total: 0, addLabel: 'Work Order' },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleAdd = (sectionId: string) => {
    // TODO: Implement add functionality for each section
    console.log(`Add new item to ${sectionId}`);
  };

  const renderTimeCardsContent = () => {
    if (timeCards.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-4">
          No time cards yet. Click "+ Time Card" to add one.
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {timeCards.map((tc) => (
          <div 
            key={tc.id} 
            className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{tc.employee_name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(tc.clock_in), 'MMM d, yyyy')} • {format(new Date(tc.clock_in), 'h:mm a')}
                  {tc.clock_out && ` - ${format(new Date(tc.clock_out), 'h:mm a')}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{formatHours(tc.total_hours)} hrs</span>
              </div>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                tc.status === 'clocked_in' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                tc.status === 'on_break' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              )}>
                {tc.status === 'clocked_in' ? 'Active' : tc.status === 'on_break' ? 'Break' : 'Complete'}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <h2 className="text-base md:text-xl font-semibold mb-3 md:mb-4">Financial Details</h2>
      <div className="space-y-2">
        {sections.map((section) => (
          <FinancialSectionRow
            key={section.id}
            section={section}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
            onAdd={() => handleAdd(section.id)}
          >
            {section.id === 'time-cards' ? renderTimeCardsContent() : undefined}
          </FinancialSectionRow>
        ))}
      </div>
    </div>
  );
};