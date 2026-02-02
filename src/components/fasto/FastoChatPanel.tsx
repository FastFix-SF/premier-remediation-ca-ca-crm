import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Volume2, VolumeX, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AGENTS, detectAgentType } from '@/mobile/config/agents';
import { 
  FastoAgentIndicator, 
  parseAndRenderVisualCards 
} from './FastoVisualCards';
import { FastoActivityPanel, ActivityEvent, useFastoActivity } from './FastoActivityPanel';
import { performNavigation } from './performNavigation';
import { resolveAdminNavigation } from './adminNavRegistry';
import { useFastoCommandQueue } from './useFastoCommandQueue';
import { dispatchFastoAction, FASTO_ACTIONS, FastoContext } from './fastoActionApi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentType?: string;
  structuredData?: any;
}

interface FastoChatPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
  speakResponse?: (text: string) => void;
  isSpeaking?: boolean;
  stopSpeaking?: () => void;
}

export const FastoChatPanel: React.FC<FastoChatPanelProps> = ({ 
  isExpanded, 
  onToggle,
  speakResponse,
  isSpeaking = false,
  stopSpeaking,
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [routingAgent, setRoutingAgent] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Promise-based command queue for reliable sequential execution
  const { enqueue, queueLength, isProcessing, hasPending } = useFastoCommandQueue();
  
  // Activity tracking
  const { events: activityEvents, addEvent, updateEvent, clearEvents } = useFastoActivity();

  // Store last active IDs for contextual navigation
  const storeLastProjectId = useCallback((projectId: string) => {
    FastoContext.setLastProjectId(projectId);
  }, []);

  const getLastProjectId = useCallback((): string | null => {
    return FastoContext.getLastProjectId();
  }, []);

  // Internal sendText implementation
  const sendTextInternal = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    console.log('[Fasto] Sending text:', text);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const lowerText = text.toLowerCase();
    
    // ===== AGENTIC ACTION DETECTION =====
    // Check for lead edit actions: "edit [lead name]'s name to [new name]"
    const leadEditMatch = text.match(/(?:edit|change|update|rename)\s+(?:the\s+)?(?:lead\s+)?(?:named?\s+)?["']?([^"']+?)["']?\s*(?:'s)?\s*name\s+to\s+["']?([^"']+)["']?/i);
    if (leadEditMatch) {
      const [, leadName, newName] = leadEditMatch;
      const thinkingEventId = addEvent({ type: 'thinking', status: 'running', message: `Editing lead "${leadName}"...` });
      setIsLoading(true);
      
      try {
        dispatchFastoAction({
          type: FASTO_ACTIONS.LEAD_EDIT_NAME,
          payload: { leadName: leadName.trim(), newName: newName.trim() }
        });
        
        // Wait for the action result
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => resolve(), 3000);
          const handler = (event: Event) => {
            const customEvent = event as CustomEvent<{ result: { success: boolean; message?: string } }>;
            clearTimeout(timeout);
            window.removeEventListener('fastoActionResult', handler);
            
            if (customEvent.detail?.result?.success) {
              updateEvent(thinkingEventId, { status: 'success', message: customEvent.detail.result.message || 'Lead updated' });
            } else {
              updateEvent(thinkingEventId, { status: 'error', message: customEvent.detail?.result?.message || 'Action failed' });
            }
            resolve();
          };
          window.addEventListener('fastoActionResult', handler);
        });
        
        const successMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Done! I've renamed the lead to "${newName.trim()}".`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, successMsg]);
        if (voiceEnabled && speakResponse) {
          speakResponse(successMsg.content);
        }
      } catch (error) {
        console.error('[Fasto] Lead action error:', error);
        updateEvent(thinkingEventId, { status: 'error', message: 'Failed to edit lead' });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ===== PROJECT SUBPAGE RESOLVER =====
    // If user is on a project page OR we have a last active project, handle sub-route navigation
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const fullCurrentPath = currentPath + currentSearch;
    const projectMatch = currentPath.match(/^\/admin\/projects\/([^/]+)/);
    
    // Store project ID when on a project page
    if (projectMatch) {
      storeLastProjectId(projectMatch[1]);
    }
    
    // Try to get project ID - either from current path or stored
    const projectId = projectMatch?.[1] || getLastProjectId();
    
    // Check if this is a project subpage navigation request
    const projectSubRouteKeywords = ['details', 'detail', 'edit', 'summary', 'overview', 'documents', 'document', 
      'files', 'photos', 'photo', 'images', 'pictures', 'time', 'timesheet', 'hours', 'contacts', 'contact', 
      'people', 'schedule', 'timeline', 'sov', 'schedule of values', 'reports', 'report', 'daily logs', 
      'daily log', 'logs', 'profit', 'profitability'];
    
    const isSubRouteRequest = projectSubRouteKeywords.some(k => lowerText.includes(k));
    
    if (projectId && isSubRouteRequest) {
      // Map keywords to project sub-routes
      const subRouteMap: Record<string, string> = {
        'details': 'details',
        'detail': 'details',
        'edit': 'details',
        'summary': 'summary',
        'overview': 'summary',
        'documents': 'documents',
        'document': 'documents',
        'files': 'documents',
        'photos': 'photos',
        'photo': 'photos',
        'images': 'photos',
        'pictures': 'photos',
        'time': 'time',
        'timesheet': 'time',
        'hours': 'time',
        'contacts': 'contacts',
        'contact': 'contacts',
        'people': 'contacts',
        'schedule': 'schedule',
        'timeline': 'timeline',
        'sov': 'schedule-of-values',
        'schedule of values': 'schedule-of-values',
        'reports': 'reports',
        'report': 'reports',
        'daily logs': 'daily-logs',
        'daily log': 'daily-logs',
        'logs': 'daily-logs',
        'profit': 'profit',
        'profitability': 'profit',
      };
      
      for (const [keyword, subRoute] of Object.entries(subRouteMap)) {
        if (lowerText.includes(keyword)) {
          const targetPath = `/admin/projects/${projectId}/${subRoute}`;
          
          // Check if we're already there (exact match including search params)
          if (fullCurrentPath === targetPath || currentPath === targetPath) {
            const alreadyMsg: Message = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: `You're already on the ${subRoute} page for this project.`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, alreadyMsg]);
            return;
          }
          
          // Navigate to the sub-route
          const thinkingEventId = addEvent({ type: 'thinking', status: 'running', message: `Navigating to ${subRoute}...` });
          setIsLoading(true);
          
          try {
            // Store project ID for future contextual navigation
            storeLastProjectId(projectId);
            
            await performNavigation(targetPath, navigate);
            
            // Verify navigation succeeded after a short delay
            // In native mode, do NOT use hard navigation fallback (can trigger Safari)
            setTimeout(() => {
              const newPath = window.location.pathname;
              if (!newPath.includes(targetPath)) {
                console.warn('[Fasto] Navigation verification failed');
                // Only use hard navigation in web browser, NOT in native app
                // Import Capacitor at top of file handles this check
                const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;
                if (!isNative) {
                  console.log('[Fasto] Using hard navigation fallback (web only)');
                  window.location.assign(targetPath);
                } else {
                  console.log('[Fasto] Skipping hard navigation fallback in native mode');
                }
              }
            }, 500);
            
            updateEvent(thinkingEventId, { status: 'success', message: `Opened ${subRoute} page` });
            const successMsg: Message = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: `Taking you to the ${subRoute} page.`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, successMsg]);
          } catch (error) {
            console.error('[Fasto] Subpage navigation error:', error);
            updateEvent(thinkingEventId, { status: 'error', message: 'Navigation failed' });
          } finally {
            setIsLoading(false);
          }
          return;
        }
      }
    }

    // ===== SUBTAB / TAB ROUTING (deterministic, no AI needed) =====
    // Supports natural phrases like "quotes inside sales" or "work orders under projects".
    const navMatch = resolveAdminNavigation(text);
    if (navMatch?.url) {
      const thinkingEventId = addEvent({
        type: 'thinking',
        status: 'running',
        message: `Going to ${navMatch.label}...`,
      });
      setIsLoading(true);

      try {
        await performNavigation(navMatch.url, navigate);
        updateEvent(thinkingEventId, { status: 'success', message: `Opened ${navMatch.label}` });
        const successMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Taking you to ${navMatch.label}.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, successMsg]);
        if (voiceEnabled && speakResponse) {
          speakResponse(successMsg.content);
        }
      } catch (error) {
        console.error('[Fasto] Subtab navigation error:', error);
        updateEvent(thinkingEventId, { status: 'error', message: 'Navigation failed' });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ===== Action-first navigation (chat) for main tabs =====
    const intentMatch = text.match(/^(?:hey\s+)?(?:fasto\s*,?\s*)?(take\s+me\s+to|go\s+to|open|show\s+me)\s+(.+)$/i);
    if (intentMatch) {
      const target = intentMatch[2].trim().toLowerCase();
      const thinkingEventId = addEvent({ type: 'thinking', status: 'running', message: 'Navigating...' });
      setIsLoading(true);

      try {
        let navData: any = null;

        if (target.includes('latest') && target.includes('project')) {
          const { data, error } = await supabase.functions.invoke('agent-hub', {
            body: { action: 'navigate_to_specific_item', params: { item_type: 'project', search: 'latest' } },
          });
          if (error) throw error;
          navData = data;
        } else {
          const pageKey =
            target.includes('timesheet') ? 'timesheets' :
            target.includes('workforce') ? 'workforce' :
            target.includes('schedule') ? 'schedule' :
            target.includes('projects') ? 'projects' :
            (target.includes('lead') || target.includes('sales')) ? 'sales' :
            (target.includes('invoice') || target.includes('financial')) ? 'financials' :
            target.includes('document') ? 'documents' :
            target.includes('analytics') ? 'analytics' :
            (target.includes('home') || target.includes('dashboard')) ? 'home' :
            null;

          if (pageKey) {
            const { data, error } = await supabase.functions.invoke('agent-hub', {
              body: { action: 'navigate_to_page', params: { page: pageKey } },
            });
            if (error) throw error;
            navData = data;
            // Store pageKey for tab switching
            navData._targetTab = pageKey;
          }
        }

        if (navData?.visual_type === 'navigation' && navData?.navigate_to) {
          updateEvent(thinkingEventId, { status: 'success', message: navData.message || 'Navigated' });
          setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: navData.message || 'Opening...', timestamp: new Date() }]);
          // Pass the target tab to ensure correct tab is activated even on same URL
          const targetTab = navData._targetTab || navData.tab || navData.navigate_to.match(/[?&]tab=([^&]+)/)?.[1];
          await performNavigation(navData.navigate_to, navigate, targetTab);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('[Fasto] Navigation error:', error);
        toast.error('Fasto could not navigate there');
        updateEvent(thinkingEventId, { status: 'error', message: 'Navigation failed' });
      } finally {
        setIsLoading(false);
        setRoutingAgent(null);
      }
    }

    // Detect which agent should handle this
    const agentType = detectAgentType(text);
    const agent = AGENTS[agentType];

    console.log('[Fasto] Routing to agent:', agentType, agent?.name);
    setRoutingAgent(agentType);

    // Add routing activity event
    const routingEventId = addEvent({
      type: 'routing',
      status: 'success',
      message: `Routing to ${agent?.name || 'Operations Agent'}`,
      agentType,
    });

    setIsLoading(true);

    // Add thinking event
    const thinkingEventId = addEvent({
      type: 'thinking',
      status: 'running',
      message: 'Processing your request...',
      agentType,
    });

    try {
      // Build messages array for the agent-hub function
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Add tool call event (simulated - in production this would come from streaming)
      const toolEventId = addEvent({
        type: 'tool_call',
        status: 'running',
        message: 'Querying database...',
        toolName: 'query_projects',
        agentType,
      });

      const startTime = Date.now();

      // Call agent-hub for more powerful multi-agent responses
      const { data, error } = await supabase.functions.invoke('agent-hub', {
        body: {
          messages: [...conversationHistory, { role: 'user', content: userMessage.content }],
          agentType,
          context: {
            source: 'fasto-chat',
            capabilities: agent.capabilities,
          },
        },
      });

      const duration = Date.now() - startTime;

      if (error) throw error;

      // Update events to success
      updateEvent(thinkingEventId, { status: 'success', message: 'Analysis complete' });
      updateEvent(toolEventId, { 
        status: 'success', 
        message: 'Data retrieved successfully',
        duration,
      });

      console.log('[Fasto] Response from agent-hub:', data);

      // Parse response - agent-hub returns { answer, structuredData, agentType }
      const answerText: string = 
        (data?.answer as string) || 
        (data?.response as string) || 
        "I'm sorry, I couldn't process that request.";
      
      const structuredData = data?.structuredData || data?.structured_data;
      const responseAgentType = data?.agentType || agentType;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: answerText,
        timestamp: new Date(),
        agentType: responseAgentType,
        structuredData,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Speak the response if voice is enabled
      if (voiceEnabled && speakResponse) {
        // Add speaking event
        addEvent({
          type: 'speaking',
          status: 'running',
          message: 'Speaking response...',
          agentType: responseAgentType,
        });
        console.log('[Fasto] Calling speakResponse with:', answerText.substring(0, 100));
        speakResponse(answerText);
      }

      // Handle navigation tags emitted by the assistant
      const navMatch = answerText.match(/\[\[NAV:([^|\]]+)\|([^|\]]+)\|([^\]]*)\]\]/);
      if (navMatch) {
        const route = navMatch[2];
        const tab = navMatch[3];
        const [mainTab, subTab] = tab ? tab.split(':') : [null, null];

        if (route && route !== window.location.pathname) {
          // Pass the main tab when navigating to ensure correct tab activation
          await performNavigation(route, navigate, mainTab || undefined);
          return;
        }

        if (mainTab) {
          // If already on the route, use performNavigation to switch tabs
          await performNavigation(window.location.pathname, navigate, mainTab);
        }
      }
    } catch (error) {
      console.error('[Fasto] Error:', error);
      toast.error('Failed to get response from Fasto');

      // Add error event
      addEvent({
        type: 'tool_call',
        status: 'error',
        message: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setRoutingAgent(null);
    }
  }, [messages, voiceEnabled, speakResponse, addEvent, updateEvent, navigate, storeLastProjectId, getLastProjectId]);

  // Public sendText that uses promise-based queue for reliable sequential execution
  const sendText = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;
    
    // Always enqueue - the promise chain ensures sequential execution
    console.log('[Fasto] Enqueueing command:', text, 'Queue length:', queueLength);
    
    if (hasPending || isLoading) {
      toast.info(`Command queued (${queueLength + 1} pending)...`, { duration: 1500 });
    }
    
    await enqueue(async () => {
      await sendTextInternal(text);
    });
  }, [enqueue, queueLength, hasPending, isLoading, sendTextInternal]);

  // Listen for fastoCommand events from the dashboard
  useEffect(() => {
    const handleFastoCommand = (event: CustomEvent<{ command: string }>) => {
      const command = event.detail?.command;
      console.log('[Fasto] Received fastoCommand event:', command);
      
      if (command) {
        toast.info(`Fasto heard: "${command}"`, { duration: 2000 });
        // Open the chat if not expanded
        if (!isExpanded) {
          onToggle();
        }
        // Send the command after a brief delay to allow UI to update
        setTimeout(() => {
          void sendText(command);
        }, 100);
      }
    };

    window.addEventListener('fastoCommand', handleFastoCommand as EventListener);
    console.log('[Fasto] Listening for fastoCommand events');

    return () => {
      window.removeEventListener('fastoCommand', handleFastoCommand as EventListener);
    };
  }, [sendText, isExpanded, onToggle]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSend = async () => {
    await sendText(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceOutput = () => {
    if (isSpeaking && stopSpeaking) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  // Render message content with visual cards
  const renderMessageContent = (message: Message) => {
    const cleanContent = message.content.replace(/\[\[NAV:[^\]]+\]\]/g, '').trim();
    const agentConfig = message.agentType ? AGENTS[message.agentType] : null;

    return (
      <div className="space-y-1">
        {/* Agent indicator for assistant messages */}
        {message.role === 'assistant' && agentConfig && (
          <FastoAgentIndicator
            agentType={message.agentType!}
            agentName={agentConfig.name}
            agentIcon={agentConfig.icon}
            agentColor={agentConfig.color}
          />
        )}
        
        {/* Text content */}
        <p className="text-sm whitespace-pre-wrap">{cleanContent}</p>
        
        {/* Visual cards for structured data */}
        {message.structuredData && (
          <div className="mt-2">
            {parseAndRenderVisualCards(message.structuredData)}
          </div>
        )}
        
        {/* Timestamp */}
        <p className="text-[10px] opacity-60 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    );
  };

  return (
    <div className={cn('transition-all duration-300', isExpanded ? 'h-[400px]' : 'h-auto')}>
      {!isExpanded ? (
        <button
          onClick={onToggle}
          className="w-full p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/50 transition-all text-left"
        >
          <span className="text-muted-foreground">Ask Fasto anything... "Hey Fasto, what's on my schedule today?"</span>
        </button>
      ) : (
        <div className="flex flex-col h-full border rounded-lg bg-muted/30">
          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Hi! I'm Fasto, your AI command center. I can route your requests to specialized agents!
                  </p>
                  
                  {/* Agent Quick Buttons */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {Object.values(AGENTS).map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => {
                          const prompts: Record<string, string> = {
                            operations: "Show me active projects",
                            procurement: "Check my inventory levels",
                            sales: "How many new leads this week?",
                            analytics: "What's my revenue this month?",
                          };
                          setInput(prompts[agent.id] || '');
                          inputRef.current?.focus();
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                      >
                        <span className="text-xl">{agent.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{agent.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{agent.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {[
                      "What's on my schedule today?",
                      "Who is clocked in?",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion);
                          inputRef.current?.focus();
                        }}
                        className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-4 py-2',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border'
                    )}
                  >
                    {renderMessageContent(message)}
                  </div>
                </div>
              ))}
              
              {/* Loading state with agent routing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border rounded-lg px-4 py-3 space-y-2">
                    {routingAgent && AGENTS[routingAgent] && (
                      <FastoAgentIndicator
                        agentType={routingAgent}
                        agentName={AGENTS[routingAgent].name}
                        agentIcon={AGENTS[routingAgent].icon}
                        agentColor={AGENTS[routingAgent].color}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {routingAgent ? `Asking ${AGENTS[routingAgent]?.name}...` : 'Thinking...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Activity Panel - Shows tool executions */}
          {activityEvents.length > 0 && (
            <div className="px-3 py-2 border-t bg-muted/20">
              <FastoActivityPanel
                events={activityEvents}
                isVisible={showActivity}
                onToggle={() => setShowActivity(!showActivity)}
              />
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t bg-background">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Fasto... or say 'Hey Fasto'"
                disabled={isLoading}
                className="flex-1"
              />
              
              {/* Activity Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowActivity(!showActivity)}
                className={cn(activityEvents.some(e => e.status === 'running') && 'text-primary animate-pulse')}
                title="Toggle activity panel"
              >
                <Zap className="w-4 h-4" />
              </Button>
              
              {/* Voice Output Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleVoiceOutput}
                className={cn(isSpeaking && 'text-primary animate-pulse')}
                title={voiceEnabled ? 'Voice responses on' : 'Voice responses off'}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              
              <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
