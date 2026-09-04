import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import type { DailyPlanRequest, DailyPlanResponse, LocalDateString } from '@/types';

import { dailyPlanApi } from './daily-plan-api';
import { dailyPlanQueryKeys } from './daily-plan-query-keys';

const canFetch = Platform.OS !== 'web' || typeof window !== 'undefined';

export function useDailyPlan(date: LocalDateString) {
  return useQuery({
    queryKey: dailyPlanQueryKeys.detail(date),
    queryFn: ({ signal }) => dailyPlanApi.get(date, signal),
    enabled: canFetch,
  });
}

export function useDailyPlanSummary(date: LocalDateString) {
  return useQuery({
    queryKey: dailyPlanQueryKeys.summary(date),
    queryFn: ({ signal }) => dailyPlanApi.getSummary(date, signal),
    enabled: canFetch,
  });
}

export function useReplaceDailyPlan(date: LocalDateString) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: DailyPlanRequest) => dailyPlanApi.replace(date, request),
    onSuccess: (plan: DailyPlanResponse) => {
      queryClient.setQueryData(dailyPlanQueryKeys.detail(date), plan);
      void queryClient.invalidateQueries({ queryKey: dailyPlanQueryKeys.summary(date) });
    },
  });
}
