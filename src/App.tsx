import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { TenantProvider } from "./contexts/TenantContext";
import { TenantBrandingApplier } from "./components/TenantBrandingApplier";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SearchProvider } from "./contexts/SearchContext";
import { MobileProvider } from "./contexts/MobileContext";
import { UpdatesProvider } from "./contexts/UpdatesContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from "./mobile/components/SplashScreen";
import AnalyticsTracker from "./components/AnalyticsTracker";
import SearchInterface from "./components/SearchInterface";
import { isStandalonePWA, trackPWAUsage } from "./lib/pwa";
import { AdminRoute } from "./components/guards/AdminRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { MobileAdminGuard } from "./mobile/components/guards/MobileAdminGuard";
import { MobileShiftGuard } from "./mobile/components/guards/MobileShiftGuard";
import { ChunkLoadErrorBoundary } from "./components/ChunkLoadErrorBoundary";
import { ThemeProvider } from "./components/ThemeProvider";
import AdminDashboardPage from "./pages/AdminDashboard";

// Retry wrapper for React.lazy() imports (helps with transient Vite/SW cache issues)
const lazyWithRetry = <T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  retries: number = 2,
  delayMs: number = 400
) =>
  lazy(async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await importer();
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
      }
    }

    throw lastError;
  });

// Lazy load mobile components - these won't be downloaded until needed
const MobileAppLayout = lazy(() => import("./mobile/MobileAppLayout").then(m => ({ default: m.MobileAppLayout })));
const HomeTab = lazy(() => import("./mobile/tabs/HomeTab").then(m => ({ default: m.HomeTab })));
const ProjectsTab = lazy(() => import("./mobile/tabs/ProjectsTab").then(m => ({ default: m.ProjectsTab })));
const MessagesTab = lazy(() => import("./mobile/tabs/MessagesTab").then(m => ({ default: m.MessagesTab })));
const ProfileTab = lazy(() => import("./mobile/tabs/ProfileTab").then(m => ({ default: m.ProfileTab })));
const AdminTab = lazy(() => import("./mobile/tabs/AdminTab").then(m => ({ default: m.AdminTab })));
const TimeClockTab = lazy(() => import("./mobile/tabs/TimeClockTab").then(m => ({ default: m.TimeClockTab })));
const ProjectDetailView = lazy(() => import("./mobile/pages/ProjectDetailView").then(m => ({ default: m.ProjectDetailView })));
const ChatConversation = lazy(() => import("./mobile/components/chat/ChatConversation").then(m => ({ default: m.ChatConversation })));
const AddShiftRequestPage = lazy(() => import("./mobile/pages/AddShiftRequestPage").then(m => ({ default: m.AddShiftRequestPage })));
const AddBreakRequestPage = lazy(() => import("./mobile/pages/AddBreakRequestPage").then(m => ({ default: m.AddBreakRequestPage })));
const AddTimeOffRequestPage = lazy(() => import("./mobile/pages/AddTimeOffRequestPage").then(m => ({ default: m.AddTimeOffRequestPage })));
const AddShiftPage = lazy(() => import("./mobile/pages/AddShiftPage").then(m => ({ default: m.AddShiftPage })));
const JobSchedulingPage = lazy(() => import("./mobile/pages/JobSchedulingPage").then(m => ({ default: m.JobSchedulingPage })));
const MySchedulePage = lazy(() => import("./mobile/pages/MySchedulePage").then(m => ({ default: m.MySchedulePage })));
const ShiftDetailsPage = lazy(() => import("./mobile/pages/ShiftDetailsPage").then(m => ({ default: m.ShiftDetailsPage })));
const MobileTimeClockOverview = lazy(() => import("./mobile/pages/MobileTimeClockOverview").then(m => ({ default: m.MobileTimeClockOverview })));
const MobileEmployeeDetailView = lazy(() => import("./mobile/pages/MobileEmployeeDetailView").then(m => ({ default: m.MobileEmployeeDetailView })));
const UsersManagementPage = lazy(() => import("./mobile/pages/UsersManagementPage").then(m => ({ default: m.UsersManagementPage })));
const MobileUserDetailPage = lazy(() => import("./mobile/pages/MobileUserDetailPage").then(m => ({ default: m.MobileUserDetailPage })));
const RecognitionsPage = lazy(() => import("./mobile/pages/RecognitionsPage").then(m => ({ default: m.RecognitionsPage })));
const SendRecognitionPage = lazy(() => import("./mobile/pages/SendRecognitionPage").then(m => ({ default: m.SendRecognitionPage })));
const RecognitionDetailPage = lazy(() => import("./mobile/pages/RecognitionDetailPage").then(m => ({ default: m.RecognitionDetailPage })));
const UpdatesPage = lazy(() => import("./mobile/pages/UpdatesPage").then(m => ({ default: m.UpdatesPage })));
const NewUpdatePage = lazy(() => import("./mobile/pages/NewUpdatePage").then(m => ({ default: m.NewUpdatePage })));
const EditUpdatePage = lazy(() => import("./mobile/pages/EditUpdatePage").then(m => ({ default: m.EditUpdatePage })));
const PendingApprovalPage = lazy(() => import("./mobile/pages/PendingApprovalPage").then(m => ({ default: m.PendingApprovalPage })));
const TimeOffManagementPage = lazy(() => import("./mobile/pages/TimeOffManagementPage").then(m => ({ default: m.TimeOffManagementPage })));
const TimeOffDetailPage = lazy(() => import("./mobile/pages/TimeOffDetailPage").then(m => ({ default: m.TimeOffDetailPage })));
const CreateTaskPage = lazy(() => import("./mobile/pages/CreateTaskPage").then(m => ({ default: m.CreateTaskPage })));
const SafetyChecklistResponsesPage = lazy(() => import("./mobile/pages/SafetyChecklistResponsesPage").then(m => ({ default: m.SafetyChecklistResponsesPage })));
const QuizzesPage = lazy(() => import("./pages/mobile/QuizzesPage"));
const InventoryPage = lazy(() => import("./mobile/pages/InventoryPage").then(m => ({ default: m.InventoryPage })));
const SkillLevelsPage = lazy(() => import("./mobile/pages/SkillLevelsPage").then(m => ({ default: m.SkillLevelsPage })));
const AllPhotosPage = lazy(() => import("./mobile/pages/AllPhotosPage").then(m => ({ default: m.AllPhotosPage })));
const ServiceTicketsPage = lazy(() => import("./mobile/pages/ServiceTicketsPage").then(m => ({ default: m.ServiceTicketsPage })));
const ServiceTicketDetailView = lazy(() => import("./mobile/pages/ServiceTicketDetailView").then(m => ({ default: m.ServiceTicketDetailView })));
const TasksPage = lazy(() => import("./mobile/pages/TasksPage").then(m => ({ default: m.TasksPage })));
const MobileTaskDetailPage = lazy(() => import("./mobile/pages/MobileTaskDetailPage").then(m => ({ default: m.MobileTaskDetailPage })));
const AddMobileTaskPage = lazy(() => import("./mobile/pages/AddMobileTaskPage").then(m => ({ default: m.AddMobileTaskPage })));
const PhoneAuth = lazy(() => import("./pages/PhoneAuth"));
const StoreAuth = lazy(() => import("./pages/StoreAuth"));
const StoreOrders = lazy(() => import("./pages/store/StoreOrders"));
const StoreProductDetail = lazy(() => import("./pages/store/StoreProductDetail"));
const StoreCategory = lazy(() => import("./pages/store/StoreCategory"));

