import React, { useState } from 'react';
import { Plus, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddLicenseDialog from './AddLicenseDialog';

const LicensesSection: React.FC = () => {
  const [addLicenseOpen, setAddLicenseOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Licenses & Certifications</h3>
        <Button
          size="sm"
          onClick={() => setAddLicenseOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add License
        </Button>
      </div>

      <div className="bg-background rounded-lg border p-8 text-center">
        <div className="text-muted-foreground">
          <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">No licenses or certifications added yet.</p>
        </div>
      </div>

      <AddLicenseDialog open={addLicenseOpen} onOpenChange={setAddLicenseOpen} />
    </div>
  );
};

export default LicensesSection;
