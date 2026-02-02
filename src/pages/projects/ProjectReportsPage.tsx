import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, BarChart3, Clock, DollarSign, Download, 
  Calendar, TrendingUp, Users, Clipboard
} from 'lucide-react';
import { format } from 'date-fns';

const REPORT_TYPES = [
  {
    id: 'daily-log',
    title: 'Daily Log Summary',
    description: 'Summary of all daily work logs, weather conditions, and crew notes',
    icon: Clipboard,
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    id: 'financial',
    title: 'Financial Report',
    description: 'Budget vs actual costs, labor expenses, and material costs breakdown',
    icon: DollarSign,
    color: 'bg-emerald-500/10 text-emerald-500',
  },
  {
    id: 'progress',
    title: 'Progress Report',
    description: 'Overall project progress, milestones completed, and remaining work',
    icon: TrendingUp,
    color: 'bg-amber-500/10 text-amber-500',
  },
  {
    id: 'time-summary',
    title: 'Time Summary',
    description: 'Total hours worked by each team member with breakdown by date',
    icon: Clock,
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    id: 'billing',
    title: 'Billing Report',
    description: 'Schedule of values progress and billing history',
    icon: FileText,
    color: 'bg-rose-500/10 text-rose-500',
  },
  {
    id: 'team',
    title: 'Team Report',
    description: 'Team member assignments, roles, and contact information',
    icon: Users,
    color: 'bg-cyan-500/10 text-cyan-500',
  },
];

export const ProjectReportsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Get recent daily reports
  const { data: dailyReports = [] } = useQuery({
    queryKey: ['project-daily-reports', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_daily_reports')
        .select('*')
        .eq('project_id', id)
        .order('report_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleGenerateReport = async (reportType: string) => {
    setGenerating(reportType);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: 'Report Generated',
      description: 'Your report is ready for download',
    });
    
    setGenerating(null);
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <ProjectSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <ProjectSidebar />
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{project?.name} - Reports</h1>
            <p className="text-muted-foreground">Generate and download project reports</p>
          </div>
        </div>

        {/* Report Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {REPORT_TYPES.map((report) => {
            const IconComponent = report.icon;
            const isGenerating = generating === report.id;
            
            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${report.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-4">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={isGenerating}
                    className="w-full"
                    variant="outline"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Daily Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clipboard className="w-5 h-5" />
                  Recent Daily Reports
                </CardTitle>
                <CardDescription>Latest daily work logs for this project</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dailyReports.length === 0 ? (
              <div className="text-center py-8">
                <Clipboard className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No daily reports yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dailyReports.map((report) => (
                  <div 
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {format(new Date(report.report_date), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {report.summary?.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {report.weather && (
                        <Badge variant="secondary">Weather logged</Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reports Generated</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Logs</p>
                  <p className="text-2xl font-bold">{dailyReports.length}</p>
                </div>
                <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Clipboard className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Report</p>
                  <p className="text-2xl font-bold">Today</p>
                </div>
                <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Downloads</p>
                  <p className="text-2xl font-bold">45</p>
                </div>
                <div className="h-10 w-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Download className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectReportsPage;
