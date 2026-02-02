import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import { format } from 'date-fns';
import { 
  Camera, 
  MessageSquare, 
  UserPlus, 
  FileText, 
  CalendarClock, 
  Clock,
  Package,
  Loader2,
  User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectUpdatesFeedProps {
  projectId: string | null;
}

const getUpdateIcon = (type: string) => {
  switch (type) {
    case 'photo_uploaded': return <Camera className="w-full h-full" />;
    case 'invoice_paid': return <FileText className="w-full h-full" />;
    case 'invoice_created': return <FileText className="w-full h-full" />;
    case 'job_scheduled': return <CalendarClock className="w-full h-full" />;
    case 'proposal_sent': return <MessageSquare className="w-full h-full" />;
    case 'proposal_accepted': return <UserPlus className="w-full h-full" />;
    case 'project_created': return <Package className="w-full h-full" />;
    default: return <MessageSquare className="w-full h-full" />;
  }
};

const getUpdateColor = (type: string) => {
  switch (type) {
    case 'photo_uploaded': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'invoice_paid': return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'invoice_created': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    case 'job_scheduled': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
    case 'proposal_sent': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    case 'proposal_accepted': return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'project_created': return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
    default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
  }
};

export const ProjectUpdatesFeed = ({ projectId }: ProjectUpdatesFeedProps) => {
  const { updates, loading } = useProjectUpdates(10, projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!updates || updates.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No updates yet for this project.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {updates.map((update) => (
        <div 
          key={update.id} 
          className="flex gap-3 p-3 rounded-lg border bg-card hover:border-primary/20 hover:shadow-sm transition-all duration-200"
        >
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getUpdateColor(update.type)}`}>
            <div className="w-5 h-5">
              {getUpdateIcon(update.type)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 capitalize">
                {update.type.replace(/_/g, ' ')}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">
              {update.description}
            </p>
            
            <div className="flex items-center gap-3 flex-wrap">
              {update.userName && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground">
                    {update.userName}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <time className="text-[10px] text-muted-foreground">
                  {format(new Date(update.timestamp), 'MMM d, yyyy h:mm a')}
                </time>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
