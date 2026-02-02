import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Clock, 
  User, 
  MapPin, 
  Trash2,
  Calendar as CalendarIcon,
  Filter
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../hooks/use-toast';
import { useTeamMembers } from '../../../hooks/useTeamMembers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

interface Task {
  id: string;
  job_name: string;
  description?: string;
  start_time: string;
  end_time: string;
  assigned_users: any[];
  location?: string;
  status: string;
  color: string;
  created_at: string;
}

const TasksManager = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newTask, setNewTask] = useState({
    job_name: '',
    description: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_date: format(new Date(), 'yyyy-MM-dd'),
    end_time: '17:00',
    assigned_user_ids: [] as string[],
    location: ''
  });

  const { toast } = useToast();
  const { data: teamMembers } = useTeamMembers();
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_schedules')
        .select('*')
        .in('status', ['scheduled', 'draft', 'completed'])
        .order('start_time', { ascending: true });

      if (error) throw error;
      return (data || []) as Task[];
    },
  });

  // Toggle task completion
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, isCompleted }: { taskId: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from('job_schedules')
        .update({ 
          status: isCompleted ? 'scheduled' : 'completed',
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Task updated",
        description: "Task status has been updated.",
      });
    },
  });

  // Delete task
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('job_schedules')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Task deleted",
        description: "Task has been removed.",
      });
    },
  });

  // Create task
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!newTask.job_name.trim()) {
        throw new Error('Task title is required');
      }

      const selectedMembers = teamMembers?.filter(m => 
        newTask.assigned_user_ids.includes(m.user_id)
      ) || [];

      const startDateTime = new Date(`${newTask.start_date}T${newTask.start_time}`);
      const endDateTime = new Date(`${newTask.end_date}T${newTask.end_time}`);

      const { error } = await supabase
        .from('job_schedules')
        .insert({
          job_name: newTask.job_name,
          description: newTask.description || null,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          assigned_users: selectedMembers.map(m => ({
            id: m.user_id,
            name: m.full_name || m.email,
            email: m.email
          })),
          location: newTask.location || null,
          status: 'scheduled',
          color: '#6366f1',
          priority: 'normal'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsAddDialogOpen(false);
      setNewTask({
        job_name: '',
        description: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_date: format(new Date(), 'yyyy-MM-dd'),
        end_time: '17:00',
        assigned_user_ids: [],
        location: ''
      });
      toast({
        title: "Task created",
        description: "New task has been added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create task.",
        variant: "destructive",
      });
    },
  });

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return task.status === 'scheduled';
    if (filterStatus === 'completed') return task.status === 'completed';
    if (filterStatus === 'draft') return task.status === 'draft';
    return true;
  });

  const completedTasks = filteredTasks.filter(t => t.status === 'completed');
  const incompleteTasks = filteredTasks.filter(t => t.status !== 'completed');

  const toggleUserSelection = (userId: string) => {
    setNewTask(prev => ({
      ...prev,
      assigned_user_ids: prev.assigned_user_ids.includes(userId)
        ? prev.assigned_user_ids.filter(id => id !== userId)
        : [...prev.assigned_user_ids, userId]
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Task Management
              </CardTitle>
              <CardDescription>
                Create and track tasks for team members • {tasks.length} total tasks
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tasks List */}
      <div className="grid gap-4">
        {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">No tasks yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first task to get started
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Tasks */}
            {incompleteTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active Tasks ({incompleteTasks.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {incompleteTasks.map((task) => {
                    const assignedUsers = Array.isArray(task.assigned_users) ? task.assigned_users : [];
                    const firstUser = assignedUsers[0];
                    const member = teamMembers?.find(m => m.user_id === firstUser?.id);

                    return (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <button
                          onClick={() => toggleTaskMutation.mutate({ 
                            taskId: task.id, 
                            isCompleted: task.status === 'completed' 
                          })}
                          className="mt-1 flex-shrink-0"
                        >
                          {task.status === 'completed' ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground hover:text-primary" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{task.job_name}</h3>
                              {task.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            {task.status === 'draft' && (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              {format(parseISO(task.start_time), 'MMM d')} - {format(parseISO(task.end_time), 'MMM d')}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(parseISO(task.start_time), 'h:mm a')} - {format(parseISO(task.end_time), 'h:mm a')}
                            </div>

                            {task.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate max-w-[200px]">{task.location}</span>
                              </div>
                            )}

                            {assignedUsers.length > 0 && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{assignedUsers.length} assigned</span>
                              </div>
                            )}
                          </div>

                          {member && (
                            <div className="flex items-center gap-2 mt-2">
                              <Avatar className="h-6 w-6">
                                {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                                <AvatarFallback className="text-xs">
                                  {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{member.full_name || member.email}</span>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                          className="flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Completed Tasks ({completedTasks.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completedTasks.map((task) => {
                    const assignedUsers = Array.isArray(task.assigned_users) ? task.assigned_users : [];
                    const member = teamMembers?.find(m => m.user_id === assignedUsers[0]?.id);

                    return (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-4 border rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <button
                          onClick={() => toggleTaskMutation.mutate({ 
                            taskId: task.id, 
                            isCompleted: task.status === 'completed' 
                          })}
                          className="mt-1 flex-shrink-0"
                        >
                          <CheckSquare className="w-5 h-5 text-primary" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold line-through truncate">{task.job_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <CalendarIcon className="w-4 h-4" />
                            Completed on {format(parseISO(task.start_time), 'MMM d, yyyy')}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                          className="flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Assign a task to team members with specific deadlines
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task_name">Task Title *</Label>
              <Input
                id="task_name"
                value={newTask.job_name}
                onChange={(e) => setNewTask({ ...newTask, job_name: e.target.value })}
                placeholder="Enter task title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Add task details or instructions"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newTask.start_date}
                  onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newTask.start_time}
                  onChange={(e) => setNewTask({ ...newTask, start_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.end_date}
                  onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Time</Label>
                <Input
                  type="time"
                  value={newTask.end_time}
                  onChange={(e) => setNewTask({ ...newTask, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={newTask.location}
                onChange={(e) => setNewTask({ ...newTask, location: e.target.value })}
                placeholder="Enter task location"
              />
            </div>

            <div className="space-y-3">
              <Label>Assign To *</Label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                {teamMembers && teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => toggleUserSelection(member.user_id)}
                    >
                      <input
                        type="checkbox"
                        checked={newTask.assigned_user_ids.includes(member.user_id)}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                      <Avatar className="h-8 w-8">
                        {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                        <AvatarFallback className="text-xs">
                          {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.full_name || member.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No team members available
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createTaskMutation.mutate()}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksManager;
