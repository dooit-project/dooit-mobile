import { apiClient } from '@/services/api';
import type { DdayGoalRequest, DdayGoalResponse, TaskResponse } from '@/types';

const goalsPath = (workspaceId: number) => `/api/v1/workspaces/${workspaceId}/dday-goals`;

export const workspaceDdayApi = {
  list(workspaceId: number, signal?: AbortSignal) {
    return apiClient.get<DdayGoalResponse[]>(goalsPath(workspaceId), { signal });
  },
  get(workspaceId: number, goalId: number, signal?: AbortSignal) {
    return apiClient.get<DdayGoalResponse>(`${goalsPath(workspaceId)}/${goalId}`, { signal });
  },
  create(workspaceId: number, request: DdayGoalRequest, signal?: AbortSignal) {
    return apiClient.post<DdayGoalResponse>(goalsPath(workspaceId), request, { signal });
  },
  listTasks(workspaceId: number, goalId: number, signal?: AbortSignal) {
    return apiClient.get<TaskResponse[]>(`${goalsPath(workspaceId)}/${goalId}/tasks`, { signal });
  },
  delete(workspaceId: number, goalId: number, signal?: AbortSignal) {
    return apiClient.delete<null>(`${goalsPath(workspaceId)}/${goalId}`, { signal });
  },
};
