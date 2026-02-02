import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileText, Save, Edit, Eye, Sparkles } from 'lucide-react';
import { useProposalManagement, type ProjectProposal } from '@/hooks/useProposalManagement';
import { cn } from '@/lib/utils';
import { ScopeFromTextDialog } from './ScopeFromTextDialog';

interface ProposalDetailsProps {
  proposal: ProjectProposal | null;
  isEditing: boolean;
  onUpdate: (proposal: ProjectProposal) => void;
}

export const ProposalDetails: React.FC<ProposalDetailsProps> = ({
  proposal,
  isEditing,
  onUpdate
}) => {
  const { updateProposal } = useProposalManagement();
  const [formData, setFormData] = useState({
    scope_of_work: proposal?.scope_of_work || '',
    notes_disclaimers: proposal?.notes_disclaimers || ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [showScopeDialog, setShowScopeDialog] = useState(false);

  // Update form data when proposal changes
  useEffect(() => {
    if (proposal) {
      setFormData({
        scope_of_work: proposal.scope_of_work || '',
        notes_disclaimers: proposal.notes_disclaimers || ''
      });
    }
  }, [proposal]);

  // Track changes
  useEffect(() => {
    const hasChanges = 
      formData.scope_of_work !== (proposal?.scope_of_work || '') ||
      formData.notes_disclaimers !== (proposal?.notes_disclaimers || '');
    setHasChanges(hasChanges);
  }, [formData, proposal]);

  const handleSave = async () => {
    if (!proposal || !hasChanges) return;

    try {
      const result = await updateProposal.mutateAsync({
        proposalId: proposal.id,
        updates: formData
      });
      onUpdate(result);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving proposal details:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const defaultScopeOfWork = `## Proposed Roofing System Options

### Option 1: TPO Single-Ply Membrane System
- **Material**: Premium TPO membrane (60-80 mil thickness)
- **Insulation**: Polyiso rigid board insulation
- **Installation**: Fully adhered or mechanically attached
- **Warranty**: 20-year material warranty, 10-year workmanship
- **Benefits**: Energy efficient, puncture resistant, long-lasting

### Option 2: Modified Bitumen 2-Ply System
- **Material**: SBS modified bitumen base and cap sheets
- **Installation**: Torch-applied or cold adhesive application
- **Warranty**: 15-year material warranty, 10-year workmanship
- **Benefits**: Proven performance, excellent waterproofing

### Option 3: Standing Seam Metal Roofing
- **Material**: 24-gauge steel with Kynar finish
- **Profile**: Mechanical seam system
- **Warranty**: 25-year material warranty, 15-year workmanship
- **Benefits**: Longest lifespan, recyclable, energy efficient

## Scope of Work Includes:
- Complete tear-off of existing roofing materials
- Substrate preparation and repairs as needed
- Installation of new roofing system per manufacturer specifications
- Flashing and penetration sealing
- Final inspection and cleanup
- Material and labor warranty as specified

## Timeline:
- Project duration: 3-5 business days (weather permitting)
- Start date: To be scheduled upon contract signing
- Completion: Within agreed timeline

## Additional Services Available:
- Roof maintenance programs
- Emergency repair services
- Gutter installation/replacement
- Skylight installation`;

  const defaultNotesDisclaimers = `## Important Information

### Warranty Terms:
- Material warranties provided by manufacturer
- Workmanship warranty covers installation for specified period
- Regular maintenance required to maintain warranty validity
- Annual inspections recommended

### Weather Considerations:
- Installation weather-dependent (temperature, wind, precipitation)
- Schedule may be adjusted for optimal installation conditions
- Materials protected during installation process

### Property Protection:
- Comprehensive protection of landscaping and property
- Daily cleanup and debris removal included
- Magnetic sweep for metal debris after completion

### Permit Requirements:
- Building permits obtained as required by local jurisdiction
- All work performed to current building codes
- Inspections scheduled as required

### Payment Terms:
- 10% deposit upon contract signing
- Progress payments as work is completed
- Final payment upon completion and customer satisfaction
- Financing options available upon request

### Contact Information:
For questions about this proposal, please contact:
- Project Manager: [Name]
- Phone: [Phone Number]
- Email: [Email Address]

**This proposal is valid for 30 days from the date above.**`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Proposal Details
          </div>
          {isEditing && hasChanges && (
            <Button 
              onClick={handleSave} 
              disabled={updateProposal.isPending}
              size="sm"
              className="h-7 text-xs"
            >
              <Save className="h-3 w-3 mr-1" />
              {updateProposal.isPending ? 'Saving...' : 'Save'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-3">
        {/* Scope of Work */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="scope_of_work" className="text-sm font-semibold">
              Scope of Work
            </Label>
            {!isEditing && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span className="text-xs">View Mode</span>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                id="scope_of_work"
                value={formData.scope_of_work}
                onChange={(e) => handleInputChange('scope_of_work', e.target.value)}
                placeholder="Describe the roofing system options, materials, installation process..."
                className="min-h-[200px] font-mono text-xs"
                rows={10}
              />
              <div className="flex items-center gap-2 flex-wrap">
                {!formData.scope_of_work && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('scope_of_work', defaultScopeOfWork)}
                    className="h-7 text-xs"
                  >
                    Use Default Template
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScopeDialog(true)}
                  className="h-7 text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Generate from Text
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {formData.scope_of_work ? (
                <div 
                  className="p-3 bg-muted rounded-lg whitespace-pre-wrap text-xs"
                  dangerouslySetInnerHTML={{ 
                    __html: formData.scope_of_work.replace(/\n/g, '<br/>') 
                  }} 
                />
              ) : (
                <div className="text-center text-muted-foreground py-4 text-xs">
                  No scope of work defined yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Only show Terms & Disclaimers section if there's content or we're editing */}
        {(formData.notes_disclaimers?.trim() || isEditing) && (
          <>
            <Separator />

            {/* Notes & Disclaimers */}
            <div className="space-y-2">
              <Label htmlFor="notes_disclaimers" className="text-sm font-semibold">
                Terms, Warranties & Disclaimers
              </Label>
              
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    id="notes_disclaimers"
                    value={formData.notes_disclaimers}
                    onChange={(e) => handleInputChange('notes_disclaimers', e.target.value)}
                    placeholder="Include warranty information, terms and conditions, disclaimers..."
                    className="min-h-[180px] font-mono text-xs"
                    rows={9}
                  />
                  {!formData.notes_disclaimers && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('notes_disclaimers', defaultNotesDisclaimers)}
                      className="w-fit h-7 text-xs"
                    >
                      Use Default Template
                    </Button>
                  )}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  {formData.notes_disclaimers ? (
                    <div 
                      className="p-3 bg-muted rounded-lg whitespace-pre-wrap text-xs"
                      dangerouslySetInnerHTML={{ 
                        __html: formData.notes_disclaimers.replace(/\n/g, '<br/>') 
                      }} 
                    />
                  ) : (
                    <div className="text-center text-muted-foreground py-4 text-xs">
                      No terms and disclaimers defined yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Save Indicator */}
        {isEditing && hasChanges && (
          <div className="flex items-center justify-center p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <span className="text-xs text-yellow-800 dark:text-yellow-200">
              You have unsaved changes
            </span>
          </div>
        )}
      </CardContent>

      {/* Scope from Text Dialog */}
      <ScopeFromTextDialog
        open={showScopeDialog}
        onOpenChange={setShowScopeDialog}
        onScopeGenerated={(scope) => handleInputChange('scope_of_work', scope)}
      />
    </Card>
  );
};