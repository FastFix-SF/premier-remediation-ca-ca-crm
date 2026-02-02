import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { Plus, Trash2, ListTodo } from 'lucide-react';
import { useShiftTasks, useCreateShiftTask, useUpdateShiftTask, useDeleteShiftTask, ShiftTask } from '../../../hooks/useShiftTasks';

interface ShiftTasksSectionProps {
  shiftId: string;
  isEditing: boolean;
}

export const ShiftTasksSection: React.FC<ShiftTasksSectionProps> = ({ shiftId, isEditing }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { data: tasks, isLoading } = useShiftTasks(shiftId);
  const createTask = useCreateShiftTask();
  const updateTask = useUpdateShiftTask();
  const deleteTask = useDeleteShiftTask();

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask.mutate({ shiftId, title: newTaskTitle.trim() });
    setNewTaskTitle('');
  };

  const handleToggleComplete = (task: ShiftTask) => {
    updateTask.mutate({ 
      taskId: task.id, 
      updates: { is_completed: !task.is_completed } 
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask.mutate({ taskId, shiftId });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-8 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const completedCount = tasks?.filter(t => t.is_completed).length || 0;
  const totalCount = tasks?.length || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <ListTodo className="w-4 h-4" />
          Tasks {totalCount > 0 && `(${completedCount}/${totalCount})`}
        </h4>
      </div>

      {/* Task List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                task.is_completed ? 'bg-muted/50 border-muted' : 'bg-background border-border'
              }`}
            >
              <Checkbox 
                checked={task.is_completed}
                onCheckedChange={() => handleToggleComplete(task)}
                disabled={!isEditing}
              />
              <span className={`flex-1 text-sm ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </span>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tasks added yet
          </p>
        )}
      </div>

      {/* Add New Task */}
      {isEditing && (
        <div className="flex gap-2">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 h-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTask();
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim() || createTask.isPending}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
