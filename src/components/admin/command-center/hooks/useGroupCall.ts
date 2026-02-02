import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { rtcConfiguration } from '@/lib/webrtc/iceServers';
import { toast } from 'sonner';

interface RemoteStream {
  odiv: string;
  stream: MediaStream;
  memberId: string;
  memberName: string;
}

interface SignalMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave';
  from: string;
  fromName: string;
  to?: string;
  roomId: string;
  payload?: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
}

export const useGroupCall = (memberId: string | null) => {
  const [isInCall, setIsInCall] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentRoomName, setCurrentRoomName] = useState<string>('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const memberNameRef = useRef<string>('Unknown');
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // Get member name on mount
  useEffect(() => {
    const fetchMemberName = async () => {
      if (!memberId) return;
      const { data } = await supabase
        .from('team_directory')
        .select('full_name')
        .eq('user_id', memberId)
        .maybeSingle();
      if (data?.full_name) {
        memberNameRef.current = data.full_name;
      }
    };
    fetchMemberName();
  }, [memberId]);

  // Setup local media stream
  const setupLocalStream = useCallback(async (video: boolean = false, audio: boolean = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480, facingMode: 'user' } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      });

      // Apply initial mute state
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      stream.getVideoTracks().forEach(track => {
        track.enabled = video;
      });

      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Could not access camera/microphone');
      return null;
    }
  }, [isMuted]);

  // Create peer connection for a remote participant
  const createPeerConnection = useCallback((remoteMemberId: string, remoteMemberName: string) => {
    if (!localStream || !memberId || !currentRoomId) return null;

    const pc = new RTCPeerConnection(rtcConfiguration);

    // Add local tracks to connection
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Handle incoming tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => {
        const existing = prev.find(s => s.memberId === remoteMemberId);
        if (existing) {
          return prev.map(s => 
            s.memberId === remoteMemberId 
              ? { ...s, stream: remoteStream }
              : s
          );
        }
        return [...prev, {
          odiv: `video-${remoteMemberId}`,
          stream: remoteStream,
          memberId: remoteMemberId,
          memberName: remoteMemberName,
        }];
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        const message: SignalMessage = {
          type: 'ice-candidate',
          from: memberId,
          fromName: memberNameRef.current,
          to: remoteMemberId,
          roomId: currentRoomId,
          payload: event.candidate.toJSON(),
        };
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: message,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection to ${remoteMemberName}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Attempt to restart ICE
        pc.restartIce();
      }
    };

    peerConnections.current.set(remoteMemberId, pc);
    return pc;
  }, [localStream, memberId, currentRoomId]);

  // Handle incoming signaling messages
  const handleSignalMessage = useCallback(async (message: SignalMessage) => {
    if (!memberId || message.from === memberId) return;
    if (message.roomId !== currentRoomId) return;

    const { type, from, fromName, to, payload } = message;

    // Ignore messages not meant for us (except broadcast messages)
    if (to && to !== memberId) return;

    switch (type) {
      case 'join': {
        // New participant joined - send offer if we haven't already
        if (!peerConnections.current.has(from)) {
          const pc = createPeerConnection(from, fromName);
          if (pc) {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              channelRef.current?.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                  type: 'offer',
                  from: memberId,
                  fromName: memberNameRef.current,
                  to: from,
                  roomId: currentRoomId,
                  payload: pc.localDescription,
                } as SignalMessage,
              });
            } catch (error) {
              console.error('Error creating offer:', error);
            }
          }
        }
        setParticipants(prev => [...new Set([...prev, from])]);
        break;
      }

      case 'offer': {
        let pc = peerConnections.current.get(from);
        if (!pc) {
          pc = createPeerConnection(from, fromName);
        }
        if (pc && payload) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
            
            // Apply any pending ICE candidates
            const pending = pendingCandidates.current.get(from) || [];
            for (const candidate of pending) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidates.current.delete(from);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channelRef.current?.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: 'answer',
                from: memberId,
                fromName: memberNameRef.current,
                to: from,
                roomId: currentRoomId,
                payload: pc.localDescription,
              } as SignalMessage,
            });
          } catch (error) {
            console.error('Error handling offer:', error);
          }
        }
        break;
      }

      case 'answer': {
        const pc = peerConnections.current.get(from);
        if (pc && payload) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
            
            // Apply any pending ICE candidates
            const pending = pendingCandidates.current.get(from) || [];
            for (const candidate of pending) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidates.current.delete(from);
          } catch (error) {
            console.error('Error handling answer:', error);
          }
        }
        break;
      }

      case 'ice-candidate': {
        const pc = peerConnections.current.get(from);
        if (pc && payload) {
          try {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit));
            } else {
              // Queue candidate for later
              const pending = pendingCandidates.current.get(from) || [];
              pending.push(payload as RTCIceCandidateInit);
              pendingCandidates.current.set(from, pending);
            }
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        }
        break;
      }

      case 'leave': {
        const pc = peerConnections.current.get(from);
        if (pc) {
          pc.close();
          peerConnections.current.delete(from);
        }
        setRemoteStreams(prev => prev.filter(s => s.memberId !== from));
        setParticipants(prev => prev.filter(p => p !== from));
        break;
      }
    }
  }, [memberId, currentRoomId, createPeerConnection]);

  // Join a room
  const joinRoom = useCallback(async (roomId: string, roomName: string) => {
    if (!memberId) {
      toast.error('Please log in to join a room');
      return;
    }

    try {
      // Setup local media
      const stream = await setupLocalStream(isVideoOn, true);
      if (!stream) return;

      // Join database
      await supabase.from('room_participants').upsert({
        room_id: roomId,
        member_id: memberId,
      }, { onConflict: 'room_id,member_id' });

      // Update team_directory current_room
      await supabase
        .from('team_directory')
        .update({ current_room_id: roomId })
        .eq('user_id', memberId);

      setCurrentRoomId(roomId);
      setCurrentRoomName(roomName);
      setIsInCall(true);

      // Setup signaling channel
      const channel = supabase.channel(`room:${roomId}`, {
        config: { broadcast: { self: false } },
      });

      channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
        handleSignalMessage(payload as SignalMessage);
      });

      await channel.subscribe();
      channelRef.current = channel;

      // Announce our presence
      channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'join',
          from: memberId,
          fromName: memberNameRef.current,
          roomId,
        } as SignalMessage,
      });

      // Load existing participants and connect to them
      const { data: existingParticipants } = await supabase
        .from('room_participants')
        .select('member_id')
        .eq('room_id', roomId)
        .neq('member_id', memberId);

      if (existingParticipants) {
        setParticipants(existingParticipants.map(p => p.member_id));
      }

      toast.success(`Joined ${roomName}`);
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
    }
  }, [memberId, isVideoOn, setupLocalStream, handleSignalMessage]);

  // Leave the current room
  const leaveRoom = useCallback(async () => {
    if (!memberId || !currentRoomId) return;

    try {
      // Announce leave
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'leave',
          from: memberId,
          fromName: memberNameRef.current,
          roomId: currentRoomId,
        } as SignalMessage,
      });

      // Close all peer connections
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();

      // Stop local stream
      localStream?.getTracks().forEach(track => track.stop());
      setLocalStream(null);

      // Unsubscribe from channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Remove from database
      await supabase
        .from('room_participants')
        .delete()
        .eq('member_id', memberId)
        .eq('room_id', currentRoomId);

      // Clear current_room_id
      await supabase
        .from('team_directory')
        .update({ current_room_id: null })
        .eq('user_id', memberId);

      setRemoteStreams([]);
      setParticipants([]);
      setCurrentRoomId(null);
      setCurrentRoomName('');
      setIsInCall(false);

      toast.success('Left the room');
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }, [memberId, currentRoomId, localStream]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted; // Toggle - if was muted, enable
      });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (!localStream) return;

    const videoTracks = localStream.getVideoTracks();

    if (isVideoOn) {
      // Turn off video
      videoTracks.forEach(track => {
        track.stop();
        localStream.removeTrack(track);
      });
      setIsVideoOn(false);
    } else {
      // Turn on video
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        localStream.addTrack(newVideoTrack);

        // Replace track in all peer connections
        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(newVideoTrack);
          } else {
            pc.addTrack(newVideoTrack, localStream);
          }
        });

        setIsVideoOn(true);
      } catch (error) {
        console.error('Error enabling video:', error);
        toast.error('Could not enable camera');
      }
    }
  }, [localStream, isVideoOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInCall) {
        leaveRoom();
      }
    };
  }, []);

  return {
    isInCall,
    currentRoomId,
    currentRoomName,
    localStream,
    remoteStreams,
    isMuted,
    isVideoOn,
    participants,
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleVideo,
  };
};
