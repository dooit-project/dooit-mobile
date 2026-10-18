import { apiClient } from '@/services/api';
import type { GoalTaskCreateRequest, GoalTaskLinkRequest, TaskResponse } from '@/types';

export const goalTaskApi = {
  create(goalId: number, request: GoalTaskCreateRequest, signal?: AbortSignal) {
    return apiClient.post<TaskResponse>(`/api/v1/goals/${goalId}/tasks`, request, { signal });
  },
  link(taskId: number, request: GoalTaskLinkRequest, signal?: AbortSignal) {
    return apiClient.put<TaskResponse>(`/api/v1/tasks/${taskId}/goal-link`, request, { signal });
  },
  unlink(taskId: number, signal?: AbortSignal) {
    return apiClient.delete<TaskResponse>(`/api/v1/tasks/${taskId}/goal-link`, { signal });
  },
};
