import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface LaborBurdenConfig {
  id: string;
  workers_comp_rate: number;
  health_insurance_monthly: number;
  payroll_tax_rate: number;
  other_benefits_rate: number;
}

interface OverheadConfig {
  id: string;
  office_staff_rate: number;
  liability_insurance_rate: number;
  equipment_rental_rate: number;
  facility_overhead_rate: number;
  allocation_method: string;
}

export function LaborBurdenConfig() {
  const [laborConfig, setLaborConfig] = useState<LaborBurdenConfig | null>(null);
  const [overheadConfig, setOverheadConfig] = useState<OverheadConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const [laborResponse, overheadResponse] = await Promise.all([
        supabase
          .from('labor_burden_config')
          .select('*')
          .eq('is_active', true)
          .order('effective_date', { ascending: false })
          .limit(1),
        supabase
          .from('overhead_config')
          .select('*')
          .eq('is_active', true)
          .order('effective_date', { ascending: false })
          .limit(1)
      ]);

      if (laborResponse.data?.[0]) {
        setLaborConfig(laborResponse.data[0]);
      }

      if (overheadResponse.data?.[0]) {
        setOverheadConfig(overheadResponse.data[0]);
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast({
        title: "Error",
        description: "Failed to load configuration data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveLaborConfig = async () => {
    if (!laborConfig) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('labor_burden_config')
        .update({
          workers_comp_rate: laborConfig.workers_comp_rate,
          health_insurance_monthly: laborConfig.health_insurance_monthly,
          payroll_tax_rate: laborConfig.payroll_tax_rate,
          other_benefits_rate: laborConfig.other_benefits_rate,
        })
        .eq('id', laborConfig.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Labor burden configuration updated successfully",
      });
    } catch (error) {
      console.error('Error saving labor config:', error);
      toast({
        title: "Error",
        description: "Failed to save labor burden configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveOverheadConfig = async () => {
    if (!overheadConfig) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('overhead_config')
        .update({
          office_staff_rate: overheadConfig.office_staff_rate,
          liability_insurance_rate: overheadConfig.liability_insurance_rate,
          equipment_rental_rate: overheadConfig.equipment_rental_rate,
          facility_overhead_rate: overheadConfig.facility_overhead_rate,
        })
        .eq('id', overheadConfig.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Overhead configuration updated successfully",
      });
    } catch (error) {
      console.error('Error saving overhead config:', error);
      toast({
        title: "Error",
        description: "Failed to save overhead configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading configuration...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Labor Burden Configuration */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Labor Burden Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Configure rates for workers' compensation, insurance, and taxes
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workers-comp">Workers' Compensation Rate (%)</Label>
              <Input
                id="workers-comp"
                type="number"
                step="0.001"
                value={laborConfig?.workers_comp_rate || 0}
                onChange={(e) => setLaborConfig(prev => prev ? {
                  ...prev,
                  workers_comp_rate: parseFloat(e.target.value) || 0
                } : null)}
                placeholder="0.03"
              />
            </div>

            <div>
              <Label htmlFor="health-insurance">Health Insurance (Monthly $)</Label>
              <Input
                id="health-insurance"
                type="number"
                step="0.01"
                value={laborConfig?.health_insurance_monthly || 0}
                onChange={(e) => setLaborConfig(prev => prev ? {
                  ...prev,
                  health_insurance_monthly: parseFloat(e.target.value) || 0
                } : null)}
                placeholder="600"
              />
            </div>

            <div>
              <Label htmlFor="payroll-tax">Payroll Tax Rate (%)</Label>
              <Input
                id="payroll-tax"
                type="number"
                step="0.001"
                value={laborConfig?.payroll_tax_rate || 0}
                onChange={(e) => setLaborConfig(prev => prev ? {
                  ...prev,
                  payroll_tax_rate: parseFloat(e.target.value) || 0
                } : null)}
                placeholder="0.153"
              />
            </div>

            <div>
              <Label htmlFor="other-benefits">Other Benefits Rate (%)</Label>
              <Input
                id="other-benefits"
                type="number"
                step="0.001"
                value={laborConfig?.other_benefits_rate || 0}
                onChange={(e) => setLaborConfig(prev => prev ? {
                  ...prev,
                  other_benefits_rate: parseFloat(e.target.value) || 0
                } : null)}
                placeholder="0.02"
              />
            </div>
          </div>

          <Button onClick={saveLaborConfig} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Labor Burden Config'}
          </Button>
        </div>
      </Card>

      {/* Overhead Configuration */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Overhead Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Configure overhead allocation rates for office staff, equipment, and facilities
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="office-staff">Office Staff Rate ($/hour)</Label>
              <Input
                id="office-staff"
                type="number"
                step="0.01"
                value={overheadConfig?.office_staff_rate || 0}
                onChange={(e) => setOverheadConfig(prev => prev ? {
                  ...prev,
                  office_staff_rate: parseFloat(e.target.value) || 0
                } : null)}
                placeholder="15.00"
              />
            </div>

            <div>
              <Label htmlFor="liability-insurance">Liability Insurance Rate (%)</Label>
              <Input
                id="liability-insurance"
                type="number"
                step="0.001"
                value={overheadConfig?.liability_insurance_rate || 0}
                onChange={(e) => setOverheadConfig(prev => prev ? {
                  ...prev,
                  liability_insurance_rate: parseFloat(e.target.value) || 0
                } : null)}
                placeholder="0.005"
              />
            </div>

            <div>
              <Label htmlFor="equipment-rental">Equipment Rental Rate ($/hour)</Label>
              <Input
                id="equipment-rental"
                type="number"
                step="0.01"
                value={overheadConfig?.equipment_rental_rate || 0}
                onChange={(e) => setOverheadConfig(prev => prev ? {
                  ...prev,
                  equipment_rental_rate: parseFloat(e.target.value) || 0
                } : null)}
                placeholder="8.00"
              />
            </div>

            <div>
              <Label htmlFor="facility-overhead">Facility Overhead Rate ($/hour)</Label>
              <Input
                id="facility-overhead"
                type="number"
                step="0.01"
                value={overheadConfig?.facility_overhead_rate || 0}
                onChange={(e) => setOverheadConfig(prev => prev ? {
                  ...prev,
                  facility_overhead_rate: parseFloat(e.target.value) || 0
                } : null)}
                placeholder="5.00"
              />
            </div>
          </div>

          <Button onClick={saveOverheadConfig} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Overhead Config'}
          </Button>
        </div>
      </Card>
    </div>
  );
}