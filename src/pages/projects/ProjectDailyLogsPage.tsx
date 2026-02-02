import React from 'react';
import { useParams } from 'react-router-dom';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { DailyLogsTab } from '@/components/daily-logs/DailyLogsTab';

export const ProjectDailyLogsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex min-h-screen bg-background">
      <ProjectSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <DailyLogsTab projectId={id} />
      </main>
    </div>
  );
};
