import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Check, Eye, Sparkles, AlertCircle, FileCode, MapPin, ExternalLink, Image as ImageIcon, Copy, CheckCircle2, Wand2, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FeedbackCard } from './FeedbackCard';
import { useTeamMember } from '@/hooks/useTeamMember';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { FeedbackFixQueue } from './FeedbackFixQueue';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { useFeedbackAutoFix } from '@/hooks/useFeedbackAutoFix';

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
  status: 'new' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'fixed' | 'deleted';
  category: 'bug' | 'feature_request' | 'question' | 'improvement' | 'uncategorized';
  priority: 'critical' | 'high' | 'medium' | 'low';
  fix_description: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  fix_status: string | null;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'default' },
  { value: 'under_review', label: 'Under Review', color: 'secondary' },
  { value: 'approved', label: 'Approved', color: 'default' },
  { value: 'rejected', label: 'Rejected', color: 'destructive' },
  { value: 'in_progress', label: 'In Progress', color: 'secondary' },
  { value: 'fixed', label: 'Fixed', color: 'default' },
  { value: 'deleted', label: 'Deleted', color: 'destructive' },
] as const;

const CATEGORY_OPTIONS = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'question', label: 'Question' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'uncategorized', label: 'Uncategorized' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'destructive' },
  { value: 'high', label: 'High', color: 'default' },
  { value: 'medium', label: 'Medium', color: 'secondary' },
  { value: 'low', label: 'Low', color: 'outline' },
] as const;

