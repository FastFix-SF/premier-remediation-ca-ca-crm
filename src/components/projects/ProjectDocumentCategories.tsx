import React, { useState } from 'react';
import { ChevronRight, Plus, FileText, ClipboardList, FolderOpen, ListChecks, AlertTriangle, Search, FileCheck, ShieldCheck, ListTodo, MessageSquare, Wrench, FileInput, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreateDailyLogDialog } from '@/components/daily-logs/CreateDailyLogDialog';
import { CreatePermitDialog } from '@/components/permits/CreatePermitDialog';
import { CreateServiceTicketDialog } from '@/components/service-tickets/CreateServiceTicketDialog';
import { AddDocumentDialog } from './dialogs/AddDocumentDialog';
import { AddProjectNoteDialog } from './dialogs/AddProjectNoteDialog';
import { AddInspectionDialog } from './dialogs/AddInspectionDialog';
import { AddPunchlistDialog } from './dialogs/AddPunchlistDialog';
import { AddSafetyMeetingDialog } from './dialogs/AddSafetyMeetingDialog';
import { AddTodoDialog } from './dialogs/AddTodoDialog';
import { AddFormChecklistDialog } from './dialogs/AddFormChecklistDialog';
import { AddRFIDialog } from './dialogs/AddRFIDialog';
import { AddSubmittalDialog } from './dialogs/AddSubmittalDialog';
import { AddIncidentDialog } from './dialogs/AddIncidentDialog';
import { SubmittalDetailDialog } from './dialogs/SubmittalDetailDialog';
import { format } from 'date-fns';

// Use any cast to bypass type checking for tables not in generated types
const db = supabase as any;

interface DocumentCategory {
  id: string;
  label: string;
  addLabel?: string;
  icon: React.ElementType;
  table?: string;
  projectIdColumn?: string;
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  { id: 'project-notes', label: 'Project Notes', addLabel: 'Note', icon: FileText, table: 'project_status_updates', projectIdColumn: 'project_id' },
  { id: 'daily-logs', label: 'Daily Logs', addLabel: 'Daily Log', icon: ClipboardList, table: 'daily_log_entries', projectIdColumn: 'project_id' },
  { id: 'documents', label: 'Documents', addLabel: 'Document', icon: FolderOpen, table: 'project_documents', projectIdColumn: 'project_id' },
  { id: 'forms-checklists', label: 'Forms & Checklists', addLabel: 'Form', icon: ListChecks, table: 'project_inspections', projectIdColumn: 'project_id' },
  { id: 'incidents', label: 'Incidents', addLabel: 'Incident', icon: AlertTriangle, table: 'incidents', projectIdColumn: 'project_id' },
  { id: 'inspections', label: 'Inspections', addLabel: 'Inspection', icon: Search, table: 'project_inspections', projectIdColumn: 'project_id' },
  { id: 'notes', label: 'Notes', icon: MessageSquare, table: 'project_status_updates', projectIdColumn: 'project_id' },
  { id: 'permits', label: 'Permits', addLabel: 'Permit', icon: FileCheck, table: 'permits', projectIdColumn: 'project_id' },
  { id: 'punchlists', label: 'Punchlists', addLabel: 'Punchlist', icon: CheckSquare, table: 'project_punchlists', projectIdColumn: 'project_id' },
  { id: 'rfi-notices', label: 'RFI & Notices', addLabel: 'RFI', icon: FileInput, table: 'change_orders', projectIdColumn: 'project_id' },
  { id: 'safety-meetings', label: 'Safety Meetings', addLabel: 'Safety Meeting', icon: ShieldCheck, table: 'safety_meetings', projectIdColumn: 'project_id' },
  { id: 'service-tickets', label: 'Service Tickets', addLabel: 'Service Ticket', icon: Wrench, table: 'service_tickets', projectIdColumn: 'project_id' },
  { id: 'submittals', label: 'Submittals', addLabel: 'Submittal', icon: FileText, table: 'submittals', projectIdColumn: 'project_id' },
  { id: 'todos', label: "To-Do's", addLabel: 'To-Do', icon: ListTodo, table: 'todos', projectIdColumn: 'project_id' },
];

interface ProjectDocumentCategoriesProps {
  projectId: string;
}

interface CategoryItem {
  id: string;
  name: string;
  created_at: string;
  status?: string;
}

export const ProjectDocumentCategories: React.FC<ProjectDocumentCategoriesProps> = ({ projectId }) => {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const queryClient = useQueryClient();
  
  // Dialog states
  const [dailyLogDialogOpen, setDailyLogDialogOpen] = useState(false);
  const [permitDialogOpen, setPermitDialogOpen] = useState(false);
  const [serviceTicketDialogOpen, setServiceTicketDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [punchlistDialogOpen, setPunchlistDialogOpen] = useState(false);
  const [safetyMeetingDialogOpen, setSafetyMeetingDialogOpen] = useState(false);
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [rfiDialogOpen, setRfiDialogOpen] = useState(false);
  const [submittalDialogOpen, setSubmittalDialogOpen] = useState(false);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [selectedSubmittalId, setSelectedSubmittalId] = useState<string | null>(null);

  // Fetch counts for each category
  const { data: categoryCounts = {} } = useQuery({
    queryKey: ['project-document-counts', projectId],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      
      // Fetch counts from various tables using individual queries
      const [
        dailyLogs,
        documents,
        incidents,
        permits,
        punchlists,
        safetyMeetings,
        serviceTickets,
        todos,
        inspections,
        projectNotes,
        changeOrders,
        submittals,
      ] = await Promise.all([
        supabase.from('daily_log_entries').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('project_documents').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('permits').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        db.from('punchlists').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        db.from('safety_meetings').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('service_tickets').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('todos').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        db.from('inspections').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('project_status_updates').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('change_orders').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        db.from('submittals').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      ]);

      counts['daily-logs'] = dailyLogs.count || 0;
      counts['documents'] = documents.count || 0;
      counts['incidents'] = incidents.count || 0;
      counts['permits'] = permits.count || 0;
      counts['punchlists'] = punchlists.count || 0;
      counts['safety-meetings'] = safetyMeetings.count || 0;
      counts['service-tickets'] = serviceTickets.count || 0;
      counts['todos'] = todos.count || 0;
      counts['inspections'] = inspections.count || 0;
      counts['project-notes'] = projectNotes.count || 0;
      counts['notes'] = projectNotes.count || 0;
      counts['forms-checklists'] = inspections.count || 0;
      counts['rfi-notices'] = changeOrders.count || 0;
      counts['submittals'] = submittals.count || 0;

      return counts;
    },
    enabled: !!projectId,
  });

  // Fetch items for expanded categories
  const { data: categoryItems = {} } = useQuery({
    queryKey: ['project-document-items', projectId, expandedRows],
    queryFn: async () => {
      const items: Record<string, CategoryItem[]> = {};
      
      for (const categoryId of expandedRows) {
        try {
          let data: { id: string; name?: string; created_at: string; status?: string }[] | null = null;
          
          switch (categoryId) {
            case 'daily-logs':
              const dailyLogs = await supabase.from('daily_log_entries').select('id, log_date, created_at, status').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
              data = dailyLogs.data?.map(d => ({ id: d.id, name: `Log - ${d.log_date}`, created_at: d.created_at || '', status: d.status || undefined })) || null;
              break;
            case 'documents':
              const docs = await supabase.from('project_documents').select('id, name, uploaded_at, category').eq('project_id', projectId).order('uploaded_at', { ascending: false }).limit(10);
              data = docs.data?.map(d => ({ id: d.id, name: d.name, created_at: d.uploaded_at || '', status: d.category || undefined })) || null;
              break;
            case 'incidents':
              const incidents = await supabase.from('incidents').select('id, description, created_at, status').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
              data = incidents.data?.map(d => ({ id: d.id, name: d.description?.slice(0, 50) || 'Incident', created_at: d.created_at || '', status: d.status || undefined })) || null;
              break;
            case 'permits':
              const permits = await supabase.from('permits').select('id, permit_number, permit_type, created_at, status').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
              data = permits.data?.map(d => ({ id: d.id, name: d.permit_number || d.permit_type || 'Permit', created_at: d.created_at || '', status: d.status || undefined })) || null;
              break;
            case 'punchlists':
              const punchlists = await db.from('punchlists').select('id, title, created_at, status').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
              data = punchlists.data?.map((d: any) => ({ id: d.id, name: d.title || 'Punchlist', created_at: d.created_at || '', status: d.status || undefined })) || null;
              break;
            case 'safety-meetings':
              const meetings = await db.from('safety_meetings').select('id, topic, created_at, status').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
              data = meetings.data?.map((d: any) => ({ id: d.id, name: d.topic || 'Safety Meeting', created_at: d.created_at || '', status: d.status || undefined })) || null;
              break;
            case 'service-tickets':
              const tickets = await supabase.from('service_tickets').select('id, title, created_at, status').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
              data = tickets.data?.map(d => ({ id: d.id, name: d.title || 'Service Ticket', created_at: d.created_at || '', status: d.status || undefined })) || null;
              break;
            case 'todos':
              const todos = await supabase.from('todos').select('id, title, created_at, status').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
              data = todos.data?.map(d => ({ id: d.id, name: d.title || 'Task', created_at: d.created_at || '', status: d.status || undefined })) || null;
              break;
            case 'inspections':
            case 'forms-checklists':
              const inspections = await db.from('inspections').select('id, inspection_type, created_at, status').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
              data = inspections.data?.map((d: any) => ({ id: d.id, name: d.inspection_type || 'Inspection', created_at: d.created_at || '', status: d.status || undefined })) || null;
              break;
            case 'project-notes':
            case 'notes':
              const notes = await supabase.from('project_status_updates').select('id, notes, created_at').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
              data = notes.data?.map(d => ({ id: d.id, name: d.notes?.slice(0, 50) + (d.notes && d.notes.length > 50 ? '...' : '') || 'Note', created_at: d.created_at || '' })) || null;
              break;
            case 'rfi-notices':
              const rfis = await supabase.from('change_orders').select('id, title, created_at, status').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
              data = rfis.data?.map(d => ({ id: d.id, name: d.title || 'RFI', created_at: d.created_at || '', status: d.status || undefined })) || null;
              break;
            case 'submittals':
              const submittals = await db.from('submittals').select('id, name, created_at, status').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10);
              data = submittals.data?.map((d: any) => ({ id: d.id, name: d.name || 'Submittal', created_at: d.created_at || '', status: d.status || undefined })) || null;
              break;
          }
          
          if (data) {
            items[categoryId] = data.map(item => ({
              id: item.id,
              name: item.name || 'Untitled',
              created_at: item.created_at,
              status: item.status,
            }));
          }
        } catch {
          items[categoryId] = [];
        }
      }

      return items;
    },
    enabled: expandedRows.length > 0,
  });

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id) 
        : [...prev, id]
    );
  };

  const handleAddClick = (categoryId: string) => {
    switch (categoryId) {
      case 'daily-logs':
        setDailyLogDialogOpen(true);
        break;
      case 'permits':
        setPermitDialogOpen(true);
        break;
      case 'service-tickets':
        setServiceTicketDialogOpen(true);
        break;
      case 'documents':
        setDocumentDialogOpen(true);
        break;
      case 'project-notes':
      case 'notes':
        setNoteDialogOpen(true);
        break;
      case 'inspections':
        setInspectionDialogOpen(true);
        break;
      case 'punchlists':
        setPunchlistDialogOpen(true);
        break;
      case 'safety-meetings':
        setSafetyMeetingDialogOpen(true);
        break;
      case 'todos':
        setTodoDialogOpen(true);
        break;
      case 'forms-checklists':
        setFormDialogOpen(true);
        break;
      case 'rfi-notices':
        setRfiDialogOpen(true);
        break;
      case 'submittals':
        setSubmittalDialogOpen(true);
        break;
      case 'incidents':
        setIncidentDialogOpen(true);
        break;
    }
  };

  const getStatusColor = (count: number) => {
    if (count === 0) return 'bg-muted-foreground/30';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-1">
      {DOCUMENT_CATEGORIES.map((category) => {
        const isExpanded = expandedRows.includes(category.id);
        const count = categoryCounts[category.id] || 0;
        const items = categoryItems[category.id] || [];
        const Icon = category.icon;

        return (
          <div
            key={category.id}
            className="bg-card rounded-lg border overflow-hidden"
          >
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleRow(category.id)}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-2.5 h-2.5 rounded-full", getStatusColor(count))} />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {category.label}
                  {count > 0 && <span className="text-muted-foreground ml-1">({count})</span>}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {category.addLabel && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddClick(category.id);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/30 rounded-md transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{category.addLabel}</span>
                  </button>
                )}
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isExpanded && "rotate-90"
                  )} 
                />
              </div>
            </div>

            {isExpanded && (
              <div className="px-4 py-3 border-t bg-muted/20">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No {category.label.toLowerCase()} found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          if (category.id === 'submittals') {
                            setSelectedSubmittalId(item.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-xs">{item.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Dialogs */}
      <CreateDailyLogDialog
        open={dailyLogDialogOpen}
        onOpenChange={setDailyLogDialogOpen}
        projectId={projectId}
      />
      <CreatePermitDialog
        open={permitDialogOpen}
        onOpenChange={setPermitDialogOpen}
      />
      <CreateServiceTicketDialog
        open={serviceTicketDialogOpen}
        onOpenChange={setServiceTicketDialogOpen}
      />
      <AddDocumentDialog
        open={documentDialogOpen}
        onOpenChange={setDocumentDialogOpen}
        projectId={projectId}
      />
      <AddProjectNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        projectId={projectId}
      />
      <AddInspectionDialog
        open={inspectionDialogOpen}
        onOpenChange={setInspectionDialogOpen}
        projectId={projectId}
      />
      <AddPunchlistDialog
        open={punchlistDialogOpen}
        onOpenChange={setPunchlistDialogOpen}
        projectId={projectId}
      />
      <AddSafetyMeetingDialog
        open={safetyMeetingDialogOpen}
        onOpenChange={setSafetyMeetingDialogOpen}
        projectId={projectId}
      />
      <AddTodoDialog
        open={todoDialogOpen}
        onOpenChange={setTodoDialogOpen}
        projectId={projectId}
      />
      <AddFormChecklistDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        projectId={projectId}
      />
      <AddRFIDialog
        open={rfiDialogOpen}
        onOpenChange={setRfiDialogOpen}
        projectId={projectId}
      />
      <AddSubmittalDialog
        open={submittalDialogOpen}
        onOpenChange={setSubmittalDialogOpen}
        projectId={projectId}
      />
      <AddIncidentDialog
        open={incidentDialogOpen}
        onOpenChange={setIncidentDialogOpen}
        projectId={projectId}
      />
      {selectedSubmittalId && (
        <SubmittalDetailDialog
          open={!!selectedSubmittalId}
          onOpenChange={(open) => !open && setSelectedSubmittalId(null)}
          submittalId={selectedSubmittalId}
        />
      )}
    </div>
  );
};

export default ProjectDocumentCategories;
