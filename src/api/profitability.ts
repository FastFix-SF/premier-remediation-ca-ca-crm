import { ProfitInputs, Actuals } from "@/types/profitability";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch profit inputs (estimates) for a project
 * Fetches from:
 * - projects table for basic info
 * - project_proposals for contract value and payment schedule
 */
export async function getProfitInputs(projectId: string): Promise<ProfitInputs> {
  try {
    // Fetch project details including budget fields
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('name, address, customer_email, contract_amount, budget_labor, budget_materials, budget_overhead')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError) throw projectError;

    // Start with project's stored budget values
    let contractValue = project?.contract_amount || 0;
    let laborCost = project?.budget_labor || 0;
    let materialsCost = project?.budget_materials || 0;
    let overheadCost = project?.budget_overhead || 0;
    let paymentSchedule = null;
    
    // If no contract value stored, try to find from proposal
    if (!contractValue && project) {
      console.log('Looking for proposal with:', {
        address: project.address,
        email: project.customer_email
      });

      // Try exact address match first
      let { data: proposals } = await supabase
        .from('project_proposals')
        .select('contract_price, payment_schedule, status, proposal_number, property_address')
        .eq('property_address', project.address)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(1);

      // If no exact match, try email match
      if (!proposals || proposals.length === 0) {
        const result = await supabase
          .from('project_proposals')
          .select('contract_price, payment_schedule, status, proposal_number, property_address')
          .eq('client_email', project.customer_email)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(1);
        proposals = result.data;
      }

      console.log('Found proposals:', proposals);

      if (proposals && proposals.length > 0) {
        const proposal = proposals[0];
        contractValue = proposal.contract_price || 0;
        paymentSchedule = proposal.payment_schedule;
        console.log('Using contract value:', contractValue, 'from proposal:', proposal.proposal_number);
      } else {
        console.log('No matching proposal found');
      }
    }

    return {
      projectId,
      quoteId: undefined,
      contractValue,
      paymentSchedule,
      targetMarginPct: 0.20,
      est: {
        laborHours: 0,
        laborCost,
        materialsCost,
        overheadCost,
      },
    };
  } catch (error) {
    console.error('Error fetching profit inputs:', error);
    return {
      projectId,
      quoteId: undefined,
      contractValue: 0,
      targetMarginPct: 0.20,
      est: {
        laborHours: 0,
        laborCost: 0,
        materialsCost: 0,
        overheadCost: 0,
      },
    };
  }
}

/**
 * Fetch actual costs for a project within date range
 * STUB: Returns zeros for now, will later fetch from:
 * - time_clock entries (labor)
 * - project_materials (materials)
 * - labor_burden_config calculations
 * - overhead_config allocations
 */
export async function getActuals(
  projectId: string,
  start?: string,
  end?: string
): Promise<Actuals> {
  const now = new Date().toISOString();
  
  // TODO: Query time_clock for labor hours and costs
  // TODO: Query project_materials for material costs
  // TODO: Calculate burden and overhead from configs
  
  return {
    period: { start: start ?? now, end: end ?? now },
    labor: {
      regHours: 0,
      otHours: 0,
      cost: 0,
      burdenCost: 0,
      employees: 0,
    },
    materials: {
      items: 0,
      cost: 0,
      vendors: 0,
    },
    overhead: {
      cost: 0,
    },
  };
}
