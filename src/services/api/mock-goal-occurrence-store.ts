import type {
  GoalPlanOccurrenceResponse,
  GoalPlanResponse,
  GoalPracticeDifficulty,
  GoalPracticeResultResponse,
  GoalResponse,
  GoalScheduleDay,
} from '@/types';
import { parseApiLocalDate, shiftLocalDate, toApiLocalDateTime } from '@/utils';

import { ApiClientError } from './api-error';
import { mockGoalInstant, mockGoalToday, mockGoalWallTime } from './mock-goal-clock';
import type { MockGoalPlanVersion } from './mock-goal-plan-store';

export type MockGoalTaskAction = 'schedule' | 'suspend' | 'rest' | 'reset' | 'complete';
type Dependencies = {
  plans: (ownerId: number) => { plan: GoalPlanResponse; versions: MockGoalPlanVersion[] }[];
  plan: (planId: number, ownerId: number) => GoalPlanResponse;
  goal: (goalId: number, ownerId: number, date: string) => GoalResponse;
  syncTask: (
    occurrence: GoalPlanOccurrenceResponse,
    action: MockGoalTaskAction,
    ownerId: number,
    completedAt?: string,
  ) => number | null;
};
type Query = Record<string, string | number | boolean | null | undefined>;
type Stored = {
  ownerId: number;
  occurrence: GoalPlanOccurrenceResponse;
  notifyAtTime: string | null;
};
const PATH = '/api/v1/goal-plan-occurrences';
const difficulties: GoalPracticeDifficulty[] = [
  'NO_TIME',
  'UNCLEAR_FIRST_ACTION',
  'TOO_HEAVY',
  'FORGOT',
  'OTHER',
];
const weekdays: GoalScheduleDay[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function invalid(message: string): never {
  throw new ApiClientError(message, { kind: 'http', status: 400, code: 10001 });
}
function conflict(): never {
  throw new ApiClientError('회차의 상태가 변경되었어요. 새로고침 후 다시 선택해 주세요.', {
    kind: 'http',
    status: 409,
    code: 70004,
  });
}
function text(value: unknown, max: number): string | null {
  if (value == null) return null;
  if (typeof value !== 'string' || value.length > max) invalid('기록 내용을 확인해 주세요.');
  return value.trim() || null;
}
function copy(occurrence: GoalPlanOccurrenceResponse): GoalPlanOccurrenceResponse {
  return {
    ...occurrence,
    result: occurrence.result
      ? { ...occurrence.result, difficulties: [...occurrence.result.difficulties] }
      : null,
  };
}

export function createMockGoalOccurrenceStore(deps: Dependencies) {
  let nextId = 1;
  const records = new Map<number, Stored>();
  const dates = new Map<string, number>();

  function find(id: number, ownerId: number, version?: unknown) {
    const record = records.get(id);
    if (!record || record.ownerId !== ownerId) {
      throw new ApiClientError('목표 계획 회차를 찾을 수 없습니다.', {
        kind: 'http',
        status: 404,
        code: 70003,
      });
    }
    if (version != null) {
      const number = Number(version);
      if (!Number.isSafeInteger(number) || number < 0) invalid('회차 버전을 확인해 주세요.');
      if (number !== record.occurrence.occurrenceVersion) conflict();
    }
    return record;
  }
  function response(record: Stored) {
    const occurrence = copy(record.occurrence);
    occurrence.scheduledNotificationAt =
      occurrence.status === 'PENDING' &&
      record.notifyAtTime &&
      deps.plan(occurrence.planId, record.ownerId).status === 'ACTIVE'
        ? `${occurrence.serviceDate}T${record.notifyAtTime}`
        : null;
    if (occurrence.result) occurrence.result.occurrenceVersion = occurrence.occurrenceVersion;
    return occurrence;
  }
  function sync(record: Stored, action: MockGoalTaskAction, completedAt?: string) {
    const occurrence = record.occurrence;
    const linkedTaskId = deps.syncTask(copy(occurrence), action, record.ownerId, completedAt);
    if (linkedTaskId !== occurrence.linkedTaskId) {
      occurrence.linkedTaskId = linkedTaskId;
      occurrence.occurrenceVersion += 1;
    }
  }
  function reset(record: Stored, rested: boolean) {
    const occurrence = record.occurrence;
    const inactive = deps.plan(occurrence.planId, record.ownerId).status !== 'ACTIVE';
    sync(
      record,
      rested
        ? 'rest'
        : inactive && occurrence.serviceDate >= mockGoalToday(occurrence.timeZone)
          ? 'suspend'
          : 'reset',
    );
  }
  function snapshot(plan: GoalPlanResponse, ownerId: number, date: string) {
    const goal = plan.goalId === null ? null : deps.goal(plan.goalId, ownerId, date);
    return {
      goalId: plan.goalId,
      goalVersion: goal?.currentVersion ?? null,
      planVersion: plan.currentVersion,
      timeZone: plan.schedule.timeZone,
      snapshotGoalTitle: goal?.title ?? null,
      snapshotPlanName: plan.name,
      snapshotTriggerText: plan.triggerText,
      snapshotStandardActionText: plan.standardAction.text,
      snapshotMinimumActionText: plan.minimumAction.text,
      snapshotNextAction: plan.nextAction,
    };
  }
  function list(ownerId: number, query: Query) {
    const from = String(query.from ?? '');
    const to = String(query.to ?? '');
    const start = parseApiLocalDate(from),
      end = parseApiLocalDate(to);
    if (!start || !end || to < from || (end.getTime() - start.getTime()) / 86400000 >= 31) {
      invalid('조회 기간은 시작일과 종료일을 포함해 1~31일이어야 해요.');
    }
    const goalId = query.goalId == null ? null : Number(query.goalId);
    if (goalId !== null) deps.goal(goalId, ownerId, to);
    const selected: GoalPlanOccurrenceResponse[] = [];
    for (const { plan, versions } of deps.plans(ownerId)) {
      for (let date = from; date <= to; date = shiftLocalDate(date, 1)!) {
        const version = versions.filter((entry) => entry.effectiveFromDate <= date).at(-1)?.plan;
        const id = dates.get(`${plan.id}:${date}`);
        let record = id === undefined ? undefined : records.get(id);
        const scheduled =
          version &&
          date >= version.schedule.startDate &&
          version.schedule.days.includes(weekdays[new Date(`${date}T12:00:00Z`).getUTCDay()]);
        const active = plan.status === 'ACTIVE';
        const mutable =
          record &&
          record.occurrence.status === 'PENDING' &&
          date >= mockGoalToday(record.occurrence.timeZone);
        if (!record && active && scheduled && version) {
          const occurrence: GoalPlanOccurrenceResponse = {
            ...snapshot(version, ownerId, date),
            id: nextId++,
            planId: plan.id,
            serviceDate: date,
            status: 'PENDING',
            linkedTaskId: null,
            notificationKey: `goal-plan:${plan.id}:${date}`,
            scheduledNotificationAt: null,
            occurrenceVersion: 0,
            result: null,
          };
          record = { ownerId, occurrence, notifyAtTime: version.schedule.notifyAtTime };
          records.set(occurrence.id, record);
          dates.set(`${plan.id}:${date}`, occurrence.id);
        } else if (record && mutable && active && scheduled && version) {
          const before = JSON.stringify([record.occurrence, record.notifyAtTime]);
          Object.assign(record.occurrence, snapshot(version, ownerId, date));
          record.notifyAtTime = version.schedule.notifyAtTime;
          if (before !== JSON.stringify([record.occurrence, record.notifyAtTime]))
            record.occurrence.occurrenceVersion += 1;
        }
        if (!record) continue;
        if (
          record.occurrence.status === 'PENDING' &&
          date >= mockGoalToday(record.occurrence.timeZone)
        ) {
          sync(record, active && scheduled ? 'schedule' : 'suspend');
        }
        if (mutable && (!active || !scheduled)) continue;
        if (goalId === null || record.occurrence.goalId === goalId) selected.push(response(record));
      }
    }
    return selected.sort((a, b) => a.serviceDate.localeCompare(b.serviceDate) || a.id - b.id);
  }
  function saveResult(record: Stored, body: unknown) {
    if (record.occurrence.status === 'RESTED') conflict();
    if (!body || typeof body !== 'object' || Array.isArray(body))
      invalid('실천 기록을 확인해 주세요.');
    const request = body as Record<string, unknown>;
    const variant = request.actionVariant;
    if (variant !== 'STANDARD' && variant !== 'MINIMUM' && variant !== 'UNKNOWN')
      invalid('실천 종류를 확인해 주세요.');
    if (typeof request.practicedAt !== 'string') invalid('실천 시각을 확인해 주세요.');
    const zone = text(request.practicedTimeZone, 50) ?? record.occurrence.timeZone;
    try {
      new Intl.DateTimeFormat('en', { timeZone: zone });
    } catch {
      invalid('시간대를 확인해 주세요.');
    }
    const completedAt = toApiLocalDateTime(mockGoalInstant(request.practicedAt, zone));
    const patch = request.nextActionPatchKind ?? 'KEEP';
    const nextAction = text(request.nextAction, 300);
    if (
      !['KEEP', 'CLEAR', 'REPLACE'].includes(String(patch)) ||
      (patch === 'REPLACE' ? !nextAction : nextAction !== null)
    )
      invalid('다음 행동의 변경 방식을 확인해 주세요.');
    const selectedDifficulties = request.difficulties ?? [];
    if (
      !Array.isArray(selectedDifficulties) ||
      selectedDifficulties.length > 5 ||
      selectedDifficulties.some((value) => !difficulties.includes(value))
    )
      invalid('시작이 어려웠던 이유를 확인해 주세요.');
    const accomplishedNote = text(request.accomplishedNote, 1000);
    const now = toApiLocalDateTime(new Date());
    const previous = record.occurrence.result;
    const result: GoalPracticeResultResponse = {
      occurrenceId: record.occurrence.id,
      actionVariant: variant,
      practicedAt: request.practicedAt,
      practicedTimeZone: zone,
      accomplishedNote,
      difficulties: [...new Set(selectedDifficulties)] as GoalPracticeDifficulty[],
      nextActionPatchKind: patch as GoalPracticeResultResponse['nextActionPatchKind'],
      nextAction,
      createdAt: previous?.createdAt ?? now,
      updatedAt: previous ? now : null,
      occurrenceVersion: record.occurrence.occurrenceVersion + 1,
    };
    record.occurrence.result = result;
    record.occurrence.status = 'PRACTICED';
    record.occurrence.occurrenceVersion += 1;
    sync(record, 'complete', completedAt);
    return response(record).result!;
  }
  return {
    handles(method: string, path: string) {
      return path === PATH
        ? method === 'GET'
        : /^\/api\/v1\/goal-plan-occurrences\/\d+\/(result|rest)$/.test(path) &&
            (method === 'PUT' || method === 'DELETE');
    },
    transferOwnership(sourceUserId: number, targetUserId: number) {
      records.forEach((record) => {
        if (record.ownerId === sourceUserId) record.ownerId = targetUserId;
      });
    },
    suspendPlan(planId: number, ownerId: number) {
      records.forEach((record) => {
        const o = record.occurrence;
        if (
          record.ownerId === ownerId &&
          o.planId === planId &&
          o.status === 'PENDING' &&
          o.serviceDate >= mockGoalToday(o.timeZone)
        )
          sync(record, 'suspend');
      });
    },
    forTask(taskId: number, ownerId: number) {
      const record = [...records.values()].find(
        (entry) => entry.ownerId === ownerId && entry.occurrence.linkedTaskId === taskId,
      );
      return record ? response(record) : null;
    },
    canAccessTask(taskId: number, ownerId: number) {
      const record = [...records.values()].find(
        (entry) => entry.occurrence.linkedTaskId === taskId,
      );
      return !record || record.ownerId === ownerId;
    },
    taskCompleted(taskId: number, ownerId: number, completedAt: string) {
      const occurrence = this.forTask(taskId, ownerId);
      if (!occurrence) return;
      const record = find(occurrence.id, ownerId);
      if (record.occurrence.status === 'RESTED') conflict();
      if (record.occurrence.result) {
        const result = record.occurrence.result;
        record.occurrence.status = 'PRACTICED';
        record.occurrence.occurrenceVersion += 1;
        sync(
          record,
          'complete',
          toApiLocalDateTime(mockGoalInstant(result.practicedAt, result.practicedTimeZone)),
        );
      } else {
        const practicedAt = mockGoalWallTime(
          mockGoalInstant(completedAt, 'Asia/Seoul'),
          occurrence.timeZone,
        );
        saveResult(record, {
          actionVariant: 'UNKNOWN',
          practicedAt,
          practicedTimeZone: occurrence.timeZone,
        });
      }
    },
    taskReopened(taskId: number, ownerId: number) {
      const occurrence = this.forTask(taskId, ownerId);
      if (!occurrence) return;
      const record = find(occurrence.id, ownerId);
      if (record.occurrence.status === 'RESTED') conflict();
      if (record.occurrence.status === 'PRACTICED') {
        record.occurrence.result = null;
        record.occurrence.status = 'PENDING';
        record.occurrence.occurrenceVersion += 1;
        if (deps.plan(occurrence.planId, ownerId).status !== 'ACTIVE') reset(record, false);
      }
    },
    request(
      method: 'GET' | 'PUT' | 'DELETE',
      path: string,
      body: unknown,
      ownerId: number,
      query: Query = {},
    ) {
      if (path === PATH && method === 'GET') return list(ownerId, query);
      const version =
        path.endsWith('/result') && method === 'PUT'
          ? (body as Record<string, unknown> | null)?.occurrenceVersion
          : query.occurrenceVersion;
      const record = find(Number(path.split('/')[4]), ownerId, version);
      const occurrence = record.occurrence;
      if (path.endsWith('/result')) {
        if (method === 'PUT') return saveResult(record, body);
        if (occurrence.status === 'PRACTICED') {
          occurrence.result = null;
          occurrence.status = 'PENDING';
          occurrence.occurrenceVersion += 1;
          reset(record, false);
        }
        return null;
      }
      if (method === 'PUT') {
        if (occurrence.status === 'PRACTICED') conflict();
        if (occurrence.status !== 'RESTED') {
          occurrence.status = 'RESTED';
          occurrence.occurrenceVersion += 1;
          reset(record, true);
        }
        return response(record);
      }
      if (occurrence.status === 'RESTED') {
        occurrence.status = 'PENDING';
        occurrence.occurrenceVersion += 1;
        reset(record, false);
      }
      return null;
    },
  };
}
