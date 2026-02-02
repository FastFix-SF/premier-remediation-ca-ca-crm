import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatars } from '@/hooks/useAvatars';
import {
  Clock,
  Play,
  Plus,
  Trophy,
  Users,
  CheckSquare,
  TrendingUp,
  MessageSquare,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';

interface CCHomeViewProps {
  memberId: string | null;
  memberName?: string;
}

interface TeamMember {
  user_id: string;
  full_name: string;
  role: string;
  status: string;
}

interface ActivityLogEntry {
  id: string;
  member_id: string;
  action_type: string;
  action_description: string;
  points: number;
  created_at: string;
  member_name?: string;
}

interface LeaderboardEntry {
  member_id: string;
  member_name: string;
  total_points: number;
  rank: number;
}

export const CCHomeView: React.FC<CCHomeViewProps> = ({ memberId, memberName }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState({
    tasksCompleted: 0,
    hoursLogged: 0,
    pointsToday: 0,
  });

  // Collect all user IDs for avatar fetching
  const allUserIds = useMemo(() => {
    const ids = new Set<string>();
    teamMembers.forEach(m => ids.add(m.user_id));
    recentActivity.forEach(a => ids.add(a.member_id));
    leaderboard.forEach(l => ids.add(l.member_id));
    return Array.from(ids).filter(Boolean);
  }, [teamMembers, recentActivity, leaderboard]);

  const { data: avatarMap = {} } = useAvatars(allUserIds);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      const { data } = await supabase
        .from('team_directory')
        .select('user_id, full_name, role, status')
        .eq('status', 'active')
        .limit(10);

      if (data) setTeamMembers(data);
    };

    fetchTeamMembers();
  }, []);

  // Fetch recent activity
  useEffect(() => {
    const fetchActivity = async () => {
      const { data: activities } = await supabase
        .from('team_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (activities) {
        // Enrich with member names
        const { data: members } = await supabase
          .from('team_directory')
          .select('user_id, full_name');

        const memberMap = new Map(members?.map((m) => [m.user_id, m.full_name]) || []);

        setRecentActivity(
          activities.map((a) => ({
            ...a,
            member_name: memberMap.get(a.member_id) || 'Unknown',
          }))
        );
      }
    };

    fetchActivity();
  }, []);

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: activities } = await supabase
        .from('team_activity_log')
        .select('member_id, points')
        .gte('created_at', today.toISOString());

      if (activities) {
        // Aggregate points by member
        const pointsMap = new Map<string, number>();
        activities.forEach((a) => {
          pointsMap.set(a.member_id, (pointsMap.get(a.member_id) || 0) + a.points);
        });

        // Get member names
        const { data: members } = await supabase
          .from('team_directory')
          .select('user_id, full_name');

        const memberMap = new Map(members?.map((m) => [m.user_id, m.full_name]) || []);

        // Build leaderboard
        const entries: LeaderboardEntry[] = Array.from(pointsMap.entries())
          .map(([id, points]) => ({
            member_id: id,
            member_name: memberMap.get(id) || 'Unknown',
            total_points: points,
            rank: 0,
          }))
          .sort((a, b) => b.total_points - a.total_points)
          .slice(0, 5)
          .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

        setLeaderboard(entries);
      }
    };

    fetchLeaderboard();
  }, []);

  // Fetch my stats
  useEffect(() => {
    if (!memberId) return;

    const fetchMyStats = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Points today
      const { data: activities } = await supabase
        .from('team_activity_log')
        .select('points')
        .eq('member_id', memberId)
        .gte('created_at', today.toISOString());

      const pointsToday = activities?.reduce((sum, a) => sum + a.points, 0) || 0;

      // Tasks completed today
      const { count: tasksCount } = await supabase
        .from('todos')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', memberId)
        .eq('status', 'completed')
        .gte('updated_at', today.toISOString());

      // Hours logged today from time_clock
      const { data: timeEntries } = await supabase
        .from('time_clock')
        .select('clock_in, clock_out')
        .eq('user_id', memberId)
        .gte('clock_in', today.toISOString());

      let hoursLogged = 0;
      timeEntries?.forEach((entry) => {
        if (entry.clock_out) {
          const diff = new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime();
          hoursLogged += diff / (1000 * 60 * 60);
        }
      });

      setMyStats({
        tasksCompleted: tasksCount || 0,
        hoursLogged: Math.round(hoursLogged * 10) / 10,
        pointsToday,
      });
    };

    fetchMyStats();
  }, [memberId]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="command-glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {getGreeting()}, {memberName || 'Team Member'}
            </h1>
            <p className="text-white/60 mt-1">
              {format(currentTime, 'EEEE, MMMM d')} •{' '}
              <span className="font-mono">{format(currentTime, 'h:mm:ss a')}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0">
              <Play className="w-4 h-4 mr-2" />
              Start Timer
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-transparent command-widget p-4 border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Tasks Completed</p>
              <p className="text-2xl font-bold text-white">{myStats.tasksCompleted}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-transparent command-widget p-4 border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Hours Logged</p>
              <p className="text-2xl font-bold text-white">{myStats.hoursLogged}h</p>
            </div>
          </div>
        </Card>

        <Card className="bg-transparent command-widget p-4 border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Points Today</p>
              <p className="text-2xl font-bold text-white">{myStats.pointsToday}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <Card className="bg-transparent command-widget p-4 border-0">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Today's Leaders</h2>
          </div>
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">No activity yet today</p>
            ) : (
              leaderboard.map((entry) => (
                <div
                  key={entry.member_id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      entry.rank === 1
                        ? 'bg-yellow-500 text-black'
                        : entry.rank === 2
                        ? 'bg-gray-300 text-black'
                        : entry.rank === 3
                        ? 'bg-amber-600 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {entry.rank}
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={avatarMap[entry.member_id] || undefined} alt={entry.member_name} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold">
                      {entry.member_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{entry.member_name}</p>
                  </div>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-0">
                    {entry.total_points} pts
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Live Activity */}
        <Card className="bg-transparent command-widget p-4 border-0 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Live Activity</h2>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg bg-white/5"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={avatarMap[activity.member_id] || undefined} alt={activity.member_name} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold">
                        {activity.member_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">
                        <span className="font-medium">{activity.member_name}</span>{' '}
                        <span className="text-white/60">{activity.action_description}</span>
                      </p>
                      <p className="text-white/40 text-xs">
                        {format(new Date(activity.created_at), 'h:mm a')}
                      </p>
                    </div>
                    {activity.points > 0 && (
                      <Badge className="bg-green-500/20 text-green-300 border-0 text-xs">
                        +{activity.points}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Team Status */}
      <Card className="bg-transparent command-widget p-4 border-0">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Team Status</h2>
          <Badge className="bg-green-500/20 text-green-300 border-0 ml-auto">
            {teamMembers.length} Active
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3">
          {teamMembers.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5"
            >
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={avatarMap[member.user_id] || undefined} alt={member.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold">
                    {member.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0f0f23]" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{member.full_name}</p>
                <p className="text-white/40 text-xs capitalize">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
