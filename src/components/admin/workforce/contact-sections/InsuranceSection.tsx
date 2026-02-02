import React, { useState } from 'react';
import { Plus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddInsuranceDialog from './AddInsuranceDialog';

const InsuranceSection: React.FC = () => {
  const [addInsuranceOpen, setAddInsuranceOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Insurance Certificates</h3>
        <Button
          size="sm"
          onClick={() => setAddInsuranceOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Insurance
        </Button>
      </div>

      <div className="bg-background rounded-lg border p-8 text-center">
        <div className="text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">No insurance certificates added yet.</p>
        </div>
      </div>

      <AddInsuranceDialog open={addInsuranceOpen} onOpenChange={setAddInsuranceOpen} />
    </div>
  );
};

export default InsuranceSection;
