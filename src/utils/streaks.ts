// Streak calculation utilities for init.Habits
// Adheres strictly to timezone-aware consecutive calendar date rules

import { addDaysToDateString, getTodayDateString } from './dates';

/**
 * Calculates current streak for a habit.
 * Rules:
 * 1. Uses consecutive calendar dates in user's timezone.
 * 2. A missed day breaks the streak.
 * 3. Incomplete status on the current day does NOT break a streak before the day ends.
 *    If today is incomplete but yesterday was completed, the streak remains intact.
 * 
 * @param completedDates Array of 'YYYY-MM-DD' strings on which the habit was completed
 * @param todayDateStr Today's date in 'YYYY-MM-DD' format (in the user's configured timezone)
 * @returns Current streak count (in days)
 */
export function calculateCurrentStreak(
  completedDates: string[],
  todayDateStr: string = getTodayDateString()
): number {
  if (!completedDates || completedDates.length === 0) {
    return 0;
  }

  const dateSet = new Set(completedDates);

  let currentStreak = 0;
  let checkDate = todayDateStr;

  // Check if completed today
  if (dateSet.has(checkDate)) {
    currentStreak++;
    checkDate = addDaysToDateString(checkDate, -1);
  } else {
    // If NOT completed today, check yesterday.
    // If yesterday was completed, streak is still active through yesterday.
    const yesterday = addDaysToDateString(todayDateStr, -1);
    if (dateSet.has(yesterday)) {
      currentStreak++;
      checkDate = addDaysToDateString(yesterday, -1);
    } else {
      // Neither today nor yesterday was completed -> streak is broken / 0
      return 0;
    }
  }

  // Count backwards day by day as long as there are consecutive completions
  while (dateSet.has(checkDate)) {
    currentStreak++;
    checkDate = addDaysToDateString(checkDate, -1);
  }

  return currentStreak;
}

/**
 * Calculates longest all-time streak for a habit across its entire completion history.
 * 
 * @param completedDates Array of 'YYYY-MM-DD' strings
 * @returns Maximum consecutive days achieved
 */
export function calculateLongestStreak(completedDates: string[]): number {
  if (!completedDates || completedDates.length === 0) {
    return 0;
  }

  // Deduplicate and sort dates ascending
  const uniqueDates = Array.from(new Set(completedDates)).sort();

  if (uniqueDates.length === 0) return 0;
  if (uniqueDates.length === 1) return 1;

  let longest = 1;
  let currentRunning = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = uniqueDates[i - 1];
    const currDate = uniqueDates[i];
    const expectedNext = addDaysToDateString(prevDate, 1);

    if (currDate === expectedNext) {
      currentRunning++;
      if (currentRunning > longest) {
        longest = currentRunning;
      }
    } else {
      currentRunning = 1;
    }
  }

  return longest;
}
