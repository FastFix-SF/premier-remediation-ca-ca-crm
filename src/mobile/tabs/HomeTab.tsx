import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  MessageCircle, 
  Calendar, 
  QrCode, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Briefcase, 
  ClipboardList, 
  User, 
  Settings, 
  Ticket,
  FolderOpen,
  Palmtree,
  CalendarCheck,
  CheckSquare,
  Search,
  ListChecks,
  Files,
  HardHat,
  AlertTriangle,
  Users,
  FileStack,
  Contact,
  DollarSign,
  FileText,
  BarChart3,
  Receipt,
  Car,
  Wrench,
  FileQuestion,
  Send,
  Newspaper,
  ShoppingCart,
  FileSignature,
  Scale,
  Building2,
  MapPin,
  Hammer,
  ClipboardCheck,
  Package,
  Banknote,
  CreditCard,
  TrendingUp,
  BookOpen,
  Mail,
  PenTool,
  Shield,
  Trophy,
  Sun,
  Award
} from 'lucide-react';
import { AssignmentConfirmationDialog } from '@/mobile/components/AssignmentConfirmationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AIReviewQRModal } from '@/components/AIReviewQRModal';
import { AIReviewProjectSelectModal } from '@/mobile/components/AIReviewProjectSelectModal';
import { AppIconCarousel, AppIconItem } from '@/mobile/components/AppIconCarousel';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { useTeamMember } from '@/hooks/useTeamMember';
import { useAppIcons } from '@/hooks/useAppIcons';
import { cn } from '@/lib/utils';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';

// Apps that contributors are allowed to see (15 apps)
const CONTRIBUTOR_ALLOWED_APPS = [
  'projects',
  'messages',     // Chat
  'clock',        // Clock In
  'schedule',
  'tasks',
  'time-off',
  'safety',       // Safety (HardHat icon)
  'inventory',
  'quizzes',
  'ai-review',    // Reviews AI
  'profile',
  'settings',
  'scoring',
  'photos',
  'daily-logs',
];
import { formatDistanceToNow, format, isToday, startOfDay, isFuture, isPast, subWeeks, addWeeks } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ActivityItem = {
  id: string;
  type: 'shift_assigned' | 'shift_created' | 'project_assignment';
  title: string;
  subtitle?: string;
  date: Date;
  status?: string;
  navigateTo: string;
  icon: 'calendar' | 'clipboard' | 'briefcase';
  color: string;
};

export const HomeTab: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [showProjectSelectModal, setShowProjectSelectModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{
    id: string;
    name: string;
    address: string;
    description?: string;
    project_type?: string;
    roof_type?: string;
  } | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<{
    id: string;
    title: string;
    location: string;
    date: string;
    startTime: string;
    type: 'job' | 'task';
  } | null>(null);
  
  const [isProcessingAssignment, setIsProcessingAssignment] = useState(false);
  
  const [respondedAssignments, setRespondedAssignments] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('respondedAssignments');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const { updates, loading: updatesLoading } = useProjectUpdates(8);

  useEffect(() => {
    localStorage.setItem('respondedAssignments', JSON.stringify([...respondedAssignments]));
  }, [respondedAssignments]);

  const dateRangeKey = format(new Date(), 'yyyy-MM-dd');
  const twoWeeksAgo = subWeeks(startOfDay(new Date()), 2);
  const twoWeeksFromNow = addWeeks(startOfDay(new Date()), 2);

  const { data: myShifts = [], isLoading: shiftsLoading, refetch: refetchShifts } = useQuery({
    queryKey: ['my-shifts', user?.id, dateRangeKey],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('job_schedules')
        .select('*')
        .gte('start_time', twoWeeksAgo.toISOString())
        .lte('start_time', twoWeeksFromNow.toISOString())
        .order('start_time');
      
      if (error) throw error;
      
      const filtered = (data || []).filter(shift => {
        const assignedUsers = Array.isArray(shift.assigned_users) ? shift.assigned_users : [];
        return assignedUsers.some((u: any) => u.user_id === user.id);
      });
      
      return filtered;
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    gcTime: 0,
  });

  const { data: myProjectAssignments = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ['my-project-assignments', user?.id, dateRangeKey],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('project_team_assignments')
        .select(`
          id,
          role,
          assigned_at,
          assignment_status,
          responded_at,
          project:projects(id, name, status, address)
        `)
        .eq('user_id', user.id)
        .gte('assigned_at', twoWeeksAgo.toISOString())
        .lte('assigned_at', twoWeeksFromNow.toISOString())
        .order('assigned_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    gcTime: 0,
  });

  const activities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    myShifts.forEach(shift => {
      items.push({
        id: `shift-${shift.id}`,
        type: 'shift_assigned',
        title: shift.job_name,
        subtitle: shift.location || undefined,
        date: new Date(shift.start_time),
        status: shift.status,
        navigateTo: `/mobile/shift/${shift.id}`,
        icon: 'calendar',
        color: 'bg-blue-500',
      });
    });

    myProjectAssignments.forEach((assignment: any) => {
      if (assignment.project) {
        items.push({
          id: `project-${assignment.id}`,
          type: 'project_assignment',
          title: assignment.project.name,
          subtitle: assignment.project.address || `${t('home.assignedTo')}: ${assignment.role || t('common.teamMember')}`,
          date: new Date(assignment.assigned_at),
          status: assignment.project.status,
          navigateTo: `/mobile/projects/${assignment.project.id}`,
          icon: 'briefcase',
          color: 'bg-emerald-500',
        });
      }
    });

    return items.sort((a, b) => {
      const aFuture = isFuture(a.date);
      const bFuture = isFuture(b.date);
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      return a.date.getTime() - b.date.getTime();
    });
  }, [myShifts, myProjectAssignments]);

  const isLoading = shiftsLoading || projectsLoading;

  useEffect(() => {
    if (!user?.id || pendingAssignment || isProcessingAssignment) return;

    const pendingJob = myShifts.find(shift => {
      if (respondedAssignments.has(shift.id)) return false;
      
      const assignedUsers = Array.isArray(shift.assigned_users) ? shift.assigned_users : [];
      const userAssignment = assignedUsers.find((u: any) => {
        if (typeof u !== 'object' || u === null) return false;
        const usrId = u.user_id || u.id;
        return usrId === user.id;
      });
      
      if (!userAssignment) return false;
      const status = (userAssignment as any).assignment_status;
      return status === 'pending';
    });

    if (pendingJob) {
      setIsProcessingAssignment(true);
      setPendingAssignment({
        id: pendingJob.id,
        title: pendingJob.job_name,
        location: pendingJob.location || '',
        date: pendingJob.start_time,
        startTime: new Date(pendingJob.start_time).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        }),
        type: 'job',
      });
      return;
    }

    const pendingProject = myProjectAssignments.find(
      (assignment: any) => !respondedAssignments.has(assignment.id) && assignment.assignment_status === 'pending'
    );

    if (pendingProject?.project) {
      setIsProcessingAssignment(true);
      setPendingAssignment({
        id: pendingProject.id,
        title: pendingProject.project.name,
        location: pendingProject.project.address || '',
        date: pendingProject.assigned_at,
        startTime: new Date(pendingProject.assigned_at).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        }),
        type: 'task',
      });
    }
  }, [myShifts, myProjectAssignments, user?.id, pendingAssignment, respondedAssignments, isProcessingAssignment]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning') || 'Good morning';
    if (hour < 17) return t('home.goodAfternoon') || 'Good afternoon';
    return t('home.goodEvening') || 'Good evening';
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get admin status for conditional admin apps
  const { data: adminStatus } = useAdminStatus();
  const { currentMember } = useTeamMember();
  const isContributor = currentMember?.role === 'contributor';

  // iPhone-style app icons - Core apps for all users (iOS 26 aesthetic)
  // IMPORTANT: First 15 apps are contributor-visible and should appear on page 1 for all roles
  const coreApps: AppIconItem[] = [
    // === PAGE 1: Contributor-visible apps (positions 1-15) ===
    // Row 1
    {
      id: 'projects',
      name: t('home.projects'),
      icon: FolderOpen,
      gradient: 'from-blue-400 via-blue-500 to-cyan-500',
      path: '/mobile/projects',
    },
    {
      id: 'messages',
      name: t('nav.messages'),
      icon: MessageCircle,
      gradient: 'from-green-400 via-green-500 to-emerald-500',
      path: '/mobile/messages',
    },
    {
      id: 'clock',
      name: 'Clock In',
      icon: Clock,
      gradient: 'from-amber-400 via-orange-500 to-orange-600',
      path: '/mobile/time-clock-old',
    },
    {
      id: 'schedule',
      name: 'Schedule',
      icon: Calendar,
      gradient: 'from-violet-400 via-violet-500 to-purple-600',
      path: '/mobile/schedule',
    },
    
    // Row 2
    {
      id: 'tasks',
      name: 'Tasks',
      icon: CheckSquare,
      gradient: 'from-emerald-400 via-emerald-500 to-teal-600',
      path: '/mobile/tasks',
    },
    {
      id: 'time-off',
      name: 'Time Off',
      icon: Palmtree,
      gradient: 'from-teal-400 via-teal-500 to-cyan-600',
      path: '/mobile/requests/time-off',
    },
    {
      id: 'safety',
      name: 'Safety',
      icon: HardHat,
      gradient: 'from-yellow-400 via-yellow-500 to-amber-600',
      path: '/mobile/safety-meetings',
    },
    {
      id: 'inventory',
      name: 'Inventory',
      icon: Package,
      gradient: 'from-cyan-400 via-cyan-500 to-teal-600',
      path: '/mobile/inventory',
    },
    
    // Row 3
    {
      id: 'quizzes',
      name: 'Quizzes',
      icon: BookOpen,
      gradient: 'from-purple-400 via-purple-500 to-pink-600',
      path: '/mobile/quizzes',
    },
    {
      id: 'ai-review',
      name: t('home.aiReview'),
      icon: QrCode,
      gradient: 'from-purple-500 via-purple-600 to-violet-700',
      onClick: () => setShowProjectSelectModal(true),
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      gradient: 'from-zinc-500 via-zinc-600 to-neutral-700',
      path: '/mobile/settings',
    },
    
    // Row 4 (positions 13-16)
    {
      id: 'scoring',
      name: 'Scoring',
      icon: Trophy,
      gradient: 'from-yellow-400 via-yellow-500 to-orange-600',
      path: '/mobile/scoring',
    },
    {
      id: 'photos',
      name: t('home.photos'),
      icon: Camera,
      gradient: 'from-pink-400 via-pink-500 to-rose-600',
      path: '/mobile/all-photos',
    },
    {
      id: 'daily-logs',
      name: 'Daily Logs',
      icon: CalendarCheck,
      gradient: 'from-indigo-400 via-indigo-500 to-blue-600',
      path: '/mobile/daily-logs',
    },
    // Position 16 - First non-contributor app
    {
      id: 'work-orders',
      name: 'Work Orders',
      icon: ClipboardList,
      gradient: 'from-amber-400 via-amber-500 to-yellow-600',
      path: '/mobile/work-orders',
    },
    
    // === PAGE 2+: Additional apps (not visible to contributors) ===
    {
      id: 'service-tickets',
      name: 'Tickets',
      icon: Ticket,
      gradient: 'from-red-400 via-red-500 to-orange-600',
      path: '/mobile/service-tickets',
    },
    {
      id: 'inspections',
      name: 'Inspections',
      icon: Search,
      gradient: 'from-sky-400 via-sky-500 to-blue-600',
      path: '/mobile/inspections',
    },
    {
      id: 'punchlists',
      name: 'Punchlists',
      icon: ListChecks,
      gradient: 'from-lime-400 via-lime-500 to-green-600',
      path: '/mobile/punchlists',
    },
    {
      id: 'documents',
      name: 'Files',
      icon: Files,
      gradient: 'from-slate-400 via-slate-500 to-gray-600',
      path: '/mobile/documents',
    },
    {
      id: 'incidents',
      name: 'Incidents',
      icon: AlertTriangle,
      gradient: 'from-rose-400 via-rose-500 to-red-600',
      path: '/mobile/incidents',
    },
    {
      id: 'team',
      name: 'Team',
      icon: Users,
      gradient: 'from-purple-400 via-purple-500 to-violet-600',
      path: '/mobile/team',
    },
    {
      id: 'permits',
      name: 'Permits',
      icon: FileStack,
      gradient: 'from-cyan-400 via-cyan-500 to-blue-600',
      path: '/mobile/permits',
    },
    {
      id: 'equipment',
      name: 'Equipment',
      icon: Wrench,
      gradient: 'from-zinc-400 via-zinc-500 to-neutral-600',
      path: '/mobile/equipment',
    },
    {
      id: 'vehicles',
      name: 'Vehicles',
      icon: Car,
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      path: '/mobile/vehicles',
    },
    {
      id: 'recognitions',
      name: 'Recognitions',
      icon: Trophy,
      gradient: 'from-pink-400 via-pink-500 to-yellow-600',
      path: '/mobile/recognitions',
    },
    {
      id: 'updates',
      name: 'Updates',
      icon: Mail,
      gradient: 'from-yellow-400 via-yellow-500 to-orange-600',
      path: '/mobile/updates',
    },
  ];

  // Admin-only apps (Sales, Financials, Analytics) - iOS 26 aesthetic
  const adminApps: AppIconItem[] = [
    // Sales
    {
      id: 'leads',
      name: 'Leads',
      icon: Contact,
      gradient: 'from-emerald-400 via-emerald-500 to-green-600',
      path: '/mobile/leads',
    },
    {
      id: 'estimates',
      name: 'Estimates',
      icon: FileText,
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      path: '/mobile/estimates',
    },
    {
      id: 'proposals',
      name: 'Proposals',
      icon: FileSignature,
      gradient: 'from-violet-500 via-violet-600 to-purple-700',
      path: '/mobile/proposals',
    },
    {
      id: 'contracts',
      name: 'Contracts',
      icon: Scale,
      gradient: 'from-amber-500 via-amber-600 to-orange-700',
      path: '/mobile/contracts',
    },
    
    // Financials
    {
      id: 'invoices',
      name: 'Invoices',
      icon: Receipt,
      gradient: 'from-green-500 via-green-600 to-emerald-700',
      path: '/mobile/invoices',
    },
    {
      id: 'payments',
      name: 'Payments',
      icon: CreditCard,
      gradient: 'from-teal-500 via-teal-600 to-cyan-700',
      path: '/mobile/payments',
    },
    {
      id: 'expenses',
      name: 'Expenses',
      icon: Banknote,
      gradient: 'from-red-500 via-red-600 to-rose-700',
      path: '/mobile/expenses',
    },
    {
      id: 'purchase-orders',
      name: 'POs',
      icon: ShoppingCart,
      gradient: 'from-orange-500 via-orange-600 to-amber-700',
      path: '/mobile/purchase-orders',
    },
    
    // Management
    {
      id: 'change-orders',
      name: 'Change Orders',
      icon: FileQuestion,
      gradient: 'from-yellow-500 via-yellow-600 to-amber-700',
      path: '/mobile/change-orders',
    },
    {
      id: 'bills',
      name: 'Bills',
      icon: DollarSign,
      gradient: 'from-lime-500 via-lime-600 to-green-700',
      path: '/mobile/bills',
    },
    {
      id: 'bid-manager',
      name: 'Bid Manager',
      icon: Hammer,
      gradient: 'from-stone-400 via-stone-500 to-neutral-600',
      path: '/mobile/bid-manager',
    },
    {
      id: 'sub-contracts',
      name: 'Subcontracts',
      icon: Building2,
      gradient: 'from-slate-500 via-slate-600 to-gray-700',
      path: '/mobile/sub-contracts',
    },
    
    // Workforce Management
    {
      id: 'timesheets',
      name: 'Timesheets',
      icon: ClipboardCheck,
      gradient: 'from-indigo-500 via-indigo-600 to-violet-700',
      path: '/mobile/timesheets',
    },
    
    // Analytics & Reports
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      gradient: 'from-indigo-400 via-indigo-500 to-purple-600',
      path: '/mobile/analytics',
    },
    {
      id: 'reports',
      name: 'Reports',
      icon: TrendingUp,
      gradient: 'from-pink-500 via-pink-600 to-rose-700',
      path: '/mobile/reports',
    },
    
    // Admin Tools from AdminTab
    {
      id: 'users-management',
      name: 'Users & Admins',
      icon: Users,
      gradient: 'from-blue-400 via-blue-500 to-blue-700',
      path: '/mobile/admin/users',
    },
    {
      id: 'time-off-management',
      name: 'Time Off Mgmt',
      icon: Sun,
      gradient: 'from-yellow-400 via-yellow-500 to-orange-600',
      path: '/mobile/time-off-management',
    },
    {
      id: 'safety-responses',
      name: 'Safety Responses',
      icon: Shield,
      gradient: 'from-green-400 via-green-500 to-emerald-600',
      path: '/mobile/safety-checklist-responses',
    },
    {
      id: 'skill-levels',
      name: 'Skill Levels',
      icon: Award,
      gradient: 'from-amber-400 via-amber-500 to-yellow-600',
      path: '/mobile/skill-levels',
    },
  ];

  // Fetch AI-generated icons
  const { data: iconMap } = useAppIcons();

  // Combine apps based on admin status and role, then inject AI icons
  const apps = useMemo(() => {
    const isAdminOrOwner = adminStatus?.isAdmin || adminStatus?.isOwner;
    
    let baseApps: AppIconItem[];
    
    // Admins/Owners see everything
    if (isAdminOrOwner) {
      baseApps = [...coreApps, ...adminApps];
    } else if (isContributor) {
      // Contributors see only their allowed subset
      baseApps = coreApps.filter(app => CONTRIBUTOR_ALLOWED_APPS.includes(app.id));
    } else {
      // Other roles (leader, sales, etc.) see all coreApps
      baseApps = coreApps;
    }
    
    // Inject AI-generated icon URLs
    return baseApps.map(app => ({
      ...app,
      iconUrl: iconMap?.[app.id],
    }));
  }, [adminStatus, isContributor, iconMap]);

  return (
    <div className="p-3 xs:p-4 space-y-5 xs:space-y-6 overflow-x-hidden">
      {/* Welcome Section */}
      <div className={cn(
        "space-y-1 xs:space-y-2 transition-all duration-700",
        mounted ? "animate-fade-up" : "opacity-0 translate-y-4"
      )}>
        <h1 className="text-xl xs:text-2xl font-bold text-foreground">
          {getGreeting()}!
        </h1>
        <p className="text-sm xs:text-base text-muted-foreground truncate">
          {user?.email}
        </p>
      </div>

      {/* iPhone-style Paginated App Grid */}
      <div className={cn(
        "transition-all duration-700 -mx-3 xs:-mx-4",
        mounted ? "animate-fade-up" : "opacity-0 translate-y-4"
      )} style={{ animationDelay: '200ms' }}>
        <AppIconCarousel apps={apps} appsPerPage={16} />
      </div>

      {/* My Assignments */}
      <Card className={cn(
        "transition-all duration-700 hover:shadow-lg",
        mounted ? "animate-fade-up" : "opacity-0 translate-y-4"
      )} style={{ animationDelay: '400ms' }}>
        <Collapsible open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>{t('home.myAssignments')}</span>
                </div>
                {scheduleOpen ? (
                  <ChevronUp className="w-4 h-4 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ) : activities.length === 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t('home.noAssignments')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('home.assignmentsTip')}
                  </p>
                </>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {activities.map((activity) => {
                    const isTodays = isToday(activity.date);
                    const isPastDate = isPast(activity.date) && !isTodays;
                    const isDraft = activity.status === 'draft';
                    
                    const IconComponent = activity.icon === 'calendar' ? Calendar 
                      : activity.icon === 'briefcase' ? Briefcase 
                      : ClipboardList;
                    
                    return (
                      <div
                        key={activity.id}
                        onClick={() => navigate(activity.navigateTo)}
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-all relative group hover:scale-[1.02]",
                          isDraft 
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 border-2 border-amber-400/30 border-dashed' 
                            : isPastDate
                            ? 'bg-muted/30 hover:bg-muted/50'
                            : 'bg-muted/50 hover:bg-muted'
                        )}
                      >
                        {isDraft && (
                          <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            DRAFT
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0",
                            activity.color,
                            isPastDate && "opacity-60"
                          )}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-medium text-foreground truncate",
                              isPastDate && "text-muted-foreground"
                            )}>
                              {activity.title}
                            </p>
                            {activity.subtitle && (
                              <p className="text-xs text-muted-foreground truncate">
                                {activity.subtitle}
                              </p>
                            )}
                            <p className={cn(
                              "text-xs mt-1",
                              isTodays ? "text-primary font-medium" : "text-muted-foreground"
                            )}>
                              {isTodays ? `📍 ${t('home.today')}` : format(activity.date, 'EEE, MMM d')} • {format(activity.date, 'h:mm a')}
                            </p>
                          </div>
                          <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Recent Activity */}
      <Card className={cn(
        "transition-all duration-700 hover:shadow-lg",
        mounted ? "animate-fade-up" : "opacity-0 translate-y-4"
      )} style={{ animationDelay: '500ms' }}>
        <Collapsible open={updatesOpen} onOpenChange={setUpdatesOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{t('home.recentProjectUpdates')}</span>
                {updatesOpen ? (
                  <ChevronUp className="w-4 h-4 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {updatesLoading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('home.loadingUpdates')}</p>
                  </div>
                </div>
              ) : updates.length === 0 ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('home.noRecentActivity')}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {t('home.activityWillAppear')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {updates.map((update) => (
                    <div 
                      key={update.id} 
                      className="flex items-start space-x-3 group cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                      onClick={() => update.projectId && navigate(`/mobile/projects`)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                        {update.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {update.projectName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {update.description}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <AIReviewProjectSelectModal
        isOpen={showProjectSelectModal}
        onClose={() => setShowProjectSelectModal(false)}
        onSelectProject={(project) => {
          setSelectedProject(project);
          setShowProjectSelectModal(false);
          setShowQRModal(true);
        }}
      />

      <AIReviewQRModal 
        isOpen={showQRModal} 
        onClose={() => {
          setShowQRModal(false);
          setSelectedProject(null);
        }}
        selectedProject={selectedProject}
      />

      <AssignmentConfirmationDialog
        assignment={pendingAssignment}
        open={!!pendingAssignment}
        onOpenChange={(open) => {
          if (!open && pendingAssignment) return;
          if (!open) setPendingAssignment(null);
        }}
        onConfirm={async () => {
          if (pendingAssignment) {
            setRespondedAssignments(prev => new Set(prev).add(pendingAssignment.id));
          }
          setPendingAssignment(null);
          
          try {
            await Promise.all([refetchShifts(), refetchProjects()]);
          } finally {
            setIsProcessingAssignment(false);
          }
        }}
      />
    </div>
  );
};
