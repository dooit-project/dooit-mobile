import { apiClient } from '@/services/api';
import type {
  GoalOccurrenceListQuery,
  GoalOccurrenceVersionQuery,
  GoalPlanOccurrenceResponse,
  GoalPracticeResultRequest,
  GoalPracticeResultResponse,
} from '@/types';

const OCCURRENCES_PATH = '/api/v1/goal-plan-occurrences';

export const goalOccurrenceApi = {
  list(query: GoalOccurrenceListQuery, signal?: AbortSignal) {
    return apiClient.get<GoalPlanOccurrenceResponse[]>(OCCURRENCES_PATH, { query, signal });
  },
  saveResult(occurrenceId: number, request: GoalPracticeResultRequest, signal?: AbortSignal) {
    return apiClient.put<GoalPracticeResultResponse>(
      `${OCCURRENCES_PATH}/${occurrenceId}/result`,
      request,
      { signal },
    );
  },
  cancelResult(occurrenceId: number, query: GoalOccurrenceVersionQuery = {}, signal?: AbortSignal) {
    return apiClient.delete<null>(`${OCCURRENCES_PATH}/${occurrenceId}/result`, { query, signal });
  },
  rest(occurrenceId: number, query: GoalOccurrenceVersionQuery = {}, signal?: AbortSignal) {
    return apiClient.put<GoalPlanOccurrenceResponse>(
      `${OCCURRENCES_PATH}/${occurrenceId}/rest`,
      undefined,
      { query, signal },
    );
  },
  cancelRest(occurrenceId: number, query: GoalOccurrenceVersionQuery = {}, signal?: AbortSignal) {
    return apiClient.delete<null>(`${OCCURRENCES_PATH}/${occurrenceId}/rest`, { query, signal });
  },
};
