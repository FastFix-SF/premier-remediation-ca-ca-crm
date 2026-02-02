import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTeamMember } from '@/hooks/useTeamMember';
import { useRecognitions } from '@/hooks/useRecognitions';
import { format } from 'date-fns';

export const RecognitionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { teamMembers, getDisplayName, getInitials } = useTeamMember();
  const { data: recognitions = [], isLoading } = useRecognitions();

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mobile/admin')}
            className="hover:bg-accent"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-semibold">Admin recognitions</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 py-4 space-y-3">
        <h2 className="text-xl font-bold">History</h2>

        {/* Recognition List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading recognitions...</div>
          ) : recognitions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No recognitions yet</div>
          ) : (
            recognitions.map((recognition) => {
              const fromName = recognition.from_user?.full_name || 'Unknown';
              const fromInitials = getInitials(fromName);
              const toUserCount = recognition.to_user_ids.length;
              const toUsersDisplay = toUserCount === 1 
                ? getDisplayName(recognition.to_user_ids[0]) 
                : `${toUserCount} users`;
              const createdDate = new Date(recognition.created_at);
              const dateStr = format(createdDate, 'MMM dd');
              const timeStr = format(createdDate, 'h:mm a');

              return (
                <Card
                  key={recognition.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/mobile/recognitions/${recognition.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      {recognition.from_user?.avatar_url && (
                        <AvatarImage src={recognition.from_user.avatar_url} alt={fromName} />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {fromInitials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{fromName}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-muted-foreground">{toUsersDisplay}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center gap-2">
                          <span className="text-lg">{recognition.badge_emoji}</span>
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            {recognition.badge_name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-muted-foreground">
                        {dateStr} at {timeStr}
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Send Recognition Button */}
      <div className="sticky bottom-0 p-4 bg-background border-t border-border">
        <Button 
          onClick={() => navigate('/mobile/recognitions/send')}
          className="w-full h-14 text-base rounded-xl bg-blue-500 hover:bg-blue-600"
        >
          Send recognition
        </Button>
      </div>
    </div>
  );
};
