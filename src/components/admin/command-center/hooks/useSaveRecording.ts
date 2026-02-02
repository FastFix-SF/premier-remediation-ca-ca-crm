import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SaveRecordingOptions {
  blob: Blob;
  roomName: string;
  duration: number;
  participants: string[];
  transcript?: string;
  extractedItems?: unknown[];
  recordingType?: 'meeting' | 'sales_call' | 'audio' | 'video';
  hasVideo?: boolean;
  mimeType?: string;
}

export const useSaveRecording = () => {
  const saveRecording = useCallback(async (options: SaveRecordingOptions) => {
    const {
      blob,
      roomName,
      duration,
      participants,
      transcript,
      extractedItems,
      recordingType = 'meeting',
      hasVideo = false,
      mimeType = 'audio/webm',
    } = options;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to save recordings');
        return null;
      }

      // Generate unique filename with appropriate extension
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = hasVideo ? 'webm' : 'webm'; // Both use .webm
      const fileName = `${roomName.replace(/\s+/g, '-')}_${timestamp}.${extension}`;
      const filePath = `${user.id}/${fileName}`;

      // Determine content type based on whether video is included
      const contentType = hasVideo ? 'video/webm' : 'audio/webm';

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('meeting-recordings')
        .upload(filePath, blob, {
          contentType,
          cacheControl: '3600',
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('meeting-recordings')
        .getPublicUrl(filePath);

      // Determine the actual recording type based on content
      const finalRecordingType = hasVideo ? 'video' : recordingType;

      // Save metadata to database
      const { data: recording, error: dbError } = await supabase
        .from('meeting_recordings')
        .insert({
          user_id: user.id,
          room_name: roomName,
          file_path: filePath,
          file_url: publicUrl,
          file_name: fileName,
          file_size: blob.size,
          duration_seconds: duration,
          participants,
          recording_type: finalRecordingType,
          transcript: transcript || null,
          extracted_items: extractedItems ? JSON.stringify(extractedItems) : null,
        })
        .select()
        .maybeSingle();

      if (dbError) {
        throw dbError;
      }

      const successMessage = hasVideo 
        ? 'Video recording saved successfully' 
        : 'Audio recording saved successfully';
      toast.success(successMessage);
      return recording;
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error('Failed to save recording');
      return null;
    }
  }, []);

  return { saveRecording };
};
