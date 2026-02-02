import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Save, X, User, Calendar, MapPin, DollarSign, Check } from 'lucide-react';
import { Estimate, PROJECT_TYPES, SECTORS, useUpdateEstimate } from '@/hooks/useEstimates';
import { format } from 'date-fns';

interface EstimateDetailsTabProps {
  estimate: Estimate;
}

export function EstimateDetailsTab({ estimate }: EstimateDetailsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: estimate.title || '',
    customer_name: estimate.customer_name || '',
    customer_email: estimate.customer_email || '',
    customer_phone: estimate.customer_phone || '',
    customer_address: estimate.customer_address || '',
    city: estimate.city || '',
    state: estimate.state || '',
    zip: estimate.zip || '',
    project_type: estimate.project_type || 'residential',
    sector: estimate.sector || 'new_construction',
    estimate_date: estimate.estimate_date,
    expiration_date: estimate.expiration_date || '',
    invoiced_to: estimate.invoiced_to || '',
  });

  const updateEstimate = useUpdateEstimate();

  const handleSave = async () => {
    await updateEstimate.mutateAsync({
      id: estimate.id,
      ...formData,
    });
    setIsEditing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateEstimate.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label>Customer Name</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{estimate.customer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{estimate.customer_email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{estimate.customer_phone || '-'}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Project Type</Label>
                    <Select
                      value={formData.project_type}
                      onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sector</Label>
                    <Select
                      value={formData.sector}
                      onValueChange={(value) => setFormData({ ...formData, sector: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTORS.map((sector) => (
                          <SelectItem key={sector.value} value={sector.value}>
                            {sector.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Estimate Date</Label>
                    <Input
                      type="date"
                      value={formData.estimate_date}
                      onChange={(e) => setFormData({ ...formData, estimate_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Expiration Date</Label>
                    <Input
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{estimate.title || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Project Type</p>
                    <p className="font-medium capitalize">{estimate.project_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sector</p>
                    <p className="font-medium capitalize">{estimate.sector?.replace('_', ' ') || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Estimate Date</p>
                    <p className="font-medium">
                      {format(new Date(estimate.estimate_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expires</p>
                    <p className="font-medium">
                      {estimate.expiration_date 
                        ? format(new Date(estimate.expiration_date), 'MMM d, yyyy')
                        : '-'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Project Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label>Street Address</Label>
                  <Input
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <Input
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{estimate.customer_address || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">City, State ZIP</p>
                  <p className="font-medium">
                    {[estimate.city, estimate.state, estimate.zip].filter(Boolean).join(', ') || '-'}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Financials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="font-medium">{formatCurrency(estimate.subtotal || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profit Margin ({estimate.profit_margin_pct || 0}%)</p>
                <p className="font-medium">{formatCurrency(estimate.profit_margin_amount || 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tax ({estimate.tax_pct || 0}%)</p>
                <p className="font-medium">{formatCurrency(estimate.tax_amount || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grand Total</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(estimate.grand_total || 0)}
                </p>
              </div>
            </div>
            {isEditing ? (
              <div>
                <Label>Invoiced To</Label>
                <Input
                  value={formData.invoiced_to}
                  onChange={(e) => setFormData({ ...formData, invoiced_to: e.target.value })}
                  placeholder="Enter invoice recipient"
                />
              </div>
            ) : estimate.invoiced_to && (
              <div>
                <p className="text-sm text-muted-foreground">Invoiced To</p>
                <p className="font-medium">{estimate.invoiced_to}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
