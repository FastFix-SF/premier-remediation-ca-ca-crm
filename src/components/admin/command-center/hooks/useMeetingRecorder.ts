import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExtractedItem {
  type: 'task' | 'feedback' | 'idea' | 'follow_up';
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  sentiment?: 'positive' | 'negative' | 'neutral';
  assignee_hint?: string;
}

interface RecordingResult {
  blob: Blob;
  duration: number;
  transcript?: string;
  extractedItems?: ExtractedItem[];
  hasVideo: boolean;
  mimeType: string;
}

interface VideoStreamRef {
  memberId: string;
  videoElement: HTMLVideoElement | null;
}

// Get the best supported MIME type for recording
const getSupportedMimeType = (): { mimeType: string; hasVideo: boolean } => {
  const videoTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  for (const type of videoTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return { mimeType: type, hasVideo: true };
    }
  }

  // Fallback to audio only
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return { mimeType: 'audio/webm;codecs=opus', hasVideo: false };
  }

  return { mimeType: 'audio/webm', hasVideo: false };
};

// Calculate grid layout for video composition
const calculateGridLayout = (
  participantCount: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; width: number; height: number }[] => {
  if (participantCount === 0) return [];

  const layouts: { x: number; y: number; width: number; height: number }[] = [];

  if (participantCount === 1) {
    layouts.push({ x: 0, y: 0, width: canvasWidth, height: canvasHeight });
  } else if (participantCount === 2) {
    const halfWidth = canvasWidth / 2;
    layouts.push({ x: 0, y: 0, width: halfWidth, height: canvasHeight });
    layouts.push({ x: halfWidth, y: 0, width: halfWidth, height: canvasHeight });
  } else if (participantCount <= 4) {
    const halfWidth = canvasWidth / 2;
    const halfHeight = canvasHeight / 2;
    for (let i = 0; i < participantCount; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      layouts.push({
        x: col * halfWidth,
        y: row * halfHeight,
        width: halfWidth,
        height: halfHeight,
      });
    }
  } else {
    // 3 columns for 5-9 participants
    const cols = 3;
    const rows = Math.ceil(participantCount / cols);
    const cellWidth = canvasWidth / cols;
    const cellHeight = canvasHeight / rows;
    for (let i = 0; i < participantCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      layouts.push({
        x: col * cellWidth,
        y: row * cellHeight,
        width: cellWidth,
        height: cellHeight,
      });
    }
  }

  return layouts;
};

