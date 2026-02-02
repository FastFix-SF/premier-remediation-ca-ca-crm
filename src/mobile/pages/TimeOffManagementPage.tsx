import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, User as UserIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { formatTime12Hour } from '@/utils/timezone';
import { AddTimeOffSheet } from '@/mobile/components/AddTimeOffSheet';

interface TimeOffRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  time_off_type: string;
  is_all_day: boolean;
  time_off_start_date: string;
  time_off_end_date: string;
  time_off_start_time?: string;
  time_off_end_time?: string;
  total_time_off_hours?: number;
  notes?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  team_member?: {
    full_name: string;
    email: string;
  };
}

export const TimeOffManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [showAddSheet, setShowAddSheet] = useState(false);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch time off requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['time-off-requests'],
    queryFn: async () => {
      const { data: requestsData, error } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('request_type', 'time_off')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Fetch team member info separately
      const userIds = [...new Set(requestsData?.map(r => r.user_id) || [])];
      const { data: teamData } = await supabase
        .from('team_directory')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      // Merge the data
      const merged = requestsData?.map(req => ({
        ...req,
        team_member: teamData?.find(t => t.user_id === req.user_id)
      })) || [];

      return merged as TimeOffRequest[];
    },
  });

  // Get today's date for "on time off today" section
  const today = new Date().toISOString().split('T')[0];
  const onTimeOffToday = requests.filter(
    (req) =>
      req.status === 'approved' &&
      req.time_off_start_date <= today &&
      req.time_off_end_date >= today
  );

  const pendingRequests = requests.filter((req) => req.status === 'pending');
  const historyRequests = requests.filter((req) => req.status !== 'pending');

  const displayedRequests = activeTab === 'pending' ? pendingRequests : historyRequests;

  const formatTimeOffDuration = (req: TimeOffRequest) => {
    if (req.is_all_day) {
      const startDate = new Date(req.time_off_start_date);
      const endDate = new Date(req.time_off_end_date);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return `Full day (${req.total_time_off_hours || 8} hrs)`;
    }
    return `${formatTime12Hour(req.time_off_start_time || '')} - ${formatTime12Hour(req.time_off_end_time || '')}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mobile/admin')}
            className="text-green-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-semibold">Time off</h1>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* On Time Off Today Section */}
      <div className="px-4 py-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-4">
          On time off today ({onTimeOffToday.length})
        </h2>
        {onTimeOffToday.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <UserIcon className="w-16 h-16 mb-2 opacity-20" />
            <p className="text-sm">No one is on time off today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {onTimeOffToday.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {req.team_member?.full_name?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{req.team_member?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{req.time_off_type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time Off Requests Section */}
      <div className="flex-1 px-4 py-6">
        <h2 className="text-2xl font-bold mb-4">Time off requests</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'pending' ? 'default' : 'ghost'}
            className={`flex-1 rounded-xl h-12 ${
              activeTab === 'pending'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'bg-muted/30 text-muted-foreground'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            className={`flex-1 rounded-xl h-12 ${
              activeTab === 'history'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'bg-muted/30 text-muted-foreground'
            }`}
            onClick={() => setActiveTab('history')}
          >
            History
          </Button>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">Loading...</p>
          </div>
        ) : displayedRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mb-4 opacity-20">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                <rect x="4" y="6" width="4" height="2" fill="currentColor" opacity="0.3" />
                <rect x="4" y="10" width="4" height="2" fill="currentColor" opacity="0.3" />
                <rect x="4" y="14" width="4" height="2" fill="currentColor" opacity="0.3" />
                <rect x="10" y="6" width="10" height="2" fill="currentColor" opacity="0.3" />
                <rect x="10" y="10" width="10" height="2" fill="currentColor" opacity="0.3" />
                <rect x="10" y="14" width="10" height="2" fill="currentColor" opacity="0.3" />
              </svg>
            </div>
            <p className="text-sm">No items to display</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => navigate(`/mobile/time-off/${req.id}`)}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {req.team_member?.full_name?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    {req.team_member?.full_name || 'Unknown'} - {req.time_off_type}
                  </p>
                  <p className="font-semibold text-base mb-0.5">
                    {format(new Date(req.time_off_start_date), 'M/d/yyyy')} -{' '}
                    {formatTimeOffDuration(req)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {req.status === 'approved' && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Approved
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      Declined
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Time Off Button */}
      <div className="sticky bottom-0 p-4 bg-background border-t border-border">
        <Button
          className="w-full h-14 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base"
          onClick={() => setShowAddSheet(true)}
        >
          Add time off
        </Button>
      </div>

      {/* Add Time Off Sheet */}
      <AddTimeOffSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
      />
    </div>
  );
};
