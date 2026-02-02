import React from 'react';
import { MapPin, Clock, Users, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface AgentProject {
  id: string;
  name: string;
  status: string;
  address?: string;
  project_type?: string;
  project_category?: string;
  roof_type?: string;
  customer_rating?: number;
  photo_url?: string;
  photo_tag?: string;
  team_count?: number;
  days_since_update?: number;
  photo_count?: number;
  updated_at?: string;
  is_featured?: boolean;
  labels?: string[];
}

interface AgentProjectCardProps {
  project: AgentProject;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
    case 'in_progress':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    case 'on-hold':
    case 'on_hold':
      return 'bg-orange-100 text-orange-800';
    case 'scheduled':
      return 'bg-purple-100 text-purple-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const AgentProjectCard: React.FC<AgentProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/mobile/projects/${project.id}`);
  };

  // Format last activity
  const lastActivity = project.updated_at
    ? formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })
    : project.days_since_update !== undefined
    ? `${project.days_since_update}d ago`
    : '';

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]" 
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <div className="flex gap-3">
          {/* Photo Preview */}
          <div className={cn(
            "w-24 h-24 flex-shrink-0 rounded-l-lg overflow-hidden bg-muted",
            !project.photo_url && "flex items-center justify-center"
          )}>
            {project.photo_url ? (
              <img 
                src={project.photo_url} 
                alt={project.name} 
                className="w-full h-full object-cover" 
                loading="lazy" 
              />
            ) : (
              <FolderOpen className="w-8 h-8 text-muted-foreground/50" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 py-2 pr-2 space-y-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-1.5">
              <h3 className="font-semibold text-xs text-foreground truncate flex-1 min-w-0">
                {project.name}
              </h3>
              <Badge className={cn("text-[10px] px-1.5 py-0", getStatusColor(project.status))}>
                {project.status}
              </Badge>
            </div>

            {/* Project Type */}
            {(project.project_type || project.roof_type) && (
              <div className="text-[11px] text-muted-foreground truncate">
                {project.project_category || project.project_type}
                {project.roof_type && ` • ${project.roof_type}`}
              </div>
            )}

            {/* Address - street only */}
            {project.address && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {project.address.split(',')[0]}
                </span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground gap-2">
              {lastActivity && (
                <div className="flex items-center gap-0.5 truncate">
                  <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="truncate">{lastActivity}</span>
                </div>
              )}
              {project.team_count !== undefined && project.team_count > 0 && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Users className="w-2.5 h-2.5" />
                  <span>{project.team_count}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface AgentProjectGridProps {
  projects: AgentProject[];
}

export const AgentProjectGrid: React.FC<AgentProjectGridProps> = ({ projects }) => {
  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No projects found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <AgentProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};
