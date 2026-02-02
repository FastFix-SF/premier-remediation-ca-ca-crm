import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InviteNoToken() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle>No Invitation Token</CardTitle>
          <CardDescription>
            You need a valid invitation link to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Please check your email for an invitation link, or contact your administrator to request access.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/admin/login')} 
              className="w-full"
            >
              Back to Login
            </Button>
            
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              className="w-full"
            >
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}