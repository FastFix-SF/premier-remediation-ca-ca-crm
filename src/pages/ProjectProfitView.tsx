import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDateRangePicker } from '@/components/ui/calendar-date-range-picker';
import { ArrowLeft, Calculator, DollarSign, TrendingUp, Users, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LaborTab } from '@/components/profit/LaborTab';
import { MaterialsTab } from '@/components/profit/MaterialsTab';
import { PhotosTab } from '@/components/profit/PhotosTab';
import { ReportsTab } from '@/components/profit/ReportsTab';
import { IncidentsTab } from '@/components/profit/IncidentsTab';
import { RatingTab } from '@/components/profit/RatingTab';
import { ProfitKPICards } from '@/components/profit/ProfitKPICards';
import { BudgetVsActual } from '@/components/profit/BudgetVsActual';
import { useProjectProfitability } from '@/hooks/useProjectProfitability';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProfitabilityV2 } from '@/pages/projects/ProfitabilityV2';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { ProjectSummaryDashboard } from '@/components/profit/summary';

export const ProjectProfitView = () => {
  // Check feature flag
  const isProfitV2 = import.meta.env.VITE_PROFIT_V2 === "1";
  
  // If V2 is enabled, render the new version
  if (isProfitV2) {
    return <ProfitabilityV2 />;
  }
  
  // Otherwise, render the original version below
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('summary');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), 0, 1), // Start of year
    to: new Date()
  });
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const {
    profitData,
    laborData,
    materialsData,
    isLoading,
    syncProjectLabor,
    refreshData
  } = useProjectProfitability(id!, dateRange);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLabor = async () => {
    if (!project?.connectteam_job_id) {
      toast({
        title: "ConnectTeam Not Linked",
        description: "Please link a ConnectTeam job first to sync labor data",
        variant: "destructive",
      });
      return;
    }

    try {
      await syncProjectLabor();
      toast({
        title: "Success",
        description: "Labor data synced successfully",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync labor data from ConnectTeam",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (gp: number) => {
    if (gp >= 25) return 'bg-green-500/10 text-green-700 border-green-200';
    if (gp >= 15) return 'bg-blue-500/10 text-blue-700 border-blue-200';
    if (gp >= 5) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    return 'bg-red-500/10 text-red-700 border-red-200';
  };

  const getStatusText = (gp: number) => {
    if (gp >= 25) return 'Excellent';
    if (gp >= 15) return 'Acceptable';
    if (gp >= 5) return 'Mediocre';
    return 'Poor';
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <ProjectSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project profitability...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex bg-background">
        <ProjectSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested project could not be found.</p>
            <Button onClick={() => navigate('/admin')}>Back to Projects</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <ProjectSidebar />
      <div className="flex-1 p-6 max-w-7xl overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{project.name} - Profitability</h1>
            <p className="text-muted-foreground">{project.property_address}</p>
          </div>
          <div className="flex items-center space-x-4">
            <CalendarDateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              align="end"
            />
            <Badge className={getStatusColor(profitData?.gp_percentage || 0)}>
              {getStatusText(profitData?.gp_percentage || 0)}
            </Badge>
          </div>
        </div>

        {/* KPI Cards */}
        <ProfitKPICards 
          profitData={profitData} 
          laborData={laborData}
          materialsData={materialsData}
          project={project}
        />

        <div className="grid grid-cols-12 gap-6 mt-6">
          {/* Main Content */}
          <div className="col-span-9">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="bg-muted/50 rounded-xl border shadow-sm p-1.5 inline-flex">
                <TabsList variant="segmented">
                  <TabsTrigger variant="segmented" value="summary" className="flex items-center space-x-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Summary</span>
                  </TabsTrigger>
                  <TabsTrigger variant="segmented" value="labor" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Labor</span>
                  </TabsTrigger>
                  <TabsTrigger variant="segmented" value="materials" className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4" />
                    <span>Materials</span>
                  </TabsTrigger>
                  <TabsTrigger variant="segmented" value="photos" className="flex items-center space-x-2">
                    <span>Photos</span>
                  </TabsTrigger>
                  <TabsTrigger variant="segmented" value="reports" className="flex items-center space-x-2">
                    <span>Reports</span>
                  </TabsTrigger>
                  <TabsTrigger variant="segmented" value="incidents" className="flex items-center space-x-2">
                    <span>Incidents</span>
                  </TabsTrigger>
                  <TabsTrigger variant="segmented" value="rating" className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Rating</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="summary">
                <ProjectSummaryDashboard 
                  projectId={id!}
                  project={project}
                  profitData={profitData}
                />
              </TabsContent>

              <TabsContent value="labor">
                <LaborTab 
                  projectId={id!} 
                  dateRange={dateRange}
                  laborData={laborData}
                  onSyncLabor={handleSyncLabor}
                />
              </TabsContent>

              <TabsContent value="materials">
                <MaterialsTab 
                  projectId={id!} 
                  dateRange={dateRange}
                  materialsData={materialsData}
                  onRefresh={refreshData}
                />
              </TabsContent>

              <TabsContent value="photos">
                <PhotosTab projectId={id!} />
              </TabsContent>

              <TabsContent value="reports">
                <ReportsTab 
                  projectId={id!} 
                  dateRange={dateRange}
                  laborData={laborData}
                />
              </TabsContent>

              <TabsContent value="incidents">
                <IncidentsTab projectId={id!} />
              </TabsContent>

              <TabsContent value="rating">
                <RatingTab 
                  projectId={id!} 
                  project={project}
                  profitData={profitData}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="col-span-3 space-y-6">
            {/* Project Facts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Facts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{project.property_address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{project.customer_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline">{project.status}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Budget vs Actual */}
            <BudgetVsActual 
              project={project}
              actualLabor={profitData?.total_labor_cost || 0}
              actualMaterials={profitData?.total_materials_cost || 0}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSyncLabor} 
                  className="w-full"
                  disabled={!project.connectteam_job_id}
                >
                  Sync Labor Data
                </Button>
                <Button variant="outline" className="w-full">
                  Import Materials
                </Button>
                <Button variant="outline" className="w-full">
                  Add Daily Report
                </Button>
                <Button variant="outline" className="w-full">
                  Upload Photos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};