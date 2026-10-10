import React, { useState } from 'react';
import { X, CheckSquare, Sparkles } from 'lucide-react';
import { DEFAULT_STARTER_HABITS, StarterHabitDefinition } from '../../constants/starterHabits';

interface StarterHabitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selected: StarterHabitDefinition[]) => Promise<void>;
}

export const StarterHabitsModal: React.FC<StarterHabitsModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [selectedHabits, setSelectedHabits] = useState<string[]>(
    DEFAULT_STARTER_HABITS.map(h => h.name)
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleSelect = (name: string) => {
    setSelectedHabits(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const selectAll = () => {
    setSelectedHabits(DEFAULT_STARTER_HABITS.map(h => h.name));
  };

  const deselectAll = () => {
    setSelectedHabits([]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const chosen = DEFAULT_STARTER_HABITS.filter(h => selectedHabits.includes(h.name));
    await onApply(chosen);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs font-mono">
      <div className="w-full max-w-lg rounded border border-[#1f2421] bg-[#0a0a0a] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#121212] border-b border-[#1f2421] shrink-0">
          <div className="flex items-center gap-2 text-xs truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="text-zinc-400 font-semibold ml-2">
              $ init.Habits --seed-starter-habits
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Info & Actions */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="p-3 rounded border border-[#166534] bg-[#061408] text-xs">
            <div className="flex items-center gap-2 text-[#4ADE65] font-semibold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Choose your starter habits</span>
            </div>
            <p className="text-zinc-400">
              Select which habits to seed into your dashboard. You can edit, archive, or customize any of them at any time.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
            <span>{selectedHabits.length} of {DEFAULT_STARTER_HABITS.length} selected</span>
            <div className="flex gap-3">
              <button onClick={selectAll} className="text-[#4ADE65] hover:underline">Select All</button>
              <button onClick={deselectAll} className="text-zinc-400 hover:underline">Clear</button>
            </div>
          </div>

          {/* Habit Checkboxes List */}
          <div className="space-y-1.5">
            {DEFAULT_STARTER_HABITS.map((habit) => {
              const isChecked = selectedHabits.includes(habit.name);
              return (
                <div
                  key={habit.name}
                  onClick={() => toggleSelect(habit.name)}
                  className={`flex items-center justify-between p-2.5 rounded border cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'border-[#166534] bg-[#08150a]'
                      : 'border-zinc-800 bg-[#0d0d0d] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center text-xs border ${
                        isChecked
                          ? 'border-[#4ADE65] bg-[#4ADE65] text-[#050505] font-bold'
                          : 'border-zinc-700 bg-zinc-900'
                      }`}
                    >
                      {isChecked ? '✓' : ''}
                    </div>
                    <span className="text-base">{habit.emoji}</span>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium text-zinc-200 truncate">
                        {habit.name}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        #{habit.category} • {habit.description}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#121212] border-t border-[#1f2421] flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedHabits.length === 0}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-[#4ADE65] text-[#050505] hover:bg-[#43c75b] flex items-center gap-1.5 shadow-[0_0_8px_rgba(74,222,101,0.3)] disabled:opacity-50"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{loading ? 'Initializing...' : `Add ${selectedHabits.length} Habits`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
