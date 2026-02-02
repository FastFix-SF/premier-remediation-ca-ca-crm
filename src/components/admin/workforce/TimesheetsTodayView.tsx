import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import EmployeeTimesheetModal from './EmployeeTimesheetModal';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { 
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MapPin
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { isTodayPacific } from '@/utils/timezone';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';

// Location display component that fetches address from coordinates
const LocationDisplay: React.FC<{ location: string }> = ({ location }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAddress = async () => {
      const coords = location.split(',').map(s => parseFloat(s.trim()));
      if (coords.length !== 2 || coords.some(isNaN)) {
        setAddress(location);
        setIsLoading(false);
        return;
      }

      try {
        const [latitude, longitude] = coords;
        const { data, error } = await supabase.functions.invoke('reverse-geocode', {
          body: { latitude, longitude }
        });

        if (error || !data?.address) {
          setAddress(location);
        } else {
          setAddress(data.address);
        }
      } catch {
        setAddress(location);
      }
      setIsLoading(false);
    };

    fetchAddress();
  }, [location]);

  if (isLoading) {
    return <span className="text-muted-foreground text-xs">Loading...</span>;
  }

  return <span>{address}</span>;
};

interface TodayEntry {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url?: string | null;
  schedule?: string;
  job_task?: string | null;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number;
  paid_time_off: number;
  break_time: number;
  location?: string | null;
  entry_count?: number;
}

interface TimesheetsTodayViewProps {
  pendingRequestsCount: number;
}

