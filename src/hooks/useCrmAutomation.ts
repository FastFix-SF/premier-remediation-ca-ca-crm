import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface CrmAutomation {
  id: string
  name: string
  trigger_event: string
  condition_data: any
  action_type: string
  action_data: any
  is_active: boolean
}

export const useCrmAutomation = () => {
  
  // Trigger automation based on event
  const triggerAutomation = async (
    eventType: string, 
    eventData: any
  ) => {
    try {
      console.log(`🤖 CRM Automation: Triggering event "${eventType}"`, eventData)

      // Get active automations for this event type
      const { data: automations, error } = await supabase
        .from('crm_automations')
        .select('*')
        .eq('trigger_event', eventType)
        .eq('is_active', true)

      if (error) {
        console.error('❌ Error fetching automations:', error)
        throw error
      }

      console.log(`🔍 Found ${automations?.length || 0} active automations for event "${eventType}"`)
      
      if (!automations || automations.length === 0) {
        console.log(`⚠️ No active automations found for event "${eventType}"`)
        return
      }

      // Execute each automation
      for (const automation of automations) {
        console.log(`🔄 Processing automation:`, automation)
        await executeAutomation(automation, eventData)
      }
    } catch (error) {
      console.error('❌ Error in triggerAutomation:', error)
    }
  }

  // Execute a specific automation
  const executeAutomation = async (
    automation: CrmAutomation,
    eventData: Record<string, any>
  ) => {
    try {
      console.log(`🔄 Executing automation: "${automation.name}" (${automation.action_type})`, automation)

      switch (automation.action_type) {
        case 'move_phase':
          await handleMovePhase(automation.action_data, eventData)
          break
        
        case 'assign_user':
          await handleAssignUser(automation.action_data, eventData)
          break
        
        case 'create_task':
          await handleCreateTask(automation.action_data, eventData)
          break
        
        case 'send_email':
          await handleSendEmail(automation.action_data, eventData)
          break
        
        case 'create_proposal':
          await handleCreateProposal(automation.action_data, eventData)
          break
        
        default:
          console.error(`❌ Unknown automation action type: ${automation.action_type}`)
      }
      
      console.log(`✅ Successfully executed automation: "${automation.name}"`)
    } catch (error) {
      console.error(`❌ Error executing automation "${automation.name}":`, error)
      toast.error(`Automation failed: ${automation.name}`)
      throw error // Re-throw to ensure error visibility
    }
  }

  // Handle phase movement automation
  const handleMovePhase = async (
    actionData: Record<string, any>,
    eventData: Record<string, any>
  ) => {
    const { phase_name, complete = false } = actionData
    const { customer_id, lead_id } = eventData

    // Find customer progress by lead ID or customer ID
    const customerId = customer_id || lead_id
    if (!customerId) return

    const { data: progress } = await supabase
      .from('crm_customer_progress')
      .select(`
        id,
        workflow_id,
        crm_workflows(
          crm_workflow_phases(id, name, phase_order)
        )
      `)
      .eq('customer_id', customerId)
      .maybeSingle()

    if (!progress) return

    // Find the target phase
    const phases = (progress.crm_workflows as any)?.crm_workflow_phases || []
    const targetPhase = phases.find((p: any) => p.name === phase_name)
    
    if (!targetPhase) return

    // Update customer progress
    const updateData: any = {
      current_phase_id: targetPhase.id,
      current_step_id: null // Reset step when moving phases
    }

    if (complete) {
      updateData.status = 'completed'
      updateData.completed_at = new Date().toISOString()
      updateData.progress_percentage = 100
    }

    await supabase
      .from('crm_customer_progress')
      .update(updateData)
      .eq('id', progress.id)

    toast.success(`Customer moved to ${phase_name}`)
  }

  // Handle user assignment automation
  const handleAssignUser = async (
    actionData: Record<string, any>,
    eventData: Record<string, any>
  ) => {
    const { user_id, role = 'sales_rep' } = actionData
    const { customer_id, lead_id } = eventData

    const customerId = customer_id || lead_id
    if (!customerId || !user_id) return

    // Find customer progress
    const { data: progress } = await supabase
      .from('crm_customer_progress')
      .select('id')
      .eq('customer_id', customerId)
      .maybeSingle()

    if (!progress) return

    // Create user assignment
    await supabase
      .from('crm_user_assignments')
      .upsert({
        user_id: user_id,
        customer_progress_id: progress.id,
        role: role,
        assigned_by: (await supabase.auth.getUser()).data.user?.id || ''
      })

    // Update main assignment
    await supabase
      .from('crm_customer_progress')
      .update({ assigned_to: user_id })
      .eq('id', progress.id)

    toast.success(`User assigned to customer`)
  }

  // Handle task creation automation
  const handleCreateTask = async (
    actionData: Record<string, any>,
    eventData: Record<string, any>
  ) => {
    const { task_type, title, description } = actionData
    
    // For now, just show a toast notification
    // In a real system, you'd create tasks in a tasks table
    toast.info(`Task created: ${title}`)
    console.log('Task would be created:', { task_type, title, description, eventData })
  }

  // Handle email sending automation
  const handleSendEmail = async (
    actionData: Record<string, any>,
    eventData: Record<string, any>
  ) => {
    const { template, to, subject } = actionData
    
    // For now, just show a toast notification
    // In a real system, you'd integrate with an email service
    toast.info(`Email would be sent: ${subject}`)
    console.log('Email would be sent:', { template, to, subject, eventData })
  }

  // Handle proposal creation automation
  const handleCreateProposal = async (
    actionData: Record<string, any>,
    eventData: Record<string, any>
  ) => {
    try {
      console.log('📝 Creating proposal automation triggered:', { actionData, eventData })
      
      const leadData = eventData.lead_data || eventData
      console.log('📋 Lead data for proposal:', leadData)
      
      if (!leadData.id) {
        console.error('❌ No lead ID found in event data')
        toast.error('Cannot create proposal: Lead ID missing')
        return
      }

      // Get current user
      const { data: user, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user.user) {
        console.error('❌ Error getting current user:', userError)
        toast.error('Cannot create proposal: User not authenticated')
        return
      }

      console.log(`👤 Creating proposal as user: ${user.user.id}`)
      
      // Create proposal with lead information
      const proposalData = {
        client_name: leadData.name || 'Unknown Client',
        client_email: leadData.email,
        client_phone: leadData.phone || '',
        property_address: leadData.company_name || leadData.company || 'Address to be determined',
        project_type: leadData.project_type || 'residential',
        scope_of_work: `Automatically generated proposal for ${leadData.name}

Project Type: ${leadData.project_type || 'To be determined'}
Timeline: ${leadData.timeline || 'To be discussed'}
Budget Range: ${leadData.budget_range || 'To be determined'}

Additional Notes: ${leadData.notes || 'None'}`,
        notes_disclaimers: 'This proposal was automatically generated from a qualified lead. Please review and customize as needed.',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: user.user.id,
        status: 'draft'
      }

      console.log('📄 Creating proposal with data:', proposalData)

      const { data, error } = await supabase
        .from('project_proposals')
        .insert([proposalData])
        .select()
        .maybeSingle()

      if (error) {
        console.error('❌ Error creating proposal:', error)
        toast.error(`Failed to create proposal for ${leadData.name}: ${error.message}`)
        return
      }

      console.log('✅ Proposal created successfully:', data)
      toast.success(`Proposal ${data.proposal_number} automatically created for ${leadData.name}`)
    } catch (error) {
      console.error('❌ Error in handleCreateProposal:', error)
      toast.error('An unexpected error occurred while creating the proposal')
    }
  }

  // Set up real-time listeners for automation triggers
  useEffect(() => {
    console.log('🤖 Setting up CRM automation real-time listeners')
    
    const instanceId = Math.random().toString(36).substring(7);
    
    // Listen for new leads (for lead_created trigger)
    const leadsChannel = supabase
      .channel(`leads-changes-${instanceId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          console.log('📥 Real-time: New lead created:', payload.new)
          triggerAutomation('lead_created', { 
            lead_id: payload.new.id,
            customer_id: payload.new.id,
            lead_data: payload.new 
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Leads channel status:', status)
      })

    // Listen for lead status changes
    const leadsUpdateChannel = supabase
      .channel(`leads-updates-${instanceId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads' },
        (payload) => {
          console.log('📥 Real-time: Lead updated:', payload.new)
          
          const oldLead = payload.old
          const newLead = payload.new
          
          // Check for specific status changes
          if (oldLead.status !== newLead.status) {
            console.log(`🔄 Lead status changed: ${oldLead.status} → ${newLead.status}`)
            
            if (newLead.status === 'won') {
              console.log('🎉 Triggering contract_signed automation')
              triggerAutomation('contract_signed', {
                lead_id: newLead.id,
                customer_id: newLead.id,
                lead_data: newLead
              })
            }
            if (newLead.status === 'qualified') {
              console.log('🎯 Triggering lead_qualified automation')
              triggerAutomation('lead_qualified', {
                lead_id: newLead.id,
                customer_id: newLead.id,
                lead_data: newLead
              })
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Leads update channel status:', status)
      })

    // Listen for customer progress updates
    const progressChannel = supabase
      .channel(`progress-changes-${instanceId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'crm_customer_progress' },
        (payload) => {
          console.log('📥 Real-time: Progress updated:', payload.new)
          
          const newProgress = payload.new
          
          if (newProgress.status === 'completed') {
            console.log('🏁 Triggering workflow_completed automation')
            triggerAutomation('workflow_completed', {
              customer_id: newProgress.customer_id,
              progress_data: newProgress
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Progress channel status:', status)
      })

    return () => {
      console.log('🤖 Cleaning up CRM automation listeners')
      supabase.removeChannel(leadsChannel)
      supabase.removeChannel(leadsUpdateChannel)
      supabase.removeChannel(progressChannel)
    }
  }, [])

  // Manual trigger function for external use
  const manualTrigger = {
    leadCreated: (leadData: any) => {
      console.log('🔧 Manual trigger: lead_created', leadData)
      return triggerAutomation('lead_created', { 
        lead_id: leadData.id, 
        customer_id: leadData.id, 
        lead_data: leadData 
      })
    },
    contractSigned: (leadData: any) => {
      console.log('🔧 Manual trigger: contract_signed', leadData)
      return triggerAutomation('contract_signed', { 
        lead_id: leadData.id, 
        customer_id: leadData.id, 
        lead_data: leadData 
      })
    },
    leadQualified: (leadData: any) => {
      console.log('🔧 Manual trigger: lead_qualified', leadData)
      return triggerAutomation('lead_qualified', { 
        lead_id: leadData.id, 
        customer_id: leadData.id, 
        lead_data: leadData 
      })
    },
    inspectionFailed: (projectData: any) => {
      console.log('🔧 Manual trigger: inspection_failed', projectData)
      return triggerAutomation('inspection_failed', { 
        project_id: projectData.id, 
        project_data: projectData 
      })
    },
    paymentReceived: (paymentData: any) => {
      console.log('🔧 Manual trigger: payment_received', paymentData)
      return triggerAutomation('payment_received', { 
        payment_id: paymentData.id, 
        payment_data: paymentData 
      })
    }
  }

  return {
    triggerAutomation,
    manualTrigger
  }
}