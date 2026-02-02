import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Mail, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateScopeContent } from '@/lib/roof-quoter/calculations';

interface ExportTabProps {
  projectId: string;
}

export function ExportTab({ projectId }: ExportTabProps) {
  const { toast } = useToast();

  // Fetch project data for exports
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          roof_quoter_projects (*)
        `)
        .eq('id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const { data: quantities } = useQuery({
    queryKey: ['quantities', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quantities')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const { data: priceSheets } = useQuery({
    queryKey: ['price-sheets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_sheets')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    }
  });

  const handleExportScopeLetter = async (system: string) => {
    if (!quantities) {
      toast({
        title: "No Data",
        description: "Please complete the roof measurements first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate scope content
      const scopeContent = generateScopeContent(system, quantities);
      
      // Create and download as text file for now
      const blob = new Blob([scopeContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name || 'project'}-scope-${system.toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Scope Letter Exported",
        description: `${system} scope letter has been downloaded.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export scope letter. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportProposal = () => {
    toast({
      title: "Coming Soon",
      description: "PDF proposal export will be available in the next update.",
    });
  };

  const handleExportCSV = () => {
    if (!quantities) {
      toast({
        title: "No Data",
        description: "Please complete the roof measurements first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate CSV content
      const csvContent = [
        'Item,Quantity,Unit',
        `Area,${quantities.area_sq.toFixed(2)},SQ`,
        `Eave,${quantities.eave_lf.toFixed(0)},LF`,
        `Rake,${quantities.rake_lf.toFixed(0)},LF`,
        `Ridge,${quantities.ridge_lf.toFixed(0)},LF`,
        `Hip,${quantities.hip_lf.toFixed(0)},LF`,
        `Valley,${quantities.valley_lf.toFixed(0)},LF`,
        `Wall,${quantities.wall_lf.toFixed(0)},LF`,
        `Step,${quantities.step_lf.toFixed(0)},LF`
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name || 'project'}-quantities.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "CSV Exported",
        description: "Quantities have been exported to CSV.",
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export CSV. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Scope Letters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Scope Letters
            </CardTitle>
            <CardDescription>
              Generate detailed scope of work documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleExportScopeLetter('TPO')}
            >
              <Download className="w-4 h-4 mr-2" />
              TPO Scope Letter
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleExportScopeLetter('METAL')}
            >
              <Download className="w-4 h-4 mr-2" />
              Metal Scope Letter
            </Button>
          </CardContent>
        </Card>

        {/* Proposals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Proposals
            </CardTitle>
            <CardDescription>
              Professional proposal documents with pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleExportProposal}
            >
              <Download className="w-4 h-4 mr-2" />
              Full Proposal PDF
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleExportProposal}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Proposal
            </Button>
          </CardContent>
        </Card>

        {/* Data Exports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Data Export
            </CardTitle>
            <CardDescription>
              Export measurements and quantities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleExportCSV}
            >
              <Download className="w-4 h-4 mr-2" />
              Quantities CSV
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              disabled
            >
              <Download className="w-4 h-4 mr-2" />
              Geometry JSON
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      {quantities && (
        <Card>
          <CardHeader>
            <CardTitle>Project Summary</CardTitle>
            <CardDescription>
              Quick overview of roof measurements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {quantities.area_sq.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Squares
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {quantities.eave_lf.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Eave LF
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {quantities.rake_lf.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Rake LF
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {(quantities.ridge_lf + quantities.hip_lf).toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Ridge/Hip LF
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Templates Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Template Preview</CardTitle>
          <CardDescription>
            Preview of scope letter content (TPO system)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">
              {quantities ? generateScopeContent('TPO', quantities).slice(0, 500) + '...' : 'Complete measurements to see template preview'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}