import React from 'react';
import { X, Flame, Award, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';
import { Habit } from '../../types';
import { useHabits } from '../../context/HabitsContext';
import { useAuth } from '../../context/AuthContext';
import { computeHabitDetailedStats, generateHeatmapData } from '../../utils/statistics';
import { formatReadableDate, getTodayDateString } from '../../utils/dates';

interface HabitDetailModalProps {
  habit: Habit | null;
  onClose: () => void;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({ habit, onClose }) => {
  const { completions } = useHabits();
  const { settings } = useAuth();

  if (!habit) return null;

  const todayStr = getTodayDateString(settings?.timezone || 'UTC');
  const stats = computeHabitDetailedStats(habit, completions, todayStr);
  const habitHeatmap = generateHeatmapData(completions, todayStr, habit.id);

  // Recent history (last 10 completions)
  const recentCompletions = completions
    .filter(c => c.habit_id === habit.id)
    .sort((a, b) => b.completed_on.localeCompare(a.completed_on))
    .slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs font-mono">
      <div className="w-full max-w-lg rounded border border-[#1f2421] bg-[#0a0a0a] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#121212] border-b border-[#1f2421] shrink-0">
          <div className="flex items-center gap-2 text-xs truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="text-zinc-400 font-semibold ml-2 truncate">
              $ habit --stat &quot;{habit.name}&quot;
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Habit Banner */}
          <div className="flex items-center gap-3 p-3 rounded border border-[#1f2421] bg-[#0e1410]">
            <span className="text-2xl p-2 rounded bg-[#0a0a0a] border border-[#1f2421]">{habit.emoji}</span>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100">{habit.name}</h3>
              <p className="text-xs text-zinc-400">
                {habit.category} • Target: {habit.target_value} {habit.target_unit}
              </p>
            </div>
          </div>

          {/* Metric Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded border border-[#1f2421] bg-[#0d0d0d] flex flex-col">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#4ADE65]" /> Current Streak
              </span>
              <span className="text-base sm:text-lg font-bold text-[#4ADE65] mt-1">
                {stats.currentStreak}d
              </span>
            </div>

            <div className="p-2.5 rounded border border-[#1f2421] bg-[#0d0d0d] flex flex-col">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" /> Longest Streak
              </span>
              <span className="text-base sm:text-lg font-bold text-amber-400 mt-1">
                {stats.longestStreak}d
              </span>
            </div>

            <div className="p-2.5 rounded border border-[#1f2421] bg-[#0d0d0d] flex flex-col">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> All-Time Commits
              </span>
              <span className="text-base sm:text-lg font-bold text-zinc-100 mt-1">
                {stats.totalCompletions}
              </span>
            </div>

            <div className="p-2.5 rounded border border-[#1f2421] bg-[#0d0d0d] flex flex-col">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-cyan-400" /> 30d Rate
              </span>
              <span className="text-base sm:text-lg font-bold text-cyan-400 mt-1">
                {stats.completionRate30d}%
              </span>
            </div>
          </div>

          {/* Habit Micro Heatmap */}
          <div className="p-3 rounded border border-[#1f2421] bg-[#0d0d0d]">
            <span className="block text-xs font-semibold text-zinc-300 mb-2">
              // 52-week activity heatmap for {habit.name}
            </span>
            <div className="overflow-x-auto pb-2">
              <div className="inline-grid grid-rows-7 grid-flow-col gap-[3px]">
                {habitHeatmap.map((cell) => {
                  let bg = 'bg-[#141414]';
                  if (cell.level > 0) bg = 'bg-[#4ADE65] shadow-[0_0_4px_#4ADE65]';

                  return (
                    <div
                      key={cell.date}
                      className={`w-2.5 h-2.5 rounded-[1px] ${bg}`}
                      title={`${cell.date}: ${cell.count > 0 ? 'Completed' : 'Missed'}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent History */}
          <div className="p-3 rounded border border-[#1f2421] bg-[#0d0d0d]">
            <span className="block text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Recent Completion Log
            </span>
            {recentCompletions.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2">No completion logs recorded yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-800/80 text-xs">
                {recentCompletions.map((c) => (
                  <li key={c.id} className="py-1.5 flex items-center justify-between">
                    <span className="text-zinc-300">{formatReadableDate(c.completed_on)}</span>
                    <span className="text-[#4ADE65] font-semibold text-[11px]">+15 XP ✓</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#121212] border-t border-[#1f2421] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
