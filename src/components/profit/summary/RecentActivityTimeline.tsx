import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Camera, 
  FileText, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'photo' | 'change_order' | 'inspection' | 'punchlist' | 'status' | 'labor';
  title: string;
  description?: string;
  timestamp: string;
  user?: string;
  status?: string;
}

interface RecentActivityTimelineProps {
  activities: ActivityItem[];
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'photo':
      return Camera;
    case 'change_order':
      return DollarSign;
    case 'inspection':
      return CheckCircle;
    case 'punchlist':
      return AlertCircle;
    case 'status':
      return FileText;
    case 'labor':
      return User;
    default:
      return Clock;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'photo':
      return 'bg-blue-500';
    case 'change_order':
      return 'bg-purple-500';
    case 'inspection':
      return 'bg-green-500';
    case 'punchlist':
      return 'bg-amber-500';
    case 'status':
      return 'bg-slate-500';
    case 'labor':
      return 'bg-cyan-500';
    default:
      return 'bg-muted-foreground';
  }
};

export const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({
  activities
}) => {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
          
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);
              
              return (
                <div key={activity.id} className="relative flex gap-3 pl-8">
                  {/* Timeline dot */}
                  <div 
                    className={cn(
                      "absolute left-0 w-6 h-6 rounded-full flex items-center justify-center",
                      colorClass
                    )}
                  >
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {activity.title}
                      </span>
                      {activity.status && (
                        <Badge variant="outline" className="text-xs">
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                      {activity.user && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{activity.user}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
