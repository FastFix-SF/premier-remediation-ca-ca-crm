import { useState } from "react";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Circle,
  MapPin,
  Calendar,
  User,
  MoreVertical,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Punchlist, 
  usePunchlistItems, 
  useCreatePunchlistItem,
  useUpdatePunchlistItem,
  useDeletePunchlistItem,
  useUpdatePunchlist
} from "@/hooks/usePunchlists";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { toast } from "sonner";

interface PunchlistDetailViewProps {
  punchlist: Punchlist;
  onBack: () => void;
}

export default function PunchlistDetailView({ punchlist, onBack }: PunchlistDetailViewProps) {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    location: "",
    assigned_to: "",
    priority: "medium",
    due_date: "",
  });

  const { data: items = [], isLoading } = usePunchlistItems(punchlist.id);
  const { data: teamMembers = [] } = useTeamMembers();
  const createItem = useCreatePunchlistItem();
  const updateItem = useUpdatePunchlistItem();
  const deleteItem = useDeletePunchlistItem();
  const updatePunchlist = useUpdatePunchlist();

  const completeCount = items.filter(i => i.status === 'completed').length;
  const incompleteCount = items.filter(i => i.status !== 'completed').length;

  const getTeamMemberName = (userId: string | null) => {
    if (!userId) return "-";
    const member = teamMembers.find(m => m.user_id === userId);
    return member?.full_name || "-";
  };

  const handleAddItem = async () => {
    if (!newItem.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      await createItem.mutateAsync({
        punchlist_id: punchlist.id,
        project_id: punchlist.project_id,
        title: newItem.title,
        description: newItem.description || undefined,
        location: newItem.location || undefined,
        assigned_to: newItem.assigned_to || undefined,
        priority: newItem.priority,
        due_date: newItem.due_date || undefined,
      });
      setNewItem({ title: "", description: "", location: "", assigned_to: "", priority: "medium", due_date: "" });
      setIsAddItemOpen(false);
      toast.success("Item added");
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleToggleComplete = async (item: typeof items[0]) => {
    const newStatus = item.status === 'completed' ? 'open' : 'completed';
    try {
      await updateItem.mutateAsync({
        id: item.id,
        punchlist_id: punchlist.id,
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      });
    } catch {
      toast.error("Failed to update item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem.mutateAsync({ id, punchlist_id: punchlist.id });
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const handleClosePunchlist = async () => {
    try {
      await updatePunchlist.mutateAsync({
        id: punchlist.id,
        status: punchlist.status === 'open' ? 'closed' : 'open',
      });
      toast.success(`Punchlist ${punchlist.status === 'open' ? 'closed' : 'reopened'}`);
    } catch {
      toast.error("Failed to update punchlist");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{punchlist.title}</h2>
            <Badge variant={punchlist.status === 'open' ? 'default' : 'secondary'}>
              {punchlist.status}
            </Badge>
            <Badge variant="outline">PL #{punchlist.punchlist_number}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {punchlist.projects?.address || "No project"}
          </p>
        </div>
        <Button variant="outline" onClick={handleClosePunchlist}>
          {punchlist.status === 'open' ? 'Close Punchlist' : 'Reopen Punchlist'}
        </Button>
        <Button onClick={() => setIsAddItemOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{items.length}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{completeCount}</p>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{incompleteCount}</p>
              <p className="text-sm text-muted-foreground">Incomplete</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Punchlist Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items yet. Add your first punchlist item.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={item.status === 'completed'}
                        onCheckedChange={() => handleToggleComplete(item)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.item_number}</TableCell>
                    <TableCell className={item.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getTeamMemberName(item.assigned_to)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(item.due_date), "MM/dd/yy")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.status === 'completed' ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Done
                        </Badge>
                      ) : (
                        <Badge variant="outline">Open</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Punchlist Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                placeholder="Enter item title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  placeholder="e.g., Kitchen, Roof"
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select
                  value={newItem.assigned_to || "none"}
                  onValueChange={(v) => setNewItem({ ...newItem, assigned_to: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newItem.priority}
                  onValueChange={(v) => setNewItem({ ...newItem, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newItem.due_date}
                  onChange={(e) => setNewItem({ ...newItem, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={createItem.isPending}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
