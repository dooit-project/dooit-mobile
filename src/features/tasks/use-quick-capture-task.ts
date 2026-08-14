import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requestTaskNotificationSync } from '@/features/notifications';
import type { TaskQuickCaptureRequest } from '@/types';

import { taskApi } from './task-api';
import { cacheCreatedTask } from './task-cache';
import { taskQueryKeys } from './task-query-keys';

export function useQuickCaptureTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TaskQuickCaptureRequest) => taskApi.quickCapture(request),
    onSuccess: (response) => {
      cacheCreatedTask(queryClient, response.task);
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      requestTaskNotificationSync();
    },
  });
}
