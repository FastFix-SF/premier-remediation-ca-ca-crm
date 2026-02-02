import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SubTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  subTasks: string[];
  onSave: (subTasks: string[]) => void;
}

export const SubTasksModal: React.FC<SubTasksModalProps> = ({
  isOpen,
  onClose,
  subTasks,
  onSave,
}) => {
  const [tasks, setTasks] = useState<string[]>(subTasks);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      setTasks([...tasks, newTaskTitle.trim()]);
      setNewTaskTitle('');
    }
  };

  const handleSave = () => {
    onSave(tasks);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 max-w-[90vw] rounded-2xl">
        <div className="flex flex-col">
          <div className="flex items-center justify-center p-4 border-b">
            <h2 className="text-lg font-semibold">Create sub-tasks</h2>
          </div>

          <div className="p-6 flex flex-col items-center text-center space-y-4">
            {/* Illustration */}
            <div className="relative w-48 h-32">
              <div className="absolute inset-0 bg-blue-100 rounded-full opacity-50" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 space-y-2">
                <div className="bg-white rounded-lg p-3 shadow-md flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded" />
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-md flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded" />
                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold">Sub-tasks</h3>
              <p className="text-muted-foreground text-sm">
                Sub-tasks are smaller tasks/elements that<br />
                must be done to complete a larger task
              </p>
              <p className="font-semibold text-sm">
                start by adding your first sub-task
              </p>
            </div>

            <div className="w-full flex gap-2">
              <Input
                placeholder="Add task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                className="flex-1"
              />
              <Button
                onClick={handleAddTask}
                className="rounded-full w-14 h-14 bg-primary text-white"
              >
                <ArrowUp className="w-5 h-5" />
                <span className="ml-1 text-sm">Add</span>
              </Button>
            </div>

            {tasks.length > 0 && (
              <div className="w-full space-y-2 mt-4">
                {tasks.map((task, index) => (
                  <div key={index} className="text-left p-2 bg-muted/30 rounded">
                    {task}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <Button onClick={handleSave} className="w-full rounded-full">
              Save Sub-tasks
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
