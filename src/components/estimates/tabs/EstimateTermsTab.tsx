import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Estimate, useUpdateEstimate } from '@/hooks/useEstimates';

interface EstimateTermsTabProps {
  estimate: Estimate;
}

export function EstimateTermsTab({ estimate }: EstimateTermsTabProps) {
  const [terms, setTerms] = useState(estimate.terms_content || '');
  const [inclusions, setInclusions] = useState(estimate.inclusions_content || '');
  const [exclusions, setExclusions] = useState(estimate.exclusions_content || '');
  const [hasChanges, setHasChanges] = useState(false);

  const updateEstimate = useUpdateEstimate();

  useEffect(() => {
    const changed = 
      terms !== (estimate.terms_content || '') ||
      inclusions !== (estimate.inclusions_content || '') ||
      exclusions !== (estimate.exclusions_content || '');
    setHasChanges(changed);
  }, [terms, inclusions, exclusions, estimate]);

  const handleSave = async () => {
    await updateEstimate.mutateAsync({
      id: estimate.id,
      terms_content: terms,
      inclusions_content: inclusions,
      exclusions_content: exclusions,
    });
    setHasChanges(false);
  };

  const wordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const charCount = (text: string) => {
    return text.length;
  };

  return (
    <div className="space-y-6">
      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || updateEstimate.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {updateEstimate.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Enter payment terms, conditions, and other contractual terms..."
            className="min-h-[200px]"
          />
          <div className="flex justify-end gap-4 mt-2 text-xs text-muted-foreground">
            <span>{wordCount(terms)} words</span>
            <span>{charCount(terms)} characters</span>
          </div>
        </CardContent>
      </Card>

      {/* Inclusions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inclusions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={inclusions}
            onChange={(e) => setInclusions(e.target.value)}
            placeholder="List all items and services included in this estimate...

Example:
- Complete tear-off of existing roofing
- Installation of new underlayment
- Installation of new shingles
- All necessary flashing and trim work
- Cleanup and debris removal"
            className="min-h-[200px]"
          />
          <div className="flex justify-end gap-4 mt-2 text-xs text-muted-foreground">
            <span>{wordCount(inclusions)} words</span>
            <span>{charCount(inclusions)} characters</span>
          </div>
        </CardContent>
      </Card>

      {/* Exclusions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exclusions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={exclusions}
            onChange={(e) => setExclusions(e.target.value)}
            placeholder="List all items and services NOT included in this estimate...

Example:
- Permits and inspections (if required)
- Wood rot repairs beyond visible damage
- Gutter installation or repair
- Skylight replacement
- Solar panel removal/reinstallation"
            className="min-h-[200px]"
          />
          <div className="flex justify-end gap-4 mt-2 text-xs text-muted-foreground">
            <span>{wordCount(exclusions)} words</span>
            <span>{charCount(exclusions)} characters</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
