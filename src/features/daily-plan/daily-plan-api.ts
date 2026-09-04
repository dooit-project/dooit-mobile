import { apiClient } from '@/services/api';
import type {
  DailyPlanRequest,
  DailyPlanResponse,
  DailyPlanSummaryResponse,
  LocalDateString,
} from '@/types';

const DAILY_PLANS_PATH = '/api/v1/daily-plans';

export const dailyPlanApi = {
  get(date: LocalDateString, signal?: AbortSignal) {
    return apiClient.get<DailyPlanResponse>(`${DAILY_PLANS_PATH}/${date}`, { signal });
  },

  replace(date: LocalDateString, request: DailyPlanRequest, signal?: AbortSignal) {
    return apiClient.put<DailyPlanResponse>(`${DAILY_PLANS_PATH}/${date}`, request, { signal });
  },

  getSummary(date: LocalDateString, signal?: AbortSignal) {
    return apiClient.get<DailyPlanSummaryResponse>(`${DAILY_PLANS_PATH}/${date}/summary`, {
      signal,
    });
  },
};
