import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Star, Flame, Trophy, Zap, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { getLevelFromXP, getLevelColor, getLevelTitle } from './XPPopup';

interface FocusArenaHeaderProps {
  currentDate: Date;
  isToday: boolean;
  totalXP: number;
  streak: number;
  tasksCompletedToday: number;
}

export const FocusArenaHeader: React.FC<FocusArenaHeaderProps> = ({
  currentDate,
  isToday,
  totalXP,
  streak,
  tasksCompletedToday,
}) => {
  const { level, progress, xpInLevel, nextLevelXP } = getLevelFromXP(totalXP);
  const levelColor = getLevelColor(level);
  const levelTitle = getLevelTitle(level);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 shadow-2xl">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative p-6 md:p-8">
        {/* Top Row: Focus Arena Title + Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Target className="w-8 h-8 text-white" />
              </div>
              {isToday && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse" />
              )}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-200 tracking-tight">
                FOCUS ARENA
              </h1>
              <p className="text-white/50 text-sm font-medium">
                Level up your productivity • Complete tasks • Earn XP
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Level Badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${levelColor} shadow-lg`}>
              <Star className="w-5 h-5 text-black/70" />
              <div className="text-black font-bold">
                <span className="text-lg">Lvl {level}</span>
                <span className="text-xs ml-1 opacity-70">{levelTitle}</span>
              </div>
            </div>

            {/* XP Progress */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <Zap className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="text-white font-bold">{totalXP.toLocaleString()} XP</div>
                <Progress value={progress} className="h-1 w-16 bg-white/10 mt-0.5" />
              </div>
            </div>

            {/* Streak */}
            {streak > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                <span className="text-orange-400 font-bold">{streak}-day streak</span>
              </div>
            )}

            {/* Daily Wins */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">{tasksCompletedToday} today</span>
            </div>
          </div>
        </div>

        {/* Date Display - Large & Prominent */}
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-4">
            <span className="text-7xl md:text-8xl font-black text-white tracking-tighter">
              {format(currentDate, 'd')}
            </span>
            <div className="pb-2">
              <div className="text-2xl md:text-3xl font-bold text-white/90">
                {format(currentDate, 'EEEE')}
              </div>
              <div className="text-lg text-white/50 font-medium">
                {format(currentDate, 'MMMM yyyy')}
              </div>
            </div>
          </div>

          {isToday && (
            <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-black font-bold text-base px-4 py-2 shadow-lg shadow-green-500/30 animate-pulse">
              <TrendingUp className="w-4 h-4 mr-1" />
              TODAY
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
