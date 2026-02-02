import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUpdateIncident, Incident } from '@/hooks/useIncidents';
import { toast } from 'sonner';
import { FileText, Users, Shield, AlertCircle } from 'lucide-react';

interface IncidentDetailsTabProps {
  incident: Incident;
}

export function IncidentDetailsTab({ incident }: IncidentDetailsTabProps) {
  const updateIncident = useUpdateIncident();
  const [formData, setFormData] = useState({
    type: incident.type,
    classification: incident.classification || '',
    severity: incident.severity || 'low',
    description: incident.description || '',
    location: incident.location || '',
    cost_code: incident.cost_code || '',
    action_taken: incident.action_taken || '',
    corrective_steps: incident.corrective_steps || '',
    has_injury: incident.has_injury,
    injury_description: incident.injury_description || '',
    accepted_treatment: incident.accepted_treatment,
    treatment_description: incident.treatment_description || '',
    transported_to_hospital: incident.transported_to_hospital,
    hospital_description: incident.hospital_description || '',
    returned_to_work_same_day: incident.returned_to_work_same_day,
    return_description: incident.return_description || '',
    is_osha_violation: incident.is_osha_violation,
    osha_description: incident.osha_description || '',
    days_away_from_work: incident.days_away_from_work,
    days_job_transfer: incident.days_job_transfer,
    injury_type: incident.injury_type || '',
    status: incident.status,
  });

  const handleSave = async () => {
    try {
      await updateIncident.mutateAsync({
        id: incident.id,
        ...formData,
      });
      toast.success('Incident updated successfully');
    } catch (error) {
      toast.error('Failed to update incident');
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(f => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="write-up">Employee Write-Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Classification</Label>
                <Select value={formData.classification} onValueChange={(v) => setFormData(f => ({ ...f, classification: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="termination">Termination</SelectItem>
                    <SelectItem value="water intrusion">Water Intrusion</SelectItem>
                    <SelectItem value="near-miss">Near-Miss</SelectItem>
                    <SelectItem value="observation">Observation</SelectItem>
                    <SelectItem value="verbal">Verbal</SelectItem>
                    <SelectItem value="written">Written</SelectItem>
                    <SelectItem value="time off">Time Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Severity</Label>
                <Select value={formData.severity} onValueChange={(v) => setFormData(f => ({ ...f, severity: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe what happened..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>Location</Label>
                <Input 
                  value={formData.location}
                  onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                  placeholder="Where did this occur?"
                />
              </div>
              <div className="grid gap-2">
                <Label>Cost Code</Label>
                <Input 
                  value={formData.cost_code}
                  onChange={(e) => setFormData(f => ({ ...f, cost_code: e.target.value }))}
                  placeholder="Select cost code"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Action Taken
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Steps Taken to Correct</Label>
                <Textarea 
                  value={formData.corrective_steps}
                  onChange={(e) => setFormData(f => ({ ...f, corrective_steps: e.target.value }))}
                  placeholder="What corrective action was taken?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Observations */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Observations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Any Injuries?</Label>
                <Switch 
                  checked={formData.has_injury}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, has_injury: v }))}
                />
              </div>
              {formData.has_injury && (
                <Textarea 
                  value={formData.injury_description}
                  onChange={(e) => setFormData(f => ({ ...f, injury_description: e.target.value }))}
                  placeholder="Describe the injury..."
                  className="bg-green-50 dark:bg-green-950/20"
                />
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <Label>Accepted Treatment</Label>
                <Switch 
                  checked={formData.accepted_treatment}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, accepted_treatment: v }))}
                />
              </div>
              {formData.accepted_treatment && (
                <Textarea 
                  value={formData.treatment_description}
                  onChange={(e) => setFormData(f => ({ ...f, treatment_description: e.target.value }))}
                  placeholder="Describe treatment..."
                />
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <Label>Transported to Hospital</Label>
                <Switch 
                  checked={formData.transported_to_hospital}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, transported_to_hospital: v }))}
                />
              </div>
              {formData.transported_to_hospital && (
                <Textarea 
                  value={formData.hospital_description}
                  onChange={(e) => setFormData(f => ({ ...f, hospital_description: e.target.value }))}
                  placeholder="Hospital details..."
                />
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <Label>Returned to Work Same Day</Label>
                <Switch 
                  checked={formData.returned_to_work_same_day}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, returned_to_work_same_day: v }))}
                />
              </div>
              {formData.returned_to_work_same_day && (
                <Textarea 
                  value={formData.return_description}
                  onChange={(e) => setFormData(f => ({ ...f, return_description: e.target.value }))}
                  placeholder="Return details..."
                />
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <Label>OSHA Violation?</Label>
                <Switch 
                  checked={formData.is_osha_violation}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, is_osha_violation: v }))}
                />
              </div>
              {formData.is_osha_violation && (
                <Textarea 
                  value={formData.osha_description}
                  onChange={(e) => setFormData(f => ({ ...f, osha_description: e.target.value }))}
                  placeholder="Describe OSHA violation..."
                />
              )}
            </CardContent>
          </Card>

          {formData.has_injury && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  OSHA 300 Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Days Away From Work</Label>
                  <Input 
                    type="number"
                    value={formData.days_away_from_work}
                    onChange={(e) => setFormData(f => ({ ...f, days_away_from_work: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Days on Job Transfer or Restriction</Label>
                  <Input 
                    type="number"
                    value={formData.days_job_transfer}
                    onChange={(e) => setFormData(f => ({ ...f, days_job_transfer: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Injury Type</Label>
                  <Input 
                    value={formData.injury_type}
                    onChange={(e) => setFormData(f => ({ ...f, injury_type: e.target.value }))}
                    placeholder="Type of injury"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Select value={formData.status} onValueChange={(v) => setFormData(f => ({ ...f, status: v }))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under-review">Under Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSave} disabled={updateIncident.isPending}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
