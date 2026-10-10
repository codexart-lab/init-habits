import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, Filter, Archive } from 'lucide-react';
import { Habit } from '../../types';
import { useHabits } from '../../context/HabitsContext';
import { WeekCalendar } from '../calendar/WeekCalendar';
import { HabitRow } from './HabitRow';
import { DailyProgressBar } from './DailyProgressBar';
import { CreateEditHabitModal } from './CreateEditHabitModal';
import { HabitDetailModal } from './HabitDetailModal';
import { StarterHabitsModal } from './StarterHabitsModal';

const DEVELOPER_QUOTES = [
  "// the irony of tracking habits: it's a habit you have to build first.",
  "// code without discipline is just bugs waiting for compile time.",
  "// 1.01^365 = 37.78 | 0.99^365 = 0.03 | compound interest of habits.",
  "// commit daily. git push origin master --force-discipline.",
  "// you do not rise to the level of your goals, you fall to the level of your systems.",
  "// habit streak > code streak. optimize human runtime.",
];

export const HabitList: React.FC = () => {
  const {
    habits,
    loading,
    createHabit,
    updateHabit,
    seedStarterHabits,
  } = useHabits();

  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'archived'>('all');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [inspectingHabit, setInspectingHabit] = useState<Habit | null>(null);
  const [isStarterModalOpen, setIsStarterModalOpen] = useState(false);

  // Rotate developer message occasionally or on click
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % DEVELOPER_QUOTES.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % DEVELOPER_QUOTES.length);
  };

  const handleSaveHabit = async (data: Partial<Habit>) => {
    if (editingHabit) {
      return updateHabit(editingHabit.id, data);
    } else {
      return createHabit(data);
    }
  };

  // Filter habits according to tab
  const filteredHabits = habits.filter((h) => {
    if (activeFilter === 'archived') return !h.is_active;
    if (!h.is_active) return false;
    if (activeFilter === 'favorites') return h.is_favorite;
    return true;
  });

  const activeHabitsCount = habits.filter((h) => h.is_active).length;
  const archivedHabitsCount = habits.filter((h) => !h.is_active).length;
  const favoriteHabitsCount = habits.filter((h) => h.is_active && h.is_favorite).length;

  return (
    <div className="space-y-4">
      {/* Developer Quote Banner */}
      <div
        onClick={handleNextQuote}
        className="px-3 py-2 rounded border border-[#1f2421] bg-[#070b08] text-xs font-mono text-zinc-400 cursor-pointer hover:border-[#166534] transition-colors select-none flex items-center justify-between"
        title="Click to cycle developer quotes"
      >
        <span className="text-zinc-400 truncate mr-2">
          {DEVELOPER_QUOTES[quoteIndex]}
        </span>
        <span className="text-[10px] text-zinc-600 shrink-0 font-mono">[next]</span>
      </div>

      {/* Week Calendar */}
      <WeekCalendar />

      {/* Habits Action Bar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 text-xs font-mono">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded transition-colors border ${
              activeFilter === 'all'
                ? 'border-[#4ADE65] text-[#4ADE65] bg-[#0c2413]'
                : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 bg-[#0a0a0a]'
            }`}
          >
            All ({activeHabitsCount})
          </button>
          <button
            onClick={() => setActiveFilter('favorites')}
            className={`px-2.5 py-1 rounded transition-colors border ${
              activeFilter === 'favorites'
                ? 'border-amber-500/80 text-amber-400 bg-amber-950/30'
                : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 bg-[#0a0a0a]'
            }`}
          >
            ★ Favorites ({favoriteHabitsCount})
          </button>
          {archivedHabitsCount > 0 && (
            <button
              onClick={() => setActiveFilter('archived')}
              className={`px-2.5 py-1 rounded transition-colors border ${
                activeFilter === 'archived'
                  ? 'border-zinc-500 text-zinc-200 bg-zinc-800'
                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 bg-[#0a0a0a]'
              }`}
            >
              Archived ({archivedHabitsCount})
            </button>
          )}
        </div>

        {/* Buttons: + Habit & Seed Starters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStarterModalOpen(true)}
            className="px-2.5 py-1 text-xs font-mono rounded border border-[#166534] bg-[#061408] text-[#4ADE65] hover:bg-[#0c2912] transition-colors flex items-center gap-1.5"
            title="Load recommended developer starter habits"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Starter Habits</span>
            <span className="xs:hidden">Starters</span>
          </button>

          <button
            onClick={() => {
              setEditingHabit(null);
              setIsCreateModalOpen(true);
            }}
            className="px-3 py-1 text-xs font-mono font-semibold rounded bg-[#4ADE65] text-[#050505] hover:bg-[#43c75b] transition-all flex items-center gap-1 shadow-[0_0_8px_rgba(74,222,101,0.3)]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Habit Rows List */}
      <div className="space-y-1.5 min-h-[140px]">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-zinc-500 animate-pulse">
            // querying local & remote habit index...
          </div>
        ) : filteredHabits.length === 0 ? (
          <div className="p-8 text-center rounded border border-[#1f2421] bg-[#0a0a0a] text-xs font-mono space-y-3">
            <div className="text-zinc-500">// No habits found for current filter.</div>
            {habits.length === 0 && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-zinc-400 max-w-sm mx-auto">
                  Get started by adding custom habits or load our developer starter habits (DSA, GitHub streak, Sleep, Hydration).
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsStarterModalOpen(true)}
                    className="px-3 py-1.5 rounded border border-[#166534] bg-[#0c2413] text-[#4ADE65] flex items-center gap-1.5 hover:bg-[#16381e]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Initialize Starter Habits</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingHabit(null);
                      setIsCreateModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  >
                    + Add Single Habit
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          filteredHabits.map((habit, index) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              index={index}
              totalHabits={filteredHabits.length}
              onEdit={(h) => {
                setEditingHabit(h);
                setIsCreateModalOpen(true);
              }}
              onViewStats={(h) => setInspectingHabit(h)}
            />
          ))
        )}
      </div>

      {/* Daily Progress Bar */}
      <DailyProgressBar />

      {/* Modals */}
      <CreateEditHabitModal
        isOpen={isCreateModalOpen}
        habitToEdit={editingHabit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
      />

      <HabitDetailModal
        habit={inspectingHabit}
        onClose={() => setInspectingHabit(null)}
      />

      <StarterHabitsModal
        isOpen={isStarterModalOpen}
        onClose={() => setIsStarterModalOpen(false)}
        onApply={seedStarterHabits}
      />
    </div>
  );
};
