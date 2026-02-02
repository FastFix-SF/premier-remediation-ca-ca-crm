import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star } from 'lucide-react';

interface XPPopupProps {
  points: number;
  isVisible: boolean;
  onComplete?: () => void;
}

export const XPPopup: React.FC<XPPopupProps> = ({ points, isVisible, onComplete }) => {
  useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 0 }}
          animate={{ opacity: 1, scale: 1.2, y: -30 }}
          exit={{ opacity: 0, scale: 0.8, y: -60 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
        >
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black font-black text-3xl px-6 py-3 rounded-full shadow-2xl shadow-yellow-500/50">
            <Zap className="w-8 h-8 fill-black" />
            +{points} XP
            <Star className="w-6 h-6 fill-black" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Calculate level from XP
export const getLevelFromXP = (xp: number): { level: number; nextLevelXP: number; progress: number; xpInLevel: number } => {
  // Progressive level thresholds
  const thresholds = [0, 50, 150, 300, 500, 750, 1100, 1500, 2000, 2600, 3300, 4100, 5000, 6000, 7100, 8300, 9600, 11000, 12500, 14100];
  
  let level = 1;
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (xp >= thresholds[i + 1]) {
      level = i + 2;
    } else {
      break;
    }
  }
  
  const currentThreshold = thresholds[level - 1] || 0;
  const nextThreshold = thresholds[level] || currentThreshold + 1500;
  const xpInLevel = xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = Math.min(100, (xpInLevel / xpNeeded) * 100);
  
  return { level, nextLevelXP: nextThreshold, progress, xpInLevel };
};

// Get level badge color
export const getLevelColor = (level: number): string => {
  if (level >= 15) return 'from-yellow-400 to-amber-500'; // Gold
  if (level >= 10) return 'from-purple-400 to-pink-500'; // Diamond
  if (level >= 7) return 'from-cyan-400 to-blue-500'; // Platinum
  if (level >= 4) return 'from-gray-300 to-gray-400'; // Silver
  return 'from-orange-600 to-orange-700'; // Bronze
};

export const getLevelTitle = (level: number): string => {
  if (level >= 15) return 'Legend';
  if (level >= 12) return 'Master';
  if (level >= 10) return 'Expert';
  if (level >= 7) return 'Pro';
  if (level >= 4) return 'Intermediate';
  return 'Rookie';
};
