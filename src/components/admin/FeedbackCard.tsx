import React from 'react';
import { format } from 'date-fns';
import { MessageSquare, MapPin, Calendar, Sparkles, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FeedbackItem {
  id: string;
  user_id: string | null;
  feedback_text: string;
  selected_element: any;
  admin_notes: string | null;
  is_read: boolean | null;
  created_at: string | null;
  ai_suggestion: any;
  ai_analyzed_at: string | null;
  suggestion_status: 'pending' | 'analyzing' | 'completed' | 'failed';
  screenshot_url: string | null;
  status?: 'new' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'fixed' | 'deleted';
  category?: 'bug' | 'feature_request' | 'question' | 'improvement' | 'uncategorized';
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

const getStatusConfig = (status?: string) => {
  switch (status) {
    case 'approved': return { label: 'Approved', variant: 'default' as const, className: 'bg-green-500/10 text-green-600 border-green-500/20' };
    case 'rejected': return { label: 'Rejected', variant: 'destructive' as const, className: '' };
    case 'in_progress': return { label: 'In Progress', variant: 'secondary' as const, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    case 'fixed': return { label: 'Fixed', variant: 'default' as const, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    case 'under_review': return { label: 'Under Review', variant: 'secondary' as const, className: '' };
    case 'deleted': return { label: 'Deleted', variant: 'destructive' as const, className: 'bg-red-500/10 text-red-600 border-red-500/20' };
    default: return { label: 'New', variant: 'secondary' as const, className: '' };
  }
};

interface FeedbackCardProps {
  feedback: FeedbackItem;
  onClick: () => void;
  onDelete?: (id: string) => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ feedback, onClick, onDelete }) => {
  const getPageRoute = () => {
    try {
      const parsed = JSON.parse(feedback.selected_element as string);
      return parsed.pageRoute || null;
    } catch {
      return null;
    }
  };

  const pageRoute = getPageRoute();
  const truncatedText = feedback.feedback_text.length > 80 
    ? feedback.feedback_text.substring(0, 80) + '...' 
    : feedback.feedback_text;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-500 overflow-hidden border border-border hover:scale-[1.02] hover:-translate-y-1 cursor-pointer h-full flex flex-col"
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-muted to-muted/50 overflow-hidden rounded-t-2xl">
        {feedback.screenshot_url ? (
          <img
            src={feedback.screenshot_url}
            alt="Feedback screenshot"
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-8 h-8 text-primary/60" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No Screenshot</p>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        {(() => {
          const statusConfig = getStatusConfig(feedback.status);
          return (
            <div className="absolute top-4 left-4">
              <Badge variant={statusConfig.variant} className={`shadow-lg ${statusConfig.className}`}>
                {statusConfig.label}
              </Badge>
            </div>
          );
        })()}
        
        {/* Priority Badge */}
        {(feedback.priority || (feedback.ai_suggestion && feedback.suggestion_status === 'completed')) && (
          <div className="absolute top-4 right-4">
            <Badge variant={getPriorityColor(feedback.priority || feedback.ai_suggestion?.priority)} className="shadow-lg">
              {feedback.priority || feedback.ai_suggestion?.priority}
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-5 space-y-3">
        {/* Category Badge */}
        {(feedback.category && feedback.category !== 'uncategorized') ? (
          <div className="inline-flex items-center self-start px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            {feedback.category === 'bug' ? '🐛 Bug' : 
             feedback.category === 'feature_request' ? '✨ Feature' : 
             feedback.category === 'question' ? '❓ Question' : 
             feedback.category === 'improvement' ? '📈 Improvement' : 
             feedback.category}
          </div>
        ) : feedback.ai_suggestion?.category && (
          <div className="inline-flex items-center self-start px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            {feedback.ai_suggestion.category}
          </div>
        )}

        {/* Feedback Text */}
        <h3 className="font-semibold text-foreground leading-tight line-clamp-2 text-base">
          {truncatedText}
        </h3>

        {/* Route Info */}
        {pageRoute && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <code className="text-xs truncate bg-muted px-1.5 py-0.5 rounded">{pageRoute}</code>
          </div>
        )}

        {/* Date */}
        {feedback.created_at && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="text-sm">{format(new Date(feedback.created_at), 'MMM d, yyyy')}</span>
          </div>
        )}

        {/* AI Status */}
        {feedback.suggestion_status === 'completed' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
            <span className="text-sm">AI Analyzed</span>
          </div>
        )}

        {feedback.suggestion_status === 'analyzing' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-4 h-4 shrink-0 animate-pulse text-amber-500" />
            <span className="text-sm">Analyzing...</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto pt-2 flex gap-2">
          <div className="flex-1 inline-flex items-center justify-center bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            View Details
          </div>

          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Feedback?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move the feedback to deleted items. You can view deleted feedback from the filter dropdown.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(feedback.id);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
};
