import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Package,
  FileText,
  Download,
  Loader2,
  User,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { generateTimesheetPdf } from '@/components/admin/workforce/generateTimesheetPdf';
import { downloadInvoice } from '@/lib/invoiceGenerator';
import { generateProposalPDF } from '@/lib/proposalPdfGenerator';
import { format, parseISO, startOfWeek } from 'date-fns';

// Types for structured data from agent responses
export interface VisualCardData {
  type: 'stats' | 'chart' | 'projects' | 'attendance' | 'success' | 'form' | 'list';
  title?: string;
  data: any;
}

interface StatsData {
  projects?: { total?: number; active?: number; completed?: number };
  leads?: { total?: number; new?: number };
  revenue?: { total?: number; outstanding?: number };
  team?: { total?: number; clockedIn?: number };
}

interface ProjectData {
  id: string;
  name: string;
  status: string;
  progress?: number;
  dueDate?: string;
}

interface AttendanceEntry {
  name: string;
  hours: number;
  status: 'clocked-in' | 'clocked-out';
}

// Stats Grid Component
export const FastoStatsCard: React.FC<{ stats: StatsData }> = ({ stats }) => {
  const items = [
    { 
      label: 'Active Projects', 
      value: stats.projects?.active || 0, 
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10'
    },
    { 
      label: 'Completed', 
      value: stats.projects?.completed || 0, 
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-500/10'
    },
    { 
      label: 'New Leads', 
      value: stats.leads?.new || 0, 
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10'
    },
    { 
      label: 'Team Active', 
      value: stats.team?.clockedIn || stats.team?.total || 0, 
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-500/10'
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card key={idx} className={cn("border shadow-sm", item.bg)}>
            <CardContent className="p-2 flex items-center gap-2">
              <Icon className={cn("w-4 h-4", item.color)} />
              <div>
                <div className={cn("text-lg font-bold", item.color)}>{item.value}</div>
                <div className="text-[10px] text-muted-foreground">{item.label}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {stats.revenue && (
        <Card className="col-span-2 border shadow-sm bg-gradient-to-r from-primary/10 to-transparent">
          <CardContent className="p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <div>
                <div className="text-[10px] text-muted-foreground">Revenue</div>
                <div className="text-sm font-bold">${(stats.revenue.total || 0).toLocaleString()}</div>
              </div>
            </div>
            {stats.revenue.outstanding !== undefined && stats.revenue.outstanding > 0 && (
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">Outstanding</div>
                <div className="text-xs font-medium text-amber-600">
                  ${stats.revenue.outstanding.toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Projects List Component
export const FastoProjectsCard: React.FC<{ projects: ProjectData[]; title?: string }> = ({ 
  projects, 
  title = 'Projects' 
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'in_progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'on_hold':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="mt-2 border shadow-sm">
      <CardContent className="p-2 space-y-2">
        <div className="flex items-center gap-2 pb-1 border-b">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">{title}</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{projects.length} total</span>
        </div>
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {projects.slice(0, 5).map((project) => (
            <div key={project.id} className="flex items-center gap-2 text-xs">
              <div className={cn("w-2 h-2 rounded-full", getStatusColor(project.status))} />
              <span className="flex-1 truncate font-medium">{project.name}</span>
              {project.progress !== undefined && (
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{project.progress}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
        {projects.length > 5 && (
          <div className="text-[10px] text-muted-foreground text-center pt-1 border-t">
            +{projects.length - 5} more projects
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Attendance Card Component
export const FastoAttendanceCard: React.FC<{ 
  entries: AttendanceEntry[]; 
  title?: string;
  totalHours?: number;
}> = ({ entries, title = 'Today\'s Attendance', totalHours }) => {
  const clockedIn = entries.filter(e => e.status === 'clocked-in').length;

  return (
    <Card className="mt-2 border shadow-sm">
      <CardContent className="p-2 space-y-2">
        <div className="flex items-center gap-2 pb-1 border-b">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">{title}</span>
          <span className="text-[10px] text-green-600 ml-auto">{clockedIn} clocked in</span>
        </div>
        
        {totalHours !== undefined && (
          <div className="flex items-center justify-between bg-muted/50 rounded p-1.5">
            <span className="text-[10px] text-muted-foreground">Total Hours</span>
            <span className="text-sm font-bold text-primary">{totalHours}h</span>
          </div>
        )}

        <div className="space-y-1 max-h-24 overflow-y-auto">
          {entries.slice(0, 4).map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <div className={cn(
                "w-2 h-2 rounded-full",
                entry.status === 'clocked-in' ? 'bg-green-500' : 'bg-gray-400'
              )} />
              <span className="flex-1 truncate">{entry.name}</span>
              <span className="text-muted-foreground">{entry.hours}h</span>
            </div>
          ))}
        </div>
        {entries.length > 4 && (
          <div className="text-[10px] text-muted-foreground text-center">
            +{entries.length - 4} more
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Success Card Component
export const FastoSuccessCard: React.FC<{ 
  message: string; 
  details?: Record<string, string>;
}> = ({ message, details }) => {
  return (
    <Card className="mt-2 border shadow-sm bg-green-500/10 border-green-500/30">
      <CardContent className="p-2 space-y-1.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-xs font-medium text-green-700">Success</span>
        </div>
        <p className="text-xs text-foreground">{message}</p>
        {details && Object.keys(details).length > 0 && (
          <div className="grid grid-cols-2 gap-1 pt-1 border-t border-green-500/20">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="text-[10px]">
                <span className="text-muted-foreground">{key}: </span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Form Request Card Component
export const FastoFormCard: React.FC<{ 
  message: string;
  fields: Array<{ name: string; required?: boolean }>;
}> = ({ message, fields }) => {
  return (
    <Card className="mt-2 border shadow-sm bg-blue-500/10 border-blue-500/30">
      <CardContent className="p-2 space-y-1.5">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">Information Needed</span>
        </div>
        <p className="text-xs text-foreground">{message}</p>
        <div className="flex flex-wrap gap-1 pt-1">
          {fields.map((field) => (
            <span 
              key={field.name}
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded",
                field.required 
                  ? "bg-blue-500/20 text-blue-700" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {field.name}{field.required && '*'}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Agent Routing Indicator
export const FastoAgentIndicator: React.FC<{ 
  agentType: string;
  agentName: string;
  agentIcon: string;
  agentColor: string;
}> = ({ agentType, agentName, agentIcon, agentColor }) => {
  return (
    <div 
      className="inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full mb-1"
      style={{ backgroundColor: `${agentColor}20` }}
    >
      <span>{agentIcon}</span>
      <span className="font-medium" style={{ color: agentColor }}>{agentName}</span>
    </div>
  );
};

// PDF Report Card Component for Fasto
export const FastoPdfReportCard: React.FC<{
  reportType: 'timesheet' | 'invoice' | 'proposal' | 'project_summary';
  title: string;
  subtitle?: string;
  data: any;
}> = ({ reportType, title, subtitle, data }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const reportIcons = {
    timesheet: Calendar,
    invoice: Receipt,
    proposal: FileText,
    project_summary: Building2,
  };

  const reportColors = {
    timesheet: 'bg-blue-500/10 text-blue-600 border-blue-200',
    invoice: 'bg-green-500/10 text-green-600 border-green-200',
    proposal: 'bg-purple-500/10 text-purple-600 border-purple-200',
    project_summary: 'bg-amber-500/10 text-amber-600 border-amber-200',
  };

  const Icon = reportIcons[reportType] || FileText;

  const handleDownload = async () => {
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
    <Card className={`p-3 border ${reportColors[reportType]} transition-all hover:shadow-md mt-2`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${reportColors[reportType].split(' ')[0]}`}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-xs truncate">{title}</h4>
            <Badge variant="outline" className="text-[10px] capitalize">
              {reportType.replace('_', ' ')}
            </Badge>
          </div>
          
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mb-2">{subtitle}</p>
          )}
          
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mb-2">
            {reportType === 'timesheet' && data.is_batch && data.totalEmployees && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {data.totalEmployees} employees
              </span>
            )}
            {reportType === 'timesheet' && data.totalRegularHours && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {data.totalRegularHours.toFixed(1)} hrs
              </span>
            )}
            {reportType === 'timesheet' && !data.is_batch && data.employeeName && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {data.employeeName}
              </span>
            )}
          </div>
          
          <Button 
            size="sm" 
            onClick={handleDownload}
            disabled={isGenerating}
            className="h-7 text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-3 h-3 mr-1.5" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Parse structured data from response and render appropriate card
export const parseAndRenderVisualCards = (
  structuredData: any,
  agentType?: string,
  agentConfig?: { name: string; icon: string; color: string }
): React.ReactNode => {
  if (!structuredData) return null;

  const elements: React.ReactNode[] = [];

  // Add agent indicator if available
  if (agentType && agentConfig) {
    elements.push(
      <FastoAgentIndicator
        key="agent"
        agentType={agentType}
        agentName={agentConfig.name}
        agentIcon={agentConfig.icon}
        agentColor={agentConfig.color}
      />
    );
  }

  // Handle PDF report visual type
  if (structuredData.visual_type === 'pdf_report' && structuredData.report_data) {
    elements.push(
      <FastoPdfReportCard
        key="pdf-report"
        reportType={structuredData.report_type || 'timesheet'}
        title={structuredData.title || 'Report Ready'}
        subtitle={structuredData.subtitle}
        data={structuredData.report_data}
      />
    );
  }

  // Parse different types of structured data
  if (structuredData.stats) {
    elements.push(<FastoStatsCard key="stats" stats={structuredData.stats} />);
  }

  if (structuredData.projects && Array.isArray(structuredData.projects)) {
    elements.push(
      <FastoProjectsCard 
        key="projects" 
        projects={structuredData.projects}
        title={structuredData.projectsTitle}
      />
    );
  }

  if (structuredData.attendance && Array.isArray(structuredData.attendance)) {
    elements.push(
      <FastoAttendanceCard 
        key="attendance" 
        entries={structuredData.attendance}
        title={structuredData.attendanceTitle}
        totalHours={structuredData.totalHours}
      />
    );
  }

  if (structuredData.success) {
    elements.push(
      <FastoSuccessCard 
        key="success" 
        message={structuredData.success.message}
        details={structuredData.success.details}
      />
    );
  }

  if (structuredData.form) {
    elements.push(
      <FastoFormCard 
        key="form" 
        message={structuredData.form.message}
        fields={structuredData.form.fields}
      />
    );
  }

  return elements.length > 0 ? <div className="space-y-2">{elements}</div> : null;
};
