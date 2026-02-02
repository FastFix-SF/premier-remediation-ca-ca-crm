import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AGENTS } from '@/mobile/config/agents';
import { CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentMessageBubbleProps {
  agentType: string;
  content: React.ReactNode;
  confidence?: number;
  isOnline?: boolean;
  timestamp?: string;
}

export const AgentMessageBubble: React.FC<AgentMessageBubbleProps> = ({
  agentType,
  content,
  confidence = 95,
  isOnline = true,
  timestamp
}) => {
  const agent = AGENTS[agentType] || AGENTS.operations;
  const displayTime = timestamp || new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-4 space-y-3">
      {/* Agent Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Agent Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-11 h-11 border-2 border-border">
              <AvatarFallback 
                className="text-lg font-medium"
                style={{ backgroundColor: `${agent.color}15`, color: agent.color }}
              >
                {agent.icon}
              </AvatarFallback>
            </Avatar>
            {/* Online Status Indicator */}
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-card" />
            )}
          </div>

          {/* Agent Info */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{agent.name}</span>
            {isOnline && (
              <Badge 
                variant="outline" 
                className="w-fit h-5 px-2 text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              >
                <span className="mr-1">●</span> Online
              </Badge>
            )}
          </div>
        </div>

        {/* Right side: Time & Confidence */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-muted-foreground">{displayTime}</span>
          {confidence && (
            <div className="flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-500">{confidence}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="text-sm leading-relaxed text-foreground">
        {content}
      </div>
    </div>
  );
};
