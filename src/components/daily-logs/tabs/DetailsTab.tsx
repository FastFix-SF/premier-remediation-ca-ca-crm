import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, MapPin, AlertTriangle, CloudRain, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { WeatherWidget } from '../WeatherWidget';
import { DailyLogEntry, useUpdateDailyLog } from '@/hooks/useDailyLogs';
import { cn } from '@/lib/utils';

interface DetailsTabProps {
  entry: DailyLogEntry;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({ entry }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tasksPerformed, setTasksPerformed] = useState(entry.tasks_performed || '');
  const [siteCondition, setSiteCondition] = useState(entry.site_condition);
  const [siteConditionNotes, setSiteConditionNotes] = useState(entry.site_condition_notes || '');
  const [hasWeatherDelay, setHasWeatherDelay] = useState(entry.has_weather_delay);
  const [hasScheduleDelay, setHasScheduleDelay] = useState(entry.has_schedule_delay);
  const [delayNotes, setDelayNotes] = useState(entry.delay_notes || '');

  const updateMutation = useUpdateDailyLog();

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: entry.id,
      tasks_performed: tasksPerformed,
      site_condition: siteCondition,
      site_condition_notes: siteConditionNotes,
      has_weather_delay: hasWeatherDelay,
      has_schedule_delay: hasScheduleDelay,
      delay_notes: delayNotes,
    });
    setIsEditing(false);
  };

  const getSiteConditionColor = (condition: string) => {
    switch (condition) {
      case 'good':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'poor':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          <span>{format(new Date(entry.log_date), 'EEEE, MMMM d, yyyy')}</span>
        </div>
        {entry.arrival_time && entry.departure_time && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              {entry.arrival_time.slice(0, 5)} - {entry.departure_time.slice(0, 5)}
            </span>
          </div>
        )}
        {entry.project?.address && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{entry.project.address}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Weather */}
        <div>
          <h3 className="text-sm font-medium mb-2">Weather</h3>
          <WeatherWidget weatherData={entry.weather_data || {}} />
        </div>

        {/* Site Condition */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jobsite Condition</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="flex gap-2">
                {(['good', 'fair', 'poor'] as const).map((condition) => (
                  <Button
                    key={condition}
                    variant={siteCondition === condition ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSiteCondition(condition)}
                    className="capitalize"
                  >
                    {condition}
                  </Button>
                ))}
              </div>
            ) : (
              <Badge className={cn('capitalize', getSiteConditionColor(entry.site_condition))}>
                {entry.site_condition}
              </Badge>
            )}
            {entry.site_condition_notes && !isEditing && (
              <p className="text-sm text-muted-foreground mt-2">{entry.site_condition_notes}</p>
            )}
            {isEditing && (
              <Textarea
                value={siteConditionNotes}
                onChange={(e) => setSiteConditionNotes(e.target.value)}
                placeholder="Notes about site condition..."
                className="mt-2"
                rows={2}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tasks Performed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tasks Performed</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={tasksPerformed}
              onChange={(e) => setTasksPerformed(e.target.value)}
              placeholder="Describe the work completed..."
              rows={4}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">
              {entry.tasks_performed || 'No tasks recorded'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delays */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Delays
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Checkbox
                  id="weather-delay"
                  checked={hasWeatherDelay}
                  onCheckedChange={(checked) => setHasWeatherDelay(checked as boolean)}
                />
              ) : (
                <Checkbox id="weather-delay" checked={entry.has_weather_delay} disabled />
              )}
              <Label htmlFor="weather-delay" className="flex items-center gap-1">
                <CloudRain className="w-4 h-4" />
                Weather Delay
              </Label>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Checkbox
                  id="schedule-delay"
                  checked={hasScheduleDelay}
                  onCheckedChange={(checked) => setHasScheduleDelay(checked as boolean)}
                />
              ) : (
                <Checkbox id="schedule-delay" checked={entry.has_schedule_delay} disabled />
              )}
              <Label htmlFor="schedule-delay" className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                Schedule Delay
              </Label>
            </div>
          </div>

          {(entry.has_weather_delay || entry.has_schedule_delay || isEditing) && (
            isEditing ? (
              <Textarea
                value={delayNotes}
                onChange={(e) => setDelayNotes(e.target.value)}
                placeholder="Explain the delay..."
                rows={2}
              />
            ) : entry.delay_notes ? (
              <p className="text-sm text-muted-foreground">{entry.delay_notes}</p>
            ) : null
          )}
        </CardContent>
      </Card>

      {/* Edit/Save Buttons */}
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              Save Changes
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit Details
          </Button>
        )}
      </div>
    </div>
  );
};
