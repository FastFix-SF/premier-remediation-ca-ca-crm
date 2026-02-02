import React, { useState } from 'react';
import { useFeedbackAutoFix } from '@/hooks/useFeedbackAutoFix';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wand2, Copy, Check, Bell, BellOff } from 'lucide-react';

export const FixReadyIndicator: React.FC = () => {
  const { readyToFix, copyFixPrompt, requestNotificationPermission } = useFeedbackAutoFix();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  );

  const handleCopy = async (feedback: any) => {
    await copyFixPrompt(feedback);
    setCopiedId(feedback.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEnableNotifications = async () => {
    await requestNotificationPermission();
    setNotificationsEnabled(Notification.permission === 'granted');
  };

  if (readyToFix.length === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-2">
          <Wand2 className="w-4 h-4" />
          <span className="hidden sm:inline">Fixes Ready</span>
          <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 min-w-[20px] flex items-center justify-center text-xs">
            {readyToFix.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h4 className="font-medium text-sm">Ready to Fix</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEnableNotifications}
            className="h-7 px-2"
          >
            {notificationsEnabled ? (
              <Bell className="w-4 h-4 text-primary" />
            ) : (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-1">
            {readyToFix.map((feedback) => (
              <div
                key={feedback.id}
                className="p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <p className="text-sm line-clamp-2 mb-2">
                  {feedback.feedback_text}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {feedback.priority || 'medium'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => handleCopy(feedback)}
                  >
                    {copiedId === feedback.id ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy Fix
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
