import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Activity, Clock, MapPin, User, AlertTriangle, CheckCircle, Coffee } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { format, parseISO, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

interface ActivityEntry {
  id: string;
  employee_name: string;
  employee_role?: string;
  action: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'late_arrival';
  timestamp: string;
  location?: string;
  notes?: string;
  duration?: number;
}

const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityFeed();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, []);

  const fetchActivityFeed = async () => {
    try {
      setLoading(true);
      
      // Get recent attendance records and convert to activity feed
      const { data, error } = await supabase
        .from('workforce_attendance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const activities = convertToActivityFeed(data || []);
      setActivities(activities);
    } catch (error) {
      console.error('Error fetching activity feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToActivityFeed = (attendanceData: any[]): ActivityEntry[] => {
    const activities: ActivityEntry[] = [];

    attendanceData.forEach(record => {
      // Clock in activity
      if (record.clock_in) {
        activities.push({
          id: `${record.id}_clock_in`,
          employee_name: record.employee_name,
          employee_role: record.employee_role,
          action: record.status === 'late' ? 'late_arrival' : 'clock_in',
          timestamp: record.clock_in,
          location: record.location_data?.address,
          notes: record.status === 'late' ? 'Late arrival detected' : undefined
        });
      }

      // Clock out activity
      if (record.clock_out) {
        activities.push({
          id: `${record.id}_clock_out`,
          employee_name: record.employee_name,
          employee_role: record.employee_role,
          action: 'clock_out',
          timestamp: record.clock_out,
          location: record.location_data?.address,
          duration: record.total_hours
        });
      }

      // Break activities (if break duration exists)
      if (record.break_duration_minutes && record.break_duration_minutes > 0) {
        activities.push({
          id: `${record.id}_break`,
          employee_name: record.employee_name,
          employee_role: record.employee_role,
          action: 'break_start',
          timestamp: record.updated_at,
          duration: record.break_duration_minutes
        });
      }
    });

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const setupRealtimeSubscription = () => {
    const instanceId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`activity-feed-changes-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workforce_attendance',
        },
        () => {
          fetchActivityFeed(); // Refresh activity feed on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'clock_in':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'clock_out':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'late_arrival':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'break_start':
      case 'break_end':
        return <Coffee className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityText = (activity: ActivityEntry) => {
    switch (activity.action) {
      case 'clock_in':
        return 'clocked in';
      case 'clock_out':
        return `clocked out${activity.duration ? ` (${activity.duration.toFixed(1)}h worked)` : ''}`;
      case 'late_arrival':
        return 'clocked in late';
      case 'break_start':
        return `started break${activity.duration ? ` (${activity.duration} min)` : ''}`;
      case 'break_end':
        return 'ended break';
      default:
        return 'activity updated';
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'clock_in':
        return 'border-l-emerald-500 bg-emerald-50';
      case 'clock_out':
        return 'border-l-blue-500 bg-blue-50';
      case 'late_arrival':
        return 'border-l-red-500 bg-red-50';
      case 'break_start':
      case 'break_end':
        return 'border-l-amber-500 bg-amber-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatActivityDate = (timestamp: string) => {
    const date = parseISO(timestamp);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const groupActivitiesByDate = (activities: ActivityEntry[]) => {
    const groups: { [key: string]: ActivityEntry[] } = {};
    
    activities.forEach(activity => {
      const date = parseISO(activity.timestamp);
      let groupKey;
      
      if (isToday(date)) {
        groupKey = 'Today';
      } else if (isYesterday(date)) {
        groupKey = 'Yesterday';
      } else {
        groupKey = format(date, 'MMMM d, yyyy');
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(activity);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity Feed
        </CardTitle>
        <CardDescription>
          Real-time employee clock-in/out activity • {activities.length} recent activities
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground">
              Employee activities will appear here in real-time
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([dateGroup, dayActivities]) => (
              <div key={dateGroup}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background">
                  {dateGroup}
                </h3>
                <div className="space-y-2">
                  {dayActivities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className={`border-l-4 pl-4 py-2 rounded-r ${getActivityColor(activity.action)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getActivityIcon(activity.action)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {activity.employee_name}
                              </span>
                              {activity.employee_role && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.employee_role}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getActivityText(activity)}
                            </p>
                            {activity.location && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {activity.location}
                                </span>
                              </div>
                            )}
                            {activity.notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                {activity.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground ml-2">
                          {formatActivityDate(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;