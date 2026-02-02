import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MobileAdminGuardProps {
  children: React.ReactNode;
}

export const MobileAdminGuard = ({ children }: MobileAdminGuardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to access this page.',
          variant: 'destructive',
        });
        navigate('/mobile/auth');
        return;
      }

      // Check if user is admin
      const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      // Check if user is owner
      const { data: teamCheck } = await supabase
        .from('team_directory')
        .select('role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const isInAdminTable = !!adminCheck;
      const isOwner = teamCheck?.role === 'owner';
      const isTeamAdmin = teamCheck?.role === 'admin';

      if (isInAdminTable || isOwner || isTeamAdmin) {
        setIsAuthorized(true);
      } else {
        toast({
          title: 'Access denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
        navigate('/mobile/home');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/mobile/home');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};
