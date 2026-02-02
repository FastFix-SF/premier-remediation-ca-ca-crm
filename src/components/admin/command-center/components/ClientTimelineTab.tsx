import React from 'react';
import { 
  Receipt, DollarSign, FileText, Camera, CheckCircle, 
  Edit, Clock, Loader2, History 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { useClientTimeline, type TimelineEvent } from '../hooks/useClientTimeline';

interface ClientTimelineTabProps {
  projectId: string;
}

const getEventIcon = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'invoice': return <Receipt className="w-4 h-4" />;
    case 'payment': return <DollarSign className="w-4 h-4" />;
    case 'document': return <FileText className="w-4 h-4" />;
    case 'photo': return <Camera className="w-4 h-4" />;
    case 'task': return <CheckCircle className="w-4 h-4" />;
    case 'change_order': return <Edit className="w-4 h-4" />;
    case 'estimate': return <FileText className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

const getEventColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'invoice': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'payment': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'document': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'photo': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    case 'task': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'change_order': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'estimate': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export const ClientTimelineTab: React.FC<ClientTimelineTabProps> = ({ projectId }) => {
  const { events, isLoading } = useClientTimeline(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-white/60">
        <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No activity yet</p>
        <p className="text-sm text-white/40 mt-1">Project activity will appear here</p>
      </div>
    );
  }

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = format(new Date(event.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const dates = Object.keys(groupedEvents).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-6 pr-4">
        {dates.map((date) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/40 font-medium">
                {format(new Date(date), 'MMMM d, yyyy')}
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            
            <div className="space-y-2">
              {groupedEvents[date].map((event) => (
                <Card key={event.id} className={`bg-white/5 border-l-2 ${getEventColor(event.type)}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getEventColor(event.type)}`}>
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{event.title}</p>
                          <span className="text-xs text-white/40">
                            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 mt-0.5">{event.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
