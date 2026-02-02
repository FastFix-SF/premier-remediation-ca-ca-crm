import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, ChevronRight } from 'lucide-react';
import { useMobileProjects, useMobileJobSchedules } from '@/mobile/hooks/useMobileProjects';
import { cn } from '@/lib/utils';

interface JobProjectSelectorProps {
  value?: string;
  onChange: (value: string | null, type?: 'project' | 'job') => void;
  className?: string;
}

const JobProjectSelector: React.FC<JobProjectSelectorProps> = ({
  value,
  onChange,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'jobs'>('projects');
  
  const { data: projects = [], isLoading: projectsLoading } = useMobileProjects(searchQuery);
  const { data: jobSchedules = [], isLoading: jobsLoading } = useMobileJobSchedules(searchQuery);

  const handleSelect = (name: string, type: 'project' | 'job') => {
    onChange(name, type);
    setOpen(false);
    setSearchQuery('');
  };

  // Color palette for items
  const colors = [
    'bg-blue-400',
    'bg-amber-400',
    'bg-purple-500',
    'bg-rose-400',
    'bg-emerald-400',
    'bg-cyan-400',
  ];

  const getColorForIndex = (index: number) => colors[index % colors.length];

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button className={cn("text-left", className)}>
                {value ? (
                  <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-2 py-0.5 truncate max-w-[110px] cursor-pointer">
                    {value}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs cursor-pointer hover:text-foreground">
                    Select...
                  </span>
                )}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          {value && (
            <TooltipContent side="top" className="max-w-[300px]">
              <p>{value}</p>
            </TooltipContent>
          )}
        </Tooltip>
      <PopoverContent 
        className="w-[320px] p-0 bg-background border shadow-lg" 
        align="start"
        sideOffset={4}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'projects' | 'jobs')} className="w-full">
          <div className="bg-muted/50 rounded-lg p-1 mx-2 mt-2">
            <TabsList variant="segmented" className="w-full grid grid-cols-2">
              <TabsTrigger variant="segmented" value="projects" className="text-sm">
                Projects
              </TabsTrigger>
              <TabsTrigger variant="segmented" value="jobs" className="text-sm">
                Shifts
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
                autoFocus
              />
            </div>
          </div>

          <TabsContent value="projects" className="m-0">
            <div className="h-[280px] overflow-y-auto">
              {projectsLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
              ) : projects.length > 0 ? (
                <div className="py-1">
                  {projects.map((project, index) => (
                    <button
                      key={project.id}
                      onClick={() => handleSelect(project.name || project.address || 'Unnamed', 'project')}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("h-3 w-3 rounded-full flex-shrink-0", getColorForIndex(index))} />
                        <span className="truncate">{project.name || project.address || 'Unnamed Project'}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No projects found</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="m-0">
            <div className="h-[280px] overflow-y-auto">
              {jobsLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
              ) : jobSchedules.length > 0 ? (
                <div className="py-1">
                  {jobSchedules.map((job, index) => (
                    <button
                      key={job.id}
                      onClick={() => handleSelect(job.job_name || job.location || 'Unnamed', 'job')}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("h-3 w-3 rounded-full flex-shrink-0", getColorForIndex(index))} />
                        <span className="truncate">{job.job_name || job.location || 'Unnamed Job'}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No shifts found</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
    </TooltipProvider>
  );
};

export default JobProjectSelector;
