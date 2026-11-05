import type {
  GoalPlanOccurrenceResponse,
  GoalPlanResponse,
  LocalDateString,
  TaskResponse,
} from '@/types';

import { goalPlanDays } from '@/features/goals/goal-plan-form-values';

/** Current plan schedules are safe to show only when they match the occurrence snapshot. */
export function todayGoalMetadata(
  task: TaskResponse,
  occurrence: GoalPlanOccurrenceResponse | undefined,
  plans: GoalPlanResponse[] | undefined,
): string | undefined {
  if (!occurrence || task.status === 'DONE') return undefined;
  const plan = plans?.find(
    (row) => row.id === occurrence.planId && row.currentVersion === occurrence.planVersion,
  );
  const days = plan?.schedule.days;
  const recurrence =
    days?.length === 7
      ? '매일'
      : goalPlanDays
          .filter((day) => days?.includes(day.value))
          .map((day) => day.label)
          .join(' · ');
  const isMinimum =
    !occurrence.snapshotNextAction &&
    occurrence.snapshotMinimumActionText !== occurrence.snapshotStandardActionText &&
    task.title === occurrence.snapshotMinimumActionText;
  return (
    [isMinimum ? '작은 행동' : null, recurrence, occurrence.snapshotTriggerText]
      .filter(Boolean)
      .join(' · ') || undefined
  );
}

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

/** Restore Goal context without replacing the linked Task's actionable title. */
export function annotateTodayGoalTasks(
  date: LocalDateString,
  tasks: TaskResponse[],
  occurrences: GoalPlanOccurrenceResponse[] | undefined,
): TaskResponse[] {
  if (!occurrences) return tasks;
  const byTask = new Map<number, GoalPlanOccurrenceResponse>();
  for (const occurrence of occurrences) {
    if (occurrence.serviceDate !== date || occurrence.linkedTaskId === null) continue;
    const previous = byTask.get(occurrence.linkedTaskId);
    if (!previous || previous.occurrenceVersion < occurrence.occurrenceVersion)
      byTask.set(occurrence.linkedTaskId, occurrence);
  }
  return tasks.map((task) => {
    const occurrence = byTask.get(task.id);
    if (!occurrence) return task;
    return {
      ...task,
      linkedGoalId: occurrence.goalId,
      description: occurrence.snapshotTriggerText,
    };
  });
}
