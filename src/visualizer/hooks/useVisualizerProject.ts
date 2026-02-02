import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VisualizerProject {
  id: string;
  title?: string;
  owner?: string;
  session_token?: string;
  created_at: string;
  updated_at: string;
}

interface VisualizerImage {
  id: string;
  project_id: string;
  original_url: string;
  width: number;
  height: number;
  created_at: string;
}

interface VisualizerMask {
  id: string;
  image_id: string;
  name: string;
  type: 'include' | 'exclude';
  svg_path: string;
  alpha_url?: string;
  created_at: string;
  updated_at: string;
}

interface VisualizerVariant {
  id: string;
  image_id: string;
  color_key: string;
  hex: string;
  preview_url?: string;
  created_at: string;
}

export const useVisualizerProject = (projectId?: string) => {
  const [project, setProject] = useState<VisualizerProject | null>(null);
  const [images, setImages] = useState<VisualizerImage[]>([]);
  const [masks, setMasks] = useState<VisualizerMask[]>([]);
  const [variants, setVariants] = useState<VisualizerVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Generate session token for anonymous users
  const getSessionToken = () => {
    let token = localStorage.getItem('visualizer_session_token');
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem('visualizer_session_token', token);
    }
    return token;
  };

  // Set session token for anonymous access
  const setSessionContext = async () => {
    // For anonymous users, we'll rely on localStorage and RLS policies
    // The session token is already stored in localStorage
    const sessionToken = getSessionToken();
    // Store in a way that can be accessed by RLS if needed
    return sessionToken;
  };

  const createProject = async (title?: string): Promise<string> => {
    try {
      setLoading(true);
      await setSessionContext();

      const { data: user } = await supabase.auth.getUser();
      const sessionToken = user.user ? null : getSessionToken();

      const { data, error } = await supabase
        .from('visualizer_projects')
        .insert({
          title,
          owner: user.user?.id,
          session_token: sessionToken
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      setProject(data);
      toast({
        title: "Project created",
        description: "Your visualizer project has been created successfully."
      });

      return data.id;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (projectId: string, file: File): Promise<string> => {
    try {
      setLoading(true);
      await setSessionContext();

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${crypto.randomUUID()}.${fileExt}`;
      const filePath = `originals/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('visualizer')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get image dimensions
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Save image record
      const { data, error } = await supabase
        .from('visualizer_images')
        .insert({
          project_id: projectId,
          original_url: uploadData.path,
          width: img.width,
          height: img.height
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      setImages(prev => [...prev, data]);
      URL.revokeObjectURL(imageUrl);

      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully."
      });

      return data.id;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveMask = async (imageId: string, svgPath: string, name = 'Roof', type: 'include' | 'exclude' = 'include'): Promise<string> => {
    try {
      await setSessionContext();

      const { data, error } = await supabase
        .from('visualizer_masks')
        .insert({
          image_id: imageId,
          name,
          type,
          svg_path: svgPath
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      setMasks(prev => [...prev, data as VisualizerMask]);
      return data.id;
    } catch (error) {
      console.error('Error saving mask:', error);
      throw error;
    }
  };

  const saveVariant = async (imageId: string, colorKey: string, hex: string): Promise<string> => {
    try {
      await setSessionContext();

      const { data, error } = await supabase
        .from('visualizer_variants')
        .insert({
          image_id: imageId,
          color_key: colorKey,
          hex
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      setVariants(prev => [...prev, data]);
      return data.id;
    } catch (error) {
      console.error('Error saving variant:', error);
      throw error;
    }
  };

  const loadProject = async (id: string) => {
    try {
      setLoading(true);
      await setSessionContext();

      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from('visualizer_projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (projectError) throw projectError;
      setProject(projectData);

      // Load images
      const { data: imageData, error: imageError } = await supabase
        .from('visualizer_images')
        .select('*')
        .eq('project_id', id);

      if (imageError) throw imageError;
      setImages(imageData);

      // Load masks
      if (imageData.length > 0) {
        const imageIds = imageData.map(img => img.id);
        const { data: maskData, error: maskError } = await supabase
          .from('visualizer_masks')
          .select('*')
          .in('image_id', imageIds);

        if (maskError) throw maskError;
        setMasks(maskData as VisualizerMask[]);

        // Load variants
        const { data: variantData, error: variantError } = await supabase
          .from('visualizer_variants')
          .select('*')
          .in('image_id', imageIds);

        if (variantError) throw variantError;
        setVariants(variantData);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        title: "Error",
        description: "Failed to load project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  return {
    project,
    images,
    masks,
    variants,
    loading,
    createProject,
    uploadImage,
    saveMask,
    saveVariant,
    loadProject
  };
};