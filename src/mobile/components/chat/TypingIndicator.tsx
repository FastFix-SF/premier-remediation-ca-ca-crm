import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TypingIndicatorProps {
  typingUsers: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex space-x-3 animate-fade-in p-4">
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-medium">
          {getInitials(typingUsers[0])}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="bg-muted/50 backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-border/50 w-fit">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {typingUsers.length === 1 
            ? `${typingUsers[0]} is typing...`
            : typingUsers.length === 2
            ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
            : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`
          }
        </p>
      </div>
    </div>
  );
};