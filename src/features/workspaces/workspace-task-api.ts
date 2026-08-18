import { apiClient } from '@/services/api';
import type {
  LocalDateString,
  RecurrenceEditScope,
  TaskListQuery,
  TaskNotificationCandidateResponse,
  TaskResponse,
  TaskUpsertRequest,
} from '@/types';

const tasksPath = (workspaceId: number) => `/api/v1/workspaces/${workspaceId}/tasks`;

export const workspaceTaskApi = {
  list(workspaceId: number, query: TaskListQuery, signal?: AbortSignal) {
    return apiClient.get<TaskResponse[]>(tasksPath(workspaceId), {
      query: { ...query, date: query.type === 'MONTH' ? query.date.slice(0, 7) : query.date },
      signal,
    });
  },

  get(workspaceId: number, taskId: number, signal?: AbortSignal) {
    return apiClient.get<TaskResponse>(`${tasksPath(workspaceId)}/${taskId}`, { signal });
  },

  create(workspaceId: number, request: TaskUpsertRequest, signal?: AbortSignal) {
    return apiClient.post<TaskResponse>(tasksPath(workspaceId), request, { signal });
  },

  update(
    workspaceId: number,
    taskId: number,
    request: TaskUpsertRequest,
    recurrenceScope?: RecurrenceEditScope,
    signal?: AbortSignal,
  ) {
    return apiClient.put<TaskResponse>(`${tasksPath(workspaceId)}/${taskId}`, request, {
      query: { recurrenceScope },
      signal,
    });
  },

  delete(
    workspaceId: number,
    taskId: number,
    recurrenceScope?: RecurrenceEditScope,
    signal?: AbortSignal,
  ) {
    return apiClient.delete<null>(`${tasksPath(workspaceId)}/${taskId}`, {
      query: { recurrenceScope },
      signal,
    });
  },

  connectDdayGoal(workspaceId: number, taskId: number, ddayGoalId: number, signal?: AbortSignal) {
    return apiClient.patch<TaskResponse>(
      `${tasksPath(workspaceId)}/${taskId}/dday-goal`,
      undefined,
      {
        query: { ddayGoalId },
        signal,
      },
    );
  },

  disconnectDdayGoal(workspaceId: number, taskId: number, signal?: AbortSignal) {
    return apiClient.delete<TaskResponse>(`${tasksPath(workspaceId)}/${taskId}/dday-goal`, {
      signal,
    });
  },

  getNotificationCandidates(
    workspaceId: number,
    from: LocalDateString,
    to: LocalDateString,
    signal?: AbortSignal,
  ) {
    return apiClient.get<TaskNotificationCandidateResponse[]>(
      `${tasksPath(workspaceId)}/notification-candidates`,
      { query: { from, to }, signal },
    );
  },
};
