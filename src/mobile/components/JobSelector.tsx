import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Clock, MapPin, ChevronDown } from 'lucide-react';
import { useMobileProjects, useMobileJobSchedules } from '@/mobile/hooks/useMobileProjects';
import { format } from 'date-fns';

// Helper function to format address to only show street and city
const formatAddressShort = (address: string | null | undefined): string => {
  if (!address) return '';
  
  // Split by comma and take first two parts (street address and city)
  const parts = address.split(',').map(part => part.trim());
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`;
  }
  return parts[0] || address;
};

interface JobSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
export const JobSelector: React.FC<JobSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select a job'
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const {
    data: projects,
    isLoading: isLoadingProjects
  } = useMobileProjects(searchQuery);
  const {
    data: jobSchedules,
    isLoading: isLoadingJobs
  } = useMobileJobSchedules(jobSearchQuery);
  const getProjectColor = (index: number) => {
    const colors = ['bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-indigo-500', 'bg-red-500'];
    return colors[index % colors.length];
  };
  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setSearchQuery('');
    setJobSearchQuery('');
  };
  const filteredProjects = projects?.filter(project => !searchQuery || project.name.toLowerCase().includes(searchQuery.toLowerCase()) || project.address?.toLowerCase().includes(searchQuery.toLowerCase())) || [];
  return <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="w-full h-9 justify-between text-left font-normal px-3">
        <span className="truncate text-sm flex-1 mr-2">
          {value || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-sm mx-auto h-[70vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-center text-lg font-semibold">
              Select Job
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="projects" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pb-3">
              <div className="bg-muted/50 rounded-xl p-1.5">
                <TabsList variant="segmented" className="w-full grid grid-cols-2">
                  <TabsTrigger variant="segmented" value="projects">Projects</TabsTrigger>
                  <TabsTrigger variant="segmented" value="job-lists">Shifts</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="projects" className="flex-1 flex flex-col overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden m-0 focus-visible:outline-none">
              {/* Search Bar */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search projects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-muted/50 border-none rounded-xl h-10" />
                </div>
              </div>

              {/* Projects List */}
              <div className="flex-1 overflow-hidden px-4">
                {isLoadingProjects ? <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div> : <ScrollArea className="h-full">
                    <div className="space-y-1 pb-4">
                      {filteredProjects.length > 0 ? filteredProjects.map((project, index) => <button key={project.id} type="button" className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted rounded-lg transition-colors" onClick={() => handleSelect(formatAddressShort(project.address) || project.name)}>
                            <div className={`w-6 h-6 rounded-full flex-shrink-0 ${getProjectColor(index)}`} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-foreground truncate">
                                {formatAddressShort(project.address) || project.name}
                              </div>
                            </div>
                          </button>) : <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">No projects found</p>
                        </div>}
                    </div>
                  </ScrollArea>}
              </div>
            </TabsContent>

            <TabsContent value="job-lists" className="flex-1 flex flex-col overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden m-0 focus-visible:outline-none">
              {/* Search Bar */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search jobs..." value={jobSearchQuery} onChange={e => setJobSearchQuery(e.target.value)} className="pl-10 bg-muted/50 border-none rounded-xl h-10" />
                </div>
              </div>

              {/* Job Lists */}
              <div className="flex-1 overflow-hidden px-4">
                {isLoadingJobs ? <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div> : jobSchedules && jobSchedules.length > 0 ? <ScrollArea className="h-full">
                    <div className="space-y-1 pb-4">
                      {jobSchedules.map(job => <button key={job.id} type="button" className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted rounded-lg transition-colors" onClick={() => handleSelect(job.job_name)}>
                          <div className={`w-6 h-6 rounded-full flex-shrink-0 ${job.color || 'bg-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">
                              {job.job_name}
                            </div>
                            {job.location && <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{formatAddressShort(job.location)}</span>
                              </div>}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{format(new Date(job.start_time), 'MMM d, h:mm a')}</span>
                            </div>
                          </div>
                        </button>)}
                    </div>
                  </ScrollArea> : <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No shifts found</p>
                  </div>}
              </div>
            </TabsContent>
          </Tabs>

          {/* Cancel Button */}
          <div className="p-4 pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full h-10 rounded-full">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>;
};