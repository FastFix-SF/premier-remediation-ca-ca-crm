import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function SupabaseInviteAcceptance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [validationErrors, setValidationErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  // Get token from URL params
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    // Check if this is a valid invitation link
    if (!token || type !== 'invite') {
      toast({
        title: "Invalid Link",
        description: "This invitation link is invalid or malformed.",
        variant: "destructive",
      });
      navigate('/admin/login');
    }
  }, [token, type, navigate, toast]);

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

    // Validate form
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = formData.password !== formData.confirmPassword ? 'Passwords do not match' : '';
    
    if (passwordError || confirmPasswordError) {
      setValidationErrors({ password: passwordError, confirmPassword: confirmPasswordError });
      return;
    }

    setLoading(true);

    try {
      // Accept the Supabase invitation and set password
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token!,
        type: 'invite'
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Update the user's password after successful verification
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.password
        });

        if (passwordError) {
          throw passwordError;
        }
        // Get user metadata to check role
        const userRole = data.user.user_metadata?.role;
        const userEmail = data.user.email;
        
        if (userEmail) {
          // Update team_directory status to active
          const { error: updateError } = await supabase
            .from('team_directory')
            .update({
              user_id: data.user.id,
              status: 'active',
              last_login_at: new Date().toISOString(),
              invite_token: null,
              token_expires_at: null
            })
            .eq('email', userEmail)
            .eq('status', 'invited');

          if (updateError) {
            console.error('Error updating team directory:', updateError);
          }

          // Add user to admin_users table
          const { error: adminError } = await supabase
            .from('admin_users')
            .insert([{
              user_id: data.user.id,
              email: userEmail,
              is_active: true
            }]);

          if (adminError && !adminError.message.includes('duplicate')) {
            console.error('Error adding to admin_users:', adminError);
          }
        }

        toast({
          title: "Account Activated Successfully",
          description: "Your account has been set up. You can now access Roofing Friend Admin.",
        });

        // Redirect to admin dashboard
        navigate('/admin');
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Failed to Accept Invitation",
        description: error.message || "Failed to set up your account. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token || type !== 'invite') {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>Complete Your Invitation</CardTitle>
          <CardDescription>
            Set your password to activate your Roofing Friend Admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={loading || !!validationErrors.password || !!validationErrors.confirmPassword}
            >
              {loading ? "Activating Account..." : "Activate Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}