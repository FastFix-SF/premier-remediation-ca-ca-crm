import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Search, Filter, LayoutGrid, List, Calendar, MapPin, User, CheckCircle2, Clock, AlertTriangle, AlertCircle, X, Trash2, Edit2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo, Todo } from '@/hooks/useTodos';
import { useProjectsWithPhotos } from '@/hooks/useProjectsWithPhotos';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { toast } from 'sonner';

type Priority = 'high' | 'medium' | 'critical' | 'low';
type Status = 'pending' | 'complete';

interface Column {
  id: Priority | 'complete';
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const columns: Column[] = [
  { 
    id: 'high', 
    title: 'High', 
    color: 'text-red-600 dark:text-red-400', 
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: <AlertTriangle className="h-4 w-4 text-red-500" />
  },
  { 
    id: 'medium', 
    title: 'Medium', 
    color: 'text-amber-600 dark:text-amber-400', 
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    icon: <Clock className="h-4 w-4 text-amber-500" />
  },
  { 
    id: 'critical', 
    title: 'Critical', 
    color: 'text-purple-600 dark:text-purple-400', 
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    icon: <AlertCircle className="h-4 w-4 text-purple-500" />
  },
  { 
    id: 'low', 
    title: 'Low', 
    color: 'text-blue-600 dark:text-blue-400', 
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: <Calendar className="h-4 w-4 text-blue-500" />
  },
  { 
    id: 'complete', 
    title: 'Complete', 
    color: 'text-green-600 dark:text-green-400', 
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
  },
];

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getRandomColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
    'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-cyan-500'
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
};

