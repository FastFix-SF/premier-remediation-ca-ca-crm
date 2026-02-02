import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Link2, Download } from 'lucide-react';

interface EmptyLaborStateProps {
  isLinked: boolean;
  onLinkJob: () => void;
  onSyncLabor: () => void;
}

export const EmptyLaborState: React.FC<EmptyLaborStateProps> = ({
  isLinked,
  onLinkJob,
  onSyncLabor
}) => {
  return (
    <Card className="border-dashed border-2 border-muted">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">No Labor Data Available</h3>
        
        {!isLinked ? (
          <>
            <p className="text-muted-foreground mb-6 max-w-md">
              To view labor costs and employee data, first link this project to a ConnectTeam job.
            </p>
            <Button onClick={onLinkJob} className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Link ConnectTeam Job
            </Button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mb-6 max-w-md">
              Project is linked to ConnectTeam, but no labor data has been synced yet. 
              Click the button below to import timesheet data from ConnectTeam.
            </p>
            <Button onClick={onSyncLabor} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Sync Labor Data
            </Button>
          </>
        )}
        
        <div className="mt-6 text-sm text-muted-foreground">
          <p className="mb-1">Labor data includes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Employee timesheets and hours worked</li>
            <li>Regular and overtime hours tracking</li>
            <li>Labor costs based on pay rates</li>
            <li>Shift timeline and location data</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};