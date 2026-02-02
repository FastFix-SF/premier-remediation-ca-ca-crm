import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useCrmWorkflow } from '@/hooks/useCrmWorkflow'
import { 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  User,
  Calendar
} from 'lucide-react'

export const TeamActivityFeed = () => {
  const { customerProgress } = useCrmWorkflow()

  // Generate activity feed from recent progress updates
  const recentActivities = React.useMemo(() => {
    if (!customerProgress) return []

    // Sort by most recent activity and take top 10
    return customerProgress
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
      .map(customer => ({
        id: customer.progress_id,
        type: 'phase_update',
        customerName: customer.lead_name,
        currentPhase: customer.current_phase_name,
        assignedTo: customer.assigned_user_email,
        timestamp: customer.updated_at,
        progress: customer.pct
      }))
  }, [customerProgress])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'phase_update': return <ArrowRight className="h-4 w-4" />
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'assigned': return <User className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Team Activity Feed
        </CardTitle>
        <CardDescription>
          Recent workflow updates and team activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {activity.customerName}
                    </p>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {activity.currentPhase}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {activity.progress}% complete
                    </span>
                  </div>
                  {activity.assignedTo && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      {activity.assignedTo}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}