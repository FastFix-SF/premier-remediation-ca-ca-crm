import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

type Step = 'welcome' | 'sign-up' | 'sign-in' | 'verify';

const StoreAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
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
          // Any logged-in user can use the store - redirect them
          navigate('/store', { replace: true });
          return;
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  const formatPhoneNumber = (value: string) => {
    let digits = value.replace(/\D/g, '');
    
    if (digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    
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
    
    if (!value.startsWith('+1')) {
      value = '+1 ';
    }
    
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
  };

  const getE164Phone = (formattedPhone: string) => {
    const digits = formattedPhone.replace(/\D/g, '');
    return `+${digits}`;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const e164Phone = getE164Phone(phone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: e164Phone,
        options: {
          data: name ? { display_name: name, account_type: 'store_customer' } : { account_type: 'store_customer' }
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const e164Phone = getE164Phone(phone);
      
      const { data: authData, error } = await supabase.auth.verifyOtp({
        phone: e164Phone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      if (authData.user) {
        toast({
          title: 'Welcome!',
          description: 'You are now signed in to the store.',
        });
        navigate('/store');
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
    if (step === 'verify') {
      setStep(name ? 'sign-up' : 'sign-in');
      setOtp('');
    } else {
      setStep('welcome');
      setName('');
      setPhone('');
    }
  };

  const handleBackToStore = () => {
    navigate('/store');
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
        {/* Back to Store Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToStore}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Store
        </Button>

        {/* Store Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <ShoppingBag className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Welcome Step */}
        {step === 'welcome' && (
          <>
            <h1 className="text-3xl font-bold text-center mb-2">Store Account</h1>
            <p className="text-center text-muted-foreground mb-8">
              Sign in or create an account to place orders
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => setStep('sign-up')}
                className="w-full h-12 font-medium"
                size="lg"
              >
                Create Account
              </Button>
              <Button 
                onClick={() => setStep('sign-in')}
                variant="outline"
                className="w-full h-12 font-medium"
                size="lg"
              >
                Sign In
              </Button>
            </div>
          </>
        )}

        {/* Sign Up Step */}
        {step === 'sign-up' && (
          <>
            <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
            <p className="text-center text-muted-foreground mb-6 text-sm">
              Enter your details to create a store account
            </p>
            
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Name</label>
                <Input
                  type="text"
                  placeholder="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  We'll send you a verification code
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 font-medium"
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

        {/* Sign In Step */}
        {step === 'sign-in' && (
          <>
            <h1 className="text-3xl font-bold text-center mb-2">Sign In</h1>
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
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 font-medium"
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
                className="w-full h-12 font-medium" 
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
      </Card>
    </div>
  );
};

export default StoreAuth;
