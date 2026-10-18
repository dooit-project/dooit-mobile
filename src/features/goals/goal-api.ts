import { apiClient } from '@/services/api';
import type {
  GoalCreateRequest,
  GoalFuturePlanPolicyRequest,
  GoalResponse,
  GoalStatusRequest,
  GoalUpdateRequest,
} from '@/types';

const GOALS_PATH = '/api/v1/goals';

export const goalApi = {
  list(signal?: AbortSignal) {
    return apiClient.get<GoalResponse[]>(GOALS_PATH, { signal });
  },
  get(goalId: number, signal?: AbortSignal) {
    return apiClient.get<GoalResponse>(`${GOALS_PATH}/${goalId}`, { signal });
  },
  create(request: GoalCreateRequest, signal?: AbortSignal) {
    return apiClient.post<GoalResponse>(GOALS_PATH, request, { signal });
  },
  update(goalId: number, request: GoalUpdateRequest, signal?: AbortSignal) {
    return apiClient.patch<GoalResponse>(`${GOALS_PATH}/${goalId}`, request, { signal });
  },
  changeStatus(goalId: number, request: GoalStatusRequest, signal?: AbortSignal) {
    return apiClient.patch<GoalResponse>(`${GOALS_PATH}/${goalId}/status`, request, { signal });
  },
  achieve(goalId: number, request?: GoalFuturePlanPolicyRequest, signal?: AbortSignal) {
    return apiClient.post<GoalResponse>(`${GOALS_PATH}/${goalId}/achievement`, request, {
      signal,
    });
  },
  cancelAchievement(goalId: number, signal?: AbortSignal) {
    return apiClient.delete<GoalResponse>(`${GOALS_PATH}/${goalId}/achievement`, { signal });
  },
};
