import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AddIncidentDialog } from './AddIncidentDialog';

interface IncidentsTabProps {
  projectId: string;
}

export const IncidentsTab: React.FC<IncidentsTabProps> = ({ projectId }) => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddIncident, setShowAddIncident] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchIncidents();
  }, [projectId]);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('project_incidents')
        .select('*')
        .eq('project_id', projectId)
        .order('incident_date', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast({
        title: "Error",
        description: "Failed to load project incidents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleResolved = async (incidentId: string, resolved: boolean) => {
    try {
      const { error } = await supabase
        .from('project_incidents')
        .update({ resolved: !resolved })
        .eq('id', incidentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Incident marked as ${!resolved ? 'resolved' : 'unresolved'}`,
      });

      fetchIncidents();
    } catch (error) {
      console.error('Error updating incident:', error);
      toast({
        title: "Error",
        description: "Failed to update incident status",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'high':
        return 'bg-red-500/10 text-red-600 border-red-200';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-500/10 text-green-700 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'safety':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'quality':
        return <XCircle className="h-4 w-4 text-yellow-500" />;
      case 'weather':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'equipment':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (resolved: boolean) => {
    return resolved ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <Clock className="h-4 w-4 text-yellow-500" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Incidents Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{incidents.length}</div>
              <p className="text-sm text-muted-foreground">Total Incidents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {incidents.filter(i => !i.resolved).length}
              </div>
              <p className="text-sm text-muted-foreground">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {incidents.filter(i => i.resolved).length}
              </div>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length}
              </div>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <Button onClick={() => setShowAddIncident(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Report Incident
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {incidents.filter(i => !i.resolved).length} open incidents
        </div>
      </div>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
              <h3 className="text-lg font-medium mb-2">No Incidents Reported</h3>
              <p className="text-muted-foreground mb-4">
                Great! No safety or quality incidents have been reported for this project.
              </p>
              <Button onClick={() => setShowAddIncident(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Report First Incident
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Photos</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <span className="font-medium">
                        {new Date(incident.incident_date).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(incident.incident_type)}
                        <span className="capitalize">{incident.incident_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm truncate">
                        {incident.description}
                      </p>
                      {incident.follow_up && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Follow-up: {incident.follow_up}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(incident.resolved)}
                        <span className="text-sm">
                          {incident.resolved ? 'Resolved' : 'Open'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {incident.photos?.length || 0} photos
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleResolved(incident.id, incident.resolved)}
                      >
                        {incident.resolved ? 'Reopen' : 'Resolve'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Incidents - if any open incidents */}
      {incidents.filter(i => !i.resolved).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Open Incidents Requiring Attention</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incidents
                .filter(i => !i.resolved)
                .slice(0, 3)
                .map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(incident.incident_type)}
                      <div>
                        <div className="font-medium">{incident.description.substring(0, 80)}...</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(incident.incident_date).toLocaleDateString()} • {incident.incident_type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleResolved(incident.id, incident.resolved)}
                      >
                        Mark Resolved
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Incident Dialog */}
      <AddIncidentDialog
        open={showAddIncident}
        onOpenChange={setShowAddIncident}
        projectId={projectId}
        onIncidentAdded={fetchIncidents}
      />
    </div>
  );
};