import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  User,
  Flag,
  Link,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  ExternalLink,
  Timer,
  Play,
  Check,
  Paperclip,
  FileText,
  Image,
  Download,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { SubtaskItem } from '../components/SubtaskItem';
import { TaskComments } from '../components/TaskComments';
import { AddSubtaskModal } from './AddSubtaskModal';
import { SubmitProofModal } from './SubmitProofModal';
import { useAvatars } from '@/hooks/useAvatars';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { startTaskTimer, getActiveTimerTaskId } from '../components/TaskTimerWidget';

interface TeamMember {
  user_id: string;
  full_name: string;
}

interface Subtask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  order_index: number;
  assigned_to: string | null;
  completed_at: string | null;
  completed_by: string | null;
  proof_url: string | null;
  proof_description: string | null;
}

interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string | null;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  teamMembers: TeamMember[];
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  teamMembers,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('subtasks');
  const [addSubtaskOpen, setAddSubtaskOpen] = useState(false);
  const [editSubtask, setEditSubtask] = useState<Subtask | null>(null);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofSubtaskId, setProofSubtaskId] = useState<string | null>(null);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(getActiveTimerTaskId());
  const [localStatus, setLocalStatus] = useState<string>(task?.status || 'NOT_STARTED');

  // Sync local status when task prop changes
  useEffect(() => {
    if (task?.status) {
      setLocalStatus(task.status);
    }
  }, [task?.status]);

  // Listen for timer changes across components
  useEffect(() => {
    const handleStorageChange = () => {
      setActiveTimerTaskId(getActiveTimerTaskId());
    };
    window.addEventListener('storage', handleStorageChange);
    // Also check on interval for same-tab updates
    const interval = setInterval(() => {
      setActiveTimerTaskId(getActiveTimerTaskId());
    }, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Get avatar for task owner
  const userIds = useMemo(() => {
    const ids: string[] = [];
    if (task?.owner_id) ids.push(task.owner_id);
    return ids;
  }, [task]);
  
  const { data: avatarMap = {} } = useAvatars(userIds);

  useEffect(() => {
    if (isOpen && task?.id) {
      fetchSubtasks();
      fetchAttachments();
    }
  }, [isOpen, task?.id]);

  const fetchAttachments = async () => {
    if (!task?.id) return;
    const { data, error } = await (supabase
      .from('task_attachments' as any)
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false }) as any);

    if (error) {
      console.error('Error fetching attachments:', error);
    } else {
      setAttachments(data || []);
    }
  };

  const fetchSubtasks = async () => {
    if (!task?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('task_subtasks')
      .select('*')
      .eq('parent_task_id', task.id)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching subtasks:', error);
    } else {
      setSubtasks(data || []);
    }
    setLoading(false);
  };

  const completedSubtasks = subtasks.filter(s => s.status === 'DONE').length;
  const totalSubtasks = subtasks.length;
  const progressPercent = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'P0': return { color: 'bg-red-500/20 text-red-300', label: 'Critical' };
      case 'P1': return { color: 'bg-orange-500/20 text-orange-300', label: 'High' };
      case 'P2': return { color: 'bg-blue-500/20 text-blue-300', label: 'Medium' };
      case 'P3': return { color: 'bg-gray-500/20 text-gray-300', label: 'Low' };
      default: return { color: 'bg-gray-500/20 text-gray-300', label: priority };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DONE': return { icon: CheckCircle2, color: 'text-green-400', label: 'Complete' };
      case 'IN_PROGRESS': return { icon: Clock, color: 'text-yellow-400', label: 'In Progress' };
      case 'BLOCKED': return { icon: AlertTriangle, color: 'text-red-400', label: 'Blocked' };
      default: return { icon: Circle, color: 'text-white/40', label: 'Not Started' };
    }
  };

  const getDueDateIndicator = () => {
    if (!task?.due_date) return null;
    
    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateNormalized = new Date(dueDate);
    dueDateNormalized.setHours(0, 0, 0, 0);
    
    const daysDiff = differenceInDays(dueDateNormalized, today);
    
    if (task?.status === 'DONE') {
      return { text: 'Completed', color: 'text-emerald-400' };
    }
    
    if (daysDiff < 0) {
      const daysOverdue = Math.abs(daysDiff);
      return { 
        text: `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`, 
        color: 'text-red-400 font-medium'
      };
    }
    
    if (daysDiff === 0) {
      return { text: 'Due today', color: 'text-yellow-400 font-medium' };
    }
    
    if (daysDiff === 1) {
      return { text: 'Due tomorrow', color: 'text-yellow-400' };
    }
    
    if (daysDiff <= 3) {
      return { text: `${daysDiff} days left`, color: 'text-orange-400' };
    }
    
    return { text: `${daysDiff} days left`, color: 'text-white/60' };
  };

  const handleStartTimer = () => {
    if (!task) return;
    startTaskTimer(task.id, task.title, task.end_time);
    toast.success('Timer started');
    onClose();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!task?.id) return;
    // Update local state immediately for instant feedback
    setLocalStatus(newStatus);
    try {
      const { error } = await supabase
        .from('team_tasks')
        .update({ status: newStatus })
        .eq('id', task.id);
      
      if (error) throw error;
      toast.success(`Task marked as ${newStatus === 'DONE' ? 'complete' : newStatus.toLowerCase().replace('_', ' ')}`);
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
      // Revert on error
      setLocalStatus(task?.status || 'NOT_STARTED');
    }
  };

  const handleMarkComplete = async () => {
    await handleStatusChange('DONE');
  };

  const handleSubtaskComplete = async (subtaskId: string, requiresProof: boolean) => {
    if (requiresProof) {
      setProofSubtaskId(subtaskId);
      setProofModalOpen(true);
    } else {
      await updateSubtaskStatus(subtaskId, 'DONE');
    }
  };

  const updateSubtaskStatus = async (subtaskId: string, status: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const updates: any = { status };
    
    if (status === 'DONE') {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = userData.user?.id || null;
    } else {
      updates.completed_at = null;
      updates.completed_by = null;
    }

    await supabase
      .from('task_subtasks')
      .update(updates)
      .eq('id', subtaskId);

    fetchSubtasks();
    onRefresh();
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    await supabase.from('task_subtasks').delete().eq('id', subtaskId);
    fetchSubtasks();
    toast.success('Subtask deleted');
  };

  const handleProofSubmit = async (proofUrl: string, proofDescription: string) => {
    if (!proofSubtaskId) return;

    const { data: userData } = await supabase.auth.getUser();
    
    await supabase
      .from('task_subtasks')
      .update({
        status: 'DONE',
        completed_at: new Date().toISOString(),
        completed_by: userData.user?.id || null,
        proof_url: proofUrl,
        proof_description: proofDescription,
      })
      .eq('id', proofSubtaskId);

    setProofModalOpen(false);
    setProofSubtaskId(null);
    fetchSubtasks();
    onRefresh();
    toast.success('Subtask completed with proof');
  };

  const ownerName = teamMembers.find(m => m.user_id === task?.owner_id)?.full_name;
  const priorityConfig = getPriorityConfig(task?.priority || 'P2');
  const statusConfig = getStatusConfig(localStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl bg-slate-900 border-white/10 text-white max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl font-semibold mb-2">
                  {task?.title}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={priorityConfig.color}>
                    <Flag className="w-3 h-3 mr-1" />
                    {task?.priority}
                  </Badge>
                  <Select value={localStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className={`w-auto h-6 border-0 ${statusConfig.color} bg-white/5 text-xs px-2 gap-1`}>
                      <StatusIcon className="w-3 h-3" />
                      <SelectValue>{statusConfig.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 z-[10001]">
                      <SelectItem value="NOT_STARTED" className="text-white">Not Started</SelectItem>
                      <SelectItem value="IN_PROGRESS" className="text-white">In Progress</SelectItem>
                      <SelectItem value="BLOCKED" className="text-white">Blocked</SelectItem>
                      <SelectItem value="DONE" className="text-white">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  {task?.current_focus && (
                    <Badge className="bg-purple-500/20 text-purple-300">
                      🎯 Focus
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {/* Mark Complete Button */}
                {task?.status !== 'DONE' && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleMarkComplete}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Complete
                  </Button>
                )}
                {/* Start Timer Button */}
                {activeTimerTaskId !== task?.id && task?.status !== 'DONE' && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleStartTimer}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Timer
                  </Button>
                )}
                {activeTimerTaskId === task?.id && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 animate-pulse flex items-center">
                    <Timer className="w-3 h-3 mr-1" />
                    Running
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onEdit}
                  className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border-indigo-500/30"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Task Info */}
            <div className="grid grid-cols-3 gap-4 py-4 border-b border-white/10">
              {/* Owner */}
              <div className="flex items-center gap-3">
                {task?.owner_id ? (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={avatarMap[task.owner_id]} alt={ownerName || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs">
                      {ownerName?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-white/40" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-white/40">Assignee</p>
                  <p className="text-sm text-white">{ownerName || 'Unassigned'}</p>
                </div>
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white/60" />
                </div>
                <div>
                  <p className="text-xs text-white/40">Due Date</p>
                  <p className="text-sm text-white">
                    {task?.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
                    {task?.due_date && new Date(task.due_date).getHours() !== 0 && (
                      <> at {format(new Date(task.due_date), 'h:mm a')}</>
                    )}
                  </p>
                  {getDueDateIndicator() && (
                    <p className={`text-xs mt-0.5 ${getDueDateIndicator()?.color}`}>
                      {getDueDateIndicator()?.text}
                    </p>
                  )}
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white/60" />
                </div>
                <div>
                  <p className="text-xs text-white/40">Size</p>
                  <p className="text-sm text-white">{task?.estimated_duration || 'M'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {task?.description && (
              <div className="py-4 border-b border-white/10">
                <p className="text-sm text-white/80">{task.description}</p>
              </div>
            )}

            {/* Blocker Notes - Red warning box when task is blocked */}
            {task?.status === 'BLOCKED' && task?.blocker_notes && (
              <div className="py-4 border-b border-white/10">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-400 mb-1">Blocked</h4>
                      <p className="text-sm text-white/80">{task.blocker_notes}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Document Link */}
            {task?.document_url && (
              <div className="py-3 border-b border-white/10">
                <a
                  href={task.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
                >
                  <Link className="w-4 h-4" />
                  {task.document_title || 'View Document'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="py-4 border-b border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="w-4 h-4 text-white/60" />
                  <span className="text-sm font-medium text-white/80">Attachments ({attachments.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachments.map((attachment) => {
                    const isImage = attachment.file_type?.startsWith('image/');
                    const formatFileSize = (bytes: number | null) => {
                      if (!bytes) return '';
                      if (bytes < 1024) return `${bytes} B`;
                      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                    };
                    
                    return (
                      <a
                        key={attachment.id}
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all overflow-hidden"
                      >
                        {isImage ? (
                          <div className="aspect-video relative">
                            <img
                              src={attachment.file_url}
                              alt={attachment.file_name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <Download className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video flex flex-col items-center justify-center p-3 gap-2">
                            <FileText className="w-8 h-8 text-white/40" />
                            <Download className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                        <div className="p-2 border-t border-white/10">
                          <p className="text-xs text-white truncate">{attachment.file_name}</p>
                          {attachment.file_size && (
                            <p className="text-xs text-white/40">{formatFileSize(attachment.file_size)}</p>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {totalSubtasks > 0 && (
              <div className="py-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">Progress</span>
                  <span className="text-sm text-white">{completedSubtasks}/{totalSubtasks} subtasks</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="bg-white/5 w-full justify-start border-b border-white/10 rounded-none">
                <TabsTrigger value="subtasks" className="data-[state=active]:bg-white/10">
                  Subtasks ({totalSubtasks})
                </TabsTrigger>
                <TabsTrigger value="comments" className="data-[state=active]:bg-white/10">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Comments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subtasks" className="flex-1 overflow-hidden m-0">
                <div className="py-3">
                  <Button
                    size="sm"
                    onClick={() => setAddSubtaskOpen(true)}
                    className="bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Subtask
                  </Button>
                </div>
                <ScrollArea className="h-[250px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-20">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  ) : subtasks.length === 0 ? (
                    <div className="text-center py-8 text-white/40">
                      No subtasks yet. Add one to break down this task.
                    </div>
                  ) : (
                    <div className="space-y-2 pr-4">
                      {subtasks.map((subtask) => (
                        <SubtaskItem
                          key={subtask.id}
                          subtask={subtask}
                          teamMembers={teamMembers}
                          onComplete={() => handleSubtaskComplete(subtask.id, true)}
                          onEdit={() => {
                            setEditSubtask(subtask);
                            setAddSubtaskOpen(true);
                          }}
                          onDelete={() => handleDeleteSubtask(subtask.id)}
                          onStatusChange={(status) => updateSubtaskStatus(subtask.id, status)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="comments" className="flex-1 overflow-hidden m-0">
                <TaskComments taskId={task?.id} teamMembers={teamMembers} />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <AddSubtaskModal
        isOpen={addSubtaskOpen}
        onClose={() => {
          setAddSubtaskOpen(false);
          setEditSubtask(null);
        }}
        onSuccess={fetchSubtasks}
        taskId={task?.id}
        editSubtask={editSubtask}
        teamMembers={teamMembers}
        existingCount={subtasks.length}
      />

      <SubmitProofModal
        isOpen={proofModalOpen}
        onClose={() => {
          setProofModalOpen(false);
          setProofSubtaskId(null);
        }}
        onSubmit={handleProofSubmit}
      />
    </>
  );
};
