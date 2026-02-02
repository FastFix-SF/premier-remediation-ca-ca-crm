import React, { useState } from 'react';
import { ArrowLeft, Building2, ExternalLink, RefreshCw, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermit } from '@/hooks/usePermits';
import { PermitDetailsTab } from './tabs/PermitDetailsTab';
import { PermitFilesTab } from './tabs/PermitFilesTab';
import { PermitNotesTab } from './tabs/PermitNotesTab';
import { format } from 'date-fns';

interface PermitDetailViewProps {
  permitId: string;
  onBack: () => void;
}

export const PermitDetailView: React.FC<PermitDetailViewProps> = ({
  permitId,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const { data: permit, isLoading, refetch } = usePermit(permitId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading permit details...</div>
      </div>
    );
  }

  if (!permit) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Permit not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Permit Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold capitalize">{permit.permit_type}</h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{permit.project_address || permit.project_name || 'No address'}</span>
                  <ExternalLink className="h-4 w-4" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Pmt. #{permit.permit_number}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-48 space-y-1">
          <Button
            variant={activeTab === 'details' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('details')}
          >
            Details
          </Button>
          <Button
            variant={activeTab === 'files' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('files')}
          >
            Files
          </Button>
          <Button
            variant={activeTab === 'notes' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('notes')}
          >
            Notes
          </Button>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'details' && <PermitDetailsTab permit={permit} />}
          {activeTab === 'files' && <PermitFilesTab permitId={permit.id} />}
          {activeTab === 'notes' && <PermitNotesTab permitId={permit.id} />}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-4">
          <span>Created: {format(new Date(permit.created_at), 'MM/dd/yyyy')}</span>
          <span>@ {format(new Date(permit.created_at), 'h:mm a')}</span>
        </div>
      </div>
    </div>
  );
};
