import React, { useState } from 'react';
import { Plus, Trash2, Users, Eye, HardHat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DailyLogPerson,
  DailyLogVisitor,
  DailyLogSubcontractor,
  useAddDailyLogPerson,
  useAddDailyLogVisitor,
  useAddDailyLogSubcontractor,
  useDeleteDailyLogPerson,
  useDeleteDailyLogVisitor,
  useDeleteDailyLogSubcontractor,
} from '@/hooks/useDailyLogs';

interface PeopleTabProps {
  dailyLogId: string;
  people: DailyLogPerson[];
  visitors: DailyLogVisitor[];
  subcontractors: DailyLogSubcontractor[];
}

export const PeopleTab: React.FC<PeopleTabProps> = ({
  dailyLogId,
  people,
  visitors,
  subcontractors,
}) => {
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [addVisitorOpen, setAddVisitorOpen] = useState(false);
  const [addSubOpen, setAddSubOpen] = useState(false);

  const [personName, setPersonName] = useState('');
  const [personHours, setPersonHours] = useState('');
  const [personCostCode, setPersonCostCode] = useState('');

  const [visitorName, setVisitorName] = useState('');
  const [visitorCompany, setVisitorCompany] = useState('');
  const [visitorPurpose, setVisitorPurpose] = useState('');

  const [subCompany, setSubCompany] = useState('');
  const [subContact, setSubContact] = useState('');
  const [subWorkers, setSubWorkers] = useState('');
  const [subWork, setSubWork] = useState('');

  const addPersonMutation = useAddDailyLogPerson();
  const addVisitorMutation = useAddDailyLogVisitor();
  const addSubMutation = useAddDailyLogSubcontractor();
  const deletePersonMutation = useDeleteDailyLogPerson();
  const deleteVisitorMutation = useDeleteDailyLogVisitor();
  const deleteSubMutation = useDeleteDailyLogSubcontractor();

  const handleAddPerson = async () => {
    await addPersonMutation.mutateAsync({
      daily_log_id: dailyLogId,
      employee_name: personName,
      hours_worked: personHours ? parseFloat(personHours) : null,
      cost_code: personCostCode || null,
      user_id: null,
      notes: null,
    });
    setPersonName('');
    setPersonHours('');
    setPersonCostCode('');
    setAddPersonOpen(false);
  };

  const handleAddVisitor = async () => {
    await addVisitorMutation.mutateAsync({
      daily_log_id: dailyLogId,
      visitor_name: visitorName,
      company: visitorCompany || null,
      purpose: visitorPurpose || null,
      arrival_time: null,
      departure_time: null,
      notes: null,
    });
    setVisitorName('');
    setVisitorCompany('');
    setVisitorPurpose('');
    setAddVisitorOpen(false);
  };

  const handleAddSub = async () => {
    await addSubMutation.mutateAsync({
      daily_log_id: dailyLogId,
      company_name: subCompany,
      contact_name: subContact || null,
      workers_count: subWorkers ? parseInt(subWorkers) : 0,
      work_performed: subWork || null,
      notes: null,
    });
    setSubCompany('');
    setSubContact('');
    setSubWorkers('');
    setSubWork('');
    setAddSubOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Employees on Site */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Employees on Site ({people.length})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddPersonOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {people.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {people.map((person) => (
                <Badge
                  key={person.id}
                  variant="secondary"
                  className="flex items-center gap-2 py-1.5 px-3"
                >
                  <span>{person.employee_name}</span>
                  {person.hours_worked && (
                    <span className="text-muted-foreground">({person.hours_worked}h)</span>
                  )}
                  <button
                    onClick={() =>
                      deletePersonMutation.mutate({ id: person.id, dailyLogId })
                    }
                    className="hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No employees recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Visitors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Visitors ({visitors.length})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddVisitorOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {visitors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell className="font-medium">{visitor.visitor_name}</TableCell>
                    <TableCell>{visitor.company || '-'}</TableCell>
                    <TableCell>{visitor.purpose || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          deleteVisitorMutation.mutate({ id: visitor.id, dailyLogId })
                        }
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No visitors recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Subcontractors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <HardHat className="w-4 h-4" />
            Subcontractors ({subcontractors.length})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddSubOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {subcontractors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Workers</TableHead>
                  <TableHead>Work Performed</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcontractors.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.company_name}</TableCell>
                    <TableCell>{sub.contact_name || '-'}</TableCell>
                    <TableCell>{sub.workers_count}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {sub.work_performed || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          deleteSubMutation.mutate({ id: sub.id, dailyLogId })
                        }
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No subcontractors recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Add Person Dialog */}
      <Dialog open={addPersonOpen} onOpenChange={setAddPersonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Employee name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hours Worked</Label>
                <Input
                  type="number"
                  value={personHours}
                  onChange={(e) => setPersonHours(e.target.value)}
                  placeholder="8"
                />
              </div>
              <div className="space-y-2">
                <Label>Cost Code</Label>
                <Input
                  value={personCostCode}
                  onChange={(e) => setPersonCostCode(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPersonOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPerson} disabled={!personName}>
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Visitor Dialog */}
      <Dialog open={addVisitorOpen} onOpenChange={setAddVisitorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Visitor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Visitor name"
              />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                value={visitorCompany}
                onChange={(e) => setVisitorCompany(e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Input
                value={visitorPurpose}
                onChange={(e) => setVisitorPurpose(e.target.value)}
                placeholder="Reason for visit"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddVisitorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVisitor} disabled={!visitorName}>
              Add Visitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subcontractor Dialog */}
      <Dialog open={addSubOpen} onOpenChange={setAddSubOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subcontractor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={subCompany}
                onChange={(e) => setSubCompany(e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  value={subContact}
                  onChange={(e) => setSubContact(e.target.value)}
                  placeholder="Contact person"
                />
              </div>
              <div className="space-y-2">
                <Label>Number of Workers</Label>
                <Input
                  type="number"
                  value={subWorkers}
                  onChange={(e) => setSubWorkers(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Work Performed</Label>
              <Input
                value={subWork}
                onChange={(e) => setSubWork(e.target.value)}
                placeholder="Description of work"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSubOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSub} disabled={!subCompany}>
              Add Subcontractor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
