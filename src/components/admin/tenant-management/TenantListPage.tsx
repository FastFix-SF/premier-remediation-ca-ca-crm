import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreVertical,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { listTenants } from '@/integrations/supabase/tenant-client';
import { useToast } from '@/hooks/use-toast';

interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  business_name: string;
  phone: string;
  email: string;
  logo_url: string;
  subscription_status: string;
  plan_name: string;
  onboarding_completed: boolean;
  users_count: number;
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  trial: { label: 'Trial', variant: 'secondary' },
  past_due: { label: 'Past Due', variant: 'destructive' },
  canceled: { label: 'Canceled', variant: 'outline' },
  suspended: { label: 'Suspended', variant: 'destructive' },
};

export const TenantListPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadTenants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await listTenants({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      });

      if (error) throw error;
      setTenants((data as TenantListItem[]) || []);
    } catch (error: any) {
      console.error('Error loading tenants:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tenants',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTenants();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const getStatusBadge = (status: string) => {
    const config = STATUS_BADGES[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getOnboardingBadge = (completed: boolean) => {
    if (completed) {
      return (
        <Badge variant="outline" className="text-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Complete
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-amber-600">
        <Clock className="h-3 w-3 mr-1" />
        In Progress
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenant Management</h1>
          <p className="text-muted-foreground">
            Manage all tenants in the system
          </p>
        </div>
        <Button onClick={() => navigate('/admin/tenants/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Tenant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading tenants...
            </div>
          ) : tenants.length === 0 ? (
            <div className="py-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No tenants found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? 'Try adjusting your search.' : 'Get started by creating your first tenant.'}
              </p>
              {!search && (
                <Button onClick={() => navigate('/admin/tenants/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tenant
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow
                    key={tenant.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={tenant.logo_url} />
                          <AvatarFallback>
                            {(tenant.business_name || tenant.name || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{tenant.business_name || tenant.name}</div>
                          <div className="text-sm text-muted-foreground">{tenant.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {tenant.email && <div>{tenant.email}</div>}
                        {tenant.phone && <div className="text-muted-foreground">{tenant.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tenant.plan_name || 'No Plan'}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(tenant.subscription_status || 'trial')}
                    </TableCell>
                    <TableCell>
                      {getOnboardingBadge(tenant.onboarding_completed)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{tenant.users_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/tenants/${tenant.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/tenants/${tenant.id}/profile`)}>
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/tenants/${tenant.id}/features`)}>
                            Manage Features
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Tenant CRM
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
