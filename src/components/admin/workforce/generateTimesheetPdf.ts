import jsPDF from 'jspdf';
import { format, parseISO, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
  break_time_minutes: number;
  project_name?: string;
  status: string;
  notes?: string;
}

interface TimesheetPdfData {
  employeeName: string;
  classCode?: string | null;
  weekStart: Date;
  entries: TimeEntry[];
  totalRegularHours: number;
  totalBreakMinutes: number;
}

export const generateTimesheetPdf = (data: TimesheetPdfData): void => {
  const { employeeName, classCode, weekStart, entries, totalRegularHours, totalBreakMinutes } = data;
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Use portrait for more compact view
  const doc = new jsPDF('portrait', 'mm', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  // Helper functions
  const formatHours = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  let currentY = margin;

  // === HEADER SECTION ===
  // Avatar circle
  const initials = getInitials(employeeName);
  doc.setFillColor(59, 130, 246); // Blue
  doc.circle(margin + 6, currentY + 6, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(initials, margin + 6, currentY + 7.5, { align: 'center' });

  // Employee name and class code
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(employeeName, margin + 15, currentY + 5);
  
  if (classCode) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(classCode, margin + 15, currentY + 10);
  }

  // Date range on right
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  const dateRangeText = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  doc.text(dateRangeText, pageWidth - margin, currentY + 5, { align: 'right' });

  currentY += 18;

  // === SUMMARY ROW ===
  const summaryBoxHeight = 14;
  const summaryItems = [
    { label: 'Work Hours', value: formatHours(totalRegularHours), bg: '#DCFCE7', text: '#166534' },
    { label: 'Regular', value: formatHours(totalRegularHours), bg: '#DBEAFE', text: '#1E40AF' },
    { label: 'Overtime', value: '0:00', bg: '#FEF3C7', text: '#92400E' },
    { label: 'Unpaid Break', value: formatHours(totalBreakMinutes / 60), bg: '#F3F4F6', text: '#374151' },
  ];
  
  const summaryBoxWidth = contentWidth / summaryItems.length - 2;
  
  summaryItems.forEach((item, i) => {
    const boxX = margin + (i * (summaryBoxWidth + 2.5));
    const rgb = hexToRgb(item.bg);
    if (rgb) doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.roundedRect(boxX, currentY, summaryBoxWidth, summaryBoxHeight, 2, 2, 'F');
    
    const txtRgb = hexToRgb(item.text);
    if (txtRgb) doc.setTextColor(txtRgb.r, txtRgb.g, txtRgb.b);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, boxX + summaryBoxWidth / 2, currentY + 6, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, boxX + summaryBoxWidth / 2, currentY + 11, { align: 'center' });
  });

  currentY += summaryBoxHeight + 6;

  // === TABLE ===
  const colWidths = [26, 32, 38, 26, 26, 22, 22]; // Day, Job, Class Code, In, Out, Hours, Daily
  const headers = ['Day', 'Job', 'Class Code', 'In', 'Out', 'Hours', 'Daily'];
  const rowHeight = 8;
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableX = (pageWidth - tableWidth) / 2; // Center the table

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(tableX, currentY, tableWidth, rowHeight, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(tableX, currentY, tableWidth, rowHeight);
  
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  
  let colX = tableX;
  headers.forEach((header, i) => {
    doc.text(header, colX + colWidths[i] / 2, currentY + 5.5, { align: 'center' });
    colX += colWidths[i];
  });

  currentY += rowHeight;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  daysInWeek.forEach((day, rowIndex) => {
    const rowY = currentY + (rowIndex * rowHeight);
    const dayEntries = entries.filter(e => {
      const entryDate = parseISO(e.clock_in);
      return format(entryDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });

    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(tableX, rowY, tableWidth, rowHeight, 'F');
    }

    // Row border
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.rect(tableX, rowY, tableWidth, rowHeight);

    colX = tableX;
    doc.setTextColor(55, 65, 81);

    // Day
    const dayText = format(day, 'EEE M/d');
    doc.setFont('helvetica', 'bold');
    doc.text(dayText, colX + colWidths[0] / 2, rowY + 5.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    colX += colWidths[0];

    if (dayEntries.length > 0) {
      const entry = dayEntries[0];
      const dailyTotal = dayEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
      
      // Job
      const jobText = entry.project_name || '--';
      doc.text(jobText.substring(0, 12), colX + colWidths[1] / 2, rowY + 5.5, { align: 'center' });
      colX += colWidths[1];

      // Class Code
      doc.setTextColor(100, 116, 139);
      doc.text((classCode || '--').substring(0, 14), colX + colWidths[2] / 2, rowY + 5.5, { align: 'center' });
      doc.setTextColor(55, 65, 81);
      colX += colWidths[2];

      // Clock in
      const clockIn = entry.clock_in ? format(parseISO(entry.clock_in), 'h:mma').toLowerCase() : '--';
      doc.text(clockIn, colX + colWidths[3] / 2, rowY + 5.5, { align: 'center' });
      colX += colWidths[3];

      // Clock out
      const clockOut = entry.clock_out ? format(parseISO(entry.clock_out), 'h:mma').toLowerCase() : '--';
      doc.text(clockOut, colX + colWidths[4] / 2, rowY + 5.5, { align: 'center' });
      colX += colWidths[4];

      // Total hours
      doc.text(formatHours(entry.total_hours || 0), colX + colWidths[5] / 2, rowY + 5.5, { align: 'center' });
      colX += colWidths[5];

      // Daily total
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(formatHours(dailyTotal), colX + colWidths[6] / 2, rowY + 5.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
    } else {
      // Empty day
      for (let i = 1; i < headers.length; i++) {
        doc.setTextColor(156, 163, 175);
        doc.text('--', colX + colWidths[i] / 2, rowY + 5.5, { align: 'center' });
        colX += colWidths[i];
      }
      doc.setTextColor(55, 65, 81);
    }
  });

  currentY += (daysInWeek.length * rowHeight) + 4;

  // === TOTALS ROW ===
  doc.setFillColor(30, 64, 175);
  doc.roundedRect(tableX, currentY, tableWidth, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('WEEK TOTAL', tableX + 50, currentY + 6.5, { align: 'center' });
  doc.text(formatHours(totalRegularHours), tableX + tableWidth - 25, currentY + 6.5, { align: 'center' });

  // Save the PDF
  const fileName = `timesheet_${employeeName.replace(/\s+/g, '_')}_${format(weekStart, 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};
