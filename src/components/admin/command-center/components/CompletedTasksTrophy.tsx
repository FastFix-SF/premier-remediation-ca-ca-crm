import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, ChevronDown, ChevronUp, CheckCircle2, Zap, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface CompletedTask {
  id: string;
  title: string;
  priority: string;
  completed_at?: string;
  points: number;
}

interface CompletedTasksTrophyProps {
  tasks: CompletedTask[];
  totalXPToday: number;
}

export const CompletedTasksTrophy: React.FC<CompletedTasksTrophyProps> = ({
  tasks,
  totalXPToday,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/40 via-green-900/30 to-teal-900/40 border border-emerald-500/30 shadow-xl shadow-emerald-500/10"
    >
      {/* Animated sparkle background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-2 right-10 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
        <div className="absolute top-8 right-24 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping delay-300" />
        <div className="absolute bottom-4 left-16 w-1 h-1 bg-green-400 rounded-full animate-ping delay-500" />
      </div>

      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Trophy className="w-6 h-6 text-black" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-slate-900">
              {tasks.length}
            </div>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              COMPLETED TODAY
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-emerald-400 font-medium">{tasks.length} tasks crushed</span>
              <span className="text-white/30">•</span>
              <span className="text-yellow-400 font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                +{totalXPToday} XP earned
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 font-bold px-3 py-1">
            🎉 Great work!
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/60" />
          )}
        </div>
      </button>

      {/* Expandable task list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-emerald-500/20 px-4 py-3">
              <ScrollArea className="max-h-[250px]">
                <div className="space-y-2">
                  {tasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate line-through opacity-75">
                          {task.title}
                        </p>
                        {task.completed_at && (
                          <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {format(new Date(task.completed_at), 'h:mm a')}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-0 font-bold">
                        +{task.points} XP
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
