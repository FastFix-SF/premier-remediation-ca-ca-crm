import React, { useState, useEffect } from 'react';
import { Save, Upload, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Estimate, useCoverSheetTemplates, useUpdateEstimate } from '@/hooks/useEstimates';

interface EstimateCoverSheetTabProps {
  estimate: Estimate;
}

const MERGE_FIELDS = [
  { key: '[PROJECT_NAME]', description: 'Project title' },
  { key: '[CUSTOMER_FIRST]', description: 'Customer first name' },
  { key: '[CUSTOMER_LAST]', description: 'Customer last name' },
  { key: '[CUSTOMER_FULL]', description: 'Customer full name' },
  { key: '[ADDRESS]', description: 'Project address' },
  { key: '[CITY]', description: 'City' },
  { key: '[STATE]', description: 'State' },
  { key: '[ZIP]', description: 'ZIP code' },
  { key: '[ESTIMATE_NUMBER]', description: 'Estimate number' },
  { key: '[ESTIMATE_DATE]', description: 'Estimate date' },
  { key: '[EXPIRATION_DATE]', description: 'Expiration date' },
  { key: '[GRAND_TOTAL]', description: 'Grand total' },
];

export function EstimateCoverSheetTab({ estimate }: EstimateCoverSheetTabProps) {
  const [includeCoverSheet, setIncludeCoverSheet] = useState(estimate.include_cover_sheet || false);
  const [content, setContent] = useState(estimate.cover_sheet_content || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState(estimate.cover_sheet_template_id || '');
  const [hasChanges, setHasChanges] = useState(false);

  const { data: templates = [] } = useCoverSheetTemplates();
  const updateEstimate = useUpdateEstimate();

  useEffect(() => {
    const changed = 
      includeCoverSheet !== (estimate.include_cover_sheet || false) ||
      content !== (estimate.cover_sheet_content || '') ||
      selectedTemplateId !== (estimate.cover_sheet_template_id || '');
    setHasChanges(changed);
  }, [includeCoverSheet, content, selectedTemplateId, estimate]);

  const handleSave = async () => {
    await updateEstimate.mutateAsync({
      id: estimate.id,
      include_cover_sheet: includeCoverSheet,
      cover_sheet_content: content,
      cover_sheet_template_id: selectedTemplateId || null,
    });
    setHasChanges(false);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setContent(template.content);
    }
  };

  const insertMergeField = (field: string) => {
    setContent(prev => prev + field);
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

      {/* Toggle */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="include-cover">Include Cover Sheet?</Label>
              <p className="text-sm text-muted-foreground">
                Add a cover page to the generated estimate PDF
              </p>
            </div>
            <Switch
              id="include-cover"
              checked={includeCoverSheet}
              onCheckedChange={setIncludeCoverSheet}
            />
          </div>
        </CardContent>
      </Card>

      {includeCoverSheet && (
        <>
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                          {template.is_default && ' (Default)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Generate from Upload
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cover Sheet Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your cover sheet content...

Use merge fields like [CUSTOMER_FULL] to personalize the content."
                className="min-h-[300px] font-mono"
              />
              
              {/* Merge Fields */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Available Merge Fields</h4>
                <div className="flex flex-wrap gap-2">
                  {MERGE_FIELDS.map((field) => (
                    <Button
                      key={field.key}
                      variant="outline"
                      size="sm"
                      onClick={() => insertMergeField(field.key)}
                      title={field.description}
                    >
                      {field.key}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white border rounded-lg p-8 min-h-[400px] text-foreground">
                <div 
                  className="prose prose-sm max-w-none whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: content
                      .replace('[PROJECT_NAME]', estimate.title || 'Project')
                      .replace('[CUSTOMER_FIRST]', estimate.customer_name?.split(' ')[0] || 'Customer')
                      .replace('[CUSTOMER_LAST]', estimate.customer_name?.split(' ').slice(1).join(' ') || '')
                      .replace('[CUSTOMER_FULL]', estimate.customer_name || 'Customer')
                      .replace('[ADDRESS]', estimate.customer_address || 'Address')
                      .replace('[CITY]', estimate.city || 'City')
                      .replace('[STATE]', estimate.state || 'State')
                      .replace('[ZIP]', estimate.zip || 'ZIP')
                      .replace('[ESTIMATE_NUMBER]', estimate.estimate_number)
                      .replace('[ESTIMATE_DATE]', estimate.estimate_date)
                      .replace('[EXPIRATION_DATE]', estimate.expiration_date || 'N/A')
                      .replace('[GRAND_TOTAL]', `$${(estimate.grand_total || 0).toLocaleString()}`)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
