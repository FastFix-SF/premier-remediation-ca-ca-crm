import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface ProposalData {
  proposal: {
    id: string;
    proposal_number: string;
    property_address: string;
    project_type: string;
    status: string;
    client_name: string;
    client_email: string;
    client_phone: string | null;
    expires_at: string;
    created_at: string;
    scope_of_work: string | null;
    notes_disclaimers: string | null;
  };
  quotes: Array<{
    option_name: string;
    total_amount: number;
    status: string;
  }>;
  pricingItems: Array<{
    system_name: string;
    description: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    is_optional: boolean;
  }>;
  comparisonBlocks: Array<{
    title: string;
    quoteOptionName?: string;
    quoteAmount?: number;
    currentImage?: { photo_url: string };
    proposedImage?: { photo_url: string };
  }>;
}

export const generateProposalPDF = async (data: ProposalData): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Helper function to check if we need a new page
  const checkNewPage = (heightNeeded: number) => {
    if (yPos + heightNeeded > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper function to add a section header
  const addSectionHeader = (title: string) => {
    checkNewPage(15);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, margin, yPos);
    yPos += 8;
    
    // Add underline
    pdf.setDrawColor(180, 142, 54); // Gold accent color
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  };

  // Helper function to add a key-value pair
  const addKeyValue = (key: string, value: string, bold: boolean = false) => {
    checkNewPage(10);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 100, 100);
    pdf.text(key, margin, yPos);
    
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setTextColor(0, 0, 0);
    const keyWidth = pdf.getTextWidth(key);
    pdf.text(value, margin + keyWidth + 3, yPos);
    yPos += 7;
  };

  // Helper function to add wrapped text
  const addWrappedText = (text: string, fontSize: number = 10) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const lines = pdf.splitTextToSize(text, contentWidth);
    
    for (const line of lines) {
      checkNewPage(7);
      pdf.text(line, margin, yPos);
      yPos += 6;
    }
  };

  // Cover Page / Header
  pdf.setFillColor(30, 58, 138); // Professional navy blue
  pdf.rect(0, 0, pageWidth, 50, 'F');
  
  // Add logo
  try {
    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      logo.onload = resolve;
      logo.onerror = reject;
      logo.src = '/images/roofing-friend-logo.png';
    });
    
    // Add logo on the left side of the banner
    const logoSize = 35;
    pdf.addImage(logo, 'PNG', margin, 7.5, logoSize, logoSize);
  } catch (error) {
    console.error('Error loading logo:', error);
  }
  
  // Company name and license on the right side
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('The Roofing Friend, Inc', pageWidth / 2 + 10, 20, { align: 'center' });
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('CA License #1067709', pageWidth / 2 + 10, 30, { align: 'center' });
  
  yPos = 65;

  // Project Information Section
  addSectionHeader('Project Information');
  
  addKeyValue('Property Address:', data.proposal.property_address);
  addKeyValue('Project Type:', data.proposal.project_type.charAt(0).toUpperCase() + data.proposal.project_type.slice(1));
  
  yPos += 5;

  // Customer Information Section
  addSectionHeader('Customer Information');
  
  addKeyValue('Client Name:', data.proposal.client_name);
  addKeyValue('Email:', data.proposal.client_email);
  if (data.proposal.client_phone) {
    addKeyValue('Phone:', data.proposal.client_phone);
  }
  
  yPos += 5;

  // Proposal Information Section
  addSectionHeader('Proposal Information');
  
  addKeyValue('Estimate:', `#${data.proposal.proposal_number}`);
  addKeyValue('Date Prepared:', format(new Date(data.proposal.created_at), 'MMMM d, yyyy'));
  addKeyValue('Valid Until:', format(new Date(data.proposal.expires_at), 'MMMM d, yyyy'));
  
  yPos += 8;

  // Investment Options Section - Pricing Items
  if (data.pricingItems && data.pricingItems.length > 0) {
    checkNewPage(20);
    addSectionHeader('Investment Summary');
    
    // Group items by category
    const mainOptions = data.pricingItems.filter(item => !item.is_optional);
    const optionalAddons = data.pricingItems.filter(item => item.is_optional);
    
    if (mainOptions.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Main Options', margin, yPos);
      yPos += 8;
      
      // Table header
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, yPos, contentWidth, 10, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(75, 85, 99);
      pdf.text('Item', margin + 2, yPos + 6);
      pdf.text('Qty', margin + contentWidth - 70, yPos + 6);
      pdf.text('Unit Price', margin + contentWidth - 45, yPos + 6);
      pdf.text('Total', margin + contentWidth - 2, yPos + 6, { align: 'right' });
      yPos += 12;
      
      mainOptions.forEach((item) => {
        checkNewPage(15);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(item.system_name, margin + 2, yPos);
        
        if (item.description) {
          yPos += 5;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          const descLines = pdf.splitTextToSize(item.description, contentWidth - 75);
          descLines.forEach((line: string) => {
            checkNewPage(5);
            pdf.text(line, margin + 2, yPos);
            yPos += 5;
          });
        }
        
        const itemYPos = yPos - (item.description ? 5 : 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(item.quantity.toString(), margin + contentWidth - 70, itemYPos);
        pdf.text(`$${item.unit_price.toFixed(2)}`, margin + contentWidth - 45, itemYPos);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`$${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, margin + contentWidth - 2, itemYPos, { align: 'right' });
        
        yPos += 8;
      });
      
      // Subtotal for main options
      const mainTotal = mainOptions.reduce((sum, item) => sum + item.total_price, 0);
      yPos += 3;
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.3);
      pdf.line(margin + contentWidth - 50, yPos, margin + contentWidth, yPos);
      yPos += 6;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Subtotal:', margin + contentWidth - 50, yPos);
      pdf.text(`$${mainTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, margin + contentWidth - 2, yPos, { align: 'right' });
      yPos += 12;
    }
    
    if (optionalAddons.length > 0) {
      checkNewPage(20);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Optional Add-ons', margin, yPos);
      yPos += 8;
      
      optionalAddons.forEach((item) => {
        checkNewPage(12);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`• ${item.system_name}`, margin + 2, yPos);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(`$${item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, margin + contentWidth - 2, yPos, { align: 'right' });
        
        if (item.description) {
          yPos += 5;
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          const descLines = pdf.splitTextToSize(item.description, contentWidth - 35);
          descLines.forEach((line: string) => {
            checkNewPage(5);
            pdf.text(line, margin + 5, yPos);
            yPos += 4;
          });
        }
        
        yPos += 6;
      });
      
      const optionalTotal = optionalAddons.reduce((sum, item) => sum + item.total_price, 0);
      yPos += 3;
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.3);
      pdf.line(margin + contentWidth - 50, yPos, margin + contentWidth, yPos);
      yPos += 6;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Optional Total:', margin + contentWidth - 50, yPos);
      pdf.text(`$${optionalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, margin + contentWidth - 2, yPos, { align: 'right' });
      yPos += 10;
    }
    
    // Grand Total
    const grandTotal = data.pricingItems.reduce((sum, item) => sum + item.total_price, 0);
    checkNewPage(15);
    pdf.setFillColor(30, 58, 138);
    pdf.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
    yPos += 8;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Total Investment:', margin + 5, yPos);
    pdf.setFontSize(16);
    pdf.text(`$${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, margin + contentWidth - 5, yPos, { align: 'right' });
    yPos += 12;
  }

  // Design Transformations Section (Current vs. Proposed)
  console.log('Starting to render comparison blocks:', data.comparisonBlocks);
  
  if (data.comparisonBlocks && data.comparisonBlocks.length > 0) {
    const visibleBlocks = data.comparisonBlocks.filter(
      block => block.currentImage || block.proposedImage
    );
    
    console.log('Visible blocks with images:', visibleBlocks.length);
    
    if (visibleBlocks.length > 0) {
      checkNewPage(30);
      addSectionHeader('Current vs. Proposed');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Visual comparisons showing the transformation', margin, yPos);
      yPos += 12;
      
      for (const block of visibleBlocks) {
        console.log('Processing block for PDF:', block.title);
        checkNewPage(90);
        
        // Block title and price
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(block.title || 'Comparison', margin, yPos);
        
        if (block.quoteAmount) {
          const amountText = `$${block.quoteAmount.toLocaleString()}`;
          const amountWidth = pdf.getTextWidth(amountText);
          pdf.setTextColor(180, 142, 54); // Gold accent for pricing
          pdf.text(amountText, pageWidth - margin - amountWidth, yPos);
        }
        
        yPos += 8;
        
        if (block.quoteOptionName) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text(block.quoteOptionName, margin, yPos);
          yPos += 8;
        }
        
        // Check if we have both images or just one
        const hasBothImages = block.currentImage && block.proposedImage;
        const hasOnlyCurrentImage = block.currentImage && !block.proposedImage;
        const hasOnlyProposedImage = !block.currentImage && block.proposedImage;
        
        try {
          if (hasBothImages) {
            // Side-by-side layout for both images
            const currentImg = new Image();
            const proposedImg = new Image();
            currentImg.crossOrigin = 'anonymous';
            proposedImg.crossOrigin = 'anonymous';
            
            await Promise.all([
              new Promise((resolve, reject) => {
                currentImg.onload = resolve;
                currentImg.onerror = () => reject(new Error('Failed to load current image'));
                currentImg.src = block.currentImage!.photo_url;
                setTimeout(() => reject(new Error('Image load timeout')), 10000);
              }),
              new Promise((resolve, reject) => {
                proposedImg.onload = resolve;
                proposedImg.onerror = () => reject(new Error('Failed to load proposed image'));
                proposedImg.src = block.proposedImage!.photo_url;
                setTimeout(() => reject(new Error('Image load timeout')), 10000);
              })
            ]);
            
            const imgWidth = (contentWidth - 5) / 2;
            const imgHeight = 55;
            
            // Current image with label
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(30, 58, 138);
            pdf.text('Current', margin, yPos);
            yPos += 5;
            
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.3);
            pdf.rect(margin, yPos, imgWidth, imgHeight);
            pdf.addImage(currentImg, 'JPEG', margin, yPos, imgWidth, imgHeight);
            
            // Proposed image with label
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(34, 197, 94);
            pdf.text('Proposed', margin + imgWidth + 5, yPos - 5);
            
            pdf.rect(margin + imgWidth + 5, yPos, imgWidth, imgHeight);
            pdf.addImage(proposedImg, 'JPEG', margin + imgWidth + 5, yPos, imgWidth, imgHeight);
            
            yPos += imgHeight + 12;
          } else if (hasOnlyCurrentImage) {
            // Full-width layout for single current image
            const currentImg = new Image();
            currentImg.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              currentImg.onload = resolve;
              currentImg.onerror = () => reject(new Error('Failed to load current image'));
              currentImg.src = block.currentImage!.photo_url;
              setTimeout(() => reject(new Error('Image load timeout')), 10000);
            });
            
            const imgWidth = contentWidth;
            const imgHeight = 80;
            
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(30, 58, 138);
            pdf.text('Current', margin, yPos);
            yPos += 5;
            
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.3);
            pdf.rect(margin, yPos, imgWidth, imgHeight);
            pdf.addImage(currentImg, 'JPEG', margin, yPos, imgWidth, imgHeight);
            
            yPos += imgHeight + 12;
          } else if (hasOnlyProposedImage) {
            // Full-width layout for single proposed image
            const proposedImg = new Image();
            proposedImg.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              proposedImg.onload = resolve;
              proposedImg.onerror = () => reject(new Error('Failed to load proposed image'));
              proposedImg.src = block.proposedImage!.photo_url;
              setTimeout(() => reject(new Error('Image load timeout')), 10000);
            });
            
            const imgWidth = contentWidth;
            const imgHeight = 80;
            
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(34, 197, 94);
            pdf.text('Proposed', margin, yPos);
            yPos += 5;
            
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.3);
            pdf.rect(margin, yPos, imgWidth, imgHeight);
            pdf.addImage(proposedImg, 'JPEG', margin, yPos, imgWidth, imgHeight);
            
            yPos += imgHeight + 12;
          }
        } catch (error) {
          console.error('Error loading comparison images:', error);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(150, 150, 150);
          pdf.text('Images could not be loaded for this comparison', margin, yPos);
          yPos += 15;
        }
      }
      
      yPos += 5;
    }
  }

  // Project Details Section
  if (data.proposal.scope_of_work) {
    checkNewPage(20);
    addSectionHeader('Scope of Work');
    
    // Format scope of work with better readability
    const paragraphs = data.proposal.scope_of_work.split('\n\n');
    
    paragraphs.forEach((paragraph, index) => {
      if (!paragraph.trim()) return;
      
      // Check if it's a numbered section (e.g., "1.", "2.", etc.)
      const isNumberedSection = /^\d+\./.test(paragraph.trim());
      
      if (isNumberedSection && index > 0) {
        // Add separator line before numbered sections (except the first one)
        checkNewPage(10);
        yPos += 5;
        pdf.setDrawColor(229, 231, 235); // Light gray separator
        pdf.setLineWidth(0.3);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
      }
      
      // Check if it's a bullet point
      if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
        const lines = paragraph.split('\n').filter(line => line.trim());
        lines.forEach(line => {
          checkNewPage(7);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          
          const cleanLine = line.trim().replace(/^[-•]\s*/, '');
          const wrappedLines = pdf.splitTextToSize(`• ${cleanLine}`, contentWidth - 5);
          
          wrappedLines.forEach((wrappedLine: string, i: number) => {
            checkNewPage(6);
            pdf.text(wrappedLine, margin + (i > 0 ? 5 : 0), yPos);
            yPos += 5;
          });
        });
        yPos += 3;
      } else {
        // Regular paragraph or numbered section
        pdf.setFontSize(10);
        pdf.setFont('helvetica', isNumberedSection ? 'bold' : 'normal');
        pdf.setTextColor(0, 0, 0);
        const lines = pdf.splitTextToSize(paragraph.trim(), contentWidth);
        
        lines.forEach((line: string) => {
          checkNewPage(6);
          pdf.text(line, margin, yPos);
          yPos += 5;
        });
        
        if (index < paragraphs.length - 1) {
          yPos += 4; // Space between paragraphs
        }
      }
    });
    
    yPos += 5;
  }

  // Notes and Disclaimers Section
  if (data.proposal.notes_disclaimers) {
    checkNewPage(20);
    addSectionHeader('Notes & Disclaimers');
    
    // Format notes with better readability
    const paragraphs = data.proposal.notes_disclaimers.split('\n\n');
    
    paragraphs.forEach((paragraph, index) => {
      if (!paragraph.trim()) return;
      
      // Check if it's a bullet point
      if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
        const lines = paragraph.split('\n').filter(line => line.trim());
        lines.forEach(line => {
          checkNewPage(7);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          
          const cleanLine = line.trim().replace(/^[-•]\s*/, '');
          const wrappedLines = pdf.splitTextToSize(`• ${cleanLine}`, contentWidth - 5);
          
          wrappedLines.forEach((wrappedLine: string, i: number) => {
            checkNewPage(6);
            pdf.text(wrappedLine, margin + (i > 0 ? 5 : 0), yPos);
            yPos += 5;
          });
        });
        yPos += 3;
      } else {
        // Regular paragraph
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        const lines = pdf.splitTextToSize(paragraph.trim(), contentWidth);
        
        lines.forEach((line: string) => {
          checkNewPage(6);
          pdf.text(line, margin, yPos);
          yPos += 5;
        });
        
        if (index < paragraphs.length - 1) {
          yPos += 4; // Space between paragraphs
        }
      }
    });
    
    yPos += 5;
  }

  // Footer on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} of ${totalPages} | Generated on ${format(new Date(), 'MMMM d, yyyy')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  pdf.save(`Proposal-${data.proposal.proposal_number}.pdf`);
};
