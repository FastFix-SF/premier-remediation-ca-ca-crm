import { useState } from "react";
import { format } from "date-fns";
import { Plus, Search, ClipboardCheck, CheckCircle, XCircle, RotateCcw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useInspections, useCreateInspection, useUpdateInspection, Inspection } from "@/hooks/useInspections";
import { useProjectsWithPhotos } from "@/hooks/useProjectsWithPhotos";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import InspectionDetailView from "./InspectionDetailView";
import { toast } from "sonner";

const STATUS_COLUMNS = [
  { key: 'pass', label: 'Pass', icon: CheckCircle, color: 'bg-green-500' },
  { key: 'fail', label: 'Fail', icon: XCircle, color: 'bg-red-500' },
  { key: 're-inspect', label: 'Re-Inspect', icon: RotateCcw, color: 'bg-yellow-500' },
  { key: 'draft', label: 'Draft', icon: FileText, color: 'bg-gray-500' },
] as const;

export default function InspectionsKanban() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [draggedInspection, setDraggedInspection] = useState<Inspection | null>(null);
  const [formData, setFormData] = useState({
    project_id: "",
    inspection_type: "",
    agency: "",
    assigned_to: "",
    inspection_date: "",
    status: "draft" as Inspection["status"],
  });

  const { data: inspections = [], isLoading } = useInspections();
  const { projects = [] } = useProjectsWithPhotos();
  const { data: teamMembers = [] } = useTeamMembers();
  const createInspection = useCreateInspection();
  const updateInspection = useUpdateInspection();

  const filteredInspections = inspections.filter(
    (insp) =>
      insp.inspection_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insp.projects?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `Insp. #${insp.inspection_number}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInspectionsByStatus = (status: string) =>
    filteredInspections.filter((insp) => insp.status === status);

  const handleDragStart = (e: React.DragEvent, inspection: Inspection) => {
    setDraggedInspection(inspection);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Inspection["status"]) => {
    e.preventDefault();
    if (!draggedInspection || draggedInspection.status === newStatus) {
      setDraggedInspection(null);
      return;
    }

    try {
      await updateInspection.mutateAsync({
        id: draggedInspection.id,
        status: newStatus,
      });
      toast.success(`Inspection moved to ${newStatus}`);
    } catch {
      toast.error("Failed to update inspection");
    }
    setDraggedInspection(null);
  };

  const handleCreate = async () => {
    try {
      await createInspection.mutateAsync({
        project_id: formData.project_id || null,
        inspection_type: formData.inspection_type || null,
        agency: formData.agency || null,
        assigned_to: formData.assigned_to || null,
        inspection_date: formData.inspection_date || null,
        status: formData.status,
      });
      toast.success("Inspection created");
      setIsCreateDialogOpen(false);
      setFormData({
        project_id: "",
        inspection_type: "",
        agency: "",
        assigned_to: "",
        inspection_date: "",
        status: "draft",
      });
    } catch {
      toast.error("Failed to create inspection");
    }
  };

  if (selectedInspection) {
    return (
      <InspectionDetailView
        inspection={selectedInspection}
        onBack={() => setSelectedInspection(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inspections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Inspection
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((column) => {
            const columnInspections = getInspectionsByStatus(column.key);
            const Icon = column.icon;
            
            return (
              <div
                key={column.key}
                className="bg-muted/30 rounded-lg p-3 min-h-[400px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.key)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-1 h-6 rounded ${column.color}`} />
                  <h3 className="font-medium">{column.label}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {columnInspections.length}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {columnInspections.map((inspection) => (
                    <Card
                      key={inspection.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, inspection)}
                      onClick={() => setSelectedInspection(inspection)}
                      className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
                      style={{ borderLeftColor: column.color.replace('bg-', '') === 'green-500' ? '#22c55e' : column.color.replace('bg-', '') === 'red-500' ? '#ef4444' : column.color.replace('bg-', '') === 'yellow-500' ? '#eab308' : '#6b7280' }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {inspection.projects?.address || "No Address"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {inspection.inspection_type || "General Inspection"}
                            </p>
                            {inspection.inspection_date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(inspection.inspection_date), "MM/dd/yyyy")}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            Insp. #{inspection.inspection_number}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              New Inspection
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={formData.project_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, project_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Inspection Type</Label>
              <Select
                value={formData.inspection_type || "none"}
                onValueChange={(value) => setFormData({ ...formData, inspection_type: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Roof Inspection">Roof Inspection</SelectItem>
                  <SelectItem value="Safety Inspection">Safety Inspection</SelectItem>
                  <SelectItem value="Internal Safety Inspection">Internal Safety Inspection</SelectItem>
                  <SelectItem value="Final Inspection">Final Inspection</SelectItem>
                  <SelectItem value="Preliminary Inspection">Preliminary Inspection</SelectItem>
                  <SelectItem value="Tear Off Inspection">Tear Off Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Agency</Label>
              <Input
                value={formData.agency}
                onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                placeholder="e.g., Internal, County, City"
              />
            </div>

            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select
                value={formData.assigned_to || "none"}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Inspection Date</Label>
              <Input
                type="datetime-local"
                value={formData.inspection_date}
                onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Inspection["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                  <SelectItem value="re-inspect">Re-Inspect</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createInspection.isPending}>
              Create Inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
