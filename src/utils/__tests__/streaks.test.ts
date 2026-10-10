import { describe, it, expect } from 'vitest';
import { calculateCurrentStreak, calculateLongestStreak } from '../streaks';

describe('streaks utilities', () => {
  const today = '2026-10-10';

  it('returns 0 for empty completion dates', () => {
    expect(calculateCurrentStreak([], today)).toBe(0);
    expect(calculateLongestStreak([])).toBe(0);
  });

  it('counts streak including today when completed today', () => {
    const dates = ['2026-10-10', '2026-10-09', '2026-10-08'];
    expect(calculateCurrentStreak(dates, today)).toBe(3);
  });

  it('preserves streak if completed yesterday but not yet completed today (Rule 6)', () => {
    // Current day's incomplete status must not incorrectly break a streak before day ends
    const dates = ['2026-10-09', '2026-10-08', '2026-10-07'];
    expect(calculateCurrentStreak(dates, today)).toBe(3);
  });

  it('breaks streak when a day is missed (Rule 5)', () => {
    // Completed today, but missed yesterday (2026-10-09 missing)
    const dates = ['2026-10-10', '2026-10-08'];
    expect(calculateCurrentStreak(dates, today)).toBe(1);
  });

  it('returns 0 if neither today nor yesterday was completed', () => {
    // Last completed 2 days ago (2026-10-08)
    const dates = ['2026-10-08', '2026-10-07'];
    expect(calculateCurrentStreak(dates, today)).toBe(0);
  });

  it('handles duplicate dates gracefully without inflating streak count (Rule 1)', () => {
    const datesWithDuplicates = ['2026-10-10', '2026-10-10', '2026-10-09', '2026-10-09'];
    expect(calculateCurrentStreak(datesWithDuplicates, today)).toBe(2);
    expect(calculateLongestStreak(datesWithDuplicates)).toBe(2);
  });

  it('accurately calculates longest streak across gaps', () => {
    const dates = [
      '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', // 4 days streak
      '2026-09-10', '2026-09-11', // 2 days streak
      '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', // 5 days streak
    ];
    expect(calculateLongestStreak(dates)).toBe(5);
  });
});
