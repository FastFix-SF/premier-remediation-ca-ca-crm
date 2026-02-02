import React from 'react';
import { useFeedbackAutoFix } from '@/hooks/useFeedbackAutoFix';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Wand2, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeedbackFixQueueProps {
  onSelectFeedback?: (feedbackId: string) => void;
}

const FIX_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'secondary', icon: Clock },
  fix_ready: { label: 'Ready', color: 'default', icon: Wand2 },
  fix_in_progress: { label: 'In Progress', color: 'secondary', icon: Loader2 },
  fix_reviewing: { label: 'Reviewing', color: 'outline', icon: CheckCircle2 },
  fix_verified: { label: 'Verified', color: 'default', icon: CheckCircle2 },
  fix_failed: { label: 'Failed', color: 'destructive', icon: Clock },
} as const;

export const FeedbackFixQueue: React.FC<FeedbackFixQueueProps> = ({ onSelectFeedback }) => {
  const { readyToFix, copyFixPrompt, requestNotificationPermission } = useFeedbackAutoFix();

  React.useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  if (readyToFix.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Fix Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No fixes ready. Submit feedback to get AI suggestions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Fix Queue
          </CardTitle>
          <Badge variant="default">{readyToFix.length} ready</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="space-y-2 p-4 pt-0">
            {readyToFix.map((feedback) => {
              const statusConfig = FIX_STATUS_CONFIG[feedback.fix_status as keyof typeof FIX_STATUS_CONFIG] || FIX_STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={feedback.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onSelectFeedback?.(feedback.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium line-clamp-2 flex-1">
                      {feedback.feedback_text}
                    </p>
                    <Badge variant={statusConfig.color as any} className="shrink-0 text-xs">
                      <StatusIcon className={`w-3 h-3 mr-1 ${feedback.fix_status === 'fix_in_progress' ? 'animate-spin' : ''}`} />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {feedback.priority || 'medium'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {feedback.ai_suggestion?.likelyFiles?.[0] && (
                          <code className="bg-muted px-1 rounded">
                            {feedback.ai_suggestion.likelyFiles[0].split('/').pop()}
                          </code>
                        )}
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyFixPrompt(feedback);
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
