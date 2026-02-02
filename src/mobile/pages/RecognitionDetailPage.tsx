import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ThumbsUp, MessageSquare, Eye, Paperclip, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useTeamMember } from '@/hooks/useTeamMember';

export const RecognitionDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [comments, setComments] = useState<Array<{
    id: string;
    author: string;
    initials: string;
    text: string;
    timestamp: Date;
    attachment?: { name: string; url: string };
  }>>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    toast({
      description: isLiked ? "Like removed" : "Recognition liked!",
    });
  };

  const handleComment = () => {
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitComment = async () => {
    if (!comment.trim() && !selectedFile) return;

    let attachmentData = undefined;

    // Upload file if selected
    if (selectedFile) {
      try {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `recognition-attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-photos')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-photos')
          .getPublicUrl(filePath);

        attachmentData = {
          name: selectedFile.name,
          url: publicUrl
        };
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Upload failed",
          description: "Failed to upload attachment. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    const newComment = {
      id: Date.now().toString(),
      author: 'You',
      initials: 'YO',
      text: comment || 'Shared an attachment',
      timestamp: new Date(),
      attachment: attachmentData
    };
    
    setComments([newComment, ...comments]);
    setCommentCount(commentCount + 1);
    setComment('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast({
      description: "Comment posted successfully!",
    });
  };

  const { getDisplayName, getInitials } = useTeamMember();

  // Fetch recognition data
  const { data: recognition, isLoading } = useQuery({
    queryKey: ['recognition', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recognitions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      // Fetch team directory to get display names
      const { data: teamData } = await supabase
        .from('team_directory')
        .select('user_id, full_name, email');

      // Fetch profiles to get avatar URLs
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url');

      const teamMap = new Map(teamData?.map(t => [t.user_id, t]) || []);
      const profileMap = new Map(profilesData?.map(p => [p.id, p.avatar_url]) || []);
      
      const fromUser = teamMap.get(data.from_user_id);

      return {
        ...data,
        from_user: fromUser ? {
          full_name: fromUser.full_name,
          email: fromUser.email,
          avatar_url: profileMap.get(data.from_user_id)
        } : null,
        profiles: profileMap
      };
    },
    enabled: !!id,
  });

  if (isLoading || !recognition) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const fromName = recognition.from_user?.full_name || 'Unknown';
  const fromInitials = getInitials(fromName);
  const toUsers = recognition.to_user_ids.map(id => getDisplayName(id));
  const createdDate = new Date(recognition.created_at);
  const dateStr = format(createdDate, 'MMM dd, yyyy');
  const timeStr = format(createdDate, 'h:mm a');
  
  // Get recipient initials, colors, and avatars
  const recipients = recognition.to_user_ids.slice(0, 5).map((userId, index) => {
    const name = getDisplayName(userId);
    const initials = getInitials(name);
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];
    return {
      initials,
      color: colors[index % colors.length],
      avatar_url: recognition.profiles?.get(userId)
    };
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mobile/recognitions')}
            className="hover:bg-accent"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-semibold">{recognition.badge_emoji} {recognition.badge_name}</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-6">
        {/* Recognition Card */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-none shadow-lg">
          <div className="text-center space-y-4">
            <p className="text-base font-medium text-foreground">
              <span className="font-semibold">{fromName}</span> recognized{' '}
              {toUsers.length === 1 ? (
                <span className="font-semibold">{toUsers[0]}</span>
              ) : toUsers.length === 2 ? (
                <>
                  <span className="font-semibold">{toUsers[0]}</span> and{' '}
                  <span className="font-semibold">{toUsers[1]}</span>
                </>
              ) : (
                <>
                  <span className="font-semibold">{toUsers.slice(0, 2).join(', ')}</span> and{' '}
                  <span className="font-semibold">{toUsers.length - 2} {toUsers.length - 2 === 1 ? 'other' : 'others'}</span>
                </>
              )}
            </p>

            {/* Visual Display */}
            <div className="relative flex items-center justify-between px-4 py-8">
              {/* Left side - Giver */}
              <Avatar className="w-16 h-16 border-4 border-white dark:border-gray-800 shadow-lg flex-shrink-0">
                {recognition.from_user?.avatar_url && (
                  <AvatarImage src={recognition.from_user.avatar_url} alt={fromName} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                  {fromInitials}
                </AvatarFallback>
              </Avatar>

              {/* Center - Badge with Animation */}
              <div className="flex items-center justify-center flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center shadow-xl border-2 border-primary/20 animate-[pulse_2s_ease-in-out_infinite]">
                  <div className="text-4xl">
                    {recognition.badge_emoji}
                  </div>
                </div>
              </div>

              {/* Right side - Recipients */}
              <div className="flex flex-col items-end flex-shrink-0">
                {recipients.map((recipient, index) => (
                  <Avatar
                    key={index}
                    className={`w-12 h-12 border-3 border-white dark:border-gray-800 shadow-md ${
                      index > 0 ? '-mt-3' : ''
                    }`}
                  >
                    {recipient.avatar_url && (
                      <AvatarImage src={recipient.avatar_url} alt={recipient.initials} />
                    )}
                    <AvatarFallback className={`${recipient.color} text-white font-semibold text-sm`}>
                      {recipient.initials}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {recognition.to_user_ids.length > 5 && (
                  <Avatar className="w-12 h-12 border-3 border-white dark:border-gray-800 shadow-md -mt-3">
                    <AvatarFallback className="bg-gray-400 text-white font-semibold text-xs">
                      +{recognition.to_user_ids.length - 5}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">{recognition.badge_name}</h2>
            </div>
          </div>
        </Card>

        {/* Message */}
        {recognition.message && (
          <Card className="p-4 bg-card">
            <p className="text-base text-foreground leading-relaxed">{recognition.message}</p>
          </Card>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>{dateStr} at {timeStr}</span>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>Visible to team</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className={`flex-1 h-12 rounded-xl ${isLiked ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-500 text-blue-600 dark:text-blue-400' : ''}`}
            onClick={handleLike}
          >
            <ThumbsUp className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
            Like {likeCount > 0 && `(${likeCount})`}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 h-12 rounded-xl"
            onClick={handleComment}
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Comment
          </Button>
        </div>

        {/* Comments Section */}
        {comments.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Be the first to react
          </div>
        ) : (
          <>
            <div className="text-sm font-medium mb-3">
              {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
            </div>
            <div className="space-y-4">
              {comments.map((cmt) => (
                <div key={cmt.id} className="flex gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {cmt.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{cmt.author}</span>
                      <span className="text-xs text-muted-foreground">
                        {cmt.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm">{cmt.text}</p>
                    {cmt.attachment && (
                      <a
                        href={cmt.attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Paperclip className="w-4 h-4" />
                        {cmt.attachment.name}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Comment Input */}
      <div className="sticky bottom-0 p-4 bg-background border-t border-border">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {/* Selected File Preview */}
        {selectedFile && (
          <div className="mb-3 flex items-center gap-2 p-2 bg-accent rounded-lg">
            <Image className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleRemoveFile}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              YO
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <Input
              ref={commentInputRef}
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              className="pr-10 h-12 rounded-xl border-muted"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFileSelect}
              className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-accent"
            >
              <Paperclip className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
          {(comment || selectedFile) && (
            <Button 
              size="sm" 
              className="rounded-full px-4 bg-blue-500 hover:bg-blue-600"
              onClick={handleSubmitComment}
            >
              Send
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
