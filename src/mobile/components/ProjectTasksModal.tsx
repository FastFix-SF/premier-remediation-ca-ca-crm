import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, CheckSquare, UserPlus, ChevronDown, ChevronRight, ListTree } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { UserSelectionSheet } from './UserSelectionSheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notifyTaskAssignment } from '@/utils/sendSmsNotification';
import { AddProjectSubtaskModal } from './AddProjectSubtaskModal';

interface ProjectTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

interface TaskAssignee {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Subtask {
  id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  order_index: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  assignees: TaskAssignee[];
  subtasks: Subtask[];
}

export const ProjectTasksModal: React.FC<ProjectTasksModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [selectedTaskForSubtask, setSelectedTaskForSubtask] = useState<string | null>(null);

  // Fetch tasks with assignees and subtasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('is_completed', { ascending: true })
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const taskIds = tasksData.map(t => t.id);

      // Fetch assignees from junction table
      const { data: assigneesData } = await supabase
        .from('project_task_assignees')
        .select('task_id, user_id')
        .in('task_id', taskIds);

      // Fetch subtasks
      const { data: subtasksData } = await supabase
        .from('project_task_subtasks')
        .select('*')
        .in('project_task_id', taskIds)
        .order('order_index', { ascending: true });

      // Get unique user IDs from assignees
      const assignedUserIds = [...new Set(assigneesData?.map(a => a.user_id) || [])];

      let teamMembersMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      
      if (assignedUserIds.length > 0) {
        const { data: teamMembers } = await supabase
          .from('team_directory')
          .select('user_id, full_name, avatar_url')
          .in('user_id', assignedUserIds);

        if (teamMembers) {
          teamMembersMap = teamMembers.reduce((acc, member) => {
            acc[member.user_id] = { full_name: member.full_name, avatar_url: member.avatar_url };
            return acc;
          }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>);
        }
      }

      // Combine tasks with assignees and subtasks
      return tasksData.map(task => {
        const taskAssignees = assigneesData
          ?.filter(a => a.task_id === task.id)
          .map(a => ({
            user_id: a.user_id,
            full_name: teamMembersMap[a.user_id]?.full_name || null,
            avatar_url: teamMembersMap[a.user_id]?.avatar_url || null,
          })) || [];

        const taskSubtasks = subtasksData
          ?.filter(s => s.project_task_id === task.id)
          .map(s => ({
            id: s.id,
            title: s.title,
            description: s.description || undefined,
            is_completed: s.is_completed || false,
            completed_at: s.completed_at || undefined,
            order_index: s.order_index || 0,
          })) || [];

        return {
          ...task,
          assignees: taskAssignees,
          subtasks: taskSubtasks,
        };
      }) as Task[];
    },
    enabled: isOpen && !!projectId,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('project_tasks')
        .insert({
          project_id: projectId,
          title: title.trim(),
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      setNewTaskTitle('');
      toast({
        title: 'Task added',
        description: 'Task has been added successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to add task',
        variant: 'destructive',
      });
    },
  });

  // Assign multiple users mutation
  const assignUsersMutation = useMutation({
    mutationFn: async ({ taskId, userIds }: { taskId: string; userIds: string[] }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get current assignees
      const { data: currentAssignees } = await supabase
        .from('project_task_assignees')
        .select('user_id')
        .eq('task_id', taskId);

      const currentUserIds = currentAssignees?.map(a => a.user_id) || [];
      
      // Find users to add and remove
      const usersToAdd = userIds.filter(id => !currentUserIds.includes(id));
      const usersToRemove = currentUserIds.filter(id => !userIds.includes(id));

      // Remove users
      if (usersToRemove.length > 0) {
        await supabase
          .from('project_task_assignees')
          .delete()
          .eq('task_id', taskId)
          .in('user_id', usersToRemove);
      }

      // Add new users
      if (usersToAdd.length > 0) {
        const { error } = await supabase
          .from('project_task_assignees')
          .insert(
            usersToAdd.map(userId => ({
              task_id: taskId,
              user_id: userId,
              assigned_by: user.id,
            }))
          );

        if (error) throw error;

        // Get the task title for notifications
        const task = tasks.find(t => t.id === taskId);
        const taskTitle = task?.title || 'Nueva tarea';

        // Send notifications to newly assigned users
        for (const userId of usersToAdd) {
          try {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: userId,
                title: 'Nueva tarea asignada',
                body: `Te han asignado la tarea: "${taskTitle}" en el proyecto ${projectName}`,
                data: {
                  type: 'task_assigned',
                  project_id: projectId,
                  task_id: taskId,
                },
              },
            });
          } catch (notifError) {
            console.error('Error sending push notification:', notifError);
          }

          try {
            notifyTaskAssignment(userId, taskTitle, '', false);
          } catch (smsError) {
            console.error('Error sending SMS notification:', smsError);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast({
        title: 'Usuarios asignados',
        description: 'Los usuarios recibirán una notificación',
      });
    },
    onError: (error) => {
      console.error('Error assigning users:', error);
      toast({
        title: 'Error',
        description: 'No se pudo asignar los usuarios',
        variant: 'destructive',
      });
    },
  });

  // Toggle task completion mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, isCompleted }: { taskId: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from('project_tasks')
        .update({
          is_completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : null,
          completed_by: !isCompleted ? user?.id : null,
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    },
    onError: (error) => {
      console.error('Error toggling task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      toast({
        title: 'Task deleted',
        description: 'Task has been deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    },
  });

  // Create subtask mutation
  const createSubtaskMutation = useMutation({
    mutationFn: async ({ taskId, title, description }: { taskId: string; title: string; description?: string }) => {
      const { data: existingSubtasks } = await supabase
        .from('project_task_subtasks')
        .select('order_index')
        .eq('project_task_id', taskId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = (existingSubtasks?.[0]?.order_index || 0) + 1;

      const { error } = await supabase
        .from('project_task_subtasks')
        .insert({
          project_task_id: taskId,
          title: title.trim(),
          description: description?.trim() || null,
          order_index: nextOrderIndex,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      setShowAddSubtask(false);
      setSelectedTaskForSubtask(null);
      toast({
        title: 'Subtask added',
        description: 'Subtask has been added successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating subtask:', error);
      toast({
        title: 'Error',
        description: 'Failed to add subtask',
        variant: 'destructive',
      });
    },
  });

  // Toggle subtask completion mutation
  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ subtaskId, isCompleted }: { subtaskId: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from('project_task_subtasks')
        .update({
          is_completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : null,
          completed_by: !isCompleted ? user?.id : null,
        })
        .eq('id', subtaskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    },
    onError: (error) => {
      console.error('Error toggling subtask:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subtask',
        variant: 'destructive',
      });
    },
  });

  // Delete subtask mutation
  const deleteSubtaskMutation = useMutation({
    mutationFn: async (subtaskId: string) => {
      const { error } = await supabase
        .from('project_task_subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    },
    onError: (error) => {
      console.error('Error deleting subtask:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete subtask',
        variant: 'destructive',
      });
    },
  });

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a task title',
        variant: 'destructive',
      });
      return;
    }

    createTaskMutation.mutate(newTaskTitle);
  };

  const handleAssignClick = (task: Task) => {
    setSelectedTaskForAssign(task.id);
    setSelectedUserIds(task.assignees.map(a => a.user_id));
    setShowUserSelection(true);
  };

  const handleUsersSelected = (userIds: string[]) => {
    if (selectedTaskForAssign) {
      assignUsersMutation.mutate({
        taskId: selectedTaskForAssign,
        userIds,
      });
    }
    setShowUserSelection(false);
    setSelectedTaskForAssign(null);
    setSelectedUserIds([]);
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleAddSubtaskClick = (taskId: string) => {
    setSelectedTaskForSubtask(taskId);
    setShowAddSubtask(true);
    // Expand the task to show subtasks
    setExpandedTasks(prev => new Set(prev).add(taskId));
  };

  const handleAddSubtask = (title: string, description?: string) => {
    if (selectedTaskForSubtask) {
      createSubtaskMutation.mutate({
        taskId: selectedTaskForSubtask,
        title,
        description,
      });
    }
  };

  const completedTasks = tasks.filter(t => t.is_completed);
  const incompleteTasks = tasks.filter(t => !t.is_completed);

  const renderAssignees = (task: Task) => {
    if (task.assignees.length === 0) {
      return (
        <button
          onClick={() => handleAssignClick(task)}
          className="flex items-center gap-1 mt-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <UserPlus className="w-3 h-3" />
          <span>Asignar</span>
        </button>
      );
    }

    const displayCount = 3;
    const visibleAssignees = task.assignees.slice(0, displayCount);
    const remainingCount = task.assignees.length - displayCount;

    return (
      <button
        onClick={() => handleAssignClick(task)}
        className="flex items-center gap-1 mt-1 hover:opacity-80 transition-opacity"
      >
        <div className="flex -space-x-1.5">
          {visibleAssignees.map((assignee) => (
            <Avatar key={assignee.user_id} className="w-5 h-5 border-2 border-background">
              <AvatarImage src={assignee.avatar_url || ''} />
              <AvatarFallback className="text-[8px]">
                {assignee.full_name?.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        {remainingCount > 0 && (
          <span className="text-xs text-muted-foreground ml-1">+{remainingCount}</span>
        )}
      </button>
    );
  };

  const renderSubtasks = (task: Task) => {
    const isExpanded = expandedTasks.has(task.id);
    const completedCount = task.subtasks.filter(s => s.is_completed).length;
    const totalCount = task.subtasks.length;

    return (
      <div className="mt-2">
        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <button
              onClick={() => toggleTaskExpanded(task.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <ListTree className="w-3 h-3" />
              <span>{completedCount}/{totalCount}</span>
            </button>
          )}
          <button
            onClick={() => handleAddSubtaskClick(task.id)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Subtask</span>
          </button>
        </div>

        {isExpanded && task.subtasks.length > 0 && (
          <div className="mt-2 ml-4 space-y-1.5 border-l-2 border-muted pl-3">
            {task.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-start gap-2 group"
              >
                <Checkbox
                  checked={subtask.is_completed}
                  onCheckedChange={() =>
                    toggleSubtaskMutation.mutate({
                      subtaskId: subtask.id,
                      isCompleted: subtask.is_completed,
                    })
                  }
                  className="mt-0.5 h-3.5 w-3.5"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${subtask.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                    {subtask.title}
                  </p>
                </div>
                <button
                  onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                  className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Tasks - {projectName}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Add New Task */}
            <div className="flex gap-2 sticky top-0 bg-background pb-4 border-b z-10">
              <Input
                placeholder="Add a new task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTask();
                  }
                }}
              />
              <Button
                onClick={handleAddTask}
                disabled={createTaskMutation.isPending || !newTaskTitle.trim()}
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-1">No tasks yet</p>
                <p className="text-sm">Add your first task to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Incomplete Tasks */}
                {incompleteTasks.length > 0 && (
                  <div className="space-y-2">
                    {incompleteTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.is_completed}
                            onCheckedChange={() =>
                              toggleTaskMutation.mutate({
                                taskId: task.id,
                                isCompleted: task.is_completed,
                              })
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {task.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(task.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                            {renderAssignees(task)}
                            {renderSubtasks(task)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase px-1">
                      Completed ({completedTasks.length})
                    </p>
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg border bg-muted/30 group"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.is_completed}
                            onCheckedChange={() =>
                              toggleTaskMutation.mutate({
                                taskId: task.id,
                                isCompleted: task.is_completed,
                              })
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-muted-foreground line-through">
                              {task.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Completed{' '}
                              {task.completed_at &&
                                formatDistanceToNow(new Date(task.completed_at), {
                                  addSuffix: true,
                                })}
                            </p>
                            {task.assignees.length > 0 && (
                              <div className="flex -space-x-1.5 mt-1">
                                {task.assignees.slice(0, 3).map((assignee) => (
                                  <Avatar key={assignee.user_id} className="w-4 h-4 border border-background">
                                    <AvatarImage src={assignee.avatar_url || ''} />
                                    <AvatarFallback className="text-[6px]">
                                      {assignee.full_name?.slice(0, 2).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {task.assignees.length > 3 && (
                                  <span className="text-xs text-muted-foreground ml-1">+{task.assignees.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <UserSelectionSheet
        isOpen={showUserSelection}
        onClose={() => {
          setShowUserSelection(false);
          setSelectedTaskForAssign(null);
          setSelectedUserIds([]);
        }}
        selectedUserIds={selectedUserIds}
        onSelectUsers={handleUsersSelected}
      />

      <AddProjectSubtaskModal
        isOpen={showAddSubtask}
        onClose={() => {
          setShowAddSubtask(false);
          setSelectedTaskForSubtask(null);
        }}
        onAdd={handleAddSubtask}
        isLoading={createSubtaskMutation.isPending}
      />
    </>
  );
};
