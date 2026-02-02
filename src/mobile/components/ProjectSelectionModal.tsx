import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Search, Clock, MapPin, ChevronDown, AlertTriangle, Calendar } from 'lucide-react';
import { useAllProjects, useCreateProject, useTodayAssignedJobs, useUserProjectAssignments } from '@/mobile/hooks/useMobileProjects';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ProjectSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelectProject: (projectId: string, projectName: string, projectAddress?: string) => void;
}

export const ProjectSelectionModal: React.FC<ProjectSelectionModalProps> = ({
  open,
  onClose,
  onSelectProject
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showOtherProjects, setShowOtherProjects] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectAddress, setNewProjectAddress] = useState('');
  const [newProjectType, setNewProjectType] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [additionalContact, setAdditionalContact] = useState('');
  const { toast } = useToast();

  // Today's assigned jobs - primary display
  const { data: todayJobs = [], isLoading: isLoadingTodayJobs } = useTodayAssignedJobs();
  
  // All projects - for fallback/other projects section
  const { data: allProjects = [], isLoading: isLoadingAllProjects } = useAllProjects(searchQuery);
  const { data: userAssignments = [] } = useUserProjectAssignments();
  
  const createProjectMutation = useCreateProject();

  const handleCreateProject = async () => {
    if (!newProjectName?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a project name.",
        variant: "destructive"
      });
      return;
    }
    if (!newProjectAddress?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a project address.",
        variant: "destructive"
      });
      return;
    }
    if (!clientName?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter client's name.",
        variant: "destructive"
      });
      return;
    }
    if (!clientPhone?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter client's phone number.",
        variant: "destructive"
      });
      return;
    }
    try {
      await createProjectMutation.mutateAsync({
        name: newProjectName.trim(),
        address: newProjectAddress.trim(),
        projectType: newProjectType || undefined,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        additionalContact: additionalContact?.trim() || undefined
      });

      // Reset form
      setNewProjectName('');
      setNewProjectAddress('');
      setNewProjectType('');
      setClientName('');
      setClientPhone('');
      setAdditionalContact('');
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  // Generate consistent colors for jobs
  const getJobColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-red-500'];
    return colors[index % colors.length];
  };

  const filteredAllProjects = allProjects?.filter(project => 
    !searchQuery || 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    project.address?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const isLoading = isLoadingTodayJobs;
  const hasTodayJobs = todayJobs.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm mx-auto h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-center text-xl font-semibold">
            Clock In - Select Job
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Today's Assignments Section */}
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Today's Assignments ({format(new Date(), 'MMM d')})
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading today's jobs...</span>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-2 pb-4">
                  {/* Today's Jobs */}
                  {hasTodayJobs ? (
                    todayJobs.map((job, index) => (
                      <button 
                        key={job.id} 
                        className="w-full flex items-start gap-3 p-4 text-left bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors border border-primary/20" 
                        onClick={() => {
                          onSelectProject(job.id, job.job_name, job.location || undefined);
                          onClose();
                        }}
                      >
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 ${job.color || getJobColor(index)} flex items-center justify-center`}>
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground truncate">
                            {job.job_name}
                          </div>
                          {job.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{job.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-primary mt-1 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(job.start_time), 'h:mm a')}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground bg-muted rounded-xl">
                      <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">No jobs assigned for today</p>
                      <p className="text-sm mt-1">Select from other projects below</p>
                    </div>
                  )}

                  {/* Other Projects Section */}
                  <Collapsible 
                    open={showOtherProjects || !hasTodayJobs} 
                    onOpenChange={setShowOtherProjects}
                    className="mt-4"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      <div className="flex items-center gap-2">
                        <span>Other Projects</span>
                        {hasTodayJobs && (
                          <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Not scheduled
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${(showOtherProjects || !hasTodayJobs) ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="space-y-2">
                      {/* Search for other projects */}
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search all projects..." 
                          value={searchQuery} 
                          onChange={e => setSearchQuery(e.target.value)} 
                          className="pl-9 bg-muted/50 border-none rounded-lg h-10 text-sm" 
                        />
                      </div>

                      {isLoadingAllProjects ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : filteredAllProjects.length > 0 ? (
                        filteredAllProjects.map((project, index) => {
                          const isAssigned = userAssignments.includes(project.id);
                          return (
                            <button 
                              key={project.id} 
                              className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted rounded-lg transition-colors border border-border" 
                              onClick={() => {
                                onSelectProject(project.id, project.name, project.address);
                                onClose();
                              }}
                            >
                              <div className={`w-8 h-8 rounded-full flex-shrink-0 bg-muted`} />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground truncate text-sm">
                                  {project.address || project.name}
                                </div>
                                {!isAssigned && (
                                  <div className="text-xs text-destructive mt-0.5 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Will notify admins
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No projects found
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-4">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-full border-2 border-border font-medium">
              Cancel
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="flex-1 h-12 rounded-full font-medium">
              Add Project
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md" onInteractOutside={e => {
          const target = e.target as HTMLElement;
          if (target.closest('.pac-container')) {
            e.preventDefault();
          }
        }}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectAddress">Address *</Label>
              <GooglePlacesAutocomplete 
                value={newProjectAddress} 
                onChange={setNewProjectAddress} 
                onPlaceSelected={place => {
                  const address = place?.formatted_address;
                  if (!address) return;
                  setNewProjectAddress(address);
                  if (address.includes(',')) {
                    const streetAddress = address.split(',')[0].trim();
                    setNewProjectName(streetAddress);
                  }
                }} 
                placeholder="Enter project address" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name *</Label>
              <Input id="projectName" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Auto-filled from address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Client's Name *</Label>
              <Input id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Enter client's name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client's Phone Number *</Label>
              <Input id="clientPhone" type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Enter client's phone number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalContact">Additional Contact</Label>
              <Input id="additionalContact" value={additionalContact} onChange={e => setAdditionalContact(e.target.value)} placeholder="Enter additional contact (optional)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type</Label>
              <Select value={newProjectType} onValueChange={setNewProjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={createProjectMutation.isPending} className="flex-1">
                {createProjectMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};