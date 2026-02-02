import React, { useState } from 'react';
import { Plus, Search, List, LayoutGrid, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useServiceTickets, TICKET_STATUSES, ServiceTicket } from '@/hooks/useServiceTickets';
import { ServiceTicketDetailView } from './ServiceTicketDetailView';
import { CreateServiceTicketDialog } from './CreateServiceTicketDialog';
import { format } from 'date-fns';

export const ServiceTicketsManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: tickets = [], isLoading } = useServiceTickets();

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.service_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ticketsByStatus = TICKET_STATUSES.reduce((acc, status) => {
    acc[status.key] = filteredTickets.filter(t => t.status === status.key);
    return acc;
  }, {} as Record<string, ServiceTicket[]>);

  if (selectedTicketId) {
    return (
      <ServiceTicketDetailView
        ticketId={selectedTicketId}
        onBack={() => setSelectedTicketId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Service Tickets</h2>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Service Ticket
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {TICKET_STATUSES.map((status) => (
            <div key={status.key} className="flex-shrink-0 w-72">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs ${status.color}`}>
                      {status.label}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {ticketsByStatus[status.key]?.length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {ticketsByStatus[status.key]?.map((ticket) => (
                    <Card
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedTicketId(ticket.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm truncate flex-1">
                            {ticket.customer?.name || 'No Customer'}
                          </span>
                          <Badge variant="outline" className="text-xs ml-2 shrink-0">
                            {ticket.ticket_number}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {ticket.title}
                        </p>
                        {ticket.service_address && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {ticket.service_address}
                          </p>
                        )}
                        {ticket.scheduled_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(ticket.scheduled_date), 'MM/dd/yyyy')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {(!ticketsByStatus[status.key] || ticketsByStatus[status.key].length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No tickets
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Ticket #</th>
                    <th className="text-left p-3 text-sm font-medium">Customer</th>
                    <th className="text-left p-3 text-sm font-medium">Title</th>
                    <th className="text-left p-3 text-sm font-medium">Address</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-left p-3 text-sm font-medium">Scheduled</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => {
                    const statusInfo = TICKET_STATUSES.find(s => s.key === ticket.status);
                    return (
                      <tr
                        key={ticket.id}
                        className="border-t cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedTicketId(ticket.id)}
                      >
                        <td className="p-3 text-sm">
                          <Badge variant="outline">{ticket.ticket_number}</Badge>
                        </td>
                        <td className="p-3 text-sm">{ticket.customer?.name || '-'}</td>
                        <td className="p-3 text-sm">{ticket.title}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {ticket.service_address || '-'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${statusInfo?.color || ''}`}>
                            {statusInfo?.label || ticket.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {ticket.scheduled_date
                            ? format(new Date(ticket.scheduled_date), 'MM/dd/yyyy')
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No tickets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateServiceTicketDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};
