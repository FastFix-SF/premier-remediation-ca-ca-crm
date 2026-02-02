import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Building2,
  Palette,
  Wrench,
  MapPin,
  HelpCircle,
  Settings2,
  CreditCard,
  Globe,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { getTenantConfig } from '@/integrations/supabase/tenant-client';
import { useToast } from '@/hooks/use-toast';
import {
  BusinessProfileForm,
  BrandingForm,
  ServicesForm,
  ServiceAreasForm,
  FAQsForm,
  FeatureFlagsForm,
} from '../tenant-onboarding/forms';
import { multiTenantSupabase, updateOnboardingProgress } from '@/integrations/supabase/tenant-client';

interface TenantConfig {
  business: any;
  profile: any;
  branding: any;
  subscription: { subscription: any; plan: any };
  whitelabel: any;
  onboarding: any;
  services_count: number;
  areas_count: number;
  faqs_count: number;
}

export const TenantDetailPage: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);

  // Load existing data for forms
  const [services, setServices] = useState<any[]>([]);
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);

  const loadTenantConfig = async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const { data, error } = await getTenantConfig(tenantId);
      if (error) throw error;
      setConfig(data);

      // Load services
      const { data: servicesData } = await multiTenantSupabase
        .from('mt_business_services')
        .select('*')
        .eq('business_id', tenantId)
        .order('display_order');
      setServices(servicesData || []);

      // Load service areas
      const { data: areasData } = await multiTenantSupabase
        .from('mt_business_service_areas')
        .select('*')
        .eq('business_id', tenantId)
        .order('display_order');
      setServiceAreas(areasData || []);

      // Load FAQs
      const { data: faqsData } = await multiTenantSupabase
        .from('mt_business_faqs')
        .select('*')
        .eq('business_id', tenantId)
        .order('display_order');
      setFaqs(faqsData || []);
    } catch (error: any) {
      console.error('Error loading tenant config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tenant configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenantConfig();
  }, [tenantId]);

  // Save handlers
  const handleProfileSave = async (data: any) => {
    if (!tenantId) return;
    setIsSaving(true);
    try {
      await multiTenantSupabase
        .from('mt_business_profiles')
        .update(data)
        .eq('business_id', tenantId);

      toast({ title: 'Profile saved' });
      loadTenantConfig();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBrandingSave = async (data: any) => {
    if (!tenantId) return;
    setIsSaving(true);
    try {
      await multiTenantSupabase
        .from('mt_business_branding')
        .update(data)
        .eq('business_id', tenantId);

      await updateOnboardingProgress(tenantId, 'branding', true);
      toast({ title: 'Branding saved' });
      loadTenantConfig();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleServicesSave = async (data: any) => {
    if (!tenantId) return;
    setIsSaving(true);
    try {
      await multiTenantSupabase
        .from('mt_business_services')
        .delete()
        .eq('business_id', tenantId);

      const newServices = data.services.map((s: any, i: number) => ({
        business_id: tenantId,
        name: s.name,
        slug: s.slug,
        description: s.description,
        icon: s.icon,
        image_url: s.image_url,
        price_range: s.price_range,
        display_order: i,
        is_featured: s.is_featured,
      }));

      if (newServices.length > 0) {
        await multiTenantSupabase.from('mt_business_services').insert(newServices);
      }

      await updateOnboardingProgress(tenantId, 'services', true);
      toast({ title: 'Services saved' });
      loadTenantConfig();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleServiceAreasSave = async (data: any) => {
    if (!tenantId) return;
    setIsSaving(true);
    try {
      await multiTenantSupabase
        .from('mt_business_service_areas')
        .delete()
        .eq('business_id', tenantId);

      const newAreas = data.areas.map((a: any, i: number) => ({
        business_id: tenantId,
        city: a.city,
        state: a.state,
        neighborhoods: a.neighborhoods,
        description: a.description,
        testimonial: a.testimonial,
        display_order: i,
      }));

      if (newAreas.length > 0) {
        await multiTenantSupabase.from('mt_business_service_areas').insert(newAreas);
      }

      await updateOnboardingProgress(tenantId, 'service_areas', true);
      toast({ title: 'Service areas saved' });
      loadTenantConfig();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFAQsSave = async (data: any) => {
    if (!tenantId) return;
    setIsSaving(true);
    try {
      await multiTenantSupabase
        .from('mt_business_faqs')
        .delete()
        .eq('business_id', tenantId);

      const newFaqs = data.faqs.map((f: any, i: number) => ({
        business_id: tenantId,
        question: f.question,
        answer: f.answer,
        category: f.category,
        display_order: i,
      }));

      if (newFaqs.length > 0) {
        await multiTenantSupabase.from('mt_business_faqs').insert(newFaqs);
      }

      await updateOnboardingProgress(tenantId, 'faqs', true);
      toast({ title: 'FAQs saved' });
      loadTenantConfig();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeaturesSave = async (data: any) => {
    if (!tenantId) return;
    setIsSaving(true);
    try {
      for (const [slug, enabled] of Object.entries(data.features)) {
        await multiTenantSupabase
          .from('tenant_edge_functions')
          .update({ is_enabled: enabled as boolean })
          .eq('tenant_id', tenantId)
          .eq('function_slug', slug);
      }

      await updateOnboardingProgress(tenantId, 'features', true);
      toast({ title: 'Features saved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="py-8 text-center text-muted-foreground">
          Loading tenant configuration...
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6">
        <div className="py-8 text-center">
          <h3 className="text-lg font-medium">Tenant not found</h3>
          <Button variant="outline" onClick={() => navigate('/admin/tenants')} className="mt-4">
            Back to Tenants
          </Button>
        </div>
      </div>
    );
  }

  const { business, profile, branding, subscription, whitelabel, onboarding } = config;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tenants')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-14 w-14">
          <AvatarImage src={branding?.logo_url} />
          <AvatarFallback className="text-lg">
            {(profile?.business_name || business?.name || '?').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile?.business_name || business?.name}</h1>
          <p className="text-muted-foreground">{business?.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={subscription?.subscription?.status === 'active' ? 'default' : 'secondary'}>
            {subscription?.subscription?.status || 'trial'}
          </Badge>
          <Badge variant="outline">{subscription?.plan?.name || 'No Plan'}</Badge>
          {onboarding?.onboarding_completed ? (
            <Badge variant="outline" className="text-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Onboarded
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600">
              <Clock className="h-3 w-3 mr-1" />
              Setup Incomplete
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <p className="text-muted-foreground">Active team members</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{config.services_count}</div>
                <p className="text-muted-foreground">Active services</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Service Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{config.areas_count}</div>
                <p className="text-muted-foreground">Geographic areas</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Onboarding Progress</CardTitle>
              <CardDescription>Track the tenant's setup completion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'profile_completed', label: 'Profile', icon: Building2 },
                  { key: 'branding_completed', label: 'Branding', icon: Palette },
                  { key: 'services_completed', label: 'Services', icon: Wrench },
                  { key: 'service_areas_completed', label: 'Areas', icon: MapPin },
                  { key: 'faqs_completed', label: 'FAQs', icon: HelpCircle },
                  { key: 'features_completed', label: 'Features', icon: Settings2 },
                  { key: 'subscription_completed', label: 'Subscription', icon: CreditCard },
                  { key: 'whitelabel_completed', label: 'White Label', icon: Globe },
                ].map(({ key, label, icon: Icon }) => (
                  <div
                    key={key}
                    className={`flex items-center gap-2 p-3 rounded-lg border ${
                      onboarding?.[key] ? 'bg-green-50 border-green-200' : 'bg-muted'
                    }`}
                  >
                    {onboarding?.[key] ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className={onboarding?.[key] ? 'text-green-700' : 'text-muted-foreground'}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Tenant CRM
              </Button>
              <Button variant="outline" onClick={() => setActiveTab('features')}>
                <Settings2 className="h-4 w-4 mr-2" />
                Manage Features
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <BusinessProfileForm
            defaultValues={profile}
            onSubmit={handleProfileSave}
            isLoading={isSaving}
          />
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <BrandingForm
            tenantId={tenantId}
            defaultValues={branding}
            onSubmit={handleBrandingSave}
            isLoading={isSaving}
          />
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <ServicesForm
            defaultValues={{ services }}
            onSubmit={handleServicesSave}
            isLoading={isSaving}
          />
        </TabsContent>

        {/* Service Areas Tab */}
        <TabsContent value="areas">
          <ServiceAreasForm
            defaultValues={{ areas: serviceAreas }}
            onSubmit={handleServiceAreasSave}
            isLoading={isSaving}
          />
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs">
          <FAQsForm
            defaultValues={{ faqs }}
            onSubmit={handleFAQsSave}
            isLoading={isSaving}
          />
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <FeatureFlagsForm
            tenantId={tenantId}
            onSubmit={handleFeaturesSave}
            isLoading={isSaving}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage subscription plan and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Current Plan</label>
                  <p className="text-lg">{subscription?.plan?.name || 'No Plan'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-lg capitalize">{subscription?.subscription?.status || 'trial'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Billing Cycle</label>
                  <p className="text-lg capitalize">{subscription?.subscription?.billing_cycle || 'monthly'}</p>
                </div>
                <Button variant="outline">Change Plan</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>White Label Settings</CardTitle>
                <CardDescription>Custom branding and domain settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">System Name</label>
                  <p className="text-lg">{whitelabel?.system_name || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Custom Domain</label>
                  <p className="text-lg">{whitelabel?.custom_domain || 'Not configured'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Support Email</label>
                  <p className="text-lg">{whitelabel?.support_email || 'Not set'}</p>
                </div>
                <Button variant="outline">Edit Settings</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
