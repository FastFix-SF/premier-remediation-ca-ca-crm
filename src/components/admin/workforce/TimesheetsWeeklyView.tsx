import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../../ui/card';
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
  ChevronDown,
  AlertCircle,
  LayoutGrid
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
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
import EmployeeTimesheetModal from './EmployeeTimesheetModal';

interface TeamMemberWithClassCode {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  class_code?: string | null;
  hourly_rate?: number | null;
}

interface EmployeeAggregatedData {
  user_id: string;
  full_name: string | null;
  avatar_url?: string | null;
  email?: string;
  total_hours: number;
  paid_time_off: number;
  total_pay: number;
  class_code?: string | null;
}

interface TimesheetsWeeklyViewProps {
  pendingRequestsCount: number;
}

const TimesheetsWeeklyView: React.FC<TimesheetsWeeklyViewProps> = ({ pendingRequestsCount }) => {
  const [, setSearchParams] = useSearchParams();
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<TeamMemberWithClassCode | null>(null);

  const weekEnd = endOfWeek(selectedWeekStart, { weekStartsOn: 1 });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members-timesheets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_directory')
        .select('user_id, email, full_name, role, status, phone_number, class_code, hourly_rate')
        .eq('status', 'active');
      
      if (error) throw error;
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url, display_name');
      
      const avatarMap = new Map(profilesData?.map(p => [p.id, p.avatar_url]) || []);
      const displayNameMap = new Map(profilesData?.map(p => [p.id, p.display_name]) || []);
      
      return data?.map(member => ({
        ...member,
        avatar_url: member.user_id ? avatarMap.get(member.user_id) || null : null,
        display_name: member.user_id ? displayNameMap.get(member.user_id) || null : null,
      })) as (TeamMemberWithClassCode & { display_name?: string | null })[];
    },
  });

  // Fetch aggregated time entries for the week
  const { data: weeklyData = [] } = useQuery({
    queryKey: ['weekly-timesheets', selectedWeekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_clock')
        .select('user_id, total_hours, break_time_minutes')
        .gte('clock_in', selectedWeekStart.toISOString())
        .lte('clock_in', weekEnd.toISOString());

      if (error) throw error;

      // Aggregate by user
      const aggregated = new Map<string, { total_hours: number }>();
      data?.forEach(entry => {
        if (entry.user_id) {
          const existing = aggregated.get(entry.user_id) || { total_hours: 0 };
          aggregated.set(entry.user_id, {
            total_hours: existing.total_hours + (entry.total_hours || 0),
          });
        }
      });

      return Array.from(aggregated.entries()).map(([user_id, data]) => ({
        user_id,
        ...data,
      }));
    },
  });

  // Fetch profiles for users with time entries but not in team_directory
  const { data: profilesForMissingUsers = [] } = useQuery({
    queryKey: ['profiles-for-timesheets', weeklyData],
    queryFn: async () => {
      const teamMemberUserIds = new Set(teamMembers.map(m => m.user_id));
      const missingUserIds = weeklyData
        .filter(w => w.user_id && !teamMemberUserIds.has(w.user_id))
        .map(w => w.user_id);
      
      if (missingUserIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', missingUserIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: weeklyData.length > 0 && teamMembers.length > 0,
  });

  // Combine team members with their weekly data, including users not in team_directory
  const employeesWithData: EmployeeAggregatedData[] = useMemo(() => {
    const teamMemberUserIds = new Set(teamMembers.map(m => m.user_id));
    
    // Map team members with their data
    const fromTeamDirectory = teamMembers.map(member => {
      const weekData = weeklyData.find(w => w.user_id === member.user_id);
      const hourlyRate = member.hourly_rate || 25;
      const totalHours = weekData?.total_hours || 0;
      // Use full_name from team_directory, or display_name from profiles as fallback
      const displayName = member.full_name || (member as any).display_name || null;
      return {
        user_id: member.user_id,
        full_name: displayName,
        avatar_url: member.avatar_url,
        email: member.email,
        class_code: member.class_code,
        total_hours: totalHours,
        paid_time_off: 0,
        total_pay: totalHours * hourlyRate,
      };
    }).filter(e => e.total_hours > 0);
    
    // Add users from profiles who have time entries but aren't in team_directory
    const fromProfiles = weeklyData
      .filter(w => w.user_id && !teamMemberUserIds.has(w.user_id))
      .map(weekData => {
        const profile = profilesForMissingUsers.find(p => p.id === weekData.user_id);
        const totalHours = weekData.total_hours || 0;
        const hourlyRate = 25; // Default rate for users not in team_directory
        return {
          user_id: weekData.user_id,
          full_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
          email: undefined,
          class_code: null,
          total_hours: totalHours,
          paid_time_off: 0,
          total_pay: totalHours * hourlyRate,
        };
      }).filter(e => e.total_hours > 0);
    
    return [...fromTeamDirectory, ...fromProfiles].sort((a, b) => b.total_hours - a.total_hours);
  }, [teamMembers, weeklyData, profilesForMissingUsers]);

  // Calculate totals
  const totalRegularHours = employeesWithData.reduce((sum, d) => sum + d.total_hours, 0);
  const totalPayPerDates = employeesWithData.reduce((sum, d) => sum + d.total_pay, 0);

  // Filter by search
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employeesWithData;
    const query = searchQuery.toLowerCase();
    return employeesWithData.filter(e => 
      e.full_name?.toLowerCase().includes(query) || 
      e.email?.toLowerCase().includes(query)
    );
  }, [employeesWithData, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(selectedWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeekStart(startOfWeek(newDate, { weekStartsOn: 1 }));
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleAllRows = () => {
    if (selectedRows.length === paginatedEmployees.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedEmployees.map(e => e.user_id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Filter className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 border rounded-lg px-3 py-1 bg-background text-foreground">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium text-sm">
              {format(selectedWeekStart, 'MM/dd')} to {format(weekEnd, 'MM/dd')}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status filter</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          {pendingRequestsCount > 0 && (
            <button 
              onClick={() => setSearchParams({ tab: 'workforce', subtab: 'requests' })}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Badge className="bg-primary text-primary-foreground rounded-full h-6 w-6 p-0 flex items-center justify-center text-xs">
                {pendingRequestsCount}
              </Badge>
              <span className="text-primary font-medium">Pending requests</span>
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Button variant="outline" className="gap-1">
            Export <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex items-center justify-between bg-background rounded-md px-3 py-2 border">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{formatHours(totalRegularHours)}</span>
            <span className="text-muted-foreground">Regular</span>
          </div>
          <span className="text-muted-foreground">+</span>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm">00:00</span>
            <span className="text-muted-foreground">Paid time off</span>
          </div>
          <span className="text-muted-foreground">=</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{formatHours(totalRegularHours)}</span>
            <span className="text-muted-foreground">Total Paid Hours</span>
          </div>
          <div className="border-l pl-4 flex items-center gap-1.5">
            <span className="font-medium text-sm">00:00</span>
            <span className="text-muted-foreground">Paid Breaks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm">00:00</span>
            <span className="text-muted-foreground">Unpaid Breaks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm">00:00</span>
            <span className="text-muted-foreground">Unpaid time off</span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-sm">${totalPayPerDates.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground">Pay per dates</p>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedRows.length === paginatedEmployees.length && paginatedEmployees.length > 0}
                    onCheckedChange={toggleAllRows}
                  />
                </TableHead>
                <TableHead className="min-w-[180px]">First name</TableHead>
                <TableHead className="min-w-[100px]">Total hours</TableHead>
                <TableHead className="min-w-[100px]">Paid time off</TableHead>
                <TableHead className="min-w-[100px]">Total pay</TableHead>
                <TableHead className="min-w-[140px]">User submission</TableHead>
                <TableHead className="min-w-[140px]">Admin approval</TableHead>
                <TableHead className="min-w-[80px]">
                  <div className="flex items-center gap-1">
                    Submitted
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="w-12">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No timesheet data found for this period
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map((employee) => {
                  const initials = (employee.full_name || 'U')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  
                  return (
                    <TableRow key={employee.user_id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox 
                          checked={selectedRows.includes(employee.user_id)}
                          onCheckedChange={() => toggleRowSelection(employee.user_id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div 
                          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedEmployee({
                            user_id: employee.user_id,
                            full_name: employee.full_name,
                            avatar_url: employee.avatar_url,
                            email: employee.email,
                            class_code: employee.class_code,
                            role: '',
                            status: 'active',
                          })}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              {employee.avatar_url && <AvatarImage src={employee.avatar_url} />}
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
                          </div>
                          <span className="font-medium hover:text-primary transition-colors">
                            {employee.full_name?.split(' ')[0] || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatHours(employee.total_hours)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">--</TableCell>
                      <TableCell className="font-medium">
                        {employee.total_pay > 0 
                          ? `$${employee.total_pay.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : '--'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="rounded-full px-6">
                          Open
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="rounded-full px-6">
                          Open
                        </Button>
                      </TableCell>
                      <TableCell>
                        {/* Issues indicator - show for demo on some rows */}
                      </TableCell>
                      <TableCell></TableCell>
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
        initialWeekStart={selectedWeekStart}
      />
    </div>
  );
};

export default TimesheetsWeeklyView;
