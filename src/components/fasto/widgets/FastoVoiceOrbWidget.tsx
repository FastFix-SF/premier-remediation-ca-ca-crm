import React, { useState, useCallback } from 'react';
import { FastoOrb } from '../FastoOrb';
import { FastoVoiceAgent } from '../FastoVoiceAgent';
import { FastoChatPanel } from '../FastoChatPanel';
import { useFastoVoice } from '@/hooks/useFastoVoice';
import { X, MessageSquare, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FastoVoiceOrbWidgetProps {
  defaultMode?: 'voice' | 'chat';
}

export const FastoVoiceOrbWidget = ({ defaultMode = 'voice' }: FastoVoiceOrbWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<'voice' | 'chat'>(defaultMode);

  const handleCommand = useCallback((command: string) => {
    console.log('[Fasto Widget] Received command:', command);
    setIsExpanded(true);
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
      setIsExpanded(true);
      toast.info('🎤 Fasto is listening...', { duration: 1500 });
    },
  });

  return (
    <>
      {/* Floating Orb */}
      <div 
        className={cn(
          "fixed bottom-6 right-6 z-50 transition-all duration-500",
          isExpanded && "opacity-0 pointer-events-none scale-75"
        )}
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
          
          <FastoOrb
            isActive={false}
            isListening={isListening || isWakeWordActive}
            isThinking={false}
            isSpeaking={isSpeaking}
            onClick={() => setIsExpanded(true)}
            size="lg"
          />

          {/* Status indicator */}
          {(isListening || isSpeaking) && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
          )}
        </div>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in"
            style={{ maxHeight: 'calc(100vh - 100px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <FastoOrb
                  isActive={true}
                  isListening={isListening}
                  isThinking={false}
                  isSpeaking={isSpeaking}
                  size="sm"
                />
                <div>
                  <h3 className="text-white font-semibold">Fasto AI</h3>
                  <p className="text-white/50 text-xs">
                    {mode === 'voice' ? 'Voice Mode' : 'Chat Mode'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Toggle */}
                <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setMode('chat')}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      mode === 'chat' ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
                    )}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMode('voice')}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      mode === 'voice' ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
                    )}
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="h-[500px]">
              {mode === 'voice' ? (
                <FastoVoiceAgent />
              ) : (
                <div className="p-4 h-full">
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
    </>
  );
};
