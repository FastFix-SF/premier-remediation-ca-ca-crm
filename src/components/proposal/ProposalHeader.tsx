import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Building, User, Phone, Mail } from 'lucide-react';
import { useProposalManagement, type ProjectProposal } from '@/hooks/useProposalManagement';
import { StableGrid } from '@/components/ui/stable-grid';
import { cn } from '@/lib/utils';

interface ProposalHeaderProps {
  proposal: ProjectProposal | null;
  isEditing: boolean;
  isNewProposal: boolean;
  onProposalUpdate: (proposal: ProjectProposal) => void;
  onStatusChange: (status: string) => void;
}

export const ProposalHeader: React.FC<ProposalHeaderProps> = ({
  proposal,
  isEditing,
  isNewProposal,
  onProposalUpdate,
  onStatusChange
}) => {
  const { createProposal, updateProposal } = useProposalManagement();
  const [formData, setFormData] = useState({
    property_address: proposal?.property_address || '',
    project_type: proposal?.project_type || 'residential',
    client_name: proposal?.client_name || '',
    client_email: proposal?.client_email || '',
    client_phone: proposal?.client_phone || '',
    expires_at: proposal?.expires_at ? new Date(proposal.expires_at) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  const handleSave = async () => {
    try {
      if (isNewProposal) {
        const result = await createProposal.mutateAsync({
          ...formData,
          expires_at: formData.expires_at.toISOString()
        });
        onProposalUpdate(result);
      } else if (proposal) {
        const result = await updateProposal.mutateAsync({
          proposalId: proposal.id,
          updates: {
            ...formData,
            expires_at: formData.expires_at.toISOString()
          }
        });
        onProposalUpdate(result);
      }
    } catch (error) {
      console.error('Error saving proposal:', error);
    }
  };

  const handleInputChange = (field: string, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isEditing && !proposal) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No proposal data available. Switch to edit mode to create a new proposal.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Project Information</span>
          {isEditing && (
            <Button onClick={handleSave} disabled={createProposal.isPending || updateProposal.isPending}>
              {createProposal.isPending || updateProposal.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Row 1: Property Address & Project Type */}
        <StableGrid 
          columns={{ default: 1, lg: 2 }}
          gap="md"
          className="layout-lock"
        >
          <div className="space-y-1">
            <Label htmlFor="property_address" className="text-xs">Property Address</Label>
            {isEditing ? (
              <Input
                id="property_address"
                value={formData.property_address}
                onChange={(e) => handleInputChange('property_address', e.target.value)}
                placeholder="123 Main Street, City, State ZIP"
                className="w-full h-8 text-xs"
              />
            ) : (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs">
                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{proposal?.property_address}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="project_type" className="text-xs">Project Type</Label>
            {isEditing ? (
              <Select value={formData.project_type} onValueChange={(value) => handleInputChange('project_type', value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="multi-family">Multi-Family</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs">
                <Building className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="capitalize">{proposal?.project_type}</span>
              </div>
            )}
          </div>
        </StableGrid>

        {/* Row 2: Client Name & Client Email */}
        <StableGrid 
          columns={{ default: 1, lg: 2 }}
          gap="md"
          className="layout-lock"
        >
          <div className="space-y-1">
            <Label htmlFor="client_name" className="text-xs">Client Name</Label>
            {isEditing ? (
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => handleInputChange('client_name', e.target.value)}
                placeholder="John Doe"
                className="h-8 text-xs"
              />
            ) : (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs">
                <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{proposal?.client_name}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="client_email" className="text-xs">Client Email</Label>
            {isEditing ? (
              <Input
                id="client_email"
                type="email"
                value={formData.client_email}
                onChange={(e) => handleInputChange('client_email', e.target.value)}
                placeholder="john@example.com"
                className="h-8 text-xs"
              />
            ) : (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs">
                <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{proposal?.client_email}</span>
              </div>
            )}
          </div>
        </StableGrid>

        {/* Row 3: Client Phone & Expires On */}
        <StableGrid 
          columns={{ default: 1, lg: 2 }}
          gap="md"
          className="layout-lock"
        >
          <div className="space-y-1">
            <Label htmlFor="client_phone" className="text-xs">Client Phone</Label>
            {isEditing ? (
              <Input
                id="client_phone"
                type="tel"
                value={formData.client_phone}
                onChange={(e) => handleInputChange('client_phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="h-8 text-xs"
              />
            ) : (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs">
                <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span>{proposal?.client_phone || 'Not provided'}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Expires On</Label>
            {isEditing ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-8 text-xs",
                      !formData.expires_at && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {formData.expires_at ? format(formData.expires_at, "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={formData.expires_at}
                    onSelect={(date) => date && handleInputChange('expires_at', date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-xs">
                <CalendarIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span>
                  {proposal?.expires_at ? format(new Date(proposal.expires_at), "PP") : 'Not set'}
                </span>
              </div>
            )}
          </div>
        </StableGrid>

        {/* Proposal Number and Status */}
        {proposal && (
          <div className="border-t pt-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-xs">Proposal Number</Label>
                  <div className="text-sm font-mono font-semibold">{proposal.proposal_number}</div>
                </div>
                
                {!isEditing && (
                  <div>
                    <Label className="text-xs">Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="capitalize text-xs h-5">
                        {proposal.status}
                      </Badge>
                      {proposal.status === 'draft' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onStatusChange('sent')}
                          className="h-6 text-xs"
                        >
                          Send to Client
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};