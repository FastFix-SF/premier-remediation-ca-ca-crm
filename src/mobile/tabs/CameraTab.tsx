import React, { useState, useRef } from 'react';
import { Camera, Upload, FolderOpen, Image, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { offlineQueue } from '@/lib/offline-queue';
import { useToast } from '@/hooks/use-toast';
import { useMobileProjects } from '@/mobile/hooks/useMobileProjects';
import { useMobilePhotoUpload } from '@/mobile/hooks/useMobilePhotos';
import { MobilePhotoEditor } from '@/mobile/components/MobilePhotoEditor';
import { AccessRequestBanner } from '@/mobile/components/AccessRequestBanner';
import { PendingAccessRequestsNotification } from '@/mobile/components/PendingAccessRequestsNotification';
import { useProjectAccessRequest } from '@/mobile/hooks/useProjectAccessRequest';

export const CameraTab: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { data: projects = [], isLoading: projectsLoading } = useMobileProjects();
  const uploadPhotoMutation = useMobilePhotoUpload();
  
  // Get selected project details and access status
  const selectedProjectDetails = projects.find(p => p.id === selectedProject);
  const { hasAccess } = useProjectAccessRequest(selectedProject);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedProject) {
      toast({
        title: "Missing Information",
        description: "Please select a project and take a photo.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Check if we're online
      if (navigator.onLine) {
        // Upload directly
        await uploadPhotoMutation.mutateAsync({
          projectId: selectedProject,
          file: selectedFile,
          caption: note.trim() || undefined,
        });
      } else {
        // Add to offline queue
        await offlineQueue.addPhotoToQueue(selectedProject, selectedFile, note);
        
        toast({
          title: "Photo Queued",
          description: "Photo added to upload queue. It will sync when connection is available.",
        });
      }

      // Reset form
      setSelectedFile(null);
      setPreviewUrl('');
      setNote('');
      setSelectedProject('');
      
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process photo upload.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setNote('');
    setShowEditor(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleEditPhoto = () => {
    if (selectedFile) {
      setShowEditor(true);
    }
  };

  const handleSaveAnnotatedPhoto = (annotatedFile: File) => {
    setSelectedFile(annotatedFile);
    const url = URL.createObjectURL(annotatedFile);
    setPreviewUrl(url);
    setShowEditor(false);
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
  };

  if (showEditor && selectedFile) {
    return (
      <MobilePhotoEditor
        imageFile={selectedFile}
        onSave={handleSaveAnnotatedPhoto}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground mb-2">Camera</h1>
        <p className="text-sm text-muted-foreground">
          Capture photos for your projects
        </p>
      </div>

      {/* Pending Access Requests Notification */}
      <PendingAccessRequestsNotification />

      {/* Project Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <FolderOpen className="w-4 h-4" />
            <span>Select Project</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {projectsLoading ? (
            <div className="text-center text-muted-foreground">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <p>No projects available</p>
              <p className="text-sm">Create a project first to upload photos</p>
            </div>
          ) : (
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} ({project.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Access Request Banner - shows when user selects a project they don't have access to */}
          {selectedProject && !hasAccess && (
            <AccessRequestBanner 
              projectId={selectedProject} 
              projectName={selectedProjectDetails?.name}
            />
          )}
        </CardContent>
      </Card>

      {/* Camera Interface */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Camera className="w-4 h-4" />
            <span>Capture Photo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="absolute inset-0 w-full h-full object-cover rounded-lg border"
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleClear} className="flex-1">
                  Retake
                </Button>
                <Button variant="outline" onClick={handleEditPhoto} className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
              <Button onClick={handleCapture} className="w-full mt-2">
                Take Another
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Tap to capture a photo
                </p>
                <Button onClick={handleCapture}>
                  <Camera className="w-4 h-4 mr-2" />
                  Open Camera
                </Button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Notes */}
      {selectedFile && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add notes about this photo..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>
      )}

      {/* Upload Button - only show if user has access */}
      {selectedFile && selectedProject && hasAccess && (
        <Button 
          onClick={handleUpload} 
          disabled={isUploading}
          className="w-full"
          size="lg"
        >
          {isUploading ? (
            <>Uploading...</>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Photo
            </>
          )}
        </Button>
      )}
    </div>
  );
};