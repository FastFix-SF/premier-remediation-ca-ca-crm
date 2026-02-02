import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Phone, PhoneOff, Loader2, Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFastoRealtimeVoice, VoiceStatus } from '@/hooks/useFastoRealtimeVoice';
import { FastoVoiceWaves, FastoThinkingDots, FastoTypingIndicator } from '@/components/fasto/FastoVoiceWaves';
import { useNavigate } from 'react-router-dom';
import { resolveMobileNavigationUrl } from '@/mobile/config/mobileNavRegistry';
import { useFastoSettings } from '@/hooks/useFastoSettings';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import fastoRingImage from '@/assets/fasto-ring.png';

interface MobileFastoPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_MESSAGES: Record<VoiceStatus, { en: string; es: string }> = {
  idle: { en: 'Tap to start', es: 'Toca para iniciar' },
  connecting: { en: 'Connecting...', es: 'Conectando...' },
  listening: { en: 'Listening...', es: 'Escuchando...' },
  thinking: { en: 'Thinking...', es: 'Pensando...' },
  speaking: { en: 'Speaking...', es: 'Hablando...' },
  error: { en: 'Connection error', es: 'Error de conexión' }
};

const CHAT_STATUS_MESSAGES: Record<VoiceStatus, { en: string; es: string }> = {
  idle: { en: 'Chat Mode', es: 'Modo Chat' },
  connecting: { en: 'Connecting...', es: 'Conectando...' },
  listening: { en: 'Ready', es: 'Listo' },
  thinking: { en: 'Thinking...', es: 'Pensando...' },
  speaking: { en: 'Responding...', es: 'Respondiendo...' },
  error: { en: 'Connection error', es: 'Error de conexión' }
};

