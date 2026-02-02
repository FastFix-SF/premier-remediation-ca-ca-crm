import React, { useState, useMemo } from 'react';
import { useMobileTasks } from '../hooks/useMobileTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { TaskListHeader } from '../components/tasks/TaskListHeader';
import { TaskTabs } from '../components/tasks/TaskTabs';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskEmptyState } from '../components/tasks/TaskEmptyState';
import { TaskLoadingSkeleton } from '../components/tasks/TaskLoadingSkeleton';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('my-tasks');
  
  const { data: tasks, isLoading, refetch, isRefetching } = useMobileTasks();
  const { data: adminStatus } = useAdminStatus();
  const hasFullAccess = adminStatus?.isAdmin || adminStatus?.isOwner;

  // Calculate tab counts
  const tabCounts = useMemo(() => {
    if (!tasks) return { myTasks: 0, allTasks: 0, completed: 0 };
    
    const myTasks = tasks.filter(t => t.owner_id === user?.id && t.status !== 'DONE').length;
    const allTasks = tasks.filter(t => t.status !== 'DONE').length;
    const completed = tasks.filter(t => t.status === 'DONE').length;
    
    return { myTasks, allTasks, completed };
  }, [tasks, user?.id]);

  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'my-tasks', label: t('tasks.myTasks'), count: tabCounts.myTasks },
    ];
    
    if (hasFullAccess) {
      baseTabs.push({ id: 'all-tasks', label: t('tasks.all'), count: tabCounts.allTasks });
    }
    
    baseTabs.push({ id: 'completed', label: t('tasks.done'), count: tabCounts.completed });
    
    return baseTabs;
  }, [tabCounts, hasFullAccess, t]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    let filtered = tasks;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.project_name?.toLowerCase().includes(searchLower) ||
        t.owner_name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Tab filter
    switch (activeTab) {
      case 'my-tasks':
        filtered = filtered.filter(t => t.owner_id === user?.id && t.status !== 'DONE');
        break;
      case 'all-tasks':
        filtered = filtered.filter(t => t.status !== 'DONE');
        break;
      case 'completed':
        filtered = filtered.filter(t => t.status === 'DONE');
        break;
    }
    
    // Sort: blocked first, then by priority, then by due date
    return filtered.sort((a, b) => {
      // Blocked tasks first
      if (a.status === 'BLOCKED' && b.status !== 'BLOCKED') return -1;
      if (b.status === 'BLOCKED' && a.status !== 'BLOCKED') return 1;
      
      // Then by priority
      const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
      const priorityDiff = (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
                          (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      
      return 0;
    });
  }, [tasks, search, activeTab, user?.id]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with gradient accent */}
      <TaskListHeader
        search={search}
        onSearchChange={setSearch}
        taskCount={filteredTasks.length}
        isRefetching={isRefetching}
        onRefresh={() => refetch()}
      />

      {/* Custom tab pills */}
      <TaskTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Task List */}
      <div className="flex-1 overflow-auto px-4 pb-24">
        {isLoading ? (
          <TaskLoadingSkeleton />
        ) : filteredTasks.length === 0 ? (
          <TaskEmptyState type={activeTab as 'my-tasks' | 'all-tasks' | 'completed'} />
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
