// Date manipulation utilities for init.Habits

/**
 * Returns today's date formatted as YYYY-MM-DD in the specified timezone
 */
export function getTodayDateString(timeZone: string = 'UTC'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    // Fallback to UTC if timezone is invalid
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Formats a Date object as YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD string safely into a Date (at local noon to avoid UTC midnight timezone shifts)
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0);
}

/**
 * Adds (or subtracts if negative) days from a YYYY-MM-DD date string
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const date = parseDateString(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateString(date);
}

/**
 * Returns an array of 7 consecutive dates (YYYY-MM-DD) centered or bounded by the given date.
 * Standard view: week starting on Monday (or Sunday). Here we anchor Monday to Sunday.
 */
export function getWeekDays(referenceDateStr: string): { dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] {
  const refDate = parseDateString(referenceDateStr);
  const dayOfWeek = refDate.getDay(); // 0 is Sunday, 1 is Monday...
  // Calculate distance to previous Monday (0 -> -6, 1 -> 0, 2 -> -1...)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() + diffToMonday);

  const todayStr = getTodayDateString();
  const weekDays = [];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const dateStr = formatDateString(current);
    weekDays.push({
      dateStr,
      dayName: dayNames[i],
      dayNumber: current.getDate(),
      isToday: dateStr === todayStr,
    });
  }

  return weekDays;
}

/**
 * Formats a date string into readable terminal month / year string, e.g. "OCTOBER 2026"
 */
export function formatMonthYear(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
}

/**
 * Formats full readable date, e.g. "Sat, Oct 10, 2026"
 */
export function formatReadableDate(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Calculates day difference (a - b) in days between two YYYY-MM-DD strings
 */
export function diffInDays(dateStrA: string, dateStrB: string): number {
  const dateA = parseDateString(dateStrA);
  const dateB = parseDateString(dateStrB);
  const diffTime = dateA.getTime() - dateB.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}
