import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  avatar_url?: string;
  display_name?: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user?.id) {
      toast.error('Please sign in to upload an avatar');
      return;
    }

    try {
      setUploading(true);
      console.log('Starting avatar upload for user:', user.id);
      toast.loading('Uploading avatar...');

      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading to path:', filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.dismiss();
        toast.error(`Failed to upload: ${uploadError.message}`);
        return;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL with cache busting
      const timestamp = new Date().getTime();
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const publicUrlWithCache = `${publicUrl}?t=${timestamp}`;
      console.log('Public URL:', publicUrlWithCache);

      // Check if profile exists first
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking profile:', fetchError);
      }

      console.log('Existing profile:', existingProfile);

      let profileError;
      
      if (existingProfile) {
        // Update existing profile
        console.log('Updating existing profile with avatar URL');
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrlWithCache })
          .eq('id', user.id);
        profileError = error;
      } else {
        // Insert new profile
        console.log('Creating new profile with avatar URL');
        const { error } = await supabase
          .from('profiles')
          .insert({ 
            id: user.id, 
            avatar_url: publicUrlWithCache,
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || user.phone || 'User'
          });
        profileError = error;
      }

      if (profileError) {
        console.error('Profile update error:', profileError);
        toast.dismiss();
        toast.error(`Failed to update profile: ${profileError.message}`);
        return;
      }

      console.log('Profile updated successfully');

      // Refresh profile data
      await fetchProfile();
      toast.dismiss();
      toast.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.dismiss();
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  return {
    profile,
    loading,
    uploading,
    uploadAvatar,
    refetch: fetchProfile
  };
};