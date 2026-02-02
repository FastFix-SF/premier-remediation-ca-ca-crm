import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { useVendors } from '@/hooks/useDirectoryContacts';
import { useTeamMember } from '@/hooks/useTeamMember';
import { useProjectsWithPhotos } from '@/hooks/useProjectsWithPhotos';
import { Building2, Calendar, DollarSign, User, FileText, Truck, MapPin, FolderKanban } from 'lucide-react';

interface PODetailsTabProps {
  po: PurchaseOrder;
  onChange: (field: keyof PurchaseOrder, value: any) => void;
}

export const PODetailsTab = ({ po, onChange }: PODetailsTabProps) => {
  const { data: vendors = [] } = useVendors();
  const { teamMembers } = useTeamMember();
  const { allProjects: projects = [] } = useProjectsWithPhotos();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column - Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
          <FileText className="h-4 w-4" />
          Details
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input
              value={po.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="Enter title"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <FolderKanban className="h-3 w-3" /> Project
            </Label>
            <Select
              value={po.project_id || ''}
              onValueChange={(value) => onChange('project_id', value)}
            >
              <SelectTrigger className="mt-1">
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

          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Supplier
            </Label>
            <Select
              value={po.supplier || ''}
              onValueChange={(value) => onChange('supplier', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.company || vendor.contact_name || vendor.id}>
                    {vendor.company || vendor.contact_name || 'Unnamed Vendor'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" /> From Employee
            </Label>
            <Select
              value={po.from_employee || ''}
              onValueChange={(value) => onChange('from_employee', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.user_id} value={member.full_name || member.email}>
                    {member.full_name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Order Date
              </Label>
              <Input
                type="date"
                value={po.order_date || ''}
                onChange={(e) => onChange('order_date', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Delivery Date</Label>
              <Input
                type="date"
                value={po.delivery_date || ''}
                onChange={(e) => onChange('delivery_date', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Payment Terms</Label>
            <Input
              value={po.payment_terms || ''}
              onChange={(e) => onChange('payment_terms', e.target.value)}
              placeholder="e.g., Net 30"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Reference #</Label>
            <Input
              value={po.reference_number || ''}
              onChange={(e) => onChange('reference_number', e.target.value)}
              placeholder="Reference number"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={po.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Description"
              className="mt-1 min-h-[80px]"
            />
          </div>
        </div>
      </div>

      {/* Right Column - Shipping & Financials */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
            <Truck className="h-4 w-4" />
            Shipping
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Ship To
              </Label>
              <Input
                value={po.ship_to || ''}
                onChange={(e) => onChange('ship_to', e.target.value)}
                placeholder="Shipping address"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Shipped Via</Label>
              <Input
                value={po.shipped_via || ''}
                onChange={(e) => onChange('shipped_via', e.target.value)}
                placeholder="Carrier/method"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">FOB Point</Label>
              <Input
                value={po.fob_point || ''}
                onChange={(e) => onChange('fob_point', e.target.value)}
                placeholder="FOB point"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
            <DollarSign className="h-4 w-4" />
            Financials
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Total Amount</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={po.total_amount || ''}
                  onChange={(e) => onChange('total_amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Tax Amount</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={po.tax_amount || ''}
                  onChange={(e) => onChange('tax_amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Label className="text-sm">Billable</Label>
              <Switch
                checked={po.is_billable || false}
                onCheckedChange={(checked) => onChange('is_billable', checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
