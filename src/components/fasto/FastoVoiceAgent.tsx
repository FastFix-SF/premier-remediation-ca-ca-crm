import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Phone, PhoneOff, Activity, Send, CheckCircle2, XCircle, Loader2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useFastoRealtimeVoice, VoiceStatus, VisualCard } from '@/hooks/useFastoRealtimeVoice';
import { FastoVoiceWaves, FastoWaveRings, FastoThinkingDots, FastoTypingIndicator, FastoStatusMessage } from './FastoVoiceWaves';
import { FastoConversationHistory } from './FastoConversationHistory';
import { useNavigate } from 'react-router-dom';
import { performNavigation } from './performNavigation';
import {
  FastoInteractiveProjectCard,
  FastoInteractiveAttendanceCard,
  FastoInteractiveInvoiceCard,
  FastoInteractiveScheduleCard,
  FastoInteractiveLeadCard,
  FastoInteractiveWorkOrderCard,
  FastoInteractiveDirectoryCard,
  FastoInteractivePdfCard,
  FastoInteractiveStatsCard
} from './FastoInteractiveCards';

const STATUS_CONFIG: Record<VoiceStatus, { label: string; color: string; pulse: boolean }> = {
  idle: { label: 'Ready', color: 'bg-muted', pulse: false },
  connecting: { label: 'Connecting...', color: 'bg-amber-500', pulse: true },
  listening: { label: 'Listening', color: 'bg-emerald-500', pulse: true },
  thinking: { label: 'Thinking...', color: 'bg-blue-500', pulse: true },
  speaking: { label: 'Speaking', color: 'bg-primary', pulse: true },
  error: { label: 'Error', color: 'bg-destructive', pulse: false }
};

export function FastoVoiceAgent() {
  const navigate = useNavigate();
  const {
    status,
    isConnected,
    activities,
    transcripts,
    currentTool,
    isTyping,
    connect,
    disconnect,
    sendTextMessage
  } = useFastoRealtimeVoice();

  const [textInput, setTextInput] = useState('');
  const [showActivity, setShowActivity] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  
  // Refs for auto-scrolling
  const transcriptsEndRef = useRef<HTMLDivElement>(null);
  const activitiesEndRef = useRef<HTMLDivElement>(null);

  const statusConfig = STATUS_CONFIG[status];

  // NOTE: Navigation events are now handled by FastoNavigationBridge in AdminLayout
  // This ensures navigation works from ANY admin tab, not just when this component is mounted

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, isTyping]);

  // Auto-scroll activities
  useEffect(() => {
    activitiesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activities]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && isConnected) {
      sendTextMessage(textInput.trim());
      setTextInput('');
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLoadConversation = (messages: Array<{ role: 'user' | 'assistant'; content: string }>) => {
    // Could be used to load previous conversation context
    console.log('[FastoVoiceAgent] Loading conversation with', messages.length, 'messages');
  };

  // Render visual card inline based on type
  const renderVisualCard = (visualCard: VisualCard) => {
    if (!visualCard || !visualCard.data) return null;

    const data = visualCard.data;
    const type = visualCard.type || data.visual_type;

    switch (type) {
      case 'pdf_report':
        return (
          <FastoInteractivePdfCard
            reportType={data.report_type || 'timesheet'}
            title={data.title || data.report_data?.title || 'Report Ready'}
            subtitle={data.subtitle || data.report_data?.subtitle}
            data={data.report_data || data}
          />
        );

      case 'project_cards':
      case 'projects_list':
        const projects = data.projects || data.data || [];
        if (projects.length === 0) return null;
        return (
          <FastoInteractiveProjectCard
            projects={projects}
            title={data.title || `${projects.length} Projects`}
            onNavigate={handleNavigate}
          />
        );

      case 'attendance_card':
      case 'attendance_chart':
        const entries = data.clocked_in || data.entries || data.attendance || data.data || [];
        return (
          <FastoInteractiveAttendanceCard
            entries={entries}
            title={data.title || "Today's Attendance"}
            totalHours={data.totalHours || data.total_hours}
            summary={data.summary}
            onNavigate={handleNavigate}
          />
        );

      case 'invoice_list':
        const invoices = data.invoices || data.data || [];
        if (invoices.length === 0) return null;
        return (
          <FastoInteractiveInvoiceCard
            invoices={invoices}
            title={data.title || `${invoices.length} Invoices`}
            onNavigate={handleNavigate}
          />
        );

      case 'schedule_list':
        const schedules = data.schedules || data.shifts || data.data || [];
        if (schedules.length === 0) return null;
        return (
          <FastoInteractiveScheduleCard
            schedules={schedules}
            title={data.title || "Today's Schedule"}
            onNavigate={handleNavigate}
          />
        );

      case 'lead_list':
        const leads = data.leads || data.data || [];
        if (leads.length === 0) return null;
        return (
          <FastoInteractiveLeadCard
            leads={leads}
            title={data.title || `${leads.length} Leads`}
            onNavigate={handleNavigate}
          />
        );

      case 'work_order_list':
        const workOrders = data.work_orders || data.data || [];
        if (workOrders.length === 0) return null;
        return (
          <FastoInteractiveWorkOrderCard
            workOrders={workOrders}
            title={data.title || `${workOrders.length} Work Orders`}
            onNavigate={handleNavigate}
          />
        );

      case 'directory_list':
        const contacts = data.contacts || data.employees || data.team || data.data || [];
        if (contacts.length === 0) return null;
        return (
          <FastoInteractiveDirectoryCard
            contacts={contacts}
            title={data.title || `${contacts.length} Contacts`}
            onNavigate={handleNavigate}
          />
        );

      case 'stats_card':
      case 'stats':
        return (
          <FastoInteractiveStatsCard
            stats={data.stats || data}
            title={data.title || 'Dashboard Stats'}
            onNavigate={handleNavigate}
          />
        );

      case 'success_card':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mt-2 max-w-[90%]"
          >
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium text-sm">{data.message || 'Success!'}</span>
            </div>
          </motion.div>
        );

      default:
        // For unknown types, try to render as stats if there's data
        if (data.stats || (typeof data === 'object' && Object.keys(data).length > 0)) {
          return (
            <FastoInteractiveStatsCard
              stats={data.stats || data}
              title={data.title || 'Results'}
              onNavigate={handleNavigate}
            />
          );
        }
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-muted/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div 
              className={cn("w-3 h-3 rounded-full", statusConfig.color)}
              animate={statusConfig.pulse ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            {statusConfig.pulse && (
              <motion.div
                className={cn("absolute inset-0 w-3 h-3 rounded-full", statusConfig.color)}
                animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
          <AnimatePresence mode="wait">
            <FastoStatusMessage 
              key={status} 
              status={status} 
              toolName={currentTool?.displayName}
            />
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(true)}
            title="Conversation History"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActivity(!showActivity)}
            className={cn(showActivity && "bg-muted")}
          >
            <Activity className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversation History Panel */}
      <FastoConversationHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onLoadConversation={handleLoadConversation}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation Panel */}
        <div className="flex-1 flex flex-col">
          {/* Transcripts */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {transcripts.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-[200px] text-center"
                >
                  <motion.div 
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4"
                    animate={{ 
                      boxShadow: isConnected 
                        ? ['0 0 0 0 rgba(var(--primary), 0)', '0 0 0 20px rgba(var(--primary), 0.1)', '0 0 0 0 rgba(var(--primary), 0)']
                        : 'none'
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Mic className="h-8 w-8 text-primary/60" />
                  </motion.div>
                  <p className="text-muted-foreground text-sm">
                    {isConnected ? "I'm listening..." : "Click the button below to start talking"}
                  </p>
                </motion.div>
              ) : (
                transcripts.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.3,
                      delay: index === transcripts.length - 1 ? 0 : 0 
                    }}
                    className={cn(
                      "flex flex-col",
                      msg.role === 'user' ? "items-end" : "items-start"
                    )}
                  >
                    {msg.content && (
                      <motion.div 
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
                          msg.role === 'user' 
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                        whileHover={{ scale: 1.01 }}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </motion.div>
                    )}
                    {msg.visualCard && renderVisualCard(msg.visualCard)}
                  </motion.div>
                ))
              )}
              
              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-start"
                  >
                    <FastoTypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Auto-scroll anchor */}
              <div ref={transcriptsEndRef} />
            </div>
          </ScrollArea>

          {/* Voice Orb & Controls */}
          <div className="p-6 border-t border-border/50">
            {/* Central Orb with Voice Waves */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Wave rings */}
                <AnimatePresence>
                  {isConnected && (
                    <FastoWaveRings 
                      mode={
                        status === 'speaking' ? 'speaking' : 
                        status === 'listening' ? 'listening' : 
                        status === 'thinking' ? 'thinking' : 
                        'idle'
                      } 
                      size={96}
                    />
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={isConnected ? disconnect : () => connect()}
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Outer glow */}
                  <AnimatePresence>
                    {isConnected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: [0.3, 0.6, 0.3], 
                          scale: [1, 1.15, 1] 
                        }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className={cn(
                          "absolute inset-0 rounded-full blur-xl",
                          status === 'speaking' ? "bg-primary" : 
                          status === 'listening' ? "bg-emerald-500" :
                          status === 'thinking' ? "bg-blue-500" : "bg-muted"
                        )}
                        style={{ transform: 'scale(1.5)' }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Main orb */}
                  <motion.div 
                    className={cn(
                      "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
                      "shadow-lg",
                      isConnected 
                        ? status === 'speaking' 
                          ? "bg-gradient-to-br from-primary to-primary/80"
                          : status === 'listening'
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                            : status === 'thinking'
                              ? "bg-gradient-to-br from-blue-500 to-blue-600"
                              : "bg-gradient-to-br from-muted to-muted/80"
                        : "bg-gradient-to-br from-muted-foreground/20 to-muted hover:from-primary/80 hover:to-primary"
                    )}
                    animate={status === 'connecting' ? { rotate: 360 } : {}}
                    transition={{ duration: 2, repeat: status === 'connecting' ? Infinity : 0, ease: "linear" }}
                  >
                    {status === 'connecting' ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : status === 'thinking' ? (
                      <FastoThinkingDots />
                    ) : isConnected ? (
                      <PhoneOff className="h-8 w-8 text-white" />
                    ) : (
                      <Phone className="h-8 w-8 text-white" />
                    )}
                  </motion.div>

                  {/* Voice waves below orb when speaking/listening */}
                  <AnimatePresence>
                    {(status === 'speaking' || status === 'listening') && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute -bottom-8 left-1/2 -translate-x-1/2"
                      >
                        <FastoVoiceWaves mode={status === 'speaking' ? 'speaking' : 'listening'} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>

            {/* Text Input (when connected) */}
            <AnimatePresence>
              {isConnected && (
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onSubmit={handleSubmit}
                  className="flex gap-2"
                >
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Or type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!textInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Activity Panel */}
        <AnimatePresence>
          {showActivity && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border/50 bg-muted/20 overflow-hidden"
            >
              <div className="p-3 border-b border-border/50">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Activity
                </h3>
              </div>
              <ScrollArea className="h-[calc(100%-48px)]">
                <div className="p-3 space-y-2">
                  {activities.length === 0 ? (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground text-center py-4"
                    >
                      No activity yet
                    </motion.p>
                  ) : (
                    activities.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ 
                          duration: 0.3,
                          delay: index === activities.length - 1 ? 0 : 0
                        }}
                        className={cn(
                          "text-xs p-2.5 rounded-lg transition-all duration-300",
                          activity.type === 'tool_call' && activity.status === 'pending' && "bg-blue-500/10 border border-blue-500/30 shadow-sm shadow-blue-500/10",
                          activity.type === 'tool_call' && activity.status === 'success' && "bg-emerald-500/10 border border-emerald-500/20",
                          activity.type === 'tool_call' && activity.status === 'error' && "bg-destructive/10 border border-destructive/20",
                          activity.type === 'tool_result' && "bg-emerald-500/10 border border-emerald-500/20",
                          activity.type === 'transcript' && "bg-muted border border-border/50",
                          activity.type === 'response' && "bg-primary/10 border border-primary/20",
                          activity.type === 'navigation' && "bg-amber-500/10 border border-amber-500/20"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {/* Status icon */}
                          {activity.status === 'pending' ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className="h-3 w-3 text-blue-500" />
                            </motion.div>
                          ) : activity.status === 'success' ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            </motion.div>
                          ) : activity.status === 'error' ? (
                            <motion.div
                              animate={{ x: [-2, 2, -2, 2, 0] }}
                              transition={{ duration: 0.4 }}
                            >
                              <XCircle className="h-3 w-3 text-destructive" />
                            </motion.div>
                          ) : null}
                          
                          {activity.name && (
                            <span className="font-medium truncate">{activity.name}</span>
                          )}
                        </div>
                        <p className="text-muted-foreground line-clamp-2">
                          {activity.content}
                        </p>
                        
                        {/* Shimmer effect for pending items */}
                        {activity.status === 'pending' && (
                          <motion.div
                            className="absolute inset-0 rounded-lg overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          </motion.div>
                        )}
                      </motion.div>
                    ))
                  )}
                  {/* Auto-scroll anchor */}
                  <div ref={activitiesEndRef} />
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
