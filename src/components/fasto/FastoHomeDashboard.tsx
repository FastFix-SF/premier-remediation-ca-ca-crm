import React, { useState, useCallback } from 'react';
import { 
  FeaturedProjectWidget,
  TodayScheduleWidget,
  MiniCalendarWidget,
  BusinessWeatherWidget,
  CompactStatsWidget,
  QuickAppsWidget,
  FastoVoiceOrbWidget
} from './widgets';
import { FastoOrb } from './FastoOrb';
import { FastoVoiceAgent } from './FastoVoiceAgent';
import { FastoChatPanel } from './FastoChatPanel';
import { useFastoVoice } from '@/hooks/useFastoVoice';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMember } from '@/hooks/useTeamMember';
import { X, MessageSquare, Phone, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const FastoHomeDashboard = () => {
  const { user } = useAuth();
  const { getCurrentUserDisplayName } = useTeamMember();
  const [showFastoPanel, setShowFastoPanel] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'voice' | 'chat'>('voice');
  const displayName = getCurrentUserDisplayName();

  const handleCommand = useCallback((command: string) => {
    console.log('[Fasto Dashboard] Received command:', command);
    setShowFastoPanel(true);
    const event = new CustomEvent('fastoCommand', { detail: { command } });
    window.dispatchEvent(event);
  }, []);

  const {
    isListening,
    isWakeWordActive,
    isSpeaking,
    speak,
    stopSpeaking,
  } = useFastoVoice({
    wakeWord: 'hey fasto',
    enableContinuousListening: true,
    speakResponses: true,
    onCommand: handleCommand,
    onWakeWordDetected: () => {
      setShowFastoPanel(true);
      toast.info('🎤 Fasto is listening...', { duration: 1500 });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Grid - Echo Show 15 Inspired Layout */}
      <div className="relative z-10 grid grid-cols-12 grid-rows-[1fr_auto] gap-4 h-[calc(100vh-48px)] max-h-[900px]">
        
        {/* Row 1: Featured Project (5 cols), Schedule (4 cols), Calendar (3 cols) */}
        <div className="col-span-12 lg:col-span-5 row-span-1">
          <FeaturedProjectWidget />
        </div>
        
        <div className="col-span-12 md:col-span-6 lg:col-span-4 row-span-1">
          <TodayScheduleWidget />
        </div>
        
        <div className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1">
          <MiniCalendarWidget />
        </div>

        {/* Row 2: Stats (7 cols), Weather (2 cols), Quick Apps (3 cols) */}
        <div className="col-span-12 lg:col-span-7">
          <CompactStatsWidget />
        </div>
        
        <div className="col-span-6 lg:col-span-2">
          <BusinessWeatherWidget />
        </div>
        
        <div className="col-span-6 lg:col-span-3">
          <QuickAppsWidget />
        </div>
      </div>

      {/* Floating Fasto Orb */}
      <div 
        className={cn(
          "fixed bottom-8 right-8 z-50 transition-all duration-500",
          showFastoPanel && "opacity-0 pointer-events-none scale-75"
        )}
      >
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/40 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity" />
          
          <FastoOrb
            isActive={false}
            isListening={isListening || isWakeWordActive}
            isThinking={false}
            isSpeaking={isSpeaking}
            onClick={() => setShowFastoPanel(true)}
            size="lg"
          />

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap border border-white/10">
              Ask Fasto
            </div>
          </div>

          {/* Status indicator */}
          {(isListening || isSpeaking) && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
          )}
        </div>
      </div>

      {/* Fasto AI Panel (Modal) */}
      {showFastoPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-2xl bg-slate-900/95 rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in"
            style={{ maxHeight: 'calc(100vh - 100px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-4">
                <FastoOrb
                  isActive={true}
                  isListening={isListening}
                  isThinking={false}
                  isSpeaking={isSpeaking}
                  size="md"
                />
                <div>
                  <h3 className="text-white font-semibold text-lg">Fasto AI</h3>
                  <p className="text-white/50 text-sm">
                    {voiceMode === 'voice' ? 'Voice Conversation' : 'Chat Mode'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Toggle */}
                <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
                  <button
                    onClick={() => setVoiceMode('chat')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                      voiceMode === 'chat' 
                        ? "bg-white/20 text-white" 
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">Chat</span>
                  </button>
                  <button
                    onClick={() => setVoiceMode('voice')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                      voiceMode === 'voice' 
                        ? "bg-white/20 text-white" 
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Voice</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowFastoPanel(false)}
                  className="p-2.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="h-[500px]">
              {voiceMode === 'voice' ? (
                <FastoVoiceAgent />
              ) : (
                <div className="p-5 h-full">
                  <FastoChatPanel
                    isExpanded={true}
                    onToggle={() => {}}
                    speakResponse={speak}
                    isSpeaking={isSpeaking}
                    stopSpeaking={stopSpeaking}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
