import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ExternalLink, Edit, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { pdf } from '@react-pdf/renderer';
import { FieldInspectionReportPDF } from '@/components/pdf/FieldInspectionReportPDF';
import { companyConfig } from '@/config/company';

interface ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportUrl: string;
  reportName: string;
  reportId?: string;
  onReportUpdated?: () => void;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({
  isOpen,
  onClose,
  reportUrl,
  reportName,
  reportId,
  onReportUpdated,
}) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && reportUrl) {
      fetchReportContent();
      setIsEditing(false);
    }
  }, [isOpen, reportUrl]);

  const fetchReportContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(reportUrl);
      if (!response.ok) throw new Error('Failed to load report');
      const html = await response.text();
      
      // Extract only the body content and apply our own styling
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyContent = bodyMatch ? bodyMatch[1] : html;
      
      setHtmlContent(bodyContent);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenExternal = () => {
    window.open(reportUrl, '_blank');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editableRef.current) return;
    
    setIsSaving(true);
    try {
      const editedContent = editableRef.current.innerHTML;
      
      // Create updated HTML document with professional styling
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportName}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; background: #fff; }
    
    /* Professional Header */
    .report-header { display: flex; align-items: center; gap: 16px; padding-bottom: 16px; margin-bottom: 20px; border-bottom: 2px solid #2563eb; }
    .report-logo { width: 70px; height: auto; object-fit: contain; border-radius: 4px; }
    .company-info { flex: 1; }
    .company-name { font-size: 1.1rem; font-weight: 700; color: #1a1a1a; margin: 0 0 4px 0; letter-spacing: 0.5px; }
    .company-detail { font-size: 0.75rem; color: #666; margin: 2px 0; }
    .company-license { font-size: 0.75rem; color: #2563eb; font-weight: 600; margin: 4px 0 0 0; }
    
    /* Title Section */
    .report-title-section { text-align: center; margin-bottom: 20px; }
    .report-title { font-size: 1.25rem; font-weight: 700; color: #1a1a1a; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px; }
    .report-meta { background: #f5f5f5; padding: 12px 16px; border-radius: 8px; display: inline-block; text-align: left; }
    .report-meta p { margin: 4px 0; font-size: 0.85rem; color: #1a1a1a; }
    
    /* Divider */
    .report-divider { height: 2px; background: linear-gradient(to right, #2563eb, transparent); margin: 20px 0; }
    
    /* Sections */
    .report-section { margin-bottom: 24px; }
    .section-heading { font-size: 1rem; font-weight: 600; color: #2563eb; margin: 0 0 12px 0; padding-bottom: 6px; border-bottom: 1px solid #e5e5e5; }
    .section-text { color: #666; font-size: 0.9rem; line-height: 1.6; margin: 8px 0; }
    
    /* Lists */
    .work-list, .findings-list, .recommendations-list { padding-left: 20px; margin: 12px 0; }
    .work-list li, .findings-list li, .recommendations-list li { color: #666; margin-bottom: 8px; font-size: 0.9rem; line-height: 1.5; }
    
    /* Photos */
    .photo-documentation { margin: 16px 0; }
    .photo-container { background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .report-photo { width: 100%; max-width: 400px; height: auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); margin-bottom: 8px; }
    .photo-caption { font-size: 0.85rem; color: #666; margin: 8px 0 0 0; line-height: 1.5; }
    
    /* Footer */
    .report-footer { margin-top: 32px; padding-top: 16px; text-align: center; }
    .footer-divider { height: 2px; background: linear-gradient(to right, transparent, #2563eb, transparent); margin-bottom: 16px; }
    .footer-tagline { font-size: 0.9rem; font-style: italic; color: #2563eb; font-weight: 500; margin: 0 0 8px 0; }
    .footer-contact, .footer-address { font-size: 0.75rem; color: #666; margin: 4px 0; }
    
    /* Legacy support */
    h2 { color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.5rem; }
    h3 { color: #333; margin-top: 1.5rem; }
    p { margin: 0.75rem 0; color: #666; }
    .meta { color: #888; font-style: italic; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
    ul { padding-left: 20px; }
    li { margin-bottom: 0.5rem; color: #666; }
  </style>
</head>
<body>
${editedContent}
</body>
</html>`;
      
      // Upload the updated HTML file
      const blob = new Blob([fullHtml], { type: 'text/html' });
      
      // Extract file path from URL - handles both old contracts bucket and new project-reports bucket
      let filePath = '';
      if (reportUrl.includes('/project-reports/')) {
        filePath = reportUrl.split('/project-reports/')[1];
      } else if (reportUrl.includes('/contracts/')) {
        // For legacy reports in contracts bucket, we'll save to the new bucket
        const fileName = reportUrl.split('/').pop() || `report_${Date.now()}.html`;
        filePath = fileName;
      } else {
        filePath = `report_${Date.now()}.html`;
      }
      
      if (!filePath) {
        throw new Error('Could not determine file path');
      }
      
      const { error: uploadError } = await supabase.storage
        .from('project-reports')
        .upload(filePath, blob, {
          contentType: 'text/html',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      setHtmlContent(editedContent);
      setIsEditing(false);
      toast.success('Report saved successfully');
      onReportUpdated?.();
    } catch (err) {
      console.error('Error saving report:', err);
      toast.error('Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    
    setIsDownloading(true);
    try {
      const content = contentRef.current;
      
      // Extract meta information from the HTML content
      const metaBox = content.querySelector('.report-meta');
      const metaTexts = metaBox?.querySelectorAll('p');
      
      let projectName = 'Unknown Project';
      let reportDate = new Date().toLocaleDateString();
      let reportCreatedDate = '';
      let reportNumber = `FIR-${Date.now()}`;
      
      metaTexts?.forEach((p) => {
        const text = p.textContent || '';
        if (text.includes('Project:')) {
          projectName = text.replace('Project:', '').trim();
        } else if (text.includes('Created:')) {
          reportCreatedDate = text.replace('Created:', '').trim();
        } else if (text.includes('Date:')) {
          reportDate = text.replace('Date:', '').trim();
        } else if (text.includes('Report #:') || text.includes('Report #')) {
          reportNumber = text.replace('Report #:', '').replace('Report #', '').trim();
        }
      });
      
      // If no created date found, use today's date
      if (!reportCreatedDate) {
        reportCreatedDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      // Extract sections from the HTML
      const sections: { title: string; content: string; items?: string[] }[] = [];
      content.querySelectorAll('.report-section').forEach((section) => {
        const title = section.querySelector('.section-heading')?.textContent?.trim() || '';
        
        // Get all text content from section paragraphs (may have multiple .section-text elements or direct p tags)
        const textElements = section.querySelectorAll('.section-text, p:not(.section-heading)');
        let text = '';
        textElements.forEach((el) => {
          const elText = el.textContent?.trim();
          if (elText) {
            text += (text ? '\n\n' : '') + elText;
          }
        });
        
        // Also check for direct text content if no paragraphs found
        if (!text) {
          const clonedSection = section.cloneNode(true) as Element;
          // Remove heading and list elements to get remaining text
          clonedSection.querySelectorAll('.section-heading, ul, ol, li').forEach(el => el.remove());
          text = clonedSection.textContent?.trim() || '';
        }
        
        const items: string[] = [];
        section.querySelectorAll('li').forEach((li) => {
          const itemText = li.textContent?.trim();
          if (itemText) items.push(itemText);
        });
        if (title) {
          sections.push({ title, content: text, items: items.length > 0 ? items : undefined });
        }
      });
      
      // Extract and convert photos to base64
      const photos: { url: string; base64?: string; caption: string }[] = [];
      const photoContainers = content.querySelectorAll('.photo-container');
      
      for (const container of Array.from(photoContainers)) {
        const img = container.querySelector('img') as HTMLImageElement;
        const caption = container.querySelector('.photo-caption')?.textContent?.trim() || '';
        
        if (img?.src) {
          try {
            const response = await fetch(img.src);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            photos.push({ url: img.src, base64, caption });
          } catch (e) {
            console.warn('Could not convert photo to base64:', img.src);
            photos.push({ url: img.src, caption });
          }
        }
      }
      
      // Convert logo to base64
      let logoBase64: string | undefined;
      const logoImg = content.querySelector('.report-logo') as HTMLImageElement;
      
      if (logoImg?.src) {
        try {
          const response = await fetch(logoImg.src);
          const blob = await response.blob();
          logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn('Could not load logo for PDF:', e);
        }
      }
      
      // If no logo found in content, try loading from company config
      if (!logoBase64 && companyConfig.logo) {
        try {
          // Build full URL from relative path
          const logoUrl = companyConfig.logo.startsWith('http') 
            ? companyConfig.logo 
            : `${window.location.origin}${companyConfig.logo}`;
          const response = await fetch(logoUrl);
          const blob = await response.blob();
          logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn('Could not load company logo:', e);
        }
      }
      
      // Filter out photos without valid base64 data
      const validPhotos = photos.filter(p => p.base64);
      
      // Ensure we have at least one section
      const finalSections = sections.length > 0 ? sections : [{
        title: 'Field Inspection Summary',
        content: 'This field inspection report documents the current condition of the property.',
      }];
      
      // Generate PDF using @react-pdf/renderer
      let pdfBlob: Blob;
      try {
        pdfBlob = await pdf(
          <FieldInspectionReportPDF
            companyName={companyConfig.legalName}
            companyAddress={companyConfig.address.full}
            companyPhone={companyConfig.phone}
            companyEmail={companyConfig.email}
            companyLicense={companyConfig.licenseNumber}
            logoBase64={logoBase64}
            projectName={projectName}
            reportDate={reportDate}
            reportCreatedDate={reportCreatedDate}
            reportNumber={reportNumber}
            sections={finalSections}
            photos={validPhotos}
          />
        ).toBlob();
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        throw new Error(`PDF generation failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
      }
      
      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = reportName.replace(/\.html$/i, '') + '.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-xl p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-medium truncate pr-2">
              {reportName}
            </SheetTitle>
            <div className="flex items-center gap-1">
              {isEditing ? (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-8"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={handleEdit} className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-80px)]">
          <div className="p-4" ref={contentRef}>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Loading report...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-destructive">{error}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={handleOpenExternal}>
                  Open in browser
                </Button>
              </div>
            ) : isEditing ? (
              <div
                ref={editableRef}
                className="report-content prose prose-sm max-w-none dark:prose-invert outline-none border-2 border-primary/20 rounded-lg p-4 bg-background"
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={{
                  lineHeight: 1.6,
                  minHeight: '200px',
                }}
              />
            ) : (
              <div 
                className="report-content prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={{
                  lineHeight: 1.6,
                }}
              />
            )}
          </div>
        </ScrollArea>

        <style>{`
          /* Professional Report Header */
          .report-content .report-header {
            display: flex;
            align-items: center;
            gap: 16px;
            padding-bottom: 16px;
            margin-bottom: 20px;
            border-bottom: 2px solid hsl(var(--primary));
          }
          .report-content .report-logo {
            width: 70px;
            height: auto;
            object-fit: contain;
            border-radius: 4px;
          }
          .report-content .company-info {
            flex: 1;
          }
          .report-content .company-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: hsl(var(--foreground));
            margin: 0 0 4px 0;
            letter-spacing: 0.5px;
          }
          .report-content .company-detail {
            font-size: 0.75rem;
            color: hsl(var(--muted-foreground));
            margin: 2px 0;
          }
          .report-content .company-license {
            font-size: 0.75rem;
            color: hsl(var(--primary));
            font-weight: 600;
            margin: 4px 0 0 0;
          }

          /* Report Title Section */
          .report-content .report-title-section {
            text-align: center;
            margin-bottom: 20px;
          }
          .report-content .report-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: hsl(var(--foreground));
            margin: 0 0 12px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .report-content .report-meta {
            background: hsl(var(--muted));
            padding: 12px 16px;
            border-radius: 8px;
            display: inline-block;
            text-align: left;
          }
          .report-content .report-meta p {
            margin: 4px 0;
            font-size: 0.85rem;
            color: hsl(var(--foreground));
          }

          /* Divider */
          .report-content .report-divider {
            height: 2px;
            background: linear-gradient(to right, hsl(var(--primary)), transparent);
            margin: 20px 0;
          }

          /* Report Content Sections */
          .report-content .report-section {
            margin-bottom: 24px;
          }
          .report-content .section-heading {
            font-size: 1rem;
            font-weight: 600;
            color: hsl(var(--primary));
            margin: 0 0 12px 0;
            padding-bottom: 6px;
            border-bottom: 1px solid hsl(var(--border));
          }
          .report-content .section-text {
            color: hsl(var(--muted-foreground));
            font-size: 0.9rem;
            line-height: 1.6;
            margin: 8px 0;
          }

          /* Work List */
          .report-content .work-list,
          .report-content .findings-list,
          .report-content .recommendations-list {
            padding-left: 20px;
            margin: 12px 0;
          }
          .report-content .work-list li,
          .report-content .findings-list li,
          .report-content .recommendations-list li {
            color: hsl(var(--muted-foreground));
            margin-bottom: 8px;
            font-size: 0.9rem;
            line-height: 1.5;
          }

          /* Photo Documentation */
          .report-content .photo-documentation {
            margin: 16px 0;
          }
          .report-content .photo-container {
            background: hsl(var(--muted));
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
          }
          .report-content .report-photo {
            width: 100%;
            max-width: 400px;
            height: auto;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            margin-bottom: 8px;
          }
          .report-content .photo-caption {
            font-size: 0.85rem;
            color: hsl(var(--muted-foreground));
            margin: 8px 0 0 0;
            line-height: 1.5;
          }

          /* Report Footer */
          .report-content .report-footer {
            margin-top: 32px;
            padding-top: 16px;
            text-align: center;
          }
          .report-content .footer-divider {
            height: 2px;
            background: linear-gradient(to right, transparent, hsl(var(--primary)), transparent);
            margin-bottom: 16px;
          }
          .report-content .footer-tagline {
            font-size: 0.9rem;
            font-style: italic;
            color: hsl(var(--primary));
            font-weight: 500;
            margin: 0 0 8px 0;
          }
          .report-content .footer-contact {
            font-size: 0.75rem;
            color: hsl(var(--muted-foreground));
            margin: 4px 0;
          }
          .report-content .footer-address {
            font-size: 0.75rem;
            color: hsl(var(--muted-foreground));
            margin: 4px 0;
          }

          /* Legacy styles for backwards compatibility */
          .report-content h2 {
            color: hsl(var(--primary));
            border-bottom: 2px solid hsl(var(--border));
            padding-bottom: 0.5rem;
            margin-top: 0;
            font-size: 1.25rem;
            font-weight: 600;
          }
          .report-content h3 {
            color: hsl(var(--foreground));
            margin-top: 1.5rem;
            font-size: 1rem;
            font-weight: 600;
          }
          .report-content p {
            margin: 0.75rem 0;
            color: hsl(var(--muted-foreground));
          }
          .report-content .meta {
            color: hsl(var(--muted-foreground));
            font-style: italic;
            margin-bottom: 1.5rem;
          }
          .report-content img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin: 0.75rem 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .report-content .photo-section {
            margin: 1rem 0;
          }
          .report-content .caption {
            color: hsl(var(--muted-foreground));
            font-size: 0.875rem;
            margin-top: 0.25rem;
          }
          .report-content ul {
            padding-left: 1.25rem;
            margin: 0.75rem 0;
          }
          .report-content li {
            margin-bottom: 0.5rem;
            color: hsl(var(--muted-foreground));
          }
          .report-content[contenteditable]:focus {
            outline: none;
          }
        `}</style>
      </SheetContent>
    </Sheet>
  );
};
