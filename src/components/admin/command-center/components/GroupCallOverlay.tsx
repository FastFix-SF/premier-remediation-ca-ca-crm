import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatars } from '@/hooks/useAvatars';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  ListTodo,
  Circle,
  StopCircle,
  Minimize2,
  Maximize2,
  Users,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { MeetingChatPanel } from './MeetingChatPanel';
import { InCallItemsPanel } from './InCallItemsPanel';
import { useMeetingRecorder } from '../hooks/useMeetingRecorder';
import { useSaveRecording } from '../hooks/useSaveRecording';
import { useVideoConverter } from '../hooks/useVideoConverter';

interface RemoteStream {
  memberId: string;
  memberName: string;
  stream: MediaStream;
}

interface GroupCallOverlayProps {
  localStream: MediaStream | null;
  remoteStreams: RemoteStream[];
  roomId: string;
  roomName: string;
  memberId: string;
  isMuted: boolean;
  isVideoOn: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
}

export const GroupCallOverlay: React.FC<GroupCallOverlayProps> = ({
  localStream,
  remoteStreams,
  roomId,
  roomName,
  memberId,
  isMuted,
  isVideoOn,
  onToggleMute,
  onToggleVideo,
  onLeave,
}) => {
  const [showChat, setShowChat] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null);
  const [lastRecordingName, setLastRecordingName] = useState<string>('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Collect all participant IDs for avatar fetching
  const participantIds = useMemo(() => {
    const ids = [memberId, ...remoteStreams.map(rs => rs.memberId)].filter(Boolean);
    return ids;
  }, [memberId, remoteStreams]);

  const { data: avatarMap = {} } = useAvatars(participantIds);

  const { saveRecording } = useSaveRecording();
  const { downloadAsMP4, isConverting, progress } = useVideoConverter();

  const {
    isRecording,
    formattedDuration,
    transcript,
    extractedItems,
    isTranscribing,
    hasVideoCapability,
    startRecording,
    stopAndProcess,
  } = useMeetingRecorder(
    localStream,
    remoteStreams.map((rs) => rs.stream),
    localVideoRef,
    remoteVideoRefs.current
  );

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote streams to video elements
  useEffect(() => {
    remoteStreams.forEach(({ memberId, stream }) => {
      const videoEl = remoteVideoRefs.current.get(memberId);
      if (videoEl && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const handleStopRecording = async () => {
    const result = await stopAndProcess();
    if (result) {
      const savedRecording = await saveRecording({
        blob: result.blob,
        roomName,
        duration: result.duration,
        participants: [memberId, ...remoteStreams.map((rs) => rs.memberId)],
        transcript: result.transcript,
        extractedItems: result.extractedItems,
        recordingType: 'meeting',
        hasVideo: result.hasVideo,
        mimeType: result.mimeType,
      });
      
      if (savedRecording) {
        setLastRecordingUrl(savedRecording.file_url);
        setLastRecordingName(savedRecording.file_name || `${roomName}-recording.webm`);
      }
    }
  };

  const handleDownload = async () => {
    if (!lastRecordingUrl) return;
    
    const isWebM = lastRecordingName.toLowerCase().endsWith('.webm');
    
    if (isWebM) {
      toast.loading('Converting to MP4...', { id: 'conversion' });
      try {
        await downloadAsMP4(lastRecordingUrl, lastRecordingName, 'balanced');
        toast.success('Download complete!', { id: 'conversion' });
      } catch (error) {
        console.error('Conversion failed:', error);
        toast.error('Conversion failed, downloading original...', { id: 'conversion' });
        window.open(lastRecordingUrl, '_blank');
      }
    } else {
      // Already MP4, download directly
      const link = document.createElement('a');
      link.href = lastRecordingUrl;
      link.download = lastRecordingName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-[#1a1a2e] rounded-2xl shadow-2xl p-4 flex items-center gap-4 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-white font-medium">{roomName}</span>
            <Badge className="bg-white/10 text-white/80 border-0">
              {remoteStreams.length + 1}
            </Badge>
          </div>

          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-sm font-mono">{formattedDuration}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}
              onClick={onToggleMute}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/10 text-white"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-red-500 text-white hover:bg-red-600"
              onClick={onLeave}
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalParticipants = remoteStreams.length + 1;
  const gridCols =
    totalParticipants <= 1
      ? 'grid-cols-1'
      : totalParticipants <= 2
      ? 'grid-cols-2'
      : totalParticipants <= 4
      ? 'grid-cols-2'
      : 'grid-cols-3';

  return (
    <div className="fixed inset-0 z-50 bg-[#0f0f23]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-white font-semibold text-lg">{roomName}</span>
          </div>
          <Badge className="bg-white/10 text-white/80 border-0 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {totalParticipants}
          </Badge>
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-sm font-mono">{formattedDuration}</span>
              {hasVideoCapability && (
                <Video className="w-3 h-3 text-red-400" />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="absolute inset-0 pt-16 pb-24 px-4 flex items-center justify-center">
        <div className={`grid ${gridCols} gap-4 w-full max-w-6xl h-full`}>
          {/* Local Video */}
          <div className="relative rounded-2xl overflow-hidden bg-[#1a1a2e] flex items-center justify-center">
            {isVideoOn && localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarMap[memberId] || undefined} alt="You" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl font-bold w-24 h-24">
                  You
                </AvatarFallback>
              </Avatar>
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="px-2 py-1 rounded-lg bg-black/50 text-white text-sm">You</span>
              {isMuted && (
                <span className="p-1 rounded-lg bg-red-500/80">
                  <MicOff className="w-3 h-3 text-white" />
                </span>
              )}
            </div>
          </div>

          {/* Remote Videos */}
          {remoteStreams.map(({ memberId: remoteMemberId, memberName, stream }) => (
            <div
              key={remoteMemberId}
              className="relative rounded-2xl overflow-hidden bg-[#1a1a2e] flex items-center justify-center"
            >
              {stream.getVideoTracks().length > 0 ? (
                <video
                  ref={(el) => {
                    if (el) remoteVideoRefs.current.set(remoteMemberId, el);
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarMap[remoteMemberId] || undefined} alt={memberName} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl font-bold w-24 h-24">
                    {memberName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="absolute bottom-3 left-3">
                <span className="px-2 py-1 rounded-lg bg-black/50 text-white text-sm">
                  {memberName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent z-10 flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="lg"
          className={`rounded-full w-14 h-14 ${
            isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          onClick={onToggleMute}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className={`rounded-full w-14 h-14 ${
            !isVideoOn ? 'bg-red-500/80 text-white' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          onClick={onToggleVideo}
        >
          {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className={`rounded-full w-14 h-14 ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          onClick={isRecording ? handleStopRecording : startRecording}
          disabled={isTranscribing}
        >
          {isRecording ? <StopCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
        </Button>

        {lastRecordingUrl && (
          <Button
            variant="ghost"
            size="lg"
            className={`rounded-full w-14 h-14 ${
              isConverting ? 'bg-amber-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            onClick={handleDownload}
            disabled={isConverting}
            title="Download as MP4"
          >
            {isConverting ? (
              <span className="text-xs font-mono">{progress.percent}%</span>
            ) : (
              <Download className="w-6 h-6" />
            )}
          </Button>
        )}

        <Button
          variant="ghost"
          size="lg"
          className={`rounded-full w-14 h-14 ${
            showChat ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          onClick={() => {
            setShowChat(!showChat);
            setShowItems(false);
          }}
        >
          <MessageSquare className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className={`rounded-full w-14 h-14 ${
            showItems ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          onClick={() => {
            setShowItems(!showItems);
            setShowChat(false);
          }}
        >
          <ListTodo className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="rounded-full w-14 h-14 bg-red-500 text-white hover:bg-red-600"
          onClick={onLeave}
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>

      {/* Side Panels */}
      {showChat && (
        <div className="absolute top-16 right-0 bottom-24 w-80 bg-[#1a1a2e] border-l border-white/10">
          <MeetingChatPanel roomId={roomId} memberId={memberId} onClose={() => setShowChat(false)} />
        </div>
      )}

      {showItems && (
        <div className="absolute top-16 right-0 bottom-24 w-96 bg-[#1a1a2e] border-l border-white/10">
          <InCallItemsPanel
            items={extractedItems}
            transcript={transcript}
            isTranscribing={isTranscribing}
            onClose={() => setShowItems(false)}
          />
        </div>
      )}
    </div>
  );
};
