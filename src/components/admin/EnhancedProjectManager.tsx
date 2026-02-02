import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  DollarSign, 
  FileText, 
  Camera,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';
import ProjectManager from './ProjectManager';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  start_date?: string;
  end_date?: string;
  address?: string;
  project_type?: string;
  project_category?: string;
  roof_type?: string;
  is_public?: boolean;
  is_featured?: boolean;
  customer_rating?: number;
  customer_email?: string;
  progress_percentage?: number;
  assigned_sales_rep?: string;
  assigned_project_manager?: string;
  assigned_crew_leader?: string;
}

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  onTime: number;
  revenue: number;
  avgProgress: number;
}

const PROJECT_PHASES = [
  { id: 'lead', name: 'Lead', color: 'bg-blue-100 text-blue-800' },
  { id: 'quote', name: 'Quote', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'contract', name: 'Contract', color: 'bg-purple-100 text-purple-800' },
  { id: 'production', name: 'Production', color: 'bg-orange-100 text-orange-800' },
  { id: 'closeout', name: 'Close-out', color: 'bg-green-100 text-green-800' }
];

export const EnhancedProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    active: 0,
    completed: 0,
    onTime: 0,
    revenue: 0,
    avgProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_assignments(customer_email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const projectsData = data || [];
      setProjects(projectsData);

      // Calculate stats
      const total = projectsData.length;
      const active = projectsData.filter(p => !['completed', 'cancelled'].includes(p.status)).length;
      const completed = projectsData.filter(p => p.status === 'completed').length;
      const onTime = projectsData.filter(p => 
        p.status === 'completed' && 
        p.end_date && 
        new Date(p.updated_at) <= new Date(p.end_date)
      ).length;
      
      // Mock revenue calculation - in real app, this would come from financial data
      const revenue = completed * 15000; // Average $15k per project
      
      // Mock average progress calculation - in real app, this would come from actual progress data
      const avgProgress = 65; // Mock 65% average progress

      setStats({ total, active, completed, onTime, revenue, avgProgress });
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectPhase = (status: string) => {
    const phaseMap: Record<string, string> = {
      'planning': 'lead',
      'quoted': 'quote', 
      'approved': 'contract',
      'in_progress': 'production',
      'completed': 'closeout'
    };
    return phaseMap[status] || 'lead';
  };

  const ProjectTimeline: React.FC<{ project: Project }> = ({ project }) => {
    const currentPhase = getProjectPhase(project.status);
    const currentPhaseIndex = PROJECT_PHASES.findIndex(p => p.id === currentPhase);
    
    return (
      <div className="flex items-center space-x-2">
        {PROJECT_PHASES.map((phase, index) => (
          <React.Fragment key={phase.id}>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
              ${index <= currentPhaseIndex 
                ? 'bg-primary text-white' 
                : 'bg-gray-200 text-gray-500'
              }
            `}>
              {index + 1}
            </div>
            {index < PROJECT_PHASES.length - 1 && (
              <div className={`
                w-8 h-1 rounded
                ${index < currentPhaseIndex ? 'bg-primary' : 'bg-gray-200'}
              `} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Project Management</h2>
          <p className="text-muted-foreground">Complete project lifecycle management</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onTime}</div>
            <p className="text-xs text-muted-foreground">Delivered on time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.revenue / 1000).toFixed(0)}k</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProgress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Overall completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-muted/50 rounded-xl border shadow-sm p-1.5 inline-flex">
          <TabsList variant="segmented">
            <TabsTrigger variant="segmented" value="overview">Overview</TabsTrigger>
            <TabsTrigger variant="segmented" value="details">Details</TabsTrigger>
            <TabsTrigger variant="segmented" value="financials">Financials</TabsTrigger>
            <TabsTrigger variant="segmented" value="schedule">Schedule</TabsTrigger>
            <TabsTrigger variant="segmented" value="files">Files & Photos</TabsTrigger>
            <TabsTrigger variant="segmented" value="reports">Reports</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Project Cards with Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 9).map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Timeline */}
                  <div>
                    <p className="text-sm font-medium mb-2">Project Timeline</p>
                    <ProjectTimeline project={project} />
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.floor(Math.random() * 100)}%</span>
                    </div>
                    <Progress value={Math.floor(Math.random() * 100)} className="h-2" />
                  </div>

                  {/* Team Assignments */}
                  {(project.assigned_sales_rep || project.assigned_project_manager || project.assigned_crew_leader) && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Team</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {project.assigned_sales_rep && (
                          <div>Sales: {project.assigned_sales_rep}</div>
                        )}
                        {project.assigned_project_manager && (
                          <div>PM: {project.assigned_project_manager}</div>
                        )}
                        {project.assigned_crew_leader && (
                          <div>Crew: {project.assigned_crew_leader}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="text-xs text-muted-foreground">
                    Created: {format(new Date(project.created_at), 'MMM d, yyyy')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details">
          <ProjectManager />
        </TabsContent>

        <TabsContent value="financials">
          <Card>
            <CardHeader>
              <CardTitle>Financial Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Financial tracking coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Project Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Scheduling system coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Files & Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Document management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Project Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Reporting system coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};