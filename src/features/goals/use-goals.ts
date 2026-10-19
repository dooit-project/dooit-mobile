import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { getAccessToken } from '@/services/api';
import { dailyPlanQueryKeys } from '@/features/daily-plan/daily-plan-query-keys';

import type {
  GoalCreateRequest,
  GoalResponse,
  GoalStatusRequest,
  GoalUpdateRequest,
} from '@/types';

import { goalApi } from './goal-api';
import { goalQueryKeys } from './goal-query-keys';
import { goalPlanQueryKeys, goalOccurrenceQueryKeys } from './goal-plan-query-keys';
import { goalJourneyQueryKeys } from './goal-journey-query-keys';
import { taskQueryKeys } from '@/features/tasks/task-query-keys';

export function useGoals() {
  return useQuery({
    queryKey: goalQueryKeys.list(),
    queryFn: ({ signal }) => goalApi.list(signal),
    enabled: Platform.OS !== 'web' || typeof window !== 'undefined',
  });
}

export function useSaveGoal() {
  const client = useQueryClient();
  return useMutation({
    onMutate: () => {
      const ownerId = client.getQueryData<{ id: number }>(['auth', 'me'])?.id;
      void client.cancelQueries({ queryKey: goalQueryKeys.list() });
      return { ownerId };
    },
    mutationFn: (
      input:
        | { goalId: number; request: GoalUpdateRequest }
        | { request: GoalCreateRequest; goalId?: never },
    ) =>
      input.goalId === undefined
        ? goalApi.create(input.request)
        : goalApi.update(input.goalId, input.request),
    onSuccess: (goal, _input, context) => {
      if (
        !context?.ownerId ||
        client.getQueryData<{ id: number }>(['auth', 'me'])?.id !== context.ownerId ||
        !getAccessToken()
      )
        return;
      client.setQueryData<GoalResponse[]>(goalQueryKeys.list(), (items = []) => [
        goal,
        ...items.filter((item) => item.id !== goal.id),
      ]);
      client.setQueryData(goalQueryKeys.detail(goal.id), goal);
      void client.invalidateQueries({ queryKey: goalOccurrenceQueryKeys.all });
      void client.invalidateQueries({ queryKey: goalJourneyQueryKeys.goal(goal.id) });
    },
  });
}

export function useGoalStatus() {
  const client = useQueryClient();
  return useMutation({
    onMutate: () => {
      const ownerId = client.getQueryData<{ id: number }>(['auth', 'me'])?.id;
      void client.cancelQueries({ queryKey: goalQueryKeys.list() });
      return { ownerId };
    },
    mutationFn: ({ goalId, request }: { goalId: number; request: GoalStatusRequest }) =>
      goalApi.changeStatus(goalId, request),
    onSuccess: (goal, _input, context) => {
      if (
        !context?.ownerId ||
        client.getQueryData<{ id: number }>(['auth', 'me'])?.id !== context.ownerId ||
        !getAccessToken()
      )
        return;
      client.setQueryData<GoalResponse[]>(goalQueryKeys.list(), (items = []) =>
        items.map((item) => (item.id === goal.id ? goal : item)),
      );
      client.setQueryData(goalQueryKeys.detail(goal.id), goal);
      // Status changes may suspend future linked Tasks; refresh all source caches, not just the title.
      for (const queryKey of [
        goalPlanQueryKeys.all,
        goalOccurrenceQueryKeys.all,
        goalJourneyQueryKeys.goal(goal.id),
        taskQueryKeys.all,
        dailyPlanQueryKeys.all,
      ]) {
        void client.invalidateQueries({ queryKey });
      }
    },
  });
}
