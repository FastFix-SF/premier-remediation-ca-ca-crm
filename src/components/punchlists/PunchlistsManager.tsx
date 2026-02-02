import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Plus, Search, ClipboardList, CheckCircle, Circle, Filter, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { usePunchlists, useCreatePunchlist, Punchlist } from "@/hooks/usePunchlists";
import { useProjectsWithPhotos } from "@/hooks/useProjectsWithPhotos";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import PunchlistDetailView from "./PunchlistDetailView";
import { toast } from "sonner";

export default function PunchlistsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [viewTab, setViewTab] = useState<"all" | "my">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPunchlist, setSelectedPunchlist] = useState<Punchlist | null>(null);
  const [formData, setFormData] = useState({
    project_id: "",
    title: "",
    description: "",
  });

  const { data: punchlists = [], isLoading } = usePunchlists();
  const { projects = [] } = useProjectsWithPhotos();
  const { data: teamMembers = [] } = useTeamMembers();
  const createPunchlist = useCreatePunchlist();

  // Filter punchlists
  const filteredPunchlists = useMemo(() => {
    return punchlists.filter((pl) => {
      const matchesSearch = 
        pl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pl.projects?.address?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || pl.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [punchlists, searchTerm, statusFilter]);

  // Analytics
  const stats = useMemo(() => {
    const totalItems = punchlists.reduce((acc, pl) => acc + (pl.items_count || 0), 0);
    const completeItems = punchlists.reduce((acc, pl) => acc + (pl.complete_count || 0), 0);
    const openPunchlists = punchlists.filter(pl => pl.status === 'open').length;
    const closedPunchlists = punchlists.filter(pl => pl.status === 'closed').length;
    
    // Group by project
    const byProject = punchlists.reduce((acc, pl) => {
      const addr = pl.projects?.address || 'Unknown';
      if (!acc[addr]) acc[addr] = { count: 0, items: 0 };
      acc[addr].count++;
      acc[addr].items += pl.items_count || 0;
      return acc;
    }, {} as Record<string, { count: number; items: number }>);
    
    return { totalItems, completeItems, openPunchlists, closedPunchlists, byProject };
  }, [punchlists]);

  const handleCreate = async () => {
    if (!formData.project_id || !formData.title) {
      toast.error("Project and Title are required");
      return;
    }
    try {
      await createPunchlist.mutateAsync(formData);
      toast.success("Punchlist created");
      setIsCreateDialogOpen(false);
      setFormData({ project_id: "", title: "", description: "" });
    } catch {
      toast.error("Failed to create punchlist");
    }
  };

  if (selectedPunchlist) {
    return (
      <PunchlistDetailView
        punchlist={selectedPunchlist}
        onBack={() => setSelectedPunchlist(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search punchlists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Punchlist
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Open Items by Project */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Open Items by Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(stats.byProject).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.byProject).slice(0, 4).map(([project, data]) => (
                  <div key={project} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[150px]">{project}</span>
                    <div className="flex gap-4">
                      <span>{data.count}</span>
                      <span className="text-muted-foreground">{data.items}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Items Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.completeItems}/{stats.totalItems}</span>
                <span className="text-sm text-muted-foreground">items complete</span>
              </div>
              <Progress 
                value={stats.totalItems > 0 ? (stats.completeItems / stats.totalItems) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Items by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Items by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center">
                  <div>
                    <p className="text-lg font-bold">{stats.closedPunchlists}</p>
                    <p className="text-xs text-muted-foreground">Closed</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                  <span className="text-sm">Open ({stats.openPunchlists})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3 fill-blue-500 text-blue-500" />
                  <span className="text-sm">Closed ({stats.closedPunchlists})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as "all" | "my")}>
          <TabsList>
            <TabsTrigger value="all">All Punchlists</TabsTrigger>
            <TabsTrigger value="my">My Punchlists</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button
            variant={statusFilter === "open" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("open")}
          >
            Open
          </Button>
          <Button
            variant={statusFilter === "closed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("closed")}
          >
            Closed
          </Button>
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredPunchlists.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No punchlists found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-center"># Incomplete</TableHead>
                <TableHead className="text-center"># Complete</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPunchlists.map((punchlist) => (
                <TableRow
                  key={punchlist.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedPunchlist(punchlist)}
                >
                  <TableCell className="text-sm">
                    {format(new Date(punchlist.created_at), "MM/dd/yyyy")}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {punchlist.projects?.address || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {punchlist.projects?.project_type || "-"}
                  </TableCell>
                  <TableCell>{punchlist.title}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="destructive" className="font-mono">
                      {punchlist.incomplete_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono bg-green-100 text-green-800">
                      {punchlist.complete_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={punchlist.status === 'open' ? 'default' : 'secondary'}>
                      {punchlist.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Add Punchlist
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="custom" className="flex-1">Custom</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select
                    value={formData.project_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select Project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Punchlist #</Label>
                  <Input value="Auto-generated" disabled />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input value="Open" disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="py-8 text-center text-muted-foreground">
              Custom fields coming soon
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createPunchlist.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
