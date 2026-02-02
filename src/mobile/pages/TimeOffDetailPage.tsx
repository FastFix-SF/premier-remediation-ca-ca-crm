import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

export const TimeOffDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: request, isLoading } = useQuery({
    queryKey: ['time-off-request', id],
    queryFn: async () => {
      const { data: requestData, error } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      // Fetch team member info
      const { data: teamMember } = await supabase
        .from('team_directory')
        .select('full_name, email')
        .eq('user_id', requestData.user_id)
        .maybeSingle();

      // Fetch reviewer info if exists
      let reviewer = null;
      if (requestData.reviewed_by) {
        const { data: reviewerData } = await supabase
          .from('team_directory')
          .select('full_name, email')
          .eq('user_id', requestData.reviewed_by)
          .maybeSingle();
        reviewer = reviewerData;
      }

      return {
        ...requestData,
        team_member: teamMember,
        reviewer: reviewer
      };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Request not found</p>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mobile/time-off-management')}
            className="text-green-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-semibold">Time off request</h1>
          <Button variant="ghost" size="icon">
            <Edit className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 divide-y divide-border">
        {/* User */}
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-base text-muted-foreground">User</span>
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src="" />
              <AvatarFallback>
                {request.team_member?.full_name?.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-base font-semibold">
              {request.team_member?.full_name || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Type */}
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-base text-muted-foreground">Type</span>
          <span className="text-base font-semibold">{request.time_off_type}</span>
        </div>

        {/* Date */}
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-base text-muted-foreground">Date</span>
          <span className="text-base font-semibold">
            {formatDate(request.time_off_start_date)}
          </span>
        </div>

        {/* Time */}
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-base text-muted-foreground">Time</span>
          <span className="text-base font-semibold">
            {request.is_all_day ? 'Full day' : `${request.time_off_start_time} - ${request.time_off_end_time}`}
          </span>
        </div>

        {/* Total Time Requested */}
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-base text-muted-foreground">Total time requested</span>
          <span className="text-base font-semibold">
            {request.total_time_off_hours || 8} Work hours
          </span>
        </div>

        {/* Note (if exists) */}
        {request.notes && (
          <div className="px-6 py-4">
            <div className="text-base text-muted-foreground mb-2">Note</div>
            <div className="text-base text-muted-foreground">{request.notes}</div>
          </div>
        )}

        {/* Request Status */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-base text-muted-foreground">Request status</span>
            <div className="flex items-center gap-2">
              {request.status === 'approved' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-base font-semibold text-green-700">Approved</span>
                </>
              )}
              {request.status === 'rejected' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-base font-semibold text-red-700">Declined</span>
                </>
              )}
              {request.status === 'pending' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-base font-semibold text-yellow-700">Pending</span>
                </>
              )}
            </div>
          </div>
          {request.reviewed_by && request.reviewer && (
            <div className="text-sm text-muted-foreground text-right">
              {request.status === 'approved' ? 'Approved' : 'Declined'} by{' '}
              {request.reviewer.full_name || request.reviewer.email}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
