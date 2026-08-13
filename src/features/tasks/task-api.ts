import { apiClient } from '@/services/api';
import type {
  DeferReason,
  LocalDateString,
  RecurrenceEditScope,
  TaskNotificationCandidateResponse,
  TaskQuickCaptureRequest,
  TaskQuickCaptureResponse,
  TaskRecommendationResponse,
  TaskResponse,
  TaskListQuery,
  TaskSearchPage,
  TaskSearchQuery,
  TodayOrderDirection,
  TaskUpsertRequest,
} from '@/types';

const TASKS_PATH = '/api/v1/tasks';

function serializeSearchQuery(query: TaskSearchQuery) {
  return {
    ...query,
    statuses: query.statuses?.join(','),
    taskTypes: query.taskTypes?.join(','),
  };
}

export const taskApi = {
  list(query: TaskListQuery, signal?: AbortSignal) {
    const serializedQuery = {
      ...query,
      date: query.type === 'MONTH' ? query.date.slice(0, 7) : query.date,
    };

    return apiClient.get<TaskResponse[]>(TASKS_PATH, { query: serializedQuery, signal });
  },

  search(query: TaskSearchQuery, signal?: AbortSignal) {
    return apiClient.get<TaskSearchPage>(`${TASKS_PATH}/search`, {
      query: serializeSearchQuery(query),
      signal,
    });
  },

  get(taskId: number, signal?: AbortSignal) {
    return apiClient.get<TaskResponse>(`${TASKS_PATH}/${taskId}`, { signal });
  },

  create(request: TaskUpsertRequest, signal?: AbortSignal) {
    return apiClient.post<TaskResponse>(TASKS_PATH, request, { signal });
  },

  quickCapture(request: TaskQuickCaptureRequest, signal?: AbortSignal) {
    return apiClient.post<TaskQuickCaptureResponse>(`${TASKS_PATH}/quick-capture`, request, {
      signal,
    });
  },

  update(
    taskId: number,
    request: TaskUpsertRequest,
    recurrenceScope?: RecurrenceEditScope,
    signal?: AbortSignal,
  ) {
    return apiClient.put<TaskResponse>(`${TASKS_PATH}/${taskId}`, request, {
      query: { recurrenceScope },
      signal,
    });
  },

  delete(taskId: number, recurrenceScope?: RecurrenceEditScope, signal?: AbortSignal) {
    return apiClient.delete<null>(`${TASKS_PATH}/${taskId}`, {
      query: { recurrenceScope },
      signal,
    });
  },

  getToday(date: LocalDateString, signal?: AbortSignal) {
    return apiClient.get<TaskResponse[]>(`${TASKS_PATH}/today`, {
      query: { date },
      signal,
    });
  },

  getTodayRecommendations(date: LocalDateString, signal?: AbortSignal) {
    return apiClient.get<TaskRecommendationResponse[]>(`${TASKS_PATH}/today/recommendations`, {
      query: { date },
      signal,
    });
  },

  getNotificationCandidates(from: LocalDateString, to: LocalDateString, signal?: AbortSignal) {
    return apiClient.get<TaskNotificationCandidateResponse[]>(
      `${TASKS_PATH}/notification-candidates`,
      {
        query: { from, to },
        signal,
      },
    );
  },

  getDone(date: LocalDateString, signal?: AbortSignal) {
    return apiClient.get<TaskResponse[]>(`${TASKS_PATH}/done`, {
      query: { date },
      signal,
    });
  },

  getStale(signal?: AbortSignal) {
    return apiClient.get<TaskResponse[]>(`${TASKS_PATH}/stale`, { signal });
  },

  getInbox(signal?: AbortSignal) {
    return apiClient.get<TaskResponse[]>(`${TASKS_PATH}/inbox`, { signal });
  },

  complete(taskId: number, signal?: AbortSignal) {
    return apiClient.patch<TaskResponse>(`${TASKS_PATH}/${taskId}/done`, undefined, {
      signal,
    });
  },

  moveToToday(taskId: number, date: LocalDateString, signal?: AbortSignal) {
    return apiClient.patch<TaskResponse>(`${TASKS_PATH}/${taskId}/today`, undefined, {
      query: { date },
      signal,
    });
  },

  moveToInbox(taskId: number, signal?: AbortSignal) {
    return apiClient.patch<TaskResponse>(`${TASKS_PATH}/${taskId}/inbox`, undefined, {
      signal,
    });
  },

  reorderToday(
    taskId: number,
    date: LocalDateString,
    direction: TodayOrderDirection,
    signal?: AbortSignal,
  ) {
    return apiClient.patch<TaskResponse>(`${TASKS_PATH}/${taskId}/today-order`, undefined, {
      query: { date, direction },
      signal,
    });
  },

  setDeferReason(taskId: number, reason: DeferReason, signal?: AbortSignal) {
    return apiClient.patch<TaskResponse>(`${TASKS_PATH}/${taskId}/defer-reason`, undefined, {
      query: { reason },
      signal,
    });
  },

  clearDeferReason(taskId: number, signal?: AbortSignal) {
    return apiClient.delete<TaskResponse>(`${TASKS_PATH}/${taskId}/defer-reason`, { signal });
  },

  connectDdayGoal(taskId: number, ddayGoalId: number, signal?: AbortSignal) {
    return apiClient.patch<TaskResponse>(`${TASKS_PATH}/${taskId}/dday-goal`, undefined, {
      query: { ddayGoalId },
      signal,
    });
  },

  disconnectDdayGoal(taskId: number, signal?: AbortSignal) {
    return apiClient.delete<TaskResponse>(`${TASKS_PATH}/${taskId}/dday-goal`, { signal });
  },

  reopenToday(taskId: number, date: LocalDateString, signal?: AbortSignal) {
    return apiClient.patch<TaskResponse>(`${TASKS_PATH}/${taskId}/done/cancel`, undefined, {
      query: { date },
      signal,
    });
  },
};
