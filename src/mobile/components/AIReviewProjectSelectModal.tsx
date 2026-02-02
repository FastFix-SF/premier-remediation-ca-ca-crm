import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, MapPin, Building, Sparkles, ChevronRight, Star } from 'lucide-react';
import { useMobileProjects } from '@/mobile/hooks/useMobileProjects';
import { cn } from '@/lib/utils';

interface AIReviewProjectSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: {
    id: string;
    name: string;
    address: string;
    description?: string;
    project_type?: string;
    roof_type?: string;
  }) => void;
}

export const AIReviewProjectSelectModal: React.FC<AIReviewProjectSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: projects = [], isLoading } = useMobileProjects(searchQuery);

  const handleSelectProject = (project: any) => {
    onSelectProject({
      id: project.id,
      name: project.name,
      address: project.address || '',
      description: project.description,
      project_type: project.project_type,
      roof_type: project.roof_type,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg p-0 overflow-hidden bg-gradient-to-b from-background to-muted/30 border-primary/20 rounded-2xl max-h-[85vh] flex flex-col">
        {/* Header with gradient */}
        <div className="relative px-4 pt-5 pb-3 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent shrink-0">
          <div className="absolute top-3 right-3 p-1.5 bg-gradient-to-br from-primary to-accent rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          
          <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pr-10">
            Select a Project
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose the project to generate a review QR code
          </p>

          {/* Search Input */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary/40 h-10 text-sm"
            />
          </div>
        </div>

        {/* Projects List */}
        <div className="px-3 pb-3 flex-1 min-h-0 overflow-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          <div className="space-y-1.5 py-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/10 animate-pulse" />
                    <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <Building className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {searchQuery ? 'No projects found' : 'No projects available'}
                  </p>
                  {searchQuery && (
                    <p className="text-[10px] text-muted-foreground/70">
                      Try a different search term
                    </p>
                  )}
                </div>
              ) : (
                projects.map((project: any, index: number) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    className={cn(
                      "group w-full p-3 rounded-xl text-left transition-all duration-200",
                      "bg-card hover:bg-primary/5 border border-border/50 hover:border-primary/30",
                      "hover:shadow-md hover:shadow-primary/5 active:scale-[0.98]",
                      "animate-fade-in"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Icon */}
                      <div className={cn(
                        "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200",
                        "bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20"
                      )}>
                        <Building className="h-4 w-4 text-primary" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </p>
                        {project.address && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                            <span className="text-[10px] text-muted-foreground truncate">
                              {project.address}
                            </span>
                          </div>
                        )}
                        {project.project_type && (
                          <span className={cn(
                            "inline-flex items-center gap-0.5 mt-1.5 text-[9px] font-medium uppercase tracking-wide",
                            "px-1.5 py-0.5 rounded-full",
                            "bg-accent/10 text-accent-foreground/80"
                          )}>
                            <Star className="h-2 w-2" />
                            {project.project_type}
                          </span>
                        )}
                      </div>
                      
                      {/* Arrow */}
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </button>
                ))
              )}
            </div>

          {/* Cancel Button */}
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="w-full mt-2 h-10 text-sm text-muted-foreground hover:text-foreground shrink-0"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
