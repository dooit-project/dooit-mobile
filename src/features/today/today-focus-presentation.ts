import type { LocalDateString, TaskResponse } from '@/types';

const weekdayFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  timeZone: 'UTC',
});

export function getTodayFocusDateLabel(date: LocalDateString) {
  return weekdayFormatter.format(new Date(`${date}T00:00:00Z`));
}

export function getTodayFocusMetadata(task: TaskResponse) {
  return [task.category, task.description].filter(Boolean).join(' · ');
}