const TimesheetsTodayView: React.FC<TimesheetsTodayViewProps> = ({ pendingRequestsCount }) => {
  const [, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState<{
    user_id: string;
    full_name: string | null;
    avatar_url?: string | null;
    email?: string;
    class_code?: string;
    role: string;
    status: string;
  } | null>(null);

  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_directory')
        .select('user_id, email, full_name, role, status')
        .eq('status', 'active');
      
      if (error) throw error;
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url');
      
      const avatarMap = new Map(profilesData?.map(p => [p.id, p.avatar_url]) || []);
      
      return data?.map(member => ({
        ...member,
        avatar_url: member.user_id ? avatarMap.get(member.user_id) || null : null,
      })) || [];
    },
  });

  // Fetch today's time clock entries
  const { data: todayEntries = [] } = useQuery({
    queryKey: ['today-timesheets', selectedDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_clock')
        .select('id, user_id, clock_in, clock_out, total_hours, break_time_minutes, project_name, notes, location')
        .gte('clock_in', dayStart.toISOString())
        .lte('clock_in', dayEnd.toISOString())
        .order('clock_in', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Combine team members with their today data - consolidate multiple entries per employee
  const employeesWithData: TodayEntry[] = useMemo(() => {
    // Group entries by user_id
    const userEntriesMap = new Map<string, typeof todayEntries>();
    
    todayEntries.forEach(entry => {
      const userId = entry.user_id || '';
      if (!userEntriesMap.has(userId)) {
        userEntriesMap.set(userId, []);
      }
      userEntriesMap.get(userId)!.push(entry);
    });

    // Create one consolidated row per employee
    return Array.from(userEntriesMap.entries()).map(([userId, entries]) => {
      const member = teamMembers.find(m => m.user_id === userId);
      
      // Sort entries by clock_in time
      const sortedEntries = [...entries].sort((a, b) => 
        new Date(a.clock_in || 0).getTime() - new Date(b.clock_in || 0).getTime()
      );
      
      // Get first clock-in and last clock-out
      const firstEntry = sortedEntries[0];
      const lastEntry = sortedEntries[sortedEntries.length - 1];
      
      // Sum total hours and break time across all entries
      const totalHours = entries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
      const totalBreak = entries.reduce((sum, e) => sum + (e.break_time_minutes || 0), 0);
      
      // Check if currently clocked in (any entry without clock_out)
      const isCurrentlyIn = entries.some(e => e.clock_in && !e.clock_out);
      
      // Get job tasks from all entries
      const jobTasks = entries
        .map(e => e.project_name || e.notes)
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i) // unique values
        .join(', ');

      return {
        id: firstEntry.id,
        user_id: userId,
        full_name: member?.full_name || 'Unknown',
        avatar_url: member?.avatar_url,
        schedule: '--',
        job_task: jobTasks || null,
        clock_in: firstEntry.clock_in,
        clock_out: isCurrentlyIn ? null : lastEntry.clock_out,
        total_hours: totalHours,
        paid_time_off: 0,
        break_time: totalBreak,
        location: firstEntry.location,
        entry_count: entries.length, // Track number of entries for reference
      };
    });
  }, [teamMembers, todayEntries]);

  // Count clocked in employees (unique users currently clocked in)
  const clockedInCount = employeesWithData.filter(e => e.clock_in && !e.clock_out).length;
  const totalEmployees = teamMembers.length;

  // Filter by search
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employeesWithData;
    const query = searchQuery.toLowerCase();
    return employeesWithData.filter(e => 
      e.full_name?.toLowerCase().includes(query) || 
      e.job_task?.toLowerCase().includes(query)
    );
  }, [employeesWithData, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      return newDate;
    });
    setCurrentPage(1);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    setCurrentPage(1);
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--';
    return format(new Date(dateString), 'hh:mm a');
  };

  const formatHours = (hours: number) => {
    if (!hours) return '--';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const formatBreak = (minutes: number) => {
    if (!minutes) return '--';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSelectRow = (userId: string) => {
    setSelectedRows(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === paginatedEmployees.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedEmployees.map(e => e.user_id));
    }
  };

  const isToday = isTodayPacific(selectedDate);

  return (
    <>
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Filter className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 border rounded-lg px-3 py-1 bg-background text-foreground">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => navigateDay('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              className="h-9 px-3 font-medium"
              onClick={goToToday}
            >
              {isToday ? 'Today' : format(selectedDate, 'MMM d')}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => navigateDay('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between bg-background rounded-md px-3 py-2 border">
        <div className="text-lg">
          <span className="text-primary font-semibold">{clockedInCount}</span>
          <span className="text-muted-foreground">/{totalEmployees}</span>
          <span className="ml-2 text-foreground font-medium">employees clocked in</span>
        </div>
        {pendingRequestsCount > 0 && (
          <Button 
            variant="outline" 
            className="text-orange-500 border-orange-200 hover:bg-orange-50"
            onClick={() => setSearchParams({ tab: 'workforce', subtab: 'requests' })}
          >
            <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">
              {pendingRequestsCount}
            </span>
            Pending requests
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">
                <Checkbox 
                  checked={selectedRows.length === paginatedEmployees.length && paginatedEmployees.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[60px]"></TableHead>
              <TableHead>First name</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Job/Tasks</TableHead>
              <TableHead>Clock in</TableHead>
              <TableHead>Break</TableHead>
              <TableHead>Clock out</TableHead>
              <TableHead>Total hours</TableHead>
              <TableHead>Paid time off</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No clock-in records for this day
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedRows.includes(employee.user_id)}
                      onCheckedChange={() => handleSelectRow(employee.user_id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedEmployee({
                        user_id: employee.user_id,
                        full_name: employee.full_name,
                        avatar_url: employee.avatar_url,
                        role: '',
                        status: 'active',
                      })}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(employee.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TableCell>
                  <TableCell 
                    className="font-medium cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setSelectedEmployee({
                      user_id: employee.user_id,
                      full_name: employee.full_name,
                      avatar_url: employee.avatar_url,
                      role: '',
                      status: 'active',
                    })}
                  >
                    {employee.full_name?.split(' ')[0] || '--'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{employee.schedule}</TableCell>
                  <TableCell>
                    {employee.job_task ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 cursor-default">
                            {employee.job_task.length > 15 ? `${employee.job_task.substring(0, 15)}...` : employee.job_task}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>{employee.job_task}</span>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {employee.clock_in && employee.location ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-default">
                            {formatTime(employee.clock_in)}
                            <MapPin className="h-3 w-3 text-green-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="flex items-center gap-1.5 max-w-xs">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <LocationDisplay location={employee.location} />
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div className="flex items-center gap-1">
                        {formatTime(employee.clock_in)}
                        {employee.clock_in && <MapPin className="h-3 w-3 text-green-500" />}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {employee.break_time > 0 && employee.location ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default">{formatBreak(employee.break_time)}</span>
                        </TooltipTrigger>
                        <TooltipContent className="flex items-center gap-1.5 max-w-xs">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <LocationDisplay location={employee.location} />
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span>{formatBreak(employee.break_time)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {employee.clock_out ? (
                      employee.location ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-default">
                              {formatTime(employee.clock_out)}
                              <MapPin className="h-3 w-3 text-green-500" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="flex items-center gap-1.5 max-w-xs">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <LocationDisplay location={employee.location} />
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div className="flex items-center gap-1">
                          {formatTime(employee.clock_out)}
                          <MapPin className="h-3 w-3 text-green-500" />
                        </div>
                      )
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell>{formatHours(employee.total_hours)}</TableCell>
                  <TableCell className="text-muted-foreground">--</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </TooltipProvider>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
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
                  isActive={currentPage === page}
                  onClick={() => setCurrentPage(page)}
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

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>

      {/* Employee Timesheet Modal */}
      <EmployeeTimesheetModal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        employee={selectedEmployee}
      />
    </>
  );
};

export default TimesheetsTodayView;
