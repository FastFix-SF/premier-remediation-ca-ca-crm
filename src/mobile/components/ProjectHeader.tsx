import React, { useState } from 'react';
import { ArrowLeft, MapPin, Star, Users, Camera, Home, DollarSign, CheckSquare, FileText, FolderOpen, ChevronRight, Plus, MessageSquare, ClipboardList, Receipt, Settings, X, Video, Play, Calendar, CheckCircle, Flag, Pause, StopCircle } from 'lucide-react';
import { MobileProjectVideo } from '@/mobile/hooks/useMobileVideos';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
interface TeamMember {
  id: string;
  user_id: string;
  initials?: string;
  full_name?: string | null;
}

interface ProjectHeaderProps {
  project: any;
  photos: any[];
  videos?: MobileProjectVideo[];
  teamCount?: number;
  teamMembers?: TeamMember[];
  notesCount?: number;
  onEdit?: (field: string, value: any) => void;
  onSeeAllPhotos?: () => void;
  onPhotoClick?: (index: number) => void;
  onPaymentsClick?: () => void;
  onClientClick?: () => void;
  onTeamClick?: () => void;
  onTasksClick?: () => void;
  onReportsClick?: () => void;
  onFilesClick?: () => void;
  onNotesClick?: () => void;
  // Action bar props
  onPlusClick?: () => void;
  onCameraClick?: () => void;
  onChatClick?: () => void;
  // Quick action creation props
  onCreateReportClick?: () => void;
  onUploadFileClick?: () => void;
  onUploadVideoClick?: () => void;
  // Timeline props
  onStartDateClick?: () => void;
  onStoppedDateClick?: () => void;
  onEndDateClick?: () => void;
  // Admin permissions for timeline revert
  isAdmin?: boolean;
  // Back button handler
  onBackClick?: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  photos,
  videos = [],
  teamCount = 0,
  teamMembers = [],
  notesCount = 0,
  onSeeAllPhotos,
  onPhotoClick,
  onPaymentsClick,
  onClientClick,
  onTeamClick,
  onTasksClick,
  onReportsClick,
  onFilesClick,
  onNotesClick,
  onPlusClick,
  onCameraClick,
  onChatClick,
  onCreateReportClick,
  onUploadFileClick,
  onUploadVideoClick,
  onStartDateClick,
  onStoppedDateClick,
  onEndDateClick,
  isAdmin = false,
  onBackClick
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const { t, language } = useLanguage();
  
  const getInitials = (fullName?: string | null, fallbackId?: string) => {
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return fullName.substring(0, 2).toUpperCase();
    }
    // Fallback to first 2 chars of user_id
    return fallbackId?.substring(0, 2).toUpperCase() || '??';
  };
  const navigate = useNavigate();
  const heroPhoto = photos.find(p => p.is_highlighted_after) || photos[0];
  
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

  const handleQuickAction = (action: (() => void) | undefined) => {
    setShowQuickActions(false);
    if (action) {
      action();
    }
  };

  return (
    <div className="relative">
      {/* Hero Image Background */}
      {heroPhoto && (
        <div className="absolute inset-0 w-full h-48 overflow-hidden">
          <img src={heroPhoto.photo_url} alt="Project hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-background/20" />
        </div>
      )}

      {/* Header Content */}
      <div className="relative z-10 p-4 pb-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={onBackClick || (() => navigate('/mobile/projects'))} className="bg-background/80 backdrop-blur-sm border border-border/50">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Project Info Card */}
        <Card className="bg-background/95 backdrop-blur-sm border border-border/50 shadow-card">
          <CardContent className="p-6">
            {/* Project Name */}
            <div className="mb-3">
              <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
            </div>

            {/* Address - Clickable to open in Maps */}
            {project.address && (
              <button 
                onClick={() => {
                  const encodedAddress = encodeURIComponent(project.address);
                  // Check if iOS (will open Apple Maps) or Android/other (Google Maps)
                  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                  const mapsUrl = isIOS 
                    ? `maps://maps.apple.com/?q=${encodedAddress}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                  window.open(mapsUrl, '_blank');
                }}
                className="flex items-start space-x-2 mb-2 group text-left"
              >
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-primary group-hover:underline">{project.address}</span>
              </button>
            )}

            {/* Client Name with House Icon - Always visible for settings access */}
            <button 
              onClick={onClientClick}
              className="flex items-center space-x-2 mb-2 group"
            >
              <Home className="w-4 h-4 text-primary" />
              <span className={`text-sm font-medium group-hover:underline ${
                project.client_name ? 'text-primary' : 'text-muted-foreground italic'
              }`}>
                {project.client_name || 'Add Client Name'}
              </span>
              <ChevronRight className="w-3 h-3 text-primary opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Team Members with Initials */}
            {teamMembers.length > 0 && (
              <button 
                onClick={onTeamClick}
                className="flex items-center space-x-2 mb-2 group"
              >
                <Users className="w-4 h-4 text-primary" />
                <div className="flex -space-x-1">
                  {teamMembers.slice(0, 5).map((member, index) => (
                    <Avatar key={member.id || index} className="w-6 h-6 border-2 border-background ring-1 ring-primary/20">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                        {member.initials || getInitials(member.full_name, member.user_id)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {teamMembers.length > 5 && (
                    <Avatar className="w-6 h-6 border-2 border-background ring-1 ring-primary/20">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                        +{teamMembers.length - 5}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <ChevronRight className="w-3 h-3 text-primary opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Payments */}
            <button 
              onClick={onPaymentsClick}
              className="flex items-center space-x-2 mb-4 group"
            >
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium group-hover:underline">{t('projectDetail.payments')}</span>
              <ChevronRight className="w-3 h-3 text-primary opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Quick Stats */}
            <div className="flex items-center justify-around pt-4 border-t border-border/50">
              <button 
                onClick={onNotesClick}
                className="flex flex-col items-center px-3 hover:bg-muted/50 rounded-lg transition-colors py-1 group"
              >
                <div className="relative">
                  {/* Outer wave ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/30 to-yellow-500/20 animate-[pulse_2s_ease-in-out_infinite]" />
                  {/* Middle wave ring */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-amber-300/20 to-yellow-400/10 animate-[pulse_2.5s_ease-in-out_infinite_0.5s]" />
                  {/* Main icon container */}
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <ClipboardList className="w-5 h-5 text-amber-900" />
                  </div>
                </div>
                <span className="text-base font-semibold text-foreground mt-1.5">{notesCount}</span>
                <p className="text-xs text-muted-foreground">{t('projectDetail.scope')}</p>
              </button>
              
              <div className="w-px h-12 bg-border/50" />
              
              {/* Timeline Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex flex-col items-center px-3 hover:bg-muted/50 rounded-lg transition-colors py-1 group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
                      project.end_date 
                        ? 'bg-primary/20' 
                        : project.start_date 
                          ? 'bg-primary/15' 
                          : 'bg-primary/10'
                    }`}>
                      {project.end_date ? (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      ) : (
                        <Calendar className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-foreground mt-1.5">
                      {project.end_date ? t('projectDetail.done') : project.start_date ? t('projectDetail.active') : t('projectDetail.set')}
                    </span>
                    <p className="text-xs text-muted-foreground">{t('projectDetail.timeline')}</p>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">{t('projectDetail.projectTimeline')}</span>
                    </div>
                    
                    {/* Start Date Button */}
                    <button
                      onClick={onStartDateClick}
                      disabled={!!project.start_date && !isAdmin}
                      className={`w-full flex items-center gap-3 rounded-lg p-3 transition-colors ${
                        project.start_date
                          ? isAdmin 
                            ? 'bg-emerald-100 border border-emerald-200 hover:bg-emerald-50 cursor-pointer'
                            : 'bg-emerald-100 border border-emerald-200 opacity-80'
                          : 'bg-muted hover:bg-muted/80 border border-dashed border-border'
                      }`}
                    >
                      {project.start_date ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Play className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="text-left flex-1">
                        <span className={`text-sm font-medium ${project.start_date ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                          {project.start_date ? t('projectDetail.started') : t('projectDetail.markStarted')}
                        </span>
                        {project.start_date && (
                          <p className="text-xs text-emerald-600">
                            {new Date(project.start_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      {project.start_date && isAdmin && (
                        <span className="text-xs text-emerald-600/70 font-medium">{t('projectDetail.tapToUndo')}</span>
                      )}
                    </button>
                    
                    {/* Stopped Date Button */}
                    <button
                      onClick={onStoppedDateClick}
                      disabled={!!project.stopped_date && !isAdmin}
                      className={`w-full flex items-center gap-3 rounded-lg p-3 transition-colors ${
                        project.stopped_date
                          ? isAdmin 
                            ? 'bg-orange-100 border border-orange-200 hover:bg-orange-50 cursor-pointer'
                            : 'bg-orange-100 border border-orange-200 opacity-80'
                          : 'bg-muted hover:bg-muted/80 border border-dashed border-border'
                      }`}
                    >
                      {project.stopped_date ? (
                        <StopCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                      ) : (
                        <Pause className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="text-left flex-1">
                        <span className={`text-sm font-medium ${project.stopped_date ? 'text-orange-700' : 'text-muted-foreground'}`}>
                          {project.stopped_date ? t('projectDetail.stopped') : t('projectDetail.markStopped')}
                        </span>
                        {project.stopped_date && (
                          <p className="text-xs text-orange-600">
                            {new Date(project.stopped_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      {project.stopped_date && isAdmin && (
                        <span className="text-xs text-orange-600/70 font-medium">{t('projectDetail.tapToUndo')}</span>
                      )}
                    </button>
                    
                    {/* End Date Button */}
                    <button
                      onClick={onEndDateClick}
                      disabled={!!project.end_date && !isAdmin}
                      className={`w-full flex items-center gap-3 rounded-lg p-3 transition-colors ${
                        project.end_date
                          ? isAdmin
                            ? 'bg-primary/10 border border-primary/20 hover:bg-primary/5 cursor-pointer'
                            : 'bg-primary/10 border border-primary/20 opacity-80'
                          : 'bg-muted hover:bg-muted/80 border border-dashed border-border'
                      }`}
                    >
                      {project.end_date ? (
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <Flag className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="text-left flex-1">
                        <span className={`text-sm font-medium ${project.end_date ? 'text-primary' : 'text-muted-foreground'}`}>
                          {project.end_date ? t('projectDetail.completed') : t('projectDetail.markCompleted')}
                        </span>
                        {project.end_date && (
                          <p className="text-xs text-primary/80">
                            {new Date(project.end_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      {project.end_date && isAdmin && (
                        <span className="text-xs text-primary/60 font-medium">{t('projectDetail.tapToUndo')}</span>
                      )}
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Media Thumbnails (Photos + Videos) */}
            {(photos.length > 0 || videos.length > 0) && (() => {
              // Combine photos and videos into a unified media array, sorted by date
              const allMedia = [
                ...photos.map(p => ({ ...p, type: 'photo' as const, url: p.photo_url })),
                ...videos.map(v => ({ ...v, type: 'video' as const, url: v.video_url }))
              ].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
              
              const totalMedia = allMedia.length;
              
              return (
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{t('projectDetail.media')}</span>
                    {onSeeAllPhotos && totalMedia > 4 && (
                      <button 
                        onClick={onSeeAllPhotos}
                        className="text-xs text-primary hover:underline"
                      >
                        {t('projectDetail.seeAll')} ({totalMedia})
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {allMedia.slice(0, 4).map((media, index) => (
                      <button
                        key={media.id || index}
                        onClick={() => onSeeAllPhotos?.()}
                        className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors relative"
                      >
                        {media.type === 'photo' ? (
                          <img 
                            src={media.url} 
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <video 
                              src={media.url} 
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                            {/* Play icon overlay for videos */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                                <Play className="w-4 h-4 text-foreground ml-0.5" />
                              </div>
                            </div>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Status and Updated */}
            <div className="flex items-center space-x-4 pt-4 border-t border-border/50">
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
              
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <span>{t('projectDetail.updated')} {formatDistanceToNow(new Date(project.updated_at), {
                  addSuffix: true,
                  locale: language === 'es' ? es : undefined
                })}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-border/50 space-y-1.5">
              {onTasksClick && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onTasksClick} 
                  className="w-full text-xs h-9"
                >
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                  {t('projectDetail.tasks')}
                </Button>
              )}
              {onReportsClick && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onReportsClick} 
                  className="w-full text-xs h-9"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  {t('projectDetail.reports')}
                </Button>
              )}
              {onFilesClick && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onFilesClick} 
                  className="w-full text-xs h-9"
                >
                  <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                  {t('projectDetail.files')}
                </Button>
              )}
            </div>

            {/* Quick Action Bar */}
            {(onPlusClick || onCameraClick || onChatClick) && (
              <div className="flex justify-center pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 bg-primary rounded-full px-4 py-2 shadow-lg">
                  {(onPlusClick || onTasksClick || onReportsClick || onFilesClick) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowQuickActions(true)}
                      className="h-12 w-12 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  )}
                  {onCameraClick && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onCameraClick}
                      className="h-12 w-12 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                  )}
                  {onChatClick && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onChatClick}
                      className="h-12 w-12 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
                    >
                      <MessageSquare className="h-6 w-6" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Bottom Sheet */}
      <Sheet open={showQuickActions} onOpenChange={setShowQuickActions}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('projectDetail.quickActions')}</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowQuickActions(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 pb-6">
            {onCameraClick && (
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleQuickAction(onCameraClick)}
              >
                <Camera className="h-6 w-6 text-primary" />
                <span>{t('projectDetail.uploadPhotos')}</span>
              </Button>
            )}
            {onUploadVideoClick && (
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleQuickAction(onUploadVideoClick)}
              >
                <Video className="h-6 w-6 text-primary" />
                <span>{t('projectDetail.uploadVideo')}</span>
              </Button>
            )}
            {onUploadFileClick && (
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleQuickAction(onUploadFileClick)}
              >
                <FolderOpen className="h-6 w-6 text-primary" />
                <span>{t('projectDetail.uploadFile')}</span>
              </Button>
            )}
            {onTasksClick && (
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleQuickAction(onTasksClick)}
              >
                <CheckSquare className="h-6 w-6 text-primary" />
                <span>{t('projectDetail.createTask')}</span>
              </Button>
            )}
            {onCreateReportClick && (
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleQuickAction(onCreateReportClick)}
              >
                <ClipboardList className="h-6 w-6 text-primary" />
                <span>{t('projectDetail.createReport')}</span>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
