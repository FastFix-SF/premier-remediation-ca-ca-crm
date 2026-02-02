import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const RECOGNITION_BADGES = [
  { emoji: '👍', name: 'Well Done' },
  { emoji: '👏', name: 'Great Work' },
  { emoji: '🌟', name: 'Outstanding' },
  { emoji: '🚀', name: 'Above & Beyond' },
  { emoji: '🕺', name: 'Great Leadership' },
  { emoji: '💪', name: 'Team Player' },
  { emoji: '🎯', name: 'Goal Crusher' },
  { emoji: '⚡', name: 'Quick Thinker' },
];

export const SendRecognitionPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: teamMembers = [] } = useTeamMembers();
  
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedBadge, setSelectedBadge] = useState(RECOGNITION_BADGES[0]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'Select recipients',
        description: 'Please select at least one team member to recognize',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.from('recognitions').insert({
        from_user_id: (await supabase.auth.getUser()).data.user?.id,
        to_user_ids: selectedUsers,
        badge_name: selectedBadge.name,
        badge_emoji: selectedBadge.emoji,
        message: message.trim() || null,
      } as any);

      if (error) throw error;

      toast({
        title: 'Recognition sent!',
        description: `Your recognition has been sent to ${selectedUsers.length} team member${selectedUsers.length > 1 ? 's' : ''}`,
      });
      
      navigate('/mobile/recognitions');
    } catch (error) {
      console.error('Error sending recognition:', error);
      toast({
        title: 'Error',
        description: 'Failed to send recognition. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

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
          <h1 className="text-lg font-semibold">Send Recognition</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-6 overflow-auto">
        {/* Badge Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Choose a badge</Label>
          <div className="grid grid-cols-4 gap-3">
            {RECOGNITION_BADGES.map((badge) => (
              <button
                key={badge.name}
                onClick={() => setSelectedBadge(badge)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  selectedBadge.name === badge.name
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-border hover:border-blue-500/50'
                }`}
              >
                <span className="text-3xl">{badge.emoji}</span>
                <span className="text-xs font-medium text-center leading-tight">
                  {badge.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recipient Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Select recipients ({selectedUsers.length})
          </Label>
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={member.user_id}
                  checked={selectedUsers.includes(member.user_id)}
                  onCheckedChange={() => handleUserToggle(member.user_id)}
                />
                <Label
                  htmlFor={member.user_id}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium">{member.full_name || member.email}</div>
                  <div className="text-sm text-muted-foreground">{member.role}</div>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <Label htmlFor="message" className="text-base font-semibold">
            Add a message (optional)
          </Label>
          <Textarea
            id="message"
            placeholder="Share why you're recognizing them..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
      </div>

      {/* Send Button */}
      <div className="sticky bottom-0 p-4 bg-background border-t border-border">
        <Button
          onClick={handleSend}
          disabled={isSending || selectedUsers.length === 0}
          className="w-full h-14 text-base rounded-xl bg-blue-500 hover:bg-blue-600"
        >
          {isSending ? 'Sending...' : 'Send Recognition'}
        </Button>
      </div>
    </div>
  );
};
