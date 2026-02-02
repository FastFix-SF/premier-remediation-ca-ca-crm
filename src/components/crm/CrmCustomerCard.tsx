import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CrmCustomerProgress } from '@/hooks/useCrmWorkflow'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  User,
  ArrowRight,
  MoreVertical
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface CrmCustomerCardProps {
  customer: CrmCustomerProgress
  onSelect: () => void
  isSelected: boolean
}

export const CrmCustomerCard: React.FC<CrmCustomerCardProps> = ({
  customer,
  onSelect,
  isSelected
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'google_search':
        return 'bg-blue-50 text-blue-700'
      case 'yelp':
        return 'bg-red-50 text-red-700'
      case 'social_media':
        return 'bg-purple-50 text-purple-700'
      case 'referrals':
        return 'bg-green-50 text-green-700'
      case 'ai_agent':
        return 'bg-orange-50 text-orange-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  const formatSource = (source?: string) => {
    if (!source) return 'Unknown'
    return source.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getNextAction = () => {
    if (customer.status === 'completed') return 'Project Complete'
    if (customer.status === 'cancelled') return 'Cancelled'
    if (customer.status === 'on_hold') return 'On Hold'
    
    // Based on current phase, suggest next action
    const currentPhase = customer.crm_workflow_phases?.name
    switch (currentPhase) {
      case 'Lead Capture':
        return 'Assign Sales Rep'
      case 'Sales Process':
        return 'Send Quote'
      case 'Contract Signed':
        return 'Collect Deposit'
      case 'Production':
        return 'Schedule Work'
      case 'Close-Out':
        return 'Final Invoice'
      default:
        return 'Update Status'
    }
  }

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {customer.leads?.name
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase() || 'UN'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-base">
                {customer.leads?.name || 'Unknown Customer'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(customer.status)}`}
                >
                  {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                </Badge>
                {customer.leads?.source && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getSourceColor(customer.leads.source)}`}
                  >
                    {formatSource(customer.leads.source)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2 text-sm">
          {customer.leads?.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{customer.leads.email}</span>
            </div>
          )}
          {customer.leads?.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{customer.leads.phone}</span>
            </div>
          )}
        </div>

        {/* Current Phase */}
        {customer.crm_workflow_phases && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Current Phase:</span>
              <Badge 
                style={{ 
                  backgroundColor: `${customer.crm_workflow_phases.color}20`,
                  color: customer.crm_workflow_phases.color,
                  borderColor: customer.crm_workflow_phases.color
                }}
                variant="outline"
              >
                {customer.crm_workflow_phases.name}
              </Badge>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">{customer.progress_percentage}%</span>
          </div>
          <Progress value={customer.progress_percentage} className="h-2" />
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Started {formatDistanceToNow(new Date(customer.started_at))} ago</span>
          </div>
          {customer.assigned_to && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Assigned</span>
            </div>
          )}
        </div>

        {/* Next Action */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Next Action:</div>
              <div className="text-sm font-medium">{getNextAction()}</div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}