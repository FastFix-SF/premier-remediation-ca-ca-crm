import React, { useState } from 'react';
import { useWorkOrders, useUpdateWorkOrder, useCreateWorkOrder, useDeleteWorkOrder, WorkOrder, WorkOrderStatus } from '@/hooks/useWorkOrders';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, GripVertical, DollarSign, MapPin, FileText } from 'lucide-react';
import { useProjectsWithPhotos } from '@/hooks/useProjectsWithPhotos';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import WorkOrderDetailView from './WorkOrderDetailView';

const STATUS_COLUMNS: { status: WorkOrderStatus; label: string; color: string }[] = [
  { status: 'open', label: 'Open', color: 'bg-blue-500' },
  { status: 'estimating', label: 'Estimating', color: 'bg-yellow-500' },
  { status: 'submitted', label: 'Submitted', color: 'bg-orange-500' },
  { status: 'approved', label: 'Approved', color: 'bg-green-500' },
  { status: 'complete', label: 'Complete', color: 'bg-emerald-600' },
  { status: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

interface FormData {
  title: string;
  description: string;
  location: string;
  project_id: string;
  assigned_to: string;
  assigned_to_name: string;
  service_start_date: string;
  service_end_date: string;
}

const WorkOrdersKanban: React.FC = () => {
  const { data: workOrders = [], isLoading } = useWorkOrders();
  const { projects = [] } = useProjectsWithPhotos();
  const { data: teamMembers = [] } = useTeamMembers();
  const createWorkOrder = useCreateWorkOrder();
  const updateWorkOrder = useUpdateWorkOrder();
  const deleteWorkOrder = useDeleteWorkOrder();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    location: '',
    project_id: '',
    assigned_to: '',
    assigned_to_name: '',
    service_start_date: '',
    service_end_date: ''
  });

  const handleDragStart = (e: React.DragEvent, workOrderId: string) => {
    setDraggedItem(workOrderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: WorkOrderStatus) => {
    e.preventDefault();
    if (draggedItem) {
      updateWorkOrder.mutate({ id: draggedItem, status: newStatus });
      setDraggedItem(null);
    }
  };

  const handleCreate = () => {
    if (!formData.title.trim()) return;
    
    createWorkOrder.mutate({
      title: formData.title,
      description: formData.description || null,
      location: formData.location || null,
      project_id: formData.project_id || null,
      assigned_to: formData.assigned_to || null,
      assigned_to_name: formData.assigned_to_name || null,
      service_start_date: formData.service_start_date || null,
      service_end_date: formData.service_end_date || null,
      status: 'open'
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setFormData({
          title: '',
          description: '',
          location: '',
          project_id: '',
          assigned_to: '',
          assigned_to_name: '',
          service_start_date: '',
          service_end_date: ''
        });
      }
    });
  };

  const handleAssigneeChange = (userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId);
    setFormData({
      ...formData,
      assigned_to: userId,
      assigned_to_name: member?.full_name || ''
    });
  };

  const getWorkOrdersByStatus = (status: WorkOrderStatus) => {
    return workOrders.filter(wo => wo.status === status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedWorkOrder) {
    return (
      <WorkOrderDetailView 
        workOrder={selectedWorkOrder} 
        onBack={() => setSelectedWorkOrder(null)} 
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input 
            placeholder="Search for Work Orders" 
            className="w-64"
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Work Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Work Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Title *</Label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Gutter installation"
                />
              </div>
              
              <div>
                <Label>Location / Address</Label>
                <Input 
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., 858 Gull Ave"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Work order description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Service Start Date</Label>
                  <Input 
                    type="date"
                    value={formData.service_start_date}
                    onChange={(e) => setFormData({ ...formData, service_start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Service End Date</Label>
                  <Input 
                    type="date"
                    value={formData.service_end_date}
                    onChange={(e) => setFormData({ ...formData, service_end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Project</Label>
                <Select 
                  value={formData.project_id || 'none'} 
                  onValueChange={(v) => setFormData({ ...formData, project_id: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assign To</Label>
                <Select 
                  value={formData.assigned_to || 'none'} 
                  onValueChange={(v) => handleAssigneeChange(v === 'none' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {teamMembers.filter(m => m.user_id).map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id!}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.title.trim()}>
                  Create Work Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((column) => {
          const columnWorkOrders = getWorkOrdersByStatus(column.status);
          return (
            <div
              key={column.status}
              className="flex-shrink-0 w-64"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div className="bg-muted rounded-t-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{column.label}</span>
                  <Badge variant="secondary" className="rounded-full">
                    {columnWorkOrders.length}
                  </Badge>
                </div>
              </div>
              
              <ScrollArea className="h-[calc(100vh-300px)] bg-muted/30 rounded-b-lg p-2">
                <div className="space-y-2">
                  {columnWorkOrders.map((workOrder) => (
                    <Card
                      key={workOrder.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, workOrder.id)}
                      onClick={() => setSelectedWorkOrder(workOrder)}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        draggedItem === workOrder.id ? 'opacity-50' : ''
                      }`}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm truncate">
                                {workOrder.location || workOrder.title}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {workOrder.title}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {workOrder.work_order_number}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <DollarSign className="h-3 w-3" />
                              <span>Amount: ${workOrder.grand_total?.toLocaleString() || '0'}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {columnWorkOrders.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No work orders
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkOrdersKanban;
