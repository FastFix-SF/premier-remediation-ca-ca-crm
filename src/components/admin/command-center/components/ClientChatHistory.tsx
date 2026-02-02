import React from 'react';
import { format } from 'date-fns';
import { Bot, User, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatMessage {
  id: string;
  sender_type: 'bot' | 'client' | 'team';
  message: string;
  created_at: string;
  deep_link_url?: string | null;
}

interface ClientChatHistoryProps {
  messages: ChatMessage[];
  clientName: string;
}

export function ClientChatHistory({ messages, clientName }: ClientChatHistoryProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Bot className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">No chatbot conversations yet</p>
        <p className="text-xs mt-1">Start a chatbot session to begin communication</p>
      </div>
    );
  }

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'bot':
        return <Bot className="w-4 h-4" />;
      case 'client':
        return <User className="w-4 h-4" />;
      case 'team':
        return <Users className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getSenderLabel = (senderType: string) => {
    switch (senderType) {
      case 'bot':
        return 'FASTO Bot';
      case 'client':
        return clientName;
      case 'team':
        return 'Team';
      default:
        return 'Unknown';
    }
  };

  const getSenderStyles = (senderType: string) => {
    switch (senderType) {
      case 'bot':
        return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100';
      case 'client':
        return 'bg-green-500/10 border-green-500/20 text-green-100';
      case 'team':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-100';
      default:
        return 'bg-muted border-border';
    }
  };

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 p-1">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg border ${getSenderStyles(message.sender_type)}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background/50">
                {getSenderIcon(message.sender_type)}
              </div>
              <span className="text-xs font-medium">
                {getSenderLabel(message.sender_type)}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {format(new Date(message.created_at), 'MMM d, h:mm a')}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
            {message.deep_link_url && (
              <a
                href={message.deep_link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-2 block"
              >
                View Link →
              </a>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
