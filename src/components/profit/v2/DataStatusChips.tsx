import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';

interface DataStatusChipsProps {
  timesheetsConnected: boolean;
  billsConnected: boolean;
  quoteLinked: boolean;
  quoteId?: string;
}

export const DataStatusChips: React.FC<DataStatusChipsProps> = ({
  timesheetsConnected,
  billsConnected,
  quoteLinked,
  quoteId,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {quoteLinked && quoteId && (
        <Badge variant="outline" className="flex items-center space-x-1">
          <FileText className="h-3 w-3" />
          <span>Linked Quote: #{quoteId}</span>
        </Badge>
      )}
      
      <Badge 
        variant={timesheetsConnected ? "default" : "secondary"} 
        className="flex items-center space-x-1"
      >
        {timesheetsConnected ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <XCircle className="h-3 w-3" />
        )}
        <span>Timesheets {timesheetsConnected ? 'Connected' : 'Not Connected'}</span>
      </Badge>

      <Badge 
        variant={billsConnected ? "default" : "secondary"} 
        className="flex items-center space-x-1"
      >
        {billsConnected ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <XCircle className="h-3 w-3" />
        )}
        <span>Bills {billsConnected ? 'Connected' : 'Not Connected'}</span>
      </Badge>
    </div>
  );
};
