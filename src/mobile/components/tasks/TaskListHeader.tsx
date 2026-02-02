import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaskListHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  taskCount: number;
  isRefetching: boolean;
  onRefresh: () => void;
}

export const TaskListHeader: React.FC<TaskListHeaderProps> = ({
  search,
  onSearchChange,
  taskCount,
  isRefetching,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="relative px-4 pt-6 pb-4">
      {/* Gradient accent background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      <div className="relative">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('tasks.title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {taskCount} {taskCount === 1 ? t('tasks.task') : t('tasks.tasks')}
            </p>
          </div>
        <Button 
          onClick={() => navigate('/mobile/tasks/new')}
          className="gap-2 rounded-full shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity text-primary-foreground"
        >
            <Plus className="w-4 h-4" />
            {t('tasks.new')}
          </Button>
        </div>
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('tasks.searchPlaceholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-xl bg-background/80 backdrop-blur-sm border-muted/50 focus-visible:ring-primary/50"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefetching}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskListHeader;
