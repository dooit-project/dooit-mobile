import { apiClient, ApiClientError } from '@/services/api';
import type {
  GoalDirectLogRequest,
  GoalDirectLogResponse,
  GoalJourneyQuery,
  GoalJourneyResponse,
} from '@/types';
import { goalDirectLogLimits } from '@/types';

export const goalDirectLogApi = {
  /** Keep the same key AND original payload for retries, including manual retries. */
  create(
    goalId: number,
    request: GoalDirectLogRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ) {
    if (
      !idempotencyKey.trim() ||
      idempotencyKey.trim().length > goalDirectLogLimits.idempotencyKey
    ) {
      throw new ApiClientError('직접 기록의 요청 키를 확인해 주세요.', { kind: 'configuration' });
    }
    return apiClient.post<GoalDirectLogResponse>(`/api/v1/goals/${goalId}/direct-logs`, request, {
      idempotencyKey,
      signal,
    });
  },
  update(logId: number, request: GoalDirectLogRequest, signal?: AbortSignal) {
    return apiClient.patch<GoalDirectLogResponse>(`/api/v1/goal-direct-logs/${logId}`, request, {
      signal,
    });
  },
  cancel(logId: number, signal?: AbortSignal) {
    return apiClient.delete<null>(`/api/v1/goal-direct-logs/${logId}`, { signal });
  },
};

export const goalJourneyApi = {
  get(goalId: number, query: GoalJourneyQuery, signal?: AbortSignal) {
    return apiClient.get<GoalJourneyResponse>(`/api/v1/goals/${goalId}/journey`, { query, signal });
  },
};

export function isGoalJourneyConflict(error: unknown) {
  return error instanceof ApiClientError && error.status === 409 && error.code === 70008;
}
