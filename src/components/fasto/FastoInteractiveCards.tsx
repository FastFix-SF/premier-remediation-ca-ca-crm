import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  FileText, 
  Download, 
  Loader2, 
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Receipt,
  Wrench,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { generateTimesheetPdf } from '@/components/admin/workforce/generateTimesheetPdf';
import { downloadInvoice } from '@/lib/invoiceGenerator';
import { generateProposalPDF } from '@/lib/proposalPdfGenerator';
import { format, parseISO, startOfWeek } from 'date-fns';

// Shared animation variants
const cardVariants = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  hover: { scale: 1.02, y: -2 },
  tap: { scale: 0.98 }
};

// Status color mapping
const getStatusColor = (status: string) => {
  const statusLower = status?.toLowerCase() || '';
  if (['active', 'in_progress', 'in progress', 'open'].includes(statusLower)) return 'bg-blue-500';
  if (['completed', 'done', 'paid', 'closed'].includes(statusLower)) return 'bg-emerald-500';
  if (['pending', 'on_hold', 'on hold', 'draft'].includes(statusLower)) return 'bg-amber-500';
  if (['cancelled', 'overdue', 'failed'].includes(statusLower)) return 'bg-red-500';
  if (['new', 'qualified'].includes(statusLower)) return 'bg-purple-500';
  return 'bg-muted-foreground';
};

const getStatusBadgeVariant = (status: string) => {
  const statusLower = status?.toLowerCase() || '';
  if (['completed', 'done', 'paid'].includes(statusLower)) return 'default';
  if (['active', 'in_progress'].includes(statusLower)) return 'secondary';
  if (['pending', 'on_hold'].includes(statusLower)) return 'outline';
  if (['overdue', 'cancelled'].includes(statusLower)) return 'destructive';
  return 'outline';
};

// ============================================
// PROJECT CARDS - Clickable, navigates to project detail
// ============================================
interface ProjectCardData {
  id: string;
  name: string;
  status: string;
  address?: string;
  customer_name?: string;
  photo_url?: string;
  progress?: number;
  team_count?: number;
}

