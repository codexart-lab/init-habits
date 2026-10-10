import React from 'react';
import { CheckCheck, Target } from 'lucide-react';
import { useHabits } from '../../context/HabitsContext';
import { useAuth } from '../../context/AuthContext';

export const DailyProgressBar: React.FC = () => {
  const { dailySummary } = useHabits();
  const { settings } = useAuth();

  const userGoal = settings?.daily_goal ?? 70;
  const { completedCount, totalHabitsCount, percentage } = dailySummary;
  const isGoalMet = totalHabitsCount > 0 && percentage >= userGoal;

  // Build terminal ASCII progress bar: 20 blocks wide
  const totalBlocks = 20;
  const filledBlocks = Math.round((percentage / 100) * totalBlocks);
  const asciiFilled = '█'.repeat(filledBlocks);
  const asciiEmpty = '░'.repeat(Math.max(0, totalBlocks - filledBlocks));

  return (
    <div className="mt-4 p-3.5 sm:p-4 rounded border border-[#1f2421] bg-[#0a0a0a] font-mono">
      {/* ASCII Bar & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-[#4ADE65] select-none tracking-tighter sm:tracking-normal">
            {asciiFilled}
          </span>
          <span className="text-zinc-700 select-none tracking-tighter sm:tracking-normal">
            {asciiEmpty}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-zinc-100 font-bold">{percentage}%</span>
          <span className="text-zinc-500">
            [{completedCount}/{totalHabitsCount}]
          </span>
        </div>
      </div>

      {/* Modern Compact Neon Progress Bar for smooth mobile rendering */}
      <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden mb-2.5">
        <div
          className="h-full bg-[#4ADE65] transition-all duration-300 ease-out shadow-[0_0_8px_rgba(74,222,101,0.5)]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Goal status feedback line */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-600">//</span>
          <span>goal: {userGoal}%</span>
          <span className="text-zinc-600">—</span>
          {totalHabitsCount === 0 ? (
            <span className="text-zinc-500">no habits added</span>
          ) : isGoalMet ? (
            <span className="text-[#4ADE65] font-semibold flex items-center gap-1">
              met <CheckCheck className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="text-zinc-400">
              {Math.max(0, Math.ceil((userGoal / 100) * totalHabitsCount) - completedCount)} remaining
            </span>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500">
          <Target className="w-3 h-3 text-zinc-500" />
          <span>target: {userGoal}%</span>
        </div>
      </div>
    </div>
  );
};
