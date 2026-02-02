import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ServiceTicketTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketTitle: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
}

export const ServiceTicketTasksModal: React.FC<ServiceTicketTasksModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketTitle
}) => {
  const [newTask, setNewTask] = useState('');
  const queryClient = useQueryClient();

  // Note: Using service_ticket_notes as a workaround for tasks since there's no dedicated tasks table for tickets
  // In a real implementation, you'd create a service_ticket_tasks table
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['service-ticket-tasks', ticketId],
    queryFn: async () => {
      // For now, return empty array - in production you'd fetch from a tasks table
      return [] as Task[];
    },
    enabled: !!ticketId
  });

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      // Placeholder - would insert into service_ticket_tasks table
      toast.info('Task feature coming soon');
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-ticket-tasks', ticketId] });
      setNewTask('');
    }
  });

  const handleAddTask = () => {
    if (newTask.trim()) {
      addTaskMutation.mutate(newTask.trim());
    }
  };

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tasks - {ticketTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 py-4">
          <Input
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <Button onClick={handleAddTask} disabled={!newTask.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No tasks yet</p>
              <p className="text-sm">Add a task to get started</p>
            </div>
          ) : (
            <>
              {incompleteTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">To Do</h4>
                  {incompleteTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Checkbox checked={false} />
                      <span className="flex-1 text-sm">{task.title}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {completedTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Completed</h4>
                  {completedTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg opacity-60">
                      <Checkbox checked={true} />
                      <span className="flex-1 text-sm line-through">{task.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
