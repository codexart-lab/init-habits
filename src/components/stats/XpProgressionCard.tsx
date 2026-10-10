import React from 'react';
import { Zap, ShieldCheck } from 'lucide-react';
import { useHabits } from '../../context/HabitsContext';

const DEVELOPER_TITLES: Record<number, string> = {
  1: 'Script Apprentice',
  2: 'Junior Engineer',
  3: 'Full-Stack Developer',
  4: 'Senior Systems Hacker',
  5: 'Staff Architect',
  6: 'Principal Kernel Master',
};

export const XpProgressionCard: React.FC = () => {
  const { xpProgress, totalXp } = useHabits();
  const { level, progressPercent, xpToNextLevel, nextLevelCeilXp } = xpProgress;

  const title = DEVELOPER_TITLES[level] || `Lvl ${level} Hacker`;

  // Terminal ASCII progress bar (20 chars)
  const totalBlocks = 20;
  const filledBlocks = Math.round((progressPercent / 100) * totalBlocks);
  const asciiFilled = '█'.repeat(filledBlocks);
  const asciiEmpty = '░'.repeat(Math.max(0, totalBlocks - filledBlocks));

  return (
    <div className="border border-[#1f2421] bg-[#0a0a0a] rounded p-3.5 sm:p-5 font-mono">
      {/* Level & Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded border border-[#166534] bg-[#0c2413] text-[#4ADE65] flex items-center justify-center font-bold text-sm">
            {level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-zinc-100">
                Level {level}: {title}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] rounded border border-[#166534] bg-[#061408] text-[#4ADE65]">
                RANK_{level}
              </span>
            </div>
            <div className="text-[11px] text-zinc-500">
              {totalXp} Total XP earned • Idempotent ledger verified
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#4ADE65] font-semibold">
          <Zap className="w-3.5 h-3.5 fill-[#4ADE65]" />
          <span>{xpToNextLevel} XP needed for Level {level + 1}</span>
        </div>
      </div>

      {/* ASCII Bar & Visual Bar */}
      <div className="space-y-1.5 mb-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            Progress to Level {level + 1} [{asciiFilled}{asciiEmpty}]
          </span>
          <span className="text-zinc-200 font-bold">{progressPercent}%</span>
        </div>

        {/* Smooth modern bar */}
        <div className="w-full h-2 bg-[#141414] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-[#4ADE65] transition-all duration-300 ease-out shadow-[0_0_8px_rgba(74,222,101,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* XP Rules footnote */}
      <div className="pt-2 border-t border-[#181d19] flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>+15 XP per habit commit • Anti-duplication guarded</span>
        </div>
        <div>
          <span>Next tier: {nextLevelCeilXp} XP</span>
        </div>
      </div>
    </div>
  );
};
