import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Permit, useUpdatePermit } from '@/hooks/usePermits';
import { format } from 'date-fns';

interface PermitDetailsTabProps {
  permit: Permit;
}

export const PermitDetailsTab: React.FC<PermitDetailsTabProps> = ({ permit }) => {
  const updatePermit = useUpdatePermit();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    pulled_date: permit.pulled_date || '',
    approved_date: permit.approved_date || '',
    expires_date: permit.expires_date || '',
    must_pull_by_date: permit.must_pull_by_date || '',
    fee: permit.fee?.toString() || '',
    agency_name: permit.agency_name || '',
  });

  const handleSave = async () => {
    await updatePermit.mutateAsync({
      id: permit.id,
      pulled_date: formData.pulled_date || null,
      approved_date: formData.approved_date || null,
      expires_date: formData.expires_date || null,
      must_pull_by_date: formData.must_pull_by_date || null,
      fee: formData.fee ? parseFloat(formData.fee) : null,
      agency_name: formData.agency_name || null,
    });
    setIsEditing(false);
  };

  const formatDateForDisplay = (dateStr: string | null) => {
    if (!dateStr) return 'mm/dd/yyyy';
    return format(new Date(dateStr), 'MM/dd/yyyy');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Details
        </CardTitle>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updatePermit.isPending}>
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground">Pulled</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.pulled_date}
                  onChange={(e) => setFormData({ ...formData, pulled_date: e.target.value })}
                  className="w-40"
                />
              ) : (
                <span className="text-muted-foreground">{formatDateForDisplay(permit.pulled_date)}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground">Approved</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.approved_date}
                  onChange={(e) => setFormData({ ...formData, approved_date: e.target.value })}
                  className="w-40"
                />
              ) : (
                <span className="text-muted-foreground">{formatDateForDisplay(permit.approved_date)}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground">Expires</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.expires_date}
                  onChange={(e) => setFormData({ ...formData, expires_date: e.target.value })}
                  className="w-40"
                />
              ) : (
                <span className="text-muted-foreground">{formatDateForDisplay(permit.expires_date)}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground">Must Be Pulled By</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.must_pull_by_date}
                  onChange={(e) => setFormData({ ...formData, must_pull_by_date: e.target.value })}
                  className="w-40"
                />
              ) : (
                <span className="text-muted-foreground">{formatDateForDisplay(permit.must_pull_by_date)}</span>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground">Fee</Label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  className="w-40"
                  placeholder="$0.00"
                />
              ) : (
                <span>${permit.fee?.toFixed(2) || '0.00'}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground">Agency</Label>
              {isEditing ? (
                <Input
                  value={formData.agency_name}
                  onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                  className="w-40"
                  placeholder="Select contact"
                />
              ) : (
                <span className="text-muted-foreground">{permit.agency_name || 'Select contact'}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground">Referenced Inspection</Label>
              <span className="text-muted-foreground">Select Referenced Inspection</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
