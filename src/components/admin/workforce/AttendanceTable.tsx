import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Clock, MapPin, Download, Filter } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { useToast } from '../../../hooks/use-toast';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  employee_name: string;
  employee_role: string;
  project_name?: string;
  clock_in: string;
  clock_out?: string;
  total_hours?: number;
  status: string;
  work_date: string;
  location_data?: any;
}

const AttendanceTable = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [attendanceData, searchTerm, projectFilter, statusFilter, dateFrom, dateTo]);

  const fetchAttendanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('workforce_attendance')
        .select(`
          *,
          projects(name)
        `)
        .order('work_date', { ascending: false })
        .order('clock_in', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(record => ({
        id: record.id,
        employee_name: record.employee_name,
        employee_role: record.employee_role || 'Employee',
        project_name: record.projects?.name || 'Unassigned',
        clock_in: record.clock_in,
        clock_out: record.clock_out,
        total_hours: record.total_hours,
        status: record.status,
        work_date: record.work_date,
        location_data: record.location_data,
      })) || [];

      setAttendanceData(formattedData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...attendanceData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(record => record.project_name === projectFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.work_date);
        const fromDate = new Date(dateFrom);
        const toDate = dateTo ? new Date(dateTo) : fromDate;
        return recordDate >= fromDate && recordDate <= toDate;
      });
    }

    setFilteredData(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      on_time: { label: 'On Time', variant: 'default' as const },
      late: { label: 'Late', variant: 'destructive' as const },
      clocked_in: { label: 'Clocked In', variant: 'secondary' as const },
      clocked_out: { label: 'Clocked Out', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'outline' as const
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '-';
    return format(new Date(timeString), 'h:mm a');
  };

  const formatHours = (hours?: number) => {
    if (!hours) return '-';
    return `${hours.toFixed(1)}h`;
  };

  const exportToCSV = () => {
    const csvData = filteredData.map(record => ({
      Employee: record.employee_name,
      Role: record.employee_role,
      Project: record.project_name || '',
      Date: record.work_date,
      'Clock In': formatTime(record.clock_in),
      'Clock Out': formatTime(record.clock_out),
      'Total Hours': record.total_hours || 0,
      Status: record.status,
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueProjects = Array.from(new Set(attendanceData.map(r => r.project_name).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="Search employees or projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {uniqueProjects.filter(project => project && project.trim()).map(project => (
                    <SelectItem key={project} value={project}>{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="on_time">On Time</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="clocked_in">Clocked In</SelectItem>
                  <SelectItem value="clocked_out">Clocked Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                placeholder="From date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardContent className="p-0">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records found</p>
              <p className="text-sm">Try adjusting your filters or sync workforce data</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.employee_name}</TableCell>
                    <TableCell>{record.employee_role}</TableCell>
                    <TableCell>{record.project_name}</TableCell>
                    <TableCell>{format(new Date(record.work_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{formatTime(record.clock_in)}</TableCell>
                    <TableCell>{formatTime(record.clock_out)}</TableCell>
                    <TableCell>{formatHours(record.total_hours)}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceTable;