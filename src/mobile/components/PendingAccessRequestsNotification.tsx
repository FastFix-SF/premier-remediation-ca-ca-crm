import React from 'react';
import { UserPlus, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePendingAccessRequests, useProjectAccessRequest } from '@/mobile/hooks/useProjectAccessRequest';
import { formatDistanceToNow } from 'date-fns';

export const PendingAccessRequestsNotification: React.FC = () => {
  const { data: requests = [], isLoading } = usePendingAccessRequests();

  if (isLoading || requests.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
          <UserPlus className="h-4 w-4" />
          Access Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request: any) => (
          <AccessRequestItem 
            key={request.id} 
            request={request} 
          />
        ))}
      </CardContent>
    </Card>
  );
};

const AccessRequestItem: React.FC<{ request: any }> = ({ request }) => {
  const { approveAccess, isApproving } = useProjectAccessRequest(request.project_id);
  
  const projectName = request.projects?.project_name || request.projects?.address || 'Unknown Project';
  const timeAgo = formatDistanceToNow(new Date(request.requested_at), { addSuffix: true });

  return (
    <div className="flex items-center justify-between gap-2 p-2 bg-background rounded-lg border">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{request.requester_name}</p>
        <p className="text-xs text-muted-foreground truncate">
          wants access to <span className="font-medium">{projectName}</span>
        </p>
        <div className="flex items-center gap-1 mt-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>
      <Button 
        size="sm" 
        onClick={() => approveAccess(request.id)}
        disabled={isApproving}
        className="shrink-0"
      >
        <Check className="h-4 w-4 mr-1" />
        Add
      </Button>
    </div>
  );
};
