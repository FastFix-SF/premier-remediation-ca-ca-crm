import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCrmWorkflow } from '@/hooks/useCrmWorkflow'
import { CrmCustomerCard } from './CrmCustomerCard'
import { CrmProgressTracker } from './CrmProgressTracker'
import { CrmCustomerDetailDrawer } from './CrmCustomerDetailDrawer'
import { AddCustomerDialog } from './AddCustomerDialog'
import { TeamActivityFeed } from './TeamActivityFeed'
import { TeamPerformanceMetrics } from './TeamPerformanceMetrics'
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  UserPlus, 
  Search,
  Filter,
  BarChart3,
  Target,
  Activity,
  Workflow,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Phone,
  Mail,
  Building2
} from 'lucide-react'

// Phase icons mapping
const phaseIcons = {
  'Lead Capture': Target,
  'Sales Process': Activity,
  'Contract Signed': CheckCircle2,
  'Production': Workflow,
  'Close-Out': CheckCircle2
}

export const CrmWorkflowDashboard = () => {
  const { customerProgress, workflowPhases, phaseCounts, isLoading, moveCustomerToPhase } = useCrmWorkflow()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [isFlowchartOpen, setIsFlowchartOpen] = useState(false)
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Filter customers based on search and filter criteria
  const filteredCustomers = customerProgress?.filter(customer => {
    const matchesSearch = customer.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.lead_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || statusFilter === 'all-statuses' || customer.status === statusFilter
    const matchesSource = !sourceFilter || sourceFilter === 'all-sources' || customer.lead_source === sourceFilter
    const matchesAssigned = !assignedFilter || assignedFilter === 'all-assigned' || customer.assigned_to === assignedFilter

    return matchesSearch && matchesStatus && matchesSource && matchesAssigned
  }) || []

  // Calculate live statistics
  const totalCustomers = customerProgress?.length || 0
  const activeCustomers = customerProgress?.filter(c => c.status === 'active').length || 0
  const completedCustomers = customerProgress?.filter(c => c.status === 'completed').length || 0
  const avgProgress = totalCustomers > 0 
    ? Math.round(customerProgress.reduce((sum, c) => sum + (c.pct || 0), 0) / totalCustomers)
    : 0

  // Use live phase distribution from the view
  const phaseDistribution = phaseCounts || []

  const handleQuickMove = async (customerId: string, phaseName: string, stepName?: string) => {
    try {
      await moveCustomerToPhase.mutateAsync({
        customerId,
        phaseName,
        stepName
      });
    } catch (error) {
      console.error('Error moving customer:', error);
    }
  }

  const handleAddCustomerSuccess = () => {
    // Refresh data after adding customer (data will refresh automatically via react-query)
    setShowAddCustomerDialog(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">CRM Workflow Dashboard</h2>
          <p className="text-muted-foreground">
            Track customer progress through your roofing workflow
          </p>
        </div>
        <Button onClick={() => setShowAddCustomerDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Enhanced Dashboard with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-muted/50 rounded-xl p-1.5 inline-flex mb-4">
          <TabsList variant="segmented">
            <TabsTrigger variant="segmented" value="overview">Overview</TabsTrigger>
            <TabsTrigger variant="segmented" value="team">Team Performance</TabsTrigger>
            <TabsTrigger variant="segmented" value="activity">Activity Feed</TabsTrigger>
            <TabsTrigger variant="segmented" value="workflow">Workflow Map</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  Total leads in system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  Currently in workflow
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  Successfully closed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgProgress}%</div>
                <p className="text-xs text-muted-foreground">
                  Overall completion rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Phase Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Workflow Phase Distribution
              </CardTitle>
              <CardDescription>
                Customer count by workflow phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {phaseDistribution.map((phase) => {
                  const Icon = phaseIcons[phase.phase_name as keyof typeof phaseIcons] || Target
                  return (
                    <div key={phase.phase_id} className="text-center space-y-2">
                      <div className="flex justify-center">
                        <Icon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{phase.customer_count}</div>
                        <div className="text-sm text-muted-foreground">{phase.phase_name}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <TeamPerformanceMetrics />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <TeamActivityFeed />
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <Collapsible open={isFlowchartOpen} onOpenChange={setIsFlowchartOpen}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      <Workflow className="h-5 w-5" />
                      <span className="font-semibold">Team Workflow Flowchart</span>
                    </div>
                    {isFlowchartOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <div className="w-full border rounded-lg overflow-hidden bg-muted/10">
                    <iframe 
                      width="100%" 
                      height="420" 
                      src="https://miro.com/app/live-embed/uXjVJPEbk7o=/?embedMode=view_only_without_ui&moveToViewport=55325,-29866,4012,2435&embedId=13312730773" 
                      frameBorder="0" 
                      scrolling="no" 
                      allow="fullscreen; clipboard-read; clipboard-write" 
                      allowFullScreen
                      title="Team Workflow Flowchart"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TabsContent>
      </Tabs>


      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-statuses">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-sources">All Sources</SelectItem>
                <SelectItem value="google_search">Google Search</SelectItem>
                <SelectItem value="yelp">Yelp</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="referrals">Referrals</SelectItem>
                <SelectItem value="federal_invitations">Federal Invitations</SelectItem>
                <SelectItem value="personal_contacts">Personal Contacts</SelectItem>
                <SelectItem value="ai_agent">AI Agent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-assigned">All Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {/* Add actual users here */}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Progress</CardTitle>
          <CardDescription>
            Track individual customer progress through the workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Enhanced Customer List with action buttons */}
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.progress_id} className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                   onClick={() => setSelectedCustomer(customer)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{customer.lead_name}</h3>
                        <Badge variant="outline">{customer.current_phase_name || 'Unknown'}</Badge>
                        {customer.lead_source && (
                          <Badge variant="secondary" className="text-xs">
                            {customer.lead_source.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.lead_email}
                        </div>
                        {customer.lead_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.lead_phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {customer.service_needed || 'Service TBD'}
                        </div>
                        {customer.assigned_user_email && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {customer.assigned_user_email}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={customer.pct || 0} className="flex-1 max-w-[200px]" />
                        <span className="text-sm font-medium">{customer.pct || 0}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickMove(customer.customer_id, 'Sales Process', 'Assign Sales Rep');
                      }}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Sales
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickMove(customer.customer_id, 'Contract Signed', 'Sign Contract');
                      }}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Contract
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || (statusFilter && statusFilter !== 'all-statuses') || (sourceFilter && sourceFilter !== 'all-sources') || (assignedFilter && assignedFilter !== 'all-assigned')
                  ? 'Try adjusting your filters or search terms'
                  : 'Add your first customer to get started with the workflow'}
              </p>
              <Button onClick={() => setShowAddCustomerDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Drawer */}
      <CrmCustomerDetailDrawer 
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />

      {/* Add Customer Dialog */}
      <AddCustomerDialog 
        open={showAddCustomerDialog}
        onOpenChange={setShowAddCustomerDialog}
        onSuccess={handleAddCustomerSuccess}
      />
    </div>
  )
}