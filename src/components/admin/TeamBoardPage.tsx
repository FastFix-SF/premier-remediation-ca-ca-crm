import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Lightbulb, AlertTriangle, HelpCircle, Plus, ThumbsUp, MessageSquare, Filter } from 'lucide-react';
import { useTeamBoardItems, useCreateBoardItem, useUpdateBoardItem, useVoteItem, TeamBoardItem } from '@/hooks/useTeamBoard';
import TeamBoardItemDetail from './TeamBoardItemDetail';

const CATEGORY_CONFIG = {
  problem: { icon: AlertTriangle, color: 'destructive', label: 'Problem' },
  idea: { icon: Lightbulb, color: 'default', label: 'Idea' },
  question: { icon: HelpCircle, color: 'secondary', label: 'Question' },
} as const;

const STATUS_CONFIG = {
  open: { color: 'bg-blue-500', label: 'Open' },
  in_discussion: { color: 'bg-yellow-500', label: 'In Discussion' },
  approved: { color: 'bg-green-500', label: 'Approved' },
  in_progress: { color: 'bg-purple-500', label: 'In Progress' },
  done: { color: 'bg-emerald-600', label: 'Done' },
  rejected: { color: 'bg-gray-500', label: 'Rejected' },
} as const;

const PRIORITY_CONFIG = {
  low: { color: 'bg-gray-400', label: 'Low' },
  medium: { color: 'bg-blue-400', label: 'Medium' },
  high: { color: 'bg-orange-500', label: 'High' },
  urgent: { color: 'bg-red-600', label: 'Urgent' },
} as const;

export default function TeamBoardPage() {
  const [filters, setFilters] = useState({ status: 'all', category: 'all' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TeamBoardItem | null>(null);
  const [newItem, setNewItem] = useState({ title: '', description: '', category: 'idea' });

  const { data: items, isLoading } = useTeamBoardItems(filters);
  const createItem = useCreateBoardItem();
  const updateItem = useUpdateBoardItem();
  const voteItem = useVoteItem();

  const handleCreate = () => {
    if (!newItem.title.trim()) return;
    createItem.mutate(newItem, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewItem({ title: '', description: '', category: 'idea' });
      },
    });
  };

  const handleStatusChange = (itemId: string, newStatus: string) => {
    updateItem.mutate({ id: itemId, status: newStatus as TeamBoardItem['status'] });
  };

  const handlePriorityChange = (itemId: string, newPriority: string) => {
    updateItem.mutate({ id: itemId, priority: newPriority as TeamBoardItem['priority'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Board</h1>
          <p className="text-muted-foreground">Ideas, problems, and questions from the team</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Team Board</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">💡 Idea</SelectItem>
                    <SelectItem value="problem">⚠️ Problem</SelectItem>
                    <SelectItem value="question">❓ Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="What's on your mind?"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  placeholder="Add more details..."
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  rows={4}
                />
              </div>
              <Button onClick={handleCreate} disabled={createItem.isPending} className="w-full">
                {createItem.isPending ? 'Adding...' : 'Add to Board'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_discussion">In Discussion</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="idea">Ideas</SelectItem>
                <SelectItem value="problem">Problems</SelectItem>
                <SelectItem value="question">Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : items?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No items yet</h3>
            <p className="text-muted-foreground">Be the first to add something to the team board!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items?.map((item) => {
            const CategoryIcon = CATEGORY_CONFIG[item.category]?.icon || Lightbulb;
            const statusConfig = STATUS_CONFIG[item.status];
            const priorityConfig = PRIORITY_CONFIG[item.priority];

            return (
              <Card
                key={item.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      <Badge variant={CATEGORY_CONFIG[item.category]?.color as any}>
                        {CATEGORY_CONFIG[item.category]?.label}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <div className={`w-2 h-2 rounded-full ${priorityConfig?.color}`} title={priorityConfig?.label} />
                      <div className={`w-2 h-2 rounded-full ${statusConfig?.color}`} title={statusConfig?.label} />
                    </div>
                  </div>
                  <CardTitle className="text-base mt-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          voteItem.mutate(item.id);
                        }}
                        className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{item.votes_count}</span>
                      </button>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {statusConfig?.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedItem && (
            <TeamBoardItemDetail
              item={selectedItem}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onClose={() => setSelectedItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
