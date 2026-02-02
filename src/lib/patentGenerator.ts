import jsPDF from 'jspdf';
import { patentContent, figureDefinitions } from '@/data/fastoPatentContent';
import { patentableFeatures, patentSummary, filingStrategy, type PatentableFeature } from '@/data/patentableFeatures';

export function generatePatentPDF(): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 72; // 1 inch margins
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper functions
  const addPage = () => {
    doc.addPage();
    yPosition = margin;
  };

  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      addPage();
      return true;
    }
    return false;
  };

  const drawCenteredText = (text: string, y: number, fontSize: number = 12, fontStyle: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('times', fontStyle);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  const drawParagraph = (text: string, paragraphNumber?: string): number => {
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    
    const lines = doc.splitTextToSize(text, contentWidth - 40);
    const lineHeight = 14;
    const totalHeight = lines.length * lineHeight + 10;
    
    checkPageBreak(totalHeight);
    
    if (paragraphNumber) {
      doc.setFont('times', 'bold');
      doc.text(`[${paragraphNumber}]`, margin, yPosition);
      doc.setFont('times', 'normal');
    }
    
    const textX = paragraphNumber ? margin + 40 : margin;
    const textWidth = paragraphNumber ? contentWidth - 40 : contentWidth;
    const wrappedLines = doc.splitTextToSize(text, textWidth);
    
    wrappedLines.forEach((line: string, index: number) => {
      if (index === 0 && paragraphNumber) {
        doc.text(line, textX, yPosition);
      } else {
        doc.text(line, margin, yPosition);
      }
      yPosition += lineHeight;
    });
    
    yPosition += 8;
    return yPosition;
  };

  const drawSectionHeader = (title: string) => {
    checkPageBreak(40);
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text(title.toUpperCase(), margin, yPosition);
    yPosition += 20;
  };

  // ============== COVER PAGE ==============
  yPosition = 150;
  drawCenteredText('UNITED STATES', yPosition, 14, 'bold');
  yPosition += 20;
  drawCenteredText('PROVISIONAL PATENT APPLICATION', yPosition, 14, 'bold');
  
  yPosition += 60;
  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  
  // Title
  yPosition += 20;
  drawCenteredText('Title of Invention:', yPosition, 11, 'normal');
  yPosition += 25;
  
  const titleLines = doc.splitTextToSize(patentContent.title, contentWidth);
  doc.setFont('times', 'bold');
  titleLines.forEach((line: string) => {
    drawCenteredText(line, yPosition, 12, 'bold');
    yPosition += 16;
  });
  
  // Inventors
  yPosition += 30;
  doc.setFont('times', 'normal');
  drawCenteredText('Inventor(s):', yPosition, 11, 'normal');
  yPosition += 20;
  
  patentContent.inventors.forEach(inv => {
    drawCenteredText(`${inv.name}`, yPosition, 11, 'bold');
    yPosition += 16;
    drawCenteredText(`${inv.city}, ${inv.state}, ${inv.country}`, yPosition, 10, 'normal');
    yPosition += 20;
  });
  
  // Filing Date
  yPosition += 30;
  drawCenteredText(`Filing Date: ${patentContent.filingDate}`, yPosition, 11, 'normal');
  
  // Abstract Section on Cover
  yPosition += 60;
  drawSectionHeader('ABSTRACT');
  drawParagraph(patentContent.abstract);

  // ============== FIGURES ==============
  // FIG. 1 - System Architecture
  addPage();
  drawFigure1(doc, margin, pageWidth, pageHeight);
  
  // FIG. 2 - NLP Pipeline
  addPage();
  drawFigure2(doc, margin, pageWidth, pageHeight);
  
  // FIG. 3 - Tool Orchestration
  addPage();
  drawFigure3(doc, margin, pageWidth, pageHeight);
  
  // FIG. 4 - Human in Loop
  addPage();
  drawFigure4(doc, margin, pageWidth, pageHeight);
  
  // FIG. 5 - Mobile Workforce
  addPage();
  drawFigure5(doc, margin, pageWidth, pageHeight);
  
  // FIG. 6 - Visual Analysis
  addPage();
  drawFigure6(doc, margin, pageWidth, pageHeight);

  // ============== SPECIFICATION ==============
  addPage();
  yPosition = margin;
  
  // Field of Invention
  drawSectionHeader('FIELD OF THE INVENTION');
  drawParagraph(patentContent.fieldOfInvention, '0001');
  
  // Background
  drawSectionHeader('BACKGROUND OF THE INVENTION');
  let paragraphNum = 2;
  patentContent.background.forEach(para => {
    drawParagraph(para, String(paragraphNum).padStart(4, '0'));
    paragraphNum++;
  });
  
  // Summary
  drawSectionHeader('SUMMARY OF THE INVENTION');
  patentContent.summaryOfInvention.forEach(para => {
    drawParagraph(para, String(paragraphNum).padStart(4, '0'));
    paragraphNum++;
  });
  
  // Brief Description of Drawings
  drawSectionHeader('BRIEF DESCRIPTION OF THE DRAWINGS');
  patentContent.briefDescriptionOfDrawings.forEach(para => {
    drawParagraph(para, String(paragraphNum).padStart(4, '0'));
    paragraphNum++;
  });
  
  // Detailed Description
  drawSectionHeader('DETAILED DESCRIPTION OF PREFERRED EMBODIMENTS');
  patentContent.detailedDescription.forEach(para => {
    drawParagraph(para, String(paragraphNum).padStart(4, '0'));
    paragraphNum++;
  });

  // ============== CLAIMS ==============
  addPage();
  yPosition = margin;
  drawSectionHeader('CLAIMS');
  
  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.text('What is claimed is:', margin, yPosition);
  yPosition += 25;
  
  patentContent.claims.forEach(claim => {
    checkPageBreak(100);
    
    doc.setFont('times', 'bold');
    doc.text(`${claim.number}.`, margin, yPosition);
    doc.setFont('times', 'normal');
    
    const claimLines = doc.splitTextToSize(claim.text, contentWidth - 30);
    let firstLine = true;
    
    claimLines.forEach((line: string) => {
      if (firstLine) {
        doc.text(line, margin + 25, yPosition);
        firstLine = false;
      } else {
        yPosition += 14;
        checkPageBreak(20);
        doc.text(line, margin + 25, yPosition);
      }
    });
    
    yPosition += 25;
  });

  return doc;
}

// Figure Drawing Functions
function drawFigure1(doc: jsPDF, margin: number, pageWidth: number, pageHeight: number) {
  const centerX = pageWidth / 2;
  
  // Title
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('FIG. 1', centerX, 50, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text('System Architecture Overview', centerX, 65, { align: 'center' });
  
  doc.setLineWidth(1);
  doc.setDrawColor(0);
  
  // User Devices Box
  doc.rect(80, 100, 140, 80);
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('USER DEVICES', 150, 115, { align: 'center' });
  doc.text('102', 85, 110);
  
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.rect(90, 125, 55, 25);
  doc.text('Tablet/Desktop', 117, 140, { align: 'center' });
  doc.text('102a', 93, 130);
  
  doc.rect(155, 125, 55, 25);
  doc.text('Mobile App', 182, 140, { align: 'center' });
  doc.text('104', 158, 130);
  
  // FASTO AI Engine Box
  doc.setLineWidth(1.5);
  doc.rect(250, 100, 200, 180);
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('FASTO AI ORCHESTRATION ENGINE', 350, 115, { align: 'center' });
  doc.text('110', 255, 110);
  
  doc.setLineWidth(0.5);
  doc.setFont('times', 'normal');
  doc.setFontSize(7);
  
  // Sub-components
  doc.rect(260, 130, 85, 30);
  doc.text('Voice/Text Interface', 302, 148, { align: 'center' });
  doc.text('112', 263, 138);
  
  doc.rect(355, 130, 85, 30);
  doc.text('Intent Engine (LLM)', 397, 148, { align: 'center' });
  doc.text('114', 358, 138);
  
  doc.rect(260, 170, 85, 30);
  doc.text('Context Manager', 302, 188, { align: 'center' });
  doc.text('116', 263, 178);
  
  doc.rect(355, 170, 85, 30);
  doc.text('Tool Orchestration', 397, 188, { align: 'center' });
  doc.text('118', 358, 178);
  
  doc.rect(305, 210, 90, 30);
  doc.text('Audit & Learning', 350, 228, { align: 'center' });
  doc.text('120', 308, 218);
  
  // Backend Box
  doc.setLineWidth(1);
  doc.rect(480, 100, 120, 130);
  doc.setFontSize(8);
  doc.setFont('times', 'bold');
  doc.text('BACKEND SERVICES', 540, 115, { align: 'center' });
  doc.text('130', 485, 110);
  
  doc.setLineWidth(0.5);
  doc.setFont('times', 'normal');
  doc.setFontSize(7);
  
  doc.rect(490, 130, 100, 25);
  doc.text('Knowledge Base', 540, 145, { align: 'center' });
  doc.text('132', 493, 138);
  
  doc.rect(490, 165, 100, 25);
  doc.text('Learning Engine', 540, 180, { align: 'center' });
  doc.text('134', 493, 173);
  
  doc.rect(490, 200, 100, 25);
  doc.text('Data Store', 540, 215, { align: 'center' });
  doc.text('136', 493, 208);
  
  // Operations Modules Box
  doc.setLineWidth(1);
  doc.rect(100, 320, 480, 100);
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('CONSTRUCTION OPERATIONS MODULES', 340, 335, { align: 'center' });
  doc.text('140', 105, 330);
  
  doc.setLineWidth(0.5);
  doc.setFontSize(7);
  doc.setFont('times', 'normal');
  
  const modules = [
    { label: 'Projects', id: '142', x: 115 },
    { label: 'Estimating', id: '144', x: 190 },
    { label: 'Scheduling', id: '146', x: 265 },
    { label: 'Workforce', id: '148', x: 340 },
    { label: 'Financials', id: '150', x: 415 },
    { label: 'Documents', id: '152', x: 490 }
  ];
  
  modules.forEach(mod => {
    doc.rect(mod.x, 350, 65, 35);
    doc.text(mod.label, mod.x + 32, 370, { align: 'center' });
    doc.text(mod.id, mod.x + 3, 358);
  });
  
  // Arrows
  doc.setLineWidth(1);
  // User to Engine
  drawArrow(doc, 220, 140, 250, 140);
  // Engine to Backend
  drawArrow(doc, 450, 165, 480, 165);
  // Engine to Modules
  drawArrow(doc, 350, 280, 350, 320);
  // Backend to Modules
  drawArrow(doc, 540, 230, 540, 320);
}

function drawFigure2(doc: jsPDF, margin: number, pageWidth: number, pageHeight: number) {
  const centerX = pageWidth / 2;
  
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('FIG. 2', centerX, 50, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text('Natural Language Command Processing Pipeline', centerX, 65, { align: 'center' });
  
  const steps = figureDefinitions.fig2.steps;
  const boxWidth = 280;
  const boxHeight = 35;
  const startX = (pageWidth - boxWidth) / 2;
  
  steps.forEach((step, index) => {
    const y = 90 + (index * 50);
    
    doc.setLineWidth(1);
    doc.rect(startX, y, boxWidth, boxHeight);
    
    doc.setFontSize(8);
    doc.setFont('times', 'bold');
    doc.text(step.id, startX + 5, y + 12);
    
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(step.label, centerX, y + 22, { align: 'center' });
    
    // Arrow to next
    if (index < steps.length - 1) {
      drawArrow(doc, centerX, y + boxHeight, centerX, y + 50);
    }
  });
}

function drawFigure3(doc: jsPDF, margin: number, pageWidth: number, pageHeight: number) {
  const centerX = pageWidth / 2;
  
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('FIG. 3', centerX, 50, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text('Agentic Tool Orchestration Engine', centerX, 65, { align: 'center' });
  
  // Tool Registry
  doc.setLineWidth(1.5);
  doc.rect(180, 90, 250, 40);
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('TOOL REGISTRY (43+ Tools)', 305, 115, { align: 'center' });
  doc.text('300', 185, 102);
  
  // Categories box
  doc.setLineWidth(1);
  doc.rect(80, 160, 450, 70);
  doc.text('TOOL CATEGORIES - 302', 305, 175, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  
  const categories = [
    { label: 'Query', id: '302a', x: 95 },
    { label: 'Create', id: '302b', x: 175 },
    { label: 'Update', id: '302c', x: 255 },
    { label: 'Navigate', id: '302d', x: 335 },
    { label: 'Report', id: '302e', x: 415 }
  ];
  
  categories.forEach(cat => {
    doc.rect(cat.x, 190, 70, 30);
    doc.text(cat.label, cat.x + 35, 208, { align: 'center' });
    doc.setFontSize(6);
    doc.text(cat.id, cat.x + 3, 198);
    doc.setFontSize(8);
  });
  
  // Execution Queue
  doc.setLineWidth(1);
  doc.rect(200, 260, 210, 35);
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('EXECUTION QUEUE', 305, 282, { align: 'center' });
  doc.text('304', 205, 272);
  
  // Executors
  doc.setLineWidth(0.5);
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  
  const executors = [
    { label: 'DB Executor', id: '306', x: 90 },
    { label: 'Card Generator', id: '308', x: 200 },
    { label: 'Nav Controller', id: '310', x: 310 },
    { label: 'PDF Generator', id: '312', x: 420 }
  ];
  
  executors.forEach(ex => {
    doc.rect(ex.x, 320, 100, 35);
    doc.text(ex.label, ex.x + 50, 342, { align: 'center' });
    doc.setFontSize(6);
    doc.text(ex.id, ex.x + 3, 330);
    doc.setFontSize(8);
  });
  
  // Result Aggregator & Error Handler
  doc.rect(180, 380, 120, 35);
  doc.text('Result Aggregator', 240, 402, { align: 'center' });
  doc.text('314', 185, 390);
  
  doc.rect(320, 380, 110, 35);
  doc.text('Error Handler', 375, 402, { align: 'center' });
  doc.text('316', 325, 390);
  
  // Arrows
  drawArrow(doc, 305, 130, 305, 160);
  drawArrow(doc, 305, 230, 305, 260);
  drawArrow(doc, 305, 295, 305, 320);
}

function drawFigure4(doc: jsPDF, margin: number, pageWidth: number, pageHeight: number) {
  const centerX = pageWidth / 2;
  
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('FIG. 4', centerX, 50, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text('Human-in-the-Loop Decision Flow', centerX, 65, { align: 'center' });
  
  let y = 90;
  const boxW = 200;
  const boxH = 35;
  const diamondSize = 50;
  
  // Step 400 - rect
  doc.rect(centerX - boxW/2, y, boxW, boxH);
  doc.setFontSize(7);
  doc.text('400', centerX - boxW/2 + 5, y + 12);
  doc.setFontSize(9);
  doc.text('User Command Received', centerX, y + 22, { align: 'center' });
  drawArrow(doc, centerX, y + boxH, centerX, y + boxH + 15);
  y += boxH + 15;
  
  // Step 402 - diamond
  drawDiamond(doc, centerX, y + diamondSize/2, diamondSize);
  doc.setFontSize(7);
  doc.text('402', centerX - 20, y + 15);
  doc.setFontSize(8);
  doc.text('Modifying', centerX, y + diamondSize/2 - 5, { align: 'center' });
  doc.text('Action?', centerX, y + diamondSize/2 + 5, { align: 'center' });
  
  // Yes arrow
  drawArrow(doc, centerX, y + diamondSize, centerX, y + diamondSize + 15);
  doc.text('YES', centerX + 10, y + diamondSize + 10);
  y += diamondSize + 15;
  
  // Step 404 - diamond
  drawDiamond(doc, centerX, y + diamondSize/2, diamondSize);
  doc.setFontSize(7);
  doc.text('404', centerX - 20, y + 15);
  doc.setFontSize(8);
  doc.text('Confirm', centerX, y + diamondSize/2 - 5, { align: 'center' });
  doc.text('Required?', centerX, y + diamondSize/2 + 5, { align: 'center' });
  drawArrow(doc, centerX, y + diamondSize, centerX, y + diamondSize + 15);
  doc.text('YES', centerX + 10, y + diamondSize + 10);
  y += diamondSize + 15;
  
  // Step 406 - rect
  doc.rect(centerX - boxW/2, y, boxW, boxH);
  doc.setFontSize(7);
  doc.text('406', centerX - boxW/2 + 5, y + 12);
  doc.setFontSize(9);
  doc.text('Display Confirmation Card', centerX, y + 22, { align: 'center' });
  drawArrow(doc, centerX, y + boxH, centerX, y + boxH + 15);
  y += boxH + 15;
  
  // Step 408 - diamond
  drawDiamond(doc, centerX, y + diamondSize/2, diamondSize);
  doc.setFontSize(7);
  doc.text('408', centerX - 20, y + 15);
  doc.setFontSize(8);
  doc.text('User', centerX, y + diamondSize/2 - 5, { align: 'center' });
  doc.text('Confirms?', centerX, y + diamondSize/2 + 5, { align: 'center' });
  drawArrow(doc, centerX, y + diamondSize, centerX, y + diamondSize + 15);
  doc.text('YES', centerX + 10, y + diamondSize + 10);
  y += diamondSize + 15;
  
  // Remaining steps - compact
  const remainingSteps = [
    { id: '410', label: 'Execute Action' },
    { id: '412', label: 'Log to Audit Trail' },
    { id: '414', label: 'Return Result Card' },
    { id: '416', label: 'Offer Follow-up Actions' }
  ];
  
  remainingSteps.forEach((step, i) => {
    doc.rect(centerX - boxW/2, y, boxW, 28);
    doc.setFontSize(7);
    doc.text(step.id, centerX - boxW/2 + 5, y + 10);
    doc.setFontSize(8);
    doc.text(step.label, centerX, y + 18, { align: 'center' });
    if (i < remainingSteps.length - 1) {
      drawArrow(doc, centerX, y + 28, centerX, y + 38);
    }
    y += 38;
  });
}

function drawFigure5(doc: jsPDF, margin: number, pageWidth: number, pageHeight: number) {
  const centerX = pageWidth / 2;
  
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('FIG. 5', centerX, 50, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text('Mobile Workforce Voice Operations', centerX, 65, { align: 'center' });
  
  // Left column - Mobile device
  doc.setLineWidth(1.5);
  doc.rect(70, 100, 150, 200);
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('MOBILE DEVICE', 145, 115, { align: 'center' });
  doc.text('500', 75, 110);
  
  doc.setLineWidth(0.5);
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  
  doc.rect(85, 130, 120, 35);
  doc.text('Voice Command Interface', 145, 152, { align: 'center' });
  doc.text('502', 88, 140);
  
  doc.rect(85, 175, 120, 35);
  doc.text('Location Services', 145, 197, { align: 'center' });
  doc.text('504', 88, 185);
  
  doc.rect(85, 220, 120, 35);
  doc.text('Camera + GPS Stamp', 145, 242, { align: 'center' });
  doc.text('510', 88, 230);
  
  doc.rect(85, 265, 120, 25);
  doc.text('Offline Queue', 145, 282, { align: 'center' });
  doc.text('512', 88, 275);
  
  // Middle column - Verification
  doc.setLineWidth(1);
  doc.rect(260, 100, 130, 200);
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('VERIFICATION', 325, 115, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  
  doc.rect(275, 135, 100, 40);
  doc.text('Geofence', 325, 155, { align: 'center' });
  doc.text('Verification', 325, 165, { align: 'center' });
  doc.text('506', 278, 145);
  
  doc.rect(275, 190, 100, 40);
  doc.text('Clock In/Out', 325, 210, { align: 'center' });
  doc.text('Module', 325, 220, { align: 'center' });
  doc.text('508', 278, 200);
  
  doc.rect(275, 245, 100, 40);
  doc.text('Push', 325, 265, { align: 'center' });
  doc.text('Notifications', 325, 275, { align: 'center' });
  doc.text('514', 278, 255);
  
  // Right column - Dashboard
  doc.setLineWidth(1);
  doc.rect(430, 100, 130, 200);
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('ADMIN VIEW', 495, 115, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  
  doc.rect(445, 140, 100, 60);
  doc.text('Workforce', 495, 165, { align: 'center' });
  doc.text('Dashboard', 495, 180, { align: 'center' });
  doc.text('516', 448, 150);
  
  doc.rect(445, 220, 100, 60);
  doc.text('Real-time', 495, 245, { align: 'center' });
  doc.text('Location Map', 495, 260, { align: 'center' });
  
  // Arrows
  drawArrow(doc, 220, 150, 260, 155);
  drawArrow(doc, 220, 192, 260, 210);
  drawArrow(doc, 390, 155, 430, 170);
  drawArrow(doc, 390, 210, 430, 250);
}

function drawFigure6(doc: jsPDF, margin: number, pageWidth: number, pageHeight: number) {
  const centerX = pageWidth / 2;
  
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text('FIG. 6', centerX, 50, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text('AI-Powered Visual Analysis Pipeline', centerX, 65, { align: 'center' });
  
  const steps = figureDefinitions.fig6.steps;
  const boxWidth = 300;
  const boxHeight = 35;
  const startX = (pageWidth - boxWidth) / 2;
  
  steps.forEach((step, index) => {
    const y = 90 + (index * 48);
    
    doc.setLineWidth(1);
    doc.rect(startX, y, boxWidth, boxHeight);
    
    doc.setFontSize(8);
    doc.setFont('times', 'bold');
    doc.text(step.id, startX + 5, y + 12);
    
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(step.label, centerX, y + 22, { align: 'center' });
    
    if (index < steps.length - 1) {
      drawArrow(doc, centerX, y + boxHeight, centerX, y + 48);
    }
  });
}

// Helper: Draw arrow
function drawArrow(doc: jsPDF, x1: number, y1: number, x2: number, y2: number) {
  doc.setLineWidth(0.8);
  doc.line(x1, y1, x2, y2);
  
  // Arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 8;
  
  doc.line(x2, y2, x2 - headLen * Math.cos(angle - Math.PI/6), y2 - headLen * Math.sin(angle - Math.PI/6));
  doc.line(x2, y2, x2 - headLen * Math.cos(angle + Math.PI/6), y2 - headLen * Math.sin(angle + Math.PI/6));
}

// Helper: Draw diamond
function drawDiamond(doc: jsPDF, cx: number, cy: number, size: number) {
  const half = size / 2;
  doc.setLineWidth(1);
  doc.line(cx, cy - half, cx + half, cy);
  doc.line(cx + half, cy, cx, cy + half);
  doc.line(cx, cy + half, cx - half, cy);
  doc.line(cx - half, cy, cx, cy - half);
}

export function downloadPatent() {
  const doc = generatePatentPDF();
  doc.save('FASTO-Provisional-Patent-Application.pdf');
}

export function downloadPatentWithFeatures(selectedFeatureIds: number[]) {
  const doc = generatePatentPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 72;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  const drawSectionHeader = (title: string) => {
    checkPageBreak(40);
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text(title.toUpperCase(), margin, yPosition);
    yPosition += 20;
  };

  // Add patentability analysis section
  doc.addPage();
  yPosition = margin;
  
  drawSectionHeader('PATENTABILITY ANALYSIS - APPENDIX A');
  
  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  
  // Summary stats
  doc.setFont('times', 'bold');
  doc.text('Portfolio Summary', margin, yPosition);
  yPosition += 15;
  doc.setFont('times', 'normal');
  doc.text(`Total Patentable Features Identified: ${patentSummary.totalFeatures}`, margin, yPosition);
  yPosition += 12;
  doc.text(`Average Patentability Score: ${patentSummary.averageScore.toFixed(1)}/10`, margin, yPosition);
  yPosition += 12;
  doc.text(`Tier 1 (Highly Patentable): ${patentSummary.byTier.tier1}`, margin, yPosition);
  yPosition += 12;
  doc.text(`Tier 2 (Strong): ${patentSummary.byTier.tier2}`, margin, yPosition);
  yPosition += 12;
  doc.text(`Tier 3 (Good): ${patentSummary.byTier.tier3}`, margin, yPosition);
  yPosition += 12;
  doc.text(`Tier 4 (Moderate): ${patentSummary.byTier.tier4}`, margin, yPosition);
  yPosition += 25;

  // Filing strategy
  doc.setFont('times', 'bold');
  doc.text('Recommended Filing Strategy', margin, yPosition);
  yPosition += 15;
  doc.setFont('times', 'normal');
  
  const strategies = [filingStrategy.priority1, filingStrategy.priority2, filingStrategy.priority3];
  strategies.forEach(strategy => {
    checkPageBreak(60);
    doc.setFont('times', 'bold');
    doc.text(strategy.title, margin, yPosition);
    yPosition += 12;
    doc.setFont('times', 'normal');
    const rationaleLines = doc.splitTextToSize(strategy.rationale, contentWidth);
    rationaleLines.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += 12;
    });
    doc.text(`Estimated Cost: ${strategy.estimatedCost}`, margin, yPosition);
    yPosition += 18;
  });

  // Selected features detail
  const selectedFeatures = patentableFeatures.filter(f => selectedFeatureIds.includes(f.id));
  
  selectedFeatures.forEach((feature, index) => {
    doc.addPage();
    yPosition = margin;
    
    const tierLabel = feature.tier === 1 ? 'HIGHLY PATENTABLE' : feature.tier === 2 ? 'STRONG' : feature.tier === 3 ? 'GOOD' : 'MODERATE';
    
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text(`FEATURE #${feature.id}: ${feature.name}`, margin, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text(`Tier: ${tierLabel} | Score: ${feature.patentabilityScore}/10 | Risk: ${feature.riskAssessment.level.toUpperCase()}`, margin, yPosition);
    yPosition += 15;
    doc.text(`USPTO Classifications: ${feature.usptoCpc.join(', ')}`, margin, yPosition);
    yPosition += 20;
    
    // Novelty Analysis
    doc.setFont('times', 'bold');
    doc.text('Novelty Analysis:', margin, yPosition);
    yPosition += 12;
    doc.setFont('times', 'normal');
    const noveltyLines = doc.splitTextToSize(feature.noveltyAnalysis, contentWidth);
    noveltyLines.forEach((line: string) => {
      checkPageBreak(15);
      doc.text(line, margin, yPosition);
      yPosition += 12;
    });
    yPosition += 10;
    
    // Technical Differentiators
    checkPageBreak(50);
    doc.setFont('times', 'bold');
    doc.text('Technical Differentiators:', margin, yPosition);
    yPosition += 12;
    doc.setFont('times', 'normal');
    feature.technicalDifferentiators.forEach(diff => {
      checkPageBreak(15);
      doc.text(`• ${diff}`, margin + 10, yPosition);
      yPosition += 12;
    });
    yPosition += 10;
    
    // Prior Art
    checkPageBreak(50);
    doc.setFont('times', 'bold');
    doc.text('Prior Art Analysis:', margin, yPosition);
    yPosition += 12;
    doc.setFont('times', 'normal');
    feature.priorArt.forEach(art => {
      checkPageBreak(25);
      doc.text(`${art.title}:`, margin + 10, yPosition);
      yPosition += 12;
      const limitLines = doc.splitTextToSize(`Limitation: ${art.limitation}`, contentWidth - 20);
      limitLines.forEach((line: string) => {
        doc.text(line, margin + 20, yPosition);
        yPosition += 12;
      });
    });
    yPosition += 10;
    
    // Patentability Factors
    checkPageBreak(60);
    doc.setFont('times', 'bold');
    doc.text('Patentability Factors:', margin, yPosition);
    yPosition += 12;
    doc.setFont('times', 'normal');
    doc.text(`Novelty: ${feature.patentabilityFactors.novelty}/10`, margin + 10, yPosition);
    yPosition += 12;
    doc.text(`Non-Obviousness: ${feature.patentabilityFactors.nonObviousness}/10`, margin + 10, yPosition);
    yPosition += 12;
    doc.text(`Utility: ${feature.patentabilityFactors.utility}/10`, margin + 10, yPosition);
    yPosition += 12;
    doc.text(`Enablement: ${feature.patentabilityFactors.enablement}/10`, margin + 10, yPosition);
    yPosition += 15;
    
    // Risk Concerns
    if (feature.riskAssessment.concerns.length > 0) {
      checkPageBreak(40);
      doc.setFont('times', 'bold');
      doc.text('Risk Concerns:', margin, yPosition);
      yPosition += 12;
      doc.setFont('times', 'normal');
      feature.riskAssessment.concerns.forEach(concern => {
        const concernLines = doc.splitTextToSize(`• ${concern}`, contentWidth - 10);
        concernLines.forEach((line: string) => {
          checkPageBreak(15);
          doc.text(line, margin + 10, yPosition);
          yPosition += 12;
        });
      });
    }
    yPosition += 10;
    
    // Draft Independent Claim
    checkPageBreak(60);
    doc.setFont('times', 'bold');
    doc.text('Draft Independent Claim:', margin, yPosition);
    yPosition += 15;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    const claimLines = doc.splitTextToSize(feature.independentClaim, contentWidth);
    claimLines.forEach((line: string) => {
      checkPageBreak(12);
      doc.text(line, margin, yPosition);
      yPosition += 11;
    });
    yPosition += 10;
    
    // Dependent Claims
    if (feature.dependentClaims.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(10);
      doc.setFont('times', 'bold');
      doc.text(`Dependent Claims (${feature.dependentClaims.length}):`, margin, yPosition);
      yPosition += 15;
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      feature.dependentClaims.forEach((claim, i) => {
        checkPageBreak(40);
        const depClaimLines = doc.splitTextToSize(`${i + 2}. ${claim}`, contentWidth);
        depClaimLines.forEach((line: string) => {
          checkPageBreak(12);
          doc.text(line, margin, yPosition);
          yPosition += 11;
        });
        yPosition += 8;
      });
    }
  });

  doc.save('FASTO-Patent-Application-With-Analysis.pdf');
}
