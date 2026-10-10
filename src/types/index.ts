// Application types for init.Habits

export interface Profile {
  id: string;
  username: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: 'neon-green' | 'matrix' | 'amber-crt' | 'cyberpunk-cyan' | 'monochrome';
  sound_enabled?: boolean;
  compact_view?: boolean;
  developer_quotes?: boolean;
}

export interface UserSettings {
  user_id: string;
  daily_goal: number; // percentage, e.g. 70
  timezone: string;
  preferences: UserPreferences;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  target_value: number;
  target_unit: string;
  is_active: boolean;
  is_favorite: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  user_id: string;
  habit_id: string;
  completed_on: string; // YYYY-MM-DD
  created_at: string;
}

export interface XpLedgerEntry {
  id: string;
  user_id: string;
  habit_id: string;
  completion_id: string;
  xp_amount: number;
  created_at: string;
}

export interface HabitWithStreak extends Habit {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  isCompletedOnSelectedDate: boolean;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  completedHabitIds: string[];
  totalHabitsCount: number;
  completedCount: number;
  percentage: number;
}

export interface ActivityStats {
  totalCompletions30d: number;
  activeHabitsCount: number;
  categoriesCount: number;
  bestHabit: { name: string; emoji: string; streak: number } | null;
  attentionHabit: { name: string; emoji: string; lastCompletedDaysAgo: number | null } | null;
  mostImprovedHabit: { name: string; emoji: string; delta: number } | null;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface XpProgress {
  totalXp: number;
  level: number;
  currentLevelFloorXp: number;
  nextLevelCeilXp: number;
  progressPercent: number;
  xpToNextLevel: number;
}

export type TabType = 'habits' | 'stats' | 'profile';

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}
