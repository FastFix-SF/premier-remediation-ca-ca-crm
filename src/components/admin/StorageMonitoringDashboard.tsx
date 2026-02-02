import { useStorageMonitoring } from '@/hooks/useStorageMonitoring'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, HardDrive, Image, TrendingUp, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export const StorageMonitoringDashboard = () => {
  const { metrics, isLoading, error, refetch } = useStorageMonitoring()

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Failed to load storage metrics
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const storageUsagePercent = (metrics.totalSizeMB / 1024) * 100 // Assuming 1GB limit
  const getStorageColor = () => {
    if (storageUsagePercent > 80) return 'destructive'
    if (storageUsagePercent > 60) return 'secondary'
    return 'default'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Storage Monitoring
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <Image className="w-4 h-4" />
              Total Photos
            </div>
            <div className="text-2xl font-bold">{metrics.totalPhotos.toLocaleString()}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <HardDrive className="w-4 h-4" />
              Storage Used
            </div>
            <div className="text-2xl font-bold">{metrics.totalSizeMB} MB</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              Avg Photo Size
            </div>
            <div className="text-2xl font-bold">{metrics.avgPhotoSize} KB</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              Recent Uploads
            </div>
            <div className="text-2xl font-bold">{metrics.recentUploads}</div>
            <div className="text-xs text-muted-foreground">Last 24h</div>
          </div>
        </div>

        {/* Storage Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Storage Usage</span>
            <Badge variant={getStorageColor()}>
              {storageUsagePercent.toFixed(1)}% used
            </Badge>
          </div>
          <Progress 
            value={Math.min(storageUsagePercent, 100)} 
            className="h-2"
          />
          <div className="text-xs text-muted-foreground">
            {metrics.totalSizeMB} MB of ~1024 MB used
          </div>
        </div>

        {/* Project Distribution */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Photos by Project</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {Object.entries(metrics.photosByProject)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([projectId, count]) => (
                <div key={projectId} className="flex justify-between text-sm">
                  <span className="truncate max-w-48">Project {projectId.slice(-8)}</span>
                  <Badge variant="secondary">{count} photos</Badge>
                </div>
              ))}
          </div>
        </div>

        {/* Alerts */}
        {storageUsagePercent > 80 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="text-sm font-medium text-destructive">Storage Warning</div>
            <div className="text-xs text-destructive/80 mt-1">
              Storage usage is above 80%. Consider upgrading your plan or cleaning up old files.
            </div>
          </div>
        )}
        
        {metrics.recentUploads > 50 && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="text-sm font-medium text-warning">High Upload Activity</div>
            <div className="text-xs text-warning/80 mt-1">
              {metrics.recentUploads} photos uploaded in the last 24 hours. Monitor bandwidth usage.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}