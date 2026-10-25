import type { TaskResponse } from '@/types';
import type { PlanGoalKey } from './plan-goal-preferences';

function validId(id: unknown): id is number {
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0;
}

/** New Goals and legacy D-Day goals have independent ID namespaces. */
export function getTaskPlanGoalKey(
  task?: Pick<TaskResponse, 'linkedGoalId' | 'ddayGoalId'>,
): PlanGoalKey | null {
  if (!task) return null;
  if (task.linkedGoalId != null) {
    return validId(task.linkedGoalId) ? `goal:${task.linkedGoalId}` : null;
  }
  return validId(task.ddayGoalId) ? `dday:${task.ddayGoalId}` : null;
}

export function parsePlanGoalKey(param: string | string[] | undefined): PlanGoalKey | null {
  if (typeof param !== 'string' || !/^(goal|dday):[1-9]\d*$/.test(param)) return null;
  return validId(Number(param.split(':')[1])) ? (param as PlanGoalKey) : null;
}

export function resolvePlanGoalNavigation(
  key: PlanGoalKey,
  sources: {
    goal: { ids: number[]; status: 'pending' | 'error' | 'success' };
    dday: { ids: number[]; status: 'pending' | 'error' | 'success' };
  },
): 'found' | 'waiting' | 'missing' {
  const [kind, id] = key.split(':');
  const source = sources[kind as 'goal' | 'dday'];
  if (source.ids.includes(Number(id))) return 'found';
  return source.status === 'success' ? 'missing' : 'waiting';
}
