import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatars } from '@/hooks/useAvatars';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Edit2,
  MoreVertical,
  UserCheck,
  UserX,
} from 'lucide-react';

interface CCTeamViewProps {
  memberId: string | null;
}

interface TeamMember {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  secondary_role: string | null;
  status: string;
  phone_number: string | null;
  created_at: string;
  is_online?: boolean;
}

export const CCTeamView: React.FC<CCTeamViewProps> = ({ memberId }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Collect all user IDs for avatar fetching
  const userIds = useMemo(() => members.map(m => m.user_id).filter(Boolean), [members]);
  const { data: avatarMap = {} } = useAvatars(userIds);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      setLoading(true);

      const { data: membersData } = await supabase
        .from('team_directory')
        .select('*')
        .order('full_name');

      if (membersData) {
        // Get online status from sessions
        const { data: sessions } = await supabase
          .from('team_sessions')
          .select('member_id')
          .eq('is_active', true);

        const onlineIds = new Set(sessions?.map((s) => s.member_id) || []);

        setMembers(
          membersData.map((m) => ({
            ...m,
            is_online: onlineIds.has(m.user_id),
          }))
        );
      }

      setLoading(false);
    };

    fetchTeamMembers();
  }, []);

  const filteredMembers = members.filter((member) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      if (
        !member.full_name?.toLowerCase().includes(searchLower) &&
        !member.email?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    // Role filter
    if (roleFilter !== 'all' && member.role !== roleFilter) {
      return false;
    }

    return true;
  });

  const roles = [...new Set(members.map((m) => m.role).filter(Boolean))];

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return 'bg-red-500/20 text-red-300';
      case 'admin':
        return 'bg-blue-500/20 text-blue-300';
      case 'leader':
        return 'bg-purple-500/20 text-purple-300';
      case 'contributor':
        return 'bg-green-500/20 text-green-300';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="command-glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Team</h1>
              <p className="text-white/60">{members.length} team members</p>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0">
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="command-widget p-4 border-0">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {/* Role Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className={`${
                roleFilter === 'all'
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setRoleFilter('all')}
            >
              All
            </Button>
            {roles.map((role) => (
              <Button
                key={role}
                variant="ghost"
                size="sm"
                className={`${
                  roleFilter === role
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setRoleFilter(role)}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Team Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <Card className="command-widget p-12 border-0 text-center">
          <Users className="w-12 h-12 mx-auto text-white/20 mb-4" />
          <p className="text-white/60">No team members found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <Card
              key={member.user_id}
              className="command-widget p-4 border-0 hover:bg-white/10 transition-colors"
            >
                <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={avatarMap[member.user_id] || undefined} alt={member.full_name} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-lg">
                        {member.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#0f0f23] ${
                        member.is_online ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{member.full_name}</h3>
                    <Badge className={`${getRoleBadgeColor(member.role)} border-0 capitalize`}>
                      {member.role}
                    </Badge>
                  </div>
                </div>
                <Badge
                  className={`${
                    member.status === 'active'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  } border-0`}
                >
                  {member.status === 'active' ? (
                    <UserCheck className="w-3 h-3 mr-1" />
                  ) : (
                    <UserX className="w-3 h-3 mr-1" />
                  )}
                  {member.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{member.email}</span>
                </div>
                {member.phone_number && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Phone className="w-4 h-4" />
                    <span>{member.phone_number}</span>
                  </div>
                )}
                {member.secondary_role && (
                  <div className="flex items-center gap-2 text-white/40">
                    <Users className="w-4 h-4" />
                    <span className="capitalize">{member.secondary_role}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
