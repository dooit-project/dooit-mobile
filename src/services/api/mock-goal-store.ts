import type { GoalResponse, GoalStatus } from '@/types';
import { goalLimits } from '@/types';
import { parseApiLocalDate, toApiLocalDate, toApiLocalDateTime } from '@/utils';

import { ApiClientError } from './api-error';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type Context = { ownerId: number; visibleDdayIds: readonly number[] };
const GOALS_PATH = '/api/v1/goals';
const statuses: GoalStatus[] = ['ACTIVE', 'PAUSED', 'ACHIEVED', 'ARCHIVED'];

function invalid(message: string): never {
  throw new ApiClientError(message, { kind: 'http', status: 400, code: 10001 });
}

function readBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return invalid('목표 내용을 확인해 주세요.');
  }
  return body as Record<string, unknown>;
}

function optionalText(value: unknown, limit: number): string | null {
  if (value == null) return null;
  if (typeof value !== 'string' || value.length > limit) {
    return invalid(`문장은 ${limit}자 이내로 입력해 주세요.`);
  }
  return value.trim() || null;
}

function optionalDate(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string' || !parseApiLocalDate(value)) {
    return invalid('날짜를 확인해 주세요.');
  }
  return value;
}

function content(body: Record<string, unknown>, context: Context) {
  const title = optionalText(body.title, goalLimits.title);
  if (!title) return invalid('목표 제목을 입력해 주세요.');
  const linkedDdayGoalId = body.linkedDdayGoalId ?? null;
  if (
    linkedDdayGoalId !== null &&
    (typeof linkedDdayGoalId !== 'number' || !context.visibleDdayIds.includes(linkedDdayGoalId))
  ) {
    return invalid('본인 소유의 D-Day만 연결할 수 있어요.');
  }
  return {
    title,
    desiredOutcome: optionalText(body.desiredOutcome, goalLimits.desiredOutcome),
    motivationText: optionalText(body.motivationText, goalLimits.motivationText),
    targetDate: optionalDate(body.targetDate),
    linkedDdayGoalId,
  };
}

function validatePolicy(body: Record<string, unknown>) {
  if (
    body.futurePlanPolicy != null &&
    body.futurePlanPolicy !== 'PAUSE_FUTURE' &&
    body.futurePlanPolicy !== 'KEEP_FUTURE'
  ) {
    invalid('앞으로의 계획 처리 방식을 확인해 주세요.');
  }
}

/** In-memory Goal CRUD only. Plans/version history and journey are separate follow-up work. */
export function createMockGoalStore(
  options: { pauseFuturePlans?: (goalId: number, ownerId: number) => void } = {},
) {
  let nextId = 1;
  const records = new Map<number, { ownerId: number; goal: GoalResponse }>();
  const versions = new Map<number, { effectiveFromDate: string; goal: GoalResponse }[]>();

  function find(goalId: number, ownerId: number) {
    const record = records.get(goalId);
    if (!record || record.ownerId !== ownerId) {
      throw new ApiClientError('목표를 찾을 수 없습니다.', {
        kind: 'http',
        status: 404,
        code: 70001,
      });
    }
    return record.goal;
  }

  return {
    snapshotAt(goalId: number, ownerId: number, date: string) {
      find(goalId, ownerId);
      const history = versions.get(goalId)!;
      const selected =
        history.filter((entry) => entry.effectiveFromDate <= date).at(-1) ?? history[0];
      return { ...selected.goal };
    },
    transferOwnership(sourceUserId: number, targetUserId: number) {
      records.forEach((record) => {
        if (record.ownerId === sourceUserId) record.ownerId = targetUserId;
      });
    },
    handles(method: string, path: string) {
      if (path === GOALS_PATH) return method === 'GET' || method === 'POST';
      if (/^\/api\/v1\/goals\/\d+$/.test(path)) return method === 'GET' || method === 'PATCH';
      if (/^\/api\/v1\/goals\/\d+\/status$/.test(path)) return method === 'PATCH';
      return (
        /^\/api\/v1\/goals\/\d+\/achievement$/.test(path) &&
        (method === 'POST' || method === 'DELETE')
      );
    },
    request(method: Method, path: string, body: unknown, context: Context) {
      if (path === GOALS_PATH && method === 'GET') {
        return [...records.values()]
          .filter((record) => record.ownerId === context.ownerId)
          .map(({ goal }) => ({ ...goal }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
      }

      const now = toApiLocalDateTime(new Date());
      if (path === GOALS_PATH && method === 'POST') {
        const fields = content(readBody(body), context);
        const goal: GoalResponse = {
          ...fields,
          id: nextId++,
          status: 'ACTIVE',
          currentVersion: 1,
          achievedAt: null,
          archivedAt: null,
          createdAt: now,
          updatedAt: null,
        };
        records.set(goal.id, { ownerId: context.ownerId, goal });
        versions.set(goal.id, [{ effectiveFromDate: toApiLocalDate(), goal: { ...goal } }]);
        return { ...goal };
      }

      const goal = find(Number(path.split('/')[4]), context.ownerId);
      if (method === 'GET') return { ...goal };
      if (/\/\d+$/.test(path)) {
        if (goal.status === 'ARCHIVED') invalid('보관된 목표는 수정할 수 없습니다.');
        const request = readBody(body);
        const fields = content(request, context);
        optionalDate(request.effectiveFromDate);
        Object.assign(goal, fields);
        goal.currentVersion += 1;
        versions.get(goal.id)!.push({
          effectiveFromDate:
            (request.effectiveFromDate as string | null | undefined) ?? toApiLocalDate(),
          goal: { ...goal },
        });
      } else if (method === 'DELETE') {
        if (goal.status === 'ACHIEVED') {
          goal.status = 'ACTIVE';
          goal.achievedAt = null;
        }
      } else {
        const request = path.endsWith('/achievement') && body == null ? {} : readBody(body);
        validatePolicy(request);
        const status = path.endsWith('/achievement') ? 'ACHIEVED' : request.status;
        if (!statuses.includes(status as GoalStatus)) invalid('목표 상태를 확인해 주세요.');
        // Archived is terminal, matching Goal domain methods. Status does not increment version.
        if (status === 'ARCHIVED') {
          goal.status = 'ARCHIVED';
          goal.archivedAt ??= now;
        } else if (goal.status !== 'ARCHIVED') {
          goal.status = status as GoalStatus;
          if (status === 'ACTIVE') goal.achievedAt = null;
          if (status === 'ACHIEVED') goal.achievedAt ??= now;
        }
        if (goal.status !== 'ACTIVE' && request.futurePlanPolicy !== 'KEEP_FUTURE') {
          options.pauseFuturePlans?.(goal.id, context.ownerId);
        }
      }
      goal.updatedAt = now;
      return { ...goal };
    },
  };
}
