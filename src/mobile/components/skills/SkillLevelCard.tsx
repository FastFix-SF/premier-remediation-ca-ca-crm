import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmployeeWithEvaluation } from '@/hooks/useSkillEvaluations';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SkillLevelCardProps {
  employee: EmployeeWithEvaluation;
  onEvaluate: () => void;
}

export function SkillLevelCard({ employee, onEvaluate }: SkillLevelCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLevelBadgeClass = (level?: number) => {
    switch (level) {
      case 1:
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 2:
        return 'bg-green-100 text-green-700 border-green-300';
      case 3:
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 4:
        return 'bg-amber-100 text-amber-700 border-amber-300';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onEvaluate}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {employee.avatar_url && (
              <AvatarImage src={employee.avatar_url} alt={employee.full_name} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(employee.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{employee.full_name}</h3>
              {employee.current_level && (
                <Badge 
                  variant="outline" 
                  className={`text-xs font-semibold ${getLevelBadgeClass(employee.current_level)}`}
                >
                  Nv.{employee.current_level}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {employee.level_name || 'Sin evaluar'}
            </p>
            
            {employee.last_evaluated_at && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluado {formatDistanceToNow(new Date(employee.last_evaluated_at), { addSuffix: true, locale: es })}
              </p>
            )}
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
