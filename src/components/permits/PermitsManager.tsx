import React, { useState, useMemo } from 'react';
import { Plus, Search, FileStack, RefreshCw, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermits } from '@/hooks/usePermits';
import { CreatePermitDialog } from './CreatePermitDialog';
import { PermitDetailView } from './PermitDetailView';
import { format, isAfter, isBefore, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const PERMIT_TYPE_COLORS: Record<string, string> = {
  building: '#3b82f6',
  electrical: '#f59e0b',
  plumbing: '#10b981',
  mechanical: '#8b5cf6',
  roofing: '#ef4444',
  other: '#6b7280',
};

export const PermitsManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'expired' | 'all'>('all');
  const [selectedPermitId, setSelectedPermitId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { data: permits = [], isLoading, refetch } = usePermits();

  const filteredPermits = useMemo(() => {
    return permits.filter(permit => {
      const matchesSearch = 
        permit.permit_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        permit.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        permit.project_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        permit.agency_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const now = new Date();
      const isExpired = permit.expires_date && isBefore(new Date(permit.expires_date), now);
      
      if (statusFilter === 'active') return matchesSearch && !isExpired;
      if (statusFilter === 'expired') return matchesSearch && isExpired;
      return matchesSearch;
    });
  }, [permits, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    const lastYearStart = startOfYear(subYears(now, 1));
    const lastYearEnd = endOfYear(subYears(now, 1));

    const expiringThisMonth = permits.filter(p => 
      p.expires_date && 
      isAfter(new Date(p.expires_date), monthStart) && 
      isBefore(new Date(p.expires_date), monthEnd)
    ).length;

    const pulledThisYear = permits.filter(p => 
      p.pulled_date && 
      isAfter(new Date(p.pulled_date), yearStart) && 
      isBefore(new Date(p.pulled_date), yearEnd)
    ).length;

    const pulledLastYear = permits.filter(p => 
      p.pulled_date && 
      isAfter(new Date(p.pulled_date), lastYearStart) && 
      isBefore(new Date(p.pulled_date), lastYearEnd)
    ).length;

    const totalFeesThisYear = permits
      .filter(p => p.pulled_date && isAfter(new Date(p.pulled_date), yearStart))
      .reduce((sum, p) => sum + (p.fee || 0), 0);

    const totalFeesLastYear = permits
      .filter(p => p.pulled_date && isAfter(new Date(p.pulled_date), lastYearStart) && isBefore(new Date(p.pulled_date), lastYearEnd))
      .reduce((sum, p) => sum + (p.fee || 0), 0);

    // By Agency
    const byAgency = permits.reduce((acc, p) => {
      const agency = p.agency_name || 'Unknown';
      acc[agency] = (acc[agency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // By Project
    const byProject = permits.reduce((acc, p) => {
      const project = p.project_name || p.project_address || 'Unassigned';
      acc[project] = (acc[project] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // By Type
    const byType = permits.reduce((acc, p) => {
      const type = p.permit_type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      expiringThisMonth,
      pulledThisYear,
      pulledLastYear,
      totalFeesThisYear,
      totalFeesLastYear,
      byAgency,
      byProject,
      byType,
    };
  }, [permits]);

  const typeChartData = Object.entries(stats.byType).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: PERMIT_TYPE_COLORS[name] || PERMIT_TYPE_COLORS.other,
  }));

  if (selectedPermitId) {
    return (
      <PermitDetailView
        permitId={selectedPermitId}
        onBack={() => setSelectedPermitId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for Permits"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Permit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Permits Expiring */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">This Month</span>
              Permits Expiring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <FileStack className="h-8 w-8 text-muted-foreground" />
              <span className="text-4xl font-bold">{stats.expiringThisMonth}</span>
            </div>
          </CardContent>
        </Card>

        {/* Permits Pulled */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Permits Pulled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.pulledThisYear} / {stats.pulledLastYear}</div>
                <p className="text-xs text-muted-foreground">Last / This Year</p>
                {stats.pulledLastYear > 0 && (
                  <p className="text-xs text-green-600">
                    {Math.round(((stats.pulledThisYear - stats.pulledLastYear) / stats.pulledLastYear) * 100)}% Increase
                  </p>
                )}
              </div>
              <div className="flex gap-1 items-end h-16">
                <div 
                  className="w-8 bg-muted rounded-t" 
                  style={{ height: `${Math.max(20, (stats.pulledLastYear / Math.max(stats.pulledThisYear, stats.pulledLastYear, 1)) * 100)}%` }}
                />
                <div 
                  className="w-8 bg-primary rounded-t" 
                  style={{ height: `${Math.max(20, (stats.pulledThisYear / Math.max(stats.pulledThisYear, stats.pulledLastYear, 1)) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-2 text-xs text-muted-foreground">
              <span>Last Year</span>
              <span>This Year</span>
            </div>
          </CardContent>
        </Card>

        {/* Permit Fees */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Permit Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalFeesLastYear.toFixed(2)} / ${stats.totalFeesThisYear.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Last / This Year</p>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By Agency */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Permits by Agency</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              <div className="grid grid-cols-2 text-xs text-muted-foreground font-medium">
                <span>Agency Name</span>
                <span className="text-right"># Permits</span>
              </div>
              {Object.entries(stats.byAgency).slice(0, 5).map(([agency, count]) => (
                <div key={agency} className="grid grid-cols-2 text-sm">
                  <span className="truncate">{agency}</span>
                  <span className="text-right">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Project */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Permits by Project</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              <div className="grid grid-cols-2 text-xs text-muted-foreground font-medium">
                <span>Project</span>
                <span className="text-right"># Permits</span>
              </div>
              {Object.entries(stats.byProject).slice(0, 5).map(([project, count]) => (
                <div key={project} className="grid grid-cols-2 text-sm">
                  <span className="truncate">{project}</span>
                  <span className="text-right">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Type */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Permits by Type</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                {typeChartData.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
              <div className="w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={40}
                      dataKey="value"
                    >
                      {typeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permits Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <TabsList className="h-8">
                <TabsTrigger value="active" className="text-xs px-3 h-6">Active</TabsTrigger>
                <TabsTrigger value="expired" className="text-xs px-3 h-6">Expired</TabsTrigger>
                <TabsTrigger value="all" className="text-xs px-3 h-6">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading permits...</div>
          ) : filteredPermits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No permits found. Create your first permit to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Project</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Permit #</th>
                    <th className="pb-2 font-medium">Approved</th>
                    <th className="pb-2 font-medium">Expires</th>
                    <th className="pb-2 font-medium">Agency</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermits.map((permit) => (
                    <tr 
                      key={permit.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedPermitId(permit.id)}
                    >
                      <td className="py-3">{permit.project_name || permit.project_address || '-'}</td>
                      <td className="py-3 capitalize">{permit.permit_type}</td>
                      <td className="py-3">{permit.permit_number}</td>
                      <td className="py-3">
                        {permit.approved_date ? format(new Date(permit.approved_date), 'MM/dd/yyyy') : '-'}
                      </td>
                      <td className="py-3">
                        {permit.expires_date ? format(new Date(permit.expires_date), 'MM/dd/yyyy') : '-'}
                      </td>
                      <td className="py-3">{permit.agency_name || '-'}</td>
                      <td className="py-3">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Building2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreatePermitDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};
