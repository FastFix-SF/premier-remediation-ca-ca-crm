import React, { useState } from 'react';
import { FileText, Download, Loader2, Calendar, User, Building2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generateTimesheetPdf } from '@/components/admin/workforce/generateTimesheetPdf';
import { generateInvoicePDF, downloadInvoice } from '@/lib/invoiceGenerator';
import { generateProposalPDF } from '@/lib/proposalPdfGenerator';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';

interface PdfReportCardProps {
  reportType: 'timesheet' | 'invoice' | 'proposal' | 'project_summary';
  title: string;
  subtitle?: string;
  data: any;
}

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

export const PdfReportCard: React.FC<PdfReportCardProps> = ({
  reportType,
  title,
  subtitle,
  data,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const Icon = reportIcons[reportType] || FileText;

  const handleDownload = async () => {
    setIsGenerating(true);
    
    try {
      switch (reportType) {
        case 'timesheet': {
          // Check if this is a batch (all employees) request
          if (data.is_batch && data.timesheets && Array.isArray(data.timesheets)) {
            // Generate PDF for each employee
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
            toast({
              title: 'Timesheets Downloaded',
              description: `${data.timesheets.length} timesheet PDFs have been downloaded.`,
            });
          } else {
            // Single employee timesheet
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
            
            toast({
              title: 'Timesheet Downloaded',
              description: `PDF for ${data.employeeName} has been downloaded.`,
            });
          }
          break;
        }
        
        case 'invoice': {
          if (!data.invoiceNumber) {
            throw new Error('Missing invoice data');
          }
          
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
          
          toast({
            title: 'Invoice Downloaded',
            description: `Invoice #${data.invoiceNumber} has been downloaded.`,
          });
          break;
        }
        
        case 'proposal': {
          if (!data.proposal) {
            throw new Error('Missing proposal data');
          }
          
          await generateProposalPDF({
            proposal: data.proposal,
            quotes: data.quotes || [],
            pricingItems: data.pricingItems || [],
            comparisonBlocks: data.comparisonBlocks || [],
          });
          
          toast({
            title: 'Proposal Downloaded',
            description: `Proposal #${data.proposal.proposal_number} has been downloaded.`,
          });
          break;
        }
        
        case 'project_summary': {
          // Generate a simple project summary using jsPDF
          const { default: jsPDF } = await import('jspdf');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pageWidth = pdf.internal.pageSize.getWidth();
          const margin = 15;
          let y = 20;
          
          // Header
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
          
          // Project Info
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
          y += 15;
          
          // Financials
          if (data.financials) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Financial Summary', margin, y);
            y += 8;
            
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            
            const financials = [
              ['Total Invoiced', `$${(data.financials.total_invoiced || 0).toLocaleString()}`],
              ['Total Paid', `$${(data.financials.total_paid || 0).toLocaleString()}`],
              ['Balance Due', `$${(data.financials.total_due || 0).toLocaleString()}`],
              ['Material Cost', `$${(data.financials.material_cost || 0).toLocaleString()}`],
              ['Profit', `$${(data.financials.profit || 0).toLocaleString()}`],
              ['Profit Margin', `${data.financials.profit_margin || 0}%`],
            ];
            
            financials.forEach(([label, value]) => {
              pdf.text(label, margin, y);
              pdf.text(value, margin + 60, y);
              y += 6;
            });
          }
          
          const filename = `project_summary_${(data.project?.name || 'project').replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
          pdf.save(filename);
          
          toast({
            title: 'Project Summary Downloaded',
            description: `Summary for ${data.project?.name || 'project'} has been downloaded.`,
          });
          break;
        }
        
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className={`p-4 border ${reportColors[reportType]} transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg ${reportColors[reportType].split(' ')[0]}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">{title}</h4>
            <Badge variant="outline" className="text-xs capitalize">
              {reportType.replace('_', ' ')}
            </Badge>
          </div>
          
          {subtitle && (
            <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
          )}
          
          {/* Quick stats based on report type */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
            {reportType === 'timesheet' && data.is_batch && data.totalEmployees && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {data.totalEmployees} employees
              </span>
            )}
            {reportType === 'timesheet' && data.is_batch && data.totalRegularHours && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {data.totalRegularHours.toFixed(1)} total hrs
              </span>
            )}
            {reportType === 'timesheet' && !data.is_batch && data.totalRegularHours && (
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
            {reportType === 'invoice' && data.total && (
              <span className="font-medium text-foreground">
                ${data.total.toLocaleString()}
              </span>
            )}
            {reportType === 'project_summary' && data.financials?.total_invoiced && (
              <span className="font-medium text-foreground">
                ${data.financials.total_invoiced.toLocaleString()} total
              </span>
            )}
          </div>
          
          <Button 
            size="sm" 
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
