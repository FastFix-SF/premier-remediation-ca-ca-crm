import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronRight, MessageSquare, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgentConversations, useAgentConversationMessages } from '@/mobile/hooks/useAgentConversations';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface FastoConversationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation: (messages: Array<{ role: 'user' | 'assistant'; content: string }>) => void;
}

export function FastoConversationHistory({ isOpen, onClose, onLoadConversation }: FastoConversationHistoryProps) {
  const { conversations, deleteConversation } = useAgentConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  const fastoConversations = (conversations || []).filter(
    conv => conv.category === 'fasto_voice'
  );

  const { messages } = useAgentConversationMessages(selectedConversationId || '');

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleLoadMessages = () => {
    if (messages && messages.length > 0) {
      const msgs = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));
      onLoadConversation(msgs);
      onClose();
    }
  };

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await deleteConversation.mutateAsync(conversationId);
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-xl z-50"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Conversation History</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Conversation List */}
                <ScrollArea className={cn(
                  "border-r border-border transition-all",
                  selectedConversationId ? "w-1/2" : "w-full"
                )}>
                  <div className="p-2 space-y-1">
                    {fastoConversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">No conversations yet</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">
                          Start talking to Fasto to see history here
                        </p>
                      </div>
                    ) : (
                      fastoConversations.map((conv) => (
                        <motion.button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className={cn(
                            "w-full p-3 rounded-lg text-left transition-colors group",
                            selectedConversationId === conv.id
                              ? "bg-primary/10 border border-primary/20"
                              : "hover:bg-muted"
                          )}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {conv.title || 'Voice Session'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {conv.last_message || 'No messages'}
                              </p>
                              <p className="text-xs text-muted-foreground/60 mt-1">
                                {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {conv.message_count || 0}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={(e) => handleDelete(e, conv.id)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Message Preview */}
                <AnimatePresence>
                  {selectedConversationId && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: '50%' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex flex-col"
                    >
                      <ScrollArea className="flex-1 p-3">
                        <div className="space-y-2">
                          {messages?.map((msg, i) => (
                            <div
                              key={i}
                              className={cn(
                                "p-2 rounded-lg text-xs",
                                msg.role === 'user'
                                  ? "bg-primary/10 ml-4"
                                  : "bg-muted mr-4"
                              )}
                            >
                              <p className="font-medium text-[10px] text-muted-foreground mb-0.5">
                                {msg.role === 'user' ? 'You' : 'Fasto'}
                              </p>
                              <p className="line-clamp-3">{msg.content}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="p-3 border-t border-border">
                        <Button 
                          onClick={handleLoadMessages}
                          className="w-full"
                          disabled={!messages?.length}
                        >
                          Continue this conversation
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}