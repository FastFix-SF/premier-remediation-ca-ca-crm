import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MobileShiftGuardProps {
  children: React.ReactNode;
}

/**
 * Guard that allows access to shift details if the user is:
 * 1. An admin or owner
 * 2. OR is assigned to this specific shift (in the assigned_users array)
 */
export const MobileShiftGuard = ({ children }: MobileShiftGuardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id: shiftId } = useParams<{ id: string }>();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [shiftId]);

  const checkAccess = async () => {
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

      // Check if user is admin in admin_users table
      const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      // Check if user is owner or admin in team_directory
      const { data: teamCheck } = await supabase
        .from('team_directory')
        .select('role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const isAdminInTable = !!adminCheck;
      const isAdminRole = teamCheck?.role === 'admin';
      const isOwner = teamCheck?.role === 'owner';
      const isAdmin = isAdminInTable || isAdminRole || isOwner;

      // If admin or owner, allow access
      if (isAdmin) {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // If not admin/owner, check if user is assigned to this shift
      if (shiftId) {
        const { data: shiftData, error: shiftError } = await supabase
          .from('job_schedules')
          .select('assigned_users')
          .eq('id', shiftId)
          .maybeSingle();

        if (!shiftError && shiftData) {
          const assignedUsers = Array.isArray(shiftData.assigned_users) ? shiftData.assigned_users : [];
          
          // Check if user is in the assigned_users array
          const isAssigned = assignedUsers.some((u: any) => {
            // Handle string format (old)
            if (typeof u === 'string') {
              return u === user.id;
            }
            // Handle object format (new)
            if (typeof u === 'object' && u !== null) {
              return u.id === user.id || u.user_id === user.id;
            }
            return false;
          });

          if (isAssigned) {
            setIsAuthorized(true);
            setIsLoading(false);
            return;
          }
        }
      }

      // User is not authorized
      toast({
        title: 'Access denied',
        description: 'You do not have permission to access this shift.',
        variant: 'destructive',
      });
      navigate('/mobile/home');
    } catch (error) {
      console.error('Error checking shift access:', error);
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
