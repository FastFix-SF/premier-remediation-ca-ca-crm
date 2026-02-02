import React from 'react';
import { format } from 'date-fns';
import { Printer, Trash2, ChevronLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDailyLogDetail, useDeleteDailyLog } from '@/hooks/useDailyLogs';
import { DetailsTab } from './tabs/DetailsTab';
import { PeopleTab } from './tabs/PeopleTab';
import { MaterialTab } from './tabs/MaterialTab';
import { EquipmentTab } from './tabs/EquipmentTab';
import { FilesTab } from './tabs/FilesTab';
import { NotesTab } from './tabs/NotesTab';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DailyLogDetailProps {
  logId: string;
  onBack?: () => void;
}

export const DailyLogDetail: React.FC<DailyLogDetailProps> = ({ logId, onBack }) => {
  const { data, isLoading } = useDailyLogDetail(logId);
  const deleteMutation = useDeleteDailyLog();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Daily log not found
      </div>
    );
  }

  const { entry, people, visitors, subcontractors, materials, equipment, notes, files } = data;

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(logId);
    onBack?.();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h2 className="text-xl font-semibold">{entry.project?.name}</h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(entry.log_date), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn('capitalize', getStatusColor(entry.status))}>
            {entry.status}
          </Badge>
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Daily Log?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this daily log and all its associated data
                  (people, materials, equipment, files, and notes). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="details" className="space-y-4">
        <div className="bg-muted/50 rounded-xl border shadow-sm p-1.5 overflow-x-auto scrollbar-hide">
          <TabsList variant="scrollable" className="flex min-w-max">
            <TabsTrigger variant="scrollable" value="details">
              Details
            </TabsTrigger>
            <TabsTrigger variant="scrollable" value="people">
              People ({people.length + visitors.length + subcontractors.length})
            </TabsTrigger>
            <TabsTrigger variant="scrollable" value="material">
              Material ({materials.length})
            </TabsTrigger>
            <TabsTrigger variant="scrollable" value="equipment">
              Equipment ({equipment.length})
            </TabsTrigger>
            <TabsTrigger variant="scrollable" value="files">
              Files ({files.length})
            </TabsTrigger>
            <TabsTrigger variant="scrollable" value="notes">
              Notes ({notes.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="mt-0">
          <DetailsTab entry={entry} />
        </TabsContent>

        <TabsContent value="people" className="mt-0">
          <PeopleTab
            dailyLogId={logId}
            people={people}
            visitors={visitors}
            subcontractors={subcontractors}
          />
        </TabsContent>

        <TabsContent value="material" className="mt-0">
          <MaterialTab dailyLogId={logId} materials={materials} />
        </TabsContent>

        <TabsContent value="equipment" className="mt-0">
          <EquipmentTab dailyLogId={logId} equipment={equipment} />
        </TabsContent>

        <TabsContent value="files" className="mt-0">
          <FilesTab dailyLogId={logId} files={files} />
        </TabsContent>

        <TabsContent value="notes" className="mt-0">
          <NotesTab dailyLogId={logId} notes={notes} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
