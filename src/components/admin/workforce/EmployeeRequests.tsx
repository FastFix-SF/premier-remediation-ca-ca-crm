import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { 
  Calendar, 
  Clock, 
  Coffee, 
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { formatTime12Hour } from '@/utils/timezone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../hooks/use-toast';
import { useTeamMembers } from '../../../hooks/useTeamMembers';
import { notifyRequestDenied, notifyRequestApproved } from '@/utils/sendSmsNotification';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';

interface EmployeeRequest {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  time_off_start_date?: string;
  time_off_end_date?: string;
  time_off_type?: string;
  is_all_day?: boolean;
  total_time_off_hours?: number;
  shift_start_date?: string;
  shift_start_time?: string;
  shift_end_date?: string;
  shift_end_time?: string;
  total_hours?: number;
  break_start_time?: string;
  break_end_time?: string;
  break_duration_minutes?: number;
  break_type?: string;
  explanation?: string;
  notes?: string;
  job_name?: string;
}

const EmployeeRequests = () => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] = useState<EmployeeRequest | null>(null);
  const [denyRequest, setDenyRequest] = useState<EmployeeRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [denyReason, setDenyReason] = useState('');

  const { toast } = useToast();
  const { data: teamMembers } = useTeamMembers();
  const queryClient = useQueryClient();

  // Fetch employee requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['employee-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_requests')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EmployeeRequest[];
    },
  });

  // Approve/Reject request mutation
  const reviewRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, notes, request }: { requestId: string; status: string; notes?: string; request?: EmployeeRequest }) => {
      const requestType = (request?.request_type || 'shift') as 'shift' | 'time_off' | 'break';

      // Handle DENIED requests: send SMS then DELETE the row
      if (status === 'denied') {
        // Send denial notification BEFORE deleting
        if (request?.user_id) {
          try {
            await notifyRequestDenied(request.user_id, requestType, notes);
            console.log('SMS notification sent for denied request');
          } catch (smsError) {
            console.error('Failed to send denial SMS:', smsError);
            // Continue with deletion even if SMS fails
          }
        }
        
        // DELETE the request row entirely
        const { error } = await supabase
          .from('employee_requests')
          .delete()
          .eq('id', requestId);

        if (error) throw error;
        return; // Exit early for deny
      }

      // Handle APPROVED requests: update status
      const { error } = await supabase
        .from('employee_requests')
        .update({ 
          status,
          reviewed_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', requestId);

      if (error) throw error;

      // Send approval notification
      if (request?.user_id) {
        try {
          await notifyRequestApproved(request.user_id, requestType);
          console.log('SMS notification sent for approved request');
        } catch (smsError) {
          console.error('Failed to send approval SMS:', smsError);
        }
      }

      // If approving a shift request, create a time_clock entry
      if (request?.request_type === 'shift') {
        const member = teamMembers?.find(m => m.user_id === request.user_id);
        
        // Combine date and time into ISO timestamps
        const clockIn = request.shift_start_date && request.shift_start_time
          ? new Date(`${request.shift_start_date}T${request.shift_start_time}`).toISOString()
          : null;
        const clockOut = request.shift_end_date && request.shift_end_time
          ? new Date(`${request.shift_end_date}T${request.shift_end_time}`).toISOString()
          : null;

        if (clockIn) {
          const { error: timeClockError } = await supabase
            .from('time_clock')
            .insert({
              user_id: request.user_id,
              employee_name: member?.full_name || 'Unknown',
              employee_role: member?.role || null,
              clock_in: clockIn,
              clock_out: clockOut,
              total_hours: request.total_hours || 0,
              break_time_minutes: request.break_duration_minutes || 0,
              status: 'completed',
              project_name: request.job_name || null,
              notes: `Approved from request: ${notes || ''}`
            });

          if (timeClockError) throw timeClockError;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests-count'] });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      setSelectedRequest(null);
      setReviewNotes('');
      toast({
        title: variables.status === 'approved' ? "Request Approved" : "Request Denied",
        description: variables.status === 'approved' 
          ? "The employee request has been approved."
          : "The request has been removed and an SMS notification has been sent.",
      });
    },
    onError: (error) => {
      console.error('Failed to process request:', error);
      toast({
        title: "Error",
        description: "Failed to process the request. Please try again.",
        variant: "destructive"
      });
    },
  });

  const filteredRequests = requests.filter(req => {
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    if (filterType !== 'all' && req.request_type !== filterType) return false;
    return true;
  });

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'time_off':
        return <Calendar className="w-5 h-5" />;
      case 'shift':
        return <Clock className="w-5 h-5" />;
      case 'break':
        return <Coffee className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatRequestDetails = (request: EmployeeRequest) => {
    switch (request.request_type) {
      case 'time_off':
        return (
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Type:</span> {request.time_off_type}
            </p>
            <p className="text-sm">
              <span className="font-medium">Dates:</span>{' '}
              {request.time_off_start_date && format(parseISO(request.time_off_start_date), 'MMM d, yyyy')}
              {' - '}
              {request.time_off_end_date && format(parseISO(request.time_off_end_date), 'MMM d, yyyy')}
            </p>
            {request.total_time_off_hours && (
              <p className="text-sm">
                <span className="font-medium">Duration:</span> {request.total_time_off_hours}h
              </p>
            )}
          </div>
        );
      case 'shift':
        return (
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Date:</span>{' '}
              {request.shift_start_date && format(parseISO(request.shift_start_date), 'MMM d, yyyy')}
            </p>
            <p className="text-sm">
              <span className="font-medium">Time:</span> {formatTime12Hour(request.shift_start_time || '')} - {formatTime12Hour(request.shift_end_time || '')}
            </p>
            {request.total_hours && (
              <p className="text-sm">
                <span className="font-medium">Hours:</span> {request.total_hours}h
              </p>
            )}
          </div>
        );
      case 'break':
        return (
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Type:</span> {request.break_type}
            </p>
            <p className="text-sm">
              <span className="font-medium">Time:</span> {formatTime12Hour(request.break_start_time || '')} - {formatTime12Hour(request.break_end_time || '')}
            </p>
            {request.break_duration_minutes && (
              <p className="text-sm">
                <span className="font-medium">Duration:</span> {request.break_duration_minutes} minutes
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employee Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Employee Requests
              </CardTitle>
              <CardDescription>
                Review and manage time off, shift, and break requests • {requests.filter(r => r.status === 'pending').length} pending
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="time_off">Time Off</SelectItem>
                  <SelectItem value="shift">Shift Changes</SelectItem>
                  <SelectItem value="break">Break Requests</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Requests List */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">No requests found</p>
              <p className="text-sm text-muted-foreground">
                Employee requests will appear here for review
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const member = teamMembers?.find(m => m.user_id === request.user_id);

            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-muted rounded-lg">
                        {getRequestTypeIcon(request.request_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold capitalize">
                            {request.request_type.replace('_', ' ')} Request
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>

                        {member && (
                          <div className="flex items-center gap-2 mb-3">
                            <Avatar className="h-6 w-6">
                              {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                              <AvatarFallback className="text-xs">
                                {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {member.full_name || member.email}
                            </span>
                          </div>
                        )}

                        {formatRequestDetails(request)}

                        {request.explanation && (
                          <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                            <p className="font-medium mb-1">Reason:</p>
                            <p className="text-muted-foreground">{request.explanation}</p>
                          </div>
                        )}

                        {request.notes && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded text-sm">
                            <p className="font-medium mb-1 text-blue-700 dark:text-blue-400">Review Notes:</p>
                            <p className="text-blue-900 dark:text-blue-200">{request.notes}</p>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-3">
                          Submitted {format(parseISO(request.submitted_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => setDenyRequest(request)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Add optional notes for the employee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Optional approval notes..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  reviewRequestMutation.mutate({
                    requestId: selectedRequest.id,
                    status: 'approved',
                    notes: reviewNotes,
                    request: selectedRequest
                  });
                }
              }}
            >
              Approve Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Denial Dialog */}
      <Dialog open={!!denyRequest} onOpenChange={() => { setDenyRequest(null); setDenyReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for denying this request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              placeholder="Reason for denial (required)..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDenyRequest(null); setDenyReason(''); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!denyReason.trim()}
              onClick={() => {
                if (denyRequest && denyReason.trim()) {
                  reviewRequestMutation.mutate({
                    requestId: denyRequest.id,
                    status: 'denied',
                    notes: denyReason,
                    request: denyRequest
                  });
                  setDenyRequest(null);
                  setDenyReason('');
                }
              }}
            >
              Deny Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeRequests;
