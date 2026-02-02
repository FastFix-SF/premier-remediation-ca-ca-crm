import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingBag, UserPlus, LogIn, CheckCircle } from 'lucide-react';

interface AuthPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  open,
  onOpenChange,
  title = 'Sign in to place orders',
  description = 'Create an account or sign in to add items to your cart and complete purchases.',
}) => {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    onOpenChange(false);
    navigate('/store/auth');
  };

  const handleSignIn = () => {
    onOpenChange(false);
    navigate('/store/auth');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Benefits */}
        <div className="space-y-3 py-4 border-y border-border">
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
            <span className="text-foreground">Quick 30-second phone verification</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
            <span className="text-foreground">No contractor license required</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
            <span className="text-foreground">Track your orders anytime</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleCreateAccount}
            className="w-full h-12 font-semibold"
            size="lg"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Create Account
          </Button>
          <Button
            onClick={handleSignIn}
            variant="outline"
            className="w-full h-12 font-semibold"
            size="lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign In
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground pt-2">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthPromptModal;
