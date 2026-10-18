import type {
  GoalPlanActionResponse,
  GoalPlanResponse,
  GoalPlanScheduleResponse,
  GoalPlanStatus,
  GoalScheduleDay,
} from '@/types';
import { goalPlanLimits } from '@/types';
import { parseApiLocalDate, toApiLocalDateTime } from '@/utils';

import { ApiClientError } from './api-error';

type Query = {
  goalId?: string | number | boolean | null;
  independentOnly?: string | number | boolean | null;
};
type Context = { ownerId: number; query?: Query };
type Method = 'GET' | 'POST' | 'PATCH';
const PLANS_PATH = '/api/v1/goal-plans';
const days: GoalScheduleDay[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const statuses: GoalPlanStatus[] = ['ACTIVE', 'PAUSED', 'ARCHIVED'];

function invalid(message: string): never {
  throw new ApiClientError(message, { kind: 'http', status: 400, code: 10001 });
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    invalid('계획 내용을 확인해 주세요.');
  return value as Record<string, unknown>;
}
function text(value: unknown, limit: number, required = false): string | null {
  if (value == null && !required) return null;
  if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) {
    invalid(`문장은 ${limit}자 이내로 입력해 주세요.`);
  }
  return value.trim() || null;
}
function date(value: unknown): string {
  if (typeof value !== 'string' || !parseApiLocalDate(value)) invalid('날짜를 확인해 주세요.');
  return value;
}
function action(value: unknown): GoalPlanActionResponse {
  const request = object(value);
  const estimatedMinutes = request.estimatedMinutes ?? null;
  if (
    estimatedMinutes !== null &&
    (typeof estimatedMinutes !== 'number' ||
      !Number.isInteger(estimatedMinutes) ||
      estimatedMinutes < 1 ||
      estimatedMinutes > goalPlanLimits.estimatedMinutes)
  ) {
    invalid('예상 시간은 1~1440분으로 입력해 주세요.');
  }
  return {
    text: text(request.text, goalPlanLimits.actionText, true)!,
    targetAmount: text(request.targetAmount, goalPlanLimits.targetAmount),
    estimatedMinutes,
  };
}
function schedule(value: unknown): GoalPlanScheduleResponse {
  const request = object(value);
  const selected = request.days;
  if (
    !Array.isArray(selected) ||
    selected.length < 1 ||
    selected.length > 7 ||
    selected.some((day) => !days.includes(day))
  )
    invalid('반복할 요일을 선택해 주세요.');
  const timeZone = text(request.timeZone, 50) ?? 'Asia/Seoul';
  try {
    new Intl.DateTimeFormat('en', { timeZone });
  } catch {
    invalid('시간대를 확인해 주세요.');
  }
  let notifyAtTime: string | null = null;
  if (request.notifyAtTime != null) {
    if (
      typeof request.notifyAtTime !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,9})?)?$/.test(request.notifyAtTime)
    ) {
      invalid('알림 시각을 확인해 주세요.');
    }
    notifyAtTime =
      request.notifyAtTime.length === 5 ? `${request.notifyAtTime}:00` : request.notifyAtTime;
  }
  return {
    startDate: date(request.startDate),
    days: [...new Set(selected)] as GoalScheduleDay[],
    timeZone,
    notifyAtTime,
  };
}
function copy(plan: GoalPlanResponse): GoalPlanResponse {
  return {
    ...plan,
    schedule: { ...plan.schedule, days: [...plan.schedule.days] },
    standardAction: { ...plan.standardAction },
    minimumAction: { ...plan.minimumAction },
  };
}

/** Plan CRUD only: occurrence materialization and linked Task synchronization are not simulated. */
export function createMockGoalPlanStore(requireGoal: (goalId: number, ownerId: number) => unknown) {
  let nextId = 1;
  const records = new Map<number, { ownerId: number; plan: GoalPlanResponse }>();

  function content(body: unknown, ownerId: number, pathGoalId?: number) {
    const request = object(body);
    const goalId = pathGoalId ?? request.goalId ?? null;
    if (goalId !== null) {
      if (typeof goalId !== 'number' || !Number.isSafeInteger(goalId) || goalId < 1)
        invalid('목표를 확인해 주세요.');
      requireGoal(goalId, ownerId);
    }
    return {
      goalId,
      name: text(request.name, goalPlanLimits.name, true)!,
      triggerText: text(request.triggerText, goalPlanLimits.triggerText),
      schedule: schedule(request.schedule),
      standardAction: action(request.standardAction),
      minimumAction: action(request.minimumAction),
      nextAction: text(request.nextAction, goalPlanLimits.nextAction),
    };
  }
  function find(planId: number, ownerId: number) {
    const record = records.get(planId);
    if (!record || record.ownerId !== ownerId) {
      throw new ApiClientError('목표 계획을 찾을 수 없습니다.', {
        kind: 'http',
        status: 404,
        code: 70002,
      });
    }
    return record.plan;
  }
  return {
    transferOwnership(sourceUserId: number, targetUserId: number) {
      records.forEach((record) => {
        if (record.ownerId === sourceUserId) record.ownerId = targetUserId;
      });
    },
    pauseForGoal(goalId: number, ownerId: number) {
      records.forEach(({ plan, ownerId: recordOwner }) => {
        if (recordOwner === ownerId && plan.goalId === goalId && plan.status !== 'ARCHIVED') {
          plan.status = 'PAUSED';
          plan.updatedAt = toApiLocalDateTime(new Date());
        }
      });
    },
    handles(method: string, path: string) {
      if (path === PLANS_PATH || /^\/api\/v1\/goals\/\d+\/plans$/.test(path)) {
        return method === 'GET' || method === 'POST';
      }
      if (/^\/api\/v1\/goal-plans\/\d+$/.test(path)) return method === 'GET' || method === 'PATCH';
      return /^\/api\/v1\/goal-plans\/\d+\/status$/.test(path) && method === 'PATCH';
    },
    request(method: Method, path: string, body: unknown, { ownerId, query }: Context) {
      const goalMatch = /^\/api\/v1\/goals\/(\d+)\/plans$/.exec(path);
      const pathGoalId = goalMatch ? Number(goalMatch[1]) : undefined;
      const collection = path === PLANS_PATH || pathGoalId !== undefined;
      if (collection && method === 'GET') {
        const independentOnly =
          query?.independentOnly === true || query?.independentOnly === 'true';
        const goalId = pathGoalId ?? (query?.goalId == null ? null : Number(query.goalId));
        if (pathGoalId !== undefined || (!independentOnly && goalId !== null))
          requireGoal(goalId!, ownerId);
        return [...records.values()]
          .filter((record) => record.ownerId === ownerId)
          .map(({ plan }) => plan)
          .filter((plan) =>
            pathGoalId !== undefined
              ? plan.goalId === pathGoalId
              : independentOnly
                ? plan.goalId === null
                : goalId === null || plan.goalId === goalId,
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
          .map(copy);
      }
      const now = toApiLocalDateTime(new Date());
      if (collection && method === 'POST') {
        const fields = content(body, ownerId, pathGoalId);
        const plan: GoalPlanResponse = {
          ...fields,
          id: nextId++,
          status: 'ACTIVE',
          currentVersion: 1,
          archivedAt: null,
          createdAt: now,
          updatedAt: null,
        };
        records.set(plan.id, { ownerId, plan });
        return copy(plan);
      }
      const plan = find(Number(path.split('/')[4]), ownerId);
      if (method === 'GET') return copy(plan);
      const request = object(body);
      if (path.endsWith('/status')) {
        if (!statuses.includes(request.status as GoalPlanStatus))
          invalid('계획 상태를 확인해 주세요.');
        if (request.status === 'ARCHIVED') {
          plan.status = 'ARCHIVED';
          plan.archivedAt ??= now;
        } else if (plan.status !== 'ARCHIVED') plan.status = request.status as GoalPlanStatus;
      } else {
        if (plan.status === 'ARCHIVED') invalid('보관된 목표 계획은 수정할 수 없습니다.');
        const fields = content(request, ownerId);
        if (request.effectiveFromDate != null) date(request.effectiveFromDate);
        Object.assign(plan, fields);
        plan.currentVersion += 1;
      }
      plan.updatedAt = now;
      return copy(plan);
    },
  };
}
