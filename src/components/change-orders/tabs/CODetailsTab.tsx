import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChangeOrder } from '@/hooks/useChangeOrders';
import { useProjectsWithPhotos } from '@/hooks/useProjectsWithPhotos';
import { Save, Loader2, FolderKanban } from 'lucide-react';

interface CODetailsTabProps {
  formData: Partial<ChangeOrder>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ChangeOrder>>>;
  onSave: () => void;
  isEditing: boolean;
  isSaving: boolean;
}

export function CODetailsTab({ formData, setFormData, onSave, isEditing, isSaving }: CODetailsTabProps) {
  const { allProjects: projects = [] } = useProjectsWithPhotos();

  const handleChange = (field: keyof ChangeOrder, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Details */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Details
            </h3>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Change order title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_id" className="flex items-center gap-1">
                <FolderKanban className="h-3 w-3" /> Project
              </Label>
              <Select
                value={formData.project_id || ''}
                onValueChange={(value) => handleChange('project_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requested_by">Requested By</Label>
              <Input
                id="requested_by"
                value={formData.requested_by || ''}
                onChange={(e) => handleChange('requested_by', e.target.value)}
                placeholder="Who requested this change?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_co_number">Customer CO Number</Label>
              <Input
                id="customer_co_number"
                value={formData.customer_co_number || ''}
                onChange={(e) => handleChange('customer_co_number', e.target.value)}
                placeholder="Customer's reference number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_delay">Time Delay</Label>
              <Input
                id="time_delay"
                value={formData.time_delay || ''}
                onChange={(e) => handleChange('time_delay', e.target.value)}
                placeholder="e.g., 3 days"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="associated_rfi">Associated RFI</Label>
              <Input
                id="associated_rfi"
                value={formData.associated_rfi || ''}
                onChange={(e) => handleChange('associated_rfi', e.target.value)}
                placeholder="RFI reference"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Description & Approval */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-500 rounded-full" />
                Description
              </h3>

              <Textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe the change order..."
                rows={4}
              />

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_no_cost"
                  checked={formData.is_no_cost || false}
                  onCheckedChange={(checked) => handleChange('is_no_cost', checked)}
                />
                <Label htmlFor="is_no_cost" className="text-sm">
                  No Cost Change Order
                </Label>
              </div>

              {!formData.is_no_cost && formData.grand_total !== undefined && formData.grand_total > 0 && (
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Total w/Tax: </span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(formData.grand_total)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span className="w-1 h-4 bg-amber-500 rounded-full" />
                Approval Details
              </h3>

              <div className="space-y-2">
                <Label htmlFor="approved_by">Approved By</Label>
                <Input
                  id="approved_by"
                  value={formData.approved_by || ''}
                  onChange={(e) => handleChange('approved_by', e.target.value)}
                  placeholder="Approver name"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isEditing ? 'Update' : 'Create'} Change Order
        </Button>
      </div>
    </div>
  );
}
