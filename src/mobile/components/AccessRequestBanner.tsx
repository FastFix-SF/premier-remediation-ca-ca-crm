import React from 'react';
import { AlertCircle, Clock, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useProjectAccessRequest } from '@/mobile/hooks/useProjectAccessRequest';

interface AccessRequestBannerProps {
  projectId: string;
  projectName?: string;
}

export const AccessRequestBanner: React.FC<AccessRequestBannerProps> = ({ 
  projectId,
  projectName 
}) => {
  const { 
    hasAccess, 
    pendingRequest, 
    isLoading, 
    requestAccess, 
    isRequesting 
  } = useProjectAccessRequest(projectId);

  // Don't show anything if user has access
  if (isLoading) {
    return (
      <Alert className="border-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Checking access...</AlertTitle>
      </Alert>
    );
  }

  if (hasAccess) {
    return null;
  }

  // User has a pending request
  if (pendingRequest) {
    return (
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-700 dark:text-amber-400">
          Access Request Pending
        </AlertTitle>
        <AlertDescription className="text-amber-600 dark:text-amber-300">
          Your request to upload photos to this project has been sent. 
          A team member will grant you access soon.
        </AlertDescription>
      </Alert>
    );
  }

  // User needs to request access
  return (
    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/30">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-700 dark:text-blue-400">
        Access Required
      </AlertTitle>
      <AlertDescription className="text-blue-600 dark:text-blue-300">
        <p className="mb-3">
          You're not assigned to {projectName ? `"${projectName}"` : 'this project'}. 
          Request access to upload photos.
        </p>
        <Button 
          onClick={() => requestAccess()}
          disabled={isRequesting}
          size="sm"
          className="gap-2"
        >
          {isRequesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Requesting...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Request Access
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
};