export const FeedbackManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getDisplayName } = useTeamMember();
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  
  // Auto-fix hook for notifications
  const { requestNotificationPermission } = useFeedbackAutoFix();
  
  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const { data: feedbackList, isLoading } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FeedbackItem[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      const { error } = await supabase
        .from('admin_feedback')
        .update({ is_read: true })
        .eq('id', feedbackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      toast({
        title: "Success",
        description: "Feedback marked as read",
      });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from('admin_feedback')
        .update({ admin_notes: notes })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      toast({
        title: "Success",
        description: "Admin notes saved",
      });
      setIsEditing(false);
    },
  });

  const generateAISuggestionMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-feedback', {
        body: { feedbackId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      toast({
        title: "AI Analysis Complete",
        description: "Fix suggestions have been generated",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to generate suggestions",
        variant: "destructive",
      });
    },
  });

  // Triage mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('admin_feedback')
        .update({ 
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      toast({ title: "Status Updated" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: string }) => {
      const { error } = await supabase
        .from('admin_feedback')
        .update({ category } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      toast({ title: "Category Updated" });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
      const { error } = await supabase
        .from('admin_feedback')
        .update({ priority } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      toast({ title: "Priority Updated" });
    },
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_feedback')
        .update({ status: 'deleted' } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      toast({ title: "Feedback Deleted", description: "The feedback item has been moved to deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete feedback", variant: "destructive" });
    },
  });

  const handleSaveNotes = () => {
    if (selectedFeedback) {
      updateNotesMutation.mutate({ id: selectedFeedback.id, notes: adminNotes });
    }
  };

  const handleGenerateSuggestion = (feedbackId: string) => {
    generateAISuggestionMutation.mutate(feedbackId);
  };

  const handleCardClick = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    setAdminNotes(feedback.admin_notes || '');
    setIsEditing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPageRoute = (element: any) => {
    try {
      const parsed = JSON.parse(element as string);
      return parsed.pageRoute || null;
    } catch {
      return null;
    }
  };

  const unreadCount = feedbackList?.filter(f => !f.is_read && f.status !== 'deleted').length || 0;
  
  // Get unique user IDs for the filter dropdown
  const uniqueUsers = React.useMemo(() => {
    if (!feedbackList) return [];
    const userIds = [...new Set(feedbackList.map(f => f.user_id).filter(Boolean))];
    return userIds as string[];
  }, [feedbackList]);

  // Filter feedback by selected user and deleted status
  const filteredFeedback = React.useMemo(() => {
    if (!feedbackList) return [];
    
    let filtered = feedbackList;
    
    // Filter by deleted status
    if (showDeleted) {
      filtered = filtered.filter(f => f.status === 'deleted');
    } else {
      filtered = filtered.filter(f => f.status !== 'deleted');
    }
    
    // Filter by user
    if (userFilter !== 'all') {
      filtered = filtered.filter(f => f.user_id === userFilter);
    }
    
    return filtered;
  }, [feedbackList, userFilter, showDeleted]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-component="FeedbackManager" data-file="src/components/admin/FeedbackManager.tsx">
      {/* Header with Fix Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-bold">User Feedback</h2>
              <p className="text-muted-foreground">Review and respond to user feedback submissions</p>
            </div>
            <div className="flex items-center gap-3">
              {/* User Filter */}
              <Select value={showDeleted ? '__deleted__' : userFilter} onValueChange={(value) => {
                if (value === '__deleted__') {
                  setShowDeleted(true);
                  setUserFilter('all');
                } else {
                  setShowDeleted(false);
                  setUserFilter(value);
                }
              }}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="__deleted__">Deleted Feedback</SelectItem>
                  {uniqueUsers.map((userId) => (
                    <SelectItem key={userId} value={userId}>
                      {getDisplayName(userId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  {unreadCount} New
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Fix Queue Panel */}
        <div className="lg:col-span-1">
          <FeedbackFixQueue 
            onSelectFeedback={(id) => {
              const feedback = feedbackList?.find(f => f.id === id);
              if (feedback) handleCardClick(feedback);
            }}
          />
        </div>
      </div>

      {/* Card Grid */}
      {filteredFeedback.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {userFilter !== 'all' ? 'No feedback from this user' : 'No feedback submissions yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeedback.map((feedback) => (
            <FeedbackCard
              key={feedback.id}
              feedback={feedback}
              onClick={() => handleCardClick(feedback)}
              onDelete={(id) => deleteFeedbackMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedFeedback && (
            <>
              <SheetHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Feedback Details
                  </SheetTitle>
                  <div className="flex items-center gap-2">
                    {!selectedFeedback.is_read && (
                      <Badge variant="secondary">New</Badge>
                    )}
                  </div>
                </div>
                {selectedFeedback.created_at && (
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedFeedback.created_at), 'PPpp')}
                  </p>
                )}
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Triage Controls */}
                <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
                  <h4 className="font-medium text-sm">Triage</h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {/* Status */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Status</label>
                      <Select
                        value={selectedFeedback.status || 'new'}
                        onValueChange={(value) => updateStatusMutation.mutate({ id: selectedFeedback.id, status: value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Category</label>
                      <Select
                        value={selectedFeedback.category || 'uncategorized'}
                        onValueChange={(value) => updateCategoryMutation.mutate({ id: selectedFeedback.id, category: value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Priority */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Priority</label>
                      <Select
                        value={selectedFeedback.priority || 'medium'}
                        onValueChange={(value) => updatePriorityMutation.mutate({ id: selectedFeedback.id, priority: value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant={selectedFeedback.status === 'approved' ? 'default' : 'outline'}
                      onClick={() => updateStatusMutation.mutate({ id: selectedFeedback.id, status: 'approved' })}
                      className="flex-1"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedFeedback.status === 'rejected' ? 'destructive' : 'outline'}
                      onClick={() => updateStatusMutation.mutate({ id: selectedFeedback.id, status: 'rejected' })}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                {/* Copy for AI Fix Button */}
                {selectedFeedback.status === 'approved' && selectedFeedback.category === 'bug' && (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      const fixDescription = `## Bug Report from User Feedback

**User Feedback:** ${selectedFeedback.feedback_text}

**Priority:** ${selectedFeedback.priority || 'medium'}

**Page/Location:** ${getPageRoute(selectedFeedback.selected_element) || 'Unknown'}

${selectedFeedback.ai_suggestion ? `**AI Analysis:**
- Category: ${selectedFeedback.ai_suggestion.category || 'N/A'}
- Diagnosis: ${selectedFeedback.ai_suggestion.diagnosis || 'N/A'}
- Suggested Fix: ${selectedFeedback.ai_suggestion.suggestedFix || 'N/A'}
- Likely Files: ${selectedFeedback.ai_suggestion.likelyFiles?.join(', ') || 'N/A'}` : ''}

Please fix this issue.`;
                      navigator.clipboard.writeText(fixDescription);
                      setCopiedToClipboard(true);
                      setTimeout(() => setCopiedToClipboard(false), 2000);
                      toast({ title: "Copied!", description: "Paste this to AI to fix the bug" });
                    }}
                  >
                    {copiedToClipboard ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copiedToClipboard ? 'Copied!' : 'Copy Bug Report for AI'}
                  </Button>
                )}

                {/* Actions */}
                {!selectedFeedback.is_read && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsReadMutation.mutate(selectedFeedback.id)}
                    disabled={markAsReadMutation.isPending}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Mark as Read
                  </Button>
                )}

                {/* Submitted By */}
                {selectedFeedback.user_id && (
                  <div>
                    <h4 className="font-medium mb-2">Submitted By:</h4>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {getDisplayName(selectedFeedback.user_id, 'Unknown User')}
                    </p>
                  </div>
                )}

                {/* User Feedback */}
                <div>
                  <h4 className="font-medium mb-2">User Feedback:</h4>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedFeedback.feedback_text}</p>
                </div>

                {/* Quick Action: Go to Location */}
                {selectedFeedback.selected_element && (() => {
                  const pageRoute = getPageRoute(selectedFeedback.selected_element);
                  if (pageRoute) {
                    return (
                      <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Reported on: <code className="bg-background px-1.5 py-0.5 rounded text-xs">{pageRoute}</code></p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            navigate(pageRoute);
                            setSelectedFeedback(null);
                          }}
                          className="gap-1.5 flex-shrink-0"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Go
                        </Button>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Element Details */}
                {selectedFeedback.selected_element && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Element Details:
                    </h4>
                    <div className="text-sm bg-muted p-3 rounded-md space-y-2">
                      {(() => {
                        try {
                          const parsed = JSON.parse(selectedFeedback.selected_element as string);
                          return (
                            <>
                              {parsed.text && (
                                <p className="truncate">
                                  <span className="font-medium">Text:</span> "{parsed.text}"
                                </p>
                              )}
                              {parsed.component && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Component:</span> {parsed.component}
                                </p>
                              )}
                              {parsed.position && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Position:</span> x:{Math.round(parsed.position.x)}, y:{Math.round(parsed.position.y)}, {Math.round(parsed.position.width)}×{Math.round(parsed.position.height)}px
                                </p>
                              )}
                            </>
                          );
                        } catch {
                          return <p className="text-muted-foreground">Unable to parse element data</p>;
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Screenshot Section */}
                {selectedFeedback.screenshot_url ? (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Screenshot:
                    </h4>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="block border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all cursor-pointer w-full">
                          <img 
                            src={selectedFeedback.screenshot_url} 
                            alt="Feedback screenshot" 
                            className="w-full h-auto object-cover"
                          />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-2">
                        <img 
                          src={selectedFeedback.screenshot_url} 
                          alt="Feedback screenshot full size" 
                          className="w-full h-auto"
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    No screenshot available
                  </div>
                )}

                {/* AI Suggestion Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI Fix Suggestion
                    </h4>
                    {!selectedFeedback.ai_suggestion && selectedFeedback.suggestion_status !== 'analyzing' && (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateSuggestion(selectedFeedback.id)}
                        disabled={generateAISuggestionMutation.isPending}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                    )}
                  </div>

                  {selectedFeedback.suggestion_status === 'analyzing' && (
                    <Alert>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <AlertDescription>
                        AI is analyzing this feedback...
                      </AlertDescription>
                    </Alert>
                  )}

                  {selectedFeedback.suggestion_status === 'failed' && (
                    <Alert variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        AI analysis failed. Please try again.
                      </AlertDescription>
                    </Alert>
                  )}

                  {selectedFeedback.ai_suggestion && selectedFeedback.suggestion_status === 'completed' && (
                    <div className="space-y-3 bg-muted/50 p-4 rounded-md border">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getPriorityColor(selectedFeedback.ai_suggestion.priority)}>
                          {selectedFeedback.ai_suggestion.priority} priority
                        </Badge>
                        <Badge variant="outline">
                          {selectedFeedback.ai_suggestion.category}
                        </Badge>
                        {selectedFeedback.ai_analyzed_at && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            Analyzed {format(new Date(selectedFeedback.ai_analyzed_at), 'PPp')}
                          </span>
                        )}
                      </div>

                      {selectedFeedback.ai_suggestion.likelyFiles?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                            <FileCode className="w-3 h-3" />
                            Likely Files:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selectedFeedback.ai_suggestion.likelyFiles.map((file: string, idx: number) => (
                              <code key={idx} className="text-xs bg-background px-2 py-1 rounded border">
                                {file}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium mb-1">Diagnosis:</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedFeedback.ai_suggestion.diagnosis}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">Suggested Fix:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedFeedback.ai_suggestion.suggestedFix}
                        </p>
                      </div>

                      {selectedFeedback.ai_suggestion.implementation && (
                        <div>
                          <p className="text-sm font-medium mb-1">Implementation Steps:</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {selectedFeedback.ai_suggestion.implementation}
                          </p>
                        </div>
                      )}

                      {/* Fix This Issue Button */}
                      <Button
                        className="w-full mt-4 gap-2"
                        onClick={() => {
                          const ai = selectedFeedback.ai_suggestion;
                          const pageRoute = getPageRoute(selectedFeedback.selected_element);
                          
                          const fixPrompt = `## Fix Request from User Feedback

**Original Feedback:** "${selectedFeedback.feedback_text}"

**Priority:** ${ai?.priority || selectedFeedback.priority || 'medium'}
**Category:** ${ai?.category || selectedFeedback.category || 'general'}
${pageRoute ? `**Page:** ${pageRoute}` : ''}

### Files to Check:
${ai?.likelyFiles?.length > 0 ? ai.likelyFiles.map((f: string) => `- ${f}`).join('\n') : 'None identified'}

### Diagnosis:
${ai?.diagnosis || 'No diagnosis available'}

### Suggested Fix:
${ai?.suggestedFix || 'No fix suggested'}

### Implementation Steps:
${ai?.implementation || 'No steps provided'}

Please implement this fix based on the above analysis.`;

                          navigator.clipboard.writeText(fixPrompt);
                          setCopiedToClipboard(true);
                          setTimeout(() => setCopiedToClipboard(false), 2000);
                          
                          // Update status to in_progress
                          updateStatusMutation.mutate({ id: selectedFeedback.id, status: 'in_progress' });
                          
                          toast({ 
                            title: "Copied to clipboard!", 
                            description: "Paste into Lovable chat to start the fix" 
                          });
                        }}
                      >
                        {copiedToClipboard ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied! Paste in Lovable
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            Fix This Issue
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Diagnostics Panel - Show when fix is in progress or reviewing */}
                {selectedFeedback.fix_status && 
                 ['fix_in_progress', 'fix_reviewing'].includes(selectedFeedback.fix_status) && (
                  <DiagnosticsPanel 
                    feedbackId={selectedFeedback.id}
                    onVerified={() => {
                      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
                      setSelectedFeedback(null);
                    }}
                  />
                )}

                {/* Admin Notes */}
                <div>
                  <h4 className="font-medium mb-2">Admin Notes:</h4>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add your notes here..."
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={updateNotesMutation.isPending || !adminNotes.trim()}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Save Notes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setAdminNotes(selectedFeedback.admin_notes || '');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {selectedFeedback.admin_notes ? (
                        <div className="space-y-2">
                          <p className="text-sm bg-muted p-3 rounded-md">{selectedFeedback.admin_notes}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                          >
                            Edit Notes
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          Add Notes
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
