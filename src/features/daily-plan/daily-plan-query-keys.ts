import type { LocalDateString } from '@/types';

export const dailyPlanQueryKeys = {
  all: ['daily-plans'] as const,
  detail: (date: LocalDateString) => [...dailyPlanQueryKeys.all, 'detail', date] as const,
  summary: (date: LocalDateString) => [...dailyPlanQueryKeys.detail(date), 'summary'] as const,
};
