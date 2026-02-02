import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface FinancialChartProps {
  title?: string;
  data: ChartDataItem[];
  total?: number;
  subtitle?: string;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({
  title,
  data,
  total,
  subtitle
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const displayTotal = total || data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardContent className="p-3 space-y-3">
        {title && (
          <div className="space-y-0.5">
            <h4 className="text-sm font-medium">{title}</h4>
            {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
          </div>
        )}

        {/* Total */}
        <div className="text-center py-2">
          <div className="text-2xl font-bold text-foreground">
            ${displayTotal.toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground">Total</div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-2">
          {data.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-muted-foreground">${item.value.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface StatsGridProps {
  stats: {
    projects?: { total?: number; active?: number; completed?: number };
    leads?: { total?: number; new?: number };
    revenue?: { total?: number; outstanding?: number; paid_invoices?: number };
    team?: { total?: number };
  };
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const items = [
    { label: 'Active Projects', value: stats.projects?.active || 0, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'Completed', value: stats.projects?.completed || 0, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: 'New Leads', value: stats.leads?.new || 0, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
    { label: 'Team Members', value: stats.team?.total || 0, color: 'text-purple-600', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item, idx) => (
        <Card key={idx} className={cn("border shadow-sm", item.bg)}>
          <CardContent className="p-3 text-center">
            <div className={cn("text-xl font-bold", item.color)}>{item.value}</div>
            <div className="text-[10px] text-muted-foreground">{item.label}</div>
          </CardContent>
        </Card>
      ))}
      {stats.revenue && (
        <Card className="col-span-2 border shadow-sm bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-muted-foreground">Total Revenue</div>
              <div className="text-lg font-bold text-foreground">
                ${(stats.revenue.total || 0).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground">Outstanding</div>
              <div className="text-sm font-medium text-yellow-600">
                ${(stats.revenue.outstanding || 0).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface SuccessCardProps {
  title: string;
  message: string;
  details?: Record<string, string>;
}

export const SuccessCard: React.FC<SuccessCardProps> = ({ title, message, details }) => {
  return (
    <Card className="border shadow-sm bg-green-500/10 border-green-500/30">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm font-medium text-green-700">{title}</span>
        </div>
        <p className="text-xs text-muted-foreground">{message}</p>
        {details && Object.keys(details).length > 0 && (
          <div className="grid grid-cols-2 gap-1 pt-1 border-t border-green-500/20">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="text-[10px]">
                <span className="text-muted-foreground">{key}: </span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface InputFormCardProps {
  message: string;
  fields: Array<{
    name: string;
    label: string;
    required: boolean;
    type: string;
    options?: string[];
  }>;
  onSubmit?: (data: Record<string, string>) => void;
}

export const InputFormCard: React.FC<InputFormCardProps> = ({ message, fields }) => {
  return (
    <Card className="border shadow-sm bg-blue-500/5 border-blue-500/30">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm font-medium text-blue-700">Information Needed</span>
        </div>
        <p className="text-xs text-muted-foreground">{message}</p>
        <div className="space-y-1 pt-1 border-t border-blue-500/20">
          {fields.map((field) => (
            <div key={field.name} className="text-[10px] flex items-center gap-1">
              <span className={cn(
                "font-medium",
                field.required ? "text-foreground" : "text-muted-foreground"
              )}>
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Please provide the required information in your next message.
        </p>
      </CardContent>
    </Card>
  );
};

interface AttendanceChartProps {
  title?: string;
  data: Array<{ name: string; value: number; color: string }>;
  dailyData?: Array<{ name: string; value: number; color: string }>;
  summary?: {
    total_hours: number;
    unique_employees: number;
    days_with_activity: number;
    entry_count: number;
  };
  period?: { start: string; end: string };
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({
  title,
  data,
  dailyData,
  summary,
  period
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const maxDailyValue = dailyData ? Math.max(...dailyData.map(d => d.value), 1) : 1;

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardContent className="p-3 space-y-3">
        {title && (
          <div className="space-y-0.5">
            <h4 className="text-sm font-medium">{title}</h4>
            {period && (
              <p className="text-[10px] text-muted-foreground">
                {new Date(period.start).toLocaleDateString()} - {new Date(period.end).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-500/10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-600">{summary.total_hours}</div>
              <div className="text-[10px] text-muted-foreground">Total Hours</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-600">{summary.unique_employees}</div>
              <div className="text-[10px] text-muted-foreground">Employees</div>
            </div>
          </div>
        )}

        {/* Hours by Employee Chart */}
        {data.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-medium text-muted-foreground">Hours by Employee</div>
            {data.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-muted-foreground">{item.value}h</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Daily Hours Chart */}
        {dailyData && dailyData.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="text-[10px] font-medium text-muted-foreground">Daily Breakdown</div>
            <div className="flex items-end gap-1 h-16">
              {dailyData.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full rounded-t transition-all duration-500"
                    style={{ 
                      height: `${(item.value / maxDailyValue) * 100}%`,
                      backgroundColor: item.color,
                      minHeight: item.value > 0 ? '4px' : '0'
                    }}
                  />
                  <span className="text-[8px] text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-xs">
            No attendance data found for this period
          </div>
        )}
      </CardContent>
    </Card>
  );
};
