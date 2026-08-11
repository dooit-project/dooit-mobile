import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requestTaskNotificationSync } from '@/features/notifications';
import type { TaskUpsertRequest } from '@/types';

import { taskApi } from './task-api';
import { cacheCreatedTask } from './task-cache';
import { taskQueryKeys } from './task-query-keys';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TaskUpsertRequest) => taskApi.create(request),
    onSuccess: (createdTask) => {
      cacheCreatedTask(queryClient, createdTask);
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      requestTaskNotificationSync();
    },
  });
}

export const useCreateInboxTask = useCreateTask;
