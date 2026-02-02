import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeConversation, RealtimeEvent } from '@/utils/FastoRealtimeAudio';
import { useToast } from '@/hooks/use-toast';
import { useFastoFailureTracking } from '@/hooks/useFastoFailureTracking';
import { useFastoConversationPersistence } from '@/hooks/useFastoConversationPersistence';

export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface ActivityEvent {
  id: string;
  type: 'tool_call' | 'tool_result' | 'transcript' | 'response' | 'navigation';
  name?: string;
  content: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  data?: any;
  icon?: string;
}

export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  visualCard?: VisualCard;
}

export interface VisualCard {
  type: 'pdf_report' | 'stats_card' | 'projects_list' | 'project_cards' | 'attendance_card' | 
        'attendance_chart' | 'invoice_list' | 'schedule_list' | 'lead_list' | 'work_order_list' | 
        'directory_list' | 'success_card' | 'stats' | string;
  data: any;
}

export interface CurrentToolInfo {
  name: string;
  displayName: string;
}

// Quick commands that skip AI entirely (saves cost/latency)
// Single source of truth for admin tab + subtab navigation.
import { resolveAdminNavigationUrl } from '@/components/fasto/adminNavRegistry';

// Normalize text for matching: lowercase, strip punctuation, collapse spaces
function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Match user input to a navigation URL (supports phrases like "quotes inside sales")
function matchNavigationCommand(text: string): string | null {
  // registry resolver is already robust; keep a tiny normalization wrapper
  const normalized = normalizeForMatching(text);
  return resolveAdminNavigationUrl(normalized);
}


// Auto-disconnect after 25 seconds of inactivity to save costs
const INACTIVITY_TIMEOUT_MS = 25000;

export interface ConnectOptions {
  textOnly?: boolean;
  language?: 'en' | 'es';
  userRole?: string;
}

