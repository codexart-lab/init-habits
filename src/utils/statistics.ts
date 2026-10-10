// Statistics calculation utilities for init.Habits

import { Habit, HabitCompletion, HeatmapDay, ActivityStats, HabitWithStreak } from '../types';
import { addDaysToDateString, getTodayDateString, diffInDays, parseDateString } from './dates';
import { calculateCurrentStreak, calculateLongestStreak } from './streaks';

/**
 * Calculates total completions for a user within the last N days (default 30)
 */
export function getCompletionsInLastDays(
  completions: HabitCompletion[],
  days: number = 30,
  todayStr: string = getTodayDateString()
): number {
  const startDate = addDaysToDateString(todayStr, -days + 1);
  return completions.filter(c => c.completed_on >= startDate && c.completed_on <= todayStr).length;
}

/**
 * Generates 52-week (364-371 days) GitHub-style contribution heatmap grid data
 */
export function generateHeatmapData(
  completions: HabitCompletion[],
  todayStr: string = getTodayDateString(),
  specificHabitId?: string
): HeatmapDay[] {
  // Filter for specific habit if requested
  const filtered = specificHabitId
    ? completions.filter(c => c.habit_id === specificHabitId)
    : completions;

  // Map counts by date
  const countsByDate = new Map<string, number>();
  for (const c of filtered) {
    countsByDate.set(c.completed_on, (countsByDate.get(c.completed_on) || 0) + 1);
  }

  // To build 53 weeks aligned to Sunday/Monday:
  // Today's day of week:
  const todayDate = parseDateString(todayStr);
  const dayOfWeek = todayDate.getDay(); // 0 is Sunday, 6 is Saturday
  // End on the coming Saturday (or today if Saturday)
  const daysUntilSaturday = 6 - dayOfWeek;
  const endDate = addDaysToDateString(todayStr, daysUntilSaturday);

  // 52 weeks * 7 = 364 days total
  const totalDays = 52 * 7;
  const startDate = addDaysToDateString(endDate, -totalDays + 1);

  const heatmap: HeatmapDay[] = [];

  for (let i = 0; i < totalDays; i++) {
    const dateStr = addDaysToDateString(startDate, i);
    const count = countsByDate.get(dateStr) || 0;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count === 0) level = 0;
    else if (count === 1) level = 1;
    else if (count === 2) level = 2;
    else if (count <= 4) level = 3;
    else level = 4;

    heatmap.push({
      date: dateStr,
      count,
      level,
    });
  }

  return heatmap;
}

/**
 * Calculates high-level activity statistics:
 * - 30-day total completions
 * - Active habits count
 * - Categories count
 * - Best habit
 * - Habit needing attention
 * - Most improved habit
 */
