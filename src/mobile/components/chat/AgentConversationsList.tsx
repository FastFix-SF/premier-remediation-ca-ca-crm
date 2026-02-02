import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { useAgentConversations, AgentConversation } from '@/mobile/hooks/useAgentConversations';
import { AgentCategory } from '@/mobile/components/agent-hub/AgentHubDialog';
import { cn } from '@/lib/utils';

import agentProjectManagement from '@/assets/agent-project-management.jpg';
import agentFinancials from '@/assets/agent-financials.jpg';
import agentPeople from '@/assets/agent-people.jpg';
import agentDocuments from '@/assets/agent-documents.jpg';
import agentSettingsSupport from '@/assets/agent-settings-support.jpg';

const categoryImages: Record<string, string> = {
  'project-management': agentProjectManagement,
  'financials': agentFinancials,
  'people': agentPeople,
  'documents': agentDocuments,
  'settings-support': agentSettingsSupport,
};

const categoryLabels: Record<string, string> = {
  'project-management': 'Project Management',
  'financials': 'Financials',
  'people': 'People',
  'documents': 'Documents',
  'settings-support': 'Settings & Support',
};

interface AgentConversationsListProps {
  searchQuery?: string;
  onSelectConversation: (conversation: AgentConversation) => void;
}

export const AgentConversationsList: React.FC<AgentConversationsListProps> = ({
  searchQuery = '',
  onSelectConversation,
}) => {
  const { conversations, isLoading, deleteConversation } = useAgentConversations();

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.title?.toLowerCase().includes(query) ||
      conv.last_message?.toLowerCase().includes(query) ||
      categoryLabels[conv.category]?.toLowerCase().includes(query)
    );
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      deleteConversation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
              <div className="w-14 h-14 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">🤖</span>
        </div>
        <p className="text-muted-foreground text-sm">
          {searchQuery ? 'No conversations found' : 'No agent conversations yet'}
        </p>
        <p className="text-muted-foreground/70 text-xs mt-1">
          Start a new conversation with an agent
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {filteredConversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors text-left group"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
              <img 
                src={categoryImages[conversation.category] || agentProjectManagement} 
                alt={categoryLabels[conversation.category] || 'Agent'} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-card" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-semibold text-foreground truncate">
                {categoryLabels[conversation.category] || 'Agent'}
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground truncate">
              {conversation.last_message || 'Start chatting...'}
            </p>
            
            <div className="flex items-center gap-2 mt-1.5">
              <Badge 
                variant="outline" 
                className="h-5 px-2 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              >
                <span className="mr-1">●</span> Online
              </Badge>
              {conversation.message_count > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {conversation.message_count} messages
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => handleDelete(e, conversation.id)}
            className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </button>
      ))}
    </div>
  );
};
