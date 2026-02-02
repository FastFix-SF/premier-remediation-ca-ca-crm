import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Phone, Mail, MessageSquare, Users, Camera, Settings, Trash2, CheckSquare, ChevronDown, FileText, X, Eye, Play, Pause, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useMobileProject } from '@/mobile/hooks/useMobileProjects';
import { useMobilePhotos, useMobilePhotoDelete, useMobilePhotoUpdate } from '@/mobile/hooks/useMobilePhotos';
import { useMobileVideos, useMobileVideoDelete } from '@/mobile/hooks/useMobileVideos';
import { useMobileProjectTeam, useMobileCustomerInfo, useMobileProjectStatusUpdates } from '@/mobile/hooks/useMobileProjectDetails';
import { useMobileProjectUpdate } from '@/mobile/hooks/useMobileProjectManagement';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMobilePermissions } from '../hooks/useMobilePermissions';
import { useTeamMember } from '@/hooks/useTeamMember';
import { ProjectHeader } from '@/mobile/components/ProjectHeader';
import { ProjectPhotoGallery } from '@/mobile/components/ProjectPhotoGallery';
import { ProjectPhotoCaptureModal } from '@/mobile/components/ProjectPhotoCaptureModal';
import { ProjectVideoCaptureModal } from '@/mobile/components/ProjectVideoCaptureModal';
import { ProjectSettingsModal } from '@/mobile/components/ProjectSettingsModal';
import { TeamManagementModal } from '@/mobile/components/TeamManagementModal';
import { ProjectChatModal } from '@/mobile/components/ProjectChatModal';
import { ProjectScopeModal } from '@/mobile/components/ProjectScopeModal';
import { ProjectTasksModal } from '@/mobile/components/ProjectTasksModal';

import { ProjectInvoicesModal } from '@/mobile/components/ProjectInvoicesModal';
import { CreateReportModal } from '@/mobile/components/CreateReportModal';
import { UploadFileModal } from '@/mobile/components/UploadFileModal';
import { ProjectDocumentsModal } from '@/mobile/components/ProjectDocumentsModal';

import { DEFAULT_LABELS } from '@/mobile/constants/labels';
export const ProjectDetailView: React.FC = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    user
  } = useAuth();
  const {
    projectPermissions,
    teamMember
  } = useMobilePermissions(id);
  const {
    getDisplayName,
    getInitials
  } = useTeamMember();
  const [showPhotoCaptureModal, setShowPhotoCaptureModal] = useState(false);
  const [showVideoCaptureModal, setShowVideoCaptureModal] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [showProjectChat, setShowProjectChat] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [initialPhotoIndex, setInitialPhotoIndex] = useState<number | null>(null);
  // Timeline dialog state
  const [hasUploadedPhotoInSession, setHasUploadedPhotoInSession] = useState(false);
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);
  const [selectedTimelineOption, setSelectedTimelineOption] = useState<string | null>(null);
  const {
    data: project,
    isLoading: projectLoading,
    error: projectError
  } = useMobileProject(id || '');
  const {
    data: photos = []
  } = useMobilePhotos(id || '');
  const {
    data: videos = []
  } = useMobileVideos(id || '');
  const {
    data: teamAssignments = []
  } = useMobileProjectTeam(id || '');
  const {
    data: projectNotes = []
  } = useMobileProjectStatusUpdates(id || '');
  const {
    data: customerInfo
  } = useMobileCustomerInfo(project?.customer_email);
  const deletePhotoMutation = useMobilePhotoDelete();
  const updatePhotoMutation = useMobilePhotoUpdate();
  const deleteVideoMutation = useMobileVideoDelete();
  const updateProjectMutation = useMobileProjectUpdate();
  const canEdit = projectPermissions.canEdit;
  const canDelete = projectPermissions.canDelete;

