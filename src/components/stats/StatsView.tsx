import React, { useMemo, useState } from 'react';
import {
  Flame,
  Award,
  AlertCircle,
  TrendingUp,
  Activity,
  Layers,
  CalendarCheck,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { useHabits } from '../../context/HabitsContext';
import { useAuth } from '../../context/AuthContext';
import { computeActivityStats, getTopHabitsByStreak } from '../../utils/statistics';
import { getTodayDateString } from '../../utils/dates';
import { ContributionHeatmap } from './ContributionHeatmap';
import { XpProgressionCard } from './XpProgressionCard';
import { HabitDetailModal } from '../habits/HabitDetailModal';
import { Habit } from '../../types';

export const StatsView: React.FC = () => {
  const { habits, completions } = useHabits();
  const { settings } = useAuth();

  const [inspectingHabit, setInspectingHabit] = useState<Habit | null>(null);

  const todayStr = useMemo(() => getTodayDateString(settings?.timezone || 'UTC'), [settings?.timezone]);
  const activityStats = useMemo(() => computeActivityStats(habits, completions, todayStr), [habits, completions, todayStr]);
  const topHabits = useMemo(() => getTopHabitsByStreak(habits, completions, 5, todayStr), [habits, completions, todayStr]);

  const {
    totalCompletions30d,
    activeHabitsCount,
    categoriesCount,
    bestHabit,
    attentionHabit,
    mostImprovedHabit,
  } = activityStats;

  return (
    <div className="space-y-4">
      {/* Terminal Command Header */}
      <div className="px-3 py-2 rounded border border-[#1f2421] bg-[#070b08] text-xs font-mono text-zinc-400 flex items-center justify-between">
        <span>$ habit-analytics --aggregate --window 30d</span>
        <span className="text-[#4ADE65] font-semibold">// telemetry active</span>
      </div>

      {/* XP Progression Card */}
      <XpProgressionCard />

      {/* 4-Stat Primary Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 font-mono">
        {/* 30-day Completions */}
        <div className="p-3 sm:p-4 rounded border border-[#1f2421] bg-[#0a0a0a] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] sm:text-xs">30d Completions</span>
            <CalendarCheck className="w-4 h-4 text-[#4ADE65]" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-zinc-100">
              {totalCompletions30d}
            </span>
            <span className="text-[10px] text-zinc-500 ml-1.5">commits</span>
          </div>
        </div>

        {/* Active Habits */}
        <div className="p-3 sm:p-4 rounded border border-[#1f2421] bg-[#0a0a0a] flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] sm:text-xs">Active Habits</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-zinc-100">
              {activeHabitsCount}
            </span>
            <span className="text-[10px] text-zinc-500 ml-1.5">tracked</span>
          </div>
        </div>

        {/* Categories / Routines */}
        <div className="p-3 sm:p-4 rounded border border-[#1f2421] bg-[#0a0a0a] flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] sm:text-xs">Routines / Tags</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold text-zinc-100">
              {categoriesCount}
            </span>
            <span className="text-[10px] text-zinc-500 ml-1.5">categories</span>
          </div>
        </div>
      </div>

      {/* 3 Insight Cards: Best Habit, Needs Attention, Most Improved */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 font-mono">
        {/* Best Performing Habit */}
        <div className="p-3.5 rounded border border-[#166534] bg-[#07130a] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#4ADE65] font-semibold mb-2">
            <Award className="w-4 h-4" />
            <span>Best-Performing Habit</span>
          </div>
          {bestHabit ? (
            <div>
              <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 truncate">
                <span>{bestHabit.emoji}</span>
                <span className="truncate">{bestHabit.name}</span>
              </div>
              <div className="text-xs text-[#4ADE65] mt-1">
                🔥 {bestHabit.streak} days current streak
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 italic py-1">
              // [N/A] Complete habits to identify best habit
            </div>
          )}
        </div>

        {/* Habit Needing Attention */}
        <div className="p-3.5 rounded border border-amber-900/60 bg-[#140e04] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-2">
            <AlertCircle className="w-4 h-4" />
            <span>Needs Attention</span>
          </div>
          {attentionHabit ? (
            <div>
              <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 truncate">
                <span>{attentionHabit.emoji}</span>
                <span className="truncate">{attentionHabit.name}</span>
              </div>
              <div className="text-xs text-amber-400/90 mt-1">
                {attentionHabit.lastCompletedDaysAgo === null
                  ? 'Never completed yet'
                  : attentionHabit.lastCompletedDaysAgo === 0
                  ? 'Completed today'
                  : `Missed for ${attentionHabit.lastCompletedDaysAgo} days`}
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 italic py-1">
              // [N/A] All habits performing optimally
            </div>
          )}
        </div>

        {/* Most Improved Habit */}
        <div className="p-3.5 rounded border border-zinc-800 bg-[#0a0a0a] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Most Improved (14d)</span>
          </div>
          {mostImprovedHabit && mostImprovedHabit.delta > 0 ? (
            <div>
              <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 truncate">
                <span>{mostImprovedHabit.emoji}</span>
                <span className="truncate">{mostImprovedHabit.name}</span>
              </div>
              <div className="text-xs text-cyan-400 mt-1">
                +{mostImprovedHabit.delta} more commits vs prior 14d
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 italic py-1 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>// [N/A] Requires 14+ days of log</span>
            </div>
          )}
        </div>
      </div>

      {/* 52-Week GitHub-style Contribution Heatmap */}
      <ContributionHeatmap
        completions={completions}
        userTimezone={settings?.timezone}
      />

      {/* Top 5 Habit Streaks Leaderboard */}
      <div className="border border-[#1f2421] bg-[#0a0a0a] rounded p-3.5 sm:p-5 font-mono">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#4ADE65]" />
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-200">
              Top Habit Streaks
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500">
            consecutive days in {settings?.timezone || 'UTC'}
          </span>
        </div>

        {topHabits.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500">
            // No habits available to calculate streaks.
          </div>
        ) : (
          <div className="divide-y divide-[#181d19]">
            {topHabits.map((h, rank) => (
              <div
                key={h.id}
                onClick={() => setInspectingHabit(h)}
                className="py-2.5 flex items-center justify-between group cursor-pointer hover:bg-[#121212] px-2 rounded transition-colors"
                title="Click to view detailed metrics"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-zinc-500 w-4 select-none">
                    {rank + 1}.
                  </span>
                  <span className="text-base select-none">{h.emoji}</span>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm text-zinc-200 group-hover:text-[#4ADE65] font-medium transition-colors truncate block">
                      {h.name}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      all-time best: {h.longestStreak}d • {h.totalCompletions} total
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold ${
                      h.currentStreak > 0
                        ? 'text-[#4ADE65] bg-[#0c2413] border border-[#166534]'
                        : 'text-zinc-500 bg-[#141414] border border-zinc-800'
                    }`}
                  >
                    {h.currentStreak} days
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Individual Habit Inspection Modal */}
      <HabitDetailModal
        habit={inspectingHabit}
        onClose={() => setInspectingHabit(null)}
      />
    </div>
  );
};
