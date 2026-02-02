import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar, Wrench, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  unscheduled: { label: 'Unscheduled', color: 'bg-muted text-muted-foreground' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
  en_route: { label: 'En Route', color: 'bg-yellow-100 text-yellow-800' },
  checked_in: { label: 'In Progress', color: 'bg-orange-100 text-orange-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
};

export default function CustomerServiceTicketView() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Debug logging to confirm component mounts
  useEffect(() => {
    console.log('CustomerServiceTicketView mounted, token:', token ? token.slice(0, 8) + '...' : 'none');
  }, [token]);

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['customer-ticket', token],
    queryFn: async () => {
      if (!token) throw new Error('No access token provided');

      console.log('Invoking customer-service-ticket edge function...');
      const { data, error } = await supabase.functions.invoke('customer-service-ticket', {
        body: { token },
      });

      console.log('Edge function response:', { data, error });

      // Handle edge function errors (including those returned in data)
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    enabled: !!token,
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Invalid or missing access link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              This service ticket could not be found or the link has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[ticket.status] || STATUS_LABELS.unscheduled;
  const fullAddress = [
    ticket.service_address,
    ticket.service_city,
    ticket.service_state,
    ticket.service_zip,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{ticket.title}</h1>
              <p className="text-primary-foreground/80 text-sm">{ticket.ticket_number}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Service Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              {ticket.status === 'completed' && (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Service Complete</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Card */}
        {(ticket.scheduled_date || ticket.scheduled_time) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Scheduled Visit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                {ticket.scheduled_date && (
                  <span>{format(new Date(ticket.scheduled_date), 'EEEE, MMMM d, yyyy')}</span>
                )}
                {ticket.scheduled_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {ticket.scheduled_time}
                  </span>
                )}
              </div>
              {ticket.duration_hours && (
                <p className="text-sm text-muted-foreground mt-1">
                  Estimated duration: {ticket.duration_hours} hour(s)
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Location Card */}
        {fullAddress && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Service Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{fullAddress}</p>
              <div className="mt-3 h-40 rounded-lg overflow-hidden">
                <iframe
                  title="Service location map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`}
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description Card */}
        {ticket.description && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Service Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Service Notes Card */}
        {ticket.service_notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Service Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{ticket.service_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 pb-8">
          <p>Last updated: {format(new Date(ticket.updated_at), 'MMM d, yyyy h:mm a')}</p>
        </div>
      </div>
    </div>
  );
}