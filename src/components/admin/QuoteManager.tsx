import React, { useState } from 'react';
import { Plus, Search, Filter, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreateQuoteProjectDialog } from './CreateQuoteProjectDialog';

export function QuoteManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['quoter-leads', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          id,
          name,
          email,
          phone,
          company,
          status,
          created_at,
          project_type,
          estimated_value
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Remove the old project-based quoter functions since we're using leads now

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Roof Quoter</h2>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Roof Quoter</h2>
          <p className="text-muted-foreground">Create detailed roof estimates and quotes</p>
        </div>
        <CreateQuoteProjectDialog onProjectCreated={() => refetch()} />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Leads Grid */}
      <div className="grid gap-4">
        {leads?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">No leads found</p>
              <p className="text-sm text-muted-foreground">
                Add leads in the CRM tab or create a new quote project directly
              </p>
            </CardContent>
          </Card>
        ) : (
          leads?.map((lead) => {
            return (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{lead.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>{lead.email}</span>
                        {lead.phone && (
                          <Badge variant="outline" className="text-xs">
                            {lead.phone}
                          </Badge>
                        )}
                        {lead.project_type && (
                          <Badge variant="secondary" className="text-xs">
                            {lead.project_type}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={lead.status === 'qualified' ? "default" : "secondary"}>
                      {lead.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline"
                      className="flex-1"
                      disabled
                    >
                      Coming Soon - Create Quote
                    </Button>
                    
                    <Badge variant="outline" className="text-xs">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  {lead.estimated_value && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Est. Value: ${lead.estimated_value.toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads?.filter(l => l.status === 'qualified').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads?.filter(l => {
                const created = new Date(l.created_at);
                const now = new Date();
                return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
              }).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}