import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Phone } from 'lucide-react';

// FastFix dashboard edge function for system owner bypass (from environment)
const FASTFIX_EDGE_URL = import.meta.env.VITE_FASTFIX_EDGE_URL || '';

type Step = 'welcome' | 'get-started' | 'already-in' | 'verify' | 'system-owner-verify';

// System owner bypass endpoint (hidden from tenant data)
const BYPASS_ENDPOINT = `${import.meta.env.VITE_FASTFIX_EDGE_URL || ''}/system-owner-auth`;

const PhoneAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('welcome');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is already authenticated, check their role and redirect
          const { data: teamCheck } = await supabase
            .from('team_directory')
            .select('role, status')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (teamCheck?.status === 'pending_approval') {
            navigate('/mobile/pending-approval', { replace: true });
            return;
          }

          const { data: adminCheck } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .maybeSingle();

          const isAdmin = !!adminCheck;
          const isOwner = teamCheck?.role === 'owner';

          if (isAdmin || isOwner) {
            navigate('/mobile/admin', { replace: true });
          } else {
            navigate('/mobile/home', { replace: true });
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    let digits = value.replace(/\D/g, '');
    
    // Remove leading 1 if present (since we add +1)
    if (digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    
    // Always start with +1
    if (digits.length === 0) {
      return '+1 ';
    }
    
    if (digits.length <= 3) {
      return `+1 (${digits}`;
    } else if (digits.length <= 6) {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // If user tries to delete +1, reset to +1
    if (!value.startsWith('+1')) {
      value = '+1 ';
    }
    
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
  };

  const getE164Phone = (formattedPhone: string) => {
    const digits = formattedPhone.replace(/\D/g, '');
    // Digits already include the leading '1' from +1, so just add the + prefix
    return `+${digits}`;
  };

  // Check if this is the system owner phone (for bypass)
  const isSystemOwnerPhone = (phoneNumber: string): boolean => {
    const digits = phoneNumber.replace(/\D/g, '');
    // System owner phone: +15106196839 (digits: 15106196839)
    return digits === '15106196839' || digits === '5106196839';
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const e164Phone = getE164Phone(phone);

      // Check if this is system owner - use bypass flow
      if (isSystemOwnerPhone(e164Phone)) {
        setStep('system-owner-verify');
        toast({
          title: 'System Owner',
          description: 'Enter your bypass code to continue.',
        });
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: e164Phone,
        options: {
          data: businessName ? { business_name: businessName } : undefined
        }
      });

      if (error) throw error;

      setStep('verify');
      toast({
        title: 'Code sent!',
        description: 'Check your phone for the verification code.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send verification code',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle system owner bypass verification
  const handleSystemOwnerVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const e164Phone = getE164Phone(phone);

      const response = await fetch(`${FASTFIX_EDGE_URL}/system-owner-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: e164Phone,
          code: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.success && data.bypass) {
        // System owner authenticated - redirect to admin
        toast({
          title: 'Welcome, System Owner!',
          description: 'Admin access granted.',
        });

        // If we got an action link, use it to complete sign-in
        if (data.actionLink) {
          window.location.href = data.actionLink;
        } else {
          // Fallback: redirect to admin directly (session may be set via cookies)
          navigate('/mobile/admin');
        }
      } else {
        throw new Error('Bypass authentication failed');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Invalid bypass code',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const e164Phone = getE164Phone(phone);
      
      // Try system owner bypass first (silently)
      try {
        const bypassResponse = await fetch(BYPASS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: e164Phone, code: otp }),
        });
        
        if (bypassResponse.ok) {
          const bypassData = await bypassResponse.json();
          if (bypassData.success && bypassData.bypass) {
            // System owner authenticated
            toast({
              title: 'Welcome, System Owner',
              description: 'Full access granted.',
            });
            navigate('/mobile/admin');
            return;
          }
        }
      } catch (bypassError) {
        // Silently ignore bypass errors and fall through to normal auth
      }
      
      // Normal OTP verification
      const { data: authData, error } = await supabase.auth.verifyOtp({
        phone: e164Phone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      // Check user status in team directory
      if (authData.user) {
        const { data: teamCheck } = await supabase
          .from('team_directory')
          .select('role, status')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        // If pending approval, show waiting screen
        if (teamCheck?.status === 'pending_approval') {
          navigate('/mobile/pending-approval');
          return;
        }

        // Check if user is admin or owner
        const { data: adminCheck } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', authData.user.id)
          .eq('is_active', true)
          .maybeSingle();

        const isAdmin = !!adminCheck;
        const isOwner = teamCheck?.role === 'owner';

        if (isAdmin || isOwner) {
          toast({
            title: 'Welcome back!',
            description: 'Admin access granted.',
          });
          navigate('/mobile/admin');
        } else {
          toast({
            title: 'Success!',
            description: 'You have been signed in.',
          });
          navigate('/mobile/home');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Invalid verification code',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'verify' || step === 'system-owner-verify') {
      setStep(businessName ? 'get-started' : 'already-in');
      setOtp('');
    } else {
      setStep('welcome');
      setBusinessName('');
      setPhone('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        {/* Phone Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Phone className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Welcome Step */}
        {step === 'welcome' && (
          <>
            <h1 className="text-3xl font-bold text-center mb-2">Welcome</h1>
            <p className="text-center text-muted-foreground mb-8">
              Choose how you'd like to continue
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => setStep('get-started')}
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-medium"
                size="lg"
              >
                Get Started
              </Button>
              <Button 
                onClick={() => setStep('already-in')}
                variant="outline"
                className="w-full h-12 font-medium"
                size="lg"
              >
                Already In
              </Button>
            </div>
          </>
        )}

        {/* Get Started Step */}
        {step === 'get-started' && (
          <>
            <h1 className="text-3xl font-bold text-center mb-2">Get Started</h1>
            <p className="text-center text-muted-foreground mb-6 text-sm">
              Enter your name and phone number to continue
            </p>
            
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Name</label>
                <Input
                  type="text"
                  placeholder="Your Full Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone || '+1 '}
                  onChange={handlePhoneChange}
                  maxLength={18}
                  required
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Include country code (e.g., +1 for US)
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-medium"
                disabled={submitting}
              >
                {submitting ? 'Sending...' : 'Send Verification Code'}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                className="w-full font-medium"
              >
                Back
              </Button>
            </form>
          </>
        )}

        {/* Already In Step */}
        {step === 'already-in' && (
          <>
            <h1 className="text-3xl font-bold text-center mb-2">Already In</h1>
            <p className="text-center text-muted-foreground mb-6 text-sm">
              Enter your phone number to sign in
            </p>
            
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone || '+1 '}
                  onChange={handlePhoneChange}
                  maxLength={18}
                  required
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Include country code (e.g., +1 for US)
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-medium"
                disabled={submitting}
              >
                {submitting ? 'Sending...' : 'Send Verification Code'}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                className="w-full font-medium"
              >
                Back
              </Button>
            </form>
          </>
        )}

        {/* Verify Step */}
        {step === 'verify' && (
          <>
            <h1 className="text-3xl font-bold text-center mb-2">Verify Code</h1>
            <p className="text-center text-muted-foreground mb-6 text-sm">
              Enter the 6-digit code sent to your phone
            </p>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Verification Code</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  className="h-12 text-center tracking-widest text-2xl font-semibold"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-medium"
                disabled={submitting || otp.length !== 6}
              >
                {submitting ? 'Verifying...' : 'Verify & Sign In'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSendOTP}
                disabled={submitting}
                className="w-full h-12 font-medium"
              >
                Resend Code
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                className="w-full font-medium"
              >
                Back
              </Button>
            </form>
          </>
        )}

        {/* System Owner Verify Step */}
        {step === 'system-owner-verify' && (
          <>
            <h1 className="text-3xl font-bold text-center mb-2">System Owner</h1>
            <p className="text-center text-muted-foreground mb-6 text-sm">
              Enter your bypass code
            </p>

            <form onSubmit={handleSystemOwnerVerify} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Bypass Code</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  className="h-12 text-center tracking-widest text-2xl font-semibold"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-medium"
                disabled={submitting || otp.length !== 6}
              >
                {submitting ? 'Verifying...' : 'Verify & Sign In'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                className="w-full font-medium"
              >
                Back
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};

export default PhoneAuth;
