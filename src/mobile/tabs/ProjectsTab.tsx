import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MapPin, Clock, Users, FolderOpen, Filter, X, Wrench, Images } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GooglePlacesAutocomplete } from '@/components/ui/google-places-autocomplete';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMobileProjects, useCreateProject, useMobileJobSchedules } from '@/mobile/hooks/useMobileProjects';
import { MobileProject } from '@/shared/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMobilePermissions } from '@/mobile/hooks/useMobilePermissions';
import { DEFAULT_LABELS, getAllLabels } from '@/mobile/constants/labels';
import { useServiceTickets, TICKET_STATUSES } from '@/hooks/useServiceTickets';
import { LabelBadges } from '@/mobile/components/LabelBadges';

export const ProjectsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectAddress, setNewProjectAddress] = useState('');
  const [newProjectType, setNewProjectType] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [additionalContact, setAdditionalContact] = useState('');
  const [activeTab, setActiveTab] = useState('projects');
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { hasFullAccess, isSalesRole, projectPermissions } = useMobilePermissions();
  const canCreateProjects = hasFullAccess || projectPermissions.canCreateProjects;
  const {
    data: projects = [],
    isLoading,
    error
  } = useMobileProjects(searchQuery);
  const createProjectMutation = useCreateProject();
  const { data: jobSchedules, isLoading: isLoadingJobs } = useMobileJobSchedules(jobSearchQuery);
  const { data: serviceTickets = [], isLoading: isLoadingTickets } = useServiceTickets();

  // Filter tickets by search query
  const filteredTickets = serviceTickets.filter(ticket => {
    if (!ticketSearchQuery) return true;
    const query = ticketSearchQuery.toLowerCase();
    return (
      ticket.title?.toLowerCase().includes(query) ||
      ticket.ticket_number?.toLowerCase().includes(query) ||
      ticket.service_address?.toLowerCase().includes(query) ||
      ticket.service_city?.toLowerCase().includes(query) ||
      ticket.customer?.name?.toLowerCase().includes(query)
    );
  });

  const getTicketStatusColor = (status: string) => {
    const statusConfig = TICKET_STATUSES.find(s => s.key === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getTicketStatusLabel = (status: string) => {
    const statusConfig = TICKET_STATUSES.find(s => s.key === status);
    return statusConfig?.label || status;
  };

  const handleCreateProject = async () => {
    if (!newProjectName?.trim()) {
      toast({
        title: t('projects.missingInfo'),
        description: t('projects.enterProjectName'),
        variant: "destructive"
      });
      return;
    }
    if (!newProjectAddress?.trim()) {
      toast({
        title: t('projects.missingInfo'),
        description: t('projects.enterProjectAddress'),
        variant: "destructive"
      });
      return;
    }
    if (!clientName?.trim()) {
      toast({
        title: t('projects.missingInfo'),
        description: t('projects.enterClientName'),
        variant: "destructive"
      });
      return;
    }
    if (!clientPhone?.trim()) {
      toast({
        title: t('projects.missingInfo'),
        description: t('projects.enterClientPhone'),
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

  const filteredProjects = projects.filter(project => {
    // Apply label filter first
    if (selectedLabelFilter && (!project.labels || !project.labels.includes(selectedLabelFilter))) {
      return false;
    }
    
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    
    // Search by name, code, or address
    if (project.name?.toLowerCase().includes(query) || 
        project.code?.toLowerCase().includes(query) || 
        project.address?.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search by client name
    if (project.client_name?.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search by label name
    if (project.labels && project.labels.length > 0) {
      const matchingLabel = project.labels.some(labelId => {
        const labelConfig = DEFAULT_LABELS.find(l => l.id === labelId);
        return labelConfig?.name.toLowerCase().includes(query);
      });
      if (matchingLabel) return true;
    }
    
    return false;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 flex-1 overflow-y-auto">
        <Tabs defaultValue="projects" className="w-full h-full flex flex-col" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="bg-muted/50 rounded-lg p-1">
              <TabsList variant="segmented" className="h-8">
                <TabsTrigger variant="segmented" value="projects" className="text-xs px-2 py-1">{t('projects.title')}</TabsTrigger>
                <TabsTrigger variant="segmented" value="job-lists" className="text-xs px-2 py-1">{t('projects.jobLists')}</TabsTrigger>
                <TabsTrigger variant="segmented" value="s-tickets" className="text-xs px-2 py-1">{t('projects.sTickets')}</TabsTrigger>
              </TabsList>
            </div>
            
            {activeTab === 'job-lists' ? (
              <Button 
                size="sm" 
                className="rounded-full w-10 h-10 p-0"
                onClick={() => navigate('/mobile/create-task')}
              >
                <Plus className="w-4 h-4" />
              </Button>
            ) : canCreateProjects ? (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-full w-10 h-10 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
              <DialogContent 
                className="sm:max-w-md"
                onInteractOutside={(e) => {
                  // Prevent closing when clicking on Google Places autocomplete
                  const target = e.target as HTMLElement;
                  if (target.closest('.pac-container')) {
                    e.preventDefault();
                  }
                }}
              >
                <DialogHeader>
                  <DialogTitle>{t('projects.createNew')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectAddress">{t('projects.address')} *</Label>
                    <GooglePlacesAutocomplete
                      value={newProjectAddress}
                      onChange={(address) => {
                        setNewProjectAddress(address);
                        
                        // Auto-populate project name from address (remove state and zip)
                        if (address && address.includes(',')) {
                          const addressParts = address.split(',').map(part => part.trim());
                          // Remove last two parts (typically state and zip)
                          const projectNameParts = addressParts.slice(0, -2);
                          if (projectNameParts.length > 0) {
                            setNewProjectName(projectNameParts.join(', '));
                          }
                        }
                      }}
                      onPlaceSelected={(place) => {
                        const address = place?.description;
                        if (!address) return;
                        
                        setNewProjectAddress(address);
                        
                        // Auto-populate project name from address (remove state and zip)
                        if (address.includes(',')) {
                          const addressParts = address.split(',').map(part => part.trim());
                          // Remove last two parts (typically state and zip)
                          const projectNameParts = addressParts.slice(0, -2);
                          if (projectNameParts.length > 0) {
                            setNewProjectName(projectNameParts.join(', '));
                          }
                        }
                      }}
                      placeholder={t('projects.enterAddress')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectName">{t('projects.projectName')} *</Label>
                    <Input id="projectName" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder={t('projects.autoFilled')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientName">{t('projects.clientName')} *</Label>
                    <Input id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} placeholder={t('projects.enterClientNamePlaceholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">{t('projects.clientPhone')} *</Label>
                    <Input id="clientPhone" type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder={t('projects.enterClientPhonePlaceholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additionalContact">{t('projects.additionalContact')}</Label>
                    <Input id="additionalContact" value={additionalContact} onChange={e => setAdditionalContact(e.target.value)} placeholder={t('projects.enterAdditionalContact')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectType">{t('projects.projectType')}</Label>
                    <Select value={newProjectType} onValueChange={setNewProjectType}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('projects.selectProjectType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">{t('projects.residential')}</SelectItem>
                        <SelectItem value="commercial">{t('projects.commercial')}</SelectItem>
                        <SelectItem value="industrial">{t('projects.industrial')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleCreateProject} disabled={createProjectMutation.isPending} className="flex-1">
                      {createProjectMutation.isPending ? t('projects.creating') : t('common.create')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            ) : null}
          </div>
        
          <TabsContent value="projects" className="mt-0 space-y-4 flex-1 overflow-y-auto">
            {/* Search and Filter */}
            <div className="flex gap-2 flex-shrink-0 items-center">
              {/* All Photos Gallery Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-shrink-0 h-10 w-10 p-0 rounded-full bg-primary/10 hover:bg-primary/20"
                onClick={() => navigate('/mobile/all-photos')}
              >
                <Images className="w-5 h-5 text-primary" />
              </Button>
              
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t('projects.searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-shrink-0 h-8 w-8 p-0"
                  >
                    <Filter className={`w-3.5 h-3.5 ${selectedLabelFilter ? 'text-foreground' : 'text-muted-foreground'}`} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-sm font-medium">{t('projects.filterByLabel')}</span>
                      {selectedLabelFilter && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-1.5 text-xs"
                          onClick={() => setSelectedLabelFilter(null)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    {selectedLabelFilter && (
                      <div className="px-2 py-1 mb-1">
                        <Badge 
                          className="text-xs text-white"
                          style={{ backgroundColor: DEFAULT_LABELS.find(l => l.id === selectedLabelFilter)?.color }}
                        >
                          {DEFAULT_LABELS.find(l => l.id === selectedLabelFilter)?.name}
                        </Badge>
                      </div>
                    )}
                    <div className="max-h-64 overflow-y-auto space-y-0.5">
                      {DEFAULT_LABELS.map(label => (
                        <Button
                          key={label.id}
                          variant={selectedLabelFilter === label.id ? "secondary" : "ghost"}
                          className="w-full justify-start text-xs h-8 px-2"
                          onClick={() => setSelectedLabelFilter(
                            selectedLabelFilter === label.id ? null : label.id
                          )}
                        >
                          <span 
                            className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="truncate">{label.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Project List */}
            <div className="space-y-3 pb-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('projects.loading')}</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  <p>{t('projects.loadError')}</p>
                </div>
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map(project => (
                  <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/mobile/projects/${project.id}`)}>
                    <CardContent className="p-0">
                      <div className="flex gap-3">
                        {/* Photo Preview */}
                        {project.bestPhotoUrl && (
                          <div className="w-24 h-24 flex-shrink-0 rounded-l-lg overflow-hidden bg-muted">
                            <img src={project.bestPhotoUrl} alt={project.name} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className={`flex-1 py-2 space-y-1 min-w-0 ${project.bestPhotoUrl ? 'pr-2' : 'px-2'}`}>
                          {/* Header */}
                          <div className="flex items-center justify-between gap-1.5">
                            <h3 className="font-semibold text-xs text-foreground truncate flex-1 min-w-0">
                              {project.name}
                            </h3>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <LabelBadges labelIds={project.labels || []} maxVisible={2} />
                              <Badge className={`${getStatusColor(project.status)} text-[10px] px-1.5 py-0`}>
                                {project.status}
                              </Badge>
                            </div>
                          </div>

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
                            <div className="flex items-center gap-0.5 truncate">
                              <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate">{project.lastActivity}</span>
                            </div>
                            {project.teamSize && (
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <Users className="w-2.5 h-2.5" />
                                <span>{project.teamSize}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-12 h-12 mx-auto mb-4 opacity-50 flex items-center justify-center">
                    <FolderOpen className="w-8 h-8" />
                  </div>
                  <p>{t('projects.noProjects')}</p>
                  {searchQuery && <p className="text-sm">{t('projects.tryAdjusting')}</p>}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="job-lists" className="mt-0 space-y-4 flex-1 overflow-y-auto">
            {/* Search */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={t('projects.searchJobLists')} 
                value={jobSearchQuery} 
                onChange={e => setJobSearchQuery(e.target.value)} 
                className="pl-10" 
              />
            </div>

            {/* Job Lists */}
            <div className="space-y-3 pb-4">
              {isLoadingJobs ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('projects.loadingJobs')}</p>
                </div>
              ) : jobSchedules && jobSchedules.length > 0 ? (
                jobSchedules.map(job => (
                  <Card 
                    key={job.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/mobile/shift/${job.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: job.color || '#6366f1' }}
                        >
                          {job.job_name.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-foreground truncate">
                            {job.job_name}
                          </h3>
                          
                          {job.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{job.location}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span>{format(new Date(job.start_time), 'MMM d, h:mm a')}</span>
                          </div>
                          
                          {job.status && (
                            <Badge className={`${getStatusColor(job.status)} text-[10px] px-1.5 py-0 mt-2`}>
                              {job.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-12 h-12 mx-auto mb-4 opacity-50 flex items-center justify-center">
                    <FolderOpen className="w-8 h-8" />
                  </div>
                  <p>{t('projects.noJobLists')}</p>
                  {jobSearchQuery && <p className="text-sm">{t('projects.tryAdjusting')}</p>}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="s-tickets" className="mt-0 space-y-4 flex-1 overflow-y-auto">
            {/* Search bar for tickets */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search service tickets..."
                value={ticketSearchQuery}
                onChange={(e) => setTicketSearchQuery(e.target.value)}
                className="pl-9 bg-muted/50 border-0"
              />
            </div>

            <div className="space-y-3">
              {isLoadingTickets ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Loading tickets...</p>
                </div>
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/mobile/service-tickets/${ticket.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">{ticket.title}</h3>
                          <p className="text-xs text-muted-foreground">#{ticket.ticket_number}</p>
                        </div>
                        <Badge className={`ml-2 text-xs ${getTicketStatusColor(ticket.status)}`}>
                          {getTicketStatusLabel(ticket.status)}
                        </Badge>
                      </div>
                      
                      {(ticket.service_address || ticket.service_city) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {[ticket.service_address, ticket.service_city, ticket.service_state]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}

                      {ticket.customer?.name && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <Users className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{ticket.customer.name}</span>
                        </div>
                      )}

                      {ticket.scheduled_date && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>{format(new Date(ticket.scheduled_date), 'MMM d, yyyy')}</span>
                          {ticket.scheduled_time && <span>at {ticket.scheduled_time}</span>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-12 h-12 mx-auto mb-4 opacity-50 flex items-center justify-center">
                    <Wrench className="w-8 h-8" />
                  </div>
                  <p>No service tickets found</p>
                  {ticketSearchQuery && <p className="text-sm">Try adjusting your search</p>}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
