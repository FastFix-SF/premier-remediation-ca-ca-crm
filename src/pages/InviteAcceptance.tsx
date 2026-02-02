import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InviteData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  invited_by: string;
  expires_at: string;
  status: string;
}

export default function InviteAcceptance() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Debug: Log component mount and token
  console.log('[INVITE DEBUG] InviteAcceptance component mounted');
  console.log('[INVITE DEBUG] Token from useParams:', token);
  console.log('[INVITE DEBUG] Current URL:', window.location.href);
  
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const [validationErrors, setValidationErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    validateInviteToken();
  }, [token]);

  const validateInviteToken = async () => {
    console.log('[INVITE DEBUG] Token from URL params:', token);
    
    if (!token || token === 'new') {
      console.log('[INVITE DEBUG] No token or token is "new", skipping validation');
      setLoading(false);
      return;
    }

    try {
      console.log('[INVITE DEBUG] Validating invitation token:', token);

      // Use the secure validation function that sets session variables for RLS
      const { data, error } = await supabase.rpc('validate_invitation_token', {
        token_value: token
      });

      console.log('[INVITE DEBUG] Validation result - data:', data, 'error:', error);

      if (error) {
        console.error('[INVITE DEBUG] Error from validation function:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('[INVITE DEBUG] No valid invitation found for token');
        toast({
          title: "Invalid Invite",
          description: "This invite link is invalid, expired, or has been used already.",
          variant: "destructive",
        });
        navigate('/admin/login');
        return;
      }

      const inviteRecord = data[0];
      console.log('[INVITE DEBUG] Setting invite data:', inviteRecord);
      
      setInviteData({
        id: inviteRecord.user_id,
        email: inviteRecord.email,
        full_name: inviteRecord.full_name || '',
        role: inviteRecord.role,
        invited_by: inviteRecord.invited_by || '',
        expires_at: inviteRecord.token_expires_at || '',
        status: inviteRecord.status
      });
    } catch (error) {
      console.error('Error validating invite:', error);
      toast({
        title: "Error",
        description: "Failed to validate invite. Please try again.",
        variant: "destructive",
      });
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (password.length < minLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpper || !hasLower) {
      return 'Password must contain both uppercase and lowercase letters';
    }
    if (!hasNumber) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors as user types
    if (field === 'password') {
      const error = validatePassword(value);
      setValidationErrors(prev => ({ ...prev, password: error }));
    }
    
    if (field === 'confirmPassword') {
      const error = value !== formData.password ? 'Passwords do not match' : '';
      setValidationErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData) return;

    // Validate form
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = formData.password !== formData.confirmPassword ? 'Passwords do not match' : '';
    
    if (passwordError || confirmPasswordError) {
      setValidationErrors({ password: passwordError, confirmPassword: confirmPasswordError });
      return;
    }

    setIsCreating(true);

    try {
      // Call the edge function to handle invitation acceptance securely
      const { data, error } = await supabase.functions.invoke('accept-team-invitation', {
        body: {
          token: token,
          password: formData.password,
          phone: formData.phone
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        if (data.error.includes('already registered') || data.error.includes('User already registered')) {
          toast({
            title: "Account Exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
          navigate('/admin/login');
          return;
        }
        throw new Error(data.error);
      }

      // Account created successfully, now sign in the user automatically
      console.log('Account created successfully, signing in user...');
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: inviteData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error('Failed to sign in after account creation:', signInError);
        toast({
          title: "Account Created Successfully",
          description: "Your account has been activated. Please sign in to continue.",
        });
        navigate('/admin/login');
      } else {
        toast({
          title: "Welcome to Roofing Friend!",
          description: "Your account has been activated. Redirecting to dashboard...",
        });
        
        // Redirect to admin dashboard
        setTimeout(() => {
          navigate('/admin');
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast({
        title: "Account Creation Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating invite...</p>
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/admin/login')} 
              className="w-full"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>Join Roofing Friend Admin</CardTitle>
          <CardDescription>
            You've been invited to join as a <strong>{inviteData.role}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={inviteData.full_name}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={inviteData.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a secure password"
                  className={validationErrors.password ? 'border-destructive' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-destructive">{validationErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className={validationErrors.confirmPassword ? 'border-destructive' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>
              )}
            </div>

            <Alert>
              <AlertDescription>
                Password must be at least 8 characters with uppercase, lowercase, and numbers.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full"
              disabled={isCreating || !!validationErrors.password || !!validationErrors.confirmPassword}
            >
              {isCreating ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}