import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useCrmWorkflow } from '@/hooks/useCrmWorkflow'
import { 
  Users, 
  Target, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

export const TeamPerformanceMetrics = () => {
  const { customerProgress } = useCrmWorkflow()

  // Calculate team performance metrics
  const teamMetrics = React.useMemo(() => {
    if (!customerProgress) return []

    // Group customers by assigned user
    const userGroups = customerProgress.reduce((acc, customer) => {
      const userId = customer.assigned_to || 'unassigned'
      const userEmail = customer.assigned_user_email || 'Unassigned'
      
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userEmail,
          customers: [],
          totalCustomers: 0,
          activeCustomers: 0,
          completedCustomers: 0,
          avgProgress: 0,
          overdueCustomers: 0
        }
      }
      
      acc[userId].customers.push(customer)
      return acc
    }, {} as Record<string, any>)

    // Calculate metrics for each user
    return Object.values(userGroups).map((group: any) => {
      const totalCustomers = group.customers.length
      const activeCustomers = group.customers.filter((c: any) => c.status === 'active').length
      const completedCustomers = group.customers.filter((c: any) => c.status === 'completed').length
      const avgProgress = totalCustomers > 0 
        ? Math.round(group.customers.reduce((sum: number, c: any) => sum + (c.pct || 0), 0) / totalCustomers)
        : 0

      // Calculate overdue (customers in same phase for more than 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const overdueCustomers = group.customers.filter((c: any) => 
        c.status === 'active' && new Date(c.updated_at) < sevenDaysAgo
      ).length

      return {
        ...group,
        totalCustomers,
        activeCustomers,
        completedCustomers,
        avgProgress,
        overdueCustomers,
        completionRate: totalCustomers > 0 ? Math.round((completedCustomers / totalCustomers) * 100) : 0
      }
    }).sort((a, b) => b.totalCustomers - a.totalCustomers)
  }, [customerProgress])

  const getPerformanceColor = (avgProgress: number) => {
    if (avgProgress >= 75) return 'text-green-600'
    if (avgProgress >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Performance
        </CardTitle>
        <CardDescription>
          Individual team member performance and workload distribution
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {teamMetrics.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No team performance data available</p>
            </div>
          ) : (
            teamMetrics.map((member) => (
              <div key={member.userId} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{member.userEmail}</h4>
                    <p className="text-sm text-muted-foreground">
                      {member.totalCustomers} total customers
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.overdueCustomers > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {member.overdueCustomers} overdue
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {member.completionRate}% completion rate
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{member.activeCustomers}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{member.completedCustomers}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${getPerformanceColor(member.avgProgress)}`}>
                      {member.avgProgress}%
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Progress</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{member.overdueCustomers}</div>
                    <div className="text-xs text-muted-foreground">Overdue</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className={getPerformanceColor(member.avgProgress)}>
                      {member.avgProgress}%
                    </span>
                  </div>
                  <Progress value={member.avgProgress} className="h-2" />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}