import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  FileText, 
  PhoneCall,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Clock,
  Paperclip
} from 'lucide-react';
import { format } from 'date-fns';
import { useCrmWorkflow } from '@/hooks/useCrmWorkflow';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadSMSConversations } from './LeadSMSConversations';

interface CrmCustomerDetailDrawerProps {
  customer: any;
  open: boolean;
  onClose: () => void;
}

export const CrmCustomerDetailDrawer: React.FC<CrmCustomerDetailDrawerProps> = ({
  customer,
  open,
  onClose
}) => {
  const { moveCustomerToPhase } = useCrmWorkflow();

  // Fetch step history
  const { data: stepHistory } = useQuery({
    queryKey: ['crm-step-history', customer?.progress_id],
    queryFn: async () => {
      if (!customer?.progress_id) return [];
      
      const { data, error } = await supabase
        .from('crm_step_history')
        .select(`
          *,
          crm_workflow_steps (
            name,
            description
          )
        `)
        .eq('customer_progress_id', customer.progress_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!customer?.progress_id
  });

  // Fetch documents
  const { data: documents } = useQuery({
    queryKey: ['crm-documents', customer?.progress_id],
    queryFn: async () => {
      if (!customer?.progress_id) return [];
      
      const { data, error } = await supabase
        .from('crm_documents')
        .select('*')
        .eq('customer_progress_id', customer.progress_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!customer?.progress_id
  });

  // Fetch quotes
  const { data: quotes } = useQuery({
    queryKey: ['quotes', customer?.customer_id],
    queryFn: async () => {
      if (!customer?.customer_id) return [];
      
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('lead_id', customer.customer_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!customer?.customer_id
  });

  // Fetch call logs
  const { data: callLogs } = useQuery({
    queryKey: ['call-logs', customer?.lead_phone],
    queryFn: async () => {
      if (!customer?.lead_phone) return [];
      
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('to_number', customer.lead_phone)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!customer?.lead_phone
  });

  const handleQuickMove = async (phaseName: string, stepName?: string) => {
    if (!customer?.customer_id) return;
    
    try {
      await moveCustomerToPhase.mutateAsync({
        customerId: customer.customer_id,
        phaseName,
        stepName
      });
    } catch (error) {
      console.error('Error moving customer:', error);
    }
  };

  if (!customer) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <SheetTitle className="flex items-center gap-3">
            <User className="h-6 w-6" />
            {customer.lead_name}
          </SheetTitle>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline">{customer.current_phase_name || 'Unknown Phase'}</Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Progress:</span>
              <Progress value={customer.pct || 0} className="w-24" />
              <span className="text-sm font-medium">{customer.pct || 0}%</span>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.lead_email}</span>
              </div>
              {customer.lead_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.lead_phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{customer.service_needed || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Created: {format(new Date(customer.created_at), 'MMM dd, yyyy')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleQuickMove('Sales Process', 'Assign Sales Rep')}
                className="justify-start"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Move to Sales
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleQuickMove('Contract Signed', 'Sign Contract')}
                className="justify-start"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Contract Signed
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleQuickMove('Production', 'Obtain Permits')}
                className="justify-start"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Start Production
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleQuickMove('Close-Out', 'Final Inspection')}
                className="justify-start"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Close-Out
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stepHistory?.map((step, index) => (
                  <div key={step.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary rounded-full" />
                      {index < stepHistory.length - 1 && (
                        <div className="w-px h-12 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {step.crm_workflow_steps?.name || 'Step'}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {step.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {step.notes}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(step.created_at), 'MMM dd, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documents & Attachments */}
          {documents && documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documents & Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.document_type} • {Math.round(doc.file_size / 1024)} KB
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call History */}
          {callLogs && callLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Call History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {callLogs.map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <PhoneCall className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {call.duration_min ? `${call.duration_min} min` : 'Duration unknown'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(call.started_at || call.created_at), 'MMM dd, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{call.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quotes */}
          {quotes && quotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{quote.quote_number}</p>
                          <p className="text-sm text-muted-foreground">
                            ${quote.total_amount} • {format(new Date(quote.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{quote.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SMS Conversations */}
          {customer?.customer_id && (
            <LeadSMSConversations 
              leadId={customer.customer_id} 
              leadPhone={customer.lead_phone}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};