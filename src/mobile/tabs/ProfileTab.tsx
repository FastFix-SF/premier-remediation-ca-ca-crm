import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Shield, LogOut, Info, Palette, Globe, Camera, Check, Edit2, Bell, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { useProfile } from '@/hooks/useProfile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFastoSettings } from '@/hooks/useFastoSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ProfileTab: React.FC = () => {
  const { user, signOut } = useAuth();
  const { data: adminStatus } = useAdminStatus();
  const { profile, uploading, uploadAvatar } = useProfile();
  const { language, setLanguage, t } = useLanguage();
  const { settings: fastoSettings, setEnabled: setFastoEnabled } = useFastoSettings();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [showEditNameSheet, setShowEditNameSheet] = useState(false);
  const [showSmsSheet, setShowSmsSheet] = useState(false);
  const [editedName, setEditedName] = useState('');
  const queryClient = useQueryClient();

  const handleFastoToggle = (enabled: boolean) => {
    setFastoEnabled(enabled);
    toast.success(enabled ? 'Fasto enabled' : 'Fasto disabled');
  };

  const handleLanguageChange = (newLanguage: 'en' | 'es') => {
    setLanguage(newLanguage);
    setShowLanguageSheet(false);
    toast.success(`${t('profile.languageChanged')} ${newLanguage === 'en' ? t('profile.english') : t('profile.spanish')}`);
  };

  // Fetch user's full name from team_directory
  const { data: teamProfile } = useQuery({
    queryKey: ['team-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('team_directory')
        .select('full_name, email, role, sms_notifications_enabled, phone_number')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching team profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/mobile/auth');
  };

  const handleAdminPanel = () => {
    navigate('/admin');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('profile.fileTooLarge'));
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(t('profile.selectImageFile'));
        return;
      }

      await uploadAvatar(file);
    }
    // Reset input
    event.target.value = '';
  };

  const displayName = teamProfile?.full_name || user?.user_metadata?.display_name || t('common.teamMember');
  const userInitials = displayName.substring(0, 2).toUpperCase();

  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      if (!user?.id) throw new Error('User not found');
      
      const { error } = await supabase
        .from('team_directory')
        .update({ full_name: newName })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-profile', user?.id] });
      toast.success(t('profile.nameUpdated'));
      setShowEditNameSheet(false);
    },
    onError: (error) => {
      console.error('Error updating name:', error);
      toast.error(t('profile.nameUpdateFailed'));
    },
  });

  const handleEditName = () => {
    setEditedName(displayName);
    setShowEditNameSheet(true);
  };

  const handleSaveName = () => {
    if (!editedName.trim()) {
      toast.error(t('profile.nameEmpty'));
      return;
    }
    updateNameMutation.mutate(editedName.trim());
  };

  const toggleSmsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.id) throw new Error('User not found');
      
      const { error } = await supabase
        .from('team_directory')
        .update({ sms_notifications_enabled: enabled })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['team-profile', user?.id] });
      toast.success(enabled ? t('profile.smsEnabled') : t('profile.smsDisabled'));
      setShowSmsSheet(false);
    },
    onError: (error) => {
      console.error('Error updating SMS preference:', error);
      toast.error(t('profile.smsUpdateFailed'));
    },
  });

  const handleSmsToggle = () => {
    if (teamProfile?.sms_notifications_enabled) {
      // If currently enabled, disable it directly
      toggleSmsMutation.mutate(false);
    } else {
      // If currently disabled, show the opt-in sheet
      setShowSmsSheet(true);
    }
  };

  const handleEnableSms = () => {
    toggleSmsMutation.mutate(true);
  };

  return (
    <div className="p-3 xs:p-4 space-y-4 xs:space-y-6 overflow-x-hidden">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-4 xs:pt-6">
          <div className="flex items-center space-x-3 xs:space-x-4">
            <div className="relative flex-shrink-0">
              <Avatar 
                className="w-14 h-14 xs:w-16 xs:h-16 cursor-pointer ring-2 ring-transparent hover:ring-primary/20 transition-all" 
                onClick={handleAvatarClick}
              >
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt="Profile picture" />
                ) : (
                  <AvatarFallback className="text-lg font-semibold">
                    {userInitials}
                  </AvatarFallback>
                )}
              </Avatar>
              <Button
                size="sm"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-6 w-6 p-0 rounded-full shadow-sm"
                onClick={handleAvatarClick}
                disabled={uploading}
              >
                <Camera className="h-3 w-3" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 xs:gap-2">
                <h2 className="text-base xs:text-lg font-semibold text-foreground truncate">
                  {displayName}
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 xs:h-7 xs:w-7 p-0 flex-shrink-0"
                  onClick={handleEditName}
                >
                  <Edit2 className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
                </Button>
              </div>
              <p className="text-xs xs:text-sm text-muted-foreground truncate">
                {teamProfile?.phone_number 
                  ? `+1 ${teamProfile.phone_number.replace(/^\+?1?/, '')}` 
                  : (user?.phone || (teamProfile?.email && !teamProfile.email.includes('@placeholder.local') ? teamProfile.email : null) || (user?.email && !user.email.includes('@placeholder.local') ? user.email : null))}
              </p>
              {adminStatus?.isAdmin && (
                <span className="inline-flex items-center px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full text-[10px] xs:text-xs bg-primary/10 text-primary mt-1">
                  {t('profile.administrator')}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Access */}
      {adminStatus?.isOwner && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>{t('profile.adminAccess')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={handleAdminPanel}
              className="w-full justify-start"
            >
              <Settings className="w-4 h-4 mr-2" />
              {t('profile.openAdminPanel')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Name Sheet */}
      <Sheet open={showEditNameSheet} onOpenChange={setShowEditNameSheet}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t('profile.editName')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.fullName')}</Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder={t('profile.enterFullName')}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditNameSheet(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveName}
                disabled={updateNameMutation.isPending}
              >
                {updateNameMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* SMS Notifications Sheet */}
      <Sheet open={showSmsSheet} onOpenChange={setShowSmsSheet}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t('profile.enableSms')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Bell className="w-5 h-5 mt-0.5 text-primary" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{t('profile.stayUpdated')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.smsDescription')}
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-1 mt-2">
                    <li>• {t('profile.smsNewMessage')}</li>
                    <li>• {t('profile.smsJobAssignment')}</li>
                    <li>• {t('profile.smsRequestReview')}</li>
                    <li>• {t('profile.smsProjectUpdate')}</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('profile.smsDisclaimer')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSmsSheet(false)}
              >
                {t('common.notNow')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleEnableSms}
                disabled={toggleSmsMutation.isPending}
              >
                {toggleSmsMutation.isPending ? t('common.enabling') : t('common.enable') + ' SMS'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Fasto Assistant */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Bot className="w-4 h-4" />
            <span>Fasto Assistant</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Enable Fasto</p>
              <p className="text-xs text-muted-foreground">
                Voice & AI assistant in the tab bar
              </p>
            </div>
            <Switch
              checked={fastoSettings.enabled}
              onCheckedChange={handleFastoToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>{t('profile.settings')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="ghost" className="w-full justify-start" disabled>
            <Palette className="w-4 h-4 mr-2" />
            {t('profile.theme')}
            <span className="ml-auto text-xs text-muted-foreground">{t('profile.comingSoon')}</span>
          </Button>
          
          <Sheet open={showLanguageSheet} onOpenChange={setShowLanguageSheet}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Globe className="w-4 h-4 mr-2" />
                {t('profile.language')}
                <span className="ml-auto text-xs text-muted-foreground">
                  {language === 'en' ? t('profile.english') : t('profile.spanish')}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>{t('profile.selectLanguage')}</SheetTitle>
              </SheetHeader>
              <div className="space-y-2 mt-4">
                <Button
                  variant={language === 'en' ? 'secondary' : 'ghost'}
                  className="w-full justify-between"
                  onClick={() => handleLanguageChange('en')}
                >
                  <span>{t('profile.english')}</span>
                  {language === 'en' && <Check className="w-4 h-4" />}
                </Button>
                <Button
                  variant={language === 'es' ? 'secondary' : 'ghost'}
                  className="w-full justify-between"
                  onClick={() => handleLanguageChange('es')}
                >
                  <span>{t('profile.spanish')}</span>
                  {language === 'es' && <Check className="w-4 h-4" />}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={handleSmsToggle}
            disabled={toggleSmsMutation.isPending}
          >
            <Bell className="w-4 h-4 mr-2" />
            {t('profile.smsNotifications')}
            <span className="ml-auto text-xs text-muted-foreground">
              {teamProfile?.sms_notifications_enabled ? t('profile.on') : t('profile.off')}
            </span>
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Info className="w-4 h-4" />
            <span>{t('profile.about')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('profile.appVersion')}</span>
            <span className="text-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('profile.build')}</span>
            <span className="text-foreground">PWA-001</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('profile.lastUpdated')}</span>
            <span className="text-foreground">{t('profile.today')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('profile.signOut')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};