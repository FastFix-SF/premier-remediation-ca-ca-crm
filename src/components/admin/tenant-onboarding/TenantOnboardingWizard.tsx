import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building2,
  Palette,
  Wrench,
  MapPin,
  HelpCircle,
  Settings2,
  CreditCard,
  Globe,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  BusinessProfileForm,
  BrandingForm,
  ServicesForm,
  ServiceAreasForm,
  FAQsForm,
  FeatureFlagsForm,
} from './forms';
import type {
  BusinessProfileFormData,
  BrandingFormData,
  ServicesListFormData,
  ServiceAreasListFormData,
  FAQsListFormData,
  FeatureFlagsFormData,
} from './forms';
import { createTenant, updateOnboardingProgress } from '@/integrations/supabase/tenant-client';
import { multiTenantSupabase } from '@/integrations/supabase/tenant-client';

// Step configuration
const STEPS = [
  { id: 'profile', label: 'Business Profile', icon: Building2, required: true },
  { id: 'branding', label: 'Branding', icon: Palette, required: true },
  { id: 'services', label: 'Services', icon: Wrench, required: true },
  { id: 'service_areas', label: 'Service Areas', icon: MapPin, required: true },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle, required: false },
  { id: 'features', label: 'Features', icon: Settings2, required: false },
  { id: 'subscription', label: 'Subscription', icon: CreditCard, required: false },
  { id: 'whitelabel', label: 'White Label', icon: Globe, required: false },
];

interface WizardState {
  currentStep: number;
  tenantId: string | null;
  profile: BusinessProfileFormData | null;
  branding: BrandingFormData | null;
  services: ServicesListFormData | null;
  serviceAreas: ServiceAreasListFormData | null;
  faqs: FAQsListFormData | null;
  features: FeatureFlagsFormData | null;
  subscription: { planSlug: string; billingCycle: 'monthly' | 'yearly' } | null;
  whitelabel: Record<string, any> | null;
}

const initialState: WizardState = {
  currentStep: 0,
  tenantId: null,
  profile: null,
  branding: null,
  services: null,
  serviceAreas: null,
  faqs: null,
  features: null,
  subscription: null,
  whitelabel: null,
};

// Subscription Plan Selector
const SubscriptionStep: React.FC<{
  defaultValue?: { planSlug: string; billingCycle: 'monthly' | 'yearly' };
  onSubmit: (data: { planSlug: string; billingCycle: 'monthly' | 'yearly' }) => void;
  isLoading: boolean;
}> = ({ defaultValue, onSubmit, isLoading }) => {
  const [selectedPlan, setSelectedPlan] = useState(defaultValue?.planSlug || 'starter');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(defaultValue?.billingCycle || 'monthly');

  const plans = [
    { slug: 'starter', name: 'Starter', price: { monthly: 99, yearly: 990 }, users: 5, projects: 50 },
    { slug: 'professional', name: 'Professional', price: { monthly: 249, yearly: 2490 }, users: 15, projects: 200 },
    { slug: 'enterprise', name: 'Enterprise', price: { monthly: 499, yearly: 4990 }, users: 'Unlimited', projects: 'Unlimited' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-4 mb-6">
        <Button
          variant={billingCycle === 'monthly' ? 'default' : 'outline'}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </Button>
        <Button
          variant={billingCycle === 'yearly' ? 'default' : 'outline'}
          onClick={() => setBillingCycle('yearly')}
        >
          Yearly (Save 17%)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.slug}
            className={`cursor-pointer transition-all ${
              selectedPlan === plan.slug ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedPlan(plan.slug)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                {selectedPlan === plan.slug && <CheckCircle2 className="h-5 w-5 text-primary" />}
              </CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold">
                  ${plan.price[billingCycle]}
                </span>
                <span className="text-muted-foreground">
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ {plan.users} users</li>
                <li>✓ {plan.projects} projects</li>
                <li>✓ Core CRM features</li>
                {plan.slug !== 'starter' && <li>✓ Communications</li>}
                {plan.slug === 'enterprise' && <li>✓ AI & Roof Analysis</li>}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={() => onSubmit({ planSlug: selectedPlan, billingCycle })}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

// White Label Settings Step
const WhiteLabelStep: React.FC<{
  defaultValue?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  isLoading: boolean;
}> = ({ defaultValue, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    system_name: defaultValue?.system_name || '',
    support_email: defaultValue?.support_email || '',
    support_phone: defaultValue?.support_phone || '',
    custom_domain: defaultValue?.custom_domain || '',
    terms_of_service_url: defaultValue?.terms_of_service_url || '',
    privacy_policy_url: defaultValue?.privacy_policy_url || '',
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">System Name</label>
          <input
            type="text"
            value={formData.system_name}
            onChange={(e) => setFormData({ ...formData, system_name: e.target.value })}
            placeholder="My Roofing CRM"
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
          <p className="text-xs text-muted-foreground mt-1">Custom name for the application</p>
        </div>
        <div>
          <label className="text-sm font-medium">Custom Domain</label>
          <input
            type="text"
            value={formData.custom_domain}
            onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
            placeholder="crm.mycompany.com"
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
          <p className="text-xs text-muted-foreground mt-1">Point your domain to our servers</p>
        </div>
        <div>
          <label className="text-sm font-medium">Support Email</label>
          <input
            type="email"
            value={formData.support_email}
            onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
            placeholder="support@mycompany.com"
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Support Phone</label>
          <input
            type="text"
            value={formData.support_phone}
            onChange={(e) => setFormData({ ...formData, support_phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Terms of Service URL</label>
          <input
            type="url"
            value={formData.terms_of_service_url}
            onChange={(e) => setFormData({ ...formData, terms_of_service_url: e.target.value })}
            placeholder="https://mycompany.com/terms"
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Privacy Policy URL</label>
          <input
            type="url"
            value={formData.privacy_policy_url}
            onChange={(e) => setFormData({ ...formData, privacy_policy_url: e.target.value })}
            placeholder="https://mycompany.com/privacy"
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={() => onSubmit(formData)} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  );
};

export const TenantOnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<WizardState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const currentStepConfig = STEPS[state.currentStep];
  const progress = ((state.currentStep + 1) / STEPS.length) * 100;

  const canGoBack = state.currentStep > 0;
  const canSkip = !currentStepConfig.required;

  // Save profile and create tenant
  const handleProfileSubmit = async (data: BusinessProfileFormData) => {
    setIsLoading(true);
    try {
      // Create the tenant
      const result = await createTenant({
        tenantName: data.business_name,
        adminEmail: data.email || '',
        planSlug: 'starter',
      });

      if (!result.data?.success) {
        throw new Error(result.data?.error || 'Failed to create tenant');
      }

      const tenantId = result.data.business_id;

      // Update profile with additional data
      await multiTenantSupabase
        .from('mt_business_profiles')
        .update({
          business_name: data.business_name,
          tagline: data.tagline,
          description: data.description,
          phone: data.phone,
          email: data.email,
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          license_number: data.license_number,
          years_in_business: data.years_in_business,
          owner_name: data.owner_name,
          owner_title: data.owner_title,
        })
        .eq('business_id', tenantId);

      setState((prev) => ({
        ...prev,
        tenantId,
        profile: data,
        currentStep: prev.currentStep + 1,
      }));

      toast({ title: 'Tenant created', description: 'Business profile saved successfully.' });
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create tenant',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save branding
  const handleBrandingSubmit = async (data: BrandingFormData) => {
    if (!state.tenantId) return;
    setIsLoading(true);
    try {
      await multiTenantSupabase
        .from('mt_business_branding')
        .update(data)
        .eq('business_id', state.tenantId);

      await updateOnboardingProgress(state.tenantId, 'branding', true);

      setState((prev) => ({
        ...prev,
        branding: data,
        currentStep: prev.currentStep + 1,
      }));

      toast({ title: 'Branding saved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Save services
  const handleServicesSubmit = async (data: ServicesListFormData) => {
    if (!state.tenantId) return;
    setIsLoading(true);
    try {
      // Delete existing services
      await multiTenantSupabase
        .from('mt_business_services')
        .delete()
        .eq('business_id', state.tenantId);

      // Insert new services
      const services = data.services.map((s, i) => ({
        business_id: state.tenantId,
        name: s.name,
        slug: s.slug,
        description: s.description,
        icon: s.icon,
        image_url: s.image_url,
        price_range: s.price_range,
        display_order: i,
        is_featured: s.is_featured,
      }));

      await multiTenantSupabase.from('mt_business_services').insert(services);
      await updateOnboardingProgress(state.tenantId, 'services', true);

      setState((prev) => ({
        ...prev,
        services: data,
        currentStep: prev.currentStep + 1,
      }));

      toast({ title: 'Services saved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Save service areas
  const handleServiceAreasSubmit = async (data: ServiceAreasListFormData) => {
    if (!state.tenantId) return;
    setIsLoading(true);
    try {
      await multiTenantSupabase
        .from('mt_business_service_areas')
        .delete()
        .eq('business_id', state.tenantId);

      const areas = data.areas.map((a, i) => ({
        business_id: state.tenantId,
        city: a.city,
        state: a.state,
        neighborhoods: a.neighborhoods,
        description: a.description,
        testimonial: a.testimonial,
        display_order: i,
      }));

      await multiTenantSupabase.from('mt_business_service_areas').insert(areas);
      await updateOnboardingProgress(state.tenantId, 'service_areas', true);

      setState((prev) => ({
        ...prev,
        serviceAreas: data,
        currentStep: prev.currentStep + 1,
      }));

      toast({ title: 'Service areas saved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Save FAQs
  const handleFAQsSubmit = async (data: FAQsListFormData) => {
    if (!state.tenantId) return;
    setIsLoading(true);
    try {
      await multiTenantSupabase
        .from('mt_business_faqs')
        .delete()
        .eq('business_id', state.tenantId);

      if (data.faqs.length > 0) {
        const faqs = data.faqs.map((f, i) => ({
          business_id: state.tenantId,
          question: f.question,
          answer: f.answer,
          category: f.category,
          display_order: i,
        }));

        await multiTenantSupabase.from('mt_business_faqs').insert(faqs);
      }

      await updateOnboardingProgress(state.tenantId, 'faqs', true);

      setState((prev) => ({
        ...prev,
        faqs: data,
        currentStep: prev.currentStep + 1,
      }));

      toast({ title: 'FAQs saved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Save features
  const handleFeaturesSubmit = async (data: FeatureFlagsFormData) => {
    if (!state.tenantId) return;
    setIsLoading(true);
    try {
      // Update feature flags
      for (const [slug, enabled] of Object.entries(data.features)) {
        await multiTenantSupabase
          .from('tenant_edge_functions')
          .update({ is_enabled: enabled })
          .eq('tenant_id', state.tenantId)
          .eq('function_slug', slug);
      }

      await updateOnboardingProgress(state.tenantId, 'features', true);

      setState((prev) => ({
        ...prev,
        features: data,
        currentStep: prev.currentStep + 1,
      }));

      toast({ title: 'Features saved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Save subscription
  const handleSubscriptionSubmit = async (data: { planSlug: string; billingCycle: 'monthly' | 'yearly' }) => {
    if (!state.tenantId) return;
    setIsLoading(true);
    try {
      // Get plan ID
      const { data: plan } = await multiTenantSupabase
        .from('subscription_plans')
        .select('id')
        .eq('slug', data.planSlug)
        .maybeSingle();

      if (plan) {
        await multiTenantSupabase
          .from('tenant_subscriptions')
          .update({
            plan_id: plan.id,
            billing_cycle: data.billingCycle,
          })
          .eq('tenant_id', state.tenantId);
      }

      await updateOnboardingProgress(state.tenantId, 'subscription', true);

      setState((prev) => ({
        ...prev,
        subscription: data,
        currentStep: prev.currentStep + 1,
      }));

      toast({ title: 'Subscription updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Save whitelabel and complete
  const handleWhitelabelSubmit = async (data: Record<string, any>) => {
    if (!state.tenantId) return;
    setIsLoading(true);
    try {
      await multiTenantSupabase
        .from('tenant_whitelabel_settings')
        .update(data)
        .eq('tenant_id', state.tenantId);

      await updateOnboardingProgress(state.tenantId, 'whitelabel', true);

      setState((prev) => ({ ...prev, whitelabel: data }));
      setShowCompletionModal(true);

      toast({ title: 'Setup complete!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
  };

  const handleBack = () => {
    setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
  };

  const renderStep = () => {
    switch (currentStepConfig.id) {
      case 'profile':
        return (
          <BusinessProfileForm
            defaultValues={state.profile || undefined}
            onSubmit={handleProfileSubmit}
            isLoading={isLoading}
            submitLabel="Create Tenant & Continue"
            showCard={false}
          />
        );
      case 'branding':
        return (
          <BrandingForm
            tenantId={state.tenantId || undefined}
            defaultValues={state.branding || undefined}
            onSubmit={handleBrandingSubmit}
            isLoading={isLoading}
            submitLabel="Continue"
            showCard={false}
          />
        );
      case 'services':
        return (
          <ServicesForm
            defaultValues={state.services || undefined}
            onSubmit={handleServicesSubmit}
            isLoading={isLoading}
            submitLabel="Continue"
            showCard={false}
          />
        );
      case 'service_areas':
        return (
          <ServiceAreasForm
            defaultValues={state.serviceAreas || undefined}
            onSubmit={handleServiceAreasSubmit}
            isLoading={isLoading}
            submitLabel="Continue"
            showCard={false}
          />
        );
      case 'faqs':
        return (
          <FAQsForm
            defaultValues={state.faqs || undefined}
            onSubmit={handleFAQsSubmit}
            isLoading={isLoading}
            submitLabel="Continue"
            showCard={false}
          />
        );
      case 'features':
        return (
          <FeatureFlagsForm
            tenantId={state.tenantId || undefined}
            defaultValues={state.features?.features}
            onSubmit={handleFeaturesSubmit}
            isLoading={isLoading}
            submitLabel="Continue"
            showCard={false}
          />
        );
      case 'subscription':
        return (
          <SubscriptionStep
            defaultValue={state.subscription || undefined}
            onSubmit={handleSubscriptionSubmit}
            isLoading={isLoading}
          />
        );
      case 'whitelabel':
        return (
          <WhiteLabelStep
            defaultValue={state.whitelabel || undefined}
            onSubmit={handleWhitelabelSubmit}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Tenant Onboarding</h1>
        <p className="text-muted-foreground">
          Set up a new tenant account. Complete the required steps to create a fully configured tenant.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {state.currentStep + 1} of {STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === state.currentStep;
          const isComplete = index < state.currentStep;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isComplete
                  ? 'bg-green-100 text-green-700'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="text-sm font-medium hidden md:inline">{step.label}</span>
              {!step.required && (
                <span className="text-xs opacity-60">(optional)</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Current step card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(currentStepConfig.icon, { className: 'h-5 w-5' })}
            {currentStepConfig.label}
            {!currentStepConfig.required && (
              <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
            )}
          </CardTitle>
          <CardDescription>
            {currentStepConfig.id === 'profile' && 'Enter the basic information about the business.'}
            {currentStepConfig.id === 'branding' && 'Upload logo and set brand colors.'}
            {currentStepConfig.id === 'services' && 'Add the services this business offers.'}
            {currentStepConfig.id === 'service_areas' && 'Define the geographic areas served.'}
            {currentStepConfig.id === 'faqs' && 'Add frequently asked questions for the website.'}
            {currentStepConfig.id === 'features' && 'Enable or disable features for this tenant.'}
            {currentStepConfig.id === 'subscription' && 'Select a subscription plan.'}
            {currentStepConfig.id === 'whitelabel' && 'Configure white-label settings.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStep()}

          {/* Navigation buttons for optional steps */}
          {canSkip && currentStepConfig.id !== 'whitelabel' && (
            <div className="flex justify-between mt-6 pt-6 border-t">
              {canGoBack && (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <Button variant="ghost" onClick={handleSkip} className="ml-auto">
                Skip this step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion Modal */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Tenant Setup Complete!
            </DialogTitle>
            <DialogDescription>
              The tenant has been successfully created and configured. You can now manage this tenant
              from the Tenant Management panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate('/admin/tenants')}>
              Go to Tenant List
            </Button>
            <Button onClick={() => navigate(`/admin/tenants/${state.tenantId}`)}>
              View Tenant Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
