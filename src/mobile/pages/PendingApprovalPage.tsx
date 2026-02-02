import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const PendingApprovalPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
    navigate('/mobile/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Hang Tight!</h1>
        <p className="text-center text-muted-foreground mb-8">
          Our team will approve your request soon. You'll be able to access the app once approved.
        </p>

        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full h-12"
        >
          Sign Out
        </Button>
      </Card>
    </div>
  );
};
