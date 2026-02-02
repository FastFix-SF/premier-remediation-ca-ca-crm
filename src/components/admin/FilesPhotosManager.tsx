import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { 
  Search, 
  FolderOpen, 
  Upload, 
  Grid3X3, 
  List, 
  Image as ImageIcon,
  FileText,
  File,
  Plus,
  Building2,
  Calendar,
  MoreVertical,
  Download,
  Trash2,
  Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  address?: string;
}

interface ProjectPhoto {
  id: string;
  project_id: string;
  photo_url: string;
  caption?: string;
  photo_tag?: string;
  uploaded_at: string;
  file_size?: number;
}

// Helper functions defined before component to avoid TDZ issues
const getFileName = (url: string) => {
  const parts = url.split('/');
  return parts[parts.length - 1] || 'Unknown';
};

const getFileType = (url: string): 'image' | 'pdf' | 'document' | 'other' => {
  const ext = url.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'ppt', 'pptx'].includes(ext || '')) return 'document';
  return 'other';
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FilesPhotosManager = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle file download
  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download failed",
        description: "Could not download the file",
        variant: "destructive"
      });
    }
  };

  // Handle file preview
  const handlePreview = (url: string, fileType: string) => {
    if (fileType === 'pdf') {
      window.open(url, '_blank');
    } else {
      setPreviewUrl(url);
    }
  };

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['admin-projects-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, address')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Project[];
    }
  });

  // Fetch photos for selected project
  const { data: photos = [], isLoading: photosLoading, refetch: refetchPhotos } = useQuery({
    queryKey: ['project-photos', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      
      const { data, error } = await supabase
        .from('project_photos')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data as ProjectPhoto[];
    },
    enabled: !!selectedProjectId
  });

  // Filter projects by search
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
    project.address?.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  // Filter photos by search
  const filteredPhotos = photos.filter(photo =>
    photo.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photo.photo_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getFileName(photo.photo_url).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedProjectId) {
      toast({
        title: "No project selected",
        description: "Please select a project first",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedProjectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-photos')
          .getPublicUrl(fileName);

        const { data: { user } } = await supabase.auth.getUser();
        
        const { error: insertError } = await supabase
          .from('project_photos')
          .insert({
            project_id: selectedProjectId,
            photo_url: publicUrl,
            caption: file.name,
            file_size: file.size,
            uploaded_by: user?.id || ''
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Upload successful",
        description: `${acceptedFiles.length} file(s) uploaded`
      });
      refetchPhotos();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [selectedProjectId, toast, refetchPhotos]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'video/mp4': ['.mp4'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    }
  });

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('project_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({ title: "File deleted" });
      refetchPhotos();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <>
    <div className="flex h-[calc(100vh-280px)] min-h-[600px] bg-background rounded-xl border shadow-sm overflow-hidden">
      {/* Projects Sidebar */}
      <div className="w-72 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">Projects & Opportunities</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={projectSearchQuery}
              onChange={(e) => setProjectSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Company Files option */}
            <button
              onClick={() => setSelectedProjectId(null)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                !selectedProjectId 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-foreground"
              )}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate font-medium">Company Files</span>
            </button>

            <div className="my-2 px-3">
              <div className="h-px bg-border" />
            </div>

            {projectsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 mb-1" />
              ))
            ) : (
              filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                    selectedProjectId === project.id 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <FolderOpen className="h-4 w-4 shrink-0" />
                  <span className="truncate">{project.name}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-4">
          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-colors cursor-pointer",
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {uploading ? 'Uploading...' : 'Drag & Drop Files or Click to Browse'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  JPEG, PNG, GIF, MP4, PDF, Word, PPT
                </p>
              </div>
            </div>
          </div>

          {/* Files Grid/List */}
          {!selectedProjectId ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a project to view files</p>
            </div>
          ) : photosLoading ? (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
                : "space-y-2"
            )}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className={viewMode === 'grid' ? "aspect-square rounded-xl" : "h-16"} />
              ))}
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files found</p>
              <p className="text-sm mt-1">Upload files to get started</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => {
                const fileType = getFileType(photo.photo_url);
                const fileName = getFileName(photo.photo_url);
                
                return (
                  <Card 
                    key={photo.id} 
                    className="group overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square bg-muted relative">
                      {fileType === 'image' ? (
                        <img
                          src={photo.photo_url}
                          alt={photo.caption || fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {fileType === 'pdf' ? (
                            <div className="text-center">
                              <FileText className="h-16 w-16 text-red-500 mx-auto" />
                              <span className="text-xs text-muted-foreground mt-2 block">.PDF</span>
                            </div>
                          ) : (
                            <File className="h-16 w-16 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      
                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handlePreview(photo.photo_url, fileType)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleDownload(photo.photo_url, fileName)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeletePhoto(photo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <p className="text-sm font-medium truncate" title={photo.caption || fileName}>
                        {photo.caption || fileName}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Project
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(photo.uploaded_at), 'dd MMM')}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPhotos.map((photo) => {
                const fileType = getFileType(photo.photo_url);
                const fileName = getFileName(photo.photo_url);
                
                return (
                  <div 
                    key={photo.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {fileType === 'image' ? (
                        <img
                          src={photo.photo_url}
                          alt={photo.caption || fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : fileType === 'pdf' ? (
                        <FileText className="h-6 w-6 text-red-500" />
                      ) : (
                        <File className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{photo.caption || fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(photo.file_size)}
                      </p>
                    </div>
                    
                    <Badge variant="secondary">Project</Badge>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(photo.uploaded_at), 'dd MMM yyyy')}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(photo.photo_url, fileType)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(photo.photo_url, fileName)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeletePhoto(photo.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPreviewUrl(null)}
              className="absolute top-2 right-2 w-8 h-8 p-0 text-white hover:bg-white/20 z-10"
            >
              <X className="w-4 h-4" />
            </Button>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="File preview"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
