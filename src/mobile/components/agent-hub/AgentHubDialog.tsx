import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AgentMessageBubble } from './AgentMessageBubble';
import { StatusCard } from './StatusCard';
import { ProgressStepper } from './ProgressStepper';
import { FinancialChart, StatsGrid, SuccessCard, InputFormCard, AttendanceChart } from './VisualCards';
import { AgentProjectGrid } from './AgentProjectCard';
import { PdfReportCard } from './PdfReportCard';
import { AGENTS, detectAgentType } from '@/mobile/config/agents';
import roofingFriendMascot from '@/assets/roofing-friend-mascot.png';

interface NavLink {
  label: string;
  route: string;
  tab?: string;
}

interface StructuredData {
  visual_type: string;
  chart_data?: Array<{ name: string; value: number; color: string }>;
  stats?: any;
  status_steps?: Array<{ name: string; completed: boolean; current?: boolean }>;
  message?: string;
  fields?: Array<{ name: string; label: string; required: boolean; type: string; options?: string[] }>;
  financials?: any;
  project?: any;
  [key: string]: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  agentType?: string;
  confidence?: number;
  navLinks?: NavLink[];
  structuredData?: StructuredData;
}

// Parse navigation links from AI response
const parseNavLinks = (text: string): { cleanText: string; navLinks: NavLink[] } => {
  const navRegex = /\[\[NAV:([^|]+)\|([^|]+)\|([^\]]*)\]\]/g;
  const navLinks: NavLink[] = [];
  let match;
  
  while ((match = navRegex.exec(text)) !== null) {
    navLinks.push({
      label: match[1].trim(),
      route: match[2].trim(),
      tab: match[3]?.trim() || undefined
    });
  }
  
  const cleanText = text.replace(navRegex, '').trim();
  return { cleanText, navLinks };
};

// Simple markdown to JSX renderer
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };
  
  lines.forEach((line, idx) => {
    if (line.trim().match(/^[-*]\s+/)) {
      const content = line.trim().replace(/^[-*]\s+/, '');
      listItems.push(content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>'));
    } else {
      flushList();
      if (line.trim()) {
        const formatted = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        elements.push(
          <p key={`p-${idx}`} dangerouslySetInnerHTML={{ __html: formatted }} className="mb-2" />
        );
      }
    }
  });
  
  flushList();
  return <>{elements}</>;
};

