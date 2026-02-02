import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  Calculator, 
  FolderOpen, 
  Settings, 
  User,
  Clock
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ActivityLogEntry } from '@/hooks/useActivityLog';

interface ActivityLogPanelProps {
  activities: ActivityLogEntry[];
  loading: boolean;
  className?: string;
}

const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({
  activities,
  loading,
  className = ""
}) => {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'roi_saved': return <FolderOpen className="h-4 w-4 text-blue-500" />;
      case 'measurements_run': return <Calculator className="h-4 w-4 text-green-500" />;
      case 'imagery_selected': return <Camera className="h-4 w-4 text-purple-500" />;
      case 'auto_outline': return <Settings className="h-4 w-4 text-orange-500" />;
      case 'converted_to_project': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'system': return <Settings className="h-4 w-4 text-gray-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'roi_saved': return 'blue';
      case 'measurements_run': return 'green';
      case 'imagery_selected': return 'purple';
      case 'auto_outline': return 'orange';
      case 'converted_to_project': return 'emerald';
      case 'error': return 'red';
      case 'system': return 'gray';
      default: return 'gray';
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No activities recorded yet</p>
            <p className="text-xs">Actions and events will appear here as they occur</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-6 space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Timeline line */}
                {index < activities.length - 1 && (
                  <div className="absolute left-4 top-8 w-px h-12 bg-border" />
                )}
                
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {getActionIcon(activity.action_type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-tight">
                          {activity.action_description}
                        </p>
                        
                        {/* Metadata */}
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {activity.metadata.success !== undefined && (
                              <Badge 
                                variant={activity.metadata.success ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {activity.metadata.success ? 'Success' : 'Failed'}
                              </Badge>
                            )}
                            {activity.metadata.method && (
                              <Badge variant="outline" className="text-xs">
                                {activity.metadata.method}
                              </Badge>
                            )}
                            {activity.metadata.structureCount && (
                              <Badge variant="outline" className="text-xs">
                                {activity.metadata.structureCount} structures
                              </Badge>
                            )}
                            {activity.metadata.imagery?.provider && (
                              <Badge variant="outline" className="text-xs">
                                {activity.metadata.imagery.provider}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Action type badge */}
                      <Badge 
                        variant="outline" 
                        className="text-xs flex-shrink-0"
                      >
                        {formatActionType(activity.action_type)}
                      </Badge>
                    </div>
                    
                    {/* Timestamp and user */}
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span title={format(new Date(activity.created_at), 'PPpp')}>
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                      
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Admin</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityLogPanel;