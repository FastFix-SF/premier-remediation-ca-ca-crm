import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, DollarSign, Settings, Calendar, MapPin, RefreshCw, Smartphone } from 'lucide-react';
import { PayRatesDrawer } from './PayRatesDrawer';
import { EmptyLaborState } from './EmptyLaborState';

interface LaborTabProps {
  projectId: string;
  dateRange: { from: Date; to: Date };
  laborData: any;
  onSyncLabor: () => void;
}

export const LaborTab: React.FC<LaborTabProps> = ({
  projectId,
  dateRange,
  laborData,
  onSyncLabor
}) => {
  const [showPayRates, setShowPayRates] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const getOvertimeColor = (otHours: number) => {
    if (otHours === 0) return 'text-green-600';
    if (otHours < 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Labor Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(laborData?.total_hours || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Reg: {formatHours(laborData?.regular_hours || 0)} | OT: {formatHours(laborData?.overtime_hours || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labor Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(laborData?.total_cost || 0)}</div>
            <p className="text-xs text-muted-foreground">
              ${((laborData?.total_cost || 0) / (laborData?.total_hours || 1)).toFixed(2)}/hour avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Crew</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{laborData?.employees?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              employees on project
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime %</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getOvertimeColor(laborData?.overtime_hours || 0)}`}>
              {laborData?.total_hours > 0 ? ((laborData?.overtime_hours || 0) / laborData.total_hours * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatHours(laborData?.overtime_hours || 0)} overtime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Time Clock Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Time Clock Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-medium">Real-time Labor Tracking</div>
                <div className="text-sm text-muted-foreground">
                  Labor data is automatically captured when employees clock in/out via the mobile app
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={onSyncLabor} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPayRates(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Pay Rates
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Labor Details Tabs */}
      <Tabs defaultValue="employees" className="space-y-4">
        <div className="bg-muted/50 rounded-xl p-1.5 inline-flex">
          <TabsList variant="segmented">
            <TabsTrigger variant="segmented" value="employees">By Employee</TabsTrigger>
            <TabsTrigger variant="segmented" value="timeline">Shift Timeline</TabsTrigger>
            <TabsTrigger variant="segmented" value="breakdown">Job Breakdown</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Labor Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {(!laborData?.employees || laborData.employees.length === 0) ? (
                <div className="text-center py-8">
                  <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Time Clock Data</h3>
                  <p className="text-muted-foreground mb-4">
                    Labor data will appear here when employees clock in/out using the mobile app for this project.
                  </p>
                  <Button onClick={onSyncLabor}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Shifts</TableHead>
                      <TableHead>Regular Hours</TableHead>
                      <TableHead>OT Hours</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Labor Cost</TableHead>
                      <TableHead>Last Shift</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {laborData.employees.map((employee: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{employee.employee_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{employee.role}</Badge>
                        </TableCell>
                        <TableCell>{employee.shifts}</TableCell>
                        <TableCell>{formatHours(employee.regular_hours)}</TableCell>
                        <TableCell className={getOvertimeColor(employee.overtime_hours)}>
                          {formatHours(employee.overtime_hours)}
                        </TableCell>
                        <TableCell>{formatCurrency(employee.hourly_rate)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(employee.total_cost)}
                        </TableCell>
                        <TableCell>{new Date(employee.last_shift).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Shift Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {(!laborData?.timeline || laborData.timeline.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  No shift data available for the selected date range.
                </div>
              ) : (
                <div className="space-y-4">
                  {laborData.timeline.map((shift: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{new Date(shift.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{shift.clock_in} - {shift.clock_out}</span>
                        </div>
                        <Badge variant="outline">{formatHours(shift.hours)}</Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium">{shift.employee_name}</div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {shift.location}
                          </div>
                        </div>
                        {shift.notes && (
                          <div className="text-sm text-muted-foreground max-w-xs">
                            {shift.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Job/Task Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Hours by Task</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Material prep</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={35} className="w-20" />
                          <span className="text-sm">24h</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Installation</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={65} className="w-20" />
                          <span className="text-sm">45h</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Cleanup</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={15} className="w-20" />
                          <span className="text-sm">8h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Cost by Task</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Material prep</span>
                        <span className="font-medium">{formatCurrency(650)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Installation</span>
                        <span className="font-medium">{formatCurrency(1425)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cleanup</span>
                        <span className="font-medium">{formatCurrency(200)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pay Rates Drawer */}
      <PayRatesDrawer 
        open={showPayRates}
        onOpenChange={setShowPayRates}
        projectId={projectId}
      />
    </div>
  );
};