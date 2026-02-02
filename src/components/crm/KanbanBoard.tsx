import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Phone, Mail, MapPin, Calendar, DollarSign, User, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useCrmWorkflow } from '../../hooks/useCrmWorkflow';
import { AddCustomerDialog } from './AddCustomerDialog';

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color: string;
}

const PIPELINE_COLUMNS: KanbanColumn[] = [
  { id: 'received', title: 'Received', status: 'new', color: 'bg-blue-100 border-blue-200' },
  { id: 'pending', title: 'Pending', status: 'pending', color: 'bg-yellow-100 border-yellow-200' },
  { id: 'qualifying', title: 'Qualifying', status: 'qualifying', color: 'bg-purple-100 border-purple-200' },
  { id: 'quoted', title: 'Quoted', status: 'quoted', color: 'bg-orange-100 border-orange-200' },
  { id: 'approved', title: 'Approved', status: 'approved', color: 'bg-green-100 border-green-200' },
  { id: 'won', title: 'Won', status: 'won', color: 'bg-emerald-100 border-emerald-200' },
  { id: 'lost', title: 'Lost', status: 'lost', color: 'bg-red-100 border-red-200' }
];

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  source?: string;
  created_at: string;
  estimated_value?: number;
  project_type?: string;
  timeline?: string;
  notes?: string;
}

interface KanbanBoardProps {
  type: 'leads' | 'opportunities';
  leads: Lead[];
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  onRefresh: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  type, 
  leads, 
  onUpdateLead,
  onRefresh 
}) => {
  const [draggedItem, setDraggedItem] = useState<Lead | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { moveCustomerToPhase } = useCrmWorkflow();

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedItem(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = useCallback(async (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.status === columnStatus) {
      setDraggedItem(null);
      return;
    }

    try {
      await onUpdateLead(draggedItem.id, { status: columnStatus });
      
      // Also update CRM workflow if applicable
      if (type === 'leads') {
        const phaseMap: Record<string, string> = {
          'new': 'Lead Capture',
          'pending': 'Lead Capture', 
          'qualifying': 'Sales Process',
          'quoted': 'Sales Process',
          'approved': 'Contract Signed',
          'won': 'Production',
          'lost': 'Close-Out'
        };
        
        const phaseName = phaseMap[columnStatus];
        if (phaseName) {
        await moveCustomerToPhase.mutateAsync({
          customerId: draggedItem.id,
          phaseName
        });
        }
      }
      
      onRefresh();
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
    
    setDraggedItem(null);
  }, [draggedItem, onUpdateLead, moveCustomerToPhase, type, onRefresh]);

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const getSourceColor = (source?: string) => {
    if (!source) return 'bg-gray-100 text-gray-800';
    
    const sourceColors: Record<string, string> = {
      'yelp': 'bg-red-100 text-red-800',
      'referral': 'bg-blue-100 text-blue-800', 
      'ai_system': 'bg-purple-100 text-purple-800',
      'federal_invitation': 'bg-green-100 text-green-800',
      'website': 'bg-orange-100 text-orange-800',
      'google': 'bg-yellow-100 text-yellow-800'
    };
    
    return sourceColors[source.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const formatEstimatedValue = (value?: number) => {
    if (!value) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {type === 'leads' ? 'Leads Pipeline' : 'Opportunities Pipeline'}
          </h2>
          <p className="text-muted-foreground">
            {type === 'leads' 
              ? 'New customers in the sales pipeline' 
              : 'Returning customers and upsell opportunities'
            }
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add {type === 'leads' ? 'Lead' : 'Opportunity'}
        </Button>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {PIPELINE_COLUMNS.map((column) => {
          const columnLeads = getLeadsByStatus(column.status);
          
          return (
            <div
              key={column.id}
              className={`min-w-[280px] flex-shrink-0 rounded-lg border-2 border-dashed ${column.color} p-4`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-foreground">{column.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnLeads.length}
                </Badge>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {columnLeads.map((lead) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    className="cursor-move hover:shadow-md transition-shadow bg-white border"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium truncate">
                          {lead.name}
                        </CardTitle>
                        {lead.source && (
                          <Badge variant="outline" className={`text-xs ${getSourceColor(lead.source)}`}>
                            {lead.source}
                          </Badge>
                        )}
                      </div>
                      {lead.company && (
                        <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {/* Contact Info */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{lead.phone}</span>
                          </div>
                        )}

                        {/* Project Details */}
                        {lead.project_type && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{lead.project_type}</span>
                          </div>
                        )}

                        {/* Timeline */}
                        {lead.timeline && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{lead.timeline}</span>
                          </div>
                        )}

                        {/* Estimated Value */}
                        {lead.estimated_value && (
                          <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                            <DollarSign className="w-3 h-3" />
                            <span>{formatEstimatedValue(lead.estimated_value)}</span>
                          </div>
                        )}

                        {/* Created Date */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(lead.created_at), 'MMM d, yyyy')}</span>
                        </div>

                        {/* Notes Preview */}
                        {lead.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {lead.notes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Empty State */}
                {columnLeads.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No {type} in this stage</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Customer Dialog */}
      <AddCustomerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={onRefresh}
      />
    </div>
  );
};