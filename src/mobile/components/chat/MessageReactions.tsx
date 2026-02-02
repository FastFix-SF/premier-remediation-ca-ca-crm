import React, { useState } from 'react';
import { Heart, ThumbsUp, Laugh, Angry, AlertCircle, Frown } from 'lucide-react';

interface MessageReactionsProps {
  messageId: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  onReact: (messageId: string, emoji: string) => void;
  showReactionPicker?: boolean;
  onToggleReactionPicker: () => void;
}

const REACTION_EMOJIS = [
  { emoji: '👍', icon: ThumbsUp, label: 'thumbs up' },
  { emoji: '❤️', icon: Heart, label: 'heart' },
  { emoji: '😂', icon: Laugh, label: 'laugh' },
  { emoji: '😮', icon: AlertCircle, label: 'surprised' },
  { emoji: '😢', icon: Frown, label: 'sad' },
  { emoji: '😡', icon: Angry, label: 'angry' },
];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions = [],
  onReact,
  showReactionPicker,
  onToggleReactionPicker,
}) => {
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);

  const handleReactionClick = (emoji: string) => {
    onReact(messageId, emoji);
    onToggleReactionPicker();
  };

  // Show existing reactions
  const existingReactions = reactions.filter(r => r.count > 0);

  return (
    <div className="relative">
      {/* Existing Reactions Display */}
      {existingReactions.length > 0 && (
        <div className="flex items-center space-x-1 mt-1">
          {existingReactions.map((reaction, index) => (
            <div
              key={`${reaction.emoji}-${index}`}
              className="flex items-center space-x-1 bg-muted/50 rounded-full px-2 py-1 text-xs cursor-pointer hover:bg-muted transition-colors"
              onClick={() => handleReactionClick(reaction.emoji)}
            >
              <span className="text-sm">{reaction.emoji}</span>
              <span className="text-muted-foreground">{reaction.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reaction Picker */}
      {showReactionPicker && (
        <div className="absolute top-0 right-0 transform -translate-y-full bg-background border border-border rounded-full shadow-lg p-2 flex items-center space-x-2 z-50 reaction-pop">
          {REACTION_EMOJIS.map((reaction) => (
            <button
              key={reaction.emoji}
              className="reaction-button hover:bg-accent/20 text-lg"
              onClick={() => handleReactionClick(reaction.emoji)}
              onMouseEnter={() => setHoveredReaction(reaction.emoji)}
              onMouseLeave={() => setHoveredReaction(null)}
              title={reaction.label}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
