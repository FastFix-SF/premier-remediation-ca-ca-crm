import React from 'react';
import { format, isSameDay } from 'date-fns';
import { Calendar, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScheduleTask, useUpdateScheduleTask, useDeleteScheduleTask } from '@/hooks/useScheduleTasks';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ScheduleTaskListProps {
  tasks: ScheduleTask[];
  selectedDate: Date | null;
}

export const ScheduleTaskList: React.FC<ScheduleTaskListProps> = ({
  tasks,
  selectedDate,
}) => {
  const updateTask = useUpdateScheduleTask();
  const deleteTask = useDeleteScheduleTask();

  const filteredTasks = selectedDate
    ? tasks.filter((task) => {
        if (!task.start_date) return false;
        const taskStart = new Date(task.start_date);
        const taskEnd = task.end_date ? new Date(task.end_date) : taskStart;
        return selectedDate >= taskStart && selectedDate <= taskEnd;
      })
    : tasks;

  const handleToggleComplete = async (task: ScheduleTask) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        is_completed: !task.is_completed,
      });
      toast.success(task.is_completed ? 'Task marked incomplete' : 'Task completed');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">
          {selectedDate
            ? `No tasks scheduled for ${format(selectedDate, 'MMM d, yyyy')}`
            : 'No scheduled tasks'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {selectedDate && (
        <h3 className="font-medium text-sm text-muted-foreground mb-3">
          Tasks for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>
      )}
      {filteredTasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg border bg-card transition-colors hover:bg-muted/50',
            task.is_completed && 'opacity-60'
          )}
        >
          <button
            onClick={() => handleToggleComplete(task)}
            className="mt-0.5 flex-shrink-0"
          >
            {task.is_completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle
                className="h-5 w-5"
                style={{ color: task.color || '#3b82f6' }}
              />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-medium truncate',
                  task.is_completed && 'line-through'
                )}
              >
                {task.title}
              </span>
              {task.project && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {task.project.name}
                </Badge>
              )}
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {task.start_date && format(new Date(task.start_date), 'MMM d')}
                {task.end_date &&
                  task.end_date !== task.start_date &&
                  ` - ${format(new Date(task.end_date), 'MMM d')}`}
              </span>
              {task.duration_days && task.duration_days > 1 && (
                <span>({task.duration_days} days)</span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => handleDelete(task.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};
