import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackgroundButton } from '@/components/admin/BackgroundButton';
import { FeedbackButton } from '@/components/admin/FeedbackButton';
import { Loader2, Shield, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { companyConfig } from '@/config/company';

interface AdminRouteProps {
  children: React.ReactNode;
}
export const AdminRoute: React.FC<AdminRouteProps> = ({
  children
}) => {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const {
    data: adminStatus,
    isLoading: adminLoading
  } = useAdminStatus();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({
    background: 'linear-gradient(135deg, rgb(249 250 251) 0%, rgb(255 255 255) 100%)'
  });
  useEffect(() => {
    const loadBackgroundSettings = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('admin_background_style')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data?.admin_background_style) {
          const savedBackground = JSON.parse(data.admin_background_style);
          setBackgroundStyle(savedBackground);
        }
      } catch (error) {
        console.error('Failed to load background settings:', error);
      }
    };
    loadBackgroundSettings();
  }, [user]);
  const handleBackgroundChange = async (newBackgroundStyle: React.CSSProperties) => {
    setBackgroundStyle(newBackgroundStyle);
    
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ admin_background_style: JSON.stringify(newBackgroundStyle) })
          .eq('id', user.id);
      } catch (error) {
        console.error('Failed to save background settings:', error);
      }
    }
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out."
    });
    navigate('/admin/login');
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Initializing...</h3>
            <p className="text-muted-foreground">
              Setting up authentication
            </p>
          </CardContent>
        </Card>
      </div>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // Show loading while checking admin status
  if (adminLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Verifying Access</h3>
            <p className="text-muted-foreground">
              Checking admin privileges...
            </p>
          </CardContent>
        </Card>
      </div>;
  }

  // Show access denied if not admin or owner
  if (!adminStatus?.isAdmin) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2 text-destructive">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              You are not authorized to access the admin dashboard.
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              User ID: {user.id}
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact an administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>;
  }

  // Render children if authenticated and admin with admin layout
  return <div className="min-h-screen" style={backgroundStyle}>
      {/* Admin Navbar */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <img 
              src={companyConfig.logo}
              alt={companyConfig.name}
              className="w-10 h-10"
            />
            <div>
              <div className="text-base font-display font-bold text-primary">
                {companyConfig.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {companyConfig.tagline}
              </div>
            </div>
          </button>
          
          <div className="flex items-center gap-3">
            <BackgroundButton
              currentBackground={backgroundStyle}
              onBackgroundChange={handleBackgroundChange}
              configKey="ADMIN_BACKGROUND_STYLE"
              pageTitle="Admin Dashboard"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main>
        {children}
      </main>

      {/* Floating Feedback Button */}
      <FeedbackButton />
    </div>;
};
