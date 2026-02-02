import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PayRatesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const PayRatesDrawer: React.FC<PayRatesDrawerProps> = ({
  open,
  onOpenChange,
  projectId
}) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [payRates, setPayRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchPayRates();
    }
  }, [open]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_mapping')
        .select('*')
        .eq('sync_status', 'active');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPayRates = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_pay_rates')
        .select(`
          *,
          employee_mapping (
            connecteam_name,
            email
          )
        `)
        .order('effective_from', { ascending: false });

      if (error) throw error;
      setPayRates(data || []);
    } catch (error) {
      console.error('Error fetching pay rates:', error);
    }
  };

  const savePayRate = async (employeeId: string, hourlyRate: number, overtimeMultiplier: number = 1.5) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('employee_pay_rates')
        .upsert({
          employee_mapping_id: employeeId,
          hourly_rate: hourlyRate,
          overtime_multiplier: overtimeMultiplier,
          effective_from: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pay rate updated successfully",
      });

      fetchPayRates();
    } catch (error) {
      console.error('Error saving pay rate:', error);
      toast({
        title: "Error",
        description: "Failed to save pay rate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[800px] sm:max-w-[800px]">
        <SheetHeader>
          <SheetTitle>Employee Pay Rates</SheetTitle>
          <SheetDescription>
            Set hourly rates and overtime multipliers for project employees
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Current Pay Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Pay Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>OT Multiplier</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {rate.employee_mapping?.connecteam_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {rate.employee_mapping?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(rate.hourly_rate)}
                      </TableCell>
                      <TableCell>{rate.overtime_multiplier}x</TableCell>
                      <TableCell>
                        {new Date(rate.effective_from).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rate.effective_to ? "secondary" : "default"}>
                          {rate.effective_to ? "Expired" : "Active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payRates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No pay rates set. Add rates for employees below.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Add/Update Pay Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Set Pay Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => {
                  const currentRate = payRates.find(
                    r => r.employee_mapping_id === employee.id && !r.effective_to
                  );
                  
                  return (
                    <PayRateForm
                      key={employee.id}
                      employee={employee}
                      currentRate={currentRate}
                      onSave={(rate, multiplier) => savePayRate(employee.id, rate, multiplier)}
                      loading={loading}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

interface PayRateFormProps {
  employee: any;
  currentRate?: any;
  onSave: (rate: number, multiplier: number) => void;
  loading: boolean;
}

const PayRateForm: React.FC<PayRateFormProps> = ({
  employee,
  currentRate,
  onSave,
  loading
}) => {
  const [hourlyRate, setHourlyRate] = useState(currentRate?.hourly_rate || '');
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(currentRate?.overtime_multiplier || 1.5);

  const handleSave = () => {
    const rate = parseFloat(hourlyRate.toString());
    if (rate > 0) {
      onSave(rate, overtimeMultiplier);
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg">
      <div className="flex-1">
        <div className="font-medium">{employee.connecteam_name}</div>
        <div className="text-sm text-muted-foreground">{employee.email}</div>
      </div>
      <div className="flex items-center space-x-2">
        <div>
          <Label htmlFor={`rate-${employee.id}`} className="sr-only">
            Hourly Rate
          </Label>
          <Input
            id={`rate-${employee.id}`}
            type="number"
            step="0.25"
            min="0"
            placeholder="Hourly Rate"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="w-24"
          />
        </div>
        <div>
          <Label htmlFor={`multiplier-${employee.id}`} className="sr-only">
            OT Multiplier
          </Label>
          <Input
            id={`multiplier-${employee.id}`}
            type="number"
            step="0.1"
            min="1"
            placeholder="1.5"
            value={overtimeMultiplier}
            onChange={(e) => setOvertimeMultiplier(parseFloat(e.target.value))}
            className="w-20"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={loading || !hourlyRate}
          size="sm"
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};