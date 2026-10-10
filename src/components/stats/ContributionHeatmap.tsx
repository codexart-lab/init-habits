import React, { useMemo, useState } from 'react';
import { HabitCompletion } from '../../types';
import { generateHeatmapData } from '../../utils/statistics';
import { getTodayDateString, formatReadableDate } from '../../utils/dates';

interface ContributionHeatmapProps {
  completions: HabitCompletion[];
  userTimezone?: string;
}

export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({
  completions,
  userTimezone = 'UTC',
}) => {
  const todayStr = useMemo(() => getTodayDateString(userTimezone), [userTimezone]);
  const heatmapData = useMemo(() => generateHeatmapData(completions, todayStr), [completions, todayStr]);

  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  // Total completions in this heatmap
  const totalHeatmapCompletions = useMemo(() => {
    return heatmapData.reduce((sum, d) => sum + d.count, 0);
  }, [heatmapData]);

  // Compute month label positions across the 52 columns
  const monthLabels = useMemo(() => {
    const labels: { index: number; name: string }[] = [];
    let lastMonth = '';

    for (let col = 0; col < 52; col++) {
      const dayIndex = col * 7;
      if (dayIndex < heatmapData.length) {
        const dateStr = heatmapData[dayIndex].date;
        const [_, m] = dateStr.split('-');
        const monthNum = parseInt(m, 10) - 1;
        const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthNum];

        if (monthShort !== lastMonth && col - (labels[labels.length - 1]?.index ?? -10) >= 3) {
          labels.push({ index: col, name: monthShort });
          lastMonth = monthShort;
        }
      }
    }
    return labels;
  }, [heatmapData]);

  const getColorClass = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 1:
        return 'bg-[#0e3b18] hover:border-[#4ADE65]';
      case 2:
        return 'bg-[#15803d] hover:border-[#4ADE65]';
      case 3:
        return 'bg-[#22c55e] hover:border-[#4ADE65]';
      case 4:
        return 'bg-[#4ADE65] shadow-[0_0_4px_#4ADE65] hover:border-white';
      case 0:
      default:
        return 'bg-[#121212] hover:border-zinc-600';
    }
  };

  return (
    <div className="border border-[#1f2421] bg-[#0a0a0a] rounded p-3.5 sm:p-5 font-mono">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">//</span>
          <span className="text-xs sm:text-sm font-semibold text-zinc-200">
            git log --contributions (52 weeks)
          </span>
        </div>
        <span className="text-xs text-[#4ADE65] font-medium">
          {totalHeatmapCompletions} completions in past 12 months
        </span>
      </div>

      {/* Heatmap Container with horizontal scrolling on mobile without whole page scrolling */}
      <div className="relative overflow-x-auto pb-2 -mx-1 px-1 touch-pan-x">
        <div className="min-w-[680px]">
          {/* Month labels row */}
          <div className="flex text-[10px] text-zinc-500 mb-1.5 pl-6 relative h-4">
            {monthLabels.map((m) => (
              <span
                key={m.name + m.index}
                className="absolute"
                style={{ left: `${m.index * 13 + 24}px` }}
              >
                {m.name}
              </span>
            ))}
          </div>

          {/* Grid with Weekday Labels on Left */}
          <div className="flex gap-1.5 items-start">
            {/* Weekday indicators */}
            <div className="flex flex-col justify-between text-[9px] text-zinc-600 h-[88px] pt-[2px] pr-1 select-none">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>

            {/* 52 Columns x 7 Rows Grid */}
            <div className="inline-grid grid-rows-7 grid-flow-col gap-[2.5px]">
              {heatmapData.map((cell) => {
                const colorClass = getColorClass(cell.level);
                return (
                  <div
                    key={cell.date}
                    onMouseEnter={() => setHoveredDay({ date: cell.date, count: cell.count })}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => setHoveredDay({ date: cell.date, count: cell.count })}
                    className={`w-[11px] h-[11px] rounded-[2px] border border-transparent transition-all cursor-pointer ${colorClass}`}
                    role="gridcell"
                    aria-label={`${cell.count} completions on ${cell.date}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip & Legend footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#181d19] text-xs text-zinc-400">
        {/* Active Tooltip Details */}
        <div className="text-[11px]">
          {hoveredDay ? (
            <span>
              <span className="text-[#4ADE65] font-semibold">{hoveredDay.count} completions</span> on{' '}
              <span className="text-zinc-200">{formatReadableDate(hoveredDay.date)}</span>
            </span>
          ) : (
            <span className="text-zinc-500">Hover or tap any square to inspect commits</span>
          )}
        </div>

        {/* Intensity Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 select-none">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-[1px] bg-[#121212]" />
          <span className="w-2.5 h-2.5 rounded-[1px] bg-[#0e3b18]" />
          <span className="w-2.5 h-2.5 rounded-[1px] bg-[#15803d]" />
          <span className="w-2.5 h-2.5 rounded-[1px] bg-[#22c55e]" />
          <span className="w-2.5 h-2.5 rounded-[1px] bg-[#4ADE65]" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
