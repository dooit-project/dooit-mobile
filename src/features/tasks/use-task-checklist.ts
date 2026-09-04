import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import type { LocalDateTimeString, TaskChecklistItemRequest } from '@/types';

import { taskApi } from './task-api';
import { taskQueryKeys } from './task-query-keys';

const canFetch = Platform.OS !== 'web' || typeof window !== 'undefined';

export function useTaskChecklist(taskId: number | null) {
  return useQuery({
    queryKey: taskId === null ? taskQueryKeys.all : taskQueryKeys.checklist(taskId),
    queryFn: ({ signal }) => taskApi.getChecklistItems(taskId ?? 0, signal),
    enabled: canFetch && taskId !== null,
  });
}

function useInvalidateTaskChecklist(taskId: number) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: taskQueryKeys.checklist(taskId) });
}

export function useCreateTaskChecklistItem(taskId: number) {
  const invalidate = useInvalidateTaskChecklist(taskId);
  return useMutation({
    mutationFn: (request: TaskChecklistItemRequest) => taskApi.createChecklistItem(taskId, request),
    onSuccess: invalidate,
  });
}

export function useUpdateTaskChecklistItem(taskId: number) {
  const invalidate = useInvalidateTaskChecklist(taskId);
  return useMutation({
    mutationFn: ({ itemId, request }: { itemId: number; request: TaskChecklistItemRequest }) =>
      taskApi.updateChecklistItem(taskId, itemId, request),
    onSuccess: invalidate,
  });
}

export function useCompleteTaskChecklistItem(taskId: number) {
  const invalidate = useInvalidateTaskChecklist(taskId);
  return useMutation({
    mutationFn: ({ itemId, completedAt }: { itemId: number; completedAt?: LocalDateTimeString }) =>
      taskApi.completeChecklistItem(taskId, itemId, completedAt),
    onSuccess: invalidate,
  });
}

export function useReopenTaskChecklistItem(taskId: number) {
  const invalidate = useInvalidateTaskChecklist(taskId);
  return useMutation({
    mutationFn: (itemId: number) => taskApi.reopenChecklistItem(taskId, itemId),
    onSuccess: invalidate,
  });
}

export function useDeleteTaskChecklistItem(taskId: number) {
  const invalidate = useInvalidateTaskChecklist(taskId);
  return useMutation({
    mutationFn: (itemId: number) => taskApi.deleteChecklistItem(taskId, itemId),
    onSuccess: invalidate,
  });
}

export function useReorderTaskChecklistItems(taskId: number) {
  const invalidate = useInvalidateTaskChecklist(taskId);
  return useMutation({
    mutationFn: (orderedItemIds: number[]) =>
      taskApi.reorderChecklistItems(taskId, { orderedItemIds }),
    onSuccess: invalidate,
  });
}
