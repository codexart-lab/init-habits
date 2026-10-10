import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useHabits } from '../../context/HabitsContext';
import { useAuth } from '../../context/AuthContext';
import { getWeekDays, getTodayDateString, formatReadableDate } from '../../utils/dates';

export const WeekCalendar: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    goToToday,
    goToNextWeek,
    goToPrevWeek,
    monthDisplay,
    habits,
    completions,
  } = useHabits();
  const { settings } = useAuth();

  const userTimezone = settings?.timezone || 'UTC';
  const todayStr = getTodayDateString(userTimezone);
  const weekDays = getWeekDays(selectedDate);
  const activeHabitsCount = habits.filter(h => h.is_active).length;

  return (
    <div className="border border-[#1f2421] bg-[#0a0a0a] rounded p-3 sm:p-4 mb-4">
      {/* Calendar Header with Navigation and Month */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500">//</span>
          <span className="text-xs sm:text-sm font-mono font-semibold tracking-wider text-zinc-200">
            {monthDisplay}
          </span>
          {selectedDate !== todayStr && (
            <button
              onClick={goToToday}
              className="text-[11px] font-mono text-[#4ADE65] hover:underline flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded border border-[#166534] bg-[#061408]"
              title="Return to today's date"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>cd today</span>
            </button>
          )}
        </div>

        {/* Previous / Next Week buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevWeek}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#141414] border border-[#1f2421] transition-colors"
            title="Previous Week"
            aria-label="Previous Week"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={goToNextWeek}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-[#141414] border border-[#1f2421] transition-colors"
            title="Next Week"
            aria-label="Next Week"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 7-Day Responsive Strip */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day) => {
          const isSelected = day.dateStr === selectedDate;
          const isToday = day.dateStr === todayStr;

          // Calculate completed habits count on this specific date
          const dateCompletionsCount = completions.filter(
            c => c.completed_on === day.dateStr && habits.some(h => h.id === c.habit_id && h.is_active)
          ).length;

          const hasCompletedAny = dateCompletionsCount > 0;
          const isAllCompleted = activeHabitsCount > 0 && dateCompletionsCount >= activeHabitsCount;

          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(day.dateStr)}
              className={`flex flex-col items-center justify-between py-2 px-1 rounded transition-all duration-150 relative min-h-[56px] sm:min-h-[64px] border ${
                isSelected
                  ? 'border-[#4ADE65] bg-[#0f2415] text-[#4ADE65] shadow-[0_0_10px_rgba(74,222,101,0.2)]'
                  : isToday
                  ? 'border-zinc-700 bg-[#141414] text-zinc-100'
                  : 'border-[#181d19] bg-[#080808] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {/* Day Name (Mon, Tue, etc.) */}
              <span className={`text-[10px] sm:text-xs font-mono uppercase ${
                isSelected ? 'text-[#4ADE65] font-semibold' : isToday ? 'text-zinc-200' : 'text-zinc-500'
              }`}>
                {day.dayName}
              </span>

              {/* Day Number (10, 11, etc.) */}
              <span className={`text-xs sm:text-sm font-mono font-medium my-0.5 ${
                isSelected ? 'text-[#4ADE65] font-bold' : isToday ? 'text-zinc-100 font-semibold' : 'text-zinc-300'
              }`}>
                {day.dayNumber}
              </span>

              {/* Completion Indicator Dot / Count */}
              <div className="h-3 flex items-center justify-center">
                {isAllCompleted ? (
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#4ADE65] shadow-[0_0_4px_#4ADE65]" />
                ) : hasCompletedAny ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-zinc-800" />
                )}
              </div>

              {/* Today subtle corner marker */}
              {isToday && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#4ADE65]" title="Today" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Summary Indicator */}
      <div className="mt-2.5 pt-2 border-t border-[#181d19] flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <div>
          <span className="text-zinc-500">Selected: </span>
          <span className="text-zinc-200 font-medium">{formatReadableDate(selectedDate)}</span>
          {selectedDate === todayStr && (
            <span className="text-[#4ADE65] ml-1.5">(Today)</span>
          )}
        </div>
        <div className="text-zinc-500">
          Target date for habit commits
        </div>
      </div>
    </div>
  );
};
