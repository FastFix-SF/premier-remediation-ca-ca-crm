import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { ProjectSummaryDashboard } from '@/components/profit/summary';
import { supabase } from '@/integrations/supabase/client';
import { useProjectProfitability } from '@/hooks/useProjectProfitability';

export const ProjectSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const dateRange = useMemo(
    () => ({
      from: new Date(new Date().getFullYear(), 0, 1),
      to: new Date(),
    }),
    []
  );

  const { profitData, isLoading: profitLoading } = useProjectProfitability(id!, dateRange);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading || profitLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <ProjectSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project summary...</p>
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <ProjectSidebar />
      <div className="flex-1 p-6 max-w-7xl overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{project.name} - Summary</h1>
          <p className="text-muted-foreground">{project.address}</p>
        </div>

        <ProjectSummaryDashboard 
          projectId={id!}
          project={project}
          profitData={profitData}
        />
      </div>
    </div>
  );
};

export default ProjectSummaryPage;
