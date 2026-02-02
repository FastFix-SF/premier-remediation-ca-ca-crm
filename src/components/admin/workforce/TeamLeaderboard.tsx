import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, Medal, Award, RefreshCw, Search, Users, 
  TrendingUp, Shield, Wrench, Clock, Star, ChevronRight 
} from 'lucide-react';
import { useEmployeeScores, useCrews, useCalculateScores, useInitializeScores, EmployeeWithScore } from '@/hooks/useEmployeeScores';
import EmployeeScoreCard from './EmployeeScoreCard';
import CrewManager from './CrewManager';
import SkillsManager from './SkillsManager';

const TeamLeaderboard = () => {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrew, setSelectedCrew] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithScore | null>(null);
  
  const { data: employees = [], isLoading: loadingScores } = useEmployeeScores();
  const { data: crews = [] } = useCrews();
  const calculateScores = useCalculateScores();
  const initializeScores = useInitializeScores();
  
  // Check if any contributor has been initialized (has a score)
  const hasInitializedScores = employees.some(emp => emp.score !== null);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchQuery || 
      emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCrew = selectedCrew === 'all' || emp.crew_name === selectedCrew;
    return matchesSearch && matchesCrew;
  });

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-gray-400" />;
      case 2: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'experience': return <TrendingUp className="w-4 h-4" />;
      case 'performance': return <Star className="w-4 h-4" />;
      case 'reliability': return <Clock className="w-4 h-4" />;
      case 'skills': return <Wrench className="w-4 h-4" />;
      case 'safety': return <Shield className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Contributor Rankings
          </h2>
          <p className="text-muted-foreground">
            Performance rankings for contributors based on experience, skills, and safety
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!hasInitializedScores && (
            <Button 
              onClick={() => initializeScores.mutate()}
              disabled={initializeScores.isPending}
              variant="default"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Trophy className={`w-4 h-4 ${initializeScores.isPending ? 'animate-pulse' : ''}`} />
              {initializeScores.isPending ? 'Initializing...' : 'Start Scoring'}
            </Button>
          )}
          <Button 
            onClick={() => calculateScores.mutate(undefined)}
            disabled={calculateScores.isPending}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${calculateScores.isPending ? 'animate-spin' : ''}`} />
            {calculateScores.isPending ? 'Calculating...' : 'Recalculate'}
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-muted/50 rounded-xl p-1.5 inline-flex">
          <TabsList variant="segmented">
            <TabsTrigger variant="segmented" value="leaderboard" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger variant="segmented" value="crews" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Crews
            </TabsTrigger>
            <TabsTrigger variant="segmented" value="skills" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Skills & Certs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="mt-6">
          {selectedEmployee ? (
            <div className="space-y-4">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedEmployee(null)}
                className="mb-4"
              >
                ← Back to Leaderboard
              </Button>
              <EmployeeScoreCard employee={selectedEmployee} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCrew} onValueChange={setSelectedCrew}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by crew" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Crews</SelectItem>
                    {crews.map(crew => (
                      <SelectItem key={crew.id} value={crew.crew_name}>
                        {crew.crew_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Top 3 Podium */}
              {filteredEmployees.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {/* 2nd Place */}
                  <Card className="border-2 border-gray-200 bg-gradient-to-b from-gray-50 to-white">
                    <CardContent className="p-4 text-center">
                      <div className="flex justify-center mb-2">
                        <Medal className="w-8 h-8 text-gray-400" />
                      </div>
                      <Avatar className="w-16 h-16 mx-auto mb-2 border-4 border-gray-200">
                        <AvatarImage src={filteredEmployees[1]?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gray-100">
                          {getInitials(filteredEmployees[1]?.full_name, filteredEmployees[1]?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-sm truncate">
                        {filteredEmployees[1]?.full_name || filteredEmployees[1]?.email}
                      </p>
                      <p className="text-2xl font-bold text-gray-600 mt-1">
                        {filteredEmployees[1]?.score?.total_score?.toFixed(0) || 0}
                      </p>
                    </CardContent>
                  </Card>

                  {/* 1st Place */}
                  <Card className="border-2 border-yellow-400 bg-gradient-to-b from-yellow-50 to-white transform scale-105">
                    <CardContent className="p-4 text-center">
                      <div className="flex justify-center mb-2">
                        <Trophy className="w-10 h-10 text-yellow-500" />
                      </div>
                      <Avatar className="w-20 h-20 mx-auto mb-2 border-4 border-yellow-400">
                        <AvatarImage src={filteredEmployees[0]?.avatar_url || undefined} />
                        <AvatarFallback className="bg-yellow-100">
                          {getInitials(filteredEmployees[0]?.full_name, filteredEmployees[0]?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold truncate">
                        {filteredEmployees[0]?.full_name || filteredEmployees[0]?.email}
                      </p>
                      <p className="text-3xl font-bold text-yellow-600 mt-1">
                        {filteredEmployees[0]?.score?.total_score?.toFixed(0) || 0}
                      </p>
                    </CardContent>
                  </Card>

                  {/* 3rd Place */}
                  <Card className="border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-white">
                    <CardContent className="p-4 text-center">
                      <div className="flex justify-center mb-2">
                        <Award className="w-8 h-8 text-amber-600" />
                      </div>
                      <Avatar className="w-16 h-16 mx-auto mb-2 border-4 border-amber-200">
                        <AvatarImage src={filteredEmployees[2]?.avatar_url || undefined} />
                        <AvatarFallback className="bg-amber-100">
                          {getInitials(filteredEmployees[2]?.full_name, filteredEmployees[2]?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-sm truncate">
                        {filteredEmployees[2]?.full_name || filteredEmployees[2]?.email}
                      </p>
                      <p className="text-2xl font-bold text-amber-600 mt-1">
                        {filteredEmployees[2]?.score?.total_score?.toFixed(0) || 0}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Full Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle>Contributor Rankings</CardTitle>
                  <CardDescription>
                    {filteredEmployees.length} contributors ranked
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingScores ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading scores...
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No employees found
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredEmployees.map((employee, index) => (
                        <div
                          key={employee.user_id}
                          onClick={() => setSelectedEmployee(employee)}
                          className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          {/* Rank */}
                          <div className="w-8 flex justify-center">
                            {getRankIcon(index)}
                          </div>

                          {/* Avatar */}
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={employee.avatar_url || undefined} />
                            <AvatarFallback>
                              {getInitials(employee.full_name, employee.email)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Name & Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {employee.full_name || employee.email}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {employee.role}
                              </Badge>
                              {employee.crew_name && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {employee.crew_name}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Score Breakdown Mini */}
                          <div className="hidden md:flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs">
                              {getCategoryIcon('experience')}
                              <span>{employee.score?.experience_score?.toFixed(0) || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              {getCategoryIcon('performance')}
                              <span>{employee.score?.performance_score?.toFixed(0) || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              {getCategoryIcon('reliability')}
                              <span>{employee.score?.reliability_score?.toFixed(0) || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              {getCategoryIcon('skills')}
                              <span>{employee.score?.skills_score?.toFixed(0) || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              {getCategoryIcon('safety')}
                              <span>{employee.score?.safety_score?.toFixed(0) || 0}</span>
                            </div>
                          </div>

                          {/* Total Score */}
                          <div className={`px-3 py-1 rounded-full border font-bold ${getScoreColor(employee.score?.total_score || 0)}`}>
                            {employee.score?.total_score?.toFixed(0) || 0}
                          </div>

                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Crews Tab */}
        <TabsContent value="crews" className="mt-6">
          <CrewManager />
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="mt-6">
          <SkillsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamLeaderboard;
