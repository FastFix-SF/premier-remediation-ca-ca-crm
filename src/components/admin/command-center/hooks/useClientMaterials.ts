import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientMaterialsSummary {
  totalCost: number;
  itemCount: number;
  vendorCount: number;
  budgetedAmount: number;
  variance: number;
  isOverBudget: boolean;
}

export const useClientMaterials = (projectId: string | undefined) => {
  const { data, isLoading } = useQuery({
    queryKey: ['client-materials', projectId],
    queryFn: async (): Promise<ClientMaterialsSummary> => {
      if (!projectId) {
        return {
          totalCost: 0,
          itemCount: 0,
          vendorCount: 0,
          budgetedAmount: 0,
          variance: 0,
          isOverBudget: false
        };
      }

      // Fetch materials and project budget in parallel
      const [materialsResult, projectResult] = await Promise.all([
        supabase
          .from('project_materials')
          .select('total_amount, tax_amount, vendor')
          .eq('project_id', projectId),
        supabase
          .from('projects')
          .select('budget_materials')
          .eq('id', projectId)
          .maybeSingle()
      ]);

      const materials = materialsResult.data || [];
      const budgetedAmount = projectResult.data?.budget_materials || 0;

      let totalCost = 0;
      const vendors = new Set<string>();

      materials.forEach(item => {
        totalCost += Number(item.total_amount || 0) + Number(item.tax_amount || 0);
        if (item.vendor) {
          vendors.add(item.vendor);
        }
      });

      const variance = budgetedAmount - totalCost;

      return {
        totalCost,
        itemCount: materials.length,
        vendorCount: vendors.size,
        budgetedAmount,
        variance,
        isOverBudget: totalCost > budgetedAmount && budgetedAmount > 0
      };
    },
    enabled: !!projectId
  });

  return {
    materialsSummary: data || {
      totalCost: 0,
      itemCount: 0,
      vendorCount: 0,
      budgetedAmount: 0,
      variance: 0,
      isOverBudget: false
    },
    isLoading
  };
};
