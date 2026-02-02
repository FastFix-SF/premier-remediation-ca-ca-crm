import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useCrmWorkflow } from '@/hooks/useCrmWorkflow'
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Play,
  X,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  FileText
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface CrmProgressTrackerProps {
  customerProgressId: string
  onClose: () => void
}

export const CrmProgressTracker: React.FC<CrmProgressTrackerProps> = ({
  customerProgressId,
  onClose
}) => {
  const { 
    customerProgress, 
    workflowPhases,
    getStepHistory,
    updateStepStatus,
    moveToNextPhase
  } = useCrmWorkflow()

  const stepHistory = getStepHistory(customerProgressId)
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState<{ [key: string]: string }>({})

  // We need to get phases differently since the view structure changed
  // Let's get all phases for now and filter based on workflow name if available
  const allPhases = workflowPhases || []
  const customer = customerProgress?.find(c => c.progress_id === customerProgressId)

  if (!customer || !allPhases) {
    return null
  }

  const togglePhaseExpansion = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId)
    } else {
      newExpanded.add(phaseId)
    }
    setExpandedPhases(newExpanded)
  }

  const getStepStatus = (stepId: string) => {
    return stepHistory.data?.find(h => h.step_id === stepId)?.status || 'pending'
  }

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Play className="h-5 w-5 text-blue-500" />
      case 'skipped':
        return <X className="h-5 w-5 text-gray-400" />
      default:
        return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'skipped':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    }
  }

  const handleStepStatusChange = async (stepId: string, newStatus: 'pending' | 'in_progress' | 'complete' | 'skipped') => {
    await updateStepStatus.mutateAsync({
      customerProgressId,
      stepId,
      status: newStatus,
      notes: notes[stepId] || undefined
    })
  }

  const isPhaseActive = (phaseId: string) => {
    return customer?.current_phase_name === allPhases.find(p => p.id === phaseId)?.name
  }

  const isPhaseComplete = (phaseOrder: number) => {
    return customer?.current_phase_order ? phaseOrder < customer.current_phase_order : false
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <span>Workflow Progress: {customer?.lead_name}</span>
              <div className="text-sm text-muted-foreground font-normal mt-1">
                {customer?.lead_email} • {customer?.pct}% Complete
              </div>
            </div>
            <Badge 
              className={`${customer?.status === 'active' ? 'bg-green-100 text-green-800' : 
                customer?.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'}`}
            >
              {customer?.status ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1) : 'Unknown'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {customer?.pct}% Complete
                </span>
              </div>
              <Progress value={customer?.pct || 0} className="h-3" />
            </div>

            {/* Phase Timeline */}
            <div className="space-y-4">
              {allPhases.map((phase, index) => {
                const isActive = isPhaseActive(phase.id)
                const isComplete = isPhaseComplete(phase.phase_order)
                const isExpanded = expandedPhases.has(phase.id)
                const steps = (phase as any).crm_workflow_steps || []

                return (
                  <div key={phase.id} className="space-y-2">
                    {/* Phase Header */}
                    <div 
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isActive ? 'border-primary bg-primary/5' :
                        isComplete ? 'border-green-200 bg-green-50' :
                        'border-gray-200 bg-gray-50'
                      }`}
                      onClick={() => togglePhaseExpansion(phase.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                            style={{ backgroundColor: phase.color }}
                          >
                            {phase.phase_order}
                          </div>
                          <div>
                            <h3 className="font-semibold">{phase.name}</h3>
                            {phase.description && (
                              <p className="text-sm text-muted-foreground">{phase.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isActive && (
                            <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                          )}
                          {isComplete && (
                            <Badge className="bg-green-100 text-green-800">Complete</Badge>
                          )}
                          {isExpanded ? 
                            <ChevronDown className="h-5 w-5" /> : 
                            <ChevronRight className="h-5 w-5" />
                          }
                        </div>
                      </div>
                    </div>

                    {/* Phase Steps */}
                    {isExpanded && (
                      <div className="ml-6 space-y-3">
                        {steps.map((step: any) => {
                          const stepStatus = getStepStatus(step.id)
                          const stepHistoryItem = stepHistory.data?.find(h => h.step_id === step.id)

                          return (
                            <div key={step.id} className="p-3 bg-white rounded-lg border">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  {getStepStatusIcon(stepStatus)}
                                  <div className="flex-1">
                                    <h4 className="font-medium">{step.name}</h4>
                                    {step.description && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {step.description}
                                      </p>
                                    )}
                                    
                                    {/* Step History Info */}
                                    {stepHistoryItem && (
                                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                        {stepHistoryItem.started_at && (
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            <span>Started: {format(new Date(stepHistoryItem.started_at), 'MMM d, yyyy h:mm a')}</span>
                                          </div>
                                        )}
                                        {stepHistoryItem.completed_at && (
                                          <div className="flex items-center gap-2">
                                            <CheckCircle className="h-3 w-3" />
                                            <span>Completed: {format(new Date(stepHistoryItem.completed_at), 'MMM d, yyyy h:mm a')}</span>
                                          </div>
                                        )}
                                        {stepHistoryItem.notes && (
                                          <div className="flex items-start gap-2">
                                            <FileText className="h-3 w-3 mt-0.5" />
                                            <span>{stepHistoryItem.notes}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Notes Input */}
                                    {stepStatus === 'in_progress' && (
                                      <div className="mt-3 space-y-2">
                                        <Textarea
                                          placeholder="Add notes for this step..."
                                          value={notes[step.id] || ''}
                                          onChange={(e) => setNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
                                          className="text-sm"
                                          rows={2}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 ml-3">
                                  <Badge 
                                    className={`text-xs ${getStepStatusColor(stepStatus)}`}
                                    variant="outline"
                                  >
                                    {stepStatus.charAt(0).toUpperCase() + stepStatus.slice(1)}
                                  </Badge>
                                  
                                  {/* Action Buttons */}
                                  {isActive && (
                                    <div className="flex space-x-1">
                                      {stepStatus === 'pending' && (
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => handleStepStatusChange(step.id, 'in_progress')}
                                        >
                                          Start
                                        </Button>
                                      )}
                                      {stepStatus === 'in_progress' && (
                                        <Button 
                                          size="sm"
                                          onClick={() => handleStepStatusChange(step.id, 'complete')}
                                        >
                                          Complete
                                        </Button>
                                      )}
                                      {stepStatus !== 'skipped' && stepStatus !== 'complete' && (
                                        <Button 
                                          size="sm" 
                                          variant="ghost"
                                          onClick={() => handleStepStatusChange(step.id, 'skipped')}
                                        >
                                          Skip
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {customer?.status === 'active' && (
                <Button 
                  onClick={() => moveToNextPhase.mutateAsync(customerProgressId)}
                  disabled={moveToNextPhase.isPending}
                >
                  {moveToNextPhase.isPending ? 'Moving...' : 'Move to Next Phase'}
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}