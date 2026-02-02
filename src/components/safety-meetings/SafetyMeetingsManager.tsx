import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, HardHat, Calendar, Clock, MapPin, Users, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { format, differenceInDays, startOfYear, startOfMonth } from 'date-fns';
import { useSafetyMeetings, useCreateSafetyMeeting, useSafetyMeetingAttendees, SafetyMeeting } from '@/hooks/useSafetyMeetings';
import { SafetyMeetingDetailsTab } from './tabs/SafetyMeetingDetailsTab';
import { SafetyMeetingFilesTab } from './tabs/SafetyMeetingFilesTab';
import { SafetyMeetingNotesTab } from './tabs/SafetyMeetingNotesTab';

export function SafetyMeetingsManager() {
  const { data: meetings = [], isLoading } = useSafetyMeetings();
  const createMeeting = useCreateSafetyMeeting();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<SafetyMeeting | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const filteredMeetings = useMemo(() => {
    return meetings.filter(m =>
      m.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.meeting_leader_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [meetings, searchTerm]);

  // Stats calculations
  const stats = useMemo(() => {
    const yearStart = startOfYear(new Date());
    const monthStart = startOfMonth(new Date());
    
    const thisYearMeetings = meetings.filter(m => new Date(m.meeting_date) >= yearStart);
    const thisMonthMeetings = meetings.filter(m => new Date(m.meeting_date) >= monthStart);
    const completedThisYear = thisYearMeetings.filter(m => m.status === 'completed');
    
    // Days since last meeting
    const lastMeeting = meetings
      .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime())[0];
    const daysSinceLastMeeting = lastMeeting 
      ? differenceInDays(new Date(), new Date(lastMeeting.meeting_date))
      : 0;

    return {
      thisMonth: thisMonthMeetings.length,
      thisYear: thisYearMeetings.length,
      completedThisYear: completedThisYear.length,
      daysSinceLastMeeting,
    };
  }, [meetings]);

  const handleNewMeeting = async () => {
    const result = await createMeeting.mutateAsync({
      topic: 'New Safety Meeting',
      meeting_date: new Date().toISOString().split('T')[0],
      status: 'in-process',
    });
    setSelectedMeeting(result as SafetyMeeting);
    setDialogOpen(true);
    setActiveTab('details');
  };

  const handleOpenMeeting = (meeting: SafetyMeeting) => {
    setSelectedMeeting(meeting);
    setDialogOpen(true);
    setActiveTab('details');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">Meetings held</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Year</CardTitle>
            <HardHat className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedThisYear} / {stats.thisYear}</div>
            <p className="text-xs text-muted-foreground">Completed / Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Since</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.daysSinceLastMeeting}</div>
            <p className="text-xs text-muted-foreground">Last Safety Meeting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.thisYear > 0 ? Math.round((stats.completedThisYear / stats.thisYear) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleNewMeeting}>
          <Plus className="mr-2 h-4 w-4" />
          Safety Meeting
        </Button>
      </div>

      {/* Meetings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Safety Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meeting Date</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Meeting Leader</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No safety meetings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMeetings.map((meeting) => (
                  <TableRow 
                    key={meeting.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleOpenMeeting(meeting)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{format(new Date(meeting.meeting_date), 'MM/dd/yyyy')}</div>
                          {meeting.meeting_time && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {meeting.meeting_time}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[250px] truncate">
                      {meeting.topic}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {meeting.location || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {meeting.meeting_leader_name ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {meeting.meeting_leader_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          {meeting.meeting_leader_name}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={meeting.status === 'completed' ? 'default' : 'secondary'}
                        className={meeting.status === 'in-process' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'}
                      >
                        {meeting.status === 'completed' ? 'Completed' : 'In Process'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Meeting Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardHat className="h-5 w-5 text-primary" />
              {selectedMeeting?.topic}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMeeting && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(selectedMeeting.meeting_date), 'MM/dd/yyyy')}
              </span>
              {selectedMeeting.meeting_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedMeeting.meeting_time}
                </span>
              )}
              {selectedMeeting.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {selectedMeeting.location}
                </span>
              )}
              <Badge 
                variant={selectedMeeting.status === 'completed' ? 'default' : 'secondary'}
                className={selectedMeeting.status === 'in-process' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'}
              >
                {selectedMeeting.status === 'completed' ? 'Completed' : 'In Process'}
              </Badge>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              {selectedMeeting && <SafetyMeetingDetailsTab meeting={selectedMeeting} />}
            </TabsContent>

            <TabsContent value="files">
              {selectedMeeting && <SafetyMeetingFilesTab meetingId={selectedMeeting.id} />}
            </TabsContent>

            <TabsContent value="notes">
              {selectedMeeting && <SafetyMeetingNotesTab meetingId={selectedMeeting.id} />}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