// Render structured data as visual components
const renderStructuredData = (data: StructuredData) => {
  if (!data || !data.visual_type) return null;

  switch (data.visual_type) {
    case 'financial_chart':
      return (
        <FinancialChart
          title={data.project?.name || 'Project Financials'}
          data={data.chart_data || []}
          total={data.financials?.total_invoiced}
          subtitle={data.financials?.profit_margin ? `${data.financials.profit_margin}% profit margin` : undefined}
        />
      );
    
    case 'attendance_chart':
      return (
        <AttendanceChart
          title="Attendance Summary"
          data={data.chart_data || []}
          dailyData={data.daily_chart || []}
          summary={data.summary}
          period={data.period}
        />
      );
    
    case 'dashboard_stats':
      return <StatsGrid stats={data.stats || {}} />;
    
    case 'status_update':
      return (
        <div className="space-y-2">
          <SuccessCard 
            title="Status Updated" 
            message={data.message || 'Status changed successfully'}
            details={{}}
          />
          {data.status_steps && (
            <ProgressStepper steps={data.status_steps} orientation="horizontal" />
          )}
        </div>
      );
    
    case 'success_card':
      return (
        <SuccessCard 
          title={data.action_completed === 'create_lead' ? 'Lead Created' : 
                 data.action_completed === 'create_project' ? 'Project Created' : 
                 data.action_completed === 'create_schedule' ? 'Job Scheduled' : 'Success'}
          message={data.message || 'Action completed successfully'}
          details={{}}
        />
      );
    
    case 'input_form':
      return (
        <InputFormCard 
          message={data.message || 'Please provide the following information:'}
          fields={data.fields || []}
        />
      );
    
    case 'project_cards':
      if (data.projects && data.projects.length > 0) {
        return <AgentProjectGrid projects={data.projects} />;
      }
      return null;
    
    case 'project_list':
      if (data.projects && data.projects.length > 0) {
        return <AgentProjectGrid projects={data.projects} />;
      }
      return null;
    
    case 'schedule_list':
      if (data.schedules && data.schedules.length > 0) {
        return (
          <div className="space-y-2">
            {data.schedules.slice(0, 5).map((schedule: any, idx: number) => (
              <StatusCard
                key={schedule.id || idx}
                id={schedule.id?.slice(0, 8) || `SCH-${idx}`}
                title={schedule.job_name || schedule.title || 'Scheduled Job'}
                status={schedule.status || 'scheduled'}
                statusColor={schedule.status === 'completed' ? 'success' : schedule.status === 'confirmed' ? 'default' : 'warning'}
                metadata={{
                  'When': schedule.start_time ? new Date(schedule.start_time).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'TBD',
                  'Location': schedule.location?.slice(0, 25) || 'N/A',
                  'Assigned': Array.isArray(schedule.assigned_users) ? schedule.assigned_users.slice(0, 2).join(', ') : (schedule.assigned_to || 'Unassigned')
                }}
              />
            ))}
          </div>
        );
      }
      return null;
    
    case 'employee_list':
      if (data.employees && data.employees.length > 0) {
        return (
          <div className="space-y-2">
            {data.employees.slice(0, 6).map((emp: any, idx: number) => (
              <StatusCard
                key={emp.user_id || idx}
                id={emp.user_id?.slice(0, 6) || `EMP-${idx}`}
                title={emp.full_name || emp.email}
                status={emp.status || 'active'}
                statusColor={emp.status === 'active' ? 'success' : 'default'}
                metadata={{
                  'Role': emp.role || 'Team Member',
                  'Phone': emp.phone_number || 'N/A'
                }}
              />
            ))}
          </div>
        );
      }
      return null;
    
    case 'card_list':
      if (data.cards && data.cards.length > 0) {
        return (
          <div className="space-y-2">
            {data.cards.slice(0, 5).map((card: any, idx: number) => {
              // Build metadata from card details
              const metadata: Record<string, string> = {};
              if (card.details && Array.isArray(card.details)) {
                card.details.slice(0, 3).forEach((detail: any) => {
                  if (detail.label && detail.value) {
                    metadata[detail.label] = String(detail.value).slice(0, 30);
                  }
                });
              }
              return (
                <StatusCard
                  key={idx}
                  id={`${idx + 1}`}
                  title={card.title || 'Item'}
                  status={card.status || card.subtitle || ''}
                  statusColor="default"
                  metadata={metadata}
                />
              );
            })}
          </div>
        );
      }
      return null;
    
    case 'invoice_list':
      if (data.invoices && data.invoices.length > 0) {
        return (
          <div className="space-y-2">
            <FinancialChart
              title="Invoice Summary"
              data={[
                { name: 'Total', value: data.total_amount || 0, color: '#3b82f6' },
                { name: 'Due', value: data.total_due || 0, color: '#f59e0b' }
              ]}
              total={data.total_amount}
              subtitle={`${data.count} invoices`}
            />
            {data.invoices.slice(0, 3).map((invoice: any) => (
              <StatusCard
                key={invoice.id}
                id={invoice.invoice_number || invoice.id.slice(0, 8)}
                title={invoice.customer_name || invoice.project_name || 'Invoice'}
                status={invoice.status}
                statusColor={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'destructive' : 'warning'}
                metadata={{
                  'Amount': `$${(invoice.total_amount || 0).toLocaleString()}`,
                  'Due': invoice.balance_due ? `$${invoice.balance_due.toLocaleString()}` : '$0'
                }}
              />
            ))}
          </div>
        );
      }
      return null;
    
    case 'lead_list':
      if (data.leads && data.leads.length > 0) {
        return (
          <div className="space-y-2">
            {data.leads.slice(0, 5).map((lead: any) => (
              <StatusCard
                key={lead.id}
                id={lead.id.slice(0, 8)}
                title={lead.name}
                status={lead.status}
                statusColor={lead.status === 'won' ? 'success' : lead.status === 'new' ? 'warning' : 'default'}
                metadata={{
                  'Email': lead.email || 'N/A',
                  'Source': lead.source || 'N/A'
                }}
              />
            ))}
          </div>
        );
      }
      return null;
    
    case 'material_list':
      if (data.materials && data.materials.length > 0) {
        return (
          <div className="space-y-2">
            {data.materials.slice(0, 5).map((mat: any, idx: number) => (
              <StatusCard
                key={mat.id || idx}
                id={mat.id?.slice(0, 6) || `MAT-${idx}`}
                title={mat.name}
                status={mat.status || 'in_stock'}
                statusColor={mat.status === 'low_stock' ? 'warning' : mat.status === 'out_of_stock' ? 'destructive' : 'success'}
                metadata={{
                  'Category': mat.category || 'General',
                  'Quantity': `${mat.total || 0} ${mat.unit || 'units'}`
                }}
              />
            ))}
          </div>
        );
      }
      return null;
    
    case 'pdf_report': {
      const payload = {
        ...(data.data || {}),
        // preserve tool-level flags on the payload so PdfReportCard can act on them
        is_batch: Boolean((data as any).is_batch),
      };

      return (
        <PdfReportCard
          reportType={data.report_type || 'project_summary'}
          title={data.title || 'Report'}
          subtitle={data.subtitle}
          data={payload}
        />
      );
    }
    
    default:
      // Try to render any data as cards if it has a recognizable structure
      if (data.cards || data.items) {
        const items = data.cards || data.items;
        return (
          <div className="space-y-2">
            {items.slice(0, 5).map((item: any, idx: number) => (
              <StatusCard
                key={idx}
                id={`${idx + 1}`}
                title={item.title || item.name || 'Item'}
                status={item.status || item.subtitle || ''}
                statusColor="default"
                metadata={item.metadata || {}}
              />
            ))}
          </div>
        );
      }
      return null;
  }
};


