import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Camera, Calendar, FileText, MessageSquare, DollarSign, 
  ArrowRight, ZoomIn, ClipboardList, FileSpreadsheet,
  RefreshCw, PieChart, Wrench
} from 'lucide-react';
import { InteractiveComparison } from '@/components/proposal/InteractiveComparison';
import { PhotoAnnotationViewer } from '@/components/client-portal/PhotoAnnotationViewer';
import { ClientScheduleModal } from '@/components/client-portal/ClientScheduleModal';
import { ClientDocumentsModal } from '@/components/client-portal/ClientDocumentsModal';
import { ClientMessagesModal } from '@/components/client-portal/ClientMessagesModal';
import { ClientInvoicesModal } from '@/components/client-portal/ClientInvoicesModal';
import { ClientDailyLogsModal } from '@/components/client-portal/ClientDailyLogsModal';
import { ClientEstimatesModal } from '@/components/client-portal/ClientEstimatesModal';
import { ClientChangeOrdersModal } from '@/components/client-portal/ClientChangeOrdersModal';
import { ClientFinancialSummaryModal } from '@/components/client-portal/ClientFinancialSummaryModal';
import { ClientWorkOrdersModal } from '@/components/client-portal/ClientWorkOrdersModal';

interface ProjectPhoto {
  id: string;
  photo_url: string;
  photo_tag: string;
  is_highlighted_before?: boolean;
  is_highlighted_after?: boolean;
  caption?: string;
  uploaded_at?: string;
}

interface ClientAccessSettings {
  photos?: boolean;
  schedule?: boolean;
  daily_logs?: boolean;
  documents?: boolean;
  estimates?: boolean;
  invoices?: boolean;
  messaging?: boolean;
  notes?: boolean;
  change_orders?: boolean;
  submittals?: boolean;
  financial_summary?: boolean;
  work_orders?: boolean;
  show_phone?: boolean;
  show_email?: boolean;
}

export const ClientPortalPreview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch project details including client_access_settings
  const { data: project, isLoading } = useQuery({
    queryKey: ['project-client-portal', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, address, client_name, client_phone, client_access_settings')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Helper to check if a module is enabled
  const isModuleEnabled = (moduleId: keyof ClientAccessSettings): boolean => {
    if (!project?.client_access_settings) return true; // Default to showing if no settings
    const settings = project.client_access_settings as unknown as ClientAccessSettings;
    return settings[moduleId] ?? true;
  };

  // Fetch before/after photos
  const { data: photos } = useQuery({
    queryKey: ['client-portal-photos', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_photos')
        .select('id, photo_url, photo_tag, is_highlighted_before, is_highlighted_after, caption, uploaded_at')
        .eq('project_id', id!)
        .in('photo_tag', ['before', 'after']);
      
      if (error) throw error;
      return data as ProjectPhoto[];
    },
    enabled: !!id && isModuleEnabled('photos'),
  });

  const beforePhotos = photos?.filter(p => p.photo_tag === 'before') || [];
  const afterPhotos = photos?.filter(p => p.photo_tag === 'after') || [];
  
  // Get highlighted (featured) photos for the main comparison
  const primaryBefore = beforePhotos.find(p => p.is_highlighted_before) || beforePhotos[0];
  const primaryAfter = afterPhotos.find(p => p.is_highlighted_after) || afterPhotos[0];
  
  // All photos for "The Process" section - before photos first, then after
  const allPhotosInOrder = [...beforePhotos, ...afterPhotos];

  // State for photo annotation viewer
  const [selectedPhoto, setSelectedPhoto] = useState<ProjectPhoto | null>(null);
  
  // State for quick access modals
  const [showSchedule, setShowSchedule] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [showDailyLogs, setShowDailyLogs] = useState(false);
  const [showEstimates, setShowEstimates] = useState(false);
  const [showChangeOrders, setShowChangeOrders] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);
  const [showWorkOrders, setShowWorkOrders] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate(`/admin/projects/${id}/client-access`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
          <h1 className="text-2xl font-bold">{project?.name}</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">{project?.address}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Welcome Message */}
        <Card className="border-none shadow-sm">
          <CardContent className="py-4">
            <h2 className="text-lg font-semibold">Welcome, {project?.client_name || 'Valued Client'}</h2>
            <p className="text-sm text-muted-foreground">
              Track your project progress and view the transformation.
            </p>
          </CardContent>
        </Card>

        {/* Featured Before & After Comparison */}
        {isModuleEnabled('photos') && primaryBefore && primaryAfter && (
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="h-4 w-4 text-primary" />
                Before & After
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <InteractiveComparison
                beforeImage={primaryAfter.photo_url}
                afterImage={primaryBefore.photo_url}
                beforeLabel="Before"
                afterLabel="After"
                viewMode="slider"
                showBadges={true}
              />
              <p className="text-center text-xs text-muted-foreground py-2 bg-muted/30">
                Drag the slider to compare before and after
              </p>
            </CardContent>
          </Card>
        )}

        {/* The Process Section */}
        {isModuleEnabled('photos') && allPhotosInOrder.length > 0 && (
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRight className="h-4 w-4 text-primary" />
                The Process
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                From start to finish - your project journey
              </p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allPhotosInOrder.map((photo, index) => (
                  <div 
                    key={photo.id} 
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={photo.photo_url} 
                        alt={photo.caption || `Photo ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    {/* Hover overlay with zoom icon */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                      <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <Badge 
                      className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 ${
                        photo.photo_tag === 'before' 
                          ? 'bg-orange-500/90 text-white' 
                          : 'bg-green-500/90 text-white'
                      }`}
                    >
                      {photo.photo_tag === 'before' ? 'Before' : 'After'}
                    </Badge>
                    {/* Show step number */}
                    <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </div>
                    {/* Tap to comment hint */}
                    <div className="absolute bottom-2 left-2 text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      Tap to comment
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state when no photos and photos is enabled */}
        {isModuleEnabled('photos') && !primaryBefore && !primaryAfter && allPhotosInOrder.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Camera className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Photos coming soon</p>
            </CardContent>
          </Card>
        )}

        {/* Quick Access Cards - only show enabled modules */}
        {(isModuleEnabled('schedule') || isModuleEnabled('documents') || isModuleEnabled('messaging') || isModuleEnabled('invoices') || isModuleEnabled('daily_logs') || isModuleEnabled('estimates') || isModuleEnabled('change_orders') || isModuleEnabled('financial_summary') || isModuleEnabled('work_orders')) && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {isModuleEnabled('schedule') && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                onClick={() => setShowSchedule(true)}
              >
                <CardContent className="py-4 text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <p className="font-medium text-xs">Schedule</p>
                </CardContent>
              </Card>
            )}
            {isModuleEnabled('documents') && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                onClick={() => setShowDocuments(true)}
              >
                <CardContent className="py-4 text-center">
                  <FileText className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <p className="font-medium text-xs">Documents</p>
                </CardContent>
              </Card>
            )}
            {isModuleEnabled('messaging') && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                onClick={() => setShowMessages(true)}
              >
                <CardContent className="py-4 text-center">
                  <MessageSquare className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <p className="font-medium text-xs">Messages</p>
                </CardContent>
              </Card>
            )}
            {isModuleEnabled('invoices') && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                onClick={() => setShowInvoices(true)}
              >
                <CardContent className="py-4 text-center">
                  <DollarSign className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <p className="font-medium text-xs">Invoices</p>
                </CardContent>
              </Card>
            )}
            {isModuleEnabled('daily_logs') && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                onClick={() => setShowDailyLogs(true)}
              >
                <CardContent className="py-4 text-center">
                  <ClipboardList className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <p className="font-medium text-xs">Daily Logs</p>
                </CardContent>
              </Card>
            )}
            {isModuleEnabled('estimates') && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                onClick={() => setShowEstimates(true)}
              >
                <CardContent className="py-4 text-center">
                  <FileSpreadsheet className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <p className="font-medium text-xs">Estimates</p>
                </CardContent>
              </Card>
            )}
            {isModuleEnabled('change_orders') && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                onClick={() => setShowChangeOrders(true)}
              >
                <CardContent className="py-4 text-center">
                  <RefreshCw className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <p className="font-medium text-xs">Change Orders</p>
                </CardContent>
              </Card>
            )}
            {isModuleEnabled('financial_summary') && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                onClick={() => setShowFinancialSummary(true)}
              >
                <CardContent className="py-4 text-center">
                  <PieChart className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <p className="font-medium text-xs">Financials</p>
                </CardContent>
              </Card>
            )}
            {isModuleEnabled('work_orders') && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                onClick={() => setShowWorkOrders(true)}
              >
                <CardContent className="py-4 text-center">
                  <Wrench className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <p className="font-medium text-xs">Work Orders</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Preview Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>Preview Mode:</strong> This is how your client will see their portal.
          </p>
        </div>
      </div>

      {/* Photo Annotation Viewer */}
      {selectedPhoto && (
        <PhotoAnnotationViewer
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          photo={selectedPhoto}
          projectId={id!}
          clientName={project?.client_name}
        />
      )}

      {/* Quick Access Modals */}
      <ClientScheduleModal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        projectId={id!}
        projectName={project?.name}
      />
      <ClientDocumentsModal
        isOpen={showDocuments}
        onClose={() => setShowDocuments(false)}
        projectId={id!}
        projectName={project?.name}
      />
      <ClientMessagesModal
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
        projectId={id!}
        projectName={project?.name}
        clientName={project?.client_name}
      />
      <ClientInvoicesModal
        isOpen={showInvoices}
        onClose={() => setShowInvoices(false)}
        projectId={id!}
        projectName={project?.name}
      />
      <ClientDailyLogsModal
        isOpen={showDailyLogs}
        onClose={() => setShowDailyLogs(false)}
        projectId={id!}
        projectName={project?.name}
      />
      <ClientEstimatesModal
        isOpen={showEstimates}
        onClose={() => setShowEstimates(false)}
        projectId={id!}
        projectName={project?.name}
      />
      <ClientChangeOrdersModal
        isOpen={showChangeOrders}
        onClose={() => setShowChangeOrders(false)}
        projectId={id!}
        projectName={project?.name}
      />
      <ClientFinancialSummaryModal
        isOpen={showFinancialSummary}
        onClose={() => setShowFinancialSummary(false)}
        projectId={id!}
        projectName={project?.name}
      />
      <ClientWorkOrdersModal
        isOpen={showWorkOrders}
        onClose={() => setShowWorkOrders(false)}
        projectId={id!}
        projectName={project?.name}
      />
    </div>
  );
};
