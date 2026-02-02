import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useServiceTicketTimeCards } from '@/hooks/useServiceTickets';
import { format } from 'date-fns';

interface ServiceTicketDocumentsTabProps {
  ticketId: string;
}

export const ServiceTicketDocumentsTab: React.FC<ServiceTicketDocumentsTabProps> = ({ ticketId }) => {
  const { data: timeCards = [] } = useServiceTicketTimeCards(ticketId);

  return (
    <div className="space-y-6">
      {/* Previous Service Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="h-2 w-2 bg-blue-500 rounded" />
            Previous Service Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Ticket #</th>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Title</th>
                  <th className="text-left p-3 text-sm font-medium">Tech</th>
                  <th className="text-left p-3 text-sm font-medium">Time On Job</th>
                  <th className="text-left p-3 text-sm font-medium">Service Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No Records Available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Time Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="h-2 w-2 bg-purple-500 rounded" />
            Time Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Employee</th>
                  <th className="text-left p-3 text-sm font-medium">Cost Code</th>
                  <th className="text-right p-3 text-sm font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {timeCards.map((tc) => (
                  <tr key={tc.id} className="border-t">
                    <td className="p-3 text-sm">
                      {format(new Date(tc.work_date), 'MM/dd/yyyy')}
                    </td>
                    <td className="p-3 text-sm">{tc.employee_name || '-'}</td>
                    <td className="p-3 text-sm">{tc.cost_code || '-'}</td>
                    <td className="p-3 text-sm text-right">{tc.duration_hours?.toFixed(2) || '-'}</td>
                  </tr>
                ))}
                {timeCards.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No Records Available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
