import { describe, it, expect } from 'vitest';
import {
  getTodayDateString,
  formatDateString,
  parseDateString,
  addDaysToDateString,
  getWeekDays,
  diffInDays,
} from '../dates';

describe('dates utilities', () => {
  it('correctly formats and parses dates', () => {
    const today = getTodayDateString('UTC');
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const date = new Date(2026, 9, 10); // Oct 10, 2026
    const str = formatDateString(date);
    expect(str).toBe('2026-10-10');

    const parsed = parseDateString('2026-10-10');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9); // 0-indexed October
    expect(parsed.getDate()).toBe(10);
  });

  it('correctly adds and subtracts days across month and leap year boundaries', () => {
    expect(addDaysToDateString('2026-10-10', 1)).toBe('2026-10-11');
    expect(addDaysToDateString('2026-10-10', -10)).toBe('2026-09-30');
    expect(addDaysToDateString('2024-02-28', 1)).toBe('2024-02-29'); // Leap year 2024
    expect(addDaysToDateString('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDaysToDateString('2025-02-28', 1)).toBe('2025-03-01'); // Non-leap year 2025
  });

  it('generates 7-day week starting on Monday and ending on Sunday', () => {
    // 2026-10-10 is a Saturday
    const week = getWeekDays('2026-10-10');
    expect(week).toHaveLength(7);
    expect(week[0].dayName).toBe('Mon');
    expect(week[0].dateStr).toBe('2026-10-05');
    expect(week[5].dayName).toBe('Sat');
    expect(week[5].dateStr).toBe('2026-10-10');
    expect(week[6].dayName).toBe('Sun');
    expect(week[6].dateStr).toBe('2026-10-11');
  });

  it('accurately calculates day differences', () => {
    expect(diffInDays('2026-10-10', '2026-10-05')).toBe(5);
    expect(diffInDays('2026-10-05', '2026-10-10')).toBe(-5);
    expect(diffInDays('2026-10-10', '2026-10-10')).toBe(0);
  });
});
