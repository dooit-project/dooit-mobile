import type { GoalDirectLogResponse, GoalResponse } from '@/types';
import { goalDirectLogLimits } from '@/types';
import { parseApiLocalDate, toApiLocalDateTime } from '@/utils';

import { ApiClientError } from './api-error';

type Normalized = Pick<
  GoalDirectLogResponse,
  'practicedDate' | 'practicedTimeZone' | 'title' | 'note'
>;
type Stored = { ownerId: number; key: string; createPayload: string; log: GoalDirectLogResponse };

function invalid(message: string): never {
  throw new ApiClientError(message, { kind: 'http', status: 400, code: 10001 });
}
function text(value: unknown, max: number): string | null {
  if (value == null) return null;
  if (typeof value !== 'string' || value.length > max) invalid('기록 내용을 확인해 주세요.');
  return value.trim() || null;
}
function normalize(body: unknown): Normalized {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    invalid('기록 내용을 확인해 주세요.');
  const request = body as Record<string, unknown>;
  const title = text(request.title, goalDirectLogLimits.title);
  if (
    !title ||
    typeof request.practicedDate !== 'string' ||
    !parseApiLocalDate(request.practicedDate)
  ) {
    invalid('실천 날짜와 제목을 입력해 주세요.');
  }
  const zone = text(request.practicedTimeZone, 50) ?? 'Asia/Seoul';
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone });
  } catch {
    invalid('시간대를 확인해 주세요.');
  }
  return {
    forJourney(ownerId: number, goalId: number) {
      return [...records.values()]
        .filter((record) => record.ownerId === ownerId && record.log.goalId === goalId)
        .map((record) => ({ ...record.log }));
    },
    title,
    practicedDate: request.practicedDate,
    practicedTimeZone: zone,
    note: text(request.note, goalDirectLogLimits.note),
  };
}

/** Creation payload stays immutable across edits/cancellation and owner merges. */
export function createMockGoalDirectLogStore(
  goalAtDate: (goalId: number, ownerId: number, date: string) => GoalResponse,
) {
  let nextId = 1;
  const records = new Map<number, Stored>();

  function find(id: number, ownerId: number) {
    const record = records.get(id);
    if (!record || record.ownerId !== ownerId) {
      throw new ApiClientError('목표 직접 기록을 찾을 수 없습니다.', {
        kind: 'http',
        status: 404,
        code: 70006,
      });
    }
    return record;
  }
  return {
    transferOwnership(sourceUserId: number, targetUserId: number) {
      records.forEach((record) => {
        if (record.ownerId === sourceUserId) record.ownerId = targetUserId;
      });
    },
    handles(method: string, path: string) {
      return /^\/api\/v1\/goals\/\d+\/direct-logs$/.test(path)
        ? method === 'POST'
        : /^\/api\/v1\/goal-direct-logs\/\d+$/.test(path) &&
            (method === 'PATCH' || method === 'DELETE');
    },
    request(
      method: 'POST' | 'PATCH' | 'DELETE',
      path: string,
      body: unknown,
      ownerId: number,
      idempotencyKey?: string,
    ) {
      const id = Number(path.split('/')[4]);
      if (method === 'POST') {
        const key = idempotencyKey?.trim();
        if (!key || key.length > goalDirectLogLimits.idempotencyKey)
          invalid('직접 기록에는 1~160자의 요청 키가 필요해요.');
        const normalized = normalize(body);
        const goal = goalAtDate(id, ownerId, normalized.practicedDate);
        const createPayload = JSON.stringify(normalized);
        const existing = [...records.values()].find(
          (record) => record.ownerId === ownerId && record.log.goalId === id && record.key === key,
        );
        if (existing) {
          if (existing.createPayload !== createPayload) {
            throw new ApiClientError('같은 요청 키에 다른 내용을 보낼 수 없어요.', {
              kind: 'http',
              status: 409,
              code: 10004,
            });
          }
          return { ...existing.log };
        }
        const log: GoalDirectLogResponse = {
          ...normalized,
          id: nextId++,
          goalId: id,
          goalVersion: goal.currentVersion,
          createdAt: toApiLocalDateTime(new Date()),
          updatedAt: null,
          canceledAt: null,
        };
        records.set(log.id, { ownerId, key, createPayload, log });
        return { ...log };
      }
      const record = find(id, ownerId);
      if (method === 'DELETE') {
        if (!record.log.canceledAt) {
          record.log.canceledAt = toApiLocalDateTime(new Date());
          record.log.updatedAt = record.log.canceledAt;
        }
        return null;
      }
      if (record.log.canceledAt) {
        throw new ApiClientError('취소한 직접 기록은 수정할 수 없어요.', {
          kind: 'http',
          status: 409,
          code: 70007,
        });
      }
      Object.assign(record.log, normalize(body), { updatedAt: toApiLocalDateTime(new Date()) });
      return { ...record.log };
    },
  };
}
