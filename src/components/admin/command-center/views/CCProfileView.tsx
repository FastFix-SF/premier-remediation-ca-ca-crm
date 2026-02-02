import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit2,
  Save,
  Clock,
  Trophy,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';

interface CCProfileViewProps {
  memberId: string | null;
}

interface ProfileData {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  secondary_role: string | null;
  status: string;
  phone_number: string | null;
  created_at: string;
  avatar_url: string | null;
}

interface Stats {
  totalPoints: number;
  tasksCompleted: number;
  hoursLogged: number;
  rank: number;
}

export const CCProfileView: React.FC<CCProfileViewProps> = ({ memberId }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<Stats>({ totalPoints: 0, tasksCompleted: 0, hoursLogged: 0, rank: 0 });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_number: '',
  });

  useEffect(() => {
    if (!memberId) return;

    const fetchProfile = async () => {
      setLoading(true);

      // Get profile from team_directory
      const { data: profileData } = await supabase
        .from('team_directory')
        .select('*')
        .eq('user_id', memberId)
        .maybeSingle();

      // Also fetch avatar from profiles table (where avatars are actually stored)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', memberId)
        .maybeSingle();

      if (profileData) {
        setProfile({
          ...profileData,
          avatar_url: profilesData?.avatar_url || profileData.avatar_url || null,
        });
        setEditForm({
          full_name: profileData.full_name || '',
          phone_number: profileData.phone_number || '',
        });
      }

      // Get stats
      const { data: activities } = await supabase
        .from('team_activity_log')
        .select('points')
        .eq('member_id', memberId);

      const totalPoints = activities?.reduce((sum, a) => sum + a.points, 0) || 0;

      // Tasks completed - query project_tasks table
      const { count: tasksCount } = await supabase
        .from('project_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', memberId)
        .eq('is_completed', true);

      // Hours logged
      const { data: timeEntries } = await supabase
        .from('time_clock')
        .select('total_hours')
        .eq('user_id', memberId);

      const hoursLogged = timeEntries?.reduce((sum, e) => sum + (e.total_hours || 0), 0) || 0;

      // Calculate rank
      const { data: allActivities } = await supabase
        .from('team_activity_log')
        .select('member_id, points');

      if (allActivities) {
        const pointsMap = new Map<string, number>();
        allActivities.forEach((a) => {
          pointsMap.set(a.member_id, (pointsMap.get(a.member_id) || 0) + a.points);
        });

        const sorted = Array.from(pointsMap.entries()).sort((a, b) => b[1] - a[1]);
        const rank = sorted.findIndex(([id]) => id === memberId) + 1;

        setStats({
          totalPoints,
          tasksCompleted: tasksCount || 0,
          hoursLogged: Math.round(hoursLogged * 10) / 10,
          rank: rank || 0,
        });
      }

      setLoading(false);
    };

    fetchProfile();
  }, [memberId]);

  const handleSave = async () => {
    if (!memberId) return;

    const { error } = await supabase
      .from('team_directory')
      .update({
        full_name: editForm.full_name,
        phone_number: editForm.phone_number,
      })
      .eq('user_id', memberId);

    if (!error) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: editForm.full_name,
              phone_number: editForm.phone_number,
            }
          : null
      );
      setIsEditing(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="command-widget p-12 border-0 text-center">
        <User className="w-12 h-12 mx-auto text-white/20 mb-4" />
        <p className="text-white/60">Profile not found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="command-glass-card p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <p className="text-white/60">Manage your account settings</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="command-glass-card p-6 border-0">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="w-24 h-24 rounded-2xl">
              <AvatarImage 
                src={profile.avatar_url || undefined} 
                alt={profile.full_name} 
                className="object-cover"
              />
              <AvatarFallback className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl font-bold">
                {profile.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="text-white/60 text-sm">Full Name</label>
                  <Input
                    value={editForm.full_name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm">Phone Number</label>
                  <Input
                    value={editForm.phone_number}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, phone_number: e.target.value }))
                    }
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0"
                    onClick={handleSave}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{profile.full_name}</h2>
                  <Badge className={`${getRoleBadgeColor(profile.role)} border-0 capitalize`}>
                    {profile.role}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-white/60">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Phone className="w-4 h-4" />
                    <span>{profile.phone_number || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Shield className="w-4 h-4" />
                    <span className="capitalize">
                      {profile.secondary_role || 'No secondary role'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {format(new Date(profile.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="command-widget p-4 border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Rank</p>
              <p className="text-2xl font-bold text-white">#{stats.rank || '—'}</p>
            </div>
          </div>
        </Card>

        <Card className="command-widget p-4 border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Points</p>
              <p className="text-2xl font-bold text-white">{stats.totalPoints}</p>
            </div>
          </div>
        </Card>

        <Card className="command-widget p-4 border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Tasks Completed</p>
              <p className="text-2xl font-bold text-white">{stats.tasksCompleted}</p>
            </div>
          </div>
        </Card>

        <Card className="command-widget p-4 border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Hours Logged</p>
              <p className="text-2xl font-bold text-white">{stats.hoursLogged}h</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
