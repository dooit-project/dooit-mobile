import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import type {
  LocalDateString,
  RecurrenceEditScope,
  TaskListQuery,
  TaskResponse,
  TaskUpsertRequest,
} from '@/types';

import { workspaceQueryKeys } from './workspace-query-keys';
import { workspaceTaskApi } from './workspace-task-api';

const canFetch = Platform.OS !== 'web' || typeof window !== 'undefined';

export function useWorkspaceTasks(workspaceId: number, query: TaskListQuery) {
  return useQuery({
    queryKey: workspaceQueryKeys.taskList(workspaceId, query),
    queryFn: ({ signal }) => workspaceTaskApi.list(workspaceId, query, signal),
    enabled: canFetch && workspaceId > 0,
  });
}

export function useWorkspaceTaskDetail(workspaceId: number, taskId: number | null) {
  return useQuery({
    queryKey:
      taskId === null
        ? workspaceQueryKeys.tasks(workspaceId)
        : workspaceQueryKeys.taskDetail(workspaceId, taskId),
    queryFn: ({ signal }) => workspaceTaskApi.get(workspaceId, taskId ?? 0, signal),
    enabled: canFetch && workspaceId > 0 && taskId !== null,
  });
}

export function useWorkspaceNotificationCandidates({
  accountId,
  workspaceId,
  from,
  to,
}: {
  accountId: number;
  workspaceId: number;
  from: LocalDateString;
  to: LocalDateString;
}) {
  return useQuery({
    queryKey: workspaceQueryKeys.notificationCandidates(accountId, workspaceId, from, to),
    queryFn: ({ signal }) =>
      workspaceTaskApi.getNotificationCandidates(workspaceId, from, to, signal),
    enabled: canFetch && accountId > 0 && workspaceId > 0,
  });
}

export function useCreateWorkspaceTask(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TaskUpsertRequest) => workspaceTaskApi.create(workspaceId, request),
    onSuccess: (task) => {
      queryClient.setQueryData(workspaceQueryKeys.taskDetail(workspaceId, task.id), task);
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tasks(workspaceId) });
    },
  });
}

type UpdateWorkspaceTaskVariables = {
  taskId: number;
  request: TaskUpsertRequest;
};

export function useUpdateWorkspaceTask(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, request }: UpdateWorkspaceTaskVariables) =>
      workspaceTaskApi.update(workspaceId, taskId, request),
    onSuccess: (task) => {
      queryClient.setQueryData<TaskResponse>(
        workspaceQueryKeys.taskDetail(workspaceId, task.id),
        task,
      );
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tasks(workspaceId) });
    },
  });
}

type DeleteWorkspaceTaskVariables = {
  taskId: number;
  recurrenceScope?: RecurrenceEditScope;
};

export function useDeleteWorkspaceTask(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, recurrenceScope }: DeleteWorkspaceTaskVariables) =>
      workspaceTaskApi.delete(workspaceId, taskId, recurrenceScope),
    onSuccess: (_result, { taskId }) => {
      queryClient.removeQueries({ queryKey: workspaceQueryKeys.taskDetail(workspaceId, taskId) });
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tasks(workspaceId) });
    },
  });
}

export function useConnectWorkspaceTaskDdayGoal(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, goalId }: { taskId: number; goalId: number }) =>
      workspaceTaskApi.connectDdayGoal(workspaceId, taskId, goalId),
    onSuccess: (task, { goalId }) => {
      queryClient.setQueryData<TaskResponse>(
        workspaceQueryKeys.taskDetail(workspaceId, task.id),
        task,
      );
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tasks(workspaceId) });
      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.ddayGoalTasks(workspaceId, goalId),
      });
    },
  });
}

export function useDisconnectWorkspaceTaskDdayGoal(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId }: { taskId: number; goalId: number }) =>
      workspaceTaskApi.disconnectDdayGoal(workspaceId, taskId),
    onSuccess: (task, { goalId }) => {
      queryClient.setQueryData<TaskResponse>(
        workspaceQueryKeys.taskDetail(workspaceId, task.id),
        task,
      );
      void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tasks(workspaceId) });
      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.ddayGoalTasks(workspaceId, goalId),
      });
    },
  });
}