export const TodosKanban: React.FC = () => {
  const { data: todos = [], isLoading } = useTodos();
  const { projects = [] } = useProjectsWithPhotos();
  const { data: teamMembers = [] } = useTeamMembers();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [editingTodo, setEditingTodo] = useState(false);
  const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    due_date: '',
    project_id: '',
    assigned_to: '',
    assigned_to_name: '',
    address: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      project_id: '',
      assigned_to: '',
      assigned_to_name: '',
      address: '',
    });
    setEditingTodo(false);
  };

  const filteredTodos = useMemo(() => {
    if (!searchQuery) return todos;
    const query = searchQuery.toLowerCase();
    return todos.filter(todo => 
      todo.title.toLowerCase().includes(query) ||
      todo.description?.toLowerCase().includes(query) ||
      todo.address?.toLowerCase().includes(query) ||
      todo.assigned_to_name?.toLowerCase().includes(query) ||
      todo.project?.name?.toLowerCase().includes(query)
    );
  }, [todos, searchQuery]);

  const groupedTodos = useMemo(() => {
    const groups: Record<string, Todo[]> = {
      high: [],
      medium: [],
      critical: [],
      low: [],
      complete: [],
    };

    filteredTodos.forEach(todo => {
      if (todo.status === 'complete') {
        groups.complete.push(todo);
      } else {
        groups[todo.priority]?.push(todo);
      }
    });

    return groups;
  }, [filteredTodos]);

  const handleCreateTodo = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      await createTodo.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
        project_id: formData.project_id || undefined,
        assigned_to: formData.assigned_to || undefined,
        assigned_to_name: formData.assigned_to_name || undefined,
        address: formData.address || undefined,
      });
      toast.success('To-Do created successfully');
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create To-Do');
    }
  };

  const handleUpdateTodo = async () => {
    if (!selectedTodo) return;

    try {
      await updateTodo.mutateAsync({
        id: selectedTodo.id,
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
        project_id: formData.project_id || undefined,
        assigned_to: formData.assigned_to || undefined,
        assigned_to_name: formData.assigned_to_name || undefined,
        address: formData.address || undefined,
      });
      toast.success('To-Do updated successfully');
      setEditingTodo(false);
      setShowDetailsDialog(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to update To-Do');
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo.mutateAsync(id);
      toast.success('To-Do deleted');
      setShowDetailsDialog(false);
    } catch (error) {
      toast.error('Failed to delete To-Do');
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      await updateTodo.mutateAsync({
        id: todo.id,
        status: todo.status === 'complete' ? 'pending' : 'complete',
      });
      toast.success(todo.status === 'complete' ? 'Marked as pending' : 'Marked as complete');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDragStart = (e: React.DragEvent, todo: Todo) => {
    setDraggedTodo(todo);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (!draggedTodo) return;

    try {
      if (columnId === 'complete') {
        await updateTodo.mutateAsync({
          id: draggedTodo.id,
          status: 'complete',
        });
      } else {
        await updateTodo.mutateAsync({
          id: draggedTodo.id,
          status: 'pending',
          priority: columnId as Priority,
        });
      }
      toast.success('To-Do moved');
    } catch (error) {
      toast.error('Failed to move To-Do');
    }
    setDraggedTodo(null);
  };

  const openTodoDetails = (todo: Todo) => {
    setSelectedTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      due_date: todo.due_date || '',
      project_id: todo.project_id || '',
      assigned_to: todo.assigned_to || '',
      assigned_to_name: todo.assigned_to_name || '',
      address: todo.address || '',
    });
    setShowDetailsDialog(true);
  };

  const handleAssigneeChange = (userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId);
    setFormData({
      ...formData,
      assigned_to: userId,
      assigned_to_name: member?.full_name || '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search To-Do's..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>

        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          To-Do
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column) => (
            <div
              key={column.id}
              className={cn(
                'w-72 flex-shrink-0 rounded-lg border',
                column.bgColor,
                column.borderColor
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-3 border-b border-inherit">
                <div className="flex items-center gap-2">
                  <span className={cn('font-medium text-sm', column.color)}>
                    {column.title}
                  </span>
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {groupedTodos[column.id]?.length || 0}
                  </Badge>
                </div>
                {column.icon}
              </div>

              {/* Cards */}
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-2 space-y-2">
                  {groupedTodos[column.id]?.map((todo) => (
                    <div
                      key={todo.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, todo)}
                      onClick={() => openTodoDetails(todo)}
                      className={cn(
                        'bg-card border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
                        draggedTodo?.id === todo.id && 'opacity-50'
                      )}
                    >
                      {/* Card Title */}
                      <div className="flex items-start gap-2 mb-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            'text-sm font-medium line-clamp-2',
                            todo.status === 'complete' && 'line-through text-muted-foreground'
                          )}>
                            {todo.title}
                          </h4>
                          {/* Subtext / Description */}
                          {todo.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {todo.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Assignee & Date */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span className="truncate max-w-[120px]">
                          {todo.assigned_to_name || 'Unassigned'}
                        </span>
                        {todo.due_date && (
                          <span>{format(new Date(todo.due_date), 'MM/dd/yyyy')}</span>
                        )}
                      </div>

                      {/* Address */}
                      {todo.address && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{todo.address}</span>
                        </div>
                      )}

                      {/* Assigned Avatar */}
                      {todo.assigned_to_name && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className={cn('text-[10px] text-white', getRandomColor(todo.assigned_to_name))}>
                              {getInitials(todo.assigned_to_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {getInitials(todo.assigned_to_name)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {groupedTodos[column.id]?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No tasks
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create To-Do</DialogTitle>
            <DialogDescription>Add a new task to your board</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as Priority })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Project</Label>
              <Select value={formData.project_id || 'none'} onValueChange={(v) => setFormData({ ...formData, project_id: v === 'none' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assign To</Label>
              <Select value={formData.assigned_to || 'none'} onValueChange={(v) => handleAssigneeChange(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teamMembers.filter(m => m.user_id).map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id!}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Property address"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreateTodo} disabled={createTodo.isPending}>
                {createTodo.isPending ? 'Creating...' : 'Create To-Do'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={(open) => { setShowDetailsDialog(open); if (!open) { resetForm(); setSelectedTodo(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{editingTodo ? 'Edit To-Do' : 'To-Do Details'}</span>
              {!editingTodo && selectedTodo && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditingTodo(true)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteTodo(selectedTodo.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedTodo && (
            <div className="space-y-4">
              {editingTodo ? (
                <>
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Priority</Label>
                      <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as Priority })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Assign To</Label>
                    <Select value={formData.assigned_to || 'none'} onValueChange={(v) => handleAssigneeChange(v === 'none' ? '' : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {teamMembers.filter(m => m.user_id).map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id!}>
                            {member.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setEditingTodo(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateTodo} disabled={updateTodo.isPending}>
                      {updateTodo.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedTodo.status === 'complete' ? 'secondary' : 'default'}>
                      {selectedTodo.status === 'complete' ? 'Complete' : selectedTodo.priority.charAt(0).toUpperCase() + selectedTodo.priority.slice(1)}
                    </Badge>
                    {selectedTodo.project?.name && (
                      <Badge variant="outline">{selectedTodo.project.name}</Badge>
                    )}
                  </div>

                  <div>
                    <h3 className={cn(
                      'text-lg font-semibold',
                      selectedTodo.status === 'complete' && 'line-through text-muted-foreground'
                    )}>
                      {selectedTodo.title}
                    </h3>
                    {selectedTodo.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedTodo.description}</p>
                    )}
                  </div>

                  <div className="grid gap-3 text-sm">
                    {selectedTodo.due_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Due: {format(new Date(selectedTodo.due_date), 'MMMM d, yyyy')}</span>
                      </div>
                    )}

                    {selectedTodo.assigned_to_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>Assigned to: {selectedTodo.assigned_to_name}</span>
                      </div>
                    )}

                    {selectedTodo.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedTodo.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleToggleComplete(selectedTodo)}
                    >
                      {selectedTodo.status === 'complete' ? 'Mark as Pending' : 'Mark as Complete'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                      Close
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
