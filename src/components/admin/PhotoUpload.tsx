import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Upload, X, Image as ImageIcon, Star, Pencil } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import AdminPhotoEditor from './AdminPhotoEditor';
import { compressImage, validateImageFile } from '@/utils/imageOptimization';

interface PhotoUploadProps {
  projectId: string;
  onPhotoUploaded?: () => void;
}

interface UploadingPhoto {
  id: string;
  file: File;
  progress: number;
  error?: string;
  preview: string;
}

interface ProjectPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  is_visible_to_customer: boolean;
  uploaded_at: string;
  display_order?: number;
  photo_tag: 'before' | 'after' | null | undefined;
  is_highlighted_before?: boolean;
  is_highlighted_after?: boolean;
  project_id: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ projectId, onPhotoUploaded }) => {
  const [uploadingPhotos, setUploadingPhotos] = useState<UploadingPhoto[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ProjectPhoto[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedPhotoForEdit, setSelectedPhotoForEdit] = useState<ProjectPhoto | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Fetch photos on component mount and project change
  useEffect(() => {
    console.log('📸 PhotoUpload state update - projectId:', projectId, 'photos:', existingPhotos.length);
    fetchPhotos();
  }, [projectId]);

  const fetchPhotos = async () => {
    if (!projectId) {
      console.log('❌ fetchPhotos: No projectId provided');
      return;
    }
    
    console.log('🔍 fetchPhotos: Fetching for project:', projectId);
    
    try {
      const { data, error } = await supabase
        .from('project_photos')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      console.log('📊 fetchPhotos: Raw DB response:', { data, error, count: data?.length });

      if (error) {
        console.error('❌ fetchPhotos: Database error:', error);
        throw error;
      }

      const validatedPhotos: ProjectPhoto[] = (data || []).map(photo => ({
        id: photo.id,
        photo_url: photo.photo_url,
        caption: photo.caption || undefined,
        is_visible_to_customer: photo.is_visible_to_customer,
        uploaded_at: photo.uploaded_at,
        display_order: photo.display_order || 0,
        photo_tag: photo.photo_tag as 'before' | 'after' | null,
        is_highlighted_before: photo.is_highlighted_before || false,
        is_highlighted_after: photo.is_highlighted_after || false,
        project_id: photo.project_id
      }));
      
      console.log('✅ fetchPhotos: Setting existingPhotos state with', validatedPhotos.length, 'photos');
      setExistingPhotos(validatedPhotos);
      
    } catch (error) {
      console.error('💥 fetchPhotos: Unexpected error:', error);
      toast({
        title: "Error loading photos",
        description: "Failed to load photos - please refresh",
        variant: "destructive"
      });
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => validateImageFile(file));

    validFiles.forEach(file => {
      const id = Math.random().toString(36).substr(2, 9);
      const preview = URL.createObjectURL(file);
      
      const uploadingPhoto: UploadingPhoto = {
        id,
        file,
        progress: 0,
        preview
      };

      setUploadingPhotos(prev => [...prev, uploadingPhoto]);
      uploadPhoto(uploadingPhoto);
    });
  };

  const uploadPhoto = async (uploadingPhoto: UploadingPhoto) => {
    try {
      // Update progress to show compression
      setUploadingPhotos(prev => 
        prev.map(p => 
          p.id === uploadingPhoto.id 
            ? { ...p, progress: 10 }
            : p
        )
      );

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // Check if user has permission to upload photos to this project
      // Permission is granted via RLS policies - if query succeeds, user has permission
      const { data: assignmentCheck } = await supabase
        .from('project_team_assignments')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.data.user.id)
        .maybeSingle();
      
      // Also check admin status
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('is_active')
        .eq('user_id', user.data.user.id)
        .maybeSingle();

      const { data: teamData } = await supabase
        .from('team_directory')
        .select('role')
        .eq('user_id', user.data.user.id)
        .eq('status', 'active')
        .maybeSingle();

      const hasPermission = 
        adminData?.is_active || 
        teamData?.role === 'owner' || 
        teamData?.role === 'admin' || 
        assignmentCheck;

      if (!hasPermission) {
        throw new Error('You must be assigned to this project to upload photos');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(uploadingPhoto.file.type)) {
        throw new Error('Only JPEG, PNG, and WebP files are allowed');
      }

      // Validate file size (50MB limit)
      const maxSizeBytes = 50 * 1024 * 1024; // 50MB
      if (uploadingPhoto.file.size > maxSizeBytes) {
        throw new Error('File size must be less than 50MB');
      }

      const compressedFile = await compressImage(uploadingPhoto.file, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.8
      });

      // Update progress to show upload starting
      setUploadingPhotos(prev => 
        prev.map(p => 
          p.id === uploadingPhoto.id 
            ? { ...p, progress: 30 }
            : p
        )
      );

      // Create unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `project_${projectId}_${timestamp}_${randomString}.${fileExtension}`;
      const filePath = `projects/${projectId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Update progress
      setUploadingPhotos(prev => 
        prev.map(p => 
          p.id === uploadingPhoto.id 
            ? { ...p, progress: 70 }
            : p
        )
      );

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(filePath);

      // Insert photo record into database
      const { error: dbError } = await supabase
        .from('project_photos')
        .insert({
          project_id: projectId,
          photo_url: publicUrl,
          is_visible_to_customer: false,
          uploaded_by: user.data.user.id,
          display_order: 0,
          photo_tag: null,
          is_highlighted_before: false,
          is_highlighted_after: false,
          file_size: compressedFile.size
        });

      if (dbError) {
        // Clean up uploaded file
        await supabase.storage
          .from('project-photos')
          .remove([filePath]);
        throw new Error(`Database save failed: ${dbError.message}`);
      }

      // Complete the progress
      setUploadingPhotos(prev => 
        prev.map(p => 
          p.id === uploadingPhoto.id 
            ? { ...p, progress: 100 }
            : p
        )
      );

      // Show success toast immediately
      const originalSize = (uploadingPhoto.file.size / 1024 / 1024).toFixed(1);
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(1);
      
      toast({
        title: "Photo uploaded successfully",
        description: `Image compressed from ${originalSize} MB to ${compressedSize} MB`,
      });

      // Remove from uploading list
      setUploadingPhotos(prev => prev.filter(p => p.id !== uploadingPhoto.id));
      
      console.log('🎉 Photo upload success - forcing immediate refresh');
      // IMMEDIATE refresh - no delays
      await fetchPhotos();
      onPhotoUploaded?.();
      console.log('✅ Upload success handlers completed');

    } catch (error) {
      console.error('Upload error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      
      setUploadingPhotos(prev => 
        prev.map(p => 
          p.id === uploadingPhoto.id 
            ? { ...p, error: errorMessage, progress: 0 }
            : p
        )
      );
      
      toast({
        title: "Upload failed",
        description: `Failed to upload photo: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const updatePhotoTag = async (photoId: string, tag: 'before' | 'after' | null) => {
    try {
      console.log('🔄 updatePhotoTag: Updating photo', photoId, 'to tag:', tag);
      
      // Get current photo to check if it was highlighted
      const currentPhoto = existingPhotos.find(p => p.id === photoId);
      
      // Auto-make tagged photos visible to customers
      const updateData: any = {
        photo_tag: tag,
        is_visible_to_customer: tag !== null
      };

      // Clear highlight status if tag changes from what it was
      if (currentPhoto?.photo_tag && currentPhoto.photo_tag !== tag) {
        if (currentPhoto.photo_tag === 'before' && currentPhoto.is_highlighted_before) {
          updateData.is_highlighted_before = false;
        }
        if (currentPhoto.photo_tag === 'after' && currentPhoto.is_highlighted_after) {
          updateData.is_highlighted_after = false;
        }
      }

      const { error } = await supabase
        .from('project_photos')
        .update(updateData)
        .eq('id', photoId);

      if (error) throw error;

      console.log('✅ updatePhotoTag: Database updated, refreshing photos');
      
      // Immediately refresh the state
      await fetchPhotos();

      toast({
        title: "Success",
        description: tag ? `Photo tagged as ${tag} and made visible to customers` : 'Photo tag removed and hidden from customers',
      });
    } catch (error) {
      console.error('Error updating photo tag:', error);
      toast({
        title: "Error",
        description: "Failed to update photo tag",
        variant: "destructive",
      });
    }
  };

  const toggleMainPhoto = async (photoId: string, photoTag: 'before' | 'after') => {
    try {
      const photo = existingPhotos.find(p => p.id === photoId);
      if (!photo) return;

      const isCurrentlyHighlighted = photoTag === 'before' 
        ? photo.is_highlighted_before 
        : photo.is_highlighted_after;
      
      const updateField = photoTag === 'before' ? 'is_highlighted_before' : 'is_highlighted_after';
      
      const { error } = await supabase
        .from('project_photos')
        .update({ [updateField]: !isCurrentlyHighlighted })
        .eq('id', photoId);

      if (error) throw error;

      setExistingPhotos(prev =>
        prev.map(p =>
          p.id === photoId
            ? { ...p, [updateField]: !isCurrentlyHighlighted }
            : p
        )
      );

      toast({
        title: "Success",
        description: `Photo ${!isCurrentlyHighlighted ? 'set as' : 'removed as'} main ${photoTag} photo`,
      });
    } catch (error) {
      console.error('Error updating main photo:', error);
      toast({
        title: "Error",
        description: "Failed to update main photo",
        variant: "destructive",
      });
    }
  };

  const deletePhoto = async (photoId: string, photoUrl: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      // Extract filename from URL for storage deletion
      const fileName = photoUrl.split('/').pop();
      
      // Delete from database first
      const { error: dbError } = await supabase
        .from('project_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      // Try to delete from storage (don't fail if this doesn't work)
      if (fileName) {
        try {
          await supabase.storage.from('project-photos').remove([fileName]);
        } catch (storageError) {
          console.warn('Storage deletion failed, but database record was removed:', storageError);
        }
      }

      setExistingPhotos(prev => prev.filter(photo => photo.id !== photoId));
      
      toast({
        title: "Success",
        description: "Photo deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive",
      });
    }
  };

  const retryUpload = (uploadingPhoto: UploadingPhoto) => {
    setUploadingPhotos(prev => 
      prev.map(p => 
        p.id === uploadingPhoto.id 
          ? { ...p, error: undefined, progress: 0 }
          : p
      )
    );
    uploadPhoto(uploadingPhoto);
  };

  const openPhotoEditor = (photo: ProjectPhoto) => {
    setSelectedPhotoForEdit(photo);
  };

  const closePhotoEditor = () => {
    setSelectedPhotoForEdit(null);
  };

  // Filtering logic as specified by the user
  const untaggedPhotos = existingPhotos.filter(p => !p.photo_tag || p.photo_tag === null || p.photo_tag === undefined);
  const beforePhotos = existingPhotos.filter(p => p.photo_tag === "before");
  const afterPhotos = existingPhotos.filter(p => p.photo_tag === "after");

  // Log render state update
  console.log('🔄 Render state update:', {
    total: existingPhotos.length,
    untagged: untaggedPhotos.length,
    before: beforePhotos.length,
    after: afterPhotos.length
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Project Photos</h3>

      {/* Photo Editor Modal with Annotations + AI */}
      {selectedPhotoForEdit && (
        <AdminPhotoEditor
          isOpen={!!selectedPhotoForEdit}
          onClose={closePhotoEditor}
          photo={selectedPhotoForEdit}
          onPhotoUpdated={fetchPhotos}
        />
      )}

      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Photos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload photos and tag them as "Before" or "After" to make them visible to customers.
          </p>
        </CardHeader>
        <CardContent>
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Upload Photos</h3>
            <p className="text-gray-600 mb-4">
              Drag and drop photos here or click to browse
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload">
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>Choose Files</span>
              </Button>
            </label>
          </div>

          {/* Uploading Photos */}
          {uploadingPhotos.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Uploading...</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadingPhotos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={photo.preview}
                        alt="Uploading"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      {photo.error ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-red-500">
                            <X className="w-4 h-4" />
                            <span className="text-xs">Failed</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryUpload(photo)}
                            className="w-full text-xs"
                          >
                            Retry
                          </Button>
                          <p className="text-xs text-red-500 break-words">{photo.error}</p>
                        </div>
                      ) : (
                        <Progress value={photo.progress} className="h-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Sections in Required Order: Untagged, Before, After */}
          <div className="mt-6 space-y-6">
            {/* Untagged Photos Section - Show First */}
            {untaggedPhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    Untagged Photos ({untaggedPhotos.length})
                  </Badge>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {untaggedPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={photo.photo_url}
                          alt="Untagged photo"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image failed to load:', photo.photo_url);
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      
                      {/* Tag Buttons */}
                      <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updatePhotoTag(photo.id, 'before')}
                          className="flex-1 text-xs py-1 h-6"
                        >
                          Before
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updatePhotoTag(photo.id, 'after')}
                          className="flex-1 text-xs py-1 h-6"
                        >
                          After
                        </Button>
                      </div>
                      
                      {/* Delete & Edit Buttons */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePhoto(photo.id, photo.photo_url)}
                          className="w-7 h-7 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openPhotoEditor(photo)}
                          className="w-7 h-7 p-0"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Hidden Status */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          Hidden
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Before Photos Section */}
            {beforePhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Before Photos ({beforePhotos.length})
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Click star to set as main photo
                  </span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {beforePhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div 
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                        onClick={() => setPreviewPhoto(photo.photo_url)}
                      >
                        <img
                          src={photo.photo_url}
                          alt="Before photo"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            console.error('Image failed to load:', photo.photo_url);
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      
                      {/* Star Icon for Main Selection */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleMainPhoto(photo.id, 'before')}
                        className="absolute top-2 right-2 w-8 h-8 p-0 bg-black/20 hover:bg-black/40 backdrop-blur-sm"
                      >
                        {photo.is_highlighted_before ? (
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <Star className="w-4 h-4 text-white" />
                        )}
                      </Button>
                      
                      {/* Tag Buttons */}
                      <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updatePhotoTag(photo.id, 'after')}
                          className="flex-1 text-xs py-1 h-6"
                        >
                          After
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updatePhotoTag(photo.id, null)}
                          className="flex-1 text-xs py-1 h-6"
                        >
                          Untag
                        </Button>
                      </div>
                      
                      {/* Delete & Edit Buttons */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePhoto(photo.id, photo.photo_url)}
                          className="w-7 h-7 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openPhotoEditor(photo)}
                          className="w-7 h-7 p-0"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Main Photo Indicator */}
                      {photo.is_highlighted_before && (
                        <div className="absolute bottom-2 left-2">
                          <Badge className="text-xs px-1 py-0 bg-yellow-400 text-black">
                            Main
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* After Photos Section */}
            {afterPhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    After Photos ({afterPhotos.length})
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Click star to set as main photo
                  </span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {afterPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div 
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                        onClick={() => setPreviewPhoto(photo.photo_url)}
                      >
                        <img
                          src={photo.photo_url}
                          alt="After photo"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            console.error('Image failed to load:', photo.photo_url);
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      
                      {/* Star Icon for Main Selection */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleMainPhoto(photo.id, 'after')}
                        className="absolute top-2 right-2 w-8 h-8 p-0 bg-black/20 hover:bg-black/40 backdrop-blur-sm"
                      >
                        {photo.is_highlighted_after ? (
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <Star className="w-4 h-4 text-white" />
                        )}
                      </Button>
                      
                      {/* Tag Buttons */}
                      <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updatePhotoTag(photo.id, 'before')}
                          className="flex-1 text-xs py-1 h-6"
                        >
                          Before
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updatePhotoTag(photo.id, null)}
                          className="flex-1 text-xs py-1 h-6"
                        >
                          Untag
                        </Button>
                      </div>
                      
                      {/* Delete & Edit Buttons */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePhoto(photo.id, photo.photo_url)}
                          className="w-7 h-7 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openPhotoEditor(photo)}
                          className="w-7 h-7 p-0"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Main Photo Indicator */}
                      {photo.is_highlighted_after && (
                        <div className="absolute bottom-2 left-2">
                          <Badge className="text-xs px-1 py-0 bg-yellow-400 text-black">
                            Main
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Only show "No photos" if the array is actually empty */}
          {existingPhotos.length === 0 && uploadingPhotos.length === 0 && (
            <div className="mt-6 text-center py-8 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No photos uploaded yet</p>
              <p className="text-sm">Upload some photos to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Preview Dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-2 right-2 w-8 h-8 p-0 text-white hover:bg-white/20 z-10"
            >
              <X className="w-4 h-4" />
            </Button>
            {previewPhoto && (
              <img
                src={previewPhoto}
                alt="Photo preview"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoUpload;