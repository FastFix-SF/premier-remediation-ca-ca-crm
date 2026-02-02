import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatars } from '@/hooks/useAvatars';
import {
  Building2,
  Users,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  LogIn,
  LogOut,
  Coffee,
  Briefcase,
} from 'lucide-react';
import { useGroupCall } from '../hooks/useGroupCall';
import { GroupCallOverlay } from '../components/GroupCallOverlay';

interface CCOfficeViewProps {
  memberId: string | null;
}

interface MeetingRoom {
  id: string;
  name: string;
  description: string;
  max_capacity: number;
  participant_count: number;
  participants: { member_id: string; member_name: string }[];
}

interface TeamMember {
  user_id: string;
  full_name: string;
  role: string;
  is_online: boolean;
  current_room?: string;
}

export const CCOfficeView: React.FC<CCOfficeViewProps> = ({ memberId }) => {
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Collect all user IDs for avatar fetching
  const allUserIds = useMemo(() => {
    const ids = new Set<string>();
    teamMembers.forEach(m => ids.add(m.user_id));
    rooms.forEach(r => r.participants.forEach(p => ids.add(p.member_id)));
    return Array.from(ids).filter(Boolean);
  }, [teamMembers, rooms]);

  const { data: avatarMap = {} } = useAvatars(allUserIds);

  // WebRTC Group Call Hook
  const {
    isInCall,
    currentRoomId,
    currentRoomName,
    localStream,
    remoteStreams,
    isMuted,
    isVideoOn,
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleVideo,
  } = useGroupCall(memberId);

  // Fetch meeting rooms
  useEffect(() => {
    const fetchRooms = async () => {
      const { data: roomsData } = await supabase
        .from('meeting_rooms')
        .select('*')
        .eq('is_active', true);

      if (roomsData) {
        const { data: participants } = await supabase
          .from('room_participants')
          .select('room_id, member_id');

        const { data: members } = await supabase
          .from('team_directory')
          .select('user_id, full_name');

        const memberMap = new Map(members?.map((m) => [m.user_id, m.full_name]) || []);

        const enrichedRooms = roomsData.map((room) => {
          const roomParticipants =
            participants?.filter((p) => p.room_id === room.id) || [];
          return {
            ...room,
            participant_count: roomParticipants.length,
            participants: roomParticipants.map((p) => ({
              member_id: p.member_id,
              member_name: memberMap.get(p.member_id) || 'Unknown',
            })),
          };
        });

        setRooms(enrichedRooms);
      }
    };

    fetchRooms();

    const channel = supabase
      .channel('room-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_participants' },
        () => fetchRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch team members with online status
  useEffect(() => {
    const fetchTeamMembers = async () => {
      const { data: members } = await supabase
        .from('team_directory')
        .select('user_id, full_name, role')
        .eq('status', 'active');

      const { data: sessions } = await supabase
        .from('team_sessions')
        .select('member_id')
        .eq('is_active', true);

      const onlineIds = new Set(sessions?.map((s) => s.member_id) || []);

      const { data: participants } = await supabase
        .from('room_participants')
        .select('member_id, room_id');

      const roomMap = new Map(participants?.map((p) => [p.member_id, p.room_id]) || []);

      const enrichedMembers =
        members?.map((m) => ({
          ...m,
          is_online: onlineIds.has(m.user_id),
          current_room: roomMap.get(m.user_id),
        })) || [];

      setTeamMembers(enrichedMembers);
    };

    fetchTeamMembers();
  }, [rooms]);

  const handleJoinRoom = async (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      await joinRoom(roomId, room.name);
    }
  };

  const getRoomIcon = (name: string) => {
    if (name.toLowerCase().includes('lounge')) return Coffee;
    if (name.toLowerCase().includes('focus')) return Briefcase;
    return Video;
  };

  return (
    <>
      {/* Group Call Overlay - renders on top when in call */}
      {isInCall && currentRoomId && memberId && (
        <GroupCallOverlay
          localStream={localStream}
          remoteStreams={remoteStreams}
          roomId={currentRoomId}
          roomName={currentRoomName}
          memberId={memberId}
          isMuted={isMuted}
          isVideoOn={isVideoOn}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onLeave={leaveRoom}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="command-glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Virtual Office</h1>
              <p className="text-white/60">Join a room to collaborate with your team</p>
            </div>
          </div>
        </div>

        {/* Current Room Controls - shown when in call but overlay is minimized */}
        {isInCall && (
          <Card className="command-widget p-4 border-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-white font-medium">
                  In Room: {currentRoomName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full ${
                    isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                  }`}
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full ${
                    !isVideoOn ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                  }`}
                  onClick={toggleVideo}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-red-500 text-white hover:bg-red-600"
                  onClick={leaveRoom}
                >
                  <PhoneOff className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Meeting Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const RoomIcon = getRoomIcon(room.name);
            const isInRoom = currentRoomId === room.id;
            const isFull = room.participant_count >= room.max_capacity;

            return (
              <Card
                key={room.id}
                className={`command-widget p-4 border-0 transition-all ${
                  isInRoom ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <RoomIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{room.name}</h3>
                      <p className="text-white/40 text-xs">{room.description}</p>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      room.participant_count > 0
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-white/10 text-white/60'
                    } border-0`}
                  >
                    {room.participant_count}/{room.max_capacity}
                  </Badge>
                </div>

                {room.participant_count > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.participants.map((p) => (
                      <div
                        key={p.member_id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5"
                      >
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={avatarMap[p.member_id] || undefined} alt={p.member_name} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-[10px] text-white font-bold">
                            {p.member_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white/80 text-xs">{p.member_name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {isInRoom ? (
                  <Button
                    variant="outline"
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                    onClick={leaveRoom}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Room
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
                    disabled={isFull || isInCall}
                    onClick={() => handleJoinRoom(room.id)}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    {isFull ? 'Room Full' : 'Join Room'}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        {/* Team Directory */}
        <Card className="command-widget p-4 border-0">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Team Directory</h2>
            <Badge className="bg-green-500/20 text-green-300 border-0 ml-auto">
              {teamMembers.filter((m) => m.is_online).length} Online
            </Badge>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teamMembers.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={avatarMap[member.user_id] || undefined} alt={member.full_name} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                        {member.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f0f23] ${
                        member.is_online ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{member.full_name}</p>
                    <p className="text-white/40 text-xs capitalize">{member.role}</p>
                  </div>
                  {member.current_room && (
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-0 text-xs">
                      In Meeting
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </>
  );
};
