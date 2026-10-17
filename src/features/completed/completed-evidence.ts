import type { LocalDateString, TaskResponse } from '@/types';

import type { CompletedDay } from './use-completed-week';

export type CompletedEvidenceGroup = {
  goalId: number | null;
  title: string;
  records: { task: TaskResponse; date: LocalDateString }[];
  activeDays: number;
};

/** Dates come from the completed-day endpoint, never a task's planned date. */
export function getCompletedEvidence(days: CompletedDay[]): CompletedEvidenceGroup[] {
  if (days.some((day) => day.isPending || day.error)) return [];

  const seen = new Set<number>();
  const groups = new Map<number | null, CompletedEvidenceGroup>();

  for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const task of day.tasks) {
      if (task.status !== 'DONE' || seen.has(task.id)) continue;
      seen.add(task.id);
      const goalId = task.ddayGoalId ?? null;
      let group = groups.get(goalId);
      if (!group) {
        group = {
          goalId,
          title: goalId === null ? '일상의 기록' : task.ddayGoalTitle?.trim() || '연결된 목표',
          records: [],
          activeDays: 0,
        };
        groups.set(goalId, group);
      }
      group.records.push({ task, date: day.date });
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      activeDays: new Set(group.records.map((record) => record.date)).size,
    }))
    .sort((a, b) => Number(a.goalId === null) - Number(b.goalId === null));
}
