import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { 
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MapPin,
  Calendar as CalendarIcon
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import { useTeamMembers } from '../../../hooks/useTeamMembers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../ui/pagination';

import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar } from '../../ui/calendar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../ui/hover-card';
import EmployeeTimesheetModal from './EmployeeTimesheetModal';
import TimesheetsWeeklyView from './TimesheetsWeeklyView';

interface TimeEntry {
  id: string;
  user_id?: string;
  employee_name: string;
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
  break_time_minutes: number;
  location?: string;
  status: string;
  project_name?: string;
  job_id?: string;
  notes?: string;
}

interface TeamMemberWithClassCode {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  class_code?: string | null;
}

const TimesheetsView = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'timesheets'>('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState<TeamMemberWithClassCode | null>(null);
  
  const { data: teamMembers } = useTeamMembers();

  // Fetch team members with class_code
  const { data: teamMembersWithClassCode } = useQuery({
    queryKey: ['team-members-class-code'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_directory')
        .select('user_id, email, full_name, role, status, phone_number, class_code')
        .eq('status', 'active');
      
      if (error) throw error;
      
      // Fetch avatars
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url');
      
      const avatarMap = new Map(profilesData?.map(p => [p.id, p.avatar_url]) || []);
      
      return data?.map(member => ({
        ...member,
        avatar_url: member.user_id ? avatarMap.get(member.user_id) || null : null,
      })) as TeamMemberWithClassCode[];
    },
  });

  // Fetch time entries for selected date
  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ['timesheets-today', selectedDate],
    queryFn: async () => {
      const dayStart = startOfDay(selectedDate);
      const dayEnd = endOfDay(selectedDate);

      const { data, error } = await supabase
        .from('time_clock')
        .select('*')
        .gte('clock_in', dayStart.toISOString())
        .lte('clock_in', dayEnd.toISOString())
        .order('clock_in', { ascending: false });

      if (error) throw error;
      return (data || []) as TimeEntry[];
    },
  });

  // Fetch pending requests count
  const { data: pendingRequestsCount = 0 } = useQuery({
    queryKey: ['pending-requests-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('employee_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (error) throw error;
      return count || 0;
    },
  });

  const totalEmployees = teamMembersWithClassCode?.length || 0;
  const clockedInCount = new Set(timeEntries.map(e => e.user_id).filter(Boolean)).size;

  // Filter entries by search
  const filteredEntries = useMemo(() => {
    if (!searchQuery) return timeEntries;
    const query = searchQuery.toLowerCase();
    return timeEntries.filter(entry => {
      const member = teamMembersWithClassCode?.find(m => m.user_id === entry.user_id);
      const name = member?.full_name || entry.employee_name || '';
      return name.toLowerCase().includes(query);
    });
  }, [timeEntries, searchQuery, teamMembersWithClassCode]);

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / rowsPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleAllRows = () => {
    if (selectedRows.length === paginatedEntries.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedEntries.map(e => e.id));
    }
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'h:mm a');
  };

  const formatHours = (hours?: number) => {
    if (!hours) return '--';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Check if location looks like coordinates (e.g., "37.659,-122.085")
  const isCoordinates = (location?: string) => {
    if (!location) return false;
    return /^-?\d+\.\d+,-?\d+\.\d+$/.test(location.trim());
  };

  // Get display address - use project_name if location is coordinates
  const getDisplayAddress = (entry: TimeEntry) => {
    if (entry.location && !isCoordinates(entry.location)) {
      return entry.location;
    }
    return entry.project_name || null;
  };

  const exportTimesheets = () => {
    const doc = new jsPDF();
    const dateStr = format(selectedDate, 'MMM d, yyyy');
    
    doc.setFontSize(18);
    doc.text('Employee Timesheets', 14, 20);
    doc.setFontSize(12);
    doc.text(dateStr, 14, 28);
    
    const headers = ['Employee', 'Job/Tasks', 'Clock In', 'Clock Out', 'Hours', 'Class Code'];
    const colWidths = [40, 35, 25, 25, 20, 25];
    let y = 40;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    let x = 14;
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += colWidths[i];
    });
    
    doc.setDrawColor(200);
    doc.line(14, y + 2, 196, y + 2);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    filteredEntries.forEach((entry) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      const member = teamMembersWithClassCode?.find(m => m.user_id === entry.user_id);
      const row = [
        (member?.full_name || entry.employee_name).substring(0, 20),
        (entry.project_name || '--').substring(0, 18),
        formatTime(entry.clock_in),
        entry.clock_out ? formatTime(entry.clock_out) : '--',
        formatHours(entry.total_hours),
        member?.class_code || '--'
      ];
      
      x = 14;
      row.forEach((cell, i) => {
        doc.text(cell, x, y);
        x += colWidths[i];
      });
      y += 6;
    });
    
    doc.save(`timesheets-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'today'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab('timesheets')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'timesheets'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Timesheets
        </button>
      </div>

      {activeTab === 'timesheets' ? (
        <TimesheetsWeeklyView pendingRequestsCount={pendingRequestsCount} />
      ) : (
        <>
          {/* Today Tab Content */}
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button variant="outline" onClick={exportTimesheets}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Header */}
          <div className="flex items-center justify-between">
            <p className="text-lg">
              <span className="text-primary font-semibold">{clockedInCount}/{totalEmployees}</span>
              {' '}employees clocked in today
            </p>
            {pendingRequestsCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground rounded-full h-6 w-6 p-0 flex items-center justify-center text-xs">
                  {pendingRequestsCount}
                </Badge>
                <span className="text-primary font-medium">Pending requests</span>
              </div>
            )}
          </div>

          {/* Table */}
          <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedRows.length === paginatedEntries.length && paginatedEntries.length > 0}
                    onCheckedChange={toggleAllRows}
                  />
                </TableHead>
                <TableHead className="min-w-[180px]">First name</TableHead>
                <TableHead className="min-w-[180px]">Schedule</TableHead>
                <TableHead className="min-w-[80px]">Type</TableHead>
                <TableHead className="min-w-[120px]">Job/Tasks</TableHead>
                <TableHead className="min-w-[110px]">Clock in</TableHead>
                <TableHead className="min-w-[100px]">Clock out</TableHead>
                <TableHead className="min-w-[100px]">Total hours</TableHead>
                <TableHead className="min-w-[100px]">Paid time off</TableHead>
                <TableHead className="min-w-[100px]">Class code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : paginatedEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No time entries found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEntries.map((entry) => {
                  const member = teamMembersWithClassCode?.find(m => m.user_id === entry.user_id);
                  const hasLocation = !!entry.location;
                  
                  return (
                    <TableRow key={entry.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox 
                          checked={selectedRows.includes(entry.id)}
                          onCheckedChange={() => toggleRowSelection(entry.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div 
                          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => member && setSelectedEmployee(member)}
                        >
                          <Avatar className="h-10 w-10">
                            {member?.avatar_url && <AvatarImage src={member.avatar_url} />}
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {(member?.full_name || entry.employee_name || 'U')
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium hover:text-primary transition-colors">
                            {member?.full_name?.split(' ')[0] || entry.employee_name?.split(' ')[0] || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        --
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span>Shift</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.project_name ? (
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block">
                                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium truncate max-w-[100px] cursor-default">
                                    {entry.project_name}
                                  </Badge>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>{entry.project_name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                              <span>{formatTime(entry.clock_in)}</span>
                              {hasLocation && (
                                <MapPin className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-[400px] p-5 shadow-lg" side="top" align="start">
                            <div className="space-y-4">
                              {/* Current shift header */}
                              <div className="flex items-center gap-6">
                                <span className="text-lg font-medium text-foreground">{formatTime(entry.clock_in)}</span>
                                <span className="text-muted-foreground text-lg">→</span>
                                <span className="text-lg font-medium text-foreground">{entry.clock_out ? formatTime(entry.clock_out) : '--'}</span>
                                <Badge className="bg-pink-500 hover:bg-pink-500 text-white px-4 py-1 rounded-full ml-auto">
                                  Shift
                                </Badge>
                              </div>
                              
                              {/* Clock in location */}
                              {getDisplayAddress(entry) && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-pink-500 mt-1 shrink-0" />
                                  <span className="text-foreground">In: {getDisplayAddress(entry)}</span>
                                </div>
                              )}
                              
                              {/* Time range with job - separated section */}
                              <div className="flex items-center gap-6 pt-4 border-t border-border">
                                <span className="text-lg text-foreground">{formatTime(entry.clock_in)}</span>
                                <span className="text-muted-foreground text-lg">→</span>
                                <span className="text-lg text-foreground">{entry.clock_out ? formatTime(entry.clock_out) : '--'}</span>
                                {entry.project_name && (
                                  <Badge className="bg-slate-700 hover:bg-slate-700 text-white px-4 py-1 rounded-full ml-auto">
                                    {entry.project_name}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* In/Out locations */}
                              {getDisplayAddress(entry) && (
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                                    <span className="text-foreground">In: {getDisplayAddress(entry)}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                                    <span className="text-foreground">Out: {getDisplayAddress(entry)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </TableCell>
                      <TableCell>
                        {entry.clock_out ? (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <span className="cursor-pointer hover:text-primary transition-colors">{formatTime(entry.clock_out)}</span>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-[400px] p-5 shadow-lg" side="top" align="start">
                              <div className="space-y-4">
                                {/* Current shift header */}
                                <div className="flex items-center gap-6">
                                  <span className="text-lg font-medium text-foreground">{formatTime(entry.clock_in)}</span>
                                  <span className="text-muted-foreground text-lg">→</span>
                                  <span className="text-lg font-medium text-foreground">{formatTime(entry.clock_out)}</span>
                                  <Badge className="bg-pink-500 hover:bg-pink-500 text-white px-4 py-1 rounded-full ml-auto">
                                    Shift
                                  </Badge>
                                </div>
                                
                                {/* Clock in location */}
                                {getDisplayAddress(entry) && (
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-pink-500 mt-1 shrink-0" />
                                    <span className="text-foreground">In: {getDisplayAddress(entry)}</span>
                                  </div>
                                )}
                                
                                {/* Time range with job - separated section */}
                                <div className="flex items-center gap-6 pt-4 border-t border-border">
                                  <span className="text-lg text-foreground">{formatTime(entry.clock_in)}</span>
                                  <span className="text-muted-foreground text-lg">→</span>
                                  <span className="text-lg text-foreground">{formatTime(entry.clock_out)}</span>
                                  {entry.project_name && (
                                    <Badge className="bg-slate-700 hover:bg-slate-700 text-white px-4 py-1 rounded-full ml-auto">
                                      {entry.project_name}
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* In/Out locations */}
                                {getDisplayAddress(entry) && (
                                  <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                      <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                                      <span className="text-foreground">In: {getDisplayAddress(entry)}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                                      <span className="text-foreground">Out: {getDisplayAddress(entry)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatHours(entry.total_hours)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        --
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member?.class_code || '--'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages || totalPages === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select value={rowsPerPage.toString()} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Timesheet Modal */}
      <EmployeeTimesheetModal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        employee={selectedEmployee}
      />
        </>
      )}
    </div>
  );
};

export default TimesheetsView;
