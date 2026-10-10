import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Habit } from '../../types';

interface CreateEditHabitModalProps {
  isOpen: boolean;
  habitToEdit?: Habit | null;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => Promise<{ error: Error | null }>;
}

const COMMON_EMOJIS = ['⏰', '📚', '🧘', '📱', '💧', '📋', '💻', '📗', '🌙', '🏃', '🥗', '🏋️', '🧠', '🎯', '✨', '☕'];
const COMMON_CATEGORIES = ['Health', 'Mindfulness', 'Coding', 'Learning', 'Productivity', 'Morning Routine', 'Focus', 'Fitness'];

export const CreateEditHabitModal: React.FC<CreateEditHabitModalProps> = ({
  isOpen,
  habitToEdit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [category, setCategory] = useState('Health');
  const [targetValue, setTargetValue] = useState(1);
  const [targetUnit, setTargetUnit] = useState('times');
  const [description, setDescription] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setEmoji(habitToEdit.emoji || '🎯');
      setCategory(habitToEdit.category || 'Health');
      setTargetValue(habitToEdit.target_value || 1);
      setTargetUnit(habitToEdit.target_unit || 'times');
      setDescription(habitToEdit.description || '');
      setIsFavorite(Boolean(habitToEdit.is_favorite));
    } else {
      setName('');
      setEmoji('🎯');
      setCategory('Health');
      setTargetValue(1);
      setTargetUnit('times');
      setDescription('');
      setIsFavorite(false);
    }
    setValidationError('');
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Habit name is required');
      return;
    }

    setSubmitting(true);
    setValidationError('');

    const res = await onSave({
      name: name.trim(),
      emoji,
      category: category.trim(),
      target_value: Number(targetValue) || 1,
      target_unit: targetUnit.trim() || 'times',
      description: description.trim(),
      is_favorite: isFavorite,
    });

    setSubmitting(false);
    if (!res.error) {
      onClose();
    } else {
      setValidationError(res.error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs font-mono">
      <div className="w-full max-w-md rounded border border-[#1f2421] bg-[#0a0a0a] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Terminal Modal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#121212] border-b border-[#1f2421]">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="text-zinc-400 font-semibold ml-2">
              {habitToEdit ? `$ habit --edit ${habitToEdit.name}` : '$ habit --new'}
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {validationError && (
            <div className="p-2.5 rounded bg-red-950/60 border border-red-800 text-red-400 text-xs">
              Error: {validationError}
            </div>
          )}

          {/* Emoji & Name row */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
              Habit Name <span className="text-[#4ADE65]">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(-2))}
                className="w-12 text-center text-lg bg-[#141414] border border-[#27272a] rounded text-zinc-100 focus:border-[#4ADE65] outline-none"
                title="Habit Emoji"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Read 20 pages"
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#141414] border border-[#27272a] rounded text-zinc-100 placeholder:text-zinc-600 focus:border-[#4ADE65] outline-none"
                autoFocus
              />
            </div>
          </div>

          {/* Emoji Preset Buttons */}
          <div>
            <span className="block text-[11px] text-zinc-500 mb-1">Emoji presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_EMOJIS.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={`w-7 h-7 rounded text-sm flex items-center justify-center transition-colors border ${
                    emoji === em ? 'border-[#4ADE65] bg-[#16381e]' : 'border-zinc-800 hover:border-zinc-600 bg-[#121212]'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Health, Coding, Focus"
              className="w-full px-3 py-2 text-xs bg-[#141414] border border-[#27272a] rounded text-zinc-100 focus:border-[#4ADE65] outline-none mb-1.5"
            />
            <div className="flex flex-wrap gap-1">
              {COMMON_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    category === cat
                      ? 'border-[#4ADE65] text-[#4ADE65] bg-[#0c2413]'
                      : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Target Value & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Target Value</label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={targetValue}
                onChange={(e) => setTargetValue(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-1.5 text-xs bg-[#141414] border border-[#27272a] rounded text-zinc-100 focus:border-[#4ADE65] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Unit</label>
              <input
                type="text"
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                placeholder="times, litres, mins"
                className="w-full px-3 py-1.5 text-xs bg-[#141414] border border-[#27272a] rounded text-zinc-100 focus:border-[#4ADE65] outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why does this habit matter to you?"
              className="w-full px-3 py-2 text-xs bg-[#141414] border border-[#27272a] rounded text-zinc-100 focus:border-[#4ADE65] outline-none resize-none"
            />
          </div>

          {/* Star as Favorite */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isFavorite"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 accent-[#4ADE65] bg-zinc-900 cursor-pointer"
            />
            <label htmlFor="isFavorite" className="text-xs text-zinc-300 cursor-pointer select-none">
              Star as favorite habit (pin near top)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1f2421]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-[#141414] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-semibold rounded bg-[#4ADE65] text-[#050505] hover:bg-[#43c75b] transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(74,222,101,0.3)] disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : habitToEdit ? 'Save Changes' : 'Create Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