export const useMeetingRecorder = (
  localStream: MediaStream | null,
  remoteStreams: MediaStream[],
  localVideoRef?: React.RefObject<HTMLVideoElement>,
  remoteVideoRefs?: Map<string, HTMLVideoElement>
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcript, setTranscript] = useState<string>('');
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasVideoCapability, setHasVideoCapability] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  const hasVideoRef = useRef<boolean>(false);

  // Check video capability on mount
  useEffect(() => {
    const { hasVideo } = getSupportedMimeType();
    setHasVideoCapability(hasVideo);
  }, []);

  // Create mixed audio stream from all sources
  const createMixedAudioStream = useCallback(() => {
    const audioContext = new AudioContext({ sampleRate: 48000 });
    audioContextRef.current = audioContext;
    const destination = audioContext.createMediaStreamDestination();

    // Add local audio
    if (localStream) {
      const localAudioTracks = localStream.getAudioTracks();
      if (localAudioTracks.length > 0) {
        const localSource = audioContext.createMediaStreamSource(
          new MediaStream(localAudioTracks)
        );
        localSource.connect(destination);
      }
    }

    // Add remote audio
    remoteStreams.forEach((stream) => {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const remoteSource = audioContext.createMediaStreamSource(
          new MediaStream(audioTracks)
        );
        remoteSource.connect(destination);
      }
    });

    return destination.stream;
  }, [localStream, remoteStreams]);

  // Get all video elements for compositing
  const getVideoElements = useCallback((): HTMLVideoElement[] => {
    const elements: HTMLVideoElement[] = [];

    // Add local video if available
    if (localVideoRef?.current && localStream?.getVideoTracks().length) {
      elements.push(localVideoRef.current);
    }

    // Add remote videos
    if (remoteVideoRefs) {
      remoteVideoRefs.forEach((videoEl) => {
        if (videoEl && videoEl.srcObject) {
          const stream = videoEl.srcObject as MediaStream;
          if (stream.getVideoTracks().length > 0) {
            elements.push(videoEl);
          }
        }
      });
    }

    return elements;
  }, [localStream, localVideoRef, remoteVideoRefs]);

  // Create composite video stream from canvas
  const createCompositeVideoStream = useCallback((): MediaStream | null => {
    const videoElements = getVideoElements();
    
    if (videoElements.length === 0) {
      return null;
    }

    // Create canvas for compositing
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get canvas context');
      return null;
    }

    // Start drawing frames
    const drawFrame = () => {
      const currentVideoElements = getVideoElements();
      const layouts = calculateGridLayout(
        currentVideoElements.length,
        canvas.width,
        canvas.height
      );

      // Clear canvas with dark background
      ctx.fillStyle = '#0f0f23';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw each video
      currentVideoElements.forEach((videoEl, index) => {
        if (index < layouts.length) {
          const layout = layouts[index];
          try {
            // Draw video maintaining aspect ratio
            const videoAspect = videoEl.videoWidth / videoEl.videoHeight;
            const layoutAspect = layout.width / layout.height;

            let drawWidth = layout.width;
            let drawHeight = layout.height;
            let drawX = layout.x;
            let drawY = layout.y;

            if (videoAspect > layoutAspect) {
              drawHeight = layout.width / videoAspect;
              drawY = layout.y + (layout.height - drawHeight) / 2;
            } else {
              drawWidth = layout.height * videoAspect;
              drawX = layout.x + (layout.width - drawWidth) / 2;
            }

            ctx.drawImage(videoEl, drawX, drawY, drawWidth, drawHeight);
          } catch (e) {
            // Video might not be ready yet
          }
        }
      });

      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    // Capture canvas at 24 FPS
    return canvas.captureStream(24);
  }, [getVideoElements]);

  // Create combined media stream (video + audio)
  const createCombinedMediaStream = useCallback((): { stream: MediaStream; hasVideo: boolean; mimeType: string } => {
    const { mimeType, hasVideo } = getSupportedMimeType();
    const audioStream = createMixedAudioStream();

    // Try to create composite video stream
    const videoStream = hasVideo ? createCompositeVideoStream() : null;

    if (videoStream && hasVideo) {
      // Combine video and audio
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);
      return { stream: combinedStream, hasVideo: true, mimeType };
    }

    // Audio only fallback
    return { 
      stream: audioStream, 
      hasVideo: false, 
      mimeType: 'audio/webm;codecs=opus' 
    };
  }, [createMixedAudioStream, createCompositeVideoStream]);

  // Start recording
  const startRecording = useCallback(() => {
    try {
      const { stream, hasVideo, mimeType } = createCombinedMediaStream();
      hasVideoRef.current = hasVideo;
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop canvas animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;

      startTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      setIsRecording(true);
      
      const recordingType = hasVideo ? 'Video + Audio' : 'Audio only';
      toast.success(`Recording started (${recordingType})`);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  }, [createCombinedMediaStream]);

  // Stop recording and process
  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    if (!mediaRecorderRef.current) return null;

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        // Clear duration interval
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        // Stop canvas animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        const duration = recordingDuration;

        setIsRecording(false);
        toast.success('Recording stopped');

        resolve({
          blob,
          duration,
          hasVideo: hasVideoRef.current,
          mimeType: mimeTypeRef.current,
        });
      };

      mediaRecorder.stop();
    });
  }, [recordingDuration]);

  // Transcribe audio (works with video/webm too)
  const transcribeAudio = useCallback(async (blob: Blob): Promise<string> => {
    setIsTranscribing(true);
    try {
      // Convert blob to base64
      const arrayBuffer = await blob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio },
      });

      if (error) throw error;

      const text = data?.text || '';
      setTranscript(text);
      return text;
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe audio');
      return '';
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  // Extract items from transcript
  const extractItemsFromTranscript = useCallback(async (text: string): Promise<ExtractedItem[]> => {
    if (!text || text.length < 20) {
      return [];
    }

    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-tasks-from-transcript', {
        body: { transcript: text },
      });

      if (error) throw error;

      const items: ExtractedItem[] = data?.items || [];
      setExtractedItems(items);
      return items;
    } catch (error) {
      console.error('Extraction error:', error);
      // Silently fail - extraction is optional
      return [];
    } finally {
      setIsExtracting(false);
    }
  }, []);

  // Full recording flow: stop, transcribe, extract
  const stopAndProcess = useCallback(async (): Promise<RecordingResult | null> => {
    const result = await stopRecording();
    if (!result) return null;

    // Transcribe
    const transcriptText = await transcribeAudio(result.blob);
    result.transcript = transcriptText;

    // Extract items if transcript is long enough
    if (transcriptText.length >= 20) {
      const items = await extractItemsFromTranscript(transcriptText);
      result.extractedItems = items;
    }

    return result;
  }, [stopRecording, transcribeAudio, extractItemsFromTranscript]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    recordingDuration,
    formattedDuration: formatDuration(recordingDuration),
    transcript,
    extractedItems,
    isTranscribing,
    isExtracting,
    hasVideoCapability,
    startRecording,
    stopRecording,
    stopAndProcess,
    transcribeAudio,
    extractItemsFromTranscript,
  };
};
