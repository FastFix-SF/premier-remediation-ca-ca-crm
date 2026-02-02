import React, { useState } from 'react';
import { ArrowLeft, Clock, MapPin, User, FileText, DollarSign, Folder, MessageSquare, Wrench, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useServiceTicket, useUpdateServiceTicket, TICKET_STATUSES } from '@/hooks/useServiceTickets';
import { format } from 'date-fns';
import { ServiceTicketDetailsTab } from './tabs/ServiceTicketDetailsTab';
import { ServiceTicketCustomerTab } from './tabs/ServiceTicketCustomerTab';
import { ServiceTicketServiceTab } from './tabs/ServiceTicketServiceTab';
import { ServiceTicketBillingTab } from './tabs/ServiceTicketBillingTab';
import { ServiceTicketDocumentsTab } from './tabs/ServiceTicketDocumentsTab';
import { ServiceTicketFilesTab } from './tabs/ServiceTicketFilesTab';
import { ServiceTicketNotesTab } from './tabs/ServiceTicketNotesTab';

interface ServiceTicketDetailViewProps {
  ticketId: string;
  onBack: () => void;
}

const STATUS_STEPS = ['unscheduled', 'scheduled', 'en_route', 'checked_in', 'completed'];

export const ServiceTicketDetailView: React.FC<ServiceTicketDetailViewProps> = ({
  ticketId,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const { data: ticket, isLoading } = useServiceTicket(ticketId);
  const updateTicket = useUpdateServiceTicket();

  if (isLoading || !ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const statusInfo = TICKET_STATUSES.find(s => s.key === ticket.status);
  const currentStepIndex = STATUS_STEPS.indexOf(ticket.status);

  const handleStatusChange = (newStatus: string) => {
    updateTicket.mutate({
      ticketId: ticket.id,
      updates: { status: newStatus },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{ticket.title}</h1>
                <ExternalLink className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {ticket.service_address && (
                  <span>{ticket.service_address}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <Badge className={statusInfo?.color || ''}>{statusInfo?.label || ticket.status}</Badge>
        <Badge variant="outline">{ticket.ticket_number}</Badge>
      </div>

      {/* Status Stepper */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, index) => {
              const stepInfo = TICKET_STATUSES.find(s => s.key === step);
              const isComplete = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isClickable = index <= currentStepIndex + 1;

              return (
                <React.Fragment key={step}>
                  <button
                    className={`flex flex-col items-center gap-1 ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                    onClick={() => isClickable && handleStatusChange(step)}
                    disabled={!isClickable || updateTicket.isPending}
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isComplete
                          ? 'bg-primary border-primary text-primary-foreground'
                          : isCurrent
                          ? 'border-primary text-primary'
                          : 'border-muted text-muted-foreground'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className={`text-xs ${isCurrent ? 'font-medium' : 'text-muted-foreground'}`}>
                      {stepInfo?.label}
                    </span>
                  </button>
                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Clock Into Ticket Button */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2">
        <Button variant="link" className="text-primary p-0 h-auto">
          <Clock className="h-4 w-4 mr-2" />
          Clock Into This Ticket
        </Button>
        <span className="text-sm text-muted-foreground">
          Time on Job: {ticket.duration_hours || 0}:00
        </span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="details" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="customer" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Customer</span>
          </TabsTrigger>
          <TabsTrigger value="service" className="flex items-center gap-1">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Service</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <Folder className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Files</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="details">
            <ServiceTicketDetailsTab ticket={ticket} />
          </TabsContent>
          <TabsContent value="customer">
            <ServiceTicketCustomerTab ticket={ticket} />
          </TabsContent>
          <TabsContent value="service">
            <ServiceTicketServiceTab ticketId={ticket.id} />
          </TabsContent>
          <TabsContent value="billing">
            <ServiceTicketBillingTab ticketId={ticket.id} />
          </TabsContent>
          <TabsContent value="documents">
            <ServiceTicketDocumentsTab ticketId={ticket.id} />
          </TabsContent>
          <TabsContent value="files">
            <ServiceTicketFilesTab ticketId={ticket.id} />
          </TabsContent>
          <TabsContent value="notes">
            <ServiceTicketNotesTab ticketId={ticket.id} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-4">
          <span>Created: {format(new Date(ticket.created_at), 'MM/dd/yyyy')}</span>
          <span>{format(new Date(ticket.created_at), 'hh:mm a')}</span>
        </div>
        <Button variant="link" className="text-muted-foreground p-0 h-auto">
          <Clock className="h-4 w-4 mr-1" />
          Timeline
        </Button>
      </div>
    </div>
  );
};
