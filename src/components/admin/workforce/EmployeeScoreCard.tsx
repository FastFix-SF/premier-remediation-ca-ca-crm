import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, Star, Clock, Wrench, Shield, 
  Award, RefreshCw, Users, Calendar 
} from 'lucide-react';
import { EmployeeWithScore, useEmployeeSkills, useEmployeeCertifications, useCalculateScores } from '@/hooks/useEmployeeScores';
import { format } from 'date-fns';

interface EmployeeScoreCardProps {
  employee: EmployeeWithScore;
}

const EmployeeScoreCard = ({ employee }: EmployeeScoreCardProps) => {
  const { data: skills = [] } = useEmployeeSkills(employee.user_id);
  const { data: certifications = [] } = useEmployeeCertifications(employee.user_id);
  const calculateScores = useCalculateScores();

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const scoreCategories = [
    { 
      key: 'experience', 
      label: 'Experience', 
      max: 25, 
      value: employee.score?.experience_score || 0,
      icon: TrendingUp,
      color: 'bg-blue-500',
      description: 'Hours worked & projects completed'
    },
    { 
      key: 'performance', 
      label: 'Performance', 
      max: 25, 
      value: employee.score?.performance_score || 0,
      icon: Star,
      color: 'bg-yellow-500',
      description: 'Customer ratings & quality'
    },
    { 
      key: 'reliability', 
      label: 'Reliability', 
      max: 20, 
      value: employee.score?.reliability_score || 0,
      icon: Clock,
      color: 'bg-green-500',
      description: 'Attendance & punctuality'
    },
    { 
      key: 'skills', 
      label: 'Skills', 
      max: 15, 
      value: employee.score?.skills_score || 0,
      icon: Wrench,
      color: 'bg-purple-500',
      description: 'Verified skills & certifications'
    },
    { 
      key: 'safety', 
      label: 'Safety', 
      max: 15, 
      value: employee.score?.safety_score || 0,
      icon: Shield,
      color: 'bg-red-500',
      description: 'Incident-free record'
    },
  ];

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const { grade, color: gradeColor } = getScoreGrade(employee.score?.total_score || 0);
  const breakdown = employee.score?.score_breakdown as Record<string, any> || {};

  const getProficiencyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Basic';
      case 3: return 'Intermediate';
      case 4: return 'Advanced';
      case 5: return 'Expert';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar & Basic Info */}
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={employee.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10">
                {getInitials(employee.full_name, employee.email)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {employee.full_name || employee.email}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline">{employee.role}</Badge>
                {employee.crew_name && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {employee.crew_name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {employee.email}
              </p>
            </div>

            {/* Total Score Display */}
            <div className="text-center">
              <div className="text-6xl font-bold text-primary">
                {employee.score?.total_score?.toFixed(0) || 0}
              </div>
              <div className={`text-2xl font-bold ${gradeColor}`}>
                Grade: {grade}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {employee.score?.calculated_at 
                  ? `Updated ${format(new Date(employee.score.calculated_at), 'MMM d, yyyy')}`
                  : 'Not yet calculated'
                }
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={() => calculateScores.mutate(employee.user_id)}
                disabled={calculateScores.isPending}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${calculateScores.isPending ? 'animate-spin' : ''}`} />
                Recalculate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {scoreCategories.map((category) => {
          const Icon = category.icon;
          const percentage = (category.value / category.max) * 100;
          return (
            <Card key={category.key}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${category.color} text-white`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{category.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.value.toFixed(1)} / {category.max}
                    </p>
                  </div>
                </div>
                <Progress value={percentage} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {category.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Skills ({skills.length})
            </CardTitle>
            <CardDescription>Verified skills and proficiency levels</CardDescription>
          </CardHeader>
          <CardContent>
            {skills.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No skills recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{skill.skill_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {skill.skill_category.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={skill.verified_at ? 'default' : 'outline'}>
                        {getProficiencyLabel(skill.proficiency_level)}
                      </Badge>
                      {skill.verified_at && (
                        <p className="text-xs text-green-600 mt-1">✓ Verified</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certifications ({certifications.length})
            </CardTitle>
            <CardDescription>Active licenses and certifications</CardDescription>
          </CardHeader>
          <CardContent>
            {certifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No certifications recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {certifications.map((cert) => {
                  const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date();
                  const isExpiringSoon = cert.expiry_date && 
                    new Date(cert.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <div 
                      key={cert.id} 
                      className={`p-3 rounded-lg border ${
                        isExpired ? 'bg-red-50 border-red-200' : 
                        isExpiringSoon ? 'bg-yellow-50 border-yellow-200' : 
                        'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{cert.certification_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cert.issuing_body || 'Unknown issuer'}
                          </p>
                        </div>
                        <Badge 
                          variant={isExpired ? 'destructive' : isExpiringSoon ? 'secondary' : 'default'}
                          className="capitalize"
                        >
                          {cert.certification_type}
                        </Badge>
                      </div>
                      {cert.expiry_date && (
                        <div className="flex items-center gap-1 mt-2 text-xs">
                          <Calendar className="w-3 h-3" />
                          <span className={isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : ''}>
                            {isExpired ? 'Expired' : 'Expires'}: {format(new Date(cert.expiry_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Score Details */}
      {breakdown && Object.keys(breakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Score Calculation Details</CardTitle>
            <CardDescription>How the scores were calculated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {breakdown.experience && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-800 mb-2">Experience</p>
                  <p>Total Hours: {breakdown.experience.total_hours?.toFixed(0) || 0}</p>
                  <p>Projects: {breakdown.experience.project_count || 0}</p>
                </div>
              )}
              {breakdown.performance && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="font-semibold text-yellow-800 mb-2">Performance</p>
                  <p>Avg Rating: {breakdown.performance.avg_rating?.toFixed(1) || 'N/A'}</p>
                  <p>Rated Projects: {breakdown.performance.rated_projects || 0}</p>
                </div>
              )}
              {breakdown.reliability && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-semibold text-green-800 mb-2">Reliability</p>
                  <p>Attendance Rate: {breakdown.reliability.attendance_rate?.toFixed(0) || 0}%</p>
                  <p>Recent Shifts: {breakdown.reliability.recent_shifts || 0}</p>
                </div>
              )}
              {breakdown.skills && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="font-semibold text-purple-800 mb-2">Skills</p>
                  <p>Verified Skills: {breakdown.skills.verified_skills || 0}</p>
                  <p>Active Certs: {breakdown.skills.active_certifications || 0}</p>
                </div>
              )}
              {breakdown.safety && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="font-semibold text-red-800 mb-2">Safety</p>
                  <p>Incidents (1yr): {breakdown.safety.incidents_last_year || 0}</p>
                  <p>Days Since Incident: {breakdown.safety.days_since_incident === 999 ? 'None' : breakdown.safety.days_since_incident}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeScoreCard;