export function computeActivityStats(
  habits: Habit[],
  completions: HabitCompletion[],
  todayStr: string = getTodayDateString()
): ActivityStats {
  const activeHabits = habits.filter(h => h.is_active);
  const totalCompletions30d = getCompletionsInLastDays(completions, 30, todayStr);

  const categories = new Set(
    activeHabits.map(h => (h.category ? h.category.trim() : 'General')).filter(Boolean)
  );

  if (activeHabits.length === 0) {
    return {
      totalCompletions30d: 0,
      activeHabitsCount: 0,
      categoriesCount: 0,
      bestHabit: null,
      attentionHabit: null,
      mostImprovedHabit: null,
    };
  }

  // Group completions by habit
  const completionsByHabit = new Map<string, string[]>();
  for (const h of activeHabits) {
    completionsByHabit.set(h.id, []);
  }
  for (const c of completions) {
    const list = completionsByHabit.get(c.habit_id);
    if (list) {
      list.push(c.completed_on);
    }
  }

  // 1. Best habit (highest current streak, fallback to most completions in last 30d)
  let bestHabit: { name: string; emoji: string; streak: number } | null = null;
  let maxStreak = -1;

  for (const h of activeHabits) {
    const dates = completionsByHabit.get(h.id) || [];
    const streak = calculateCurrentStreak(dates, todayStr);
    if (streak > maxStreak) {
      maxStreak = streak;
      bestHabit = {
        name: h.name,
        emoji: h.emoji,
        streak,
      };
    }
  }

  // If even best habit has 0 streak and no completions at all, show null or best habit with 0
  if (bestHabit && maxStreak <= 0) {
    const hasAnyCompletion = completions.length > 0;
    if (!hasAnyCompletion) {
      bestHabit = null; // clearly unavailable
    }
  }

  // 2. Habit needing attention (active habit with lowest completion in last 14 days, or oldest completion)
  let attentionHabit: { name: string; emoji: string; lastCompletedDaysAgo: number | null } | null = null;
  const last14dStart = addDaysToDateString(todayStr, -13);

  let worstCount = Infinity;
  let worstHabitCandidate: Habit | null = null;

  for (const h of activeHabits) {
    const dates = completionsByHabit.get(h.id) || [];
    const count14d = dates.filter(d => d >= last14dStart && d <= todayStr).length;
    if (count14d < worstCount) {
      worstCount = count14d;
      worstHabitCandidate = h;
    }
  }

  if (worstHabitCandidate) {
    const dates = completionsByHabit.get(worstHabitCandidate.id) || [];
    const sortedDates = [...dates].sort();
    const lastDate = sortedDates[sortedDates.length - 1];
    const daysAgo = lastDate ? diffInDays(todayStr, lastDate) : null;

    attentionHabit = {
      name: worstHabitCandidate.name,
      emoji: worstHabitCandidate.emoji,
      lastCompletedDaysAgo: daysAgo,
    };
  }

  // 3. Most improved habit: completions in [today - 13, today] minus completions in [today - 27, today - 14]
  let mostImprovedHabit: { name: string; emoji: string; delta: number } | null = null;
  const prior14dStart = addDaysToDateString(todayStr, -27);
  const prior14dEnd = addDaysToDateString(todayStr, -14);

  let maxDelta = 0;
  for (const h of activeHabits) {
    const dates = completionsByHabit.get(h.id) || [];
    const recentCount = dates.filter(d => d >= last14dStart && d <= todayStr).length;
    const priorCount = dates.filter(d => d >= prior14dStart && d <= prior14dEnd).length;
    const delta = recentCount - priorCount;

    if (delta > maxDelta) {
      maxDelta = delta;
      mostImprovedHabit = {
        name: h.name,
        emoji: h.emoji,
        delta,
      };
    }
  }

  return {
    totalCompletions30d,
    activeHabitsCount: activeHabits.length,
    categoriesCount: categories.size,
    bestHabit,
    attentionHabit,
    mostImprovedHabit,
  };
}

/**
 * Computes individual habit metrics:
 * - Current streak
 * - Longest streak
 * - Total completions
 * - Completion rate over the last 30 days
 */
export function computeHabitDetailedStats(
  habit: Habit,
  completions: HabitCompletion[],
  todayStr: string = getTodayDateString()
) {
  const habitCompletions = completions
    .filter(c => c.habit_id === habit.id)
    .map(c => c.completed_on);

  const currentStreak = calculateCurrentStreak(habitCompletions, todayStr);
  const longestStreak = calculateLongestStreak(habitCompletions);
  const totalCompletions = habitCompletions.length;

  const startDate30d = addDaysToDateString(todayStr, -29);
  const completions30d = habitCompletions.filter(
    d => d >= startDate30d && d <= todayStr
  ).length;
  const completionRate30d = Math.round((completions30d / 30) * 100);

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completions30d,
    completionRate30d,
  };
}

/**
 * Returns Top N habits by current streak
 */
export function getTopHabitsByStreak(
  habits: Habit[],
  completions: HabitCompletion[],
  limit: number = 5,
  todayStr: string = getTodayDateString()
): HabitWithStreak[] {
  const activeHabits = habits.filter(h => h.is_active);

  const withStreaks: HabitWithStreak[] = activeHabits.map(h => {
    const dates = completions.filter(c => c.habit_id === h.id).map(c => c.completed_on);
    const currentStreak = calculateCurrentStreak(dates, todayStr);
    const longestStreak = calculateLongestStreak(dates);
    const totalCompletions = dates.length;
    const isCompletedOnSelectedDate = dates.includes(todayStr);

    return {
      ...h,
      currentStreak,
      longestStreak,
      totalCompletions,
      isCompletedOnSelectedDate,
    };
  });

  // Sort descending by currentStreak, then longestStreak, then totalCompletions
  return withStreaks
    .sort((a, b) => b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak || b.totalCompletions - a.totalCompletions)
    .slice(0, limit);
}
