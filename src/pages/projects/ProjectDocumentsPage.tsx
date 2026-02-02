import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { ProjectDocumentCategories } from '@/components/projects/ProjectDocumentCategories';
import { supabase } from '@/integrations/supabase/client';

export const ProjectDocumentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery({
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

  if (isLoading) {
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{project?.name}</h1>
          <p className="text-muted-foreground">Project Documents & Records</p>
        </div>

        {/* Document Categories */}
        {id && <ProjectDocumentCategories projectId={id} />}
      </div>
    </div>
  );
};

export default ProjectDocumentsPage;
