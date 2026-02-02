
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { 
  Eye, 
  EyeOff, 
  Globe, 
  Lock, 
  Calendar,
  MapPin,
  CheckSquare,
  Square
} from 'lucide-react';
import { usePhotoManagement } from '../hooks/usePhotoManagement';

interface ProjectWithPhotos {
  id: string
  name: string
  location: string | null
  completed_date: string | null
  project_type: string | null
  status: string
  is_public: boolean | null
  published_at: string | null
  admin_notes: string | null
  photos: {
    id: string
    photo_url: string
    thumbnail_url: string | null
    photo_type: 'before' | 'after' | 'during' | null
    is_featured: boolean | null
    is_public: boolean | null
    published_at: string | null
    admin_notes: string | null
  }[]
}

interface AdminPhotoManagerProps {
  projects: ProjectWithPhotos[]
}

const AdminPhotoManager = ({ projects }: AdminPhotoManagerProps) => {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const { updatePhotoVisibility, updateProjectVisibility, bulkUpdatePhotos } = usePhotoManagement()

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos)
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId)
    } else {
      newSelection.add(photoId)
    }
    setSelectedPhotos(newSelection)
  }

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  const handleBulkAction = (isPublic: boolean) => {
    if (selectedPhotos.size === 0) return
    
    bulkUpdatePhotos.mutate({
      photoIds: Array.from(selectedPhotos),
      isPublic
    })
    
    setSelectedPhotos(new Set())
  }

  const selectAllPhotosFromProject = (project: ProjectWithPhotos) => {
    const projectPhotoIds = project.photos.map(p => p.id)
    const newSelection = new Set(selectedPhotos)
    
    const allSelected = projectPhotoIds.every(id => newSelection.has(id))
    
    if (allSelected) {
      projectPhotoIds.forEach(id => newSelection.delete(id))
    } else {
      projectPhotoIds.forEach(id => newSelection.add(id))
    }
    
    setSelectedPhotos(newSelection)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Photo Manager</h2>
          <p className="text-muted-foreground">
            Manage which projects and photos are visible to the public
          </p>
        </div>
        
        {selectedPhotos.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedPhotos.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction(true)}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              Make Public
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction(false)}
              className="gap-2"
            >
              <Lock className="w-4 h-4" />
              Make Private
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {projects.map((project) => {
          const isExpanded = expandedProjects.has(project.id)
          const projectPhotoIds = project.photos.map(p => p.id)
          const allPhotosSelected = projectPhotoIds.length > 0 && 
            projectPhotoIds.every(id => selectedPhotos.has(id))
          const somePhotosSelected = projectPhotoIds.some(id => selectedPhotos.has(id))

          return (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge 
                        variant={project.is_public ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {project.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {project.is_public ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {project.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {project.location}
                        </div>
                      )}
                      {project.completed_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(project.completed_date).getFullYear()}
                        </div>
                      )}
                      <span>{project.photos.length} photos</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {project.photos.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAllPhotosFromProject(project)}
                        className="gap-2"
                      >
                        {allPhotosSelected ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : somePhotosSelected ? (
                          <Square className="w-4 h-4 opacity-50" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                        Select All
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateProjectVisibility.mutate({
                        projectId: project.id,
                        isPublic: !project.is_public
                      })}
                      className="gap-2"
                    >
                      {project.is_public ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Hide Project
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Publish Project
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleProjectExpansion(project.id)}
                    >
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {project.photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={photo.thumbnail_url || photo.photo_url} 
                            alt={`${project.name} - ${photo.photo_type || 'photo'}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedPhotos.has(photo.id)}
                                onCheckedChange={() => togglePhotoSelection(photo.id)}
                                className="bg-white"
                              />
                              
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => updatePhotoVisibility.mutate({
                                  photoId: photo.id,
                                  isPublic: !photo.is_public
                                })}
                                className="gap-1"
                              >
                                {photo.is_public ? (
                                  <>
                                    <EyeOff className="w-3 h-3" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3" />
                                    Show
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {photo.photo_type || 'photo'}
                          </Badge>
                          
                          <Badge 
                            variant={photo.is_public ? "default" : "secondary"}
                            className="text-xs gap-1"
                          >
                            {photo.is_public ? (
                              <>
                                <Globe className="w-2 h-2" />
                                Public
                              </>
                            ) : (
                              <>
                                <Lock className="w-2 h-2" />
                                Private
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default AdminPhotoManager;