export function useFastoRealtimeVoice() {
  const { toast } = useToast();
  const { checkAndLogFailure } = useFastoFailureTracking();
  const { startConversation, saveMessage, endConversation } = useFastoConversationPersistence();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [currentTool, setCurrentTool] = useState<CurrentToolInfo | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [inactivityCountdown, setInactivityCountdown] = useState<number | null>(null);
  const [lastGeneratedPdf, setLastGeneratedPdf] = useState<any>(null);
  const [isTextOnlyMode, setIsTextOnlyMode] = useState(false);
  
  const conversationRef = useRef<RealtimeConversation | null>(null);
  const currentTranscriptRef = useRef<string>('');
  const lastUserRequestRef = useRef<string>('');
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addActivity = useCallback((event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const activity: ActivityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    setActivities(prev => [...prev.slice(-19), activity]);
    return activity.id;
  }, []);

  const updateActivity = useCallback((id: string, updates: Partial<ActivityEvent>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const addTranscript = useCallback((role: 'user' | 'assistant', content: string, visualCard?: VisualCard) => {
    const message: TranscriptMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      visualCard
    };
    setTranscripts(prev => [...prev, message]);
    setIsTyping(false);
    
    // Persist to database
    saveMessage(role, content);
  }, [saveMessage]);

  // Add visual card to the last assistant message or create new one
  const addVisualCardToConversation = useCallback((visualCard: VisualCard) => {
    setTranscripts(prev => {
      // Add as a new "system" message with the visual card
      const cardMessage: TranscriptMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '', // Empty content, visual card will be rendered
        timestamp: new Date(),
        visualCard
      };
      return [...prev, cardMessage];
    });
  }, []);

  const getToolDisplayInfo = (name: string): { icon: string; label: string } => {
    const toolInfo: Record<string, { icon: string; label: string }> = {
      // Mobile Task Management
      create_task: { icon: '✅', label: 'Creating task' },
      query_my_tasks: { icon: '📋', label: 'Getting your tasks' },
      update_task: { icon: '✏️', label: 'Updating task' },
      complete_task: { icon: '✓', label: 'Completing task' },
      
      // Mobile Time & Attendance
      clock_in: { icon: '🟢', label: 'Clocking in' },
      clock_out: { icon: '🔴', label: 'Clocking out' },
      get_my_schedule: { icon: '📅', label: 'Getting your schedule' },
      create_time_off_request: { icon: '🏖️', label: 'Submitting time off' },
      
      // Dashboard & Analytics
      get_dashboard_stats: { icon: '📊', label: 'Getting dashboard stats' },
      get_attendance_data: { icon: '⏰', label: 'Getting attendance data' },
      
      // Directory & Contacts
      add_team_member: { icon: '👤', label: 'Adding team member' },
      add_contact: { icon: '📇', label: 'Adding contact' },
      query_directory: { icon: '📖', label: 'Searching directory' },
      update_contact: { icon: '✏️', label: 'Updating contact' },
      
      // Projects
      query_projects: { icon: '🏗️', label: 'Querying projects' },
      get_project_financials: { icon: '💰', label: 'Getting project financials' },
      create_project: { icon: '➕', label: 'Creating project' },
      update_project_status: { icon: '🔄', label: 'Updating project status' },
      
      // Leads
      query_leads: { icon: '👥', label: 'Querying leads' },
      create_lead: { icon: '➕', label: 'Creating lead' },
      update_lead_status: { icon: '🔄', label: 'Updating lead status' },
      
      // Schedules
      query_schedules: { icon: '📅', label: 'Checking schedules' },
      create_schedule: { icon: '➕', label: 'Creating schedule' },
      
      // Work Orders
      create_work_order: { icon: '🔧', label: 'Creating work order' },
      query_work_orders: { icon: '🔧', label: 'Querying work orders' },
      update_work_order_status: { icon: '🔄', label: 'Updating work order' },
      
      // Service Tickets
      create_service_ticket: { icon: '🎫', label: 'Creating service ticket' },
      query_service_tickets: { icon: '🎫', label: 'Querying service tickets' },
      
      // Workforce & Time
      query_employees: { icon: '👷', label: 'Querying team' },
      query_who_clocked_in: { icon: '⏱️', label: 'Checking who\'s clocked in' },
      clock_in_employee: { icon: '🟢', label: 'Clocking in employee' },
      clock_out_employee: { icon: '🔴', label: 'Clocking out employee' },
      approve_timesheet: { icon: '✅', label: 'Approving timesheet' },
      
      // Financials
      query_invoices: { icon: '📄', label: 'Checking invoices' },
      query_bills: { icon: '💸', label: 'Checking bills' },
      create_expense: { icon: '💵', label: 'Logging expense' },
      query_expenses: { icon: '💵', label: 'Querying expenses' },
      create_purchase_order: { icon: '📝', label: 'Creating purchase order' },
      query_purchase_orders: { icon: '📝', label: 'Querying purchase orders' },
      query_payments: { icon: '💳', label: 'Checking payments' },
      
      // Project Management
      query_inspections: { icon: '🔍', label: 'Checking inspections' },
      create_inspection: { icon: '🔍', label: 'Scheduling inspection' },
      query_punchlists: { icon: '✓', label: 'Checking punchlist' },
      create_punchlist_item: { icon: '✓', label: 'Adding punchlist item' },
      query_permits: { icon: '📋', label: 'Checking permits' },
      create_daily_log: { icon: '📓', label: 'Creating daily log' },
      query_daily_logs: { icon: '📓', label: 'Querying daily logs' },
      
      // Materials
      query_materials: { icon: '📦', label: 'Checking inventory' },
      
      // Reports
      generate_pdf_report: { icon: '📑', label: 'Generating report' },
      
      // Navigation
      navigate_to_page: { icon: '🧭', label: 'Navigating' },
      // Navigation deep links
      navigate_to_specific_item: { icon: '🔗', label: 'Opening item' },
      
      // Agentic tools
      get_current_context: { icon: '📍', label: 'Getting context' },
      edit_current_project: { icon: '✏️', label: 'Editing project' },
      download_pdf: { icon: '⬇️', label: 'Downloading PDF' },
    };
    return toolInfo[name] || { icon: '🔧', label: name.replace(/_/g, ' ') };
  };

  // Extract current context from URL for agentic tools (async to include user_id)
  const getCurrentContext = useCallback(async () => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    
    // Get current user ID from Supabase session
    const { data: { user } } = await supabase.auth.getUser();
    
    // Extract project ID from URL like /admin/projects/[uuid]
    const projectMatch = pathname.match(/\/admin\/projects\/([a-f0-9-]+)/i);
    const leadMatch = pathname.match(/\/admin\/leads\/([a-f0-9-]+)/i);
    
    return {
      user_id: user?.id || null,
      page: pathname,
      tab: searchParams.get('tab') || null,
      project_id: projectMatch ? projectMatch[1] : null,
      lead_id: leadMatch ? leadMatch[1] : null,
      is_on_project: !!projectMatch,
      is_on_lead: !!leadMatch
    };
  }, []);

  const executeToolCall = useCallback(async (name: string, args: any, callId: string) => {
    console.log('[useFastoRealtimeVoice] Executing tool:', name, args);
    
    const toolInfo = getToolDisplayInfo(name);
    setCurrentTool({ name, displayName: toolInfo.label });
    
    const activityId = addActivity({
      type: 'tool_call',
      name: toolInfo.label,
      content: `${toolInfo.icon} ${toolInfo.label}...`,
      status: 'pending',
      icon: toolInfo.icon
    });

    try {
      // Inject current context for agentic tools (includes user_id)
      const currentContext = await getCurrentContext();
      const enrichedArgs = {
        ...args,
        current_context: currentContext
      };
      
      // Handle download_pdf locally (client-side download)
      if (name === 'download_pdf') {
        if (lastGeneratedPdf?.data) {
          updateActivity(activityId, { 
            status: 'success', 
            content: `⬇️ Downloading PDF...` 
          });
          setCurrentTool(null);
          
          // Trigger download via custom event
          window.dispatchEvent(new CustomEvent('fasto-download-pdf', { 
            detail: lastGeneratedPdf 
          }));
          
          return { success: true, message: 'Downloading PDF...' };
        } else {
          updateActivity(activityId, { 
            status: 'error', 
            content: `⬇️ No PDF to download` 
          });
          setCurrentTool(null);
          return { success: false, message: 'No report has been generated yet. What report would you like?' };
        }
      }
      
      // Call the agent-hub edge function with enriched args
      const { data, error } = await supabase.functions.invoke('agent-hub', {
        body: {
          action: name,
          params: enrichedArgs
        }
      });

      if (error) throw error;

      // Handle navigation using custom event for SPA navigation
      if (data?.visual_type === 'navigation' && data?.navigate_to) {
        updateActivity(activityId, { 
          status: 'success', 
          content: `${toolInfo.icon} Navigating...`,
          type: 'navigation'
        });
        
        setCurrentTool(null);
        
        // Extract subtab first (higher priority), then tab
        const subtabMatch = data.navigate_to.match(/[?&]subtab=([^&]+)/);
        const tabMatch = data.navigate_to.match(/[?&]tab=([^&]+)/);
        // Use data.tab (subtab from backend) or extract from URL - subtab takes priority
        const targetTab = data.tab || subtabMatch?.[1] || tabMatch?.[1] || null;
        
        console.log('[useFastoRealtimeVoice] AI navigation:', { url: data.navigate_to, targetTab, dataTab: data.tab });
        
        // Use custom event for instant SPA navigation (handled by FastoVoiceAgent)
        setTimeout(() => {
          setPendingNavigation(data.navigate_to);
          window.dispatchEvent(new CustomEvent('fasto-navigate', { 
            detail: { url: data.navigate_to, tab: targetTab } 
          }));
        }, 300);
        
        return data;
      }

      // Format result summary
      let resultSummary = '';
      if (data?.count !== undefined) {
        resultSummary = `Found ${data.count} results`;
      } else if (data?.success) {
        resultSummary = data.message || 'Completed successfully';
      } else if (data?.stats) {
        resultSummary = 'Stats retrieved';
      } else if (data?.clocked_in) {
        resultSummary = data.message || `${data.count} people clocked in`;
      } else if (data?.message) {
        resultSummary = data.message;
      } else {
        resultSummary = 'Done';
      }

      updateActivity(activityId, { 
        status: 'success', 
        content: `${toolInfo.icon} ${resultSummary}`,
        data: data,
        icon: toolInfo.icon
      });

      // Add visual card to conversation if applicable
      if (data?.visual_type && data.visual_type !== 'success_card') {
        const visualCard: VisualCard = {
          type: data.visual_type as VisualCard['type'],
          data: data
        };
        
        // Store PDF report data for later download
        if (data.visual_type === 'pdf_report') {
          setLastGeneratedPdf(data);
          console.log('[useFastoRealtimeVoice] Stored PDF for download:', data.report_type);
        }
        
        // Add visual card as a separate message in conversation
        addVisualCardToConversation(visualCard);
        
        addActivity({
          type: 'tool_result',
          name: data.visual_type,
          content: `📊 ${data.visual_type.replace(/_/g, ' ')} ready`,
          status: 'success',
          data: data,
          icon: '📊'
        });
      }
      
      // Handle smart data refresh for instant UI updates
      if (data?.data_modified && Array.isArray(data.data_modified)) {
        setTimeout(() => {
          console.log('[useFastoRealtimeVoice] Smart refresh for:', data.data_modified);
          window.dispatchEvent(new CustomEvent('fasto-data-refresh', { 
            detail: { dataTypes: data.data_modified } 
          }));
        }, 300);
      } else if (data?.trigger_refresh) {
        // Fallback for backwards compatibility - full page refresh
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('fasto-refresh-page'));
        }, 500);
      }

      setCurrentTool(null);
      return data;
    } catch (error) {
      console.error('[useFastoRealtimeVoice] Tool error:', error);
      updateActivity(activityId, { 
        status: 'error', 
        content: `${toolInfo.icon} Failed` 
      });
      setCurrentTool(null);
      throw error;
    }
  }, [addActivity, updateActivity, addVisualCardToConversation, getCurrentContext, lastGeneratedPdf]);

  // Reset inactivity timer on any activity
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    setInactivityCountdown(null);
    
    // Only set timer if connected
    if (!conversationRef.current) return;
    
    // Start countdown at timeout seconds
    let remaining = INACTIVITY_TIMEOUT_MS / 1000;
    setInactivityCountdown(remaining);

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setInactivityCountdown(remaining > 0 ? remaining : null);
    }, 1000);

    // Set the actual disconnect timer
    inactivityTimerRef.current = setTimeout(() => {
      console.log(`[Fasto] Auto-disconnecting due to ${INACTIVITY_TIMEOUT_MS / 1000}s inactivity`);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setInactivityCountdown(null);
      actualDisconnect();
      toast({
        title: "Fasto Disconnected",
        description: `Session ended after ${INACTIVITY_TIMEOUT_MS / 1000}s of inactivity`
      });
    }, INACTIVITY_TIMEOUT_MS);
  }, [toast]);

  // Reference to actualDisconnect defined later - declare it here
  const actualDisconnectRef = useRef<() => void>(() => {});

  const handleMessage = useCallback((event: RealtimeEvent) => {
    // Reset inactivity on any meaningful event
    const resetEvents = [
      'conversation.item.input_audio_transcription.completed',
      'response.audio_transcript.delta',
      'response.audio_transcript.done',
      'input_audio_buffer.speech_started'
    ];
    if (resetEvents.includes(event.type)) {
      resetInactivityTimer();
    }

    switch (event.type) {
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          // Store the user's request for failure tracking
          lastUserRequestRef.current = event.transcript;
          addTranscript('user', event.transcript);
          addActivity({
            type: 'transcript',
            content: `You: "${event.transcript}"`,
            status: 'success',
            icon: '🎤'
          });
        }
        break;

      case 'response.audio_transcript.delta':
        currentTranscriptRef.current += event.delta || '';
        setIsTyping(true);
        break;

      case 'response.audio_transcript.done':
        if (currentTranscriptRef.current) {
          const assistantResponse = currentTranscriptRef.current;
          addTranscript('assistant', assistantResponse);
          addActivity({
            type: 'response',
            content: `Fasto: "${assistantResponse.slice(0, 100)}${assistantResponse.length > 100 ? '...' : ''}"`,
            status: 'success',
            icon: '🤖'
          });
          
          // Check if this was a failure response and log it
          if (lastUserRequestRef.current) {
            checkAndLogFailure(lastUserRequestRef.current, assistantResponse);
          }
          
          currentTranscriptRef.current = '';
        }
        break;

      case 'response.created':
        setStatus('thinking');
        setIsTyping(true);
        break;

      case 'response.done':
        setIsTyping(false);
        if (!isSpeaking) {
          setStatus('listening');
        }
        break;

      case 'input_audio_buffer.speech_started':
        setStatus('listening');
        break;

      case 'input_audio_buffer.speech_stopped':
        setStatus('thinking');
        break;

      case 'error':
        console.error('[useFastoRealtimeVoice] API Error:', event.error);
        toast({
          title: "Voice Error",
          description: event.error?.message || "An error occurred",
          variant: "destructive"
        });
        break;
    }
  }, [addTranscript, addActivity, isSpeaking, toast, checkAndLogFailure, resetInactivityTimer]);

  const handleSpeakingChange = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking);
    if (speaking) {
      setStatus('speaking');
      setIsTyping(false);
    } else {
      setStatus('listening');
    }
  }, []);

  const handleStatusChange = useCallback((newStatus: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    switch (newStatus) {
      case 'connecting':
        setStatus('connecting');
        break;
      case 'connected':
        setStatus('listening');
        setIsConnected(true);
        toast({
          title: "Fasto Connected",
          description: "I'm listening. How can I help?"
        });
        break;
      case 'disconnected':
        setStatus('idle');
        setIsConnected(false);
        break;
      case 'error':
        setStatus('error');
        setIsConnected(false);
        break;
    }
  }, [toast]);

  const connect = useCallback(async (options?: ConnectOptions) => {
    const { textOnly = false, language = 'en', userRole = 'contributor' } = options || {};
    
    try {
      setStatus('connecting');
      setIsTextOnlyMode(textOnly);
      
      const assistantName = language === 'es' ? 'Fauste' : 'Fasto';
      
      addActivity({
        type: 'transcript',
        content: `Connecting to ${assistantName}...`,
        status: 'pending',
        icon: '🔌'
      });

      // Start conversation persistence
      await startConversation();

      // Get ephemeral token with language and role
      const { data, error } = await supabase.functions.invoke('fasto-realtime-token', {
        body: { language, userRole, textOnly }
      });
      
      if (error) throw error;
      if (!data?.client_secret?.value) {
        throw new Error('Failed to get session token');
      }

      // Create conversation
      conversationRef.current = new RealtimeConversation(
        handleMessage,
        executeToolCall,
        handleSpeakingChange,
        handleStatusChange
      );

      await conversationRef.current.connect(data.client_secret.value, textOnly);
      
      // Start inactivity timer after connection
      resetInactivityTimer();
      
      addActivity({
        type: 'transcript',
        content: textOnly ? `Connected! ${assistantName} Chat ready.` : `Connected! Listening... (auto-disconnect)`,
        status: 'success',
        icon: '✅'
      });

    } catch (error) {
      console.error('[useFastoRealtimeVoice] Connection error:', error);
      setStatus('error');
      setIsTextOnlyMode(false);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Could not connect",
        variant: "destructive"
      });
    }
  }, [handleMessage, executeToolCall, handleSpeakingChange, handleStatusChange, addActivity, toast, startConversation, resetInactivityTimer]);

  // Toggle voice mute (for owners)
  const toggleVoiceMute = useCallback(() => {
    if (!conversationRef.current || isTextOnlyMode) return;
    
    const newMutedState = !isVoiceMuted;
    setIsVoiceMuted(newMutedState);
    
    // Pause/resume audio input via recorder
    if (newMutedState) {
      conversationRef.current.pauseAudioInput?.();
    } else {
      conversationRef.current.resumeAudioInput?.();
    }
    
    toast({
      title: newMutedState ? "Microphone Muted" : "Microphone Unmuted",
      description: newMutedState ? "Voice input paused. You can still type." : "Voice input resumed."
    });
    
    console.log('[useFastoRealtimeVoice] Voice muted:', newMutedState);
  }, [isVoiceMuted, isTextOnlyMode, toast]);

  // Immediate disconnect
  const actualDisconnect = useCallback(() => {
    // Clear inactivity timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setInactivityCountdown(null);
    
    conversationRef.current?.disconnect();
    conversationRef.current = null;
    setIsConnected(false);
    setStatus('idle');
    setCurrentTool(null);
    setIsTyping(false);
    setPendingNavigation(null);
    endConversation();
    addActivity({ type: 'transcript', content: 'Disconnected', status: 'success', icon: '👋' });
  }, [addActivity, endConversation]);

  // User-triggered disconnect - immediate
  const disconnect = useCallback(() => {
    actualDisconnect();
  }, [actualDisconnect]);

  const sendTextMessage = useCallback((text: string) => {
    if (!isConnected) return;
    
    // Check for quick navigation commands first (skip AI entirely)
    const matchedUrl = matchNavigationCommand(text);
    if (matchedUrl) {
      addTranscript('user', text);
      addTranscript('assistant', `Navigating...`);
      addActivity({
        type: 'navigation',
        content: `🧭 Quick navigation: ${matchedUrl}`,
        status: 'success',
        icon: '🧭'
      });
      
      // Extract subtab first (takes priority), then tab
      const subtabMatch = matchedUrl.match(/[?&]subtab=([^&]+)/);
      const tabMatch = matchedUrl.match(/[?&]tab=([^&]+)/);
      // Use subtab as the target if present, otherwise use tab
      const targetTab = subtabMatch?.[1] || tabMatch?.[1] || null;
      
      console.log('[useFastoRealtimeVoice] Quick nav:', { matchedUrl, targetTab, subtab: subtabMatch?.[1], tab: tabMatch?.[1] });
      
      // Trigger instant navigation with subtab as the target
      setTimeout(() => {
        setPendingNavigation(matchedUrl);
        window.dispatchEvent(new CustomEvent('fasto-navigate', { detail: { url: matchedUrl, tab: targetTab } }));
      }, 200);
      return;
    }
    
    // Send to AI if not a quick command
    if (conversationRef.current) {
      addTranscript('user', text);
      addActivity({
        type: 'transcript',
        content: `You: "${text}"`,
        status: 'success',
        icon: '💬'
      });
      conversationRef.current.sendTextMessage(text);
      setIsTyping(true);
    }
  }, [isConnected, addTranscript, addActivity]);

  return {
    status,
    isConnected,
    isSpeaking,
    isVoiceMuted,
    isTextOnlyMode,
    activities,
    transcripts,
    currentTool,
    isTyping,
    pendingNavigation,
    inactivityCountdown,
    connect,
    disconnect,
    sendTextMessage,
    toggleVoiceMute
  };
}