export const FastoInteractiveProjectCard: React.FC<{
  projects: ProjectCardData[];
  title?: string;
  onNavigate?: (path: string) => void;
}> = ({ projects, title = 'Projects', onNavigate }) => {
  const navigate = useNavigate();

  const handleClick = (projectId: string) => {
    const path = `/admin/projects/${projectId}`;
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 rounded-xl p-4 mt-2 max-w-full backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-blue-500/20 rounded-lg">
          <Building2 className="h-4 w-4 text-blue-600" />
        </div>
        <h4 className="font-medium text-sm">{title}</h4>
        <Badge variant="outline" className="ml-auto text-[10px]">
          {projects.length} total
        </Badge>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
        {projects.slice(0, 5).map((project) => (
          <motion.div
            key={project.id}
            onClick={() => handleClick(project.id)}
            whileHover={{ scale: 1.01, x: 4 }}
            whileTap={{ scale: 0.99 }}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-background/60 hover:bg-background/80 cursor-pointer transition-all group border border-transparent hover:border-blue-500/30"
          >
            {project.photo_url ? (
              <img 
                src={project.photo_url} 
                alt={project.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600/60" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{project.name}</span>
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(project.status))} />
              </div>
              {project.address && (
                <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  {project.address}
                </p>
              )}
            </div>

            {project.progress !== undefined && (
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-8">{project.progress}%</span>
              </div>
            )}

            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>

      {projects.length > 5 && (
        <div 
          onClick={() => navigate('/admin?tab=project-management')}
          className="text-[10px] text-blue-600 text-center pt-2 mt-2 border-t border-blue-500/10 cursor-pointer hover:underline"
        >
          View all {projects.length} projects →
        </div>
      )}
    </motion.div>
  );
};

// ============================================
// ATTENDANCE CARD - Clickable, navigates to workforce/timesheets
// ============================================
interface AttendanceEntry {
  id?: string;
  name: string;
  employee_name?: string;
  hours?: number;
  total_hours?: number;
  status?: 'clocked-in' | 'clocked-out' | string;
  clock_in_time?: string;
  job_name?: string;
}

export const FastoInteractiveAttendanceCard: React.FC<{
  entries: AttendanceEntry[];
  title?: string;
  totalHours?: number;
  summary?: any;
  onNavigate?: (path: string) => void;
}> = ({ entries, title = "Today's Attendance", totalHours, summary, onNavigate }) => {
  const navigate = useNavigate();
  
  const clockedIn = entries.filter(e => 
    e.status === 'clocked-in' || e.status === 'active'
  ).length;

  const handleClick = () => {
    const path = '/admin?tab=workforce';
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      onClick={handleClick}
      whileHover="hover"
      whileTap="tap"
      className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-xl p-4 mt-2 max-w-full backdrop-blur-sm cursor-pointer group"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-emerald-500/20 rounded-lg">
          <Clock className="h-4 w-4 text-emerald-600" />
        </div>
        <h4 className="font-medium text-sm">{title}</h4>
        <Badge variant="secondary" className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-700">
          {clockedIn} active
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {(totalHours !== undefined || summary) && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-background/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-emerald-600">{totalHours?.toFixed(1) || summary?.totalHours?.toFixed(1) || '0'}h</p>
            <p className="text-[10px] text-muted-foreground">Total Hours</p>
          </div>
          <div className="bg-background/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-blue-600">{entries.length}</p>
            <p className="text-[10px] text-muted-foreground">Team Members</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {entries.slice(0, 6).map((entry, idx) => (
          <div 
            key={entry.id || idx}
            className="flex items-center gap-1.5 px-2 py-1 bg-background/60 rounded-full"
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              entry.status === 'clocked-in' || entry.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground'
            )} />
            <span className="text-[10px] font-medium truncate max-w-[80px]">
              {entry.name || entry.employee_name}
            </span>
          </div>
        ))}
        {entries.length > 6 && (
          <div className="px-2 py-1 bg-background/60 rounded-full">
            <span className="text-[10px] text-muted-foreground">+{entries.length - 6} more</span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-emerald-600 text-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        Click to view full timesheets →
      </p>
    </motion.div>
  );
};

// ============================================
// INVOICE CARD - Clickable, navigates to financials
// ============================================
interface InvoiceData {
  id: string;
  invoice_number?: string;
  customer_name?: string;
  amount?: number;
  total?: number;
  status?: string;
  due_date?: string;
}

export const FastoInteractiveInvoiceCard: React.FC<{
  invoices: InvoiceData[];
  title?: string;
  onNavigate?: (path: string) => void;
}> = ({ invoices, title = 'Invoices', onNavigate }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const path = '/admin?tab=financials';
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || inv.total || 0), 0);

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      onClick={handleClick}
      whileHover="hover"
      whileTap="tap"
      className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 rounded-xl p-4 mt-2 max-w-full backdrop-blur-sm cursor-pointer group"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-green-500/20 rounded-lg">
          <Receipt className="h-4 w-4 text-green-600" />
        </div>
        <h4 className="font-medium text-sm">{title}</h4>
        <Badge variant="secondary" className="ml-auto text-[10px] bg-green-500/20 text-green-700">
          ${totalAmount.toLocaleString()}
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
        {invoices.slice(0, 4).map((invoice) => (
          <div key={invoice.id} className="flex items-center justify-between text-xs bg-background/50 rounded-lg px-2.5 py-1.5">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", getStatusColor(invoice.status || 'pending'))} />
              <span className="font-medium">{invoice.invoice_number || `INV-${invoice.id.slice(0, 6)}`}</span>
            </div>
            <span className="text-muted-foreground">{invoice.customer_name}</span>
            <span className="font-medium text-green-600">${(invoice.amount || invoice.total || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {invoices.length > 4 && (
        <p className="text-[10px] text-green-600 text-center mt-2">
          +{invoices.length - 4} more invoices
        </p>
      )}
    </motion.div>
  );
};

// ============================================
// SCHEDULE/SHIFTS CARD - Clickable, navigates to schedule
// ============================================
interface ScheduleEntry {
  id: string;
  job_name?: string;
  title?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  assigned_to?: string[];
  status?: string;
}

export const FastoInteractiveScheduleCard: React.FC<{
  schedules: ScheduleEntry[];
  title?: string;
  onNavigate?: (path: string) => void;
}> = ({ schedules, title = "Today's Schedule", onNavigate }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const path = '/admin?tab=workforce';
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      onClick={handleClick}
      whileHover="hover"
      whileTap="tap"
      className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 rounded-xl p-4 mt-2 max-w-full backdrop-blur-sm cursor-pointer group"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-purple-500/20 rounded-lg">
          <Calendar className="h-4 w-4 text-purple-600" />
        </div>
        <h4 className="font-medium text-sm">{title}</h4>
        <Badge variant="secondary" className="ml-auto text-[10px] bg-purple-500/20 text-purple-700">
          {schedules.length} jobs
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
        {schedules.slice(0, 4).map((schedule) => (
          <div key={schedule.id} className="flex items-center justify-between text-xs bg-background/50 rounded-lg px-2.5 py-1.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(schedule.status || 'active'))} />
              <span className="font-medium truncate">{schedule.job_name || schedule.title}</span>
            </div>
            {schedule.start_time && (
              <span className="text-muted-foreground text-[10px]">
                {schedule.start_time}
              </span>
            )}
            {schedule.assigned_to && schedule.assigned_to.length > 0 && (
              <div className="flex -space-x-1">
                {schedule.assigned_to.slice(0, 2).map((name, i) => (
                  <div key={i} className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[8px] font-medium text-purple-700 border border-background">
                    {name.charAt(0)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {schedules.length > 4 && (
        <p className="text-[10px] text-purple-600 text-center mt-2">
          +{schedules.length - 4} more scheduled
        </p>
      )}
    </motion.div>
  );
};

// ============================================
// LEAD CARD - Clickable, navigates to sales
// ============================================
interface LeadData {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  status?: string;
  source?: string;
  phone?: string;
  email?: string;
}

export const FastoInteractiveLeadCard: React.FC<{
  leads: LeadData[];
  title?: string;
  onNavigate?: (path: string) => void;
}> = ({ leads, title = 'Leads', onNavigate }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const path = '/admin?tab=sales';
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      onClick={handleClick}
      whileHover="hover"
      whileTap="tap"
      className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-4 mt-2 max-w-full backdrop-blur-sm cursor-pointer group"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-amber-500/20 rounded-lg">
          <Users className="h-4 w-4 text-amber-600" />
        </div>
        <h4 className="font-medium text-sm">{title}</h4>
        <Badge variant="secondary" className="ml-auto text-[10px] bg-amber-500/20 text-amber-700">
          {leads.length} leads
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
        {leads.slice(0, 4).map((lead) => {
          const displayName = lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown';
          return (
            <div key={lead.id} className="flex items-center justify-between text-xs bg-background/50 rounded-lg px-2.5 py-1.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(lead.status || 'new'))} />
                <span className="font-medium truncate">{displayName}</span>
              </div>
              {lead.status && (
                <Badge variant="outline" className="text-[9px] h-4 capitalize">
                  {lead.status.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {leads.length > 4 && (
        <p className="text-[10px] text-amber-600 text-center mt-2">
          +{leads.length - 4} more leads
        </p>
      )}
    </motion.div>
  );
};

// ============================================
// WORK ORDER CARD - Clickable, navigates to work orders
// ============================================
interface WorkOrderData {
  id: string;
  title?: string;
  wo_number?: string;
  status?: string;
  priority?: string;
  project_name?: string;
}

export const FastoInteractiveWorkOrderCard: React.FC<{
  workOrders: WorkOrderData[];
  title?: string;
  onNavigate?: (path: string) => void;
}> = ({ workOrders, title = 'Work Orders', onNavigate }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const path = '/admin?tab=project-management';
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      onClick={handleClick}
      whileHover="hover"
      whileTap="tap"
      className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border border-orange-500/20 rounded-xl p-4 mt-2 max-w-full backdrop-blur-sm cursor-pointer group"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-orange-500/20 rounded-lg">
          <Wrench className="h-4 w-4 text-orange-600" />
        </div>
        <h4 className="font-medium text-sm">{title}</h4>
        <Badge variant="secondary" className="ml-auto text-[10px] bg-orange-500/20 text-orange-700">
          {workOrders.length} orders
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
        {workOrders.slice(0, 4).map((wo) => (
          <div key={wo.id} className="flex items-center justify-between text-xs bg-background/50 rounded-lg px-2.5 py-1.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(wo.status || 'open'))} />
              <span className="font-medium truncate">{wo.title || wo.wo_number || `WO-${wo.id.slice(0, 6)}`}</span>
            </div>
            {wo.priority && (
              <Badge variant={wo.priority === 'high' ? 'destructive' : 'outline'} className="text-[9px] h-4 capitalize">
                {wo.priority}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {workOrders.length > 4 && (
        <p className="text-[10px] text-orange-600 text-center mt-2">
          +{workOrders.length - 4} more work orders
        </p>
      )}
    </motion.div>
  );
};

// ============================================
// DIRECTORY/CONTACTS CARD - Clickable, navigates to team/directory
// ============================================
interface ContactData {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  role?: string;
  phone?: string;
  email?: string;
  type?: string;
}

export const FastoInteractiveDirectoryCard: React.FC<{
  contacts: ContactData[];
  title?: string;
  onNavigate?: (path: string) => void;
}> = ({ contacts, title = 'Directory', onNavigate }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const path = '/admin?tab=team';
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      onClick={handleClick}
      whileHover="hover"
      whileTap="tap"
      className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 rounded-xl p-4 mt-2 max-w-full backdrop-blur-sm cursor-pointer group"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-indigo-500/20 rounded-lg">
          <User className="h-4 w-4 text-indigo-600" />
        </div>
        <h4 className="font-medium text-sm">{title}</h4>
        <Badge variant="secondary" className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-700">
          {contacts.length} contacts
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {contacts.slice(0, 6).map((contact) => {
          const displayName = contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.company_name || 'Unknown';
          const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          
          return (
            <div key={contact.id} className="flex items-center gap-1.5 px-2 py-1 bg-background/60 rounded-full">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[8px] font-medium text-indigo-700">
                {initials}
              </div>
              <span className="text-[10px] font-medium truncate max-w-[80px]">{displayName}</span>
            </div>
          );
        })}
        {contacts.length > 6 && (
          <div className="px-2 py-1 bg-background/60 rounded-full">
            <span className="text-[10px] text-muted-foreground">+{contacts.length - 6} more</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// PDF REPORT CARD - With working download
// ============================================
export const FastoInteractivePdfCard: React.FC<{
  reportType: 'timesheet' | 'invoice' | 'proposal' | 'project_summary';
  title: string;
  subtitle?: string;
  data: any;
}> = ({ reportType, title, subtitle, data }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const reportConfig = {
    timesheet: { icon: Calendar, color: 'blue', label: 'Timesheet' },
    invoice: { icon: Receipt, color: 'green', label: 'Invoice' },
    proposal: { icon: FileText, color: 'purple', label: 'Proposal' },
    project_summary: { icon: Building2, color: 'amber', label: 'Summary' }
  };

  const config = reportConfig[reportType] || reportConfig.timesheet;
  const Icon = config.icon;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGenerating(true);
    
    try {
      switch (reportType) {
        case 'timesheet': {
          if (data.is_batch && data.timesheets && Array.isArray(data.timesheets)) {
            for (const ts of data.timesheets) {
              if (ts.entries?.length > 0 || ts.totalRegularHours > 0) {
                const weekStart = data.weekStart ? parseISO(data.weekStart) : startOfWeek(new Date(), { weekStartsOn: 1 });
                generateTimesheetPdf({
                  employeeName: ts.employeeName,
                  classCode: ts.classCode || null,
                  weekStart,
                  entries: ts.entries || [],
                  totalRegularHours: ts.totalRegularHours || 0,
                  totalBreakMinutes: ts.totalBreakMinutes || 0,
                });
              }
            }
            toast.success(`${data.timesheets.length} timesheet PDFs downloaded`);
          } else {
            if (!data.entries || !data.employeeName) {
              throw new Error('Missing timesheet data');
            }
            const weekStart = data.weekStart ? parseISO(data.weekStart) : startOfWeek(new Date(), { weekStartsOn: 1 });
            generateTimesheetPdf({
              employeeName: data.employeeName,
              classCode: data.classCode || null,
              weekStart,
              entries: data.entries || [],
              totalRegularHours: data.totalRegularHours || 0,
              totalBreakMinutes: data.totalBreakMinutes || 0,
            });
            toast.success(`Timesheet for ${data.employeeName} downloaded`);
          }
          break;
        }
        
        case 'invoice': {
          if (!data.invoiceNumber) throw new Error('Missing invoice data');
          downloadInvoice({
            invoiceNumber: data.invoiceNumber,
            date: data.date || format(new Date(), 'MM/dd/yyyy'),
            dueDate: data.dueDate || format(new Date(), 'MM/dd/yyyy'),
            customerName: data.customerName || 'Customer',
            customerContact: data.customerContact || '',
            projectAddress: data.projectAddress || '',
            projectNumber: data.projectNumber || '',
            description: data.description || 'Roofing Services',
            total: data.total || 0,
            tax: data.tax || 0,
            paymentMethod: data.paymentMethod || null,
            creditCardFee: data.creditCardFee || 0,
            balanceDue: data.balanceDue || data.total || 0,
          });
          toast.success(`Invoice #${data.invoiceNumber} downloaded`);
          break;
        }
        
        case 'proposal': {
          if (!data.proposal) throw new Error('Missing proposal data');
          await generateProposalPDF({
            proposal: data.proposal,
            quotes: data.quotes || [],
            pricingItems: data.pricingItems || [],
            comparisonBlocks: data.comparisonBlocks || [],
          });
          toast.success(`Proposal #${data.proposal.proposal_number} downloaded`);
          break;
        }
        
        case 'project_summary': {
          const { default: jsPDF } = await import('jspdf');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pageWidth = pdf.internal.pageSize.getWidth();
          const margin = 15;
          let y = 20;
          
          pdf.setFillColor(30, 58, 138);
          pdf.rect(0, 0, pageWidth, 40, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(20);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Project Summary', margin, 25);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(format(new Date(), 'MMMM d, yyyy'), pageWidth - margin, 25, { align: 'right' });
          
          y = 55;
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(data.project?.name || 'Project', margin, y);
          y += 8;
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          if (data.project?.address) {
            pdf.text(data.project.address, margin, y);
            y += 6;
          }
          if (data.project?.customer_name) {
            pdf.text(`Customer: ${data.project.customer_name}`, margin, y);
            y += 6;
          }
          pdf.text(`Status: ${data.project?.status || 'N/A'}`, margin, y);
          
          const filename = `project_summary_${(data.project?.name || 'project').replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
          pdf.save(filename);
          toast.success(`Project summary downloaded`);
          break;
        }
        
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className={`bg-gradient-to-br from-${config.color}-500/10 via-${config.color}-500/5 to-transparent border border-${config.color}-500/20 rounded-xl p-4 mt-2 max-w-full backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 bg-${config.color}-500/20 rounded-lg`}>
          <Icon className={`h-5 w-5 text-${config.color}-600`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{title}</h4>
            <Badge variant="outline" className="text-[10px] capitalize">
              {config.label}
            </Badge>
          </div>
          
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mb-2">{subtitle}</p>
          )}
          
          {/* Quick stats */}
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mb-3">
            {reportType === 'timesheet' && data.is_batch && data.totalEmployees && (
              <span className="flex items-center gap-1 bg-background/50 px-1.5 py-0.5 rounded">
                <User className="w-3 h-3" />
                {data.totalEmployees} employees
              </span>
            )}
            {reportType === 'timesheet' && data.totalRegularHours && (
              <span className="flex items-center gap-1 bg-background/50 px-1.5 py-0.5 rounded">
                <Clock className="w-3 h-3" />
                {typeof data.totalRegularHours === 'number' ? data.totalRegularHours.toFixed(1) : data.totalRegularHours} hrs
              </span>
            )}
            {reportType === 'timesheet' && !data.is_batch && data.employeeName && (
              <span className="flex items-center gap-1 bg-background/50 px-1.5 py-0.5 rounded">
                <User className="w-3 h-3" />
                {data.employeeName}
              </span>
            )}
          </div>
          
          <Button 
            size="sm" 
            onClick={handleDownload}
            disabled={isGenerating}
            className="h-8 gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// GENERIC STATS CARD - For dashboard stats
// ============================================
export const FastoInteractiveStatsCard: React.FC<{
  stats: Record<string, any>;
  title?: string;
  onNavigate?: (path: string) => void;
}> = ({ stats, title = 'Dashboard Stats', onNavigate }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const path = '/admin';
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const statItems = Object.entries(stats)
    .filter(([key, value]) => {
      // Skip objects, arrays, and functions - only keep primitive values
      if (value === null || value === undefined) return false;
      if (typeof value === 'object') return false;
      if (typeof value === 'function') return false;
      return true;
    })
    .slice(0, 6)
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: typeof value === 'number' ? value.toLocaleString() : String(value)
    }));

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      onClick={handleClick}
      whileHover="hover"
      whileTap="tap"
      className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 mt-2 max-w-full backdrop-blur-sm cursor-pointer group"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-primary/20 rounded-lg">
          <Briefcase className="h-4 w-4 text-primary" />
        </div>
        <h4 className="font-medium text-sm">{title}</h4>
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {statItems.map((item, idx) => (
          <div key={idx} className="bg-background/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-primary">{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
