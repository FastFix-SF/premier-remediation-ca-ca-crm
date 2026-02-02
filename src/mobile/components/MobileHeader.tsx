import React, { useState, useEffect } from 'react';
import { MoreVertical, LogIn, LogOut, User, HelpCircle } from 'lucide-react';
import mobileLogo from '@/assets/mobile-logo.png';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { HelpDialog } from './HelpDialog';
import { MobileNotificationSheet } from '@/components/notifications/MobileNotificationSheet';
import { supabase } from '@/integrations/supabase/client';

export const MobileHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);

  // Fetch the user's member ID and first name
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('team_directory')
        .select('user_id, full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setMemberId(data.user_id);
        // Extract first name from full_name
        if (data.full_name) {
          const nameParts = data.full_name.trim().split(' ');
          setFirstName(nameParts[0]);
        }
      }
    };
    
    fetchUserInfo();
  }, [user?.id]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: t('common.error'),
        description: t('header.signOutError'),
        variant: "destructive",
      });
    } else {
      toast({
        title: t('header.signedOut'),
        description: t('header.signedOutDesc'),
      });
      navigate('/auth');
    }
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <header className="app-top-bar animated-wave-gradient text-white px-4 h-11 w-full flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center space-x-1.5 xs:space-x-2 min-w-0">
        <img src={mobileLogo} alt="The Roofing Friend" className="w-8 h-8 xs:w-10 xs:h-10 object-contain flex-shrink-0" />
        <span className="font-semibold text-xs xs:text-sm truncate">Roofing Friend</span>
      </div>
      
      {/* Spacer */}
      <div className="flex-1 min-w-2" />
      
      {/* Notification Bell */}
      {user && <MobileNotificationSheet memberId={memberId} />}
      
      {/* Overflow Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-background border shadow-lg">
          {user && (
            <>
              <DropdownMenuItem 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => navigate('/mobile/profile')}
              >
                <User className="w-4 h-4" />
                <span className="text-sm">{firstName || user.email}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => navigate('/mobile/profile')}>
            {t('profile.settings')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowHelpDialog(true)} className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            {t('header.help')}
          </DropdownMenuItem>
          <DropdownMenuItem>{t('profile.about')}</DropdownMenuItem>
          <DropdownMenuSeparator />
          {user ? (
            <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-destructive">
              <LogOut className="w-4 h-4" />
              {t('profile.signOut')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleSignIn} className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              {t('header.signIn')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <HelpDialog isOpen={showHelpDialog} onClose={() => setShowHelpDialog(false)} />
    </header>
  );
};