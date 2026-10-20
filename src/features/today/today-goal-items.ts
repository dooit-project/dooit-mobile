import type { GoalPlanOccurrenceResponse, LocalDateString, TaskResponse } from '@/types';

/** Undefined is an unavailable occurrence query, never proof that no plans are due. */
export function separateTodayGoalItems<T extends Pick<TaskResponse, 'id'>>(
  date: LocalDateString,
  tasks: T[],
  occurrences: GoalPlanOccurrenceResponse[] | undefined,
) {
  if (occurrences === undefined) return { ready: false as const, tasks, occurrences: undefined };
  const unique = new Map<number, GoalPlanOccurrenceResponse>();
  for (const row of occurrences) {
    if (row.serviceDate !== date) continue;
    const previous = unique.get(row.id);
    if (!previous || row.occurrenceVersion > previous.occurrenceVersion) unique.set(row.id, row);
  }
  const rows = [...unique.values()];
  const linkedIds = new Set(
    rows.flatMap((row) => (row.linkedTaskId === null ? [] : [row.linkedTaskId])),
  );
  return {
    ready: true as const,
    tasks: tasks.filter((task) => !linkedIds.has(task.id)),
    // Keep practiced/rested rows available for undo. Do not count them as pending work.
    occurrences: rows,
  };
}
