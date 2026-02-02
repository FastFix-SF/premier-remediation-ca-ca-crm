import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Plus, ListTodo, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaskEmptyStateProps {
  type: 'my-tasks' | 'all-tasks' | 'completed';
}

export const TaskEmptyState: React.FC<TaskEmptyStateProps> = ({ type }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const content = {
    'my-tasks': {
      icon: ListTodo,
      title: t('tasks.empty.noTasksAssigned'),
      description: t('tasks.empty.noActiveTasksDescription'),
      showCreate: true,
      gradient: 'from-primary/20 to-accent/20',
    },
    'all-tasks': {
      icon: Sparkles,
      title: t('tasks.empty.allClear'),
      description: t('tasks.empty.noActiveTasksSystem'),
      showCreate: true,
      gradient: 'from-blue-500/20 to-purple-500/20',
    },
    'completed': {
      icon: CheckCircle2,
      title: t('tasks.empty.noCompletedTasks'),
      description: t('tasks.empty.completedWillAppear'),
      showCreate: false,
      gradient: 'from-emerald-500/20 to-green-500/20',
    },
  };

  const { icon: Icon, title, description, showCreate, gradient } = content[type];

  return (
    <div className="text-center py-16 px-4 animate-fade-in">
      <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Icon className="w-10 h-10 text-foreground/40" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>
      {showCreate && (
        <Button 
          variant="outline" 
          className="rounded-full gap-2 border-dashed"
          onClick={() => navigate('/mobile/tasks/new')}
        >
          <Plus className="w-4 h-4" />
          {t('tasks.empty.createTask')}
        </Button>
      )}
    </div>
  );
};

export default TaskEmptyState;