export type AgentCategory = 'project-management' | 'financials' | 'people' | 'documents' | 'settings-support' | null;

const CATEGORY_CONFIG: Record<string, { title: string; description: string; systemHint: string }> = {
  'project-management': {
    title: 'Project Management Agent',
    description: 'Manage projects, schedules, and timelines',
    systemHint: 'Help with project management tasks like creating projects, viewing schedules, updating project status, and managing timelines.'
  },
  'financials': {
    title: 'Financials Agent',
    description: 'Handle invoices, payments, and financial data',
    systemHint: 'Help with financial tasks like viewing invoices, checking payments, generating financial reports, and analyzing costs.'
  },
  'people': {
    title: 'People Agent',
    description: 'Manage team members, leads, and contacts',
    systemHint: 'Help with people management like creating leads, viewing team members, updating contact info, and managing crews.'
  },
  'documents': {
    title: 'Documents Agent',
    description: 'Handle contracts, proposals, and files',
    systemHint: 'Help with document management like creating proposals, viewing contracts, generating PDFs, and managing files.'
  },
  'settings-support': {
    title: 'Settings & Support Agent',
    description: 'App settings and support assistance',
    systemHint: 'Help with settings, configurations, troubleshooting issues, and general app support questions.'
  },
};

interface AgentHubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: AgentCategory;
  conversationId?: string | null;
}

export const AgentHubDialog: React.FC<AgentHubDialogProps> = ({ open, onOpenChange, category, conversationId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  
  const categoryConfig = category ? CATEGORY_CONFIG[category] : null;

  // Load existing conversation messages
  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId || !open) return;
      
      setIsLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from('agent_conversation_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          setMessages(data.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
            agentType: m.agent_type || undefined,
            confidence: m.confidence || undefined,
            structuredData: m.structured_data as StructuredData | undefined,
          })));
          setCurrentConversationId(conversationId);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    loadConversation();
  }, [conversationId, open]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const saveMessage = async (convId: string, message: Message) => {
    try {
      await supabase.from('agent_conversation_messages').insert({
        conversation_id: convId,
        role: message.role,
        content: message.content,
        agent_type: message.agentType || null,
        confidence: message.confidence || null,
        structured_data: message.structuredData || null,
      });
      
      // Update conversation with last message
      const messageCount = messages.length + 1;
      await supabase
        .from('agent_conversations')
        .update({
          last_message: message.content.slice(0, 100),
          message_count: messageCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', convId);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const createNewConversation = async (): Promise<string | null> => {
    if (!user?.id || !category) return null;
    
    try {
      const { data, error } = await supabase
        .from('agent_conversations')
        .insert({
          user_id: user.id,
          category,
          title: categoryConfig?.title || 'Agent Conversation',
        })
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create conversation if needed
    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation();
      if (convId) setCurrentConversationId(convId);
    }

    // Save user message
    if (convId) {
      await saveMessage(convId, userMessage);
    }

    try {
      // Use the new agent-hub function
      const { data, error } = await supabase.functions.invoke('agent-hub', {
        body: { messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })) }
      });

      if (error) throw error;

      if (data?.answer || data?.structured_data) {
        const cleanText = data.answer || '';
        const agentType = detectAgentType(cleanText + ' ' + input);
        const confidence = Math.floor(85 + Math.random() * 13);
        
        const assistantMessage: Message = {
          role: 'assistant',
          content: cleanText,
          agentType,
          confidence,
          structuredData: data.structured_data
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Save assistant message
        if (convId) {
          await saveMessage(convId, assistantMessage);
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setMessages([]);
    setInput('');
    setCurrentConversationId(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md max-h-[90vh] p-0 gap-0 flex flex-col bg-background">
        {/* Elegant Header */}
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-10 h-10 border-2 border-border">
                  <AvatarImage src={roofingFriendMascot} alt="Agent Hub" />
                  <AvatarFallback>
                    <Bot className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
              </div>
              <div className="flex flex-col">
                <DialogTitle className="text-base font-semibold">
                  {categoryConfig?.title || 'Agent Chat'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0">
                  {categoryConfig?.description || 'Chat with your AI assistants'}
                </DialogDescription>
              </div>
            </div>
            {/* Avatars stack */}
            <div className="flex -space-x-2">
              {Object.values(AGENTS).slice(0, 3).map(agent => (
                <Avatar key={agent.id} className="w-8 h-8 border-2 border-background">
                  <AvatarFallback 
                    className="text-xs"
                    style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
                  >
                    {agent.icon}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[350px] max-h-[55vh] bg-muted/30">
          {messages.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              {!categoryConfig ? (
                <>
                  <div className="flex justify-center gap-3">
                    {Object.values(AGENTS).map(agent => (
                      <div 
                        key={agent.id}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg bg-card border-2 shadow-sm"
                        style={{ borderColor: agent.color }}
                      >
                        {agent.icon}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-base text-foreground">AI Agents Ready</p>
                    <div className="text-sm text-muted-foreground space-y-1.5 max-w-[280px] mx-auto">
                      <p>Ask me anything about your projects, finances, team, or documents.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                    <Bot className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-base text-foreground">{categoryConfig.title}</p>
                    <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                      {categoryConfig.systemHint}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx}>
                {msg.role === 'user' ? (
                  <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-11 h-11 flex-shrink-0 border-2 border-border">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                          {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-foreground">
                            {profile?.display_name || 'You'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AgentMessageBubble
                      agentType={msg.agentType || 'operations'}
                      confidence={msg.confidence}
                      content={renderMarkdown(msg.content)}
                    />
                    {msg.structuredData && (
                      <div className="ml-0">
                        {renderStructuredData(msg.structuredData)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <Avatar className="w-11 h-11 border-2 border-primary">
                    <AvatarFallback className="bg-primary/10 text-base">🤖</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-card animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Agent</span>
                    <Badge variant="outline" className="h-5 px-2 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      <span className="mr-1">●</span> Processing
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Elegant Input Area */}
        <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 bg-background border-t border-border/50">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Chat with your team and agents"
              className="min-h-[44px] max-h-[80px] resize-none text-sm bg-transparent border-0 shadow-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground/60"
              disabled={isLoading}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
              <Avatar className="w-8 h-8 border border-border">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-muted">
                  {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full bg-muted hover:bg-muted/80"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
