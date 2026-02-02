import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreVertical, MessageCircle, ThumbsUp, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUpdates } from '@/contexts/UpdatesContext';
import { useProfile } from '@/hooks/useProfile';
import { useTeamMember } from '@/hooks/useTeamMember';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Tab = 'active' | 'archived';

export const UpdatesPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { updates, deleteUpdate, markAllAsRead, likeUpdate, addComment, hasUserLiked, getComments, loading } = useUpdates();
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const { user } = useAuth();
  const { profile } = useProfile();
  const { getCurrentUserDisplayName } = useTeamMember();

  const userName = profile?.display_name || getCurrentUserDisplayName();
  const userAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'default'}`;

  React.useEffect(() => {
    // Mark all updates as read when viewing the page
    markAllAsRead();
  }, [markAllAsRead]);

  const handleDelete = async () => {
    if (selectedUpdateId) {
      try {
        await deleteUpdate(selectedUpdateId);
        toast.success('Update deleted successfully', { duration: 2000 });
        setDeleteDialogOpen(false);
        setSelectedUpdateId(null);
      } catch (error) {
        // Error already handled in context
      }
    }
  };

  const handleEdit = (updateId: string) => {
    navigate(`/mobile/updates/edit/${updateId}`);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) {
      toast.error('Please write a comment');
      return;
    }
    if (!user?.id) {
      toast.error('Please log in to comment');
      return;
    }
    if (selectedUpdateId) {
      try {
        await addComment(selectedUpdateId, {
          userId: user.id,
          userName: userName,
          userAvatar: userAvatar,
          text: commentText.trim()
        });
        toast.success('Comment added successfully', { duration: 2000 });
        setCommentDialogOpen(false);
        setCommentText('');
        setSelectedUpdateId(null);
      } catch (error) {
        // Error already handled in context
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mobile/admin')}
            className="text-primary"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-semibold">Updates</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mobile/updates/new')}
            className="text-primary"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 px-6 rounded-full text-base font-medium transition-all ${
              activeTab === 'active'
                ? 'bg-background text-foreground shadow-md border border-border'
                : 'bg-muted/30 text-muted-foreground'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 py-3 px-6 rounded-full text-base font-medium transition-all ${
              activeTab === 'archived'
                ? 'bg-background text-foreground shadow-md border border-border'
                : 'bg-muted/30 text-muted-foreground'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Updates List */}
      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-muted-foreground">Loading updates...</div>
          </div>
        ) : updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-lg font-medium mb-2">No updates yet</div>
            <div className="text-sm text-muted-foreground text-center">
              Be the first to share an update with your team!
            </div>
          </div>
        ) : updates.map((update) => (
          <div key={update.id} className="border-b border-border bg-background">
            {/* Author Info */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-base">{userName}</h3>
                  <p className="text-sm text-muted-foreground">{update.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full border-2 border-green-500 text-green-500 text-sm font-medium">
                  Published
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(update.id)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedUpdateId(update.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Update Title */}
            {update.title && (
              <div className="px-4 pb-2">
                <p className="text-base font-medium">{update.title}</p>
              </div>
            )}

            {/* Update Content Card */}
            <div 
              className="mx-0 mb-4 p-8 flex items-center justify-center min-h-[200px]"
              style={{ backgroundColor: update.backgroundColor }}
            >
              <p className="text-center text-xl font-bold text-gray-900 leading-relaxed">
                {update.content}
              </p>
            </div>

            {/* Comments Section */}
            {update.comments && update.comments.length > 0 && (
              <div className="px-4 pb-4">
                <h4 className="text-sm font-semibold mb-3">Comments</h4>
                <div className="space-y-3">
                  {update.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                        <AvatarFallback>{comment.userName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{comment.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-1">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-around px-4 pb-4">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center mb-1">
                  <span className="text-sm font-bold text-foreground">{update.stats.viewedPercentage}%</span>
                </div>
                <span className="text-xs text-muted-foreground">Viewed</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center mb-1">
                  <span className="text-sm font-bold text-foreground">{update.stats.notViewedPercentage}%</span>
                </div>
                <span className="text-xs text-muted-foreground">Haven't viewed</span>
              </div>
              <button 
                onClick={() => {
                  setSelectedUpdateId(update.id);
                  setCommentDialogOpen(true);
                }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-1 hover:bg-muted/50 transition-colors">
                  <MessageCircle className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-xs text-muted-foreground">{update.stats.comments}</span>
              </button>
              <button 
                onClick={async () => {
                  if (!user?.id) {
                    toast.error('Please log in to like updates');
                    return;
                  }
                  try {
                    const alreadyLiked = hasUserLiked(update.id, user.id);
                    await likeUpdate(update.id, user.id);
                    toast.success(alreadyLiked ? 'Like removed' : 'Liked!', { duration: 2000 });
                  } catch (error) {
                    // Error already handled in context
                  }
                }}
                className="flex flex-col items-center"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-1 hover:bg-muted/50 transition-colors ${
                  user?.id && hasUserLiked(update.id, user.id) ? 'bg-blue-500/20' : 'bg-muted/30'
                }`}>
                  <ThumbsUp className={`w-6 h-6 ${
                    user?.id && hasUserLiked(update.id, user.id) ? 'text-blue-500 fill-blue-500' : 'text-blue-500'
                  }`} />
                </div>
                <span className="text-xs text-muted-foreground">{update.stats.likes}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Button */}
      <div className="fixed bottom-6 left-4 right-4 z-20">
        <Button
          onClick={() => navigate('/mobile/updates/new')}
          className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-base font-semibold shadow-lg"
        >
          + Create new update
        </Button>
      </div>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Write a Comment</DialogTitle>
            <DialogDescription>
              Share your thoughts about this update.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Type your comment here..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCommentDialogOpen(false);
              setCommentText('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleCommentSubmit}>
              Post Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this update? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
