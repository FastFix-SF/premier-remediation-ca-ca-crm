import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, AlertTriangle, ShieldAlert, FileText, Users, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { format, differenceInDays, startOfYear } from 'date-fns';
import { useIncidents, useCreateIncident, Incident } from '@/hooks/useIncidents';
import { IncidentDetailsTab } from './tabs/IncidentDetailsTab';
import { IncidentFilesTab } from './tabs/IncidentFilesTab';
import { IncidentNotesTab } from './tabs/IncidentNotesTab';

const CLASSIFICATION_COLORS: Record<string, string> = {
  accident: 'bg-destructive text-destructive-foreground',
  termination: 'bg-destructive/80 text-destructive-foreground',
  'water intrusion': 'bg-blue-500 text-white',
  'near-miss': 'bg-yellow-500 text-black',
  observation: 'bg-muted text-muted-foreground',
  verbal: 'bg-orange-400 text-white',
  written: 'bg-orange-600 text-white',
  'time off': 'bg-purple-500 text-white',
};

export function IncidentsManager() {
  const { data: incidents = [], isLoading } = useIncidents();
  const createIncident = useCreateIncident();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i =>
      i.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.classification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [incidents, searchTerm]);

  // Stats calculations
  const stats = useMemo(() => {
    const yearStart = startOfYear(new Date());
    const thisYearIncidents = incidents.filter(i => new Date(i.incident_date) >= yearStart);
    const safetyIncidents = thisYearIncidents.filter(i => i.type === 'incident');
    const writeUps = thisYearIncidents.filter(i => i.type === 'write-up');
    const oshaViolations = thisYearIncidents.filter(i => i.is_osha_violation);
    const withInjuries = thisYearIncidents.filter(i => i.has_injury);
    
    // Days without incident
    const lastIncident = incidents
      .filter(i => i.type === 'incident')
      .sort((a, b) => new Date(b.incident_date).getTime() - new Date(a.incident_date).getTime())[0];
    const daysSinceLastIncident = lastIncident 
      ? differenceInDays(new Date(), new Date(lastIncident.incident_date))
      : 0;

    // By classification
    const byClassification: Record<string, number> = {};
    thisYearIncidents.forEach(i => {
      const key = i.classification || 'other';
      byClassification[key] = (byClassification[key] || 0) + 1;
    });

    return {
      total: thisYearIncidents.length,
      safetyIncidents: safetyIncidents.length,
      writeUps: writeUps.length,
      oshaViolations: oshaViolations.length,
      withInjuries: withInjuries.length,
      daysSinceLastIncident,
      byClassification,
    };
  }, [incidents]);

  const handleNewIncident = async () => {
    const result = await createIncident.mutateAsync({
      type: 'incident',
      incident_date: new Date().toISOString().split('T')[0],
      status: 'open',
    });
    setSelectedIncident(result as Incident);
    setDialogOpen(true);
    setActiveTab('details');
  };

  const handleOpenIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setDialogOpen(true);
    setActiveTab('details');
  };

  const getClassificationBadge = (classification: string | null) => {
    if (!classification) return null;
    const colorClass = CLASSIFICATION_COLORS[classification.toLowerCase()] || 'bg-muted text-muted-foreground';
    return <Badge className={colorClass}>{classification}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    if (type === 'write-up') {
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Write-Up</Badge>;
    }
    return <Badge variant="outline" className="border-destructive text-destructive">Incident</Badge>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Without</CardTitle>
            <ShieldAlert className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.daysSinceLastIncident}</div>
            <p className="text-xs text-muted-foreground">Safety Incidents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.safetyIncidents}</div>
            <p className="text-xs text-muted-foreground">This Year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Write-Ups</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.writeUps}</div>
            <p className="text-xs text-muted-foreground">This Year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Injuries</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withInjuries}</div>
            <p className="text-xs text-muted-foreground">This Year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OSHA Violations</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.oshaViolations}</div>
            <p className="text-xs text-muted-foreground">This Year</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleNewIncident}>
          <Plus className="mr-2 h-4 w-4" />
          New Incident
        </Button>
      </div>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No incidents found
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncidents.map((incident) => (
                  <TableRow 
                    key={incident.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleOpenIncident(incident)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(incident.incident_date), 'MM/dd/yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(incident.type)}</TableCell>
                    <TableCell>{getClassificationBadge(incident.classification)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {incident.location || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {incident.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={incident.status === 'resolved' ? 'default' : 'secondary'}
                        className={incident.status === 'open' ? 'bg-yellow-500 text-black' : ''}
                      >
                        {incident.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Incident Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {selectedIncident?.classification || 'Incident'} 
              {selectedIncident?.incident_number && ` - #${selectedIncident.incident_number}`}
            </DialogTitle>
          </DialogHeader>
          
          {selectedIncident && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(selectedIncident.incident_date), 'MM/dd/yyyy')}
              </span>
              {selectedIncident.incident_time && (
                <span>{selectedIncident.incident_time}</span>
              )}
              {getTypeBadge(selectedIncident.type)}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              {selectedIncident && <IncidentDetailsTab incident={selectedIncident} />}
            </TabsContent>

            <TabsContent value="files">
              {selectedIncident && <IncidentFilesTab incidentId={selectedIncident.id} />}
            </TabsContent>

            <TabsContent value="notes">
              {selectedIncident && <IncidentNotesTab incidentId={selectedIncident.id} />}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
