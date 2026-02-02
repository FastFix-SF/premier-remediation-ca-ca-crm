import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, ChevronRight, CheckCircle2, Clock, 
  AlertTriangle, Circle, Sparkles
} from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { MobileTask } from '../../hooks/useMobileTasks';

interface TaskCardProps {
  task: MobileTask;
  index?: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index = 0 }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'P0':
        return {
          border: 'border-l-4 border-l-red-500',
          badge: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25',
          glow: 'shadow-red-500/10',
        };
      case 'P1':
        return {
          border: 'border-l-4 border-l-orange-400',
          badge: 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-lg shadow-orange-400/25',
          glow: 'shadow-orange-400/10',
        };
      case 'P2':
        return {
          border: 'border-l-4 border-l-blue-400',
          badge: 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-400/25',
          glow: 'shadow-blue-400/10',
        };
      default:
        return {
          border: 'border-l-4 border-l-muted-foreground/30',
          badge: 'bg-muted text-muted-foreground',
          glow: '',
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-semibold shadow-sm">
            <CheckCircle2 className="w-3 h-3" />
            {t('tasks.status.done')}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold shadow-sm animate-pulse">
            <Clock className="w-3 h-3" />
            {t('tasks.status.inProgress')}
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-semibold shadow-sm">
            <AlertTriangle className="w-3 h-3" />
            {t('tasks.status.blocked')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            <Circle className="w-3 h-3" />
            {t('tasks.status.toDo')}
          </span>
        );
    }
  };

  const getDueDateInfo = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    const days = differenceInDays(date, new Date());
    const isOverdue = isPast(date) && days !== 0;
    
    const dateLocale = language === 'es' ? es : undefined;
    
    return {
      formatted: format(date, 'MMM d', { locale: dateLocale }),
      days,
      isOverdue,
      isToday: days === 0,
      label: isOverdue 
        ? t('tasks.overdue') 
        : days === 0 
          ? t('tasks.today') 
          : days === 1 
            ? t('tasks.tomorrow') 
            : `${days}${t('tasks.daysShort')}`,
    };
  };

  const getOwnerInitials = (name: string | null) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const priorityStyles = getPriorityStyles(task.priority);
  const dueInfo = getDueDateInfo(task.due_date);
  const hasSubtasks = (task.subtask_count || 0) > 0;
  const subtaskProgress = hasSubtasks 
    ? ((task.completed_subtasks || 0) / (task.subtask_count || 1)) * 100 
    : 0;

  return (
    <div
      className={cn(
        "relative bg-card/80 backdrop-blur-sm border rounded-2xl p-4 transition-all duration-300",
        "hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
        "animate-fade-in cursor-pointer",
        priorityStyles.border,
        priorityStyles.glow && `shadow-lg ${priorityStyles.glow}`
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => navigate(`/mobile/tasks/${task.id}`)}
    >
      {/* Priority Sparkle for P0 */}
      {task.priority === 'P0' && (
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-4 h-4 text-red-500 animate-pulse" />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={cn(
              "font-semibold text-base line-clamp-2 leading-snug",
              task.status === 'DONE' && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </h3>
            <Badge className={cn("shrink-0 text-xs border-0", priorityStyles.badge)}>
              {task.priority}
            </Badge>
          </div>
          
          {/* Status badge */}
          <div className="mb-3">
            {getStatusBadge(task.status)}
          </div>
          
          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            {dueInfo && (
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                dueInfo.isOverdue 
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 animate-pulse' 
                  : dueInfo.isToday
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                    : 'bg-muted text-muted-foreground'
              )}>
                <Calendar className="w-3 h-3" />
                {dueInfo.formatted}
                {dueInfo.isOverdue && <span className="text-[10px]">({t('tasks.overdue')})</span>}
              </span>
            )}
            
            {task.owner_name && (
              <div className="flex items-center gap-1.5">
                <Avatar className="w-5 h-5 ring-2 ring-background">
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-medium">
                    {getOwnerInitials(task.owner_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {task.owner_name.split(' ')[0]}
                </span>
              </div>
            )}
            
            {task.project_name && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent/50 text-accent-foreground text-xs truncate max-w-[100px]">
                {task.project_name}
              </span>
            )}
          </div>
          
          {/* Subtask progress */}
          {hasSubtasks && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{t('tasks.subtasks')}</span>
                <span className="font-semibold text-foreground">
                  {task.completed_subtasks}/{task.subtask_count}
                </span>
              </div>
              <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                    subtaskProgress === 100 
                      ? "bg-gradient-to-r from-emerald-500 to-green-500" 
                      : "bg-gradient-to-r from-primary to-primary/70"
                  )}
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Chevron */}
        <ChevronRight className="w-5 h-5 text-muted-foreground/50 shrink-0 mt-1" />
      </div>
    </div>
  );
};

export default TaskCard;
