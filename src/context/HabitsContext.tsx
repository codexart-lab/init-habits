import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Habit, HabitCompletion, DailySummary, XpProgress, AppNotification } from '../types';
import { getTodayDateString, addDaysToDateString, formatMonthYear } from '../utils/dates';
import { getXpProgress, XP_CONFIG } from '../utils/xp';
import { DEFAULT_STARTER_HABITS, StarterHabitDefinition } from '../constants/starterHabits';

interface HabitsContextType {
  habits: Habit[];
  completions: HabitCompletion[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  loading: boolean;
  error: string | null;
  notifications: AppNotification[];
  removeNotification: (id: string) => void;
  addNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  // Calendar Navigation
  goToToday: () => void;
  goToNextWeek: () => void;
  goToPrevWeek: () => void;
  monthDisplay: string;
  // Habit Operations
  createHabit: (habitData: Partial<Habit>) => Promise<{ error: Error | null }>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<{ error: Error | null }>;
  deleteHabit: (id: string) => Promise<{ error: Error | null }>;
  archiveHabit: (id: string) => Promise<{ error: Error | null }>;
  restoreHabit: (id: string) => Promise<{ error: Error | null }>;
  toggleFavorite: (id: string) => Promise<{ error: Error | null }>;
  toggleCompletion: (habitId: string, dateStr?: string) => Promise<{ error: Error | null }>;
  reorderHabits: (startIndex: number, endIndex: number) => Promise<void>;
  seedStarterHabits: (selectedList?: StarterHabitDefinition[]) => Promise<void>;
  // Stats & Progress
  dailySummary: DailySummary;
  xpProgress: XpProgress;
  totalXp: number;
  refreshData: () => Promise<void>;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export const HabitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, settings } = useAuth();

  const userTimezone = settings?.timezone || 'UTC';
  const todayDateStr = useMemo(() => getTodayDateString(userTimezone), [userTimezone]);

  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [totalXp, setTotalXp] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev.slice(-4), { id, message, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Sync selectedDate to today when timezone changes if unselected
  useEffect(() => {
    setSelectedDate(todayDateStr);
  }, [todayDateStr]);

  // Load habits and completions strictly from Supabase
  const fetchData = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setCompletions([]);
      setTotalXp(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [habitsRes, completionsRes, xpRes] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('position', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('habit_completions')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('xp_ledger')
          .select('xp_amount')
          .eq('user_id', user.id),
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (completionsRes.error) throw completionsRes.error;

      const loadedHabits = (habitsRes.data || []) as Habit[];
      const loadedCompletions = (completionsRes.data || []) as HabitCompletion[];

      let sumXp = 0;
      if (xpRes.data && xpRes.data.length > 0) {
        sumXp = xpRes.data.reduce((acc, row) => acc + (row.xp_amount || 0), 0);
      } else {
        sumXp = loadedCompletions.length * XP_CONFIG.BASE_XP_PER_COMPLETION;
      }

      setHabits(loadedHabits);
      setCompletions(loadedCompletions);
      setTotalXp(sumXp);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch habit data';
      setError(msg);
      addNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calendar Navigation actions
  const goToToday = () => {
    setSelectedDate(todayDateStr);
  };

  const goToNextWeek = () => {
    setSelectedDate(prev => addDaysToDateString(prev, 7));
  };

  const goToPrevWeek = () => {
    setSelectedDate(prev => addDaysToDateString(prev, -7));
  };

  const monthDisplay = useMemo(() => formatMonthYear(selectedDate), [selectedDate]);

  // Habit CRUD & Actions
  const createHabit = async (habitData: Partial<Habit>) => {
    if (!user) return { error: new Error('User not logged in') };

    const highestPos = habits.reduce((max, h) => Math.max(max, h.position || 0), 0);
    const newPosition = highestPos + 1;

    const newHabit: Partial<Habit> = {
      user_id: user.id,
      name: (habitData.name || '').trim(),
      emoji: habitData.emoji || '🎯',
      description: habitData.description || '',
      category: habitData.category || 'General',
      target_value: habitData.target_value || 1,
      target_unit: habitData.target_unit || 'times',
      is_active: true,
      is_favorite: Boolean(habitData.is_favorite),
      position: newPosition,
    };

    if (!newHabit.name) {
      return { error: new Error('Habit name cannot be empty') };
    }

    try {
      const { data, error: insertError } = await supabase
        .from('habits')
        .insert(newHabit)
        .select()
        .single();

      if (insertError) throw insertError;
      setHabits(prev => [...prev, data as Habit]);
      addNotification(`Created habit: ${data.name}`, 'success');
      return { error: null };
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error('Failed to create habit');
      addNotification(errorObj.message, 'error');
      return { error: errorObj };
    }
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    if (!user) return { error: new Error('User not logged in') };

    const previousHabits = [...habits];
    // Optimistic update
    setHabits(prev =>
      prev.map(h => (h.id === id ? { ...h, ...updates, updated_at: new Date().toISOString() } : h))
    );

    try {
      const { error: updateError } = await supabase
        .from('habits')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      addNotification('Habit updated', 'success');
      return { error: null };
    } catch (err: unknown) {
      // Rollback
      setHabits(previousHabits);
      const errorObj = err instanceof Error ? err : new Error('Failed to update habit');
      addNotification(errorObj.message, 'error');
      return { error: errorObj };
    }
  };

  const deleteHabit = async (id: string) => {
    if (!user) return { error: new Error('User not logged in') };

    const previousHabits = [...habits];
    const previousCompletions = [...completions];

    // Optimistic delete
    setHabits(prev => prev.filter(h => h.id !== id));
    setCompletions(prev => prev.filter(c => c.habit_id !== id));

    try {
      const { error: deleteError } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      addNotification('Habit deleted', 'info');
      return { error: null };
    } catch (err: unknown) {
      setHabits(previousHabits);
      setCompletions(previousCompletions);
      const errorObj = err instanceof Error ? err : new Error('Failed to delete habit');
      addNotification(errorObj.message, 'error');
      return { error: errorObj };
    }
  };

  const archiveHabit = async (id: string) => {
    return updateHabit(id, { is_active: false });
  };

  const restoreHabit = async (id: string) => {
    return updateHabit(id, { is_active: true });
  };

  const toggleFavorite = async (id: string) => {
    const target = habits.find(h => h.id === id);
    if (!target) return { error: new Error('Habit not found') };
    return updateHabit(id, { is_favorite: !target.is_favorite });
  };

  const toggleCompletion = async (habitId: string, targetDate: string = selectedDate) => {
    if (!user) return { error: new Error('User not logged in') };

    const existingIndex = completions.findIndex(
      c => c.habit_id === habitId && c.completed_on === targetDate
    );
    const isCompleted = existingIndex !== -1;

    const prevCompletions = [...completions];
    const prevTotalXp = totalXp;

    if (isCompleted) {
      // Undo completion
      const completionToRemove = completions[existingIndex];
      const updatedCompletions = completions.filter((_, idx) => idx !== existingIndex);
      const updatedXp = Math.max(0, totalXp - XP_CONFIG.BASE_XP_PER_COMPLETION);

      setCompletions(updatedCompletions);
      setTotalXp(updatedXp);

      try {
        const { error: delError } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', completionToRemove.id)
          .eq('user_id', user.id);

        if (delError) throw delError;
        return { error: null };
      } catch (err: unknown) {
        setCompletions(prevCompletions);
        setTotalXp(prevTotalXp);
        const errorObj = err instanceof Error ? err : new Error('Failed to undo completion');
        addNotification(errorObj.message, 'error');
        return { error: errorObj };
      }
    } else {
      // New completion
      const tempId = `temp-${Date.now()}`;
      const newCompletion: HabitCompletion = {
        id: tempId,
        user_id: user.id,
        habit_id: habitId,
        completed_on: targetDate,
        created_at: new Date().toISOString(),
      };

      const updatedCompletions = [...completions, newCompletion];
      const updatedXp = totalXp + XP_CONFIG.BASE_XP_PER_COMPLETION;

      setCompletions(updatedCompletions);
      setTotalXp(updatedXp);

      // Particle celebration
      try {
        confetti({
          particleCount: 28,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#4ADE65', '#22c55e', '#ffffff'],
          disableForReducedMotion: true,
        });
      } catch {
        // Safe fallback
      }

      try {
        const { data, error: insertError } = await supabase
          .from('habit_completions')
          .insert({
            user_id: user.id,
            habit_id: habitId,
            completed_on: targetDate,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setCompletions(prev =>
          prev.map(c => (c.id === tempId ? (data as HabitCompletion) : c))
        );
        return { error: null };
      } catch (err: unknown) {
        setCompletions(prevCompletions);
        setTotalXp(prevTotalXp);
        const errorObj = err instanceof Error ? err : new Error('Failed to record completion');
        addNotification(errorObj.message, 'error');
        return { error: errorObj };
      }
    }
  };

  const reorderHabits = async (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return;

    const activeList = habits.filter(h => h.is_active);
    const reordered = Array.from(activeList);
    const [moved] = reordered.splice(startIndex, 1);
    reordered.splice(endIndex, 0, moved);

    const updatedWithPosition = habits.map(h => {
      const activeIdx = reordered.findIndex(item => item.id === h.id);
      if (activeIdx !== -1) {
        return { ...h, position: activeIdx + 1 };
      }
      return h;
    });

    setHabits(updatedWithPosition);

    try {
      const updates = reordered.map((h, index) => ({
        id: h.id,
        user_id: user?.id,
        name: h.name,
        position: index + 1,
      }));

      await supabase.from('habits').upsert(updates);
    } catch (err) {
      console.error('Failed to persist habit reorder:', err);
    }
  };

  const seedStarterHabits = async (selectedList: StarterHabitDefinition[] = DEFAULT_STARTER_HABITS) => {
    if (!user) return;

    const newHabitsToCreate = selectedList.map((h, i) => ({
      user_id: user.id,
      name: h.name,
      emoji: h.emoji,
      description: h.description,
      category: h.category,
      target_value: h.target_value,
      target_unit: h.target_unit,
      is_active: true,
      is_favorite: h.is_favorite,
      position: habits.length + i + 1,
    }));

    try {
      const { data, error: insertError } = await supabase
        .from('habits')
        .insert(newHabitsToCreate)
        .select();

      if (insertError) throw insertError;
      setHabits(prev => [...prev, ...((data || []) as Habit[])]);
      addNotification(`Added ${data?.length || 0} habits!`, 'success');
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error('Failed to seed habits');
      addNotification(errorObj.message, 'error');
    }
  };

  // Daily Summary for selectedDate
  const dailySummary = useMemo<DailySummary>(() => {
    const activeHabits = habits.filter(h => h.is_active);
    const completedForDate = completions.filter(c => c.completed_on === selectedDate);
    const completedIds = completedForDate.map(c => c.habit_id);

    const completedCount = activeHabits.filter(h => completedIds.includes(h.id)).length;
    const totalCount = activeHabits.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      date: selectedDate,
      completedHabitIds: completedIds,
      totalHabitsCount: totalCount,
      completedCount,
      percentage,
    };
  }, [habits, completions, selectedDate]);

  // XP Progress metadata
  const xpProgress = useMemo<XpProgress>(() => {
    return getXpProgress(totalXp);
  }, [totalXp]);

  return (
    <HabitsContext.Provider
      value={{
        habits,
        completions,
        selectedDate,
        setSelectedDate,
        loading,
        error,
        notifications,
        removeNotification,
        addNotification,
        goToToday,
        goToNextWeek,
        goToPrevWeek,
        monthDisplay,
        createHabit,
        updateHabit,
        deleteHabit,
        archiveHabit,
        restoreHabit,
        toggleFavorite,
        toggleCompletion,
        reorderHabits,
        seedStarterHabits,
        dailySummary,
        xpProgress,
        totalXp,
        refreshData: fetchData,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
};
