import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  FileText, MessageSquare, ListChecks, DollarSign, 
  Calendar, User, Loader2, Home, Send, Phone, Mail,
  Clock, CheckCircle2, AlertCircle, Download, Wrench,
  FileCheck, ClipboardList, MapPin, Building2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface PortalData {
  portalAccessId: string;
  urlSlug: string;
  project: {
    id: string;
    name: string;
    address: string | null;
    status: string;
    project_type: string | null;
    start_date: string | null;
    estimated_end_date: string | null;
    client_name: string | null;
    client_phone: string | null;
    customer_email: string | null;
  };
  proposals: any[];
  contracts: any[];
  tasks: any[];
  invoices: any[];
  financialSummary: {
    totalInvoiced: number;
    totalPaid: number;
    outstandingBalance: number;
    currency: string;
  };
  updates: any[];
  projectManager: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    avatar_url: string | null;
  } | null;
  schedules: any[];
  messages: any[];
  workOrders: any[];
  changeOrders: any[];
  dailyLogs: any[];
  documents: any[];
  estimates: any[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed': case 'paid': case 'signed': case 'approved':
      return 'bg-green-500/10 text-green-700 border-green-200';
    case 'in_progress': case 'in progress': case 'active':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'pending': case 'draft': case 'sent':
      return 'bg-amber-500/10 text-amber-700 border-amber-200';
    case 'overdue': case 'cancelled': case 'rejected':
      return 'bg-red-500/10 text-red-700 border-red-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function ClientPortal() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slug) fetchPortalData();
  }, [slug]);

  const fetchPortalData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: responseData, error: invokeError } = await supabase.functions.invoke(
        'client-portal-bootstrap',
        { body: { slug } }
      );

      if (invokeError) {
        setError(invokeError.message || 'Failed to load portal');
        setLoading(false);
        return;
      }

      if (responseData?.error) {
        setError(responseData.error);
        setLoading(false);
        return;
      }

      setData(responseData);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !data) return;
    setSendingMessage(true);

    try {
      const { data: responseData } = await supabase.functions.invoke(
        'client-portal-send-message',
        {
          body: {
            projectId: data.project.id,
            message: newMessage.trim(),
            senderName: data.project.client_name,
            portalAccessId: data.portalAccessId,
          }
        }
      );

      if (responseData?.message) {
        setData(prev => prev ? {
          ...prev,
          messages: [...prev.messages, responseData.message]
        } : null);
        setNewMessage('');
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Calculate stats
  const completedTasks = data?.tasks.filter(t => t.status === 'completed').length || 0;
  const inProgressTasks = data?.tasks.filter(t => t.status === 'in_progress').length || 0;
  const totalTasks = data?.tasks.length || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-white/70">Loading your project portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/5 border-white/10">
          <CardContent className="pt-8 text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
            <h1 className="text-2xl font-bold text-white">Access Denied</h1>
            <p className="text-white/60">{error || 'Invalid portal link'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { project, financialSummary, projectManager } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {project.client_name || 'Client Portal'}
                </h1>
                <p className="text-sm text-white/60 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {project.address || project.name}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {project.status?.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary">
              <Home className="w-4 h-4 mr-2" />Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-primary">
              <ListChecks className="w-4 h-4 mr-2" />Tasks
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-primary">
              <FileText className="w-4 h-4 mr-2" />Documents
            </TabsTrigger>
            <TabsTrigger value="financials" className="data-[state=active]:bg-primary">
              <DollarSign className="w-4 h-4 mr-2" />Financials
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-primary">
              <Calendar className="w-4 h-4 mr-2" />Schedule
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-primary">
              <MessageSquare className="w-4 h-4 mr-2" />Messages
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Progress Card */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm font-medium">Project Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/10" />
                        <circle
                          cx="40" cy="40" r="35"
                          stroke="currentColor" strokeWidth="6" fill="none"
                          strokeDasharray={`${progressPercent * 2.2} 220`}
                          className="text-primary transition-all duration-500"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-white/60 text-sm">{completedTasks} of {totalTasks} tasks done</p>
                      <p className="text-white/40 text-xs">{inProgressTasks} in progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm font-medium">Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Total Invoiced</span>
                    <span className="text-white font-medium">{formatCurrency(financialSummary.totalInvoiced)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Paid</span>
                    <span className="text-green-400 font-medium">{formatCurrency(financialSummary.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/10 pt-2">
                    <span className="text-white/60">Balance Due</span>
                    <span className={`font-bold ${financialSummary.outstandingBalance > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                      {formatCurrency(financialSummary.outstandingBalance)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Project Manager */}
              {projectManager && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm font-medium">Your Project Manager</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={projectManager.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {projectManager.name?.charAt(0) || 'PM'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{projectManager.name}</p>
                        <p className="text-xs text-white/60">{projectManager.role}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      {projectManager.email && (
                        <a href={`mailto:${projectManager.email}`} className="flex items-center gap-2 text-xs text-white/60 hover:text-primary">
                          <Mail className="w-3 h-3" />{projectManager.email}
                        </a>
                      )}
                      {projectManager.phone && (
                        <a href={`tel:${projectManager.phone}`} className="flex items-center gap-2 text-xs text-white/60 hover:text-primary">
                          <Phone className="w-3 h-3" />{projectManager.phone}
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Updates */}
            {data.updates.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Recent Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.updates.slice(0, 3).map((update) => (
                      <div key={update.id} className="flex gap-3 p-3 rounded-lg bg-white/5">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <ClipboardList className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{update.title}</h4>
                          <p className="text-sm text-white/60 line-clamp-2">{update.content}</p>
                          <p className="text-xs text-white/40 mt-1">
                            {format(parseISO(update.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Project Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {data.tasks.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    <ListChecks className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No tasks available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.tasks.map((task) => (
                      <div key={task.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {task.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <Clock className="w-4 h-4 text-amber-400" />
                              )}
                              <h4 className="font-medium text-white">{task.title}</h4>
                            </div>
                            {task.description && (
                              <p className="text-sm text-white/60 mt-1">{task.description}</p>
                            )}
                            {task.progress_percent > 0 && task.status !== 'completed' && (
                              <div className="mt-2">
                                <Progress value={task.progress_percent} className="h-2" />
                                <p className="text-xs text-white/40 mt-1">{task.progress_percent}% complete</p>
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className={getStatusColor(task.status)}>
                            {task.status?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            {/* Proposals */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Proposals</CardTitle>
              </CardHeader>
              <CardContent>
                {data.proposals.length === 0 ? (
                  <p className="text-center py-4 text-white/60">No proposals available</p>
                ) : (
                  <div className="space-y-2">
                    {data.proposals.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium text-white">{p.title || `Proposal ${p.proposal_number}`}</p>
                            <p className="text-xs text-white/60">{p.proposal_number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.total_amount && (
                            <span className="text-sm text-white/60">{formatCurrency(p.total_amount)}</span>
                          )}
                          <Badge variant="outline" className={getStatusColor(p.status)}>
                            {p.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contracts */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                {data.contracts.length === 0 ? (
                  <p className="text-center py-4 text-white/60">No contracts available</p>
                ) : (
                  <div className="space-y-2">
                    {data.contracts.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <FileCheck className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="font-medium text-white">{c.title}</p>
                            <p className="text-xs text-white/60">{c.contract_number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(c.status)}>
                            {c.status}
                          </Badge>
                          {c.file_url && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={c.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Project Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {data.documents.length === 0 ? (
                  <p className="text-center py-4 text-white/60">No documents available</p>
                ) : (
                  <div className="space-y-2">
                    {data.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-white/60" />
                          <div>
                            <p className="font-medium text-white">{doc.file_name}</p>
                            <p className="text-xs text-white/60">{doc.category || 'Document'}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-white/5 text-center">
                    <p className="text-xs text-white/60">Total Invoiced</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(financialSummary.totalInvoiced)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 text-center">
                    <p className="text-xs text-green-400">Paid</p>
                    <p className="text-xl font-bold text-green-400">{formatCurrency(financialSummary.totalPaid)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-500/10 text-center">
                    <p className="text-xs text-amber-400">Balance Due</p>
                    <p className="text-xl font-bold text-amber-400">{formatCurrency(financialSummary.outstandingBalance)}</p>
                  </div>
                </div>

                {data.invoices.length === 0 ? (
                  <p className="text-center py-4 text-white/60">No invoices available</p>
                ) : (
                  <div className="space-y-2">
                    {data.invoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="font-medium text-white">{inv.title || `Invoice ${inv.invoice_number}`}</p>
                            <p className="text-xs text-white/60">
                              {inv.due_date && `Due: ${format(parseISO(inv.due_date), 'MMM d, yyyy')}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-white">{formatCurrency(inv.total || 0)}</span>
                          <Badge variant="outline" className={getStatusColor(inv.status)}>
                            {inv.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Upcoming Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {data.schedules.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.schedules.map((sched) => (
                      <div key={sched.id} className="flex gap-4 p-4 rounded-lg bg-white/5">
                        <div className="text-center bg-primary/20 rounded-lg p-2 min-w-[60px]">
                          <p className="text-xs text-primary font-medium">
                            {format(parseISO(sched.start_time), 'MMM')}
                          </p>
                          <p className="text-xl font-bold text-white">
                            {format(parseISO(sched.start_time), 'd')}
                          </p>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{sched.job_name}</h4>
                          <p className="text-sm text-white/60">
                            {format(parseISO(sched.start_time), 'h:mm a')}
                            {sched.end_time && ` - ${format(parseISO(sched.end_time), 'h:mm a')}`}
                          </p>
                          {sched.location && (
                            <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{sched.location}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className={getStatusColor(sched.status)}>
                          {sched.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {data.messages.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start a conversation with your project team</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.messages.map((msg) => {
                        const isClient = msg.sender_name?.startsWith('[Client]');
                        return (
                          <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg ${isClient ? 'bg-primary/20' : 'bg-white/10'}`}>
                              <p className="text-xs text-white/60 mb-1">
                                {isClient ? 'You' : msg.sender_name}
                              </p>
                              <p className="text-white text-sm">{msg.content}</p>
                              <p className="text-xs text-white/40 mt-1">
                                {format(parseISO(msg.created_at), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="flex gap-2 mt-4">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="shrink-0"
                  >
                    {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/40 text-sm">Powered by Roofing Friend</p>
        </div>
      </footer>
    </div>
  );
}
