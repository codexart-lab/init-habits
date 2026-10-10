import React, { useState } from 'react';
import { Star, MoreVertical, Flame, Check, Archive, Trash2, Edit3, BarChart2, ArrowUp, ArrowDown } from 'lucide-react';
import { Habit } from '../../types';
import { useHabits } from '../../context/HabitsContext';
import { useAuth } from '../../context/AuthContext';
import { calculateCurrentStreak } from '../../utils/streaks';
import { getTodayDateString } from '../../utils/dates';

interface HabitRowProps {
  habit: Habit;
  index: number;
  totalHabits: number;
  onEdit: (habit: Habit) => void;
  onViewStats: (habit: Habit) => void;
}

export const HabitRow: React.FC<HabitRowProps> = ({
  habit,
  index,
  totalHabits,
  onEdit,
  onViewStats,
}) => {
  const {
    selectedDate,
    completions,
    toggleCompletion,
    toggleFavorite,
    archiveHabit,
    restoreHabit,
    deleteHabit,
    reorderHabits,
  } = useHabits();
  const { settings } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const todayStr = getTodayDateString(settings?.timezone || 'UTC');

  // Check if completed on currently selected date
  const isCompleted = completions.some(
    c => c.habit_id === habit.id && c.completed_on === selectedDate
  );

  // Calculate current streak for this habit
  const habitCompletionDates = completions
    .filter(c => c.habit_id === habit.id)
    .map(c => c.completed_on);
  const currentStreak = calculateCurrentStreak(habitCompletionDates, todayStr);

  const handleCheckboxClick = () => {
    toggleCompletion(habit.id, selectedDate);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteHabit(habit.id);
    setMenuOpen(false);
  };

  return (
    <div
      className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded border transition-all duration-150 ${
        isCompleted
          ? 'bg-[#08130a] border-[#166534]/60'
          : 'bg-[#0a0a0a] border-[#1a1f1b] hover:border-zinc-700'
      } ${!habit.is_active ? 'opacity-60 border-dashed' : ''}`}
    >
      {/* Left section: Checkbox, Favorite, Emoji, Habit Name */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        {/* Terminal Checkbox [x] / [ ] */}
        <button
          onClick={handleCheckboxClick}
          className={`shrink-0 w-6 h-6 rounded flex items-center justify-center font-mono text-xs transition-colors border ${
            isCompleted
              ? 'bg-[#4ADE65] text-[#050505] border-[#4ADE65] font-bold shadow-[0_0_8px_rgba(74,222,101,0.5)]'
              : 'border-zinc-700 bg-[#121212] text-zinc-400 hover:border-[#4ADE65] hover:text-[#4ADE65]'
          }`}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
          aria-label={isCompleted ? `Uncheck ${habit.name}` : `Check ${habit.name}`}
        >
          {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="opacity-0 group-hover:opacity-40">✓</span>}
        </button>

        {/* Favorite Star */}
        <button
          onClick={() => toggleFavorite(habit.id)}
          className={`p-1 shrink-0 transition-colors ${
            habit.is_favorite
              ? 'text-amber-400'
              : 'text-zinc-600 hover:text-zinc-400 opacity-60 group-hover:opacity-100'
          }`}
          title={habit.is_favorite ? 'Unstar habit' : 'Star habit'}
          aria-label={habit.is_favorite ? 'Unfavorite' : 'Favorite'}
        >
          <Star className={`w-3.5 h-3.5 ${habit.is_favorite ? 'fill-amber-400' : ''}`} />
        </button>

        {/* Emoji */}
        <span className="text-sm sm:text-base shrink-0 select-none">{habit.emoji}</span>

        {/* Habit Name & Details */}
        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-center gap-2 truncate">
            <span
              className={`text-xs sm:text-sm font-mono truncate ${
                isCompleted ? 'text-zinc-100 font-medium' : 'text-zinc-200'
              }`}
            >
              {habit.name}
            </span>
            {!habit.is_active && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-zinc-700 bg-zinc-900 text-zinc-400">
                archived
              </span>
            )}
          </div>
          {habit.category && (
            <span className="text-[10px] font-mono text-zinc-500 truncate">
              #{habit.category}
            </span>
          )}
        </div>
      </div>

      {/* Right section: Streak & Action Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
        {/* Streak Counter */}
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono ${
            currentStreak > 0
              ? 'text-[#4ADE65] bg-[#0c2413] border border-[#166534]'
              : 'text-zinc-500 bg-[#121212] border border-[#1c1c1c]'
          }`}
          title={`Current consecutive streak: ${currentStreak} days`}
        >
          <Flame className={`w-3 h-3 ${currentStreak > 0 ? 'text-[#4ADE65]' : 'text-zinc-600'}`} />
          <span>{currentStreak}d</span>
        </div>

        {/* Action Menu Trigger */}
        <div className="relative">
          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setConfirmDelete(false);
            }}
            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-[#1a1a1a] transition-colors"
            title="Habit options"
            aria-label="Habit options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Action Menu Dropdown */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmDelete(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-48 rounded border border-zinc-800 bg-[#0d0d0d] shadow-2xl py-1 z-50 text-xs font-mono">
                {/* View Stats */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onViewStats(habit);
                  }}
                  className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-[#181818] hover:text-[#4ADE65] flex items-center gap-2"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>View Statistics</span>
                </button>

                {/* Edit */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(habit);
                  }}
                  className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-[#181818] hover:text-[#4ADE65] flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Edit Habit</span>
                </button>

                {/* Move Up / Down Reorder */}
                <div className="border-t border-zinc-800/80 my-1"></div>
                <button
                  disabled={index === 0}
                  onClick={() => {
                    reorderHabits(index, index - 1);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-zinc-400 hover:bg-[#181818] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Move Up</span>
                </button>
                <button
                  disabled={index >= totalHabits - 1}
                  onClick={() => {
                    reorderHabits(index, index + 1);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-zinc-400 hover:bg-[#181818] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Move Down</span>
                </button>

                {/* Archive / Restore */}
                <div className="border-t border-zinc-800/80 my-1"></div>
                {habit.is_active ? (
                  <button
                    onClick={() => {
                      archiveHabit(habit.id);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-[#181818] flex items-center gap-2"
                  >
                    <Archive className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Archive Habit</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      restoreHabit(habit.id);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-zinc-300 hover:bg-[#181818] flex items-center gap-2"
                  >
                    <Archive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restore Habit</span>
                  </button>
                )}

                {/* Delete */}
                <div className="border-t border-zinc-800/80 my-1"></div>
                <button
                  onClick={handleDelete}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 ${
                    confirmDelete
                      ? 'bg-red-950/70 text-red-300 font-bold'
                      : 'text-red-400 hover:bg-[#1a0b0b]'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>{confirmDelete ? 'Confirm Delete?' : 'Delete Habit'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
