import React, { useState } from 'react';
import { Plus, Calendar as CalendarIcon, List, RefreshCw, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScheduleCalendar } from './ScheduleCalendar';
import { ScheduleTaskList } from './ScheduleTaskList';
import { AddScheduleTaskDialog } from './AddScheduleTaskDialog';
import { GanttChart } from './GanttChart';
import { useScheduleData, useScheduleTasks } from '@/hooks/useScheduleTasks';

interface ScheduleTabProps {
  projectId?: string;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ projectId }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogProjectId, setAddDialogProjectId] = useState<string | undefined>(projectId);
  const [view, setView] = useState<'gantt' | 'calendar' | 'list'>('gantt');

  const { data: projects = [], isLoading: isLoadingProjects, refetch: refetchProjects } = useScheduleData(projectId);
  const { data: tasks = [], refetch: refetchTasks } = useScheduleTasks(projectId);

  const handleAddTask = (projectIdOverride?: string, date?: Date) => {
    setAddDialogProjectId(projectIdOverride || projectId);
    if (date) setSelectedDate(date);
    setAddDialogOpen(true);
  };

  const handleRefresh = () => {
    refetchProjects();
    refetchTasks();
  };

  // Flatten all tasks from projects for calendar/list views
  const allTasks = projects.flatMap(p => p.tasks);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schedule</h2>
          <p className="text-muted-foreground text-sm">
            Manage project tasks and deadlines • {projects.length} projects, {allTasks.length} items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => handleAddTask()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as 'gantt' | 'calendar' | 'list')}>
        <TabsList>
          <TabsTrigger value="gantt" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Gantt
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gantt" className="mt-4">
          <GanttChart projects={projects} onAddTask={handleAddTask} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <div className="grid lg:grid-cols-[350px_1fr] gap-6">
            <ScheduleCalendar
              tasks={allTasks}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
            <div className="bg-card border rounded-lg p-4">
              <ScheduleTaskList tasks={allTasks} selectedDate={selectedDate} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <div className="bg-card border rounded-lg p-4">
            <ScheduleTaskList tasks={allTasks} selectedDate={null} />
          </div>
        </TabsContent>
      </Tabs>

      <AddScheduleTaskDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        defaultDate={selectedDate || new Date()}
        projectId={addDialogProjectId}
      />
    </div>
  );
};
