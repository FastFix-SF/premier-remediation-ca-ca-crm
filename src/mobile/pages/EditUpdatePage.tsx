import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useUpdates } from '@/contexts/UpdatesContext';
import { useProfile } from '@/hooks/useProfile';
import { useTeamMember } from '@/hooks/useTeamMember';
import { useAuth } from '@/contexts/AuthContext';

const backgroundColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9',
  '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E', '#E17055', '#74B9FF'
];

export const EditUpdatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { updates, updateUpdate } = useUpdates();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { getCurrentUserDisplayName } = useTeamMember();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  
  const userName = profile?.display_name || getCurrentUserDisplayName();
  const userAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'default'}`;

  useEffect(() => {
    const update = updates.find(u => u.id === id);
    if (update) {
      setTitle(update.title || '');
      setContent(update.content || '');
      setSelectedColor(update.backgroundColor || '');
    } else {
      toast.error('Update not found');
      navigate('/mobile/updates');
    }
  }, [id, updates, navigate]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Please write your update');
      return;
    }

    if (id) {
      try {
        await updateUpdate(id, {
          title: title.trim(),
          content: content.trim(),
          backgroundColor: selectedColor || '#DFE6E9',
        });

        toast.success('Update saved successfully!', { duration: 2000 });
        navigate('/mobile/updates');
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
            onClick={() => navigate('/mobile/updates')}
            className="text-primary"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-semibold">Edit Update</h1>
          <Button
            variant="ghost"
            className="text-blue-400 hover:text-blue-500 font-medium"
            onClick={handleSave}
          >
            Save
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Author Info */}
        <div className="flex items-center gap-3 px-4 py-6 border-b border-border">
          <Avatar className="w-12 h-12">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-base">{userName}</span>
        </div>

        {/* Title Input */}
        <div className="px-4 py-4 border-b border-border">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="border-none bg-transparent px-0 text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* Content Textarea */}
        <div 
          className="px-4 py-4 transition-colors duration-300"
          style={{ backgroundColor: selectedColor || 'transparent' }}
        >
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your update..."
            className="border-none bg-transparent px-0 text-base min-h-[120px] placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
          />
        </div>

        {/* Color Picker */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button 
              onClick={() => setSelectedColor('')}
              className="w-12 h-12 rounded-full border-2 border-muted flex-shrink-0"
            />
            {backgroundColors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className="w-12 h-12 rounded-lg flex-shrink-0 transition-transform hover:scale-110"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
