import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X,
  CheckSquare,
  MessageCircle,
  Lightbulb,
  Clock,
  Plus,
  Loader2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface ExtractedItem {
  type: 'task' | 'feedback' | 'idea' | 'follow_up';
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  sentiment?: 'positive' | 'negative' | 'neutral';
  assignee_hint?: string;
}

interface InCallItemsPanelProps {
  items: ExtractedItem[];
  transcript: string;
  isTranscribing: boolean;
  onClose: () => void;
}

export const InCallItemsPanel: React.FC<InCallItemsPanelProps> = ({
  items,
  transcript,
  isTranscribing,
  onClose,
}) => {
  const [showTranscript, setShowTranscript] = useState(false);

  const tasks = items.filter((i) => i.type === 'task');
  const feedback = items.filter((i) => i.type === 'feedback');
  const ideas = items.filter((i) => i.type === 'idea');
  const followUps = items.filter((i) => i.type === 'follow_up');

  const handleAddTask = (item: ExtractedItem) => {
    // TODO: Integrate with task creation
    toast.success(`Task "${item.title}" added to your list`);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-300';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'low':
        return 'bg-green-500/20 text-green-300';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500/20 text-green-300';
      case 'negative':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  const ItemCard = ({ item }: { item: ExtractedItem }) => (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm">{item.title}</p>
          {item.description && (
            <p className="text-white/60 text-xs mt-1">{item.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {item.priority && (
              <Badge className={`${getPriorityColor(item.priority)} border-0 text-xs`}>
                {item.priority}
              </Badge>
            )}
            {item.sentiment && (
              <Badge className={`${getSentimentColor(item.sentiment)} border-0 text-xs`}>
                {item.sentiment}
              </Badge>
            )}
            {item.assignee_hint && (
              <span className="text-white/40 text-xs">→ {item.assignee_hint}</span>
            )}
          </div>
        </div>
        {item.type === 'task' && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 w-8 h-8 text-indigo-400 hover:text-indigo-300"
            onClick={() => handleAddTask(item)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold">Extracted Items</h3>
          {isTranscribing && (
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={`${showTranscript ? 'text-indigo-400' : 'text-white/60'} hover:text-white`}
            onClick={() => setShowTranscript(!showTranscript)}
          >
            <FileText className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {showTranscript ? (
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            <h4 className="text-white/60 text-sm font-medium">Live Transcript</h4>
            {transcript ? (
              <p className="text-white text-sm whitespace-pre-wrap">{transcript}</p>
            ) : (
              <p className="text-white/40 text-sm">
                {isTranscribing
                  ? 'Transcribing...'
                  : 'Start recording to generate a transcript'}
              </p>
            )}
          </div>
        </ScrollArea>
      ) : (
        <Tabs defaultValue="tasks" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4 bg-white/5 border-0">
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-white/60"
            >
              <CheckSquare className="w-4 h-4 mr-1" />
              {tasks.length}
            </TabsTrigger>
            <TabsTrigger
              value="feedback"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-white/60"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              {feedback.length}
            </TabsTrigger>
            <TabsTrigger
              value="ideas"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-white/60"
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              {ideas.length}
            </TabsTrigger>
            <TabsTrigger
              value="followups"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-white/60"
            >
              <Clock className="w-4 h-4 mr-1" />
              {followUps.length}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-4">
            <TabsContent value="tasks" className="mt-0 space-y-3">
              {tasks.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">
                  No tasks extracted yet
                </p>
              ) : (
                tasks.map((item, idx) => <ItemCard key={idx} item={item} />)
              )}
            </TabsContent>

            <TabsContent value="feedback" className="mt-0 space-y-3">
              {feedback.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">
                  No feedback extracted yet
                </p>
              ) : (
                feedback.map((item, idx) => <ItemCard key={idx} item={item} />)
              )}
            </TabsContent>

            <TabsContent value="ideas" className="mt-0 space-y-3">
              {ideas.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">
                  No ideas extracted yet
                </p>
              ) : (
                ideas.map((item, idx) => <ItemCard key={idx} item={item} />)
              )}
            </TabsContent>

            <TabsContent value="followups" className="mt-0 space-y-3">
              {followUps.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">
                  No follow-ups extracted yet
                </p>
              ) : (
                followUps.map((item, idx) => <ItemCard key={idx} item={item} />)
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      )}

      {/* Footer info */}
      <div className="p-4 border-t border-white/10">
        <p className="text-white/40 text-xs text-center">
          Items are extracted from the meeting recording using AI
        </p>
      </div>
    </div>
  );
};
