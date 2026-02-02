
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';

const ProjectInvitation = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [isSignUp, setIsSignUp] = useState(true);
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const projectId = searchParams.get('project');
  const email = searchParams.get('email');

  useEffect(() => {
    if (user) {
      navigate('/customer-dashboard');
      return;
    }
    
    if (email) {
      setFormData(prev => ({ ...prev, email }));
    }
  }, [user, email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords don't match",
            variant: "destructive",
          });
          return;
        }
        
        result = await signUp(formData.email, formData.password, formData.displayName);
      } else {
        result = await signIn(formData.email, formData.password);
      }

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: isSignUp ? "Account created successfully!" : "Signed in successfully!",
        });
        
        // Redirect will happen automatically via the auth context
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md mx-auto mb-4">
            <div className="w-8 h-8 bg-white rounded-sm"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Roofing Friend</h1>
          <p className="text-muted-foreground">Project Portal Access</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <UserPlus className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle>
              {isSignUp ? 'Create Your Account' : 'Sign In'}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Create an account to access your project dashboard'
                : 'Sign in to view your project progress'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  disabled={!!email} // Disable if email came from URL
                />
              </div>

              {isSignUp && (
                <div>
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {isSignUp && (
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>© 2024 Roofing Friend. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectInvitation;
