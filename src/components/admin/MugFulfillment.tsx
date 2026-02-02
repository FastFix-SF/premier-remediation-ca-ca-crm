import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Package, CheckCircle, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface MugRequest {
  id: string
  project_address: string
  mug_accepted: boolean
  created_at: string
}

interface MugStats {
  total: number
  accepted: number
  declined: number
}

export default function MugFulfillment() {
  const [mugRequests, setMugRequests] = useState<MugRequest[]>([])
  const [stats, setStats] = useState<MugStats>({ total: 0, accepted: 0, declined: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchMugRequests()
    fetchStats()
  }, [])

  const fetchMugRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('mug_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMugRequests((data || []) as unknown as MugRequest[])
    } catch (error) {
      console.error('Error fetching mug requests:', error)
      toast({
        title: "Error",
        description: "Failed to fetch mug requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('mug_requests')
        .select('mug_accepted')

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        accepted: data?.filter(r => r.mug_accepted === true).length || 0,
        declined: data?.filter(r => r.mug_accepted === false).length || 0
      }
      setStats(stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }



  const filteredRequests = mugRequests.filter(request => {
    const matchesSearch = request.project_address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'accepted' && request.mug_accepted === true) ||
                         (statusFilter === 'declined' && request.mug_accepted === false)
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <div className="p-6">Loading mug fulfillment data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Declined</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.declined}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Mug Gift Requests</CardTitle>
          <CardDescription>
            Track customer responses to mug gift offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by project address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by response" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Responses</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requests Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Address</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Request Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.project_address}</TableCell>
                    <TableCell>
                      <Badge variant={request.mug_accepted ? "default" : "secondary"}>
                        {request.mug_accepted ? "Accepted" : "Declined"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No mug requests found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}