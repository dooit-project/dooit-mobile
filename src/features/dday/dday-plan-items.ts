import type { LocalDateString, TaskResponse } from '@/types';
import { isLocalDateString } from '@/utils';

export type DdayPlanItem = {
  key: string;
  task: TaskResponse;
  recurring: boolean;
  onlyCompleted: boolean;
};

/** Summarizes received occurrences; does not reconstruct server recurrence definitions. */
export function getDdayPlanItems(tasks: TaskResponse[], today: LocalDateString): DdayPlanItem[] {
  const groups = new Map<string, TaskResponse[]>();

  for (const task of tasks) {
    const seriesId = task.recurrenceSeriesId ?? task.recurrence?.id;
    const rule = task.recurrence?.recurrenceRule ?? task.recurrenceRule ?? '';
    // Keep exceptions separate and never infer shared identity from a title.
    // Split differing rules too, so a rule change is not silently hidden.
    const hasSeriesId =
      typeof seriesId === 'number' && Number.isSafeInteger(seriesId) && seriesId > 0;
    const key =
      hasSeriesId && !task.recurrenceException ? `series:${seriesId}:${rule}` : `task:${task.id}`;
    const group = groups.get(key);
    if (group) group.push(task);
    else groups.set(key, [task]);
  }

  return Array.from(groups, ([key, occurrences]) => {
    const task = [...occurrences].sort((left, right) => compareOccurrences(left, right, today))[0];
    return {
      key,
      task,
      recurring: Boolean(task.recurrenceSeriesId != null || task.recurrence || task.recurrenceRule),
      onlyCompleted: occurrences.every((occurrence) => occurrence.status === 'DONE'),
    };
  });
}

export function getDdayOccurrenceDate(task: TaskResponse): LocalDateString | null {
  const date =
    task.occurrenceDate ?? task.startAt?.slice(0, 10) ?? task.targetDate ?? task.plannedDate;
  return date && isLocalDateString(date) ? date : null;
}

function compareOccurrences(left: TaskResponse, right: TaskResponse, today: LocalDateString) {
  const leftDate = getDdayOccurrenceDate(left);
  const rightDate = getDdayOccurrenceDate(right);
  const leftRank = getOccurrenceRank(left, leftDate, today);
  const rightRank = getOccurrenceRank(right, rightDate, today);
  if (leftRank !== rightRank) return leftRank - rightRank;

  // Upcoming work uses the nearest date; previous work uses the most recent date.
  const dateOrder = (leftDate ?? '').localeCompare(rightDate ?? '');
  return (leftRank === 0 ? dateOrder : -dateOrder) || left.id - right.id;
}

function getOccurrenceRank(
  task: TaskResponse,
  date: LocalDateString | null,
  today: LocalDateString,
) {
  if (task.status === 'DONE') return 3;
  if (date && date >= today) return 0;
  if (!date) return 1;
  return 2;
}
