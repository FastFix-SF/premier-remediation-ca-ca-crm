import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mic, Send, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadVoiceNote(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak your message now"
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadVoiceNote = async (audioBlob: Blob) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('help-voice-notes')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('help-voice-notes')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('help_requests')
        .insert({
          user_id: user.id,
          user_email: user.email || '',
          user_name: user.user_metadata?.full_name || user.email,
          audio_url: publicUrl
        });

      if (insertError) throw insertError;

      toast({
        title: "Voice note sent",
        description: "Your voice message has been sent to the admin"
      });
      onClose();
    } catch (error) {
      console.error('Error uploading voice note:', error);
      toast({
        title: "Failed to send voice note",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendTextMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('help_requests')
        .insert({
          user_id: user.id,
          user_email: user.email || '',
          user_name: user.user_metadata?.full_name || user.email,
          message_text: message
        });

      if (error) throw error;

      toast({
        title: "Message sent",
        description: "Your message has been sent to the admin"
      });
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Write your message</Label>
            <Textarea
              id="message"
              placeholder="Describe your issue or question..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              disabled={isSubmitting || isRecording}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={sendTextMessage}
              disabled={isSubmitting || isRecording || !message.trim()}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>

            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={isSubmitting}
                variant="outline"
              >
                <Mic className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                disabled={isSubmitting}
                variant="destructive"
              >
                <Square className="w-4 h-4" />
              </Button>
            )}
          </div>

          {isRecording && (
            <p className="text-sm text-muted-foreground text-center">
              Recording... Click stop when finished
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