// Lazy load desktop components - mobile users won't download these
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const Contact = lazy(() => import("./pages/Contact"));
const Store = lazy(() => import("./pages/Store"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const ResidentialRoofing = lazy(() => import("./pages/ResidentialRoofing"));
const CommercialRoofing = lazy(() => import("./pages/CommercialRoofing"));
const MetalRoofInstallation = lazy(() => import("./pages/MetalRoofInstallation"));
const StandingSeamSystems = lazy(() => import("./pages/StandingSeamSystems"));
const RPanelInstallation = lazy(() => import("./pages/RPanelInstallation"));
const MetalRoofPanels = lazy(() => import("./pages/MetalRoofPanels"));
const RoofRepairMaintenance = lazy(() => import("./pages/RoofRepairMaintenance"));
const StormFireEnergy = lazy(() => import("./pages/StormFireEnergy"));
// Dynamic config-driven pages for services and areas
const ServicePage = lazy(() => import("./pages/ServicePage"));
const AreaPage = lazy(() => import("./pages/AreaPage"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const RoofQuote = lazy(() => import("./pages/RoofQuote"));
const QuoteDetail = lazy(() => import("./pages/QuoteDetail"));

const AdminLogin = lazy(() => import("./pages/AdminLogin"));

// In Lovable preview / DEV, avoid lazy-loading AdminDashboard to prevent blank screens
// from transient dynamic-import fetch failures.
const shouldEagerLoadAdminDashboard =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' && window.location.hostname.includes('lovableproject.com'));

const AdminDashboard = shouldEagerLoadAdminDashboard
  ? AdminDashboardPage
  : lazyWithRetry(() => import("./pages/AdminDashboard"));

const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const CustomerProjectView = lazy(() => import("./pages/CustomerProjectView"));
const CustomerServiceTicketView = lazy(() => import("./pages/CustomerServiceTicketView"));
const ProjectProposalPage = lazy(() => import("./pages/ProjectProposal").then(m => ({ default: m.ProjectProposalPage })));
const VisualizerLanding = lazy(() => import("./visualizer/pages/VisualizerLanding").then(m => ({ default: m.VisualizerLanding })));
const VisualizerEditor = lazy(() => import("./visualizer/pages/VisualizerEditor").then(m => ({ default: m.VisualizerEditor })));
const MultiStructureDemo = lazy(() => import("./pages/MultiStructureDemo"));
const QuoteRequestWorkspace = lazy(() => import("./pages/QuoteRequestWorkspace"));
const ProjectProfitView = lazy(() => import("./pages/ProjectProfitView").then(m => ({ default: m.ProjectProfitView })));
const ProjectDetailsPage = lazy(() => import("./pages/projects/ProjectDetailsPage").then(m => ({ default: m.ProjectDetailsPage })));
const ProjectPhotosPage = lazy(() => import("./pages/projects/ProjectPhotosPage").then(m => ({ default: m.ProjectPhotosPage })));
const ProjectTimelinePage = lazy(() => import("./pages/projects/ProjectTimelinePage").then(m => ({ default: m.ProjectTimelinePage })));
const ClientPortalPreview = lazy(() => import("./pages/projects/ClientPortalPreview").then(m => ({ default: m.ClientPortalPreview })));
const ClientAccessPage = lazy(() => import("./pages/projects/ClientAccessPage").then(m => ({ default: m.ClientAccessPage })));
const ProjectSchedulePage = lazy(() => import("./pages/projects/ProjectSchedulePage").then(m => ({ default: m.ProjectSchedulePage })));
const ProjectSummaryPage = lazy(() => import("./pages/projects/ProjectSummaryPage").then(m => ({ default: m.ProjectSummaryPage })));
const ProjectSOVPage = lazy(() => import("./pages/projects/ProjectSOVPage").then(m => ({ default: m.ProjectSOVPage })));
const ProjectDocumentsPage = lazy(() => import("./pages/projects/ProjectDocumentsPage").then(m => ({ default: m.ProjectDocumentsPage })));
const ProjectTimePage = lazy(() => import("./pages/projects/ProjectTimePage").then(m => ({ default: m.ProjectTimePage })));
const ProjectContactsPage = lazy(() => import("./pages/projects/ProjectContactsPage").then(m => ({ default: m.ProjectContactsPage })));
const ProjectReportsPage = lazy(() => import("./pages/projects/ProjectReportsPage").then(m => ({ default: m.ProjectReportsPage })));
const ProjectDailyLogsPage = lazy(() => import("./pages/projects/ProjectDailyLogsPage").then(m => ({ default: m.ProjectDailyLogsPage })));
const InviteAcceptance = lazy(() => import("./pages/InviteAcceptance"));
const SupabaseInviteAcceptance = lazy(() => import("./pages/SupabaseInviteAcceptance"));
const InviteNoToken = lazy(() => import("./pages/InviteNoToken"));
const ProjectInvitation = lazy(() => import("./pages/ProjectInvitation"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DownloadApp = lazy(() => import("./pages/DownloadApp"));
const RoofQuoter = lazy(() => import("./pages/RoofQuoter"));
const RoofDrawingInterface = lazy(() => import("./pages/RoofDrawingInterface"));
const InvoicePayment = lazy(() => import("./pages/InvoicePayment").then(m => ({ default: m.InvoicePayment })));
const LearningDashboard = lazy(() => import("./pages/LearningDashboard"));
const ModelTrainingDashboard = lazy(() => import("./pages/ModelTrainingDashboard"));
const CustomerReviewPage = lazy(() => import("./pages/CustomerReviewPage"));
const FastoLearning = lazy(() => import("./pages/admin/FastoLearning"));
const PatentGenerator = lazy(() => import("./components/admin/PatentGenerator").then(m => ({ default: m.PatentGenerator })));
const AppIconsManager = lazy(() => import("./pages/admin/AppIconsManager"));

// Tenant Management Pages
const TenantListPage = lazy(() => import("./components/admin/tenant-management/TenantListPage").then(m => ({ default: m.TenantListPage })));
const TenantDetailPage = lazy(() => import("./components/admin/tenant-management/TenantDetailPage").then(m => ({ default: m.TenantDetailPage })));
const TenantOnboardingWizard = lazy(() => import("./components/admin/tenant-onboarding/TenantOnboardingWizard").then(m => ({ default: m.TenantOnboardingWizard })));

// Simple loading fallback for lazy components
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Data fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus for mobile
      retry: 1, // Retry failed requests once
    },
  },
});

// Separate component to avoid recreating on every render
const AppRoutes = () => (
  <Routes>
    {/* Mobile App Routes (standalone PWA only) */}
    <Route path="/mobile/auth" element={<PhoneAuth />} />
    <Route path="/mobile/pending-approval" element={<PendingApprovalPage />} />
    <Route path="/mobile" element={<MobileAppLayout />}>
      <Route path="home" element={<HomeTab />} />
      <Route path="projects" element={<ProjectsTab />} />
      <Route path="all-photos" element={<AllPhotosPage />} />
      <Route path="projects/:id" element={<ProjectDetailView />} />
      
      <Route path="messages" element={<MessagesTab />} />
      <Route path="messages/chat/:channelId" element={<ChatConversation />} />
      <Route path="profile" element={<ProfileTab />} />
      
      {/* Admin-only mobile routes */}
      <Route path="admin" element={<MobileAdminGuard><AdminTab /></MobileAdminGuard>} />
      <Route path="users-management" element={<MobileAdminGuard><UsersManagementPage /></MobileAdminGuard>} />
      <Route path="users/:userId" element={<MobileAdminGuard><MobileUserDetailPage /></MobileAdminGuard>} />
      <Route path="recognitions" element={<MobileAdminGuard><RecognitionsPage /></MobileAdminGuard>} />
      <Route path="recognitions/send" element={<MobileAdminGuard><SendRecognitionPage /></MobileAdminGuard>} />
      <Route path="recognitions/:id" element={<MobileAdminGuard><RecognitionDetailPage /></MobileAdminGuard>} />
      <Route path="updates" element={<MobileAdminGuard><UpdatesPage /></MobileAdminGuard>} />
      <Route path="updates/new" element={<MobileAdminGuard><NewUpdatePage /></MobileAdminGuard>} />
      <Route path="updates/edit/:id" element={<MobileAdminGuard><EditUpdatePage /></MobileAdminGuard>} />
      <Route path="time-clock" element={<MobileAdminGuard><MobileTimeClockOverview /></MobileAdminGuard>} />
      <Route path="time-clock/employee/:userId" element={<MobileAdminGuard><MobileEmployeeDetailView /></MobileAdminGuard>} />
      <Route path="add-shift" element={<MobileAdminGuard><AddShiftPage /></MobileAdminGuard>} />
      <Route path="job-scheduling" element={<MobileAdminGuard><JobSchedulingPage /></MobileAdminGuard>} />
      <Route path="shift/:id" element={<MobileShiftGuard><ShiftDetailsPage /></MobileShiftGuard>} />
      <Route path="time-off-management" element={<MobileAdminGuard><TimeOffManagementPage /></MobileAdminGuard>} />
      <Route path="time-off/:id" element={<MobileAdminGuard><TimeOffDetailPage /></MobileAdminGuard>} />
      <Route path="create-task" element={<MobileAdminGuard><CreateTaskPage /></MobileAdminGuard>} />
      <Route path="safety-checklist-responses" element={<MobileAdminGuard><SafetyChecklistResponsesPage /></MobileAdminGuard>} />
      <Route path="quizzes" element={<MobileAdminGuard><QuizzesPage /></MobileAdminGuard>} />
      <Route path="inventory" element={<MobileAdminGuard><InventoryPage /></MobileAdminGuard>} />
      <Route path="skill-levels" element={<MobileAdminGuard><SkillLevelsPage /></MobileAdminGuard>} />
      <Route path="service-tickets" element={<MobileAdminGuard><ServiceTicketsPage /></MobileAdminGuard>} />
      <Route path="service-tickets/:id" element={<ServiceTicketDetailView />} />
      <Route path="tasks" element={<MobileAdminGuard><TasksPage /></MobileAdminGuard>} />
      <Route path="tasks/new" element={<MobileAdminGuard><AddMobileTaskPage /></MobileAdminGuard>} />
      <Route path="tasks/:taskId" element={<MobileAdminGuard><MobileTaskDetailPage /></MobileAdminGuard>} />
      <Route path="tasks/:taskId/edit" element={<MobileAdminGuard><AddMobileTaskPage /></MobileAdminGuard>} />
      
      {/* Regular user routes */}
      <Route path="schedule" element={<MySchedulePage />} />
      <Route path="time-clock-old" element={<TimeClockTab />} />
      <Route path="requests/shift" element={<AddShiftRequestPage />} />
      <Route path="requests/break" element={<AddBreakRequestPage />} />
      <Route path="requests/time-off" element={<AddTimeOffRequestPage />} />
    </Route>
    
    {/* Regular Desktop Routes */}
    <Route path="/" element={<Home />} />
    <Route path="/download" element={<DownloadApp />} />
    <Route path="/store" element={<Store />} />
    <Route path="/store/auth" element={<StoreAuth />} />
    <Route path="/store/orders" element={<StoreOrders />} />
    <Route path="/store/category/:category" element={<StoreCategory />} />
    <Route path="/store/product/:id" element={<StoreProductDetail />} />
    <Route path="/product/:id" element={<ProductDetail />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/auth" element={<Navigate to="/admin-login" replace />} />
    <Route path="/admin-login" element={<AdminLogin />} />
    
    {/* Admin routes with shared layout (Fasto persists across all) */}
    <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/projects/:id/profit" element={<ProjectProfitView />} />
      <Route path="/admin/projects/:id/details" element={<ProjectDetailsPage />} />
      <Route path="/admin/projects/:id/photos" element={<ProjectPhotosPage />} />
      <Route path="/admin/projects/:id/timeline" element={<ProjectTimelinePage />} />
      <Route path="/admin/projects/:id/client-access" element={<ClientAccessPage />} />
      <Route path="/admin/projects/:id/schedule" element={<ProjectSchedulePage />} />
      <Route path="/admin/projects/:id/client-portal-preview" element={<ClientPortalPreview />} />
      <Route path="/admin/projects/:id/summary" element={<ProjectSummaryPage />} />
      {/* Redirect bare project URL to summary page */}
      <Route path="/admin/projects/:id" element={<Navigate to="summary" replace />} />
      <Route path="/admin/projects/:id/schedule-of-values" element={<ProjectSOVPage />} />
      <Route path="/admin/projects/:id/documents" element={<ProjectDocumentsPage />} />
      <Route path="/admin/projects/:id/time" element={<ProjectTimePage />} />
      <Route path="/admin/projects/:id/contacts" element={<ProjectContactsPage />} />
      <Route path="/admin/projects/:id/reports" element={<ProjectReportsPage />} />
      <Route path="/admin/projects/:id/daily-logs" element={<ProjectDailyLogsPage />} />
      <Route path="/admin/learning-dashboard" element={<LearningDashboard />} />
      <Route path="/admin/model-training" element={<ModelTrainingDashboard />} />
      <Route path="/admin/fasto-learning" element={<FastoLearning />} />
      <Route path="/admin/patent-generator" element={<PatentGenerator />} />
      <Route path="/admin/app-icons" element={<AppIconsManager />} />
      {/* Tenant Management Routes */}
      <Route path="/admin/tenants" element={<TenantListPage />} />
      <Route path="/admin/tenants/new" element={<TenantOnboardingWizard />} />
      <Route path="/admin/tenants/:tenantId" element={<TenantDetailPage />} />
      <Route path="/admin/tenants/:tenantId/:section" element={<TenantDetailPage />} />
      <Route path="/admin/*" element={<AdminDashboard />} />
    </Route>
    <Route path="/projects/:projectId/quoter" element={<AdminRoute><RoofQuoter /></AdminRoute>} />
    <Route path="/customer-dashboard" element={<CustomerDashboard />} />
    <Route path="/projects" element={<Projects />} />
    <Route path="/projects/:id" element={<Projects />} />
    <Route path="/project-feedback/:id" element={<CustomerProjectView />} />
    <Route path="/service-ticket/view" element={<CustomerServiceTicketView />} />
    <Route path="/admin/proposals/:id" element={<ProjectProposalPage />} />
    <Route path="/proposals/:token" element={<ProjectProposalPage />} />
    <Route path="/visualizer" element={<VisualizerLanding />} />
    <Route path="/visualizer/editor" element={<VisualizerEditor />} />
    <Route path="/visualizer/editor/:projectId" element={<VisualizerEditor />} />
    <Route path="/multi-structure-demo" element={<MultiStructureDemo />} />
    <Route path="/quote-workspace/:id" element={<QuoteRequestWorkspace />} />
    <Route path="/profit/:id" element={<ProjectProfitView />} />
    <Route path="/invite/:token" element={<InviteAcceptance />} />
    <Route path="/team/invite/:token" element={<SupabaseInviteAcceptance />} />
    <Route path="/team/invite" element={<InviteNoToken />} />
    <Route path="/project-invite/:token" element={<ProjectInvitation />} />
    <Route path="/client-portal/:slug" element={<ClientPortal />} />
    <Route path="/about" element={<About />} />
    <Route path="/services" element={<Services />} />
    <Route path="/services/:slug" element={<ServicePage />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/thank-you" element={<ThankYou />} />
    <Route path="/roof-quote" element={<RoofQuote />} />
    <Route path="/quote/:id" element={<QuoteDetail />} />
    <Route path="/quote/:id/draw" element={<RoofDrawingInterface />} />
    <Route path="/residential-roofing" element={<ResidentialRoofing />} />
    <Route path="/commercial-roofing" element={<CommercialRoofing />} />
    <Route path="/metal-roof-installation" element={<MetalRoofInstallation />} />
    <Route path="/standing-seam-systems" element={<StandingSeamSystems />} />
    <Route path="/r-panel-installation" element={<RPanelInstallation />} />
    <Route path="/metal-roof-panels" element={<MetalRoofPanels />} />
    <Route path="/roof-repair-maintenance" element={<RoofRepairMaintenance />} />
    <Route path="/storm-fire-energy" element={<StormFireEnergy />} />
    <Route path="/roofing-services/:locationSlug" element={<AreaPage />} />
    <Route path="/invoice/:invoiceNumber" element={<InvoicePayment />} />
    <Route path="/invoice-payment/:invoiceNumber" element={<InvoicePayment />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// Separate component to handle PWA logic
const AppContent = () => {
  const [isMobilePWA] = useState(() => isStandalonePWA());
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash for PWA users not already on mobile route
    return isStandalonePWA() && !window.location.pathname.startsWith('/mobile');
  });
  
  useEffect(() => {
    // Redirect to mobile app when installed as PWA and not already on mobile route
    if (isMobilePWA && !window.location.pathname.startsWith('/mobile')) {
      // Small delay to let splash show first
      setTimeout(() => {
        window.location.replace('/mobile/home');
      }, 100);
    }
  }, [isMobilePWA]);

  // Hide splash after animation completes (2 seconds: 1.5s delay + 0.5s fade)
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  return (
    <>
      <SplashScreen isVisible={showSplash} />
      <Toaster />
      <Sonner />
      <AnalyticsTracker />
      {!isMobilePWA && <SearchInterface />}
      <ChunkLoadErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </ChunkLoadErrorBoundary>
    </>
  );
};

function App() {
  // Track PWA usage on app start
  useEffect(() => {
    trackPWAUsage();
  }, []);


  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <LanguageProvider>
              <MobileProvider>
                <AuthProvider>
                  <TenantProvider>
                    <TenantBrandingApplier>
                      <UpdatesProvider>
                        <CartProvider>
                          <SearchProvider>
                            <TooltipProvider>
                              <AppContent />
                            </TooltipProvider>
                          </SearchProvider>
                        </CartProvider>
                      </UpdatesProvider>
                    </TenantBrandingApplier>
                  </TenantProvider>
                </AuthProvider>
              </MobileProvider>
            </LanguageProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
