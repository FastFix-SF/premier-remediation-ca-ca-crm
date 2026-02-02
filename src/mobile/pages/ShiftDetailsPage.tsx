import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, Briefcase, MapPin, Paperclip, Users, Edit, Trash2, MessageSquare, ClipboardList, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ProjectChatModal } from '@/mobile/components/ProjectChatModal';

export const ShiftDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isMapSheetOpen, setIsMapSheetOpen] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { data: teamMembers = [] } = useTeamMembers();

  // Use centralized admin status hook for consistent permission checks
  const { data: adminStatus } = useAdminStatus();
  const canManageShift = adminStatus?.isAdmin || adminStatus?.isOwner || false;

  const { data: shift, isLoading } = useQuery({
    queryKey: ['job-schedule', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_schedules')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Fetch project tasks if shift has a project_id
  const { data: projectTasks = [] } = useQuery({
    queryKey: ['shift-project-tasks', shift?.project_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('id, title, description, is_completed, assigned_to')
        .eq('project_id', shift?.project_id)
        .order('is_completed', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!shift?.project_id,
  });

  useEffect(() => {
    if (!shift?.location || !mapContainer.current || map.current) return;

    const initializeMap = async () => {
      try {
        // Fetch Mapbox token
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/map-config`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
          }
        );
        const { mapboxPublicToken } = await response.json();
        
        mapboxgl.accessToken = mapboxPublicToken;

        // Geocode the address
        const geocodeResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(shift.location)}.json?access_token=${mapboxPublicToken}`
        );
        const geocodeData = await geocodeResponse.json();
        
        if (geocodeData.features && geocodeData.features.length > 0) {
          const [lng, lat] = geocodeData.features[0].center;

          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: 14,
            interactive: false,
          });

          new mapboxgl.Marker({ color: '#ef4444' })
            .setLngLat([lng, lat])
            .addTo(map.current);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    return () => {
      map.current?.remove();
    };
  }, [shift?.location]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground">Shift not found</div>
      </div>
    );
  }

  const startDate = new Date(shift.start_time);
  const endDate = new Date(shift.end_time);
  const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  
  // Handle both old format (array of strings) and new format (array of objects)
  const assignedUsers = Array.isArray(shift.assigned_users) 
    ? shift.assigned_users.map((user: any) => {
        // Get user ID from either object or string format
        const userId = typeof user === 'object' && user !== null ? user.id : user;
        
        // Find team member with avatar
        const teamMember = teamMembers.find(tm => tm.user_id === userId);
        
        // If it's already an object, merge with team member data
        if (typeof user === 'object' && user !== null) {
          return {
            ...user,
            name: user.name || teamMember?.full_name || user.email?.split('@')[0] || 'Unknown',
            avatar: teamMember?.avatar_url || user.avatar
          };
        }
        
        // If it's a string (old format), create object with team member data
        return {
          id: userId,
          name: teamMember?.full_name || user,
          email: user,
          avatar: teamMember?.avatar_url
        };
      })
    : [];

  const handleDeleteShift = async () => {
    if (!confirm('Are you sure you want to delete this shift? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('job_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Shift deleted successfully');
      navigate('/mobile/job-scheduling');
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error('Failed to delete shift. Please try again.');
    }
  };

  const handleOpenMaps = (type: 'google' | 'apple') => {
    if (!shift?.location) return;
    
    const encodedAddress = encodeURIComponent(shift.location);
    const url = type === 'google' 
      ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
      : `http://maps.apple.com/?q=${encodedAddress}`;
    
    window.open(url, '_blank');
    setIsMapSheetOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-16 xs:pb-20 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-3 xs:px-4 py-2 xs:py-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9 xs:h-10 xs:w-10 flex-shrink-0"
          >
            <ChevronLeft className="h-5 w-5 xs:h-6 xs:w-6" />
          </Button>
          <h1 className="text-base xs:text-lg font-semibold truncate flex-1 text-center">Shift details</h1>
          {canManageShift ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 xs:h-10 xs:w-10 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
              onClick={handleDeleteShift}
            >
              <Trash2 className="h-4 w-4 xs:h-5 xs:w-5" />
            </Button>
          ) : (
            <div className="w-9 xs:w-10" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 xs:p-4 space-y-3 xs:space-y-4">
        {/* Shift Title and Map Preview */}
        <div>
          <h2 className="text-lg xs:text-xl font-semibold mb-2 xs:mb-3 truncate">{shift.job_name}</h2>
          <div 
            ref={mapContainer} 
            className="w-full h-28 xs:h-32 bg-muted rounded-lg overflow-hidden cursor-pointer" 
            onClick={() => setIsMapSheetOpen(true)}
          />
        </div>

        <Separator />

        {/* Status Section */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">Current shift status</span>
          <span className="text-sm font-medium text-green-600">
            {shift.status === 'scheduled' ? 'Published' : shift.status}
          </span>
        </div>

        <Separator />

        {/* Date and Time Section */}
        <div className="space-y-3 py-2">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-sm">
              {format(startDate, 'EEEE, MMM d, yyyy')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm">
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')} - {hours.toFixed(1)} hours
            </span>
          </div>
        </div>

        <Separator />

        {/* Job Section */}
        <div className="flex items-center gap-3 py-2">
          <Briefcase className="w-5 h-5 text-primary" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Job</span>
            <span className="text-sm text-muted-foreground">→</span>
            <Badge 
              variant="secondary" 
              className="text-sm"
              style={{ backgroundColor: shift.color || '#dc2626', color: 'white', borderColor: shift.color || '#dc2626' }}
            >
              {shift.job_name}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Location Section */}
        {shift.location && (
          <>
            <div className="flex items-start gap-3 py-2">
              <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span 
                className="text-sm text-primary cursor-pointer hover:underline"
                onClick={() => setIsMapSheetOpen(true)}
              >
                {shift.location}
              </span>
            </div>
            <Separator />
          </>
        )}

        {/* Description */}
        {shift.description && (
          <>
            <div className="flex items-start gap-3 py-2">
              <Paperclip className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-medium">Description</span>
                <p className="text-sm text-muted-foreground mt-1">{shift.description}</p>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Attachments */}
        {shift.attachments && Array.isArray(shift.attachments) && shift.attachments.length > 0 && (
          <>
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Paperclip className="w-5 h-5 text-primary" />
                <span>Attachments ({shift.attachments.length})</span>
              </div>
              <div className="ml-7 space-y-2">
                {(shift.attachments as any[]).map((attachment: any, index: number) => {
                  const url = typeof attachment === 'string' ? attachment : attachment?.url || attachment?.path;
                  const name = typeof attachment === 'object' ? attachment?.name : `Attachment ${index + 1}`;
                  if (!url) return null;
                  
                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                  if (isImage) {
                    return (
                      <a 
                        key={index}
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img 
                          src={url} 
                          alt={name || 'Attachment'} 
                          className="max-w-full h-auto rounded-lg border border-border max-h-48 object-cover"
                        />
                      </a>
                    );
                  }
                  return (
                    <a 
                      key={index}
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <Paperclip className="w-4 h-4 text-primary" />
                      <span className="text-sm text-primary underline">{name || 'View attachment'}</span>
                    </a>
                  );
                })}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Assigned Users */}
        {assignedUsers.length > 0 && (
          <div className="space-y-3 py-2">
            <div className="space-y-3">
              {assignedUsers.map((user: any, index: number) => {
                const userName = user.name || user.email?.split('@')[0] || 'Unknown';
                const userInitials = userName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);
                
                const assignmentStatus = user.assignment_status || 'pending';
                const statusColors = {
                  confirmed: 'bg-green-50 text-green-600 border-green-200',
                  rejected: 'bg-red-50 text-red-600 border-red-200',
                  pending: 'bg-yellow-50 text-yellow-600 border-yellow-200'
                };
                const statusText = {
                  confirmed: 'Confirmed',
                  rejected: 'Rejected',
                  pending: 'Pending'
                };
                
                return (
                  <div key={user.id || index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        {user.avatar && <AvatarImage src={user.avatar} />}
                        <AvatarFallback className="bg-orange-500 text-white">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{userName}</span>
                    </div>
                    <Badge variant="outline" className={statusColors[assignmentStatus as keyof typeof statusColors]}>
                      {statusText[assignmentStatus as keyof typeof statusText]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Group Chat Button */}
        {assignedUsers.length > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowGroupChat(true)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Group Chat
          </Button>
        )}

        <Separator />

        {/* Project Tasks Section */}
        {shift.project_id && (
          <>
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Project Tasks</span>
                  {projectTasks.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {projectTasks.filter((t: any) => !t.is_completed).length} pending
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary h-8 px-2"
                  onClick={() => navigate(`/mobile/projects/${shift.project_id}`)}
                >
                  View in Project
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {projectTasks.length > 0 ? (
                <div className="space-y-2 ml-7">
                  {projectTasks.map((task: any) => (
                    <div 
                      key={task.id} 
                      className={`flex items-start gap-2 p-2 rounded-lg ${
                        task.is_completed ? 'bg-muted/50' : 'bg-muted'
                      }`}
                    >
                      {task.is_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && !task.is_completed && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ml-7 p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">No tasks for this project</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/mobile/projects/${shift.project_id}`)}
                  >
                    Add Tasks
                  </Button>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Edit Button - only for admins/owners */}
        {canManageShift && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate(`/mobile/add-shift?edit=${id}`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit shift
          </Button>
        )}
      </div>

      {/* Map Selection Sheet */}
      <Sheet open={isMapSheetOpen} onOpenChange={setIsMapSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="text-center">
              How would you like to view the location?
            </SheetTitle>
          </SheetHeader>
          <div className="flex gap-3 mt-6 pb-6">
            <Button
              variant="outline"
              className="flex-1 h-12 text-base"
              onClick={() => handleOpenMaps('google')}
            >
              Google maps
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 text-base"
              onClick={() => handleOpenMaps('apple')}
            >
              Apple maps
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Group Chat Modal */}
      <ProjectChatModal
        isOpen={showGroupChat}
        onClose={() => setShowGroupChat(false)}
        projectId={id || ''}
        projectName={shift.job_name}
      />
    </div>
  );
};
