import React, { useState, useMemo } from 'react';
import { Plus, Calendar as CalendarIcon, List, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { DailyLogsCalendar } from './DailyLogsCalendar';
import { DailyLogsList } from './DailyLogsList';
import { DailyLogDetail } from './DailyLogDetail';
import { CreateDailyLogDialog } from './CreateDailyLogDialog';

interface DailyLogsTabProps {
  projectId?: string;
}

export const DailyLogsTab: React.FC<DailyLogsTabProps> = ({ projectId }) => {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);

  const { data: logs = [], isLoading } = useDailyLogs(projectId);

  // Filter logs by selected date if one is selected
  const filteredLogs = useMemo(() => {
    if (!selectedDate) return logs;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return logs.filter((log) => log.log_date === dateStr);
  }, [logs, selectedDate]);

  const handleSelectLog = (logId: string) => {
    setSelectedLogId(logId);
  };

  const handleBack = () => {
    setSelectedLogId(null);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedLogId(null);
  };

  // If a log is selected, show the detail view
  if (selectedLogId) {
    return <DailyLogDetail logId={selectedLogId} onBack={handleBack} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Daily Logs</h2>
          <p className="text-sm text-muted-foreground">
            Track daily activities, materials, equipment, and notes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCalendar(!showCalendar)}
            className="hidden md:flex"
          >
            {showCalendar ? <List className="w-4 h-4 mr-2" /> : <CalendarIcon className="w-4 h-4 mr-2" />}
            {showCalendar ? 'List View' : 'Calendar'}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Daily Log
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left Sidebar - Calendar & List */}
        <div className="space-y-4">
          {showCalendar && (
            <DailyLogsCalendar
              logs={logs}
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
            />
          )}

          {/* Filter Info */}
          {selectedDate && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
              <span className="text-sm">
                Showing: <strong>{format(selectedDate, 'MMM d, yyyy')}</strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(undefined)}
              >
                Clear
              </Button>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <List className="w-4 h-4" />
              {selectedDate ? 'Logs for Selected Date' : 'All Daily Logs'}
            </h3>
            <DailyLogsList
              logs={filteredLogs}
              selectedLogId={selectedLogId}
              onSelectLog={handleSelectLog}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right Content - Empty State or Selected Log */}
        <div className="bg-muted/30 rounded-xl border border-dashed flex items-center justify-center min-h-[400px]">
          <div className="text-center p-8">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Select a Daily Log</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a daily log from the list to view details, or create a new one.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Log
            </Button>
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <CreateDailyLogDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
      />
    </div>
  );
};
