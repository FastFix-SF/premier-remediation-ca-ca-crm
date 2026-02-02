import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  List,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Smartphone,
  User,
  FolderOpen,
  Flame,
  Play,
} from 'lucide-react';
import { format, differenceInDays, isPast, subDays, startOfDay, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { AddTaskModal } from '../modals/AddTaskModal';
import { TaskDetailModal } from '../modals/TaskDetailModal';
import { ProjectCalendar } from '../components/ProjectCalendar';
import { AddProjectEventModal } from '../modals/AddProjectEventModal';
import { TaskTimerWidget, startTaskTimer, getActiveTimerTaskId } from '../components/TaskTimerWidget';
import { AddTaskOptionModal } from '../modals/AddTaskOptionModal';
import { SelectExistingTaskModal } from '../modals/SelectExistingTaskModal';
import { useAvatars } from '@/hooks/useAvatars';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { XPPopup } from '../components/XPPopup';
import { useActivityTracker } from '../hooks/useActivityTracker';

interface CCTasksViewProps {
  memberId: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  owner_id: string | null;
  owner_name?: string;
  current_focus: boolean;
  estimated_duration: string | null;
  project_id: string | null;
  project_name?: string;
  subtask_count?: number;
  completed_subtasks?: number;
  source: 'command_center' | 'mobile';
}

interface TeamMember {
  user_id: string;
  full_name: string;
}

interface Project {
  id: string;
  name: string | null;
}

export const CCTasksView: React.FC<CCTasksViewProps> = ({ memberId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'mine' | 'pending' | 'completed' | 'blocked'>('mine');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<Date | null>(null);
  const [prefilledHour, setPrefilledHour] = useState<number | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(getActiveTimerTaskId());
  const [addOptionModalOpen, setAddOptionModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [selectExistingOpen, setSelectExistingOpen] = useState(false);
  const [userXP, setUserXP] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [showXPPopup, setShowXPPopup] = useState(false);
  const [xpAmount, setXPAmount] = useState(0);
  
  const { logTaskCompleted } = useActivityTracker(memberId);
  // Collect owner IDs for avatars
  const ownerIds = useMemo(() => {
    return [...new Set(tasks.map(t => t.owner_id).filter(Boolean))] as string[];
  }, [tasks]);

  const { data: avatarMap = {} } = useAvatars(ownerIds);

  const loadData = async () => {
    setLoading(true);

    // Fetch team members
    const { data: members } = await supabase
      .from('team_directory')
      .select('user_id, full_name')
      .eq('status', 'active');
    setTeamMembers(members || []);

    // Fetch projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, name')
      .order('name');
    setProjects(projectsData || []);

    // Fetch Command Center tasks (team_tasks)
    const { data: teamTasksData } = await supabase
      .from('team_tasks')
      .select('*')
      .order('current_focus', { ascending: false })
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false });

    // Fetch Mobile project tasks (project_tasks)
    const { data: projectTasksData } = await supabase
      .from('project_tasks')
      .select('*, projects(name)')
      .order('created_at', { ascending: false });

    const memberMap = new Map(members?.map((m) => [m.user_id, m.full_name]) || []);
    const projectMap = new Map(projectsData?.map((p) => [p.id, p.name]) || []);

    // Fetch subtask counts for team_tasks
    const teamTaskIds = teamTasksData?.map(t => t.id) || [];
    const { data: subtasks } = await supabase
      .from('task_subtasks')
      .select('parent_task_id, status')
      .in('parent_task_id', teamTaskIds);

    const subtaskCounts = new Map<string, { total: number; completed: number }>();
    subtasks?.forEach(s => {
      const current = subtaskCounts.get(s.parent_task_id) || { total: 0, completed: 0 };
      current.total++;
      if (s.status === 'DONE') current.completed++;
      subtaskCounts.set(s.parent_task_id, current);
    });

    // Normalize Command Center tasks
    const normalizedTeamTasks: Task[] = (teamTasksData || []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      owner_id: t.owner_id,
      owner_name: t.owner_id ? memberMap.get(t.owner_id) : undefined,
      current_focus: t.current_focus,
      estimated_duration: t.estimated_duration,
      project_id: t.project_id,
      project_name: t.project_id ? projectMap.get(t.project_id) : undefined,
      subtask_count: subtaskCounts.get(t.id)?.total || 0,
      completed_subtasks: subtaskCounts.get(t.id)?.completed || 0,
      source: 'command_center' as const,
    }));

    // Normalize Mobile project tasks
    const normalizedProjectTasks: Task[] = (projectTasksData || []).map((pt: any) => ({
      id: pt.id,
      title: pt.title,
      description: pt.description,
      status: pt.is_completed ? 'DONE' : 'TODO',
      priority: 'P2', // Default priority for mobile tasks
      due_date: pt.end_date,
      owner_id: pt.assigned_to,
      owner_name: pt.assigned_to ? memberMap.get(pt.assigned_to) : undefined,
      current_focus: false,
      estimated_duration: null,
      project_id: pt.project_id,
      project_name: pt.projects?.name || (pt.project_id ? projectMap.get(pt.project_id) : undefined),
      subtask_count: 0,
      completed_subtasks: 0,
      source: 'mobile' as const,
    }));

    // Merge both arrays (Command Center tasks first, then mobile tasks)
    const allTasks = [...normalizedTeamTasks, ...normalizedProjectTasks];
    setTasks(allTasks);

    // Fetch calendar events
    const { data: eventsData } = await supabase
      .from('project_calendar_events')
      .select('*')
      .order('event_date', { ascending: true });
    setCalendarEvents(eventsData || []);

    setLoading(false);
  };

  // Fetch gamification stats
  const fetchGamificationStats = async () => {
    if (!memberId) return;
    
    // Fetch total XP
    const { data: activityData } = await supabase
      .from('team_activity_log')
      .select('points')
      .eq('member_id', memberId);
    
    const totalXP = activityData?.reduce((sum, a) => sum + (a.points || 0), 0) || 0;
    setUserXP(totalXP);
    
    // Calculate streak (consecutive days with activity)
    const { data: streakData } = await supabase
      .from('team_activity_log')
      .select('created_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (streakData && streakData.length > 0) {
      let streak = 0;
      let checkDate = startOfDay(new Date());
      
      for (let i = 0; i < 30; i++) {
        const hasActivity = streakData.some(a => 
          isSameDay(new Date(a.created_at), checkDate)
        );
        if (hasActivity) {
          streak++;
          checkDate = subDays(checkDate, 1);
        } else if (i === 0) {
          // Today might not have activity yet
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }
      setUserStreak(streak);
    }
  };

  useEffect(() => {
    loadData();
    fetchGamificationStats();
  }, [memberId]);

  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    // Status filters
    if (filter === 'mine' && task.owner_id !== memberId) return false;
    if (filter === 'pending' && task.status === 'DONE') return false;
    if (filter === 'completed' && task.status !== 'DONE') return false;
    if (filter === 'blocked' && task.status !== 'BLOCKED') return false;
    
    // Employee filter
    if (employeeFilter === 'unassigned' && task.owner_id) return false;
    if (employeeFilter !== 'all' && employeeFilter !== 'unassigned' && task.owner_id !== employeeFilter) return false;
    
    // Project filter
    if (projectFilter === 'no-project' && task.project_id) return false;
    if (projectFilter !== 'all' && projectFilter !== 'no-project' && task.project_id !== projectFilter) return false;
    
    return true;
  });

  const handleDeleteTask = async (task: Task) => {
    if (!confirm('Delete this task?')) return;
    
    // Use correct table based on source
    const table = task.source === 'mobile' ? 'project_tasks' : 'team_tasks';
    await supabase.from(table).delete().eq('id', task.id);
    
    toast.success('Task deleted');
    loadData();
    setDetailTask(null);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'P0': return <Badge className="bg-red-500/20 text-red-300 border-0">P0</Badge>;
      case 'P1': return <Badge className="bg-orange-500/20 text-orange-300 border-0">P1</Badge>;
      case 'P2': return <Badge className="bg-blue-500/20 text-blue-300 border-0">P2</Badge>;
      default: return <Badge className="bg-white/10 text-white/60 border-0">P3</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'IN_PROGRESS': return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'BLOCKED': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Circle className="w-5 h-5 text-white/40" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="command-glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Tasks</h1>
              <p className="text-white/60">Manage your work and track progress</p>
            </div>
          </div>
          <Button
            onClick={() => { setEditTask(null); setAddModalOpen(true); }}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="command-widget p-4 border-0">
        <div className="flex flex-col gap-4">
          {/* Row 1: Search, Employee, Project, View Toggle */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            {/* Employee Filter */}
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-white/5 border-white/10 text-white">
                <User className="w-4 h-4 mr-2 text-white/40" />
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="all" className="text-white hover:bg-white/10">All Employees</SelectItem>
                <SelectItem value="unassigned" className="text-white/60 hover:bg-white/10">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id} className="text-white hover:bg-white/10">
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Project Filter */}
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full md:w-[200px] bg-white/5 border-white/10 text-white">
                <FolderOpen className="w-4 h-4 mr-2 text-white/40" />
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 max-h-[300px]">
                <SelectItem value="all" className="text-white hover:bg-white/10">All Projects</SelectItem>
                <SelectItem value="no-project" className="text-white/60 hover:bg-white/10">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="text-white hover:bg-white/10">
                    {project.name || 'Untitled Project'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl px-2 py-1.5 shadow-lg shadow-indigo-500/10">
              <span className="text-xs font-medium text-indigo-300 pl-1">View:</span>
              <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-7 px-3 gap-1.5 ${viewMode === 'list' ? 'bg-white/15 text-white shadow-sm' : 'text-white/60 hover:text-white'}`} 
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="text-xs">List</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-7 px-3 gap-1.5 ${viewMode === 'calendar' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' : 'text-white/60 hover:text-white'}`} 
                  onClick={() => setViewMode('calendar')}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs">Calendar</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Row 2: Status Filters */}
          <div className="flex gap-2 overflow-x-auto">
            {(['all', 'mine', 'pending', 'blocked', 'completed'] as const).map((f) => (
              <Button
                key={f}
                variant="ghost"
                size="sm"
                className={`whitespace-nowrap ${filter === f ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Content */}
      <Card className="command-widget p-4 border-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : viewMode === 'calendar' ? (
          <ProjectCalendar
            tasks={filteredTasks}
            events={calendarEvents}
            onTaskClick={(task) => setDetailTask(task as Task)}
            onEventClick={(event) => console.log('Event clicked:', event)}
            onDayClick={(date, hour) => { 
              setSelectedTimeSlot({ date, hour: hour || 9 });
              setAddOptionModalOpen(true);
            }}
            onAddEvent={() => setAddEventOpen(true)}
            activeTimerTaskId={activeTimerId}
            onStartTimer={(task) => {
              startTaskTimer(task.id, task.title, task.end_time);
              setActiveTimerId(task.id);
              toast.success('Timer started!');
            }}
            userXP={userXP}
            userStreak={userStreak}
          />
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="w-12 h-12 mx-auto text-white/20 mb-4" />
            <p className="text-white/60">No tasks found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'DONE';
                const daysRemaining = task.due_date ? differenceInDays(new Date(task.due_date), new Date()) : null;
                const progressPercent = task.subtask_count && task.subtask_count > 0 
                  ? Math.round((task.completed_subtasks || 0) / task.subtask_count * 100)
                  : 0;
                const isTimerActive = activeTimerId === task.id;

                return (
                  <div
                    key={task.id}
                    onClick={() => setDetailTask(task)}
                    className={`flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer ${
                      task.priority === 'P0' ? 'animate-pulse-urgency border border-orange-500/30' : ''
                    } ${task.current_focus ? 'ring-1 ring-purple-500/50' : ''} ${isTimerActive ? 'ring-2 ring-emerald-500/50' : ''}`}
                  >
                    <div className="mt-0.5 flex-shrink-0">{getStatusIcon(task.status)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h3 className={`text-white font-medium ${task.status === 'DONE' ? 'line-through opacity-60' : ''}`}>
                          {task.title}
                        </h3>
                        {getPriorityBadge(task.priority)}
                        {task.current_focus && (
                          <Badge className="bg-purple-500/20 text-purple-300 border-0 flex items-center gap-1">
                            <Flame className="w-3 h-3 animate-pulse" />
                            Focus
                          </Badge>
                        )}
                        {isTimerActive && (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-0">
                            <Play className="w-3 h-3 mr-1" />
                            Tracking
                          </Badge>
                        )}
                        {task.source === 'mobile' && (
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-0">
                            <Smartphone className="w-3 h-3 mr-1" />
                            Project Task
                          </Badge>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-white/40 text-sm mt-1 line-clamp-1">{task.description}</p>
                      )}

                      {/* Progress Bar for subtasks */}
                      {task.subtask_count && task.subtask_count > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={progressPercent} className="h-1.5 flex-1 bg-white/10" />
                          <span className="text-[10px] text-white/40">{progressPercent}%</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                        {task.project_name && (
                          <span className="flex items-center gap-1 text-indigo-300">
                            📁 {task.project_name}
                          </span>
                        )}
                        {task.owner_id && (
                          <span className="flex items-center gap-1">
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={avatarMap[task.owner_id]} alt={task.owner_name || ''} />
                              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-[8px]">
                                {task.owner_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            {task.owner_name}
                          </span>
                        )}
                        {task.due_date && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.due_date), 'MMM d')}
                            {isOverdue && <span className="font-medium">({Math.abs(daysRemaining!)}d overdue)</span>}
                            {!isOverdue && daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0 && (
                              <span className="text-yellow-400">({daysRemaining}d left)</span>
                            )}
                          </span>
                        )}
                        {task.subtask_count && task.subtask_count > 0 && (
                          <span className="flex items-center gap-1">
                            <CheckSquare className="w-3 h-3" />
                            {task.completed_subtasks}/{task.subtask_count}
                          </span>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0 h-4 capitalize ${
                            task.status === 'done' ? 'border-green-500/50 text-green-400 bg-green-500/10' :
                            task.status === 'in_progress' ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' :
                            task.status === 'blocked' ? 'border-red-500/50 text-red-400 bg-red-500/10' :
                            'border-white/20 text-white/60 bg-white/5'
                          }`}
                        >
                          {task.status?.replace('_', ' ') || 'todo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Modals */}
      <AddTaskModal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setEditTask(null); setPrefilledDate(null); setPrefilledHour(null); }}
        onSuccess={loadData}
        editTask={editTask}
        teamMembers={teamMembers}
        projects={projects}
        prefilledDate={prefilledDate}
        prefilledHour={prefilledHour}
      />

      {detailTask && (
        <TaskDetailModal
          isOpen={!!detailTask}
          onClose={() => setDetailTask(null)}
          task={detailTask}
          teamMembers={teamMembers}
          onEdit={() => { setEditTask(detailTask); setAddModalOpen(true); setDetailTask(null); }}
          onDelete={() => handleDeleteTask(detailTask)}
          onRefresh={loadData}
        />
      )}

      {/* Add Event Modal */}
      <AddProjectEventModal
        isOpen={addEventOpen}
        onClose={() => { setAddEventOpen(false); setPrefilledDate(null); }}
        onSuccess={loadData}
        teamMembers={teamMembers}
        projects={projects}
        prefilledDate={prefilledDate}
      />

      {/* Add Task Option Modal */}
      <AddTaskOptionModal
        isOpen={addOptionModalOpen}
        onClose={() => setAddOptionModalOpen(false)}
        selectedTime={selectedTimeSlot}
        onCreateNew={() => {
          setAddOptionModalOpen(false);
          setPrefilledDate(selectedTimeSlot?.date || null);
          setPrefilledHour(selectedTimeSlot?.hour || null);
          setEditTask(null);
          setAddModalOpen(true);
        }}
        onScheduleExisting={() => {
          setAddOptionModalOpen(false);
          setSelectExistingOpen(true);
        }}
      />

      {/* Select Existing Task Modal */}
      <SelectExistingTaskModal
        isOpen={selectExistingOpen}
        onClose={() => setSelectExistingOpen(false)}
        onSuccess={loadData}
        tasks={tasks}
        selectedTime={selectedTimeSlot}
      />

      {/* Timer Widget */}
      <TaskTimerWidget
        onComplete={(taskId, elapsedMs) => {
          console.log('Timer completed:', taskId, elapsedMs);
          setActiveTimerId(null);
          // Show XP popup
          setXPAmount(2);
          setShowXPPopup(true);
          loadData();
          fetchGamificationStats();
        }}
        onDiscard={() => setActiveTimerId(null)}
      />

      {/* XP Popup Animation */}
      <XPPopup
        points={xpAmount}
        isVisible={showXPPopup}
        onComplete={() => setShowXPPopup(false)}
      />
    </div>
  );
};
