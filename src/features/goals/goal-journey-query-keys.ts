import type { GoalJourneyQuery } from '@/types';

export const goalJourneyQueryKeys = {
  all: ['goal-journeys'] as const,
  goal: (goalId: number) => [...goalJourneyQueryKeys.all, goalId] as const,
  /** Cursor is a page parameter within the same infinite-query cache. */
  range: (goalId: number, query: Omit<GoalJourneyQuery, 'cursor'>) =>
    [...goalJourneyQueryKeys.goal(goalId), query] as const,
};
