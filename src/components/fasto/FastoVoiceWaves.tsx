import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FastoVoiceWavesProps {
  mode: 'listening' | 'speaking' | 'idle';
  className?: string;
}

export function FastoVoiceWaves({ mode, className }: FastoVoiceWavesProps) {
  if (mode === 'idle') return null;

  const isListening = mode === 'listening';
  const isSpeaking = mode === 'speaking';

  // Wave bar configurations
  const bars = [
    { delay: 0, height: isListening ? [12, 24, 12] : [8, 20, 8] },
    { delay: 0.1, height: isListening ? [16, 32, 16] : [12, 28, 12] },
    { delay: 0.2, height: isListening ? [20, 40, 20] : [16, 36, 16] },
    { delay: 0.15, height: isListening ? [16, 32, 16] : [12, 28, 12] },
    { delay: 0.05, height: isListening ? [12, 24, 12] : [8, 20, 8] },
  ];

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {bars.map((bar, index) => (
        <motion.div
          key={index}
          className={cn(
            "w-1 rounded-full",
            isListening && "bg-emerald-400",
            isSpeaking && "bg-primary"
          )}
          initial={{ height: bar.height[0] }}
          animate={{ height: bar.height }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: bar.delay,
          }}
        />
      ))}
    </div>
  );
}

// Circular wave rings that pulse outward
export function FastoWaveRings({ 
  mode, 
  size = 120 
}: { 
  mode: 'listening' | 'speaking' | 'thinking' | 'idle';
  size?: number;
}) {
  if (mode === 'idle') return null;

  const ringColors = {
    listening: 'border-emerald-500',
    speaking: 'border-primary',
    thinking: 'border-blue-500',
    idle: 'border-muted'
  };

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ width: size, height: size }}
    >
      {/* Ring 1 */}
      <motion.div
        className={cn(
          "absolute rounded-full border-2",
          ringColors[mode],
          "opacity-60"
        )}
        initial={{ width: size * 0.9, height: size * 0.9, opacity: 0.6 }}
        animate={{
          width: [size * 0.9, size * 1.3],
          height: [size * 0.9, size * 1.3],
          opacity: [0.6, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
      
      {/* Ring 2 */}
      <motion.div
        className={cn(
          "absolute rounded-full border",
          ringColors[mode],
          "opacity-40"
        )}
        initial={{ width: size * 0.9, height: size * 0.9, opacity: 0.4 }}
        animate={{
          width: [size * 0.9, size * 1.5],
          height: [size * 0.9, size * 1.5],
          opacity: [0.4, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.5,
        }}
      />

      {/* Ring 3 - Only for speaking */}
      {mode === 'speaking' && (
        <motion.div
          className={cn(
            "absolute rounded-full border",
            ringColors[mode],
            "opacity-30"
          )}
          initial={{ width: size * 0.9, height: size * 0.9, opacity: 0.3 }}
          animate={{
            width: [size * 0.9, size * 1.7],
            height: [size * 0.9, size * 1.7],
            opacity: [0.3, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeOut",
            delay: 1,
          }}
        />
      )}
    </div>
  );
}

// Thinking dots animation
export function FastoThinkingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-blue-400"
          animate={{
            y: [0, -8, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

// Status message component
export function FastoStatusMessage({ 
  status, 
  toolName 
}: { 
  status: 'connecting' | 'listening' | 'thinking' | 'speaking' | 'idle' | 'error';
  toolName?: string;
}) {
  const messages = {
    connecting: "Waking up Fasto",
    listening: "I'm listening",
    thinking: toolName ? `${toolName}` : "Let me check that",
    speaking: "Speaking",
    idle: "Ready to help",
    error: "Something went wrong"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <span>{messages[status]}</span>
      {(status === 'connecting' || status === 'thinking') && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ...
        </motion.span>
      )}
    </motion.div>
  );
}

// Typing indicator for assistant messages
export function FastoTypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-muted rounded-2xl rounded-bl-md max-w-[100px]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-muted-foreground/40"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}
