import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { FileText, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReportsTabProps {
  quoteId: string;
  customerName: string;
  propertyAddress: string;
}

const DEFAULT_SCOPE_LETTER = `Dear {customerName},

Thank you for considering us for your roofing project at {propertyAddress}.

Project Scope:
- Total roof area: {areaSq} square feet
- Perimeter: {perimeterLf} linear feet
- Materials: High-quality architectural shingles with full underlayment system

Our team will:
• Remove existing roofing materials
• Install ice & water shield at all critical areas
• Install synthetic underlayment across entire roof deck
• Install premium architectural shingles
• Install ridge cap and drip edge
• Complete thorough cleanup

This proposal is valid for 30 days. We look forward to working with you.

Best regards,
Roofing Team`;

export const ReportsTab: React.FC<ReportsTabProps> = ({ 
  quoteId, 
  customerName, 
  propertyAddress 
}) => {
  const [scopeLetter, setScopeLetter] = useState(DEFAULT_SCOPE_LETTER);

  const replacedTokens = scopeLetter
    .replace(/{customerName}/g, customerName)
    .replace(/{propertyAddress}/g, propertyAddress || 'your property')
    .replace(/{areaSq}/g, '1,250') // Placeholder
    .replace(/{perimeterLf}/g, '180'); // Placeholder

  const exportPDF = () => {
    toast.success('PDF export functionality coming soon');
  };

  const exportCSV = () => {
    const csv = `Item,Unit,Quantity,Unit Cost,Markup %,Total
Shingles,sq,12,85,15,1173
Ice & Water Shield,roll,4,95,15,437
Synthetic Underlayment,roll,6,75,15,517.5
Drip Edge,lf,180,2.5,15,517.5
Ridge Cap,lf,45,4.5,15,232.88`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quote-${quoteId}-bom.csv`;
    a.click();
    toast.success('BOM exported to CSV');
  };

  const shareLink = () => {
    const link = `${window.location.origin}/quote/${quoteId}`;
    navigator.clipboard.writeText(link);
    toast.success('Share link copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Scope Letter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Scope of Work Letter
            </CardTitle>
            <Button onClick={exportPDF} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Template (with tokens)</label>
            <Textarea
              value={scopeLetter}
              onChange={(e) => setScopeLetter(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              Available tokens: {'{customerName}'}, {'{propertyAddress}'}, {'{areaSq}'}, {'{perimeterLf}'}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Live Preview</label>
            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm border">
              {replacedTokens}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BOM Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Bill of Materials (BOM)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Export a detailed list of all materials with quantities and costs.
          </p>
          <Button onClick={exportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV/Excel
          </Button>
        </CardContent>
      </Card>

      {/* Share Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Quote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generate a shareable link for the client to view this quote.
          </p>
          <Button onClick={shareLink} variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Copy Share Link
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
