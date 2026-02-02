import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatars } from '@/hooks/useAvatars';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  TrendingUp,
  Flame,
  Star,
  Zap,
} from 'lucide-react';

interface CCRankingViewProps {
  memberId: string | null;
}

interface LeaderboardEntry {
  member_id: string;
  member_name: string;
  avatar_color?: string;
  total_points: number;
  rank: number;
  streak?: number;
}

export const CCRankingView: React.FC<CCRankingViewProps> = ({ memberId }) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);

  // Collect all user IDs for avatar fetching
  const userIds = useMemo(() => leaderboard.map(l => l.member_id).filter(Boolean), [leaderboard]);
  const { data: avatarMap = {} } = useAvatars(userIds);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      let dateFilter = new Date();
      switch (period) {
        case 'today':
          dateFilter.setHours(0, 0, 0, 0);
          break;
        case 'week':
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case 'month':
          dateFilter.setMonth(dateFilter.getMonth() - 1);
          break;
        case 'all':
          dateFilter = new Date(0); // Beginning of time
          break;
      }

      const { data: activities } = await supabase
        .from('team_activity_log')
        .select('member_id, points')
        .gte('created_at', dateFilter.toISOString());

      if (activities) {
        // Aggregate points by member
        const pointsMap = new Map<string, number>();
        activities.forEach((a) => {
          pointsMap.set(a.member_id, (pointsMap.get(a.member_id) || 0) + a.points);
        });

        // Get member names
        const { data: members } = await supabase
          .from('team_directory')
          .select('user_id, full_name')
          .eq('status', 'active');

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
          .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

        setLeaderboard(entries);

        // Find my rank
        const myEntry = entries.find((e) => e.member_id === memberId);
        setMyRank(myEntry || null);
      }

      setLoading(false);
    };

    fetchLeaderboard();
  }, [period, memberId]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Crown className="w-5 h-5 text-white" />
          </div>
        );
      case 2:
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
            <Medal className="w-5 h-5 text-white" />
          </div>
        );
      case 3:
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
            {rank}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="command-glass-card p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
            <p className="text-white/60">See how you stack up against the team</p>
          </div>
        </div>
      </div>

      {/* My Rank Card */}
      {myRank && (
        <Card className="command-glass-card p-6 border-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getRankBadge(myRank.rank)}
              <div>
                <p className="text-white/60 text-sm">Your Position</p>
                <p className="text-2xl font-bold text-white">
                  #{myRank.rank} of {leaderboard.length}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Points</p>
              <p className="text-3xl font-bold text-white">{myRank.total_points}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Period Tabs */}
      <Card className="command-widget p-2 border-0">
        <div className="flex gap-2">
          {(['today', 'week', 'month', 'all'] as const).map((p) => (
            <Button
              key={p}
              variant="ghost"
              className={`flex-1 ${
                period === p
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setPeriod(p)}
            >
              {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      {/* Leaderboard */}
      <Card className="command-widget p-4 border-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto text-white/20 mb-4" />
            <p className="text-white/60">No activity recorded yet</p>
            <p className="text-white/40 text-sm mt-1">
              Complete tasks and clock in to earn points!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {leaderboard.map((entry) => {
                const isMe = entry.member_id === memberId;

                return (
                  <div
                    key={entry.member_id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      isMe
                        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 ring-1 ring-indigo-500/50'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {getRankBadge(entry.rank)}

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={avatarMap[entry.member_id] || undefined} alt={entry.member_name} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                          {entry.member_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium truncate">
                          {entry.member_name}
                          {isMe && (
                            <span className="ml-2 text-indigo-400 text-sm">(You)</span>
                          )}
                        </p>
                        {entry.rank <= 3 && (
                          <div className="flex items-center gap-1 text-yellow-400 text-xs">
                            <Flame className="w-3 h-3" />
                            <span>Top Performer</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-white font-bold text-lg">
                        {entry.total_points}
                      </span>
                      <span className="text-white/40 text-sm">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Points Guide */}
      <Card className="command-widget p-4 border-0">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          How to Earn Points
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { action: 'Complete a Task', points: 2, icon: '✅' },
            { action: 'Clock In', points: 2, icon: '⏰' },
            { action: 'Join a Meeting', points: 2, icon: '📹' },
            { action: 'Daily Check-in', points: 3, icon: '👋' },
            { action: 'Send a Message', points: 1, icon: '💬' },
            { action: 'Start Timer', points: 2, icon: '▶️' },
            { action: 'Add a Note', points: 0.5, icon: '📝' },
            { action: 'Create a Task', points: 0.5, icon: '➕' },
          ].map((item) => (
            <div
              key={item.action}
              className="flex items-center gap-2 p-3 rounded-lg bg-white/5"
            >
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-white text-sm">{item.action}</p>
                <p className="text-green-400 text-xs font-medium">+{item.points} pts</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
