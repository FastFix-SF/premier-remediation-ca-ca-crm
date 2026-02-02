
import React, { useState, useEffect } from 'react'; // force HMR refresh v4
import { useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { Users, BarChart, Settings, Contact, FolderOpen, HardDrive, Clock, FileText, Receipt, MessageSquare, DollarSign, Files, ClipboardList, Image, FileBarChart, ListChecks, LayoutGrid, FileBox, Car, Wrench, StickyNote, Mail, FileEdit, Calendar, CheckSquare, FileQuestion, Trophy, BookUser, CreditCard, CircleDollarSign, ShoppingCart, FileSignature, History, ArrowLeftRight, Gavel, Star, Home, CalendarCheck, ListTodo, Search, Ticket, FileStack, AlertTriangle, HardHat, Lightbulb, Target, Sparkles, Command } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import Analytics from '../components/admin/Analytics';
import TeamMembersList from '../components/admin/TeamMembersList';
import AdminSettings from '../components/admin/AdminSettings';
import ProjectManager from '../components/admin/ProjectManager';
import ProposalManager from '../components/admin/ProposalManager';
import ContractManager from '../components/admin/ContractManager';
import { LeadsOpportunitiesManager } from '../components/crm/LeadsOpportunitiesManager';
import { StorageMonitoringDashboard } from '../components/admin/StorageMonitoringDashboard';
import { IntegrationsDashboard } from '../components/admin/IntegrationsDashboard';
import QuoteRequests from '../components/admin/QuoteRequests';
import { InvoicesManager } from '../components/invoices/InvoicesManager';
import { FeedbackManager } from '../components/admin/FeedbackManager';
import { FilesPhotosManager } from '../components/admin/FilesPhotosManager';
import WorkforceSummary from '../components/admin/workforce/WorkforceSummary';
import TimesheetsWeeklyView from '../components/admin/workforce/TimesheetsWeeklyView';
import TimesheetsTodayView from '../components/admin/workforce/TimesheetsTodayView';
import SchedulingOverview from '../components/admin/workforce/SchedulingOverview';
import TasksManager from '../components/admin/workforce/TasksManager';
import EmployeeRequests from '../components/admin/workforce/EmployeeRequests';
import TeamLeaderboard from '../components/admin/workforce/TeamLeaderboard';
import TeamDirectory from '../components/admin/workforce/TeamDirectory';
import TeamBoardPage from '../components/admin/TeamBoardPage';
import { DailyLogsTab } from '../components/daily-logs/DailyLogsTab';
import { ScheduleTab } from '../components/schedule/ScheduleTab';
import { TodosKanban } from '../components/todos/TodosKanban';
import WorkOrdersKanban from '../components/workorders/WorkOrdersKanban';
import InspectionsKanban from '../components/inspections/InspectionsKanban';
import PunchlistsManager from '../components/punchlists/PunchlistsManager';
import { ServiceTicketsManager } from '../components/service-tickets/ServiceTicketsManager';
import { PermitsManager } from '../components/permits/PermitsManager';
import { EstimatesManager } from '../components/estimates/EstimatesManager';
import { BidManager } from '../components/bid-manager/BidManager';
import { ChangeOrdersManager } from '../components/change-orders/ChangeOrdersManager';
import { PaymentsManager } from '../components/payments/PaymentsManager';
import { ExpensesManager } from '../components/expenses/ExpensesManager';
import { PurchaseOrdersManager } from '../components/purchase-orders/PurchaseOrdersManager';
import { SubContractsManager } from '../components/sub-contracts/SubContractsManager';
import { BillsManager } from '../components/bills/BillsManager';
import { OpportunitiesManager } from '../components/opportunities/OpportunitiesManager';
import { IncidentsManager } from '../components/incidents/IncidentsManager';
import { SafetyMeetingsManager } from '../components/safety-meetings/SafetyMeetingsManager';
import { FastoHomeDashboard } from '../components/fasto';
import { CommandCenter } from '../components/admin/command-center/CommandCenter';


const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'home');
  
  // Fetch pending requests count
  const { data: pendingRequestsCount = 0 } = useQuery({
    queryKey: ['pending-requests-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('employee_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Controlled state for ALL nested subtabs
  const [salesSubTab, setSalesSubTab] = useState('leads');
  const [projectsSubTab, setProjectsSubTab] = useState('projects');
  const [financialsSubTab, setFinancialsSubTab] = useState('estimates');
  const [workforceSubTab, setWorkforceSubTab] = useState('summary');
  const [documentsSubTab, setDocumentsSubTab] = useState('files-photos');
  const [settingsSubTab, setSettingsSubTab] = useState('team-board');

  // Valid subtabs for each main tab (for validation)
  const validSubtabs: Record<string, string[]> = {
    'sales': ['leads', 'quotes', 'proposals', 'contracts', 'opportunities'],
    'project-management': ['projects', 'daily-logs', 'schedule', 'todos', 'work-orders', 'inspections', 'punchlists', 'service-tickets', 'permits'],
    'financials': ['estimates', 'bid-manager', 'change-orders', 'invoices', 'payments', 'expenses', 'purchase-orders', 'sub-contracts', 'bills', 'transaction-log'],
    'workforce': ['summary', 'directory', 'timesheets', 'scheduling', 'tasks', 'requests', 'scoring', 'users', 'incidents', 'safety-meetings'],
    'documents': ['files-photos', 'reports', 'forms-checklists', 'rfi-notices', 'submittals', 'vehicle-logs', 'equipment-logs', 'notes', 'send-email', 'document-writer'],
    'settings': ['team-board', 'feedback', 'general', 'storage', 'integrations'],
  };

  // React to URL query param changes - this is the key fix for Fasto navigation
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const subtabFromUrl = searchParams.get('subtab');
    
    console.log('[AdminDashboard] URL params changed:', { tabFromUrl, subtabFromUrl, currentActiveTab: activeTab });
    
    if (tabFromUrl && tabFromUrl !== activeTab) {
      console.log('[AdminDashboard] Setting main tab from URL:', tabFromUrl);
      setActiveTab(tabFromUrl);
    }
    
    // Apply subtab from URL if valid
    if (subtabFromUrl && tabFromUrl) {
      const validList = validSubtabs[tabFromUrl] || [];
      if (validList.includes(subtabFromUrl)) {
        console.log('[AdminDashboard] Setting subtab from URL:', subtabFromUrl, 'for tab:', tabFromUrl);
        switch (tabFromUrl) {
          case 'sales': setSalesSubTab(subtabFromUrl); break;
          case 'project-management': setProjectsSubTab(subtabFromUrl); break;
          case 'financials': setFinancialsSubTab(subtabFromUrl); break;
          case 'workforce': setWorkforceSubTab(subtabFromUrl); break;
          case 'documents': setDocumentsSubTab(subtabFromUrl); break;
          case 'settings': setSettingsSubTab(subtabFromUrl); break;
        }
      } else {
        console.warn('[AdminDashboard] Invalid subtab:', subtabFromUrl, 'valid options:', validList);
      }
    }
  }, [searchParams, location.search]);

  // Map quick access tab names to actual tab values
  const handleWorkforceTabChange = (tab: string) => {
    const tabMapping: Record<string, string> = {
      'team': 'users',
      'live': 'live-attendance',
    };
    setWorkforceSubTab(tabMapping[tab] || tab);
  };

  // Listen for AI assistant navigation events
  useEffect(() => {
    const handleAssistantNavigate = (event: CustomEvent<{ mainTab: string; subTab?: string }>) => {
      const { mainTab, subTab } = event.detail;
      
      // Map assistant tab names to actual tab values
      const tabMapping: Record<string, string> = {
        'workforce': 'workforce',
        'team': 'workforce',
        'timesheets': 'workforce',
        'schedules': 'workforce',
        'projects': 'project-management',
        'leads': 'sales',
        'pipeline': 'sales',
        'financials': 'financials',
        'analytics': 'analytics',
        'documents': 'documents',
        'settings': 'settings',
      };
      
      const targetTab = tabMapping[mainTab] || mainTab;
      setActiveTab(targetTab);
      
      // If there's a sub-tab, apply it directly to the controlled state
      if (subTab) {
        console.log('[AdminDashboard] Assistant subtab:', subTab, 'for tab:', targetTab);
        switch (targetTab) {
          case 'sales': setSalesSubTab(subTab); break;
          case 'project-management': setProjectsSubTab(subTab); break;
          case 'financials': setFinancialsSubTab(subTab); break;
          case 'workforce': setWorkforceSubTab(subTab); break;
          case 'documents': setDocumentsSubTab(subTab); break;
          case 'settings': setSettingsSubTab(subTab); break;
        }
      }
    };

    // Check for stored tab from navigation
    const storedNav = sessionStorage.getItem('assistantNavTab');
    if (storedNav) {
      try {
        const { mainTab, subTab } = JSON.parse(storedNav);
        handleAssistantNavigate(new CustomEvent('', { detail: { mainTab, subTab } }));
        sessionStorage.removeItem('assistantNavTab');
      } catch (e) {
        console.error('Failed to parse assistant nav tab', e);
      }
    }

    window.addEventListener('assistantNavigate', handleAssistantNavigate as EventListener);
    return () => window.removeEventListener('assistantNavigate', handleAssistantNavigate as EventListener);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8" data-component="AdminDashboard" data-file="src/pages/AdminDashboard.tsx">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Enhanced Tab Navigation - Scrollable on mobile */}
          <div className="bg-muted/50 rounded-xl border shadow-sm p-1.5 sm:p-2 overflow-x-auto scrollbar-hide">
            <TabsList variant="scrollable" className="flex md:grid md:grid-cols-9 min-w-max md:min-w-0 h-9 sm:h-10">
              <TabsTrigger variant="scrollable" value="home" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4" data-fasto-tab="home">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Home</span>
              </TabsTrigger>
              <TabsTrigger variant="scrollable" value="command-center" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4" data-fasto-tab="command-center">
                <Command className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm whitespace-nowrap">Command Center</span>
              </TabsTrigger>
              <TabsTrigger variant="scrollable" value="sales" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4" data-fasto-tab="sales">
                <BarChart className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Sales</span>
              </TabsTrigger>
              <TabsTrigger variant="scrollable" value="project-management" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4" data-fasto-tab="project-management">
                <ClipboardList className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
                <span className="text-xs sm:text-sm whitespace-nowrap">Projects</span>
              </TabsTrigger>
              <TabsTrigger variant="scrollable" value="financials" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4" data-fasto-tab="financials">
                <DollarSign className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Financials</span>
              </TabsTrigger>
              <TabsTrigger variant="scrollable" value="workforce" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4" data-fasto-tab="workforce">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Workforce</span>
              </TabsTrigger>
              <TabsTrigger variant="scrollable" value="analytics" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4" data-fasto-tab="analytics">
                <BarChart className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Analytics</span>
              </TabsTrigger>
              <TabsTrigger variant="scrollable" value="documents" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4" data-fasto-tab="documents">
                <Files className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Documents</span>
              </TabsTrigger>
              <TabsTrigger variant="scrollable" value="settings" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4" data-fasto-tab="settings">
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
            <TabsContent value="home" className="mt-0" data-fasto-page="admin-home">
              <FastoHomeDashboard />
            </TabsContent>

            <TabsContent value="command-center" className="mt-0" data-fasto-page="admin-command-center">
              <CommandCenter />
            </TabsContent>
            
            <TabsContent value="sales" className="mt-0" data-fasto-page="admin-sales">
              <Tabs value={salesSubTab} onValueChange={setSalesSubTab} className="space-y-4">
                <div className="bg-muted/50 rounded-xl border shadow-sm px-1.5 py-1.5 sm:px-2 sm:py-2 overflow-x-auto scrollbar-hide">
                  <TabsList variant="scrollable" className="flex min-w-max">
                    <TabsTrigger variant="scrollable" value="leads" className="flex items-center gap-1.5" data-fasto-subtab="leads">
                      <Contact className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Leads</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="quotes" className="flex items-center gap-1.5" data-fasto-subtab="quotes">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Quotes</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="proposals" className="flex items-center gap-1.5" data-fasto-subtab="proposals">
                      <FolderOpen className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Proposals</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="contracts" className="flex items-center gap-1.5" data-fasto-subtab="contracts">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Contracts</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="opportunities" className="flex items-center gap-1.5" data-fasto-subtab="opportunities">
                      <Target className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Opportunities</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="leads" className="mt-0">
                  <LeadsOpportunitiesManager />
                </TabsContent>

                <TabsContent value="quotes" className="mt-0">
                  <QuoteRequests />
                </TabsContent>

                <TabsContent value="proposals" className="mt-0">
                  <ProposalManager />
                </TabsContent>

                <TabsContent value="contracts" className="mt-0">
                  <ContractManager />
                </TabsContent>

                <TabsContent value="opportunities" className="mt-0">
                  <OpportunitiesManager />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="workforce" className="mt-0" data-fasto-page="admin-workforce">
              <Tabs value={workforceSubTab} onValueChange={setWorkforceSubTab} className="space-y-4">
                <div className="bg-muted/50 rounded-xl border shadow-sm p-1.5 sm:p-2 overflow-x-auto scrollbar-hide">
                  <TabsList variant="scrollable" className="flex min-w-max">
                    <TabsTrigger variant="scrollable" value="summary" className="flex items-center gap-1.5" data-fasto-subtab="summary">
                      <BarChart className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Summary</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="directory" className="flex items-center gap-1.5" data-fasto-subtab="directory">
                      <BookUser className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Directory</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="timesheets" className="flex items-center gap-1.5" data-fasto-subtab="timesheets">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Timesheets</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="scheduling" className="flex items-center gap-1.5" data-fasto-subtab="scheduling">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Scheduling</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="tasks" className="flex items-center gap-1.5" data-fasto-subtab="tasks">
                      <CheckSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Tasks</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="requests" className="flex items-center gap-1.5 relative" data-fasto-subtab="requests">
                      <FileQuestion className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Requests</span>
                      {pendingRequestsCount > 0 && (
                        <Badge className="bg-destructive text-destructive-foreground rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold ml-1">
                          {pendingRequestsCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="scoring" className="flex items-center gap-1.5" data-fasto-subtab="scoring">
                      <Trophy className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Scoring</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="users" className="flex items-center gap-1.5" data-fasto-subtab="users">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Users</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="incidents" className="flex items-center gap-1.5" data-fasto-subtab="incidents">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Incidents</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="safety-meetings" className="flex items-center gap-1.5" data-fasto-subtab="safety-meetings">
                      <HardHat className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Safety Meetings</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="summary" className="mt-0">
                  <WorkforceSummary onTabChange={handleWorkforceTabChange} />
                </TabsContent>

                <TabsContent value="timesheets" className="mt-0">
                  <Tabs defaultValue="today" className="space-y-4">
                    <div className="bg-muted/50 rounded-xl border shadow-sm p-2 inline-flex">
                      <TabsList variant="segmented" className="justify-start">
                        <TabsTrigger variant="segmented" value="today">
                          Today
                        </TabsTrigger>
                        <TabsTrigger variant="segmented" value="weekly">
                          Timesheets
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="today" className="mt-0">
                      <TimesheetsTodayView pendingRequestsCount={pendingRequestsCount} />
                    </TabsContent>
                    <TabsContent value="weekly" className="mt-0">
                      <TimesheetsWeeklyView pendingRequestsCount={pendingRequestsCount} />
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="scheduling" className="mt-0">
                  <SchedulingOverview />
                </TabsContent>

                <TabsContent value="tasks" className="mt-0">
                  <TasksManager />
                </TabsContent>

                <TabsContent value="requests" className="mt-0">
                  <EmployeeRequests />
                </TabsContent>

                <TabsContent value="scoring" className="mt-0">
                  <TeamLeaderboard />
                </TabsContent>

                <TabsContent value="users" className="mt-0">
                  <TeamMembersList />
                </TabsContent>

                <TabsContent value="directory" className="mt-0">
                  <TeamDirectory />
                </TabsContent>

                <TabsContent value="incidents" className="mt-0">
                  <IncidentsManager />
                </TabsContent>

                <TabsContent value="safety-meetings" className="mt-0">
                  <SafetyMeetingsManager />
                </TabsContent>

              </Tabs>
            </TabsContent>

            <TabsContent value="financials" className="mt-0" data-fasto-page="admin-financials">
              <Tabs value={financialsSubTab} onValueChange={setFinancialsSubTab} className="space-y-4">
                <div className="bg-muted/50 rounded-xl border shadow-sm p-1.5 sm:p-2 overflow-x-auto scrollbar-hide">
                  <TabsList variant="scrollable" className="flex min-w-max">
                    <TabsTrigger variant="scrollable" value="estimates" className="flex items-center gap-1.5" data-fasto-subtab="estimates">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Estimates</span>
                      <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="bid-manager" className="flex items-center gap-1.5" data-fasto-subtab="bid-manager">
                      <Gavel className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Bid Manager</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="change-orders" className="flex items-center gap-1.5" data-fasto-subtab="change-orders">
                      <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Change Orders</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="invoices" className="flex items-center gap-1.5" data-fasto-subtab="invoices">
                      <DollarSign className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Invoices</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="payments" className="flex items-center gap-1.5" data-fasto-subtab="payments">
                      <CreditCard className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Payments</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="expenses" className="flex items-center gap-1.5" data-fasto-subtab="expenses">
                      <CircleDollarSign className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Expenses</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="purchase-orders" className="flex items-center gap-1.5" data-fasto-subtab="purchase-orders">
                      <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Purchase Orders</span>
                      <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="sub-contracts" className="flex items-center gap-1.5" data-fasto-subtab="sub-contracts">
                      <FileSignature className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Sub-Contracts</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="bills" className="flex items-center gap-1.5" data-fasto-subtab="bills">
                      <Receipt className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Bills</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="transaction-log" className="flex items-center gap-1.5" data-fasto-subtab="transaction-log">
                      <History className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Transaction Log</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="estimates" className="mt-0">
                  <EstimatesManager />
                </TabsContent>
                <TabsContent value="bid-manager" className="mt-0">
                  <BidManager />
                </TabsContent>
                <TabsContent value="change-orders" className="mt-0">
                  <ChangeOrdersManager />
                </TabsContent>
                <TabsContent value="invoices" className="mt-0">
                  <InvoicesManager />
                </TabsContent>
                <TabsContent value="payments" className="mt-0">
                  <PaymentsManager />
                </TabsContent>
                <TabsContent value="expenses" className="mt-0">
                  <ExpensesManager />
                </TabsContent>
                <TabsContent value="purchase-orders" className="mt-0">
                  <PurchaseOrdersManager />
                </TabsContent>
                <TabsContent value="sub-contracts" className="mt-0">
                  <SubContractsManager />
                </TabsContent>
                <TabsContent value="bills" className="mt-0">
                  <BillsManager />
                </TabsContent>
                <TabsContent value="transaction-log" className="mt-0">
                  <div className="text-center py-12 text-muted-foreground">Transaction Log coming soon</div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="documents" className="mt-0" data-fasto-page="admin-documents">
              <Tabs value={documentsSubTab} onValueChange={setDocumentsSubTab} className="space-y-4">
                <div className="bg-muted/50 rounded-xl border shadow-sm p-1.5 sm:p-2 overflow-x-auto scrollbar-hide">
                  <TabsList variant="scrollable" className="flex min-w-max">
                    <TabsTrigger variant="scrollable" value="files-photos" className="flex items-center gap-1.5" data-fasto-subtab="files-photos">
                      <Image className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm whitespace-nowrap">Files</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="reports" className="flex items-center gap-1.5" data-fasto-subtab="reports">
                      <FileBarChart className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Reports</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="forms-checklists" className="flex items-center gap-1.5" data-fasto-subtab="forms-checklists">
                      <ListChecks className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm whitespace-nowrap">Forms</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="rfi-notices" className="flex items-center gap-1.5" data-fasto-subtab="rfi-notices">
                      <LayoutGrid className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm whitespace-nowrap">RFI</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="submittals" className="flex items-center gap-1.5" data-fasto-subtab="submittals">
                      <FileBox className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Submittals</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="vehicle-logs" className="flex items-center gap-1.5" data-fasto-subtab="vehicle-logs">
                      <Car className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm whitespace-nowrap">Vehicles</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="equipment-logs" className="flex items-center gap-1.5" data-fasto-subtab="equipment-logs">
                      <Wrench className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm whitespace-nowrap">Equipment</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="notes" className="flex items-center gap-1.5" data-fasto-subtab="notes">
                      <StickyNote className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Notes</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="send-email" className="flex items-center gap-1.5" data-fasto-subtab="send-email">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Email</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="document-writer" className="flex items-center gap-1.5" data-fasto-subtab="document-writer">
                      <FileEdit className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm whitespace-nowrap">Writer</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="files-photos" className="mt-0">
                  <FilesPhotosManager />
                </TabsContent>
                <TabsContent value="reports" className="mt-0">
                  <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-muted-foreground">
                    Reports coming soon...
                  </div>
                </TabsContent>
                <TabsContent value="forms-checklists" className="mt-0">
                  <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-muted-foreground">
                    Forms & Checklists coming soon...
                  </div>
                </TabsContent>
                <TabsContent value="rfi-notices" className="mt-0">
                  <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-muted-foreground">
                    RFI & Notices coming soon...
                  </div>
                </TabsContent>
                <TabsContent value="submittals" className="mt-0">
                  <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-muted-foreground">
                    Submittals coming soon...
                  </div>
                </TabsContent>
                <TabsContent value="vehicle-logs" className="mt-0">
                  <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-muted-foreground">
                    Vehicle Logs coming soon...
                  </div>
                </TabsContent>
                <TabsContent value="equipment-logs" className="mt-0">
                  <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-muted-foreground">
                    Equipment Logs coming soon...
                  </div>
                </TabsContent>
                <TabsContent value="notes" className="mt-0">
                  <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-muted-foreground">
                    Notes coming soon...
                  </div>
                </TabsContent>
                <TabsContent value="send-email" className="mt-0">
                  <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-muted-foreground">
                    Send Email coming soon...
                  </div>
                </TabsContent>
                <TabsContent value="document-writer" className="mt-0">
                  <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-muted-foreground">
                    Document Writer coming soon...
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="project-management" className="mt-0" data-fasto-page="admin-projects">
              <Tabs value={projectsSubTab} onValueChange={setProjectsSubTab} className="space-y-4">
                <div className="bg-muted/50 rounded-xl border shadow-sm p-1.5 sm:p-2 overflow-x-auto scrollbar-hide">
                  <TabsList variant="scrollable" className="flex min-w-max">
                    <TabsTrigger variant="scrollable" value="projects" className="flex items-center gap-1.5" data-fasto-subtab="projects">
                      <Home className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Projects</span>
                      <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="daily-logs" className="flex items-center gap-1.5" data-fasto-subtab="daily-logs">
                      <CalendarCheck className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Daily Logs</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="schedule" className="flex items-center gap-1.5" data-fasto-subtab="schedule">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Schedule</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="todos" className="flex items-center gap-1.5" data-fasto-subtab="todos">
                      <ListTodo className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">To-Do's</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="work-orders" className="flex items-center gap-1.5" data-fasto-subtab="work-orders">
                      <ClipboardList className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Work Orders</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="inspections" className="flex items-center gap-1.5" data-fasto-subtab="inspections">
                      <Search className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Inspections</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="punchlists" className="flex items-center gap-1.5" data-fasto-subtab="punchlists">
                      <CheckSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Punchlists</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="service-tickets" className="flex items-center gap-1.5" data-fasto-subtab="service-tickets">
                      <Ticket className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Service Tickets</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="permits" className="flex items-center gap-1.5" data-fasto-subtab="permits">
                      <FileStack className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Permits</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="projects" className="mt-0">
                  <ProjectManager />
                </TabsContent>
                <TabsContent value="daily-logs" className="mt-0">
                  <DailyLogsTab />
                </TabsContent>
                <TabsContent value="schedule" className="mt-0">
                  <ScheduleTab />
                </TabsContent>
                <TabsContent value="todos" className="mt-0">
                  <TodosKanban />
                </TabsContent>
                <TabsContent value="work-orders" className="mt-0">
                  <WorkOrdersKanban />
                </TabsContent>
                <TabsContent value="inspections" className="mt-0">
                  <InspectionsKanban />
                </TabsContent>
                <TabsContent value="punchlists" className="mt-0">
                  <PunchlistsManager />
                </TabsContent>
                <TabsContent value="service-tickets" className="mt-0">
                  <ServiceTicketsManager />
                </TabsContent>
                <TabsContent value="permits" className="mt-0">
                  <PermitsManager />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0" data-fasto-page="admin-analytics">
              <Analytics />
            </TabsContent>

            <TabsContent value="settings" className="mt-0" data-fasto-page="admin-settings">
              <Tabs value={settingsSubTab} onValueChange={setSettingsSubTab} className="space-y-4">
                <div className="bg-muted/50 rounded-xl border shadow-sm p-1.5 sm:p-2 overflow-x-auto scrollbar-hide">
                  <TabsList variant="scrollable" className="flex min-w-max">
                    <TabsTrigger variant="scrollable" value="team-board" className="flex items-center gap-1.5" data-fasto-subtab="team-board">
                      <Lightbulb className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Team Board</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="feedback" className="flex items-center gap-1.5" data-fasto-subtab="feedback">
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Feedback</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="general" className="flex items-center gap-1.5" data-fasto-subtab="general">
                      <span className="text-xs sm:text-sm">General</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="storage" className="flex items-center gap-1.5" data-fasto-subtab="storage">
                      <HardDrive className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Storage</span>
                    </TabsTrigger>
                    <TabsTrigger variant="scrollable" value="integrations" className="flex items-center gap-1.5" data-fasto-subtab="integrations">
                      <span className="text-xs sm:text-sm">Integrations</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="team-board" className="mt-0">
                  <TeamBoardPage />
                </TabsContent>

                <TabsContent value="feedback" className="mt-0">
                  <FeedbackManager />
                </TabsContent>

                <TabsContent value="general" className="mt-0">
                  <AdminSettings />
                </TabsContent>

                <TabsContent value="storage" className="mt-0">
                  <StorageMonitoringDashboard />
                </TabsContent>

                <TabsContent value="integrations" className="mt-0">
                  <IntegrationsDashboard />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </div>
        </Tabs>
    </div>
  );
};

export default AdminDashboard;
