import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceMessageProps {
  onSendVoiceMessage: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

interface VoicePlayerProps {
  audioUrl: string;
  duration: number;
  isOwn?: boolean;
}

export const VoiceRecorder: React.FC<VoiceMessageProps> = ({
  onSendVoiceMessage,
  onCancel,
  isRecording,
  onStartRecording,
  onStopRecording,
}) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-start recording when component mounts
  useEffect(() => {
    startRecording();
    return () => {
      // Cleanup on unmount
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      // Choose best supported mime type for recording
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) mimeType = 'audio/ogg';
      }

      mediaRecorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecordingTime(0);
      onStartRecording();
      setPermissionDenied(false);
    } catch (error) {
      console.error('Error starting recording:', error);
      setPermissionDenied(true);
      alert('Microphone access is required to send voice messages. Please allow microphone access in your browser settings.');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    onStopRecording();
  };

  const playPreview = () => {
    if (audioBlob && audioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSendVoiceMessage(audioBlob, recordingTime);
      handleCancel();
    }
  };

  const handleCancel = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center pb-safe">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />

      <div className="bg-background rounded-t-3xl shadow-lg w-full p-8 pb-12 animate-slide-in-bottom">
        {isRecording && (
          <div className="flex flex-col items-center space-y-6">
            {/* Animated Mic Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative w-24 h-24 bg-primary rounded-full flex items-center justify-center">
                <Mic className="w-12 h-12 text-white" />
              </div>
            </div>
            
            {/* Status Text */}
            <p className="text-base text-foreground">Recording your message...</p>
            
            {/* Timer with red dot */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-2xl font-mono text-foreground">
                {formatTime(recordingTime)}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-4 w-full pt-4">
              <Button
                variant="outline"
                className="flex-1 rounded-full py-6"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-full py-6 bg-primary hover:bg-primary/90 text-white"
                onClick={stopRecording}
              >
                Stop
              </Button>
            </div>
          </div>
        )}

        {audioBlob && !isRecording && (
          <div className="flex flex-col items-center space-y-6">
            {/* Playback Icon */}
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Button
                variant="ghost"
                size="lg"
                className="w-16 h-16 rounded-full"
                onClick={playPreview}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-primary" />
                ) : (
                  <Play className="w-8 h-8 text-primary" />
                )}
              </Button>
            </div>
            
            {/* Waveform */}
            <div className="voice-waveform">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="voice-bar"
                  style={{ height: `${Math.random() * 12 + 6}px` }}
                />
              ))}
            </div>
            
            {/* Duration */}
            <span className="text-xl font-mono text-muted-foreground">
              {formatTime(recordingTime)}
            </span>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-4 w-full pt-4">
              <Button
                variant="outline"
                className="flex-1 rounded-full py-6"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-full py-6 bg-primary hover:bg-primary/90 text-white"
                onClick={handleSend}
              >
                Send
              </Button>
            </div>
          </div>
        )}

        {permissionDenied && (
          <div className="flex flex-col items-center space-y-4 text-center">
            <MicOff className="w-16 h-16 text-muted-foreground" />
            <p className="text-base text-muted-foreground">
              Microphone access denied. Please enable microphone permissions in your browser settings.
            </p>
            <Button
              variant="outline"
              className="rounded-full py-6 px-8"
              onClick={onCancel}
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  audioUrl,
  duration,
  isOwn = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        style={{ display: 'none' }}
      />

      <Button
        variant="ghost"
        size="sm"
        className={`p-0 h-8 w-8 rounded-full hover:bg-white/20 ${isOwn ? 'text-white' : 'text-primary'}`}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" fill="currentColor" />
        ) : (
          <Play className="w-5 h-5" fill="currentColor" />
        )}
      </Button>

      <div className="flex-1 flex items-center gap-2">
        {/* Waveform */}
        <div className="flex items-center gap-[2px] h-6">
          {[...Array(20)].map((_, i) => {
            const progress = currentTime / duration;
            const isActive = i < progress * 20;
            const heights = [4, 8, 12, 10, 6, 14, 8, 10, 6, 12, 8, 10, 14, 6, 8, 10, 12, 8, 6, 10];
            return (
              <div
                key={i}
                className={`w-[2px] rounded-full transition-all ${
                  isOwn 
                    ? isActive ? 'bg-white' : 'bg-white/40'
                    : isActive ? 'bg-primary' : 'bg-primary/40'
                }`}
                style={{ height: `${heights[i]}px` }}
              />
            );
          })}
        </div>

        {/* Duration */}
        <span className={`text-xs font-mono ${isOwn ? 'text-white' : 'text-foreground'}`}>
          {formatTime(isPlaying ? currentTime : duration)}
        </span>
      </div>
    </div>
  );
};