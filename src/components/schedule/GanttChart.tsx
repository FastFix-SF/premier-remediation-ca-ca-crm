import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, differenceInDays, addDays, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, eachWeekOfInterval, isSameDay, isSameMonth, startOfYear, endOfYear } from 'date-fns';
import { ChevronRight, ChevronDown, FolderOpen, FileText, Plus, ChevronLeft, Clock, ZoomIn, ZoomOut, CalendarDays, X, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScheduleProject, ScheduleTask } from '@/hooks/useScheduleTasks';

interface GanttChartProps {
  projects: ScheduleProject[];
  onAddTask: (projectId?: string, date?: Date) => void;
}

type ZoomLevel = 'day' | 'week' | 'month';

export const GanttChart: React.FC<GanttChartProps> = ({ projects, onAddTask }) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => new Set(projects.map(p => p.id)));
  const [viewStart, setViewStart] = useState(() => startOfMonth(new Date()));
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTask, setSelectedTask] = useState<ScheduleTask | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update expanded projects when projects change
  useEffect(() => {
    setExpandedProjects(new Set(projects.map(p => p.id)));
  }, [projects.length]);

  // Calculate timeline based on zoom level
  const { days, months, dayWidth, viewEnd } = useMemo(() => {
    let daysToShow: number;
    let width: number;

    switch (zoomLevel) {
      case 'month':
        daysToShow = 365; // Full year
        width = 8;
        break;
      case 'week':
        daysToShow = 180; // 6 months
        width = 15;
        break;
      case 'day':
      default:
        daysToShow = 90; // 3 months
        width = 25;
        break;
    }

    const end = addDays(viewStart, daysToShow - 1);
    const allDays = eachDayOfInterval({ start: viewStart, end });
    const allMonths = eachMonthOfInterval({ start: viewStart, end });

    return {
      days: allDays,
      months: allMonths,
      dayWidth: width,
      viewEnd: end,
    };
  }, [viewStart, zoomLevel]);

  const rowHeight = 32;

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const getTaskPosition = (task: ScheduleTask) => {
    if (!task.start_date) return null;
    
    const taskStart = new Date(task.start_date);
    const taskEnd = task.end_date ? new Date(task.end_date) : addDays(taskStart, (task.duration_days || 1) - 1);
    
    const startOffset = differenceInDays(taskStart, viewStart);
    const duration = differenceInDays(taskEnd, taskStart) + 1;
    
    // Only show if task overlaps with view
    if (startOffset + duration < 0 || startOffset > days.length) return null;
    
    const clampedStart = Math.max(0, startOffset);
    const clampedEnd = Math.min(days.length, startOffset + duration);
    const clampedWidth = (clampedEnd - clampedStart) * dayWidth - 2;
    
    return {
      left: clampedStart * dayWidth,
      width: Math.max(clampedWidth, dayWidth - 2),
      visible: true,
    };
  };

  const navigateTimeline = (direction: 'prev' | 'next') => {
    const amount = zoomLevel === 'month' ? 3 : zoomLevel === 'week' ? 1 : 1;
    setViewStart((prev) => direction === 'next' ? addMonths(prev, amount) : subMonths(prev, amount));
  };

  const goToToday = () => {
    setViewStart(startOfMonth(new Date()));
  };

  const goToYear = (year: number) => {
    setSelectedYear(year);
    setViewStart(startOfYear(new Date(year, 0, 1)));
  };

  // Build flat list of rows
  const rows: { type: 'project' | 'task'; data: ScheduleProject | ScheduleTask; projectId?: string }[] = [];
  projects.forEach((project) => {
    rows.push({ type: 'project', data: project });
    if (expandedProjects.has(project.id)) {
      project.tasks.forEach((task) => {
        rows.push({ type: 'task', data: task, projectId: project.id });
      });
    }
  });

  const years = [2024, 2025, 2026, 2027, 2028];

  return (
    <div className="border rounded-lg bg-card overflow-hidden" ref={containerRef}>
      {/* Header controls */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateTimeline('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateTimeline('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            <CalendarDays className="h-4 w-4 mr-1" />
            Today
          </Button>
          <Select value={selectedYear.toString()} onValueChange={(v) => goToYear(parseInt(v))}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {format(viewStart, 'MMM yyyy')} - {format(viewEnd, 'MMM yyyy')}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Zoom:</span>
          <Button
            variant={zoomLevel === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setZoomLevel('day')}
            className="h-7 px-2 text-xs"
          >
            Day
          </Button>
          <Button
            variant={zoomLevel === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setZoomLevel('week')}
            className="h-7 px-2 text-xs"
          >
            Week
          </Button>
          <Button
            variant={zoomLevel === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setZoomLevel('month')}
            className="h-7 px-2 text-xs"
          >
            Month
          </Button>
        </div>
      </div>

      <div className="flex overflow-hidden">
        {/* Left panel - Task tree */}
        <div className="w-[280px] flex-shrink-0 border-r">
          {/* Header */}
          <div className="flex items-center h-10 border-b bg-muted/50 text-xs font-medium">
            <div className="flex-1 px-3">Task Name</div>
            <div className="w-16 text-center border-l px-1">Start</div>
            <div className="w-12 text-center border-l px-1">Days</div>
          </div>

          {/* Rows */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {projects.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No projects found
              </div>
            ) : (
              rows.map((row) => {
                if (row.type === 'project') {
                  const project = row.data as ScheduleProject;
                  const isExpanded = expandedProjects.has(project.id);
                  const totalDays = project.tasks.reduce((sum, t) => sum + (t.duration_days || 1), 0);
                  const earliestDate = project.tasks.length > 0 
                    ? project.tasks.filter(t => t.start_date).sort((a, b) => 
                        new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime()
                      )[0]?.start_date
                    : project.start_date;

                  return (
                    <div
                      key={`project-${project.id}`}
                      className="flex items-center border-b bg-muted/20 hover:bg-muted/40 transition-colors"
                      style={{ height: rowHeight }}
                    >
                      <button
                        className="flex items-center gap-1 flex-1 px-2 text-xs font-medium text-left min-w-0"
                        onClick={() => toggleProject(project.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <FolderOpen className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span className="truncate">{project.name}</span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">({project.tasks.length})</span>
                      </button>
                      <div className="w-16 text-center border-l px-1 text-[10px] text-muted-foreground">
                        {earliestDate ? format(new Date(earliestDate), 'MM/dd') : '-'}
                      </div>
                      <div className="w-12 text-center border-l px-1 text-[10px] text-muted-foreground">
                        {totalDays || '-'}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 mr-0.5 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddTask(project.id);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                } else {
                  const task = row.data as ScheduleTask;
                  return (
                    <div
                      key={`task-${task.id}`}
                      className="flex items-center border-b hover:bg-muted/30 transition-colors"
                      style={{ height: rowHeight }}
                    >
                      <div className="flex items-center gap-1 flex-1 px-2 pl-7 text-xs min-w-0">
                        {task.type === 'shift' ? (
                          <Clock className="h-3 w-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={cn('truncate', task.is_completed && 'line-through text-muted-foreground')}>
                          {task.title}
                        </span>
                      </div>
                      <div className="w-16 text-center border-l px-1 text-[10px] text-muted-foreground">
                        {task.start_date ? format(new Date(task.start_date), 'MM/dd') : '-'}
                      </div>
                      <div className="w-12 text-center border-l px-1 text-[10px] text-muted-foreground">
                        {task.duration_days || 1}
                      </div>
                      <div className="w-6" />
                    </div>
                  );
                }
              })
            )}
          </div>
        </div>

        {/* Right panel - Timeline */}
        <div className="flex-1 overflow-x-auto" ref={timelineRef}>
          <div style={{ minWidth: days.length * dayWidth }}>
            {/* Timeline header - Months */}
            <div className="flex h-5 border-b bg-muted/50 sticky top-0">
              {months.map((month) => {
                const monthStart = month;
                const monthEnd = endOfMonth(month);
                const startOffset = Math.max(0, differenceInDays(monthStart, viewStart));
                const daysInView = Math.min(
                  differenceInDays(monthEnd, monthStart) + 1,
                  days.length - startOffset
                );
                
                if (daysInView <= 0) return null;
                
                return (
                  <div
                    key={month.toISOString()}
                    className="border-r text-[10px] font-medium text-center flex items-center justify-center bg-muted/50"
                    style={{ 
                      width: daysInView * dayWidth,
                      marginLeft: startOffset === 0 && month !== months[0] ? 0 : undefined,
                    }}
                  >
                    {format(month, 'MMMM yyyy')}
                  </div>
                );
              })}
            </div>

            {/* Timeline header - Days (show based on zoom) */}
            <div className="flex h-5 border-b bg-muted/30">
              {days.map((day, index) => {
                const isToday = isSameDay(day, new Date());
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isFirstOfMonth = day.getDate() === 1;
                const showLabel = zoomLevel === 'day' || 
                  (zoomLevel === 'week' && (day.getDay() === 1 || isFirstOfMonth)) ||
                  (zoomLevel === 'month' && isFirstOfMonth);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'border-r text-[9px] text-center flex items-center justify-center',
                      isToday && 'bg-primary/30 font-bold',
                      isWeekend && !isToday && 'bg-muted/50',
                      isFirstOfMonth && 'border-l-2 border-l-border'
                    )}
                    style={{ width: dayWidth }}
                  >
                    {showLabel ? format(day, 'd') : ''}
                  </div>
                );
              })}
            </div>

            {/* Timeline rows */}
            <div className="relative overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {/* Grid lines */}
              <div className="absolute inset-0 flex pointer-events-none" style={{ height: rows.length * rowHeight }}>
                {days.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const isFirstOfMonth = day.getDate() === 1;
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'border-r h-full',
                        isToday && 'bg-primary/10',
                        isWeekend && !isToday && 'bg-muted/20',
                        isFirstOfMonth && 'border-l border-l-border/50'
                      )}
                      style={{ width: dayWidth }}
                    />
                  );
                })}
              </div>

              {/* Task bars */}
              {rows.map((row) => {
                if (row.type === 'project') {
                  const project = row.data as ScheduleProject;
                  // Only show empty row for project header (no bar if no scheduled tasks)
                  return (
                    <div
                      key={`timeline-project-${project.id}`}
                      className="relative border-b bg-muted/10"
                      style={{ height: rowHeight }}
                    />
                  );
                }

                const task = row.data as ScheduleTask;
                const position = getTaskPosition(task);

                return (
                  <div
                    key={`timeline-task-${task.id}`}
                    className="relative border-b"
                    style={{ height: rowHeight }}
                  >
                    {position && position.visible && (
                      <div
                        className={cn(
                          'absolute top-1 h-[calc(100%-8px)] rounded text-[10px] text-white flex items-center px-1 truncate shadow-sm cursor-pointer hover:opacity-80 hover:scale-[1.02] transition-all',
                          task.is_completed && 'opacity-50'
                        )}
                        style={{
                          left: position.left,
                          width: position.width,
                          backgroundColor: task.color || '#3b82f6',
                        }}
                        onClick={() => setSelectedTask(task)}
                      >
                        {position.width > 40 && (
                          <span className="truncate">{task.title}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Task/Shift Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTask?.type === 'shift' ? (
                <Clock className="h-5 w-5 text-green-500" />
              ) : (
                <FileText className="h-5 w-5 text-primary" />
              )}
              {selectedTask?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedTask?.type === 'shift' ? 'Shift Details' : 'Job List Details'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={selectedTask.type === 'shift' ? 'default' : 'secondary'}>
                  {selectedTask.type === 'shift' ? 'Shift' : 'Job List'}
                </Badge>
                {selectedTask.is_completed && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Completed
                  </Badge>
                )}
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Schedule</p>
                    <p className="text-muted-foreground">
                      {selectedTask.start_date 
                        ? format(new Date(selectedTask.start_date), 'MMMM d, yyyy')
                        : 'Not scheduled'
                      }
                      {selectedTask.end_date && selectedTask.end_date !== selectedTask.start_date && (
                        <> - {format(new Date(selectedTask.end_date), 'MMMM d, yyyy')}</>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Duration: {selectedTask.duration_days || 1} day(s)
                    </p>
                  </div>
                </div>

                {selectedTask.description && (
                  <div className="pt-2 border-t">
                    <p className="font-medium mb-1">Description</p>
                    <p className="text-muted-foreground text-sm">{selectedTask.description}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedTask(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
