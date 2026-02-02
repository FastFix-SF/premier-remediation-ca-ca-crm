import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  badges?: Array<{ label: string; value: string }>;
  tooltip?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  description,
  icon,
  badges,
  tooltip,
  trend,
  trendColor,
}) => {
  return (
    <Card className="transition-smooth hover:shadow-card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <span>{title}</span>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {badges.map((badge, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {badge.label}: {badge.value}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
