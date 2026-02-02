import React, { useEffect, useState } from 'react';
import { 
  Database, Search, FileText, Users, Calendar, TrendingUp, 
  Check, Loader2, AlertCircle, ChevronDown, ChevronUp,
  Zap, BarChart3, Package, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AGENTS } from '@/mobile/config/agents';

export interface ActivityEvent {
  id: string;
  type: 'tool_call' | 'tool_result' | 'thinking' | 'routing' | 'speaking';
  toolName?: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: string;
  agentType?: string;
  timestamp: Date;
  duration?: number;
}

interface FastoActivityPanelProps {
  events: ActivityEvent[];
  isVisible: boolean;
  onToggle: () => void;
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  query_projects: <Database className="w-3 h-3" />,
  query_leads: <Users className="w-3 h-3" />,
  query_schedules: <Calendar className="w-3 h-3" />,
  query_employees: <Users className="w-3 h-3" />,
  query_invoices: <FileText className="w-3 h-3" />,
  query_materials: <Package className="w-3 h-3" />,
  get_dashboard_stats: <BarChart3 className="w-3 h-3" />,
  get_project_financials: <TrendingUp className="w-3 h-3" />,
  get_attendance_data: <Calendar className="w-3 h-3" />,
  create_lead: <Users className="w-3 h-3" />,
  create_project: <Database className="w-3 h-3" />,
  create_schedule: <Calendar className="w-3 h-3" />,
  update_lead_status: <Users className="w-3 h-3" />,
  update_project_status: <Database className="w-3 h-3" />,
  generate_pdf_report: <FileText className="w-3 h-3" />,
};

const STATUS_COLORS: Record<ActivityEvent['status'], string> = {
  pending: 'text-muted-foreground',
  running: 'text-primary',
  success: 'text-green-500',
  error: 'text-destructive',
};

const STATUS_ICONS: Record<ActivityEvent['status'], React.ReactNode> = {
  pending: <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />,
  running: <Loader2 className="w-3 h-3 animate-spin" />,
  success: <Check className="w-3 h-3" />,
  error: <AlertCircle className="w-3 h-3" />,
};

export const FastoActivityPanel: React.FC<FastoActivityPanelProps> = ({
  events,
  isVisible,
  onToggle,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-expand when new events come in
  useEffect(() => {
    if (events.length > 0 && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [events.length]);

  if (!isVisible) return null;

  const hasActiveEvents = events.some(e => e.status === 'running' || e.status === 'pending');

  return (
    <div 
      className={cn(
        "bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg transition-all duration-300 overflow-hidden",
        isCollapsed ? "h-10" : "h-auto max-h-64"
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 border-b bg-muted/30 hover:bg-muted/50 transition-colors",
          hasActiveEvents && "border-l-2 border-l-primary"
        )}
      >
        <div className="flex items-center gap-2">
          <Zap className={cn(
            "w-4 h-4",
            hasActiveEvents ? "text-primary animate-pulse" : "text-muted-foreground"
          )} />
          <span className="text-xs font-medium">Fasto Activity</span>
          {events.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {events.length}
            </span>
          )}
        </div>
        {isCollapsed ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Events List */}
      {!isCollapsed && (
        <ScrollArea className="h-48">
          <div className="p-2 space-y-1">
            {events.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">
                <Zap className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>Waiting for Fasto to take action...</p>
              </div>
            ) : (
              events.map((event) => (
                <ActivityEventRow key={event.id} event={event} />
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

const ActivityEventRow: React.FC<{ event: ActivityEvent }> = ({ event }) => {
  const icon = event.toolName ? TOOL_ICONS[event.toolName] : <MessageSquare className="w-3 h-3" />;
  const agent = event.agentType ? AGENTS[event.agentType] : null;
  
  const getEventTypeLabel = () => {
    switch (event.type) {
      case 'tool_call': return 'Calling';
      case 'tool_result': return 'Result';
      case 'thinking': return 'Thinking';
      case 'routing': return 'Routing';
      case 'speaking': return 'Speaking';
      default: return '';
    }
  };

  return (
    <div 
      className={cn(
        "flex items-start gap-2 p-2 rounded-md transition-colors text-xs",
        event.status === 'running' && "bg-primary/5 border border-primary/20",
        event.status === 'success' && "bg-green-500/5",
        event.status === 'error' && "bg-destructive/5"
      )}
    >
      {/* Status Icon */}
      <div className={cn("mt-0.5", STATUS_COLORS[event.status])}>
        {STATUS_ICONS[event.status]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {/* Agent Badge */}
          {agent && (
            <span 
              className="text-[10px] px-1 py-0.5 rounded-sm"
              style={{ backgroundColor: agent.color + '20', color: agent.color }}
            >
              {agent.icon} {agent.name}
            </span>
          )}
          
          {/* Tool Icon */}
          <span className={STATUS_COLORS[event.status]}>
            {icon}
          </span>
          
          {/* Event Type */}
          <span className="text-muted-foreground text-[10px]">
            {getEventTypeLabel()}
          </span>
        </div>

        {/* Message */}
        <p className={cn(
          "mt-0.5 truncate",
          event.status === 'error' ? "text-destructive" : "text-foreground"
        )}>
          {event.message}
        </p>

        {/* Details */}
        {event.details && (
          <p className="mt-0.5 text-muted-foreground text-[10px] truncate">
            {event.details}
          </p>
        )}

        {/* Duration */}
        {event.duration !== undefined && event.status === 'success' && (
          <p className="mt-0.5 text-muted-foreground text-[10px]">
            Completed in {event.duration}ms
          </p>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
};

// Hook to manage activity events
export const useFastoActivity = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const addEvent = (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const newEvent: ActivityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
    return newEvent.id;
  };

  const updateEvent = (id: string, updates: Partial<ActivityEvent>) => {
    setEvents(prev => prev.map(e => 
      e.id === id ? { ...e, ...updates } : e
    ));
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return {
    events,
    addEvent,
    updateEvent,
    clearEvents,
  };
};