const { hasFullAccess } = useMobilePermissions(id);

  // Back button handler - show timeline dialog if admin/leader uploaded photos
  const handleBackClick = () => {
    const userRole = teamMember?.role;
    const isAdminOrLeader = userRole === 'admin' || userRole === 'leader' || userRole === 'owner';
    
    if (isAdminOrLeader && hasUploadedPhotoInSession) {
      setShowTimelineDialog(true);
    } else {
      navigate('/mobile/projects');
    }
  };

  // Handle timeline selection confirmation
  const handleTimelineConfirm = () => {
    if (!id) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    switch (selectedTimelineOption) {
      case 'started':
        if (!project?.start_date) {
          updateProjectMutation.mutate(
            { projectId: id, updates: { start_date: today } },
            { onSuccess: () => toast.success(t('projectDetail.startDateRecorded')) }
          );
        }
        break;
      case 'hold':
        if (!project?.stopped_date) {
          updateProjectMutation.mutate(
            { projectId: id, updates: { stopped_date: today } },
            { onSuccess: () => toast.success(t('projectDetail.stoppedDateRecorded')) }
          );
        }
        break;
      case 'finished':
        if (!project?.end_date) {
          updateProjectMutation.mutate(
            { projectId: id, updates: { end_date: today } },
            { onSuccess: () => toast.success(t('projectDetail.endDateRecorded')) }
          );
        }
        break;
      case 'inspected':
      default:
        // No timeline change
        break;
    }
    
    setShowTimelineDialog(false);
    setSelectedTimelineOption(null);
    navigate('/mobile/projects');
  };
  const handleStartDateClick = () => {
    if (!id) return;
    
    if (project?.start_date) {
      // Clear the date (only admins can reach this, checked via UI)
      updateProjectMutation.mutate(
        { projectId: id, updates: { start_date: null } },
        { onSuccess: () => toast.success(t('projectDetail.startDateCleared')) }
      );
    } else {
      // Set the date
      const today = new Date().toISOString().split('T')[0];
      updateProjectMutation.mutate(
        { projectId: id, updates: { start_date: today } },
        { onSuccess: () => toast.success(t('projectDetail.startDateRecorded')) }
      );
    }
  };

  const handleStoppedDateClick = () => {
    if (!id) return;
    
    if (project?.stopped_date) {
      // Clear the date (only admins can reach this, checked via UI)
      updateProjectMutation.mutate(
        { projectId: id, updates: { stopped_date: null } },
        { onSuccess: () => toast.success(t('projectDetail.stoppedDateCleared')) }
      );
    } else {
      // Set the date
      const today = new Date().toISOString().split('T')[0];
      updateProjectMutation.mutate(
        { projectId: id, updates: { stopped_date: today } },
        { onSuccess: () => toast.success(t('projectDetail.stoppedDateRecorded')) }
      );
    }
  };

  const handleEndDateClick = () => {
    if (!id) return;
    
    if (project?.end_date) {
      // Clear the date (only admins can reach this, checked via UI)
      updateProjectMutation.mutate(
        { projectId: id, updates: { end_date: null } },
        { onSuccess: () => toast.success(t('projectDetail.endDateCleared')) }
      );
    } else {
      // Set the date
      const today = new Date().toISOString().split('T')[0];
      updateProjectMutation.mutate(
        { projectId: id, updates: { end_date: today } },
        { onSuccess: () => toast.success(t('projectDetail.endDateRecorded')) }
      );
    }
  };
  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deletePhotoMutation.mutateAsync(photoId);
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const handleUpdatePhoto = async (photoId: string, file: File) => {
    try {
      await updatePhotoMutation.mutateAsync({ photoId, file });
    } catch (error) {
      console.error('Failed to update photo:', error);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await deleteVideoMutation.mutateAsync(videoId);
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };
  if (projectLoading) {
    return <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t('projectDetail.loadingProject')}</p>
      </div>;
  }
  if (projectError || !project) {
    return <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-destructive">{t('projectDetail.failedToLoad')}</p>
        <Button onClick={() => navigate('/mobile/projects')}>
          {t('projectDetail.backToProjects')}
        </Button>
      </div>;
  }
  const handleProjectEdit = (field: string, value: any) => {
    // Open project settings modal for editing
    setShowProjectSettings(true);
  };
  return <div className="flex flex-col h-full bg-muted/30 overflow-y-auto">
      {/* Enhanced Header with integrated action bar */}
      <ProjectHeader 
        project={project} 
        photos={photos} 
        videos={videos}
        teamCount={teamAssignments.length}
        teamMembers={teamAssignments}
        notesCount={projectNotes.length}
        onEdit={handleProjectEdit} 
        onSeeAllPhotos={() => {
          setInitialPhotoIndex(null);
          setShowPhotoGallery(true);
        }} 
        onPhotoClick={index => {
          setInitialPhotoIndex(index);
          setShowPhotoGallery(true);
        }}
        onPaymentsClick={() => setShowInvoices(true)}
        onClientClick={() => setShowProjectSettings(true)}
        onTeamClick={() => setShowTeamManagement(true)}
        onTasksClick={() => setShowTasks(true)}
        onReportsClick={() => setShowReportsModal(true)}
        onFilesClick={() => setShowFilesModal(true)}
        onNotesClick={() => setShowNotesModal(true)}
        onPlusClick={() => setShowProjectSettings(true)}
        onCameraClick={() => setShowPhotoCaptureModal(true)}
        onChatClick={() => setShowProjectChat(true)}
        onCreateReportClick={() => setShowCreateReport(true)}
        onUploadFileClick={() => setShowUploadFile(true)}
        onUploadVideoClick={() => setShowVideoCaptureModal(true)}
        onStartDateClick={handleStartDateClick}
        onStoppedDateClick={handleStoppedDateClick}
        onEndDateClick={handleEndDateClick}
        isAdmin={hasFullAccess}
        onBackClick={handleBackClick}
      />

      {/* Photo Gallery Dialog */}
      <Dialog open={showPhotoGallery} onOpenChange={setShowPhotoGallery}>
        <DialogContent className="max-w-md h-auto max-h-[70vh] p-0 bg-background">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{t('projectDetail.projectPhotos')}</DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPhotoGallery(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <ProjectPhotoGallery 
              projectId={id || ''} 
              photos={photos} 
              videos={videos}
              onDeletePhoto={handleDeletePhoto} 
              onDeleteVideo={handleDeleteVideo}
              onUpdatePhoto={handleUpdatePhoto}
              initialPhotoIndex={initialPhotoIndex} 
              onTakePhoto={() => {
                setShowPhotoGallery(false);
                setShowPhotoCaptureModal(true);
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      {id && <>
          <ProjectPhotoCaptureModal 
            isOpen={showPhotoCaptureModal} 
            onClose={() => setShowPhotoCaptureModal(false)} 
            projectId={id}
            onPhotoUploaded={() => setHasUploadedPhotoInSession(true)}
          />
          
          <ProjectVideoCaptureModal isOpen={showVideoCaptureModal} onClose={() => setShowVideoCaptureModal(false)} projectId={id} />
          
          <ProjectSettingsModal isOpen={showProjectSettings} onClose={() => setShowProjectSettings(false)} project={project} />
          
          <TeamManagementModal isOpen={showTeamManagement} onClose={() => setShowTeamManagement(false)} projectId={id} currentTeam={teamAssignments} />
          
          <ProjectChatModal isOpen={showProjectChat} onClose={() => setShowProjectChat(false)} projectId={id} projectName={project?.name || 'Project'} />
          
          <ProjectTasksModal isOpen={showTasks} onClose={() => setShowTasks(false)} projectId={id} projectName={project?.name || 'Project'} />
          
          <ProjectInvoicesModal 
            isOpen={showInvoices} 
            onClose={() => setShowInvoices(false)} 
            projectId={id} 
            projectName={project?.name || 'Project'}
            clientName={project?.client_name}
            clientEmail={project?.customer_email}
            address={project?.address}
          />
          
          <CreateReportModal
            isOpen={showCreateReport}
            onClose={() => setShowCreateReport(false)}
            projectId={id}
            projectName={project?.name || 'Project'}
          />
          
          <UploadFileModal
            isOpen={showUploadFile}
            onClose={() => setShowUploadFile(false)}
            projectId={id}
          />
          
          <ProjectDocumentsModal
            isOpen={showReportsModal}
            onClose={() => setShowReportsModal(false)}
            projectId={id}
            category="reports"
            title={t('projectDetail.reports')}
          />
          
          <ProjectDocumentsModal
            isOpen={showFilesModal}
            onClose={() => setShowFilesModal(false)}
            projectId={id}
            category="files"
            title={t('projectDetail.files')}
          />
          
          <ProjectScopeModal
            isOpen={showNotesModal}
            onClose={() => setShowNotesModal(false)}
            projectId={id}
            projectName={project?.name || 'Project'}
          />
        </>}

      {/* Mandatory Timeline Update Dialog */}
      <Dialog open={showTimelineDialog} onOpenChange={() => {}}>
        <DialogContent 
          className="max-w-sm mx-4 p-0 gap-0 [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="p-4 pb-2 text-center border-b bg-amber-50 dark:bg-amber-950/20">
            <DialogTitle className="flex items-center justify-center gap-2 text-lg">
              <span className="text-amber-600">⚠️</span>
              {t('timeline.mustSelectTitle')}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('timeline.mustSelectDesc')}
            </p>
          </DialogHeader>
          
          <div className="p-4 space-y-3">
            {/* Inspected Card */}
            <button
              onClick={() => {
                setSelectedTimelineOption('inspected');
                handleTimelineConfirm();
              }}
              className="w-full p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition-all active:scale-[0.98] text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200 text-base">{t('timeline.inspected')}</p>
                  <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">{t('timeline.inspectedDesc')}</p>
                </div>
              </div>
            </button>

            {/* Started Card */}
            <button
              onClick={() => {
                setSelectedTimelineOption('started');
                handleTimelineConfirm();
              }}
              className="w-full p-4 rounded-xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 hover:border-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-all active:scale-[0.98] text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Play className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-800 dark:text-blue-200 text-base">{t('timeline.started')}</p>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80">{t('timeline.startedDesc')}</p>
                </div>
              </div>
            </button>

            {/* On Hold Card */}
            <button
              onClick={() => {
                setSelectedTimelineOption('hold');
                handleTimelineConfirm();
              }}
              className="w-full p-4 rounded-xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 hover:border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-all active:scale-[0.98] text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Pause className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-200 text-base">{t('timeline.hold')}</p>
                  <p className="text-sm text-amber-600/80 dark:text-amber-400/80">{t('timeline.holdDesc')}</p>
                </div>
              </div>
            </button>

            {/* Finished Card */}
            <button
              onClick={() => {
                setSelectedTimelineOption('finished');
                handleTimelineConfirm();
              }}
              className="w-full p-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all active:scale-[0.98] text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-primary text-base">{t('timeline.finished')}</p>
                  <p className="text-sm text-primary/70">{t('timeline.finishedDesc')}</p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};