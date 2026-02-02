import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MoreVertical, Edit, Trash2, Circle, Clock, 
  CheckCircle2, AlertTriangle, Calendar, User, FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useMobileTaskDetail, 
  useUpdateMobileTask, 
  useDeleteMobileTask,
  useToggleSubtask 
} from '../hooks/useMobileTasks';
import { toast } from 'sonner';

export const MobileTaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { data: task, isLoading } = useMobileTaskDetail(taskId);
  const updateTask = useUpdateMobileTask();
  const deleteTask = useDeleteMobileTask();
  const toggleSubtask = useToggleSubtask();

  const STATUS_OPTIONS = [
    { value: 'TODO', label: t('tasks.status.notStarted'), icon: Circle, color: 'text-muted-foreground' },
    { value: 'IN_PROGRESS', label: t('tasks.status.inProgress'), icon: Clock, color: 'text-blue-500' },
    { value: 'BLOCKED', label: t('tasks.status.blocked'), icon: AlertTriangle, color: 'text-destructive' },
    { value: 'DONE', label: t('tasks.status.done'), icon: CheckCircle2, color: 'text-green-500' },
  ];

  const handleStatusChange = (newStatus: string) => {
    if (!taskId) return;
    
    const statusLabel = STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus;
    
    updateTask.mutate({
      taskId,
      updates: {
        status: newStatus,
        completed_at: newStatus === 'DONE' ? new Date().toISOString() : null,
      },
    }, {
      onSuccess: () => toast.success(`${t('tasks.detail.statusUpdated')} ${statusLabel.toLowerCase()}`),
    });
  };

  const handleDelete = () => {
    if (!taskId) return;
    deleteTask.mutate(taskId, {
      onSuccess: () => {
        navigate('/mobile/tasks', { replace: true });
      },
    });
  };

  const handleSubtaskToggle = (subtaskId: string, currentStatus: string) => {
    toggleSubtask.mutate({ subtaskId, currentStatus });
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'P0':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'P1':
        return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
      case 'P2':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const dateLocale = language === 'es' ? es : undefined;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center gap-3 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="h-6 bg-muted rounded w-32 animate-pulse" />
        </div>
        <div className="p-4 space-y-4">
          <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-20 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center">
        <p className="text-muted-foreground">{t('tasks.detail.taskNotFound')}</p>
        <Button variant="link" onClick={() => navigate('/mobile/tasks')}>
          {t('tasks.detail.backToTasks')}
        </Button>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === task.status) || STATUS_OPTIONS[0];
  const StatusIcon = currentStatus.icon;
  const subtaskProgress = task.subtask_count > 0 
    ? (task.completed_subtasks / task.subtask_count) * 100 
    : 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-medium">{t('tasks.detail.title')}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/mobile/tasks/${taskId}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              {t('tasks.detail.editTask')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('tasks.detail.deleteTask')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-24">
        {/* Title Section */}
        <div className="p-4 bg-card border-b">
          <div className="flex items-start justify-between gap-3">
            <h1 className={`text-xl font-semibold ${task.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h1>
            <Badge variant="outline" className={getPriorityStyles(task.priority)}>
              {task.priority}
            </Badge>
          </div>
          
          {task.description && (
            <p className="mt-3 text-muted-foreground">{task.description}</p>
          )}
        </div>

        {/* Status Selector */}
        <div className="p-4 bg-card border-b">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">{t('tasks.detail.status')}</label>
          <Select value={task.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-4 h-4 ${currentStatus.color}`} />
                  <span>{currentStatus.label}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className={`w-4 h-4 ${option.color}`} />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Details */}
        <div className="p-4 space-y-4">
          {task.due_date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('tasks.detail.dueDate')}</p>
                <p className="font-medium">{format(new Date(task.due_date), 'EEEE, MMMM d, yyyy', { locale: dateLocale })}</p>
              </div>
            </div>
          )}
          
          {task.owner_name && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('tasks.detail.assignedTo')}</p>
                <p className="font-medium">{task.owner_name}</p>
              </div>
            </div>
          )}
          
          {task.project_name && (
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('tasks.detail.project')}</p>
                <p className="font-medium">{task.project_name}</p>
              </div>
            </div>
          )}

          {task.blocker_notes && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-1">{t('tasks.detail.blockerNotes')}</p>
              <p className="text-sm">{task.blocker_notes}</p>
            </div>
          )}
        </div>

        {/* Subtasks Section */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{t('tasks.subtasks')}</h3>
              <span className="text-sm text-muted-foreground">
                {task.completed_subtasks}/{task.subtask_count}
              </span>
            </div>
            <Progress value={subtaskProgress} className="h-2 mb-4" />
            
            <div className="space-y-2">
              {task.subtasks.map((subtask: any) => (
                <div 
                  key={subtask.id}
                  className="flex items-center gap-3 p-3 bg-card border rounded-lg"
                >
                  <Checkbox
                    checked={subtask.status === 'DONE'}
                    onCheckedChange={() => handleSubtaskToggle(subtask.id, subtask.status)}
                  />
                  <span className={`flex-1 ${subtask.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Complete Button */}
      {task.status !== 'DONE' && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t">
          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={() => handleStatusChange('DONE')}
          >
            <CheckCircle2 className="w-5 h-5" />
            {t('tasks.detail.markComplete')}
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tasks.detail.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tasks.detail.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('tasks.detail.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {t('tasks.detail.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MobileTaskDetailPage;
