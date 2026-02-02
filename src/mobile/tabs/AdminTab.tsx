import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Sun, Activity, Calendar, Clock, Mail, Star, Clipboard, Search, TrendingUp, CheckSquare, Shield, Package, Award, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotificationBadge } from '../components/chat/NotificationBadge';
import { useUpdates } from '@/contexts/UpdatesContext';
import { useAnalyticsTimeseries } from '@/hooks/useAnalytics';
import { format } from 'date-fns';
export const AdminTab: React.FC = () => {
  const navigate = useNavigate();
  const {
    unreadCount
  } = useUpdates();
  const {
    data: timeseriesData,
    isLoading
  } = useAnalyticsTimeseries('7d');
  const handleNavigate = (path: string) => {
    window.scrollTo(0, 0);
    navigate(path);
  };

  // Get last 5 days of data
  const lastFiveDays = React.useMemo(() => {
    if (!timeseriesData || timeseriesData.length === 0) {
      return [];
    }
    return timeseriesData.slice(-5);
  }, [timeseriesData]);

  // Calculate max visitors for scaling
  const maxVisitors = React.useMemo(() => {
    if (lastFiveDays.length === 0) return 1;
    return Math.max(...lastFiveDays.map(d => d.visitors), 1);
  }, [lastFiveDays]);
  return <div className="flex flex-col min-h-screen bg-background p-3 xs:p-4 space-y-4 xs:space-y-6 overflow-x-hidden">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 xs:w-5 xs:h-5" />
        <Input placeholder="Search..." className="pl-9 xs:pl-10 bg-muted/50 border-none h-10 xs:h-12 rounded-xl text-sm" />
      </div>

      {/* Users Activity Chart */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Users Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && lastFiveDays.length === 0 ? <div className="h-24 flex items-center justify-center">
              <span className="text-sm opacity-80">Loading activity...</span>
            </div> : lastFiveDays.length === 0 ? <div className="h-24 flex items-center justify-center">
              <span className="text-sm opacity-80">No activity data yet</span>
            </div> : <div className="h-24 flex items-end justify-between gap-2">
              {lastFiveDays.map(day => {
            const height = maxVisitors > 0 ? day.visitors / maxVisitors * 60 + 20 : 20;
            return <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-full bg-white/30 rounded-t-sm transition-all hover:bg-white/40" style={{
                height: `${height}px`
              }} title={`${day.visitors} visitors`} />
                    <span className="text-xs opacity-80">
                      {format(new Date(day.date), 'MMM d')}
                    </span>
                  </div>;
          })}
            </div>}
        </CardContent>
      </Card>

      {/* Main Menu Items */}
      <div className="space-y-3">
        <Button className="w-full justify-start h-14 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all" onClick={() => handleNavigate('/mobile/users-management')}>
          <Users className="w-5 h-5 mr-3" />
          <span className="text-base">Users & admins</span>
        </Button>
        
        <Button className="w-full justify-start h-14 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all" onClick={() => handleNavigate('/mobile/time-off-management')}>
          <Sun className="w-5 h-5 mr-3" />
          <span className="text-base">Manage time off</span>
        </Button>
        
        <Button className="w-full justify-start h-14 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all">
          <Activity className="w-5 h-5 mr-3" />
          <span className="text-base">Activity</span>
        </Button>
      </div>

      {/* Quick Access Section */}
      <div className="space-y-3 xs:space-y-4">
        <h3 className="text-base xs:text-lg font-semibold text-foreground">Quick access</h3>
        <div className="grid grid-cols-2 gap-2 xs:gap-4">
          <Card className="bg-gradient-to-br from-orange-100 to-orange-200 border-none h-20 xs:h-24 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNavigate('/mobile/job-scheduling')}>
            <CardContent className="p-3 xs:p-4 flex flex-col justify-between h-full">
              <Calendar className="w-5 h-5 xs:w-6 xs:h-6 text-orange-600" />
              <span className="text-xs xs:text-sm font-medium text-orange-900 truncate">Job scheduling</span>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-100 to-blue-200 border-none h-20 xs:h-24 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNavigate('/mobile/time-clock')}>
            <CardContent className="p-3 xs:p-4 flex flex-col justify-between h-full">
              <Clock className="w-5 h-5 xs:w-6 xs:h-6 text-blue-600" />
              <span className="text-xs xs:text-sm font-medium text-blue-900 truncate">Time Clock</span>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-100 to-orange-200 border-none h-20 xs:h-24 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNavigate('/mobile/service-tickets')}>
            <CardContent className="p-3 xs:p-4 flex flex-col justify-between h-full">
              <Zap className="w-5 h-5 xs:w-6 xs:h-6 text-amber-600" />
              <span className="text-xs xs:text-sm font-medium text-amber-900 truncate">Service Tickets</span>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-100 to-orange-200 border-none h-20 xs:h-24 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNavigate('/mobile/create-task')}>
            <CardContent className="p-3 xs:p-4 flex flex-col justify-between h-full">
              <CheckSquare className="w-5 h-5 xs:w-6 xs:h-6 text-orange-600" />
              <span className="text-xs xs:text-sm font-medium text-orange-900 truncate">Shifts</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Assets Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Active assets</h3>
        <div className="space-y-3">
          <Button variant="ghost" className="w-full justify-start h-14 px-0 hover:bg-gradient-to-r hover:from-pink-50 hover:to-yellow-50 hover:text-foreground transition-all rounded-xl group" onClick={() => handleNavigate('/mobile/recognitions')}>
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-yellow-500 rounded-full flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-shadow">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-base font-semibold">Recognitions</span>
              <span className="text-xs text-muted-foreground">Celebrate your team's wins</span>
            </div>
          </Button>
          
          <Button variant="ghost" className="w-full justify-start h-14 px-0 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 hover:text-foreground transition-all rounded-xl group relative" onClick={() => handleNavigate('/mobile/updates')}>
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-shadow relative">
              <Mail className="w-5 h-5 text-white" />
              {unreadCount > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-background animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-base font-semibold">Updates</span>
              <span className="text-xs text-muted-foreground">See what's new 🔔</span>
            </div>
          </Button>
          
          <Button variant="ghost" className="w-full justify-start h-14 px-0 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-foreground transition-all rounded-xl group" onClick={() => handleNavigate('/mobile/time-clock')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-shadow">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col items-start flex-1">
              <div className="flex items-center gap-2 w-full">
                <span className="text-base font-semibold">Time Clock</span>
                <NotificationBadge count={0} className="ml-auto" />
              </div>
              <span className="text-xs text-muted-foreground">Track work hours</span>
            </div>
          </Button>
          
        <Button variant="ghost" className="w-full justify-start h-14 px-0 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-foreground transition-all rounded-xl group" onClick={() => handleNavigate('/mobile/job-scheduling')}>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-shadow">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-base font-semibold">Job scheduling</span>
            <span className="text-xs text-muted-foreground">Plan team tasks</span>
          </div>
        </Button>
          
          <Button variant="ghost" className="w-full justify-start h-14 px-0 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-foreground transition-all rounded-xl group" onClick={() => handleNavigate('/mobile/safety-checklist-responses')}>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-shadow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-base font-semibold">Safety Checklist Responses</span>
              <span className="text-xs text-muted-foreground">View employee safety records</span>
            </div>
          </Button>
          
          <Button variant="ghost" className="w-full justify-start h-14 px-0 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-foreground transition-all rounded-xl group" onClick={() => navigate('/mobile/quizzes')}>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-shadow">
              <Clipboard className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-base font-semibold">Safety Quizzes</span>
              <span className="text-xs text-muted-foreground">Weekly training quizzes</span>
            </div>
          </Button>

          <Button variant="ghost" className="w-full justify-start h-14 px-0 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50 hover:text-foreground transition-all rounded-xl group" onClick={() => navigate('/mobile/inventory')}>
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-shadow">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-base font-semibold">Inventory</span>
              <span className="text-xs text-muted-foreground">Track materials & supplies</span>
            </div>
          </Button>

          <Button variant="ghost" className="w-full justify-start h-14 px-0 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 hover:text-foreground transition-all rounded-xl group" onClick={() => navigate('/mobile/skill-levels')}>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-shadow">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-base font-semibold">Skill Levels</span>
              <span className="text-xs text-muted-foreground">Evaluate worker classifications</span>
            </div>
          </Button>
        </div>
      </div>
    </div>;
};