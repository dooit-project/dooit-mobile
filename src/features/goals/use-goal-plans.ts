import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dailyPlanQueryKeys } from '@/features/daily-plan/daily-plan-query-keys';
import { taskQueryKeys } from '@/features/tasks/task-query-keys';
import { getAccessToken } from '@/services/api';
import type {
  GoalPlanCreateRequest,
  GoalPlanResponse,
  GoalPlanStatus,
  GoalPlanUpdateRequest,
} from '@/types';

import { goalPlanApi } from './goal-plan-api';
import { goalOccurrenceQueryKeys, goalPlanQueryKeys } from './goal-plan-query-keys';
import { goalJourneyQueryKeys } from './goal-journey-query-keys';

type PlanChange =
  | { type: 'create'; request: GoalPlanCreateRequest }
  | { type: 'update'; planId: number; request: GoalPlanUpdateRequest }
  | { type: 'status'; planId: number; status: GoalPlanStatus };

export function useGoalPlans(goalId: number) {
  return useQuery({
    queryKey: goalPlanQueryKeys.list({ goalId }),
    queryFn: ({ signal }) => goalPlanApi.listByGoal(goalId, signal),
  });
}

export function useChangeGoalPlan(goalId: number) {
  const client = useQueryClient();
  return useMutation({
    onMutate: () => {
      const ownerId = client.getQueryData<{ id: number }>(['auth', 'me'])?.id;
      void client.cancelQueries({ queryKey: goalPlanQueryKeys.lists() });
      return { ownerId };
    },
    mutationFn: (change: PlanChange) => {
      if (change.type === 'create') return goalPlanApi.createForGoal(goalId, change.request);
      if (change.type === 'update')
        return goalPlanApi.update(change.planId, { ...change.request, goalId });
      return goalPlanApi.changeStatus(change.planId, { status: change.status });
    },
    onSuccess: (plan, _change, context) => {
      if (
        !context?.ownerId ||
        client.getQueryData<{ id: number }>(['auth', 'me'])?.id !== context.ownerId ||
        !getAccessToken()
      )
        return;
      client.setQueryData<GoalPlanResponse[]>(goalPlanQueryKeys.list({ goalId }), (plans = []) =>
        plans.some((item) => item.id === plan.id)
          ? plans.map((item) => (item.id === plan.id ? plan : item))
          : [plan, ...plans],
      );
      client.setQueryData(goalPlanQueryKeys.detail(plan.id), plan);
      for (const queryKey of [
        goalPlanQueryKeys.lists(),
        goalOccurrenceQueryKeys.all,
        goalJourneyQueryKeys.goal(goalId),
        taskQueryKeys.all,
        dailyPlanQueryKeys.all,
      ]) {
        void client.invalidateQueries({ queryKey });
      }
    },
  });
}
