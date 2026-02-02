import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import fastoRingImage from '@/assets/fasto-ring.png';

interface MobileFastoButtonProps {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  onClick: () => void;
}

export const MobileFastoButton: React.FC<MobileFastoButtonProps> = ({
  isActive,
  isListening,
  isSpeaking,
  isThinking,
  onClick
}) => {
  const { language } = useLanguage();
  const isSpanish = language === 'es';
  const label = isSpanish ? 'Fauste' : 'Fasto';

  // Determine the current state for animations
  const getGlowColor = () => {
    if (isListening) return 'rgba(239, 68, 68, 0.6)'; // Red
    if (isSpeaking) return 'rgba(34, 197, 94, 0.6)'; // Green
    if (isThinking) return 'rgba(59, 130, 246, 0.6)'; // Blue
    if (isActive) return 'rgba(147, 51, 234, 0.5)'; // Purple
    return 'transparent';
  };

  const shouldAnimate = isActive || isListening || isSpeaking || isThinking;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center",
        "-mt-6", // Raise the button above the tab bar
        "focus:outline-none touch-manipulation"
      )}
      aria-label="Activate Fasto voice assistant"
    >
      {/* Outer glow effect */}
      <AnimatePresence>
        {shouldAnimate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.2, 1]
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute inset-0 rounded-full blur-lg"
            style={{
              background: getGlowColor(),
              width: 72,
              height: 72,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Main button container */}
      <motion.div
        className="relative w-16 h-16 flex items-center justify-center"
        whileTap={{ scale: 0.92 }}
        animate={
          isListening
            ? { scale: [1, 1.08, 1] }
            : isSpeaking
              ? { scale: [1, 1.05, 1] }
              : isThinking
                ? { rotate: [0, 360] }
                : {}
        }
        transition={
          isThinking
            ? { duration: 2, repeat: Infinity, ease: 'linear' }
            : { duration: 1, repeat: shouldAnimate ? Infinity : 0, ease: 'easeInOut' }
        }
      >
        {/* Gradient ring image */}
        <img
          src={fastoRingImage}
          alt="Fasto"
          className="w-16 h-16 object-contain"
          draggable={false}
        />

        {/* Status overlay for listening (red tint) */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full bg-red-500 mix-blend-overlay"
            />
          )}
        </AnimatePresence>

        {/* Status overlay for speaking (green tint) */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full bg-green-500 mix-blend-overlay"
            />
          )}
        </AnimatePresence>

        {/* Status overlay for thinking (blue tint) */}
        <AnimatePresence>
          {isThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full bg-blue-500 mix-blend-overlay"
            />
          )}
        </AnimatePresence>

        {/* Active indicator ring */}
        <AnimatePresence>
          {isActive && !isListening && !isSpeaking && !isThinking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.1, 1]
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border-2 border-primary/50"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Label */}
      <span className={cn(
        "text-[10px] font-medium mt-1 transition-colors duration-200",
        isActive ? "text-primary" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </button>
  );
};
