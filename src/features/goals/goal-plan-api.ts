import { apiClient } from '@/services/api';
import type {
  GoalPlanCreateRequest,
  GoalPlanListQuery,
  GoalPlanResponse,
  GoalPlanStatusRequest,
  GoalPlanUpdateRequest,
} from '@/types';

const PLANS_PATH = '/api/v1/goal-plans';

export const goalPlanApi = {
  list(query: GoalPlanListQuery = {}, signal?: AbortSignal) {
    return apiClient.get<GoalPlanResponse[]>(PLANS_PATH, { query, signal });
  },
  listByGoal(goalId: number, signal?: AbortSignal) {
    return apiClient.get<GoalPlanResponse[]>(`/api/v1/goals/${goalId}/plans`, { signal });
  },
  get(planId: number, signal?: AbortSignal) {
    return apiClient.get<GoalPlanResponse>(`${PLANS_PATH}/${planId}`, { signal });
  },
  create(request: GoalPlanCreateRequest, signal?: AbortSignal) {
    return apiClient.post<GoalPlanResponse>(PLANS_PATH, request, { signal });
  },
  createForGoal(
    goalId: number,
    request: Omit<GoalPlanCreateRequest, 'goalId'>,
    signal?: AbortSignal,
  ) {
    return apiClient.post<GoalPlanResponse>(`/api/v1/goals/${goalId}/plans`, request, { signal });
  },
  update(planId: number, request: GoalPlanUpdateRequest, signal?: AbortSignal) {
    return apiClient.patch<GoalPlanResponse>(`${PLANS_PATH}/${planId}`, request, { signal });
  },
  changeStatus(planId: number, request: GoalPlanStatusRequest, signal?: AbortSignal) {
    return apiClient.patch<GoalPlanResponse>(`${PLANS_PATH}/${planId}/status`, request, { signal });
  },
};
