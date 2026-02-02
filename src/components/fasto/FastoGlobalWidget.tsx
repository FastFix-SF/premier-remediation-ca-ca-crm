import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, X, Settings2, MessageCircle, Phone, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFastoVoice } from '@/hooks/useFastoVoice';
import { FastoChatPanel } from './FastoChatPanel';
import { FastoVoiceSettings } from './FastoVoiceSettings';
import { FastoOrb } from './FastoOrb';
import { FastoVoiceAgent } from './FastoVoiceAgent';
import { toast } from 'sonner';

/**
 * Global Fasto widget that can be mounted outside of tab content
 * so voice listening and chat work on ALL admin tabs
 */
export const FastoGlobalWidget: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showListeningToast, setShowListeningToast] = useState(false);
  const [isPinned, setIsPinned] = useState(false); // Keep visible when actively interacting
  
  // Drag state for movable widget
  const [position, setPosition] = useState({ x: 16, y: 16 }); // bottom-right offset
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  const handleCommand = (command: string) => {
    console.log('[Fasto Global] Command received:', command);
    // Open chat panel and dispatch command event
    setIsChatOpen(true);
    window.dispatchEvent(new CustomEvent('fastoCommand', { detail: { command } }));
  };

  const {
    isListening,
    isWakeWordActive,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    speechRate,
    setSpeechRate,
  } = useFastoVoice({
    enableContinuousListening: true,
    wakeWord: 'hey fasto',
    onWakeWordDetected: () => {
      console.log('[Fasto Global] Wake word detected!');
    },
    onCommand: handleCommand,
    speakResponses: true,
  });

  // Listen for auto-resume event from voice hook (Alexa-style)
  useEffect(() => {
    const handleListeningResumed = () => {
      console.log('[Fasto Global] Listening resumed after speech!');
      setShowListeningToast(true);
      setTimeout(() => setShowListeningToast(false), 2000);
    };
    
    const handleStartListening = () => {
      console.log('[Fasto Global] Auto-starting listening...');
      startListening();
    };

    window.addEventListener('fastoListeningResumed', handleListeningResumed);
    window.addEventListener('fastoStartListening', handleStartListening);
    
    return () => {
      window.removeEventListener('fastoListeningResumed', handleListeningResumed);
      window.removeEventListener('fastoStartListening', handleStartListening);
    };
  }, [startListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Pin the widget when actively engaged
  useEffect(() => {
    if (isSpeaking || isListening || isChatOpen || isVoiceOpen) {
      setIsPinned(true);
    } else {
      // Unpin after a delay so user can re-engage
      const timer = setTimeout(() => setIsPinned(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSpeaking, isListening, isChatOpen, isVoiceOpen]);

  // Always show if speaking, listening, or chat open - ensures bar never "disappears"
  const isActivelyEngaged = isSpeaking || isListening || isChatOpen || isVoiceOpen || isPinned;

  // Open the full Fasto Voice Agent panel
  const openVoiceAgent = useCallback(() => {
    setIsVoiceOpen(true);
    setIsChatOpen(false);
  }, []);

  // Drag handlers for movable widget
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
    setIsDragging(true);
  }, [position]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragRef.current || !isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = dragRef.current.startX - clientX;
    const deltaY = dragRef.current.startY - clientY;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 100, dragRef.current.startPosX + deltaX));
    const newY = Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.startPosY + deltaY));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  // Add/remove drag listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  return (
    <>
      {/* Floating Control Bar - Draggable position */}
      <div 
        className={cn(
          "fixed z-50 flex flex-col items-end gap-2 transition-opacity duration-300",
          isActivelyEngaged ? "opacity-100" : "opacity-90 hover:opacity-100",
          isDragging && "cursor-grabbing"
        )}
        style={{ bottom: position.y, right: position.x }}
      >
        {/* Voice Settings Popover */}
        {showSettings && (
          <div className="bg-card border rounded-xl shadow-lg p-4 w-72 mb-2 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Voice Settings</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowSettings(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <FastoVoiceSettings
              availableVoices={availableVoices}
              selectedVoice={selectedVoice}
              onSelectVoice={setSelectedVoice}
              speechRate={speechRate}
              onSpeechRateChange={setSpeechRate}
            />
          </div>
        )}

        {/* Full Voice Agent Panel */}
        {isVoiceOpen && (
          <div className="bg-card border rounded-2xl shadow-2xl w-[420px] max-h-[600px] mb-2 overflow-hidden animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                <FastoOrb 
                  isListening={isListening} 
                  isActive={true}
                  isSpeaking={isSpeaking}
                  size="md"
                />
                <div>
                  <span className="text-base font-semibold">Fasto AI</span>
                  <p className="text-xs text-muted-foreground">Voice Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => {
                    setIsVoiceOpen(false);
                    setIsChatOpen(true);
                  }}
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1" />
                  Chat
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsVoiceOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="h-[500px]">
              <FastoVoiceAgent />
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {isChatOpen && !isVoiceOpen && (
          <div className="bg-card border rounded-xl shadow-xl w-[360px] max-h-[500px] mb-2 overflow-hidden animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between p-3 border-b bg-muted/50">
              <div className="flex items-center gap-2">
                <FastoOrb 
                  isListening={isListening} 
                  isActive={isWakeWordActive}
                  isSpeaking={isSpeaking}
                  size="sm"
                />
                <span className="text-sm font-medium">Fasto Chat</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setIsChatOpen(false);
                    setIsVoiceOpen(true);
                  }}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Voice
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsChatOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <FastoChatPanel
              isExpanded={true}
              onToggle={() => setIsChatOpen(false)}
              speakResponse={speak}
              isSpeaking={isSpeaking}
              stopSpeaking={stopSpeaking}
            />
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center gap-1 bg-card border rounded-full shadow-lg px-2 py-1.5">
          {/* Drag Handle */}
          <div
            className="h-8 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            title="Drag to move"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          {/* Voice Agent Button - Opens full Fasto AI */}
          <Button
            variant={isVoiceOpen ? 'default' : 'ghost'}
            size="icon"
            className={cn(
              'h-10 w-10 rounded-full transition-all',
              isVoiceOpen && 'bg-primary text-primary-foreground',
              isListening && 'animate-pulse ring-2 ring-primary/50',
              isWakeWordActive && 'ring-2 ring-green-500'
            )}
            onClick={openVoiceAgent}
            title="Open Fasto Voice AI"
          >
            <Phone className="w-5 h-5" />
          </Button>

          {/* Legacy Mic Toggle for Hey Fasto wake word */}
          <Button
            variant={isListening ? 'default' : 'ghost'}
            size="icon"
            className={cn(
              'h-8 w-8 rounded-full transition-all',
              isListening && 'bg-emerald-500 text-white animate-pulse'
            )}
            onClick={toggleListening}
            title={isListening ? 'Stop listening' : 'Start Hey Fasto mode'}
          >
            {isListening ? (
              <Mic className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>

          {/* Open Chat - Always visible when chat/voice closed */}
          {!isChatOpen && !isVoiceOpen && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full px-3 text-xs gap-1.5",
                (isSpeaking || isListening) && "bg-primary/10"
              )}
              onClick={() => setIsChatOpen(true)}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {isSpeaking ? 'Fasto speaking...' : isListening ? 'Listening...' : 'Chat'}
            </Button>
          )}
        </div>

        {/* Status Pill - Shows current state */}
        <div className={cn(
          "text-[10px] bg-card/90 backdrop-blur px-3 py-1.5 rounded-full transition-all flex items-center gap-2",
          (isSpeaking || isListening || isWakeWordActive) && "shadow-lg",
          isSpeaking && "ring-1 ring-primary/50"
        )}>
          {isSpeaking ? (
            <>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary font-medium">Fasto is speaking...</span>
              <button 
                onClick={stopSpeaking}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                (stop)
              </button>
            </>
          ) : isWakeWordActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-600 dark:text-green-400 font-medium">Wake word detected!</span>
            </>
          ) : isListening ? (
            <>
              <span className={cn(
                "w-2 h-2 rounded-full bg-primary",
                showListeningToast ? "animate-pulse" : "animate-ping"
              )} />
              <span className="text-muted-foreground">
                {showListeningToast ? "I'm listening..." : 'Say "Hey Fasto..."'}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Fasto is ready</span>
          )}
        </div>
      </div>
    </>
  );
};
