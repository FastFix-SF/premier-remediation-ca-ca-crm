import jsPDF from 'jspdf';
import { companyConfig } from '@/config/company';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerContact: string;
  projectAddress: string;
  projectNumber: string;
  description: string;
  total: number;
  tax?: number;
  paymentMethod?: 'check' | 'zelle' | 'credit_card' | 'ach' | null;
  creditCardFee?: number;
  balanceDue?: number;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyLicense?: string;
  companyBusiness?: string;
}

export const generateInvoicePDF = (data: InvoiceData) => {
  const pdf = new jsPDF('p', 'pt', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Colors
  const darkGray = '#333333';
  const lightGray = '#666666';
  const tableHeaderBg = '#E8E8E8';
  
  // Company defaults from centralized config
  const companyName = data.companyName || companyConfig.name;
  const companyAddress = data.companyAddress || companyConfig.address.full;
  const companyPhone = data.companyPhone || companyConfig.phone;
  const companyLicense = data.companyLicense || companyConfig.licenseNumber;
  const companyBusiness = data.companyBusiness || 'Business # 47-3833936';
  
  // Helper functions
  const drawTableRow = (y: number, col1: string, col2: string, isBold = false, bgColor?: string) => {
    if (bgColor) {
      pdf.setFillColor(bgColor);
      pdf.rect(30, y, pageWidth - 60, 20, 'F');
    }
    
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setFontSize(10);
    pdf.text(col1, 35, y + 13);
    pdf.text(col2, pageWidth - 35, y + 13, { align: 'right' });
  };
  
  // PAGE 1
  // Header - Company info (logo placeholder - would be added here)
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(darkGray);
  pdf.text('244 Jackson St., Hayward, CA 94544', 40, 75);
  pdf.text('(510) 999-7663', 40, 85);
  pdf.text('Lic.# 1067709', 40, 95);
  
  // Invoice Info Table (top right)
  pdf.setTextColor(darkGray);
  const infoX = pageWidth - 280;
  
  // Header row
  pdf.setFillColor(tableHeaderBg);
  pdf.rect(infoX, 40, 250, 20, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('INVOICE #', infoX + 10, 53);
  pdf.text('DATE', infoX + 95, 53);
  pdf.text('DUE', infoX + 180, 53);
  
  // Data row
  pdf.setDrawColor(200);
  pdf.rect(infoX, 40, 250, 40, 'S');
  pdf.rect(infoX, 60, 250, 20, 'S');
  pdf.line(infoX + 85, 40, infoX + 85, 80);
  pdf.line(infoX + 170, 40, infoX + 170, 80);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(data.invoiceNumber, infoX + 10, 73);
  pdf.text(data.date, infoX + 95, 73);
  pdf.text(data.dueDate, infoX + 180, 73);
  
  // Customer and Project sections
  let currentY = 140;
  
  // Customer section
  pdf.setFillColor(tableHeaderBg);
  pdf.rect(30, currentY, 268, 18, 'F');
  pdf.setDrawColor(200);
  pdf.rect(30, currentY, 268, 18, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(darkGray);
  pdf.text('CUSTOMER', 35, currentY + 12);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(data.customerName, 35, currentY + 30);
  pdf.text(data.customerContact, 35, currentY + 42);
  
  // Project section
  pdf.setFillColor(tableHeaderBg);
  pdf.rect(308, currentY, 274, 18, 'F');
  pdf.setDrawColor(200);
  pdf.rect(308, currentY, 274, 18, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('PROJECT', 313, currentY + 12);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const addressLines = pdf.splitTextToSize(data.projectAddress, 260);
  let projectY = currentY + 30;
  addressLines.forEach((line: string) => {
    pdf.text(line, 313, projectY);
    projectY += 12;
  });
  pdf.text(`PROJECT #: ${data.projectNumber}`, 313, projectY);
  
  // Description section
  currentY = 230;
  pdf.setFillColor(tableHeaderBg);
  pdf.rect(30, currentY, pageWidth - 60, 18, 'F');
  pdf.setDrawColor(200);
  pdf.rect(30, currentY, pageWidth - 60, 18, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('DESCRIPTION', 35, currentY + 12);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const descLines = pdf.splitTextToSize(data.description, pageWidth - 80);
  let descY = currentY + 30;
  descLines.forEach((line: string) => {
    pdf.text(line, 35, descY);
    descY += 12;
  });
  
  // Line items table
  currentY = descY + 20;
  pdf.setFillColor(tableHeaderBg);
  pdf.rect(30, currentY, pageWidth - 60, 18, 'F');
  pdf.setDrawColor(200);
  pdf.rect(30, currentY, pageWidth - 60, 18, 'S');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Item', 35, currentY + 12);
  pdf.text('Total', pageWidth - 35, currentY + 12, { align: 'right' });
  
  currentY += 18;
  pdf.rect(30, currentY, pageWidth - 60, 18, 'S');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Total', 35, currentY + 12);
  pdf.text(`$${data.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 35, currentY + 12, { align: 'right' });
  
  // Payment Methods Section
  currentY += 30;
  pdf.setFillColor(tableHeaderBg);
  pdf.rect(30, currentY, pageWidth - 60, 18, 'F');
  pdf.setDrawColor(200);
  pdf.rect(30, currentY, pageWidth - 60, 18, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Payment Methods', 35, currentY + 12);
  
  currentY += 25;
  const paymentMethods = [
    { id: 'check', label: 'Check: Payable to The Roofing Friend, INC' },
    { id: 'zelle', label: 'Zelle: roofingfriend@gmail.com' },
    { id: 'credit_card', label: 'Credit Card: with credit card process fees.' },
    { id: 'ach', label: 'ACH Payment.' }
  ];
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  // Draw in two columns
  const leftCol = 40;
  const rightCol = 310;
  
  paymentMethods.forEach((method, index) => {
    const xPos = index < 2 ? leftCol : rightCol;
    const yPos = currentY + (index % 2) * 20;
    
    // Draw checkbox
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);
    pdf.rect(xPos, yPos - 3, 8, 8, 'S');
    
    // Fill checkbox if selected
    if (data.paymentMethod === method.id) {
      pdf.setFillColor(0, 0, 0);
      pdf.rect(xPos + 1.5, yPos - 1.5, 5, 5, 'F');
    }
    
    pdf.text(method.label, xPos + 13, yPos + 4);
  });
  
  currentY += 45;
  
  // Totals section
  const totalsX = pageWidth - 180;
  const subtotal = data.total;
  const tax = data.tax || 0;
  const creditCardFee = data.creditCardFee || 0;
  const total = subtotal + tax + creditCardFee;
  const balanceDue = data.balanceDue || total;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Subtotal', totalsX, currentY);
  pdf.text(`$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 35, currentY, { align: 'right' });
  
  currentY += 12;
  pdf.text('Tax: (0%)', totalsX, currentY);
  pdf.text(`$${tax.toFixed(2)}`, pageWidth - 35, currentY, { align: 'right' });
  
  if (creditCardFee > 0) {
    currentY += 12;
    pdf.text('Credit Card Fee (3%)', totalsX, currentY);
    pdf.text(`$${creditCardFee.toFixed(2)}`, pageWidth - 35, currentY, { align: 'right' });
  }
  
  currentY += 12;
  pdf.text('Total', totalsX, currentY);
  pdf.text(`$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 35, currentY, { align: 'right' });
  
  currentY += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Balance Due', totalsX, currentY);
  pdf.text(`$${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 35, currentY, { align: 'right' });
  
  // Payment logos and link
  currentY += 20;
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 255);
  pdf.textWithLink('Pay Online', pageWidth - 35, currentY, { 
    align: 'right',
    url: `${window.location.origin}/invoice/${data.invoiceNumber}`
  });
  
  currentY += 12;
  pdf.setTextColor(darkGray);
  pdf.setFontSize(8);
  pdf.text('Mastercard • Visa • Discover • Amex', pageWidth - 35, currentY, { align: 'right' });
  
  // No Terms & Conditions on page 1 to match reference
  
  // Footer
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(lightGray);
  const footerText = `The Roofing Friend Inc., Phone: ${companyPhone}`;
  const footerText2 = `244 Jackson st., Hayward, CA 94544, ${companyLicense}, ${companyBusiness}`;
  pdf.text(footerText, pageWidth / 2, pageHeight - 35, { align: 'center' });
  pdf.text(footerText2, pageWidth / 2, pageHeight - 25, { align: 'center' });
  pdf.text('Page 1', 35, pageHeight - 25);
  
  // PAGE 2
  pdf.addPage();
  
  // Header on page 2
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(darkGray);
  pdf.text('244 Jackson St., Hayward, CA 94544', 40, 75);
  pdf.text('(510) 999-7663', 40, 85);
  pdf.text('Lic.# 1067709', 40, 95);
  
  // Invoice info on page 2
  pdf.setTextColor(darkGray);
  pdf.setFillColor(tableHeaderBg);
  pdf.rect(infoX, 40, 250, 20, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('INVOICE #', infoX + 10, 53);
  pdf.text('DATE', infoX + 95, 53);
  pdf.text('DUE', infoX + 180, 53);
  
  pdf.setDrawColor(200);
  pdf.rect(infoX, 40, 250, 40, 'S');
  pdf.rect(infoX, 60, 250, 20, 'S');
  pdf.line(infoX + 85, 40, infoX + 85, 80);
  pdf.line(infoX + 170, 40, infoX + 170, 80);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(data.invoiceNumber, infoX + 10, 73);
  pdf.text(data.date, infoX + 95, 73);
  pdf.text(data.dueDate, infoX + 180, 73);
  
  // Terms & Conditions section
  currentY = 120;
  pdf.setFillColor(tableHeaderBg);
  pdf.rect(30, currentY, pageWidth - 60, 18, 'F');
  pdf.setDrawColor(200);
  pdf.rect(30, currentY, pageWidth - 60, 18, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(darkGray);
  pdf.text('TERMS & CONDITIONS', 35, currentY + 12);
  
  currentY += 30;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Payment Due Upon Receipt', 35, currentY);
  
  currentY += 18;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const noticeText = 'Kindly note that payment is due upon receipt of this invoice. If payment is not received within 15 days, we will apply the following charges:';
  const noticeLines = pdf.splitTextToSize(noticeText, pageWidth - 80);
  noticeLines.forEach((line: string) => {
    pdf.text(line, 35, currentY);
    currentY += 12;
  });
  
  currentY += 8;
  pdf.text('1. Annual Interest Rate: 21% per annum', 45, currentY);
  currentY += 12;
  pdf.text('2. Daily Interest Rate: 0.058% per day', 45, currentY);
  
  currentY += 18;
  const appreciateText = 'These charges will be levied for any outstanding payments beyond the due date. We appreciate your prompt attention to this matter. Thank you.';
  const appreciateLines = pdf.splitTextToSize(appreciateText, pageWidth - 80);
  appreciateLines.forEach((line: string) => {
    pdf.text(line, 35, currentY);
    currentY += 12;
  });
  
  // Remove old payment method section - it's already shown on page 1
  
  // Payment History table
  currentY += 30;
  pdf.setFillColor(tableHeaderBg);
  pdf.rect(30, currentY, pageWidth - 60, 18, 'F');
  pdf.setDrawColor(200);
  pdf.rect(30, currentY, pageWidth - 60, 18, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('PAYMENT HISTORY', 35, currentY + 12);
  
  currentY += 18;
  pdf.rect(30, currentY, pageWidth - 60, 18, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('Date', 35, currentY + 12);
  pdf.text('Invoice #', 130, currentY + 12);
  pdf.text('Amount', 240, currentY + 12);
  pdf.text('Payment Type', 340, currentY + 12);
  pdf.text('Note', 480, currentY + 12);
  
  // Footer page 2
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(lightGray);
  pdf.text(footerText, pageWidth / 2, pageHeight - 35, { align: 'center' });
  pdf.text(footerText2, pageWidth / 2, pageHeight - 25, { align: 'center' });
  pdf.text('Page 2', 35, pageHeight - 25);
  
  return pdf;
};

export const downloadInvoice = (invoiceData: InvoiceData) => {
  const pdf = generateInvoicePDF(invoiceData);
  pdf.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
};
