import type { LocalDateString, TaskResponse } from '@/types';
import { formatDateLabel, formatTimeLabel, shiftLocalDate } from '@/utils';

/** Present both ends of a multi-day schedule without changing its stored timestamps. */
export function getTaskScheduleLabel(task: TaskResponse): string {
  if (!task.startAt) return task.allDay ? '종일' : task.unscheduled ? '시간 미정' : '없음';

  const startDate = task.startAt.slice(0, 10) as LocalDateString;
  const rawEndDate = task.endAt?.slice(0, 10) as LocalDateString | undefined;
  const endDate =
    task.allDay &&
    task.endAt &&
    rawEndDate &&
    task.endAt > task.startAt &&
    /^T00:00(?::00(?:\.0+)?)?$/.test(task.endAt.slice(10))
      ? (shiftLocalDate(rawEndDate, -1) ?? rawEndDate)
      : rawEndDate;
  const crossesYear = Boolean(endDate && startDate.slice(0, 4) !== endDate.slice(0, 4));
  const dateLabel = (date: LocalDateString) =>
    formatDateLabel(
      date,
      crossesYear
        ? { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }
        : undefined,
    );

  if (task.allDay) {
    return endDate && endDate !== startDate
      ? `${dateLabel(startDate)} - ${dateLabel(endDate)} · 종일`
      : '종일';
  }

  const start = `${dateLabel(startDate)} ${formatTimeLabel(task.startAt)}`;
  if (!task.endAt || !endDate) return start;
  return `${start} - ${endDate === startDate ? '' : `${dateLabel(endDate)} `}${formatTimeLabel(task.endAt)}`;
}