export const MobileFastoPanel: React.FC<MobileFastoPanelProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { settings } = useFastoSettings();
  const { data: adminStatus } = useAdminStatus();
  const { language } = useLanguage();
  const isOwner = adminStatus?.isOwner || false;
  const isSpanish = language === 'es';
  const assistantName = isSpanish ? 'Fauste' : 'Fasto';
  
  // Determine user role for permissions
  const getUserRole = () => {
    if (adminStatus?.isOwner) return 'owner';
    if (adminStatus?.isAdmin) return 'admin';
    if (adminStatus?.isLeader) return 'leader';
    return 'contributor';
  };
  
  const {
    status,
    isConnected,
    isVoiceMuted,
    isTextOnlyMode,
    transcripts,
    isTyping,
    connect,
    disconnect,
    sendTextMessage,
    toggleVoiceMute
  } = useFastoRealtimeVoice();

  const [textInput, setTextInput] = React.useState('');
  const transcriptsEndRef = useRef<HTMLDivElement>(null);

  // HARD OFF: Disconnect immediately when Fasto is disabled
  useEffect(() => {
    if (!settings.enabled && isConnected) {
      console.log('[MobileFastoPanel] Fasto disabled - disconnecting session');
      disconnect();
      onClose();
    }
  }, [settings.enabled, isConnected, disconnect, onClose]);

  // Also listen for settings change events (cross-tab sync)
  useEffect(() => {
    const handleSettingsChange = (e: CustomEvent<{ enabled: boolean }>) => {
      if (!e.detail.enabled && isConnected) {
        console.log('[MobileFastoPanel] Fasto disabled via event - disconnecting');
        disconnect();
        onClose();
      }
    };

    window.addEventListener('fasto-settings-change', handleSettingsChange as EventListener);
    return () => window.removeEventListener('fasto-settings-change', handleSettingsChange as EventListener);
  }, [isConnected, disconnect, onClose]);

  // Listen for mobile navigation events (fix: listen for both event names)
  useEffect(() => {
    const handleMobileNavigation = (e: CustomEvent<{ url: string; tab?: string }>) => {
      const { url } = e.detail;
      console.log('[MobileFastoPanel] Navigation event:', url);
      
      // Try to resolve to mobile route
      const mobileUrl = resolveMobileNavigationUrl(url) || url;
      
      // If it's already a mobile route, use it directly
      if (mobileUrl.startsWith('/mobile')) {
        navigate(mobileUrl);
        onClose();
      } else {
        // For admin routes, we might want to show a message
        console.log('[MobileFastoPanel] Non-mobile route requested:', mobileUrl);
      }
    };

    // Listen for both event names (fasto-navigation and fasto-navigate)
    window.addEventListener('fasto-navigation', handleMobileNavigation as EventListener);
    window.addEventListener('fasto-navigate', handleMobileNavigation as EventListener);
    return () => {
      window.removeEventListener('fasto-navigation', handleMobileNavigation as EventListener);
      window.removeEventListener('fasto-navigate', handleMobileNavigation as EventListener);
    };
  }, [navigate, onClose]);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, isTyping]);

  // Emit status changes for the tab bar button to sync
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('fasto-status-change', { detail: { status } }));
  }, [status]);

  // Auto-connect when panel opens (only if enabled)
  useEffect(() => {
    if (isOpen && !isConnected && status === 'idle' && settings.enabled) {
      // Small delay to let the panel animate in
      const timer = setTimeout(() => {
        // Connect with appropriate options based on role and language
        connect({
          textOnly: !isOwner, // Non-owners get text-only mode
          language: language,
          userRole: getUserRole()
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isConnected, status, connect, settings.enabled, isOwner, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && isConnected) {
      sendTextMessage(textInput.trim());
      setTextInput('');
    }
  };

  const handleClose = () => {
    if (isConnected) {
      disconnect();
    }
    onClose();
  };

  const handleConnect = () => {
    connect({
      textOnly: !isOwner,
      language: language,
      userRole: getUserRole()
    });
  };

  const getStatusMessage = () => {
    const messages = isOwner ? STATUS_MESSAGES : CHAT_STATUS_MESSAGES;
    return messages[status][isSpanish ? 'es' : 'en'];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-background rounded-t-3xl",
              "max-h-[85vh] flex flex-col",
              "shadow-2xl"
            )}
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom), 16px)'
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border/50">
              <div className="flex items-center gap-3">
                <img src={fastoRingImage} alt={assistantName} className="w-10 h-10" />
                <div>
                  <h2 className="font-semibold text-foreground">{assistantName}</h2>
                  <p className="text-xs text-muted-foreground">
                    {getStatusMessage()}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Transcripts */}
            <ScrollArea className="flex-1 px-4 py-4 min-h-[200px] max-h-[40vh]">
              <div className="space-y-3">
                {transcripts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <motion.div
                      animate={isConnected ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3"
                    >
                      {isOwner ? (
                        <Mic className="h-7 w-7 text-primary/60" />
                      ) : (
                        <MessageSquare className="h-7 w-7 text-primary/60" />
                      )}
                    </motion.div>
                    <p className="text-sm text-muted-foreground">
                      {isConnected 
                        ? (isOwner 
                            ? (isSpanish ? "Estoy escuchando..." : "I'm listening...") 
                            : (isSpanish ? "Escribe tu mensaje abajo" : "Type your message below"))
                        : (isSpanish ? `Conectando a ${assistantName}...` : `Connecting to ${assistantName}...`)}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {isOwner 
                        ? (isSpanish ? 'Intenta decir "Ir a mi horario" o "Fichar entrada"' : 'Try saying "Go to my schedule" or "Clock in"')
                        : (isSpanish ? 'Intenta escribir "Ir a mi horario" o "Fichar entrada"' : 'Try typing "Go to my schedule" or "Clock in"')}
                    </p>
                  </div>
                ) : (
                  transcripts.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                          msg.role === 'user'
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        {msg.content}
                      </div>
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

                <div ref={transcriptsEndRef} />
              </div>
            </ScrollArea>

            {/* Voice Orb - Only for owners */}
            {isOwner && (
              <div className="flex justify-center items-center gap-4 py-4 border-t border-border/50">
                {/* Mute/Unmute button for owners */}
                {isConnected && !isTextOnlyMode && (
                  <motion.button
                    onClick={toggleVoiceMute}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                      isVoiceMuted 
                        ? "bg-destructive/20 text-destructive" 
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    whileTap={{ scale: 0.95 }}
                    title={isVoiceMuted ? (isSpanish ? "Activar micrófono" : "Unmute") : (isSpanish ? "Silenciar micrófono" : "Mute")}
                  >
                    {isVoiceMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </motion.button>
                )}

                <div className="relative">
                  {/* Wave animation when speaking/listening */}
                  <AnimatePresence>
                    {(status === 'speaking' || status === 'listening') && !isVoiceMuted && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-1/2 -translate-x-1/2 -bottom-6"
                      >
                        <FastoVoiceWaves mode={status === 'speaking' ? 'speaking' : 'listening'} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    onClick={isConnected ? disconnect : handleConnect}
                    className="relative"
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Glow */}
                    {isConnected && !isVoiceMuted && (
                      <motion.div
                        animate={{
                          opacity: [0.3, 0.6, 0.3],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={cn(
                          "absolute inset-0 rounded-full blur-xl",
                          status === 'speaking' ? "bg-primary" :
                          status === 'listening' ? "bg-emerald-500" :
                          status === 'thinking' ? "bg-blue-500" : "bg-muted"
                        )}
                        style={{ transform: 'scale(1.5)' }}
                      />
                    )}

                    {/* Main orb */}
                    <motion.div
                      className={cn(
                        "relative w-20 h-20 rounded-full flex items-center justify-center",
                        "shadow-lg transition-colors duration-300",
                        isConnected
                          ? isVoiceMuted
                            ? "bg-gradient-to-br from-muted-foreground/40 to-muted"
                            : status === 'speaking'
                              ? "bg-gradient-to-br from-primary to-primary/80"
                              : status === 'listening'
                                ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                                : status === 'thinking'
                                  ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                  : "bg-gradient-to-br from-muted to-muted/80"
                          : "bg-gradient-to-br from-muted-foreground/20 to-muted"
                      )}
                      animate={status === 'connecting' ? { rotate: 360 } : {}}
                      transition={{ duration: 2, repeat: status === 'connecting' ? Infinity : 0, ease: 'linear' }}
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
                  </motion.button>
                </div>
              </div>
            )}

            {/* Text input - Always visible for non-owners, only when connected for owners */}
            {(isConnected || !isOwner) && (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className={cn(
                  "flex gap-2 px-4 pb-4",
                  !isOwner && "border-t border-border/50 pt-4"
                )}
              >
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    isOwner 
                      ? (isSpanish ? "O escribe un mensaje..." : "Or type a message...") 
                      : (isSpanish ? "Escribe tu mensaje..." : "Type your message...")
                  }
                  className="flex-1"
                  autoFocus={!isOwner}
                />
                <Button type="submit" size="icon" disabled={!textInput.trim() || !isConnected}>
                  <Send className="h-4 w-4" />
                </Button>
              </motion.form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};