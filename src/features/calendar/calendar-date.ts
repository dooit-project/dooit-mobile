import type { LocalDateString } from '@/types';
import { isLocalDateString, shiftLocalDate } from '@/utils';

export function getWeekDates(value: LocalDateString): LocalDateString[] {
  if (!isLocalDateString(value)) {
    return [];
  }

  const [year, month, day] = value.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  const monday = shiftLocalDate(value, -daysSinceMonday);

  if (!monday) {
    return [];
  }

  return Array.from({ length: 7 }, (_, index) => shiftLocalDate(monday, index)).filter(
    (date): date is LocalDateString => date !== null,
  );
}

export function getMonthCalendarDates(value: LocalDateString): LocalDateString[] {
  if (!isLocalDateString(value)) {
    return [];
  }

  const firstDay = `${value.slice(0, 7)}-01` as LocalDateString;
  const [year, month] = value.split('-').map(Number);
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
  const lastDay = `${value.slice(0, 7)}-${String(lastDayOfMonth).padStart(
    2,
    '0',
  )}` as LocalDateString;
  const firstWeek = getWeekDates(firstDay);
  const lastWeek = getWeekDates(lastDay);
  const gridStart = firstWeek[0];
  const gridEnd = lastWeek.at(-1);

  if (!gridStart || !gridEnd) {
    return [];
  }

  const dayCount = Math.floor(
    (Date.parse(`${gridEnd}T12:00:00.000Z`) - Date.parse(`${gridStart}T12:00:00.000Z`)) /
      86_400_000,
  );

  return Array.from({ length: dayCount + 1 }, (_, index) =>
    shiftLocalDate(gridStart, index),
  ).filter((date): date is LocalDateString => date !== null);
}

export function getThreeWeekCalendarDates(value: LocalDateString): LocalDateString[] {
  if (!isLocalDateString(value)) {
    return [];
  }

  const currentWeek = getWeekDates(value);
  const currentWeekStart = currentWeek[0];

  if (!currentWeekStart) {
    return [];
  }

  const gridStart = shiftLocalDate(currentWeekStart, -7);

  if (!gridStart) {
    return [];
  }

  return Array.from({ length: 21 }, (_, index) => shiftLocalDate(gridStart, index)).filter(
    (date): date is LocalDateString => date !== null,
  );
}

/** The three-week grid may include dates in two different months or years. */
export function getCalendarMonthStarts(dates: LocalDateString[]): LocalDateString[] {
  return [
    ...new Set(dates.filter(isLocalDateString).map((date) => `${date.slice(0, 7)}-01`)),
  ].sort();
}

export function shiftMonth(value: LocalDateString, amount: number): LocalDateString | null {
  if (!isLocalDateString(value) || !Number.isInteger(amount)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const targetMonthStart = new Date(Date.UTC(year, month - 1 + amount, 1, 12));
  const targetYear = targetMonthStart.getUTCFullYear();
  const targetMonth = targetMonthStart.getUTCMonth();
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 12)).getUTCDate();
  const targetDay = Math.min(day, lastDay);
  const result =
    `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-` +
    String(targetDay).padStart(2, '0');

  return isLocalDateString(result) ? result : null;
}
