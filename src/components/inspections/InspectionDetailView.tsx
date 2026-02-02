import { useState } from "react";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  FileText, 
  FolderOpen, 
  StickyNote, 
  CheckSquare, 
  Plus, 
  Trash2, 
  ExternalLink,
  Share2,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Inspection, 
  useInspectionChecklistItems, 
  useInspectionFiles, 
  useInspectionNotes,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
  useCreateInspectionNote,
  useDeleteInspectionNote,
  useUpdateInspection
} from "@/hooks/useInspections";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { toast } from "sonner";

interface InspectionDetailViewProps {
  inspection: Inspection;
  onBack: () => void;
}

export default function InspectionDetailView({ inspection, onBack }: InspectionDetailViewProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newNote, setNewNote] = useState({ title: "", content: "" });

  const { data: checklistItems = [] } = useInspectionChecklistItems(inspection.id);
  const { data: files = [] } = useInspectionFiles(inspection.id);
  const { data: notes = [] } = useInspectionNotes(inspection.id);
  const { data: teamMembers = [] } = useTeamMembers();

  const createChecklistItem = useCreateChecklistItem();
  const updateChecklistItem = useUpdateChecklistItem();
  const deleteChecklistItem = useDeleteChecklistItem();
  const createNote = useCreateInspectionNote();
  const deleteNote = useDeleteInspectionNote();
  const updateInspection = useUpdateInspection();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-500';
      case 'fail': return 'bg-red-500';
      case 're-inspect': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTeamMemberName = (userId: string | null) => {
    if (!userId) return "-";
    const member = teamMembers.find(m => m.user_id === userId);
    return member?.full_name || "-";
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;
    try {
      await createChecklistItem.mutateAsync({
        inspection_id: inspection.id,
        item_name: newChecklistItem.trim(),
      });
      setNewChecklistItem("");
      toast.success("Checklist item added");
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleToggleChecklistItem = async (item: typeof checklistItems[0]) => {
    try {
      await updateChecklistItem.mutateAsync({
        id: item.id,
        inspection_id: inspection.id,
        is_completed: !item.is_completed,
        completed_date: !item.is_completed ? new Date().toISOString().split('T')[0] : null,
      });
    } catch {
      toast.error("Failed to update item");
    }
  };

  const handleDeleteChecklistItem = async (id: string) => {
    try {
      await deleteChecklistItem.mutateAsync({ id, inspection_id: inspection.id });
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.content.trim()) return;
    try {
      await createNote.mutateAsync({
        inspection_id: inspection.id,
        title: newNote.title || undefined,
        content: newNote.content,
      });
      setNewNote({ title: "", content: "" });
      setIsAddNoteOpen(false);
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote.mutateAsync({ id, inspection_id: inspection.id });
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">
              {inspection.projects?.address || "No Address"}
            </h2>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`${getStatusColor(inspection.status)} text-white`}>
              {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Insp. #{inspection.inspection_number}
            </span>
          </div>
        </div>
        <Button variant="outline" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <div className="flex gap-4">
        <div className="w-48 shrink-0">
          <div className="space-y-1">
            {[
              { key: "details", label: "Details", icon: FileText },
              { key: "files", label: "Files", icon: FolderOpen },
              { key: "notes", label: "Notes", icon: StickyNote },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {activeTab === "details" && (
            <>
              {/* Details Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-500" />
                      Details
                    </CardTitle>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox 
                        checked={inspection.share_with_client}
                        onCheckedChange={async (checked) => {
                          await updateInspection.mutateAsync({
                            id: inspection.id,
                            share_with_client: !!checked,
                          });
                        }}
                      />
                      <Share2 className="h-4 w-4" />
                      Share with Client
                    </label>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{inspection.inspection_type || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Agency</p>
                    <p className="font-medium">{inspection.agency || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inspected By</p>
                    <p className="font-medium">{getTeamMemberName(inspection.inspected_by)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date/Time</p>
                    <p className="font-medium">
                      {inspection.inspection_date 
                        ? format(new Date(inspection.inspection_date), "MM/dd/yyyy h:mm a")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned To</p>
                    <p className="font-medium">{getTeamMemberName(inspection.assigned_to)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Corrections Needed</p>
                    <p className="font-medium text-muted-foreground italic">
                      {inspection.corrections_needed || "None"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Permit Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    Permit Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Permit #</p>
                    <p className="font-medium text-muted-foreground italic">
                      {inspection.permit_number || "Select Permit #"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Permit Expiry Date</p>
                    <p className="font-medium text-muted-foreground italic">
                      {inspection.permit_expiry_date || "Select Date"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Permit Type</p>
                    <p className="font-medium text-muted-foreground italic">
                      {inspection.permit_type || "Permit Type"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Checklist */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-blue-500" />
                    Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 text-xs text-muted-foreground font-medium border-b pb-2">
                      <div></div>
                      <div>Check Item Once it is Completed</div>
                      <div>Assigned To</div>
                      <div>Due Date</div>
                      <div>Date Completed</div>
                    </div>
                    
                    {checklistItems.map((item) => (
                      <div 
                        key={item.id}
                        className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center py-2 border-b last:border-0"
                      >
                        <Checkbox
                          checked={item.is_completed}
                          onCheckedChange={() => handleToggleChecklistItem(item)}
                        />
                        <span className={item.is_completed ? "line-through text-muted-foreground" : ""}>
                          {item.item_name}
                        </span>
                        <span className="text-sm text-muted-foreground">-</span>
                        <span className="text-sm text-muted-foreground">
                          {item.due_date || "Select Date"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {item.completed_date || "Select Date"}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleDeleteChecklistItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox disabled />
                      <Input
                        placeholder="Add Inspection Task"
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                        className="h-8"
                      />
                      <Button size="sm" variant="ghost" onClick={handleAddChecklistItem}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "files" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                  Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Button variant="outline" className="h-20 w-20">
                      <Plus className="h-8 w-8" />
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      Click to upload files
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {files.map((file) => (
                      <Card key={file.id} className="p-4">
                        <p className="text-sm truncate">{file.file_name}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "notes" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-blue-500" />
                    Notes
                  </CardTitle>
                  <Button size="sm" onClick={() => setIsAddNoteOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Note
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <StickyNote className="h-12 w-12 mb-4" />
                    <p>No Records Available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <Card key={note.id} className="p-4">
                        <div className="flex justify-between">
                          <div>
                            {note.title && <h4 className="font-medium">{note.title}</h4>}
                            <p className="text-sm text-muted-foreground">{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(note.created_at), "MM/dd/yyyy h:mm a")}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-4">
        <span>Created: {format(new Date(inspection.created_at), "MM/dd/yyyy")}</span>
        <span>{format(new Date(inspection.created_at), "h:mm a")}</span>
      </div>

      {/* Add Note Dialog */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote}>Add Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
