import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircle2,
  Circle,
  Play,
  MoreVertical,
  Edit,
  Trash2,
  Link,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAvatars } from '@/hooks/useAvatars';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface TeamMember {
  user_id: string;
  full_name: string;
}

interface SubtaskItemProps {
  subtask: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    assigned_to: string | null;
    completed_at: string | null;
    completed_by: string | null;
    proof_url: string | null;
    proof_description: string | null;
  };
  teamMembers: TeamMember[];
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
}

export const SubtaskItem: React.FC<SubtaskItemProps> = ({
  subtask,
  teamMembers,
  onComplete,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = subtask.status === 'DONE';
  const isInProgress = subtask.status === 'IN_PROGRESS';

  const assignee = teamMembers.find(m => m.user_id === subtask.assigned_to);
  const completedByMember = teamMembers.find(m => m.user_id === subtask.completed_by);

  // Fetch avatars
  const userIds = useMemo(() => {
    const ids: string[] = [];
    if (subtask.assigned_to) ids.push(subtask.assigned_to);
    if (subtask.completed_by) ids.push(subtask.completed_by);
    return ids;
  }, [subtask.assigned_to, subtask.completed_by]);

  const { data: avatarMap = {} } = useAvatars(userIds);

  const handleCheckboxChange = () => {
    if (!isCompleted) {
      onComplete();
    } else {
      onStatusChange('TODO');
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isCompleted
          ? 'bg-green-500/5 border-green-500/20'
          : isInProgress
          ? 'bg-yellow-500/5 border-yellow-500/20'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="pt-0.5">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleCheckboxChange}
            className={isCompleted ? 'border-green-500 data-[state=checked]:bg-green-500' : ''}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`text-sm font-medium ${isCompleted ? 'line-through text-white/50' : 'text-white'}`}>
                {subtask.title}
              </p>
              
              {/* Status & Assignee row */}
              <div className="flex items-center gap-3 mt-1">
                {isInProgress && (
                  <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-300 border-yellow-500/30">
                    <Play className="w-2.5 h-2.5 mr-1" />
                    In Progress
                  </Badge>
                )}
                
                {assignee && (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={avatarMap[subtask.assigned_to!]} alt={assignee.full_name} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-[8px]">
                        {assignee.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-white/40">{assignee.full_name}</span>
                  </div>
                )}

                {subtask.proof_url && (
                  <a
                    href={subtask.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Link className="w-3 h-3" />
                    Proof
                  </a>
                )}
              </div>

              {/* Completed by info */}
              {isCompleted && completedByMember && (
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-white/40">
                    Completed by {completedByMember.full_name}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {subtask.description && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white/40 hover:text-white"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40 hover:text-white">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-white/10">
                  {!isCompleted && !isInProgress && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange('IN_PROGRESS')}
                      className="text-white hover:bg-white/10"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </DropdownMenuItem>
                  )}
                  {isInProgress && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange('TODO')}
                      className="text-white hover:bg-white/10"
                    >
                      <Circle className="w-4 h-4 mr-2" />
                      Pause
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onEdit} className="text-white hover:bg-white/10">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={onDelete} className="text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Expanded description */}
          {expanded && subtask.description && (
            <div className="mt-2 p-2 bg-white/5 rounded text-xs text-white/60">
              {subtask.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
