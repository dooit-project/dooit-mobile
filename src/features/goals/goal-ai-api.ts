import { apiClient } from '@/services/api';
import type {
  GoalDraftRequest,
  GoalDraftResponse,
  GoalPlanDraftRequest,
  GoalPlanDraftResponse,
  GoalAdjustmentDraftRequest,
  GoalAdjustmentDraftResponse,
  GoalJourneySummaryRequest,
  GoalJourneySummaryResponse,
} from '@/types';

/** Explicit calls only. No automatic requests, retries, persistence or application of suggestions. */
export const goalAiApi = {
  draft(request: GoalDraftRequest, signal?: AbortSignal) {
    return apiClient.post<GoalDraftResponse>('/api/v1/goals/draft', request, { signal });
  },
  planDraft(goalId: number, request: GoalPlanDraftRequest, signal?: AbortSignal) {
    return apiClient.post<GoalPlanDraftResponse>(`/api/v1/goals/${goalId}/plan-draft`, request, {
      signal,
    });
  },
  adjustmentDraft(goalId: number, request: GoalAdjustmentDraftRequest, signal?: AbortSignal) {
    return apiClient.post<GoalAdjustmentDraftResponse>(
      `/api/v1/goals/${goalId}/adjustment-draft`,
      request,
      { signal },
    );
  },
  journeySummary(goalId: number, request: GoalJourneySummaryRequest, signal?: AbortSignal) {
    return apiClient.post<GoalJourneySummaryResponse>(
      `/api/v1/goals/${goalId}/journey-summary`,
      request,
      { signal },
    );
  },
};
