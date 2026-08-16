import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import type { DdayGoalRequest, DdayGoalResponse } from '@/types';

import { workspaceDdayApi } from './workspace-dday-api';
import { workspaceQueryKeys } from './workspace-query-keys';

const canFetch = Platform.OS !== 'web' || typeof window !== 'undefined';

export function useWorkspaceDdayGoals(workspaceId: number) {
  return useQuery({
    queryKey: workspaceQueryKeys.ddayGoals(workspaceId),
    queryFn: ({ signal }) => workspaceDdayApi.list(workspaceId, signal),
    enabled: canFetch && workspaceId > 0,
  });
}

export function useWorkspaceDdayGoalDetail(workspaceId: number, goalId: number | null) {
  return useQuery({
    queryKey:
      goalId === null
        ? workspaceQueryKeys.ddayGoals(workspaceId)
        : workspaceQueryKeys.ddayGoalDetail(workspaceId, goalId),
    queryFn: ({ signal }) => workspaceDdayApi.get(workspaceId, goalId ?? 0, signal),
    enabled: canFetch && workspaceId > 0 && goalId !== null,
  });
}

export function useWorkspaceDdayGoalTasks(workspaceId: number, goalId: number) {
  return useQuery({
    queryKey: workspaceQueryKeys.ddayGoalTasks(workspaceId, goalId),
    queryFn: ({ signal }) => workspaceDdayApi.listTasks(workspaceId, goalId, signal),
    enabled: canFetch && workspaceId > 0 && goalId > 0,
  });
}

export function useCreateWorkspaceDdayGoal(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: DdayGoalRequest) => workspaceDdayApi.create(workspaceId, request),
    onSuccess: (goal) => {
      queryClient.setQueryData<DdayGoalResponse[]>(
        workspaceQueryKeys.ddayGoals(workspaceId),
        (current = []) => [goal, ...current.filter((item) => item.id !== goal.id)],
      );
      queryClient.setQueryData(workspaceQueryKeys.ddayGoalDetail(workspaceId, goal.id), goal);
    },
  });
}

export function useDeleteWorkspaceDdayGoal(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: number) => workspaceDdayApi.delete(workspaceId, goalId),
    onSuccess: (_result, goalId) => {
      queryClient.setQueryData<DdayGoalResponse[]>(
        workspaceQueryKeys.ddayGoals(workspaceId),
        (current = []) => current.filter((goal) => goal.id !== goalId),
      );
      queryClient.removeQueries({
        queryKey: workspaceQueryKeys.ddayGoalDetail(workspaceId, goalId),
      });
    },
  });
}
