import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import PhotoUpload from '@/components/admin/PhotoUpload';
import { Camera } from 'lucide-react';

export const ProjectPhotosPage: React.FC = () => {
  const { id } = useParams();

  const handlePhotoUploaded = () => {
    // Refresh or handle photo upload completion
  };

  return (
    <div className="min-h-screen flex bg-background">
      <ProjectSidebar />
      <div className="flex-1 px-6 py-6 space-y-6 overflow-auto">
        <div>
          <h1 className="text-2xl font-bold">Files & Photos</h1>
          <p className="text-muted-foreground mt-1">Manage project photos and files</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photo Management
            </CardTitle>
            <CardDescription>
              Upload and manage project photos that customers can view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoUpload 
              projectId={id!} 
              onPhotoUploaded={handlePhotoUploaded}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
