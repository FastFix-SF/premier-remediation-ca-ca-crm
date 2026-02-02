import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Zap, 
  Clock, 
  MapPin, 
  ChevronRight,
  Filter,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Truck,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useServiceTickets, TICKET_STATUSES, ServiceTicket } from '@/hooks/useServiceTickets';
import { format } from 'date-fns';
import { MobileCreateServiceTicketSheet } from '../components/MobileCreateServiceTicketSheet';

const statusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  unscheduled: { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  scheduled: { icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  en_route: { icon: Truck, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  checked_in: { icon: MapPin, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  requires_followup: { icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  completed: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100' },
  cancelled: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

export const ServiceTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  
  const { data: tickets = [], isLoading } = useServiceTickets();

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch = 
        ticket.title.toLowerCase().includes(search.toLowerCase()) ||
        ticket.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
        ticket.service_address?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = !selectedStatus || ticket.status === selectedStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, selectedStatus]);

  const groupedTickets = useMemo(() => {
    const groups: Record<string, ServiceTicket[]> = {};
    
    filteredTickets.forEach((ticket) => {
      const status = ticket.status || 'unscheduled';
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(ticket);
    });
    
    return groups;
  }, [filteredTickets]);

  const getStatusLabel = (status: string) => {
    return TICKET_STATUSES.find(s => s.key === status)?.label || status;
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.unscheduled;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20 shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Service Tickets
            </h1>
            <p className="text-sm text-white/80">
              {tickets.length} total tickets
            </p>
          </div>
          <Button
            size="icon"
            className="bg-white/20 hover:bg-white/30 text-white shrink-0"
            onClick={() => setShowFilters(true)}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-200" />
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
            />
          </div>
        </div>

        {/* Active Filter Badge */}
        {selectedStatus && (
          <div className="px-4 pb-3">
            <Badge 
              variant="secondary" 
              className="bg-white/20 text-white hover:bg-white/30 cursor-pointer"
              onClick={() => setSelectedStatus(null)}
            >
              {getStatusLabel(selectedStatus)} × Clear
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 pb-24">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Zap className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No tickets found</h3>
              <p className="text-muted-foreground text-sm">
                {search ? 'Try adjusting your search' : 'Create your first service ticket'}
              </p>
            </div>
          ) : (
            Object.entries(groupedTickets).map(([status, statusTickets]) => {
              const config = getStatusConfig(status);
              const StatusIcon = config.icon;
              
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                      <StatusIcon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      {getStatusLabel(status)}
                    </h2>
                    <Badge variant="secondary" className="ml-auto">
                      {statusTickets.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {statusTickets.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-30">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          onClick={() => setShowCreateSheet(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Filter Sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Filter Tickets</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-6">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedStatus === null ? "default" : "outline"}
                className="justify-start"
                onClick={() => {
                  setSelectedStatus(null);
                  setShowFilters(false);
                }}
              >
                All Tickets
              </Button>
              {TICKET_STATUSES.map((status) => {
                const config = getStatusConfig(status.key);
                const StatusIcon = config.icon;
                return (
                  <Button
                    key={status.key}
                    variant={selectedStatus === status.key ? "default" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => {
                      setSelectedStatus(status.key);
                      setShowFilters(false);
                    }}
                  >
                    <StatusIcon className="h-4 w-4" />
                    {status.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Ticket Sheet */}
      <MobileCreateServiceTicketSheet 
        open={showCreateSheet} 
        onOpenChange={setShowCreateSheet} 
      />
    </div>
  );
};

interface TicketCardProps {
  ticket: ServiceTicket;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
  const navigate = useNavigate();
  const config = statusConfig[ticket.status] || statusConfig.unscheduled;
  
  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border-l-4"
      style={{ borderLeftColor: config.color.replace('text-', '').includes('gray') ? '#9ca3af' : 
               config.color.includes('blue') ? '#2563eb' :
               config.color.includes('yellow') ? '#ca8a04' :
               config.color.includes('purple') ? '#9333ea' :
               config.color.includes('orange') ? '#ea580c' :
               config.color.includes('green') ? '#16a34a' :
               config.color.includes('red') ? '#dc2626' : '#9ca3af' }}
      onClick={() => navigate(`/mobile/service-tickets/${ticket.id}`)}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
          <Zap className={`h-5 w-5 ${config.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{ticket.title}</h3>
              <p className="text-xs text-muted-foreground">#{ticket.ticket_number}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>
          
          {ticket.service_address && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">
                {ticket.service_address}
                {ticket.service_city && `, ${ticket.service_city}`}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-3 mt-2">
            {ticket.scheduled_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(ticket.scheduled_date), 'MMM d')}</span>
              </div>
            )}
            {ticket.duration_hours && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{ticket.duration_hours}h</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
