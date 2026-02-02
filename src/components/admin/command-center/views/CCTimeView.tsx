import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  Play,
  Pause,
  Square,
  Calendar,
  DollarSign,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { format, differenceInMinutes, startOfDay, startOfWeek, startOfMonth } from 'date-fns';

interface CCTimeViewProps {
  memberId: string | null;
}

interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  total_hours: number | null;
  notes: string | null;
}

export const CCTimeView: React.FC<CCTimeViewProps> = ({ memberId }) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stats, setStats] = useState({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    billableAmount: 0,
  });

  // Fetch time entries
  useEffect(() => {
    if (!memberId) return;

    const fetchTimeEntries = async () => {
      setLoading(true);

      const { data } = await supabase
        .from('time_clock')
        .select('*')
        .eq('user_id', memberId)
        .order('clock_in', { ascending: false })
        .limit(50);

      if (data) {
        setTimeEntries(data);

        // Check if there's an active timer (clock_in without clock_out)
        const activeEntry = data.find((e) => !e.clock_out);
        if (activeEntry) {
          setIsTimerRunning(true);
          setTimerStartTime(new Date(activeEntry.clock_in));
        }

        // Calculate stats
        const today = startOfDay(new Date());
        const weekStart = startOfWeek(new Date());
        const monthStart = startOfMonth(new Date());

        let todayHours = 0;
        let weekHours = 0;
        let monthHours = 0;

        data.forEach((entry) => {
          const clockIn = new Date(entry.clock_in);
          const hours = entry.total_hours || 0;

          if (clockIn >= monthStart) monthHours += hours;
          if (clockIn >= weekStart) weekHours += hours;
          if (clockIn >= today) todayHours += hours;
        });

        setStats({
          todayHours: Math.round(todayHours * 10) / 10,
          weekHours: Math.round(weekHours * 10) / 10,
          monthHours: Math.round(monthHours * 10) / 10,
          billableAmount: Math.round(monthHours * 50 * 100) / 100, // Assume $50/hr
        });
      }

      setLoading(false);
    };

    fetchTimeEntries();
  }, [memberId]);

  // Update elapsed time every second when timer is running
  useEffect(() => {
    if (!isTimerRunning || !timerStartTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - timerStartTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timerStartTime]);

  const handleStartTimer = async () => {
    if (!memberId) return;

    const now = new Date().toISOString();

    // Get employee name from team_directory
    const { data: memberData } = await supabase
      .from('team_directory')
      .select('full_name')
      .eq('user_id', memberId)
      .maybeSingle();

    const { data, error } = await supabase
      .from('time_clock')
      .insert([{
        user_id: memberId,
        clock_in: now,
        employee_name: memberData?.full_name || 'Unknown',
      }])
      .select()
      .maybeSingle();

    if (!error && data) {
      setIsTimerRunning(true);
      setTimerStartTime(new Date(now));
      setTimeEntries((prev) => [data, ...prev]);
    }
  };

  const handleStopTimer = async () => {
    if (!memberId || !timerStartTime) return;

    const activeEntry = timeEntries.find((e) => !e.clock_out);
    if (!activeEntry) return;

    const now = new Date();
    const totalHours = differenceInMinutes(now, timerStartTime) / 60;

    const { error } = await supabase
      .from('time_clock')
      .update({
        clock_out: now.toISOString(),
        total_hours: Math.round(totalHours * 100) / 100,
      })
      .eq('id', activeEntry.id);

    if (!error) {
      setIsTimerRunning(false);
      setTimerStartTime(null);
      setElapsedTime(0);

      // Refresh entries
      const { data } = await supabase
        .from('time_clock')
        .select('*')
        .eq('user_id', memberId)
        .order('clock_in', { ascending: false })
        .limit(50);

      if (data) setTimeEntries(data);
    }
  };

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="command-glass-card p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Time Tracking</h1>
            <p className="text-white/60">Track your work hours and productivity</p>
          </div>
        </div>
      </div>

      {/* Timer Widget */}
      <Card className="command-glass-card p-6 border-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-white/60 text-sm mb-2">Current Session</p>
            <div className="text-5xl font-mono font-bold text-white">
              {formatElapsedTime(elapsedTime)}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            {isTimerRunning ? (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => {}}
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
                <Button
                  size="lg"
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleStopTimer}
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
                onClick={handleStartTimer}
              >
                <Play className="w-5 h-5 mr-2" />
                Start Timer
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="command-widget p-4 border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Timer className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Today</p>
              <p className="text-2xl font-bold text-white">{stats.todayHours}h</p>
            </div>
          </div>
        </Card>

        <Card className="command-widget p-4 border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">This Week</p>
              <p className="text-2xl font-bold text-white">{stats.weekHours}h</p>
            </div>
          </div>
        </Card>

        <Card className="command-widget p-4 border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">This Month</p>
              <p className="text-2xl font-bold text-white">{stats.monthHours}h</p>
            </div>
          </div>
        </Card>

        <Card className="command-widget p-4 border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Billable</p>
              <p className="text-2xl font-bold text-white">${stats.billableAmount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Time Entries */}
      <Card className="command-widget p-4 border-0">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-white/60" />
          <h2 className="text-lg font-semibold text-white">Recent Time Entries</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : timeEntries.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-white/20 mb-4" />
            <p className="text-white/60">No time entries yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                >
                  <div>
                    <p className="text-white font-medium">
                      {format(new Date(entry.clock_in), 'MMM d, yyyy')}
                    </p>
                    <p className="text-white/40 text-sm">
                      {format(new Date(entry.clock_in), 'h:mm a')} —{' '}
                      {entry.clock_out
                        ? format(new Date(entry.clock_out), 'h:mm a')
                        : 'In Progress'}
                    </p>
                  </div>

                  <div className="text-right">
                    {entry.clock_out ? (
                      <Badge className="bg-green-500/20 text-green-300 border-0">
                        {entry.total_hours?.toFixed(2) || '—'}h
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-0 animate-pulse">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
};
