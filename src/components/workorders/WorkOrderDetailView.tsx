import React, { useState } from 'react';
import { WorkOrder, useUpdateWorkOrder, useWorkOrderItems, useWorkOrderNotes, useWorkOrderFiles, useCreateWorkOrderNote, WorkOrderStatus } from '@/hooks/useWorkOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectsWithPhotos } from '@/hooks/useProjectsWithPhotos';
import { 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  ClipboardList, 
  FolderOpen, 
  MessageSquare,
  Check,
  MapPin,
  Calendar,
  User,
  DollarSign,
  Plus,
  FolderKanban
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface WorkOrderDetailViewProps {
  workOrder: WorkOrder;
  onBack: () => void;
}

const STATUS_STEPS: { status: WorkOrderStatus; label: string }[] = [
  { status: 'open', label: 'Open' },
  { status: 'estimating', label: 'Estimating' },
  { status: 'submitted', label: 'Submitted' },
  { status: 'approved', label: 'Approved' },
  { status: 'complete', label: 'Complete' },
];

const WorkOrderDetailView: React.FC<WorkOrderDetailViewProps> = ({ workOrder, onBack }) => {
  const updateWorkOrder = useUpdateWorkOrder();
  const { data: items = [] } = useWorkOrderItems(workOrder.id);
  const { data: notes = [] } = useWorkOrderNotes(workOrder.id);
  const { data: files = [] } = useWorkOrderFiles(workOrder.id);
  const createNote = useCreateWorkOrderNote();
  const { allProjects: projects = [] } = useProjectsWithPhotos();

  const [activeTab, setActiveTab] = useState('details');
  const [newNote, setNewNote] = useState('');
  const [termsContent, setTermsContent] = useState(workOrder.terms_and_conditions || '');

  const getStatusIndex = (status: WorkOrderStatus) => {
    return STATUS_STEPS.findIndex(s => s.status === status);
  };

  const currentStatusIndex = getStatusIndex(workOrder.status as WorkOrderStatus);

  const handleStatusChange = (newStatus: WorkOrderStatus) => {
    updateWorkOrder.mutate({ id: workOrder.id, status: newStatus });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    createNote.mutate({
      work_order_id: workOrder.id,
      content: newNote
    }, {
      onSuccess: () => setNewNote('')
    });
  };

  const handleSaveTerms = () => {
    updateWorkOrder.mutate({ id: workOrder.id, terms_and_conditions: termsContent });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'estimating': return 'bg-yellow-500';
      case 'submitted': return 'bg-orange-500';
      case 'approved': return 'bg-green-500';
      case 'complete': return 'bg-emerald-600';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
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
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", getStatusColor(workOrder.status))}>
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{workOrder.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {workOrder.location && (
                  <>
                    <span>{workOrder.location}</span>
                    <ExternalLink className="h-3 w-3" />
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={cn("text-white", getStatusColor(workOrder.status))}>
              {workOrder.status.charAt(0).toUpperCase() + workOrder.status.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground">{workOrder.work_order_number}</span>
          </div>
        </div>
      </div>

      {/* Status Stepper */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index < currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              
              return (
                <React.Fragment key={step.status}>
                  <button
                    onClick={() => handleStatusChange(step.status)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      isCompleted || isCurrent 
                        ? "bg-green-500 border-green-500 text-white" 
                        : "border-muted-foreground/30 text-muted-foreground group-hover:border-primary"
                    )}>
                      {isCompleted || isCurrent ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </button>
                  {index < STATUS_STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2",
                      index < currentStatusIndex ? "bg-green-500" : "bg-muted-foreground/30"
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b">
          <TabsList className="bg-transparent h-auto p-0 space-x-6">
            <TabsTrigger 
              value="details" 
              className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger 
              value="terms" 
              className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
            >
              <FileText className="h-4 w-4 mr-2" />
              Terms
            </TabsTrigger>
            <TabsTrigger 
              value="files" 
              className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="px-0 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details & Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Details Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Details
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        checked={workOrder.is_no_cost}
                        onCheckedChange={(checked) => 
                          updateWorkOrder.mutate({ id: workOrder.id, is_no_cost: !!checked })
                        }
                      />
                      <Label className="text-sm">No Cost Work Order</Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Service Start/End Date</Label>
                      <p className="text-sm">
                        {workOrder.service_start_date 
                          ? format(new Date(workOrder.service_start_date), 'MM/dd/yyyy')
                          : '-'
                        }
                        {' - '}
                        {workOrder.service_end_date 
                          ? format(new Date(workOrder.service_end_date), 'MM/dd/yyyy')
                          : '-'
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Issued By</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-3 w-3" />
                        </div>
                        <span className="text-sm">{workOrder.issued_by_name || 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />

                  <div>
                    <Label className="text-muted-foreground text-xs flex items-center gap-1">
                      <FolderKanban className="h-3 w-3" /> Project
                    </Label>
                    <Select
                      value={workOrder.project_id || 'none'}
                      onValueChange={(value) => updateWorkOrder.mutate({ id: workOrder.id, project_id: value === 'none' ? null : value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select project" />
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
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Invoiced To</Label>
                      <p className="text-sm">{workOrder.invoiced_to || 'If Not Customer'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Customer Contract #</Label>
                      <p className="text-sm">{workOrder.customer_contract_number || '-'}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-xs">Assigned To</Label>
                    <div className="flex items-center gap-2">
                      {workOrder.assigned_to_name ? (
                        <Badge variant="secondary" className="gap-1">
                          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="h-2 w-2" />
                          </div>
                          {workOrder.assigned_to_name}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  </div>

                  {workOrder.approved_by_name && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Approval Details
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Approved By</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                              <User className="h-3 w-3 text-green-600" />
                            </div>
                            <span className="text-sm">{workOrder.approved_by_name}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Work Order Items */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Work Order Items
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-green-600 font-medium">
                        Profit: ${workOrder.profit_amount?.toLocaleString()} ({workOrder.profit_percentage}%)
                      </span>
                      <span className="text-sm font-medium">
                        ${workOrder.grand_total?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-2">Type</th>
                            <th className="text-left py-2">Item Name</th>
                            <th className="text-left py-2">Cost Code</th>
                            <th className="text-right py-2">QTY</th>
                            <th className="text-right py-2">Unit Cost</th>
                            <th className="text-right py-2">Unit</th>
                            <th className="text-right py-2">MU%</th>
                            <th className="text-right py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.id} className="border-b">
                              <td className="py-2">{item.item_type || '-'}</td>
                              <td className="py-2">{item.item_name}</td>
                              <td className="py-2">{item.cost_code || '-'}</td>
                              <td className="py-2 text-right">{item.quantity}</td>
                              <td className="py-2 text-right">${item.unit_cost?.toFixed(2)}</td>
                              <td className="py-2 text-right">{item.unit || '-'}</td>
                              <td className="py-2 text-right">{item.markup_percentage}%</td>
                              <td className="py-2 text-right">${item.total?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No items added yet</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Estimated Cost</span>
                        <span>${workOrder.estimated_cost?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Profit</span>
                        <span>${workOrder.profit_amount?.toLocaleString()} ({workOrder.profit_percentage}%)</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span>Sub Total</span>
                        <span>${workOrder.subtotal?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span>${workOrder.tax_amount?.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Grand Total</span>
                        <span>${workOrder.grand_total?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Hours</span>
                        <span>{workOrder.hours || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Markup</span>
                        <span>{workOrder.markup_percentage}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sub Total</span>
                        <span>${workOrder.subtotal?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax ({workOrder.tax_percentage}%)</span>
                        <span>${workOrder.tax_amount?.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium text-lg">
                        <span>Total</span>
                        <span>${workOrder.grand_total?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Site Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Site Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Location</Label>
                    <p className="text-sm">{workOrder.location || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Drawing</Label>
                    <p className="text-sm">{workOrder.site_drawing || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Type</Label>
                    <p className="text-sm">{workOrder.site_type || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Page</Label>
                    <p className="text-sm">{workOrder.site_page || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">URL</Label>
                    <p className="text-sm">{workOrder.site_url || '-'}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground text-xs">Description</Label>
                    <p className="text-sm">{workOrder.description || '-'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Terms Tab */}
        <TabsContent value="terms" className="pt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Terms and Conditions
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={termsContent}
                onChange={(e) => setTermsContent(e.target.value)}
                placeholder="Start typing..."
                rows={15}
                className="min-h-[300px]"
              />
              <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                <span>Words: {termsContent.split(/\s+/).filter(Boolean).length}</span>
                <span>Characters: {termsContent.length}</span>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handleSaveTerms}>Save Terms</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              {files.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {files.map((file) => (
                    <div key={file.id} className="border rounded-lg p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm truncate">{file.file_name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed rounded-lg flex items-center justify-center">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Click to upload files</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="pt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Notes
                </CardTitle>
                <Button size="sm" onClick={() => document.getElementById('note-input')?.focus()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    id="note-input"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                    Add
                  </Button>
                </div>

                {notes.length > 0 ? (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div key={note.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{note.created_by_name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No Records Available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-4">
          <span>Created: {format(new Date(workOrder.created_at), 'MM/dd/yyyy')}</span>
          <span>{format(new Date(workOrder.created_at), 'hh:mm a')}</span>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderDetailView;
