import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Users, 
  Search, 
  Filter, 
  MapPin,
  Clock,
  ArrowLeft,
  User,
  ChevronLeft,
  ChevronRight,
  CalendarIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useMobileTimeClock } from '../hooks/useMobileTimeClock';
import { useTeamMember } from '@/hooks/useTeamMember';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getDateStringPacific, isTodayPacific } from '@/utils/timezone';

export const MobileTimeClockOverview: React.FC = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const { 
    employeeLocations, 
    loading, 
    getActiveClockedCount, 
    getTotalClockedInToday,
    getEmployeeDailySummary,
    getEmployeeDailySummaryForDate,
    getEmployeeLocationsForDate,
    refreshData,
    timeClockEntries,
    teamMemberNamesMap,
  } = useMobileTimeClock();
  
  const { getInitials } = useTeamMember();

  // State for selected date's employee locations
  const [selectedDateLocations, setSelectedDateLocations] = useState<typeof employeeLocations>([]);

  // Refresh data when component mounts to ensure fresh data
  useEffect(() => {
    refreshData();
  }, []);

  // Fetch employee locations for the selected date
  useEffect(() => {
    const fetchLocations = async () => {
      if (getEmployeeLocationsForDate) {
        const locations = await getEmployeeLocationsForDate(selectedDate);
        setSelectedDateLocations(locations);
      }
    };
    fetchLocations();
  }, [selectedDate, timeClockEntries, getEmployeeLocationsForDate]);

  // Memoize displayed employees to ensure they update when dependencies change
  const displayedEmployees = useMemo(() => {
    // Format selected date as Pacific Time YYYY-MM-DD for proper comparison
    const dateStr = getDateStringPacific(selectedDate);
    
    const dateEntries = timeClockEntries.filter(entry => {
      // Convert clock_in to Pacific Time date for comparison
      const entryDateStr = getDateStringPacific(entry.clock_in);
      return entryDateStr === dateStr;
    });

    console.log('🔍 Overview: Processing', dateEntries.length, 'entries for', dateStr);
    console.log('🗺️ Overview: teamMemberNamesMap size:', teamMemberNamesMap.size);
    console.log('🗺️ Overview: teamMemberNamesMap keys:', Array.from(teamMemberNamesMap.keys()));

    // Group by user_id and create employee list
    const employeeMap = new Map();
    
    dateEntries.forEach(entry => {
      if (!employeeMap.has(entry.user_id)) {
        // Get name and avatar from team directory (always prefer this over stale DB data)
        const memberData = teamMemberNamesMap.get(entry.user_id);
        
        console.log(`👤 Overview: user_id=${entry.user_id}, memberData=`, memberData, 'employee_name=', entry.employee_name);
        
        employeeMap.set(entry.user_id, {
          user_id: entry.user_id,
          name: memberData?.name || 'Unknown User',
          avatar_url: memberData?.avatar_url,
          status: entry.clock_out ? 'completed' : entry.status,
          clockInTime: entry.clock_in,
        });
      }
    });

    return Array.from(employeeMap.values());
  }, [selectedDate, timeClockEntries, teamMemberNamesMap]);

  // Load Mapbox token
  useEffect(() => {
    const loadMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('map-config');
        if (error) throw error;
        setMapboxToken(data.mapboxPublicToken);
      } catch (error) {
        console.error('Error loading mapbox token:', error);
      }
    };
    loadMapboxToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || selectedDateLocations.length === 0) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: selectedDateLocations.length > 0 
        ? [selectedDateLocations[0].longitude, selectedDateLocations[0].latitude]
        : [-122.4194, 37.7749],
      zoom: 10
    });

    // Add markers for each employee location
    selectedDateLocations.forEach((location) => {
      const statusColors = {
        active: '#10b981', // green
        on_break: '#f59e0b', // yellow
        completed: '#6b7280' // gray
      };

      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-marker';
      markerEl.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${statusColors[location.status]};
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        cursor: pointer;
      `;
      markerEl.textContent = getInitials(location.name);

      // Add click handler - use Pacific Time date format
      const dateStr = getDateStringPacific(selectedDate);
      markerEl.addEventListener('click', () => {
        navigate(`/mobile/time-clock/employee/${location.user_id}?date=${dateStr}`);
      });

      new mapboxgl.Marker(markerEl)
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current!);
    });

    // Fit map to show all markers
    if (selectedDateLocations.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      selectedDateLocations.forEach(location => {
        bounds.extend([location.longitude, location.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, selectedDateLocations, navigate, getInitials, selectedDate]);

  const filteredEmployees = displayedEmployees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const canGoToNextDay = selectedDate < new Date(new Date().setHours(0, 0, 0, 0));

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'on_break': return 'secondary';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Working';
      case 'on_break': return 'On Break';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading time clock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/mobile/admin')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Time Clock</h1>
          <p className="text-sm text-muted-foreground">
            {displayedEmployees.length}/{teamMemberNamesMap.size} Users clocked in
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-5 h-5" />
        </Button>
      </div>

      {/* Date Navigation */}
      <div className="flex justify-between items-center gap-2 px-2 sm:px-4 py-2 border-b">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={goToPreviousDay}
          className="flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal flex-shrink min-w-0",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1 sm:mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {selectedDate ? format(selectedDate, "MMM dd, yyyy") : <span>Pick a date</span>}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date > new Date()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={goToNextDay}
          disabled={!canGoToNextDay}
          className="flex-shrink-0"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Map */}
      <div className="relative h-64 mx-4 mt-4 rounded-lg overflow-hidden">
        <div ref={mapContainer} className="w-full h-full" />
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1">
          <div className="flex items-center gap-1 text-xs">
            <MapPin className="w-3 h-3" />
            <span>{selectedDateLocations.length} locations</span>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
        {filteredEmployees.map((employee) => {
            const summary = getEmployeeDailySummaryForDate(employee.user_id, selectedDate);
            // Use Pacific Time for date comparisons
            const selectedDateStr = getDateStringPacific(selectedDate);
            const isToday = isTodayPacific(selectedDate);
            return (
              <Card 
                key={employee.user_id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/mobile/time-clock/employee/${employee.user_id}?date=${selectedDateStr}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      {employee.avatar_url && (
                        <img src={employee.avatar_url} alt={employee.name} className="w-full h-full object-cover" loading="lazy" />
                      )}
                      <AvatarFallback>
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{employee.name}</p>
                        <Badge variant={getStatusBadgeVariant(employee.status)} className="text-xs">
                          {getStatusLabel(employee.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>In: {formatTime(employee.clockInTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{summary.totalHours.toFixed(1)}h {isToday ? 'today' : format(selectedDate, "MMM dd")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {filteredEmployees.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No employees found</p>
          </div>
        )}
      </div>
    </div>
  );
};