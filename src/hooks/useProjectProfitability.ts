import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfitData {
  total_revenue: number;
  total_labor_cost: number;
  total_materials_cost: number;
  gross_profit: number;
  gp_percentage: number;
  base_labor_cost: number;
  labor_burden_cost: number;
  overhead_cost: number;
}

interface LaborBurdenConfig {
  workers_comp_rate: number;
  health_insurance_monthly: number;
  payroll_tax_rate: number;
  other_benefits_rate: number;
}

interface OverheadConfig {
  office_staff_rate: number;
  liability_insurance_rate: number;
  equipment_rental_rate: number;
  facility_overhead_rate: number;
  allocation_method: string;
}

interface LaborData {
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  total_cost: number;
  employees: Array<{
    employee_name: string;
    role: string;
    shifts: number;
    regular_hours: number;
    overtime_hours: number;
    hourly_rate: number;
    total_cost: number;
    last_shift: string;
  }>;
  timeline: Array<{
    date: string;
    clock_in: string;
    clock_out: string;
    hours: number;
    employee_name: string;
    location: string;
    notes?: string;
  }>;
}

interface MaterialsData {
  total_cost: number;
  totalLineItems: number;
  uniqueVendors: number;
  pendingBills: number;
  completeBills: number;
  pendingDeliveries: number;
  partialDeliveries: number;
  items: any[];
  bills: any[];
}

export const useProjectProfitability = (projectId: string, dateRange: { from: Date; to: Date }) => {
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [laborData, setLaborData] = useState<LaborData | null>(null);
  const [materialsData, setMaterialsData] = useState<MaterialsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      fetchAllData();
      
      // Set up real-time subscriptions for multiple tables
      const timeClockChannel = supabase
        .channel(`time_clock_${projectId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'time_clock',
            filter: `job_id=eq.${projectId}`
          },
          (payload) => {
            console.log('Time clock update received:', payload);
            fetchAllData();
            
            if (payload.eventType === 'INSERT') {
              toast({
                title: "New Clock-In",
                description: `${payload.new.employee_name} clocked in`,
              });
            } else if (payload.eventType === 'UPDATE' && payload.new.clock_out) {
              toast({
                title: "Clock-Out",
                description: `${payload.new.employee_name} clocked out`,
              });
            }
          }
        )
        .subscribe();

      const materialsChannel = supabase
        .channel(`materials_${projectId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_materials',
            filter: `project_id=eq.${projectId}`
          },
          (payload) => {
            console.log('Materials update received:', payload);
            fetchAllData();
            
            if (payload.eventType === 'INSERT') {
              toast({
                title: "Materials Added",
                description: "New materials added from estimator",
              });
            } else if (payload.eventType === 'UPDATE') {
              toast({
                title: "Materials Updated",
                description: "Materials data updated",
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'quote_requests'
          },
          (payload) => {
            console.log('Quote materials update received:', payload);
            fetchAllData();
            
            toast({
              title: "Estimator Updated",
              description: "Materials updated from quote estimator",
            });
          }
        )
        .subscribe();

      const billsChannel = supabase
        .channel(`bills_${projectId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'material_bills',
            filter: `project_id=eq.${projectId}`
          },
          (payload) => {
            console.log('Bills update received:', payload);
            fetchAllData();
            
            if (payload.eventType === 'INSERT') {
              toast({
                title: "New Bill Added",
                description: "New material bill from estimator",
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(timeClockChannel);
        supabase.removeChannel(materialsChannel);
        supabase.removeChannel(billsChannel);
      };
    }
  }, [projectId, dateRange]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchProfitData(),
        fetchLaborData(),
        fetchMaterialsData()
      ]);
    } catch (error) {
      console.error('Error fetching profitability data:', error);
      toast({
        title: "Error",
        description: "Failed to load profitability data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLaborBurdenConfig = async (): Promise<LaborBurdenConfig | null> => {
    try {
      const { data, error } = await supabase
        .from('labor_burden_config')
        .select('*')
        .eq('is_active', true)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching labor burden config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchLaborBurdenConfig:', error);
      return null;
    }
  };

  const fetchOverheadConfig = async (): Promise<OverheadConfig | null> => {
    try {
      const { data, error } = await supabase
        .from('overhead_config')
        .select('*')
        .eq('is_active', true)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching overhead config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchOverheadConfig:', error);
      return null;
    }
  };

  const fetchProfitData = async () => {
    try {
      const [laborBurdenConfig, overheadConfig, timeEntries, materials, revenue] = await Promise.all([
        fetchLaborBurdenConfig(),
        fetchOverheadConfig(),
        supabase
          .from('time_clock')
          .select('total_hours')
          .eq('job_id', projectId)
          .gte('clock_in', dateRange.from.toISOString())
          .lte('clock_in', dateRange.to.toISOString())
          .not('clock_out', 'is', null),
        supabase
          .from('project_materials')
          .select('total_amount, tax_amount')
          .eq('project_id', projectId)
          .gte('date', dateRange.from.toISOString().split('T')[0])
          .lte('date', dateRange.to.toISOString().split('T')[0]),
        supabase
          .from('project_revenue')
          .select('amount')
          .eq('project_id', projectId)
      ]);

      // Calculate base labor cost
      const totalHours = timeEntries.data?.reduce((sum, entry) => sum + Number(entry.total_hours || 0), 0) || 0;
      const regularHours = Math.min(totalHours, timeEntries.data?.length * 8 || 0);
      const overtimeHours = Math.max(totalHours - regularHours, 0);
      const baseLaborCost = (regularHours * 25.0) + (overtimeHours * 37.5); // Default rates

      // Calculate labor burden
      let laborBurdenCost = 0;
      if (laborBurdenConfig && baseLaborCost > 0) {
        const workersCompCost = baseLaborCost * laborBurdenConfig.workers_comp_rate;
        const payrollTaxCost = baseLaborCost * laborBurdenConfig.payroll_tax_rate;
        const otherBenefitsCost = baseLaborCost * laborBurdenConfig.other_benefits_rate;
        
        // Health insurance allocation (monthly cost divided by average monthly hours)
        const avgMonthlyHours = 160; // 40 hours/week * 4 weeks
        const healthInsuranceCost = totalHours > 0 ? 
          (laborBurdenConfig.health_insurance_monthly * totalHours) / avgMonthlyHours : 0;

        laborBurdenCost = workersCompCost + payrollTaxCost + otherBenefitsCost + healthInsuranceCost;
      }

      // Calculate overhead allocation
      let overheadCost = 0;
      if (overheadConfig && totalHours > 0) {
        const officeStaffCost = totalHours * overheadConfig.office_staff_rate;
        const liabilityInsuranceCost = baseLaborCost * overheadConfig.liability_insurance_rate;
        const equipmentRentalCost = totalHours * overheadConfig.equipment_rental_rate;
        const facilityOverheadCost = totalHours * overheadConfig.facility_overhead_rate;

        overheadCost = officeStaffCost + liabilityInsuranceCost + equipmentRentalCost + facilityOverheadCost;
      }

      const totalLaborCost = baseLaborCost + laborBurdenCost;
      const totalMaterialsCost = materials.data?.reduce((sum, item) => sum + Number(item.total_amount) + Number(item.tax_amount || 0), 0) || 0;
      const totalRevenue = revenue.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const grossProfit = totalRevenue - totalLaborCost - totalMaterialsCost - overheadCost;
      const gpPercentage = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      setProfitData({
        total_revenue: totalRevenue,
        total_labor_cost: totalLaborCost,
        total_materials_cost: totalMaterialsCost,
        gross_profit: grossProfit,
        gp_percentage: gpPercentage,
        base_labor_cost: baseLaborCost,
        labor_burden_cost: laborBurdenCost,
        overhead_cost: overheadCost,
      });
    } catch (error) {
      console.error('Error in fetchProfitData:', error);
    }
  };

  const fetchLaborData = async () => {
    // Get time clock entries for the project
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_clock')
      .select('*')
      .eq('job_id', projectId)
      .gte('clock_in', dateRange.from.toISOString())
      .lte('clock_in', dateRange.to.toISOString())
      .not('clock_out', 'is', null)
      .order('clock_in', { ascending: false });

    if (timeError) {
      console.error('Error fetching time clock entries:', timeError);
      return;
    }

    if (!timeEntries || timeEntries.length === 0) {
      const emptyLaborData: LaborData = {
        total_hours: 0,
        regular_hours: 0,
        overtime_hours: 0,
        total_cost: 0,
        employees: [],
        timeline: []
      };

      setLaborData(emptyLaborData);
      return;
    }

    // Fetch hourly rates from team_directory (synced with timesheets page)
    const { data: teamMembers } = await supabase
      .from('team_directory')
      .select('user_id, full_name, hourly_rate');

    // Create map for user_id -> hourly_rate lookup
    const payRateByUserId = new Map<string, number>();
    if (teamMembers) {
      teamMembers.forEach(member => {
        if (member.user_id && member.hourly_rate) {
          payRateByUserId.set(member.user_id, Number(member.hourly_rate));
        }
      });
    }

    // Calculate labor costs and hours for each entry
    const DEFAULT_HOURLY_RATE = 25.0;
    const DEFAULT_OT_MULTIPLIER = 1.5;
    
    const processedEntries = timeEntries.map(entry => {
      const totalHours = Number(entry.total_hours || 0);
      const regularHours = Math.min(totalHours, 8);
      const overtimeHours = Math.max(totalHours - 8, 0);
      
      // Get hourly rate from team_directory by user_id (synced with timesheets settings)
      const hourlyRate = (entry.user_id && payRateByUserId.get(entry.user_id)) || DEFAULT_HOURLY_RATE;
      const overtimeRate = hourlyRate * DEFAULT_OT_MULTIPLIER;
      
      // Calculate cost
      const regularCost = regularHours * hourlyRate;
      const overtimeCost = overtimeHours * overtimeRate;
      const totalCost = regularCost + overtimeCost;

      return {
        ...entry,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        hourly_rate: hourlyRate,
        total_cost: totalCost
      };
    });

    // Calculate totals
    const totalHours = processedEntries.reduce((sum, entry) => sum + Number(entry.total_hours || 0), 0);
    const regularHours = processedEntries.reduce((sum, entry) => sum + entry.regular_hours, 0);
    const overtimeHours = processedEntries.reduce((sum, entry) => sum + entry.overtime_hours, 0);
    const totalCost = processedEntries.reduce((sum, entry) => sum + entry.total_cost, 0);

    // Group by employee
    const employeeMap = new Map();
    processedEntries.forEach(entry => {
      const empName = entry.employee_name;
      if (!employeeMap.has(empName)) {
        employeeMap.set(empName, {
          employee_name: empName,
          role: entry.employee_role || 'Worker',
          shifts: 0,
          regular_hours: 0,
          overtime_hours: 0,
          hourly_rate: entry.hourly_rate,
          total_cost: 0,
          last_shift: entry.clock_in.split('T')[0]
        });
      }
      
      const emp = employeeMap.get(empName);
      emp.shifts += 1;
      emp.regular_hours += entry.regular_hours;
      emp.overtime_hours += entry.overtime_hours;
      emp.total_cost += entry.total_cost;
      
      const entryDate = entry.clock_in.split('T')[0];
      if (entryDate > emp.last_shift) {
        emp.last_shift = entryDate;
      }
    });

    // Create timeline
    const timeline = processedEntries.map(entry => ({
      date: entry.clock_in.split('T')[0],
      clock_in: new Date(entry.clock_in).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }),
      clock_out: entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }) : '',
      hours: Number(entry.total_hours || 0),
      employee_name: entry.employee_name,
      location: entry.location || 'Project Site',
      notes: entry.notes
    }));

    const laborData: LaborData = {
      total_hours: totalHours,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      total_cost: totalCost,
      employees: Array.from(employeeMap.values()),
      timeline: timeline
    };

    setLaborData(laborData);
  };

  const fetchMaterialsData = async () => {
    try {
      // Fetch project to check if it has a linked quote
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .maybeSingle();

      // Fetch materials from quote_requests if they exist
      const { data: quoteData } = await supabase
        .from('quote_requests')
        .select('id, material_items')
        .or(`property_address.ilike.%${projectData?.name}%,name.ilike.%${projectData?.name}%`)
        .maybeSingle();

      // Also fetch direct project materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('project_materials')
        .select('*')
        .eq('project_id', projectId)
        .gte('date', dateRange.from.toISOString().split('T')[0])
        .lte('date', dateRange.to.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (materialsError) throw materialsError;

      // Fetch bills summary
      const { data: billsData, error: billsError } = await supabase
        .from('material_bills')
        .select('*')
        .eq('project_id', projectId)
        .order('order_date', { ascending: false });

      if (billsError) throw billsError;

      // Combine materials from both sources
      let allMaterials = [...(materialsData || [])];
      
      // Add materials from quote estimator - transform to match project_materials structure
      if (quoteData?.material_items && Array.isArray(quoteData.material_items)) {
        const quoteMaterials = quoteData.material_items
          .filter((item: any) => item.quantity > 0) // Only include items with quantity
          .map((item: any) => ({
            id: `quote-${item.id}`,
            project_id: projectId,
            date: new Date().toISOString().split('T')[0],
            vendor: 'Estimator',
            item_code: item.name || '',
            item_description: item.name || '',
            quantity: item.quantity || 0,
            quantity_ordered: item.quantity || 0,
            quantity_received: 0,
            quantity_remaining: item.quantity || 0,
            unit_price: item.unit_cost || 0,
            total_amount: item.total || 0,
            status: 'pending',
            is_returned: false,
            sent_to_yard: false,
            source: 'quote_estimator',
            bill_id: null,
            checked_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            delivery_date: null,
            external_id: null,
            file_url: null,
            notes: 'From Quote Estimator',
            return_date: null,
            sent_to_yard_date: null,
            tax_amount: 0,
            unit: item.unit || 'ea'
          }));
        allMaterials = [...quoteMaterials, ...allMaterials];
      }

      const processedMaterials = {
        total_cost: allMaterials.reduce((sum, item) => sum + (item.total_amount || 0), 0),
        items: allMaterials,
        bills: billsData || [],
        totalLineItems: allMaterials.length,
        uniqueVendors: new Set(allMaterials.map(item => item.vendor)).size,
        pendingBills: billsData?.filter(bill => bill.status === 'ordered' || bill.status === 'partial').length || 0,
        completeBills: billsData?.filter(bill => bill.status === 'complete').length || 0,
        pendingDeliveries: allMaterials.filter(item => 
          item.status === 'pending' || item.status === 'in_transit'
        ).length,
        partialDeliveries: allMaterials.filter(item => 
          item.quantity_received > 0 && item.quantity_received < item.quantity_ordered
        ).length
      };

      setMaterialsData(processedMaterials);
    } catch (error) {
      console.error('Error fetching materials data:', error);
      setMaterialsData({
        total_cost: 0,
        items: [],
        bills: [],
        totalLineItems: 0,
        uniqueVendors: 0,
        pendingBills: 0,
        completeBills: 0,
        pendingDeliveries: 0,
        partialDeliveries: 0
      });
    }
  };

  const syncProjectLabor = async () => {
    // Since we're using mobile app time clock data directly,
    // just refresh the current data
    await fetchAllData();
    
    toast({
      title: "Labor Data Refreshed",
      description: "Labor data has been refreshed from mobile time clock entries",
    });
  };

  const refreshData = async () => {
    await fetchAllData();
  };

  return {
    profitData,
    laborData,
    materialsData,
    isLoading,
    syncProjectLabor,
    refreshData
  };
};