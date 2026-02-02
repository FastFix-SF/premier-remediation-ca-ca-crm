import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { ProjectUpdatesFeed } from '@/components/admin/ProjectUpdatesFeed';
import { Calendar } from 'lucide-react';

export const ProjectTimelinePage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen flex bg-background">
      <ProjectSidebar />
      <div className="flex-1 px-6 py-6 space-y-6 overflow-auto">
        <div>
          <h1 className="text-2xl font-bold">Timeline</h1>
          <p className="text-muted-foreground mt-1">Project updates and history</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Project Updates & History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectUpdatesFeed projectId={id || null} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectTimelinePage;
