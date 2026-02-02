import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUpdateSafetyMeeting, useSafetyMeetingAttendees, useCreateSafetyMeetingAttendee, useDeleteSafetyMeetingAttendee, SafetyMeeting } from '@/hooks/useSafetyMeetings';
import { toast } from 'sonner';
import { FileText, Users, Plus, X, PenLine } from 'lucide-react';

interface SafetyMeetingDetailsTabProps {
  meeting: SafetyMeeting;
}

export function SafetyMeetingDetailsTab({ meeting }: SafetyMeetingDetailsTabProps) {
  const updateMeeting = useUpdateSafetyMeeting();
  const { data: attendees = [] } = useSafetyMeetingAttendees(meeting.id);
  const createAttendee = useCreateSafetyMeetingAttendee();
  const deleteAttendee = useDeleteSafetyMeetingAttendee();
  
  const [formData, setFormData] = useState({
    topic: meeting.topic,
    topic_text: meeting.topic_text || '',
    meeting_date: meeting.meeting_date,
    meeting_time: meeting.meeting_time || '',
    location: meeting.location || '',
    meeting_type: meeting.meeting_type || 'group',
    meeting_leader_name: meeting.meeting_leader_name || '',
    cost_code: meeting.cost_code || '',
    status: meeting.status,
  });
  
  const [newAttendeeName, setNewAttendeeName] = useState('');

  const handleSave = async () => {
    try {
      await updateMeeting.mutateAsync({
        id: meeting.id,
        ...formData,
        completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
      });
      toast.success('Meeting updated successfully');
    } catch (error) {
      toast.error('Failed to update meeting');
    }
  };

  const handleAddAttendee = async () => {
    if (!newAttendeeName.trim()) return;
    
    const initials = newAttendeeName.split(' ').map(n => n[0]).join('').toUpperCase();
    
    try {
      await createAttendee.mutateAsync({
        meeting_id: meeting.id,
        employee_name: newAttendeeName.trim(),
        employee_initials: initials,
      });
      setNewAttendeeName('');
      toast.success('Attendee added');
    } catch (error) {
      toast.error('Failed to add attendee');
    }
  };

  const handleRemoveAttendee = async (attendeeId: string) => {
    try {
      await deleteAttendee.mutateAsync({ id: attendeeId, meetingId: meeting.id });
      toast.success('Attendee removed');
    } catch (error) {
      toast.error('Failed to remove attendee');
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Meeting Details */}
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
                <Label>Topic</Label>
                <Input 
                  value={formData.topic}
                  onChange={(e) => setFormData(f => ({ ...f, topic: e.target.value }))}
                  placeholder="Meeting topic"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input 
                    type="date"
                    value={formData.meeting_date}
                    onChange={(e) => setFormData(f => ({ ...f, meeting_date: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Time</Label>
                  <Input 
                    type="time"
                    value={formData.meeting_time}
                    onChange={(e) => setFormData(f => ({ ...f, meeting_time: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Meeting Leader</Label>
                <Input 
                  value={formData.meeting_leader_name}
                  onChange={(e) => setFormData(f => ({ ...f, meeting_leader_name: e.target.value }))}
                  placeholder="Leader name"
                />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={formData.meeting_type} onValueChange={(v) => setFormData(f => ({ ...f, meeting_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="toolbox">Toolbox Talk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Location</Label>
                <Input 
                  value={formData.location}
                  onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                  placeholder="Meeting location"
                />
              </div>
              <div className="grid gap-2">
                <Label>Cost Code</Label>
                <Input 
                  value={formData.cost_code}
                  onChange={(e) => setFormData(f => ({ ...f, cost_code: e.target.value }))}
                  placeholder="Cost code (optional)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Attendees */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Attendees ({attendees.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={newAttendeeName}
                  onChange={(e) => setNewAttendeeName(e.target.value)}
                  placeholder="Add attendee name"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAttendee()}
                />
                <Button size="icon" onClick={handleAddAttendee}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {attendees.map((attendee) => (
                  <Badge 
                    key={attendee.id} 
                    variant="secondary"
                    className="flex items-center gap-1 py-1.5 px-3"
                  >
                    <span className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium">
                      {attendee.employee_initials}
                    </span>
                    {attendee.employee_name}
                    <button 
                      onClick={() => handleRemoveAttendee(attendee.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Topic Text */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PenLine className="h-4 w-4 text-primary" />
                Topic Text / Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={formData.topic_text}
                onChange={(e) => setFormData(f => ({ ...f, topic_text: e.target.value }))}
                placeholder="Enter the safety meeting content, topics discussed, training material, etc."
                className="min-h-[400px] resize-none"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Signatures Section */}
      {attendees.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PenLine className="h-4 w-4 text-primary" />
              Signatures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {attendees.map((attendee) => (
                <div key={attendee.id} className="text-center">
                  <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                    {attendee.employee_initials}
                  </div>
                  <p className="mt-2 text-sm font-medium truncate">{attendee.employee_name}</p>
                  {attendee.signature_url ? (
                    <img src={attendee.signature_url} alt="Signature" className="h-8 mx-auto mt-1" />
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1 italic">No signature</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex justify-end gap-2">
        <Select value={formData.status} onValueChange={(v) => setFormData(f => ({ ...f, status: v }))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in-process">In Process</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSave} disabled={updateMeeting.isPending}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
