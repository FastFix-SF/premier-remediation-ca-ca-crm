import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useServiceTicket, useServiceTicketFiles } from '@/hooks/useServiceTickets';
import { ServiceTicketHeader } from '@/mobile/components/ServiceTicketHeader';
import { ServiceTicketActionBar } from '@/mobile/components/ServiceTicketActionBar';
import { ServiceTicketPhotoCaptureModal } from '@/mobile/components/ServiceTicketPhotoCaptureModal';
import { ServiceTicketSettingsModal } from '@/mobile/components/ServiceTicketSettingsModal';
import { ServiceTicketTasksModal } from '@/mobile/components/ServiceTicketTasksModal';
import { ServiceTicketChatModal } from '@/mobile/components/ServiceTicketChatModal';
import { ServiceTicketInvoicesModal } from '@/mobile/components/ServiceTicketInvoicesModal';
import { ServiceTicketPhotoGallery } from '@/mobile/components/ServiceTicketPhotoGallery';
import { ServiceTicketDocumentsModal } from '@/mobile/components/ServiceTicketDocumentsModal';
import { ServiceTicketUploadFileModal } from '@/mobile/components/ServiceTicketUploadFileModal';
import { ServiceTicketCreateReportModal } from '@/mobile/components/ServiceTicketCreateReportModal';

export const ServiceTicketDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [showPhotoCaptureModal, setShowPhotoCaptureModal] = useState(false);
  const [showTicketSettings, setShowTicketSettings] = useState(false);
  const [showTicketChat, setShowTicketChat] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [initialPhotoIndex, setInitialPhotoIndex] = useState<number | null>(null);

  const { data: ticket, isLoading: ticketLoading, error: ticketError } = useServiceTicket(id || null);
  const { data: files = [] } = useServiceTicketFiles(id || null);
  
  // Filter files to get photos (images)
  const photos = files.filter(f => 
    f.file_type?.startsWith('image/') || 
    f.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  );

  if (ticketLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading ticket...</p>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-destructive">Failed to load ticket</p>
        <Button onClick={() => navigate('/mobile/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const handleTicketEdit = () => {
    setShowTicketSettings(true);
  };

  // Build full address from ticket fields
  const fullAddress = [
    ticket.service_address,
    ticket.service_city,
    ticket.service_state,
    ticket.service_zip
  ].filter(Boolean).join(', ');

  return (
    <div className="flex flex-col h-full bg-muted/30 overflow-y-auto">
      {/* Enhanced Header */}
      <ServiceTicketHeader 
        ticket={ticket}
        photos={photos}
        address={fullAddress}
        onEdit={handleTicketEdit}
        onSeeAllPhotos={() => {
          setInitialPhotoIndex(null);
          setShowPhotoGallery(true);
        }}
        onPhotoClick={(index) => {
          setInitialPhotoIndex(index);
          setShowPhotoGallery(true);
        }}
        onPaymentsClick={() => setShowInvoices(true)}
        onCustomerClick={() => setShowTicketSettings(true)}
        onTasksClick={() => setShowTasks(true)}
        onReportsClick={() => setShowReportsModal(true)}
        onFilesClick={() => setShowFilesModal(true)}
      />

      {/* Bottom padding for floating action bar */}
      <div className="h-24 shrink-0" />

      {/* Ticket Action Bar */}
      <ServiceTicketActionBar 
        onPlusClick={() => setShowTicketSettings(true)} 
        onCameraClick={() => setShowPhotoCaptureModal(true)} 
        onChatClick={() => setShowTicketChat(true)}
        onUploadPhotos={() => setShowPhotoCaptureModal(true)}
        onUploadFile={() => setShowUploadFile(true)}
        onCreateTask={() => setShowTasks(true)}
        onCreateReport={() => setShowCreateReport(true)}
      />

      {/* Photo Gallery Dialog */}
      <Dialog open={showPhotoGallery} onOpenChange={setShowPhotoGallery}>
        <DialogContent className="max-w-md h-auto max-h-[70vh] p-0 bg-background">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>Ticket Photos</DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPhotoGallery(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <ServiceTicketPhotoGallery 
              ticketId={id || ''} 
              photos={photos} 
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
      {id && (
        <>
          <ServiceTicketPhotoCaptureModal 
            isOpen={showPhotoCaptureModal} 
            onClose={() => setShowPhotoCaptureModal(false)} 
            ticketId={id} 
          />
          
          <ServiceTicketSettingsModal 
            isOpen={showTicketSettings} 
            onClose={() => setShowTicketSettings(false)} 
            ticket={ticket} 
          />
          
          <ServiceTicketChatModal 
            isOpen={showTicketChat} 
            onClose={() => setShowTicketChat(false)} 
            ticketId={id} 
            ticketTitle={ticket?.title || 'Ticket'} 
          />
          
          <ServiceTicketTasksModal 
            isOpen={showTasks} 
            onClose={() => setShowTasks(false)} 
            ticketId={id} 
            ticketTitle={ticket?.title || 'Ticket'} 
          />
          
          <ServiceTicketInvoicesModal 
            isOpen={showInvoices} 
            onClose={() => setShowInvoices(false)} 
            ticketId={id} 
            ticketTitle={ticket?.title || 'Ticket'}
            customerName={ticket?.customer?.name}
            customerEmail={ticket?.customer?.email}
            address={fullAddress}
          />
          
          <ServiceTicketCreateReportModal
            isOpen={showCreateReport}
            onClose={() => setShowCreateReport(false)}
            ticketId={id}
            ticketTitle={ticket?.title || 'Ticket'}
          />
          
          <ServiceTicketUploadFileModal
            isOpen={showUploadFile}
            onClose={() => setShowUploadFile(false)}
            ticketId={id}
          />
          
          <ServiceTicketDocumentsModal
            isOpen={showReportsModal}
            onClose={() => setShowReportsModal(false)}
            ticketId={id}
            category="reports"
            title="Reports"
          />
          
          <ServiceTicketDocumentsModal
            isOpen={showFilesModal}
            onClose={() => setShowFilesModal(false)}
            ticketId={id}
            category="files"
            title="Files"
          />
        </>
      )}
    </div>
  );
};
