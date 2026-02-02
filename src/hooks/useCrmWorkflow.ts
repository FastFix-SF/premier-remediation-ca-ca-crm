import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface CrmWorkflow {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CrmWorkflowPhase {
  id: string
  workflow_id: string
  name: string
  phase_order: number
  color: string
  icon: string
  description?: string
  created_at: string
}

export interface CrmWorkflowStep {
  id: string
  phase_id: string
  name: string
  step_order: number
  is_required: boolean
  estimated_duration_hours?: number
  description?: string
  created_at: string
}

export interface CrmCustomerProgress {
  id: string
  customer_id: string
  workflow_id: string
  current_phase_id?: string
  current_step_id?: string
  progress_percentage: number
  status: 'active' | 'completed' | 'cancelled' | 'on_hold'
  assigned_to?: string
  started_at: string
  completed_at?: string
  created_at: string
  updated_at: string
  leads?: {
    id: string
    name: string
    email: string
    phone?: string
    source?: string
    status: string
  }
  crm_workflow_phases?: CrmWorkflowPhase
  crm_workflow_steps?: CrmWorkflowStep
}

export interface CrmStepHistory {
  id: string
  customer_progress_id: string
  step_id: string
  status: 'pending' | 'in_progress' | 'complete' | 'skipped'
  started_at?: string
  completed_at?: string
  completed_by?: string
  notes?: string
  created_at: string
  updated_at: string
  crm_workflow_steps?: CrmWorkflowStep
}

export const useCrmWorkflow = () => {
  const queryClient = useQueryClient()

  // Fetch all workflows
  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['crm-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_workflows')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as CrmWorkflow[]
    }
  })

  // Fetch workflow phases with steps
  const { data: workflowPhases, isLoading: phasesLoading } = useQuery({
    queryKey: ['crm-workflow-phases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_workflow_phases')
        .select(`
          *,
          crm_workflow_steps(*)
        `)
        .order('phase_order', { ascending: true })

      if (error) throw error
      return data
    }
  })

  // Fetch all customer progress using the new view
  const { data: customerProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['crm-customer-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_crm_progress')
        .select('*')
      
      if (error) throw error
      return data
    }
  })

  // Query for phase counts using the new view
  const { data: phaseCounts } = useQuery({
    queryKey: ['crm-phase-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_crm_phase_counts')
        .select('*')
      
      if (error) throw error
      return data
    }
  })

  // Fetch step history for a specific customer
  const getStepHistory = (customerProgressId: string) => {
    return useQuery({
      queryKey: ['crm-step-history', customerProgressId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('crm_step_history')
          .select(`
            *,
            crm_workflow_steps(*)
          `)
          .eq('customer_progress_id', customerProgressId)
          .order('created_at', { ascending: true })

        if (error) throw error
        return data as CrmStepHistory[]
      }
    })
  }

  // Create new customer progress (when lead is created)
  const createCustomerProgress = useMutation({
    mutationFn: async ({ 
      customerId, 
      workflowId 
    }: { 
      customerId: string
      workflowId: string
    }) => {
      // Get the first phase of the workflow
      const { data: firstPhase, error: phaseError } = await supabase
        .from('crm_workflow_phases')
        .select('id')
        .eq('workflow_id', workflowId)
        .eq('phase_order', 1)
        .maybeSingle()

      if (phaseError) throw phaseError

      const { data, error } = await supabase
        .from('crm_customer_progress')
        .insert({
          customer_id: customerId,
          workflow_id: workflowId,
          current_phase_id: firstPhase.id,
          progress_percentage: 5
        })
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-customer-progress'] })
      toast.success('Customer added to workflow')
    },
    onError: (error) => {
      console.error('Error creating customer progress:', error)
      toast.error('Failed to add customer to workflow')
    }
  })

  // Update step status
  const updateStepStatus = useMutation({
    mutationFn: async ({
      customerProgressId,
      stepId,
      status,
      notes
    }: {
      customerProgressId: string
      stepId: string
      status: 'pending' | 'in_progress' | 'complete' | 'skipped'
      notes?: string
    }) => {
      // First, upsert the step history
      const { data: stepHistory, error: historyError } = await supabase
        .from('crm_step_history')
        .upsert({
          customer_progress_id: customerProgressId,
          step_id: stepId,
          status: status,
          notes: notes,
          started_at: status === 'in_progress' ? new Date().toISOString() : undefined,
          completed_at: status === 'complete' ? new Date().toISOString() : undefined,
          completed_by: status === 'complete' ? (await supabase.auth.getUser()).data.user?.id : undefined
        })
        .select()
        .maybeSingle()

      if (historyError) throw historyError

      // Calculate progress percentage based on completed steps
      const { data: allSteps } = await supabase
        .from('crm_step_history')
        .select('status')
        .eq('customer_progress_id', customerProgressId)

      const completedSteps = allSteps?.filter(s => s.status === 'complete').length || 0
      const totalSteps = allSteps?.length || 0
      const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

      // Update customer progress
      const { error: progressError } = await supabase
        .from('crm_customer_progress')
        .update({
          progress_percentage: progressPercentage,
          current_step_id: status === 'in_progress' ? stepId : undefined,
          status: progressPercentage === 100 ? 'completed' : 'active'
        })
        .eq('id', customerProgressId)

      if (progressError) throw progressError

      return stepHistory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-customer-progress'] })
      queryClient.invalidateQueries({ queryKey: ['crm-step-history'] })
      toast.success('Step status updated')
    },
    onError: (error) => {
      console.error('Error updating step status:', error)
      toast.error('Failed to update step status')
    }
  })

  // Move to next phase
  const moveToNextPhase = useMutation({
    mutationFn: async (customerProgressId: string) => {
      // Get current progress
      const { data: progress, error: progressError } = await supabase
        .from('crm_customer_progress')
        .select(`
          *,
          crm_workflow_phases(phase_order, workflow_id)
        `)
        .eq('id', customerProgressId)
        .maybeSingle()

      if (progressError) throw progressError

      // Get next phase
      const currentPhaseOrder = (progress.crm_workflow_phases as any)?.phase_order || 1
      const { data: nextPhase, error: nextPhaseError } = await supabase
        .from('crm_workflow_phases')
        .select('id')
        .eq('workflow_id', (progress.crm_workflow_phases as any)?.workflow_id)
        .eq('phase_order', currentPhaseOrder + 1)
        .maybeSingle()

      if (nextPhaseError) {
        // No next phase, mark as completed
        const { error: completeError } = await supabase
          .from('crm_customer_progress')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            progress_percentage: 100
          })
          .eq('id', customerProgressId)

        if (completeError) throw completeError
        return { completed: true }
      }

      // Move to next phase
      const { error: updateError } = await supabase
        .from('crm_customer_progress')
        .update({
          current_phase_id: nextPhase.id,
          current_step_id: null
        })
        .eq('id', customerProgressId)

      if (updateError) throw updateError
      return { completed: false, nextPhaseId: nextPhase.id }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['crm-customer-progress'] })
      toast.success(result.completed ? 'Workflow completed!' : 'Moved to next phase')
    },
    onError: (error) => {
      console.error('Error moving to next phase:', error)
      toast.error('Failed to move to next phase')
    }
  })

  // Assign user to customer
  const assignUser = useMutation({
    mutationFn: async ({
      customerProgressId,
      userId,
      role
    }: {
      customerProgressId: string
      userId: string
      role: 'sales_rep' | 'project_manager' | 'admin'
    }) => {
      const { data, error } = await supabase
        .from('crm_user_assignments')
        .upsert({
          user_id: userId,
          customer_progress_id: customerProgressId,
          role: role,
          assigned_by: (await supabase.auth.getUser()).data.user?.id || ''
        })
        .select()
        .maybeSingle()

      if (error) throw error

      // Also update the main assignment
      const { error: updateError } = await supabase
        .from('crm_customer_progress')
        .update({ assigned_to: userId })
        .eq('id', customerProgressId)

      if (updateError) throw updateError
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-customer-progress'] })
      toast.success('User assigned successfully')
    },
    onError: (error) => {
      console.error('Error assigning user:', error)
      toast.error('Failed to assign user')
    }
  })

  // Function to move customer to specific phase using SQL function
  const moveCustomerToPhase = useMutation({
    mutationFn: async ({ customerId, phaseName, stepName }: {
      customerId: string;
      phaseName: string;
      stepName?: string;
    }) => {
      const { data, error } = await supabase.rpc('crm_move_customer', {
        p_lead_id: customerId,
        p_phase_name: phaseName,
        p_step_name: stepName
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch customer progress data
      queryClient.invalidateQueries({ queryKey: ['crm-customer-progress'] });
      queryClient.invalidateQueries({ queryKey: ['crm-phase-counts'] });
      toast.success('Customer moved successfully');
    },
    onError: (error) => {
      console.error('Error moving customer:', error);
      toast.error('Failed to move customer');
    }
  });

  return {
    workflows,
    workflowPhases,
    customerProgress,
    phaseCounts,
    workflowsLoading,
    phasesLoading,
    progressLoading,
    isLoading: progressLoading || phasesLoading || workflowsLoading,
    getStepHistory,
    createCustomerProgress,
    updateStepStatus,
    moveToNextPhase,
    moveCustomerToPhase,
    assignUser
  }
}