import type { GoalOccurrenceListQuery, GoalPlanListQuery } from '@/types';

export const goalPlanQueryKeys = {
  all: ['goal-plans'] as const,
  lists: () => [...goalPlanQueryKeys.all, 'list'] as const,
  list: (query: GoalPlanListQuery = {}) => [...goalPlanQueryKeys.lists(), query] as const,
  detail: (planId: number) => [...goalPlanQueryKeys.all, 'detail', planId] as const,
};

export const goalOccurrenceQueryKeys = {
  all: ['goal-plan-occurrences'] as const,
  list: (query: GoalOccurrenceListQuery) =>
    [...goalOccurrenceQueryKeys.all, 'list', query] as const,
};
