import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, Users, Target, DollarSign } from 'lucide-react';
import { KanbanBoard } from './KanbanBoard';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import LeadManagement from '../admin/LeadManagement';
import CallLogsTable from '../admin/CallLogsTable';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  source?: string;
  created_at: string;
  estimated_value?: number;
  project_type?: string;
  timeline?: string;  
  notes?: string;
}

interface PipelineStats {
  totalLeads: number;
  totalOpportunities: number;
  activeLeads: number;
  wonThisMonth: number;
  totalValue: number;
  conversionRate: number;
}

export const LeadsOpportunitiesManager: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Lead[]>([]);
  const [stats, setStats] = useState<PipelineStats>({
    totalLeads: 0,
    totalOpportunities: 0, 
    activeLeads: 0,
    wonThisMonth: 0,
    totalValue: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch leads from the leads table
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // Separate leads and opportunities based on source or other criteria
      // For now, we'll treat all leads as leads and create opportunities based on status
      const allLeads = leadsData || [];
      const newLeads = allLeads.filter(lead => 
        ['new', 'pending', 'qualifying'].includes(lead.status)
      );
      const opportunities = allLeads.filter(lead => 
        ['quoted', 'approved', 'won', 'lost'].includes(lead.status) ||
        lead.source === 'returning_customer'
      );

      setLeads(newLeads);
      setOpportunities(opportunities);

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const wonThisMonth = allLeads.filter(lead => 
        lead.status === 'won' && 
        new Date(lead.created_at) >= startOfMonth
      ).length;

      const totalValue = allLeads
        .filter(lead => lead.estimated_value)
        .reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);

      const activeLeads = allLeads.filter(lead => 
        !['won', 'lost', 'closed'].includes(lead.status)
      ).length;

      const totalConverted = allLeads.filter(lead => lead.status === 'won').length;
      const conversionRate = allLeads.length > 0 ? (totalConverted / allLeads.length) * 100 : 0;

      setStats({
        totalLeads: newLeads.length,
        totalOpportunities: opportunities.length,
        activeLeads,
        wonThisMonth,
        totalValue,
        conversionRate
      });

    } catch (error) {
      console.error('Error fetching leads data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error", 
        description: "Failed to update lead",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Management Tabs - Lead Management, Call Logs, and Quote Requests */}
      <Tabs defaultValue="lead-management" className="space-y-6">
        <div className="bg-muted/50 rounded-xl p-1.5 inline-flex">
          <TabsList variant="segmented">
            <TabsTrigger variant="segmented" value="lead-management" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Lead Management
            </TabsTrigger>
            <TabsTrigger variant="segmented" value="call-logs" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Call Logs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="lead-management" className="mt-0">
          <LeadManagement />
        </TabsContent>

        <TabsContent value="call-logs" className="mt-0">
          <CallLogsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};