import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Calendar, Users, TrendingUp, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO, differenceInMinutes } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const ProjectTimePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Get team assignments for this project
  const { data: assignments = [] } = useQuery({
    queryKey: ['project-team-assignments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_team_assignments')
        .select('user_id')
        .eq('project_id', id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const userIds = assignments.map(a => a.user_id);

  // Get time clock entries for project team members
  const { data: timeEntries = [], isLoading: timeLoading } = useQuery({
    queryKey: ['project-time-entries', id, weekStart.toISOString()],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      
      const { data: entries, error } = await supabase
        .from('time_clock')
        .select('*')
        .in('user_id', userIds)
        .gte('clock_in', weekStart.toISOString())
        .lte('clock_in', weekEnd.toISOString())
        .order('clock_in', { ascending: false });
      
      if (error) throw error;
      
      // Get team directory names separately
      const { data: teamData } = await supabase
        .from('team_directory')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      const nameMap = new Map(teamData?.map(t => [t.user_id, t.full_name]) || []);
      
      return entries?.map(entry => ({
        ...entry,
        employee_name: nameMap.get(entry.user_id) || 'Unknown'
      })) || [];
    },
    enabled: userIds.length > 0,
  });

  // Calculate totals
  const totalHours = timeEntries.reduce((acc, entry) => acc + (entry.total_hours || 0), 0);
  const uniqueWorkers = new Set(timeEntries.map(e => e.user_id)).size;

  // Group entries by employee
  const entriesByEmployee = timeEntries.reduce((acc, entry: any) => {
    const name = entry.employee_name || 'Unknown';
    if (!acc[entry.user_id]) {
      acc[entry.user_id] = { name, entries: [], totalHours: 0 };
    }
    acc[entry.user_id].entries.push(entry);
    acc[entry.user_id].totalHours += entry.total_hours || 0;
    return acc;
  }, {} as Record<string, { name: string; entries: any[]; totalHours: number }>);

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (projectLoading || timeLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <ProjectSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <ProjectSidebar />
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{project?.name} - Time Tracking</h1>
            <p className="text-muted-foreground">{project?.address}</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-2 bg-muted rounded-lg font-medium">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="ghost" onClick={() => setCurrentWeek(new Date())}>
            Today
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-2xl font-bold">{formatDuration(totalHours)}</p>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Workers</p>
                  <p className="text-2xl font-bold">{uniqueWorkers}</p>
                </div>
                <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entries</p>
                  <p className="text-2xl font-bold">{timeEntries.length}</p>
                </div>
                <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg/Worker</p>
                  <p className="text-2xl font-bold">
                    {uniqueWorkers > 0 ? formatDuration(totalHours / uniqueWorkers) : '0h'}
                  </p>
                </div>
                <div className="h-10 w-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Entries by Employee */}
        {Object.keys(entriesByEmployee).length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Time Entries</h3>
                <p className="text-muted-foreground">
                  No time clock entries found for this week
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(entriesByEmployee).map(([userId, data]) => (
              <Card key={userId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(data.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{data.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {data.entries.length} entries this week
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg">
                      {formatDuration(data.totalHours)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Clock Out</TableHead>
                        <TableHead>Break</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {format(parseISO(entry.clock_in), 'EEE, MMM d')}
                          </TableCell>
                          <TableCell>
                            {format(parseISO(entry.clock_in), 'h:mm a')}
                          </TableCell>
                          <TableCell>
                            {entry.clock_out 
                              ? format(parseISO(entry.clock_out), 'h:mm a')
                              : <Badge variant="outline">Active</Badge>
                            }
                          </TableCell>
                          <TableCell>
                            {entry.break_minutes ? `${entry.break_minutes}m` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {entry.total_hours ? formatDuration(entry.total_hours) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={entry.clock_out ? 'default' : 'secondary'}
                              className={entry.clock_out ? 'bg-emerald-500' : ''}
                            >
                              {entry.clock_out ? 'Complete' : 'In Progress'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTimePage;
