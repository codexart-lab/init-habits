import { describe, it, expect } from 'vitest';
import {
  getCompletionsInLastDays,
  generateHeatmapData,
  computeActivityStats,
  getTopHabitsByStreak,
} from '../statistics';
import { Habit, HabitCompletion } from '../../types';

describe('statistics utilities', () => {
  const today = '2026-10-10';

  const mockHabits: Habit[] = [
    {
      id: 'h1',
      user_id: 'u1',
      name: 'Water intake',
      emoji: '💧',
      description: '',
      category: 'Health',
      target_value: 2.5,
      target_unit: 'litres',
      is_active: true,
      is_favorite: true,
      position: 1,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
    {
      id: 'h2',
      user_id: 'u1',
      name: 'Plan next day',
      emoji: '📋',
      description: '',
      category: 'Productivity',
      target_value: 1,
      target_unit: 'times',
      is_active: true,
      is_favorite: false,
      position: 2,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
  ];

  const mockCompletions: HabitCompletion[] = [
    { id: 'c1', user_id: 'u1', habit_id: 'h1', completed_on: '2026-10-10', created_at: '' },
    { id: 'c2', user_id: 'u1', habit_id: 'h1', completed_on: '2026-10-09', created_at: '' },
    { id: 'c3', user_id: 'u1', habit_id: 'h1', completed_on: '2026-10-08', created_at: '' },
    { id: 'c4', user_id: 'u1', habit_id: 'h2', completed_on: '2026-10-10', created_at: '' },
  ];

  it('filters completions within the last 30 days accurately', () => {
    const completionsWithOld: HabitCompletion[] = [
      ...mockCompletions,
      { id: 'c_old', user_id: 'u1', habit_id: 'h1', completed_on: '2026-08-01', created_at: '' },
    ];
    const count30d = getCompletionsInLastDays(completionsWithOld, 30, today);
    expect(count30d).toBe(4);
  });

  it('generates 52-week heatmap grid with intensity levels', () => {
    const heatmap = generateHeatmapData(mockCompletions, today);
    // 52 weeks * 7 = 364 cells
    expect(heatmap).toHaveLength(364);

    const todayCell = heatmap.find(cell => cell.date === today);
    expect(todayCell).toBeDefined();
    // 2 completions on 2026-10-10
    expect(todayCell?.count).toBe(2);
    expect(todayCell?.level).toBe(2);
  });

  it('computes activity stats and identifies best performing habit', () => {
    const stats = computeActivityStats(mockHabits, mockCompletions, today);
    expect(stats.activeHabitsCount).toBe(2);
    expect(stats.categoriesCount).toBe(2);
    expect(stats.totalCompletions30d).toBe(4);
    expect(stats.bestHabit?.name).toBe('Water intake');
    expect(stats.bestHabit?.streak).toBe(3);
  });

  it('clearly distinguishes unavailable statistics when no records exist', () => {
    const emptyStats = computeActivityStats([], [], today);
    expect(emptyStats.bestHabit).toBeNull();
    expect(emptyStats.attentionHabit).toBeNull();
    expect(emptyStats.mostImprovedHabit).toBeNull();
  });

  it('orders top habits by streak', () => {
    const top = getTopHabitsByStreak(mockHabits, mockCompletions, 5, today);
    expect(top).toHaveLength(2);
    expect(top[0].name).toBe('Water intake');
    expect(top[0].currentStreak).toBe(3);
    expect(top[1].name).toBe('Plan next day');
    expect(top[1].currentStreak).toBe(1);
  });
});
