import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requestTaskNotificationSync } from '@/features/notifications';
import type { RecurrenceEditScope, TaskResponse, TaskUpsertRequest } from '@/types';

import { taskApi } from './task-api';
import { taskQueryKeys } from './task-query-keys';

type UpdateTaskVariables = {
  taskId: number;
  request: TaskUpsertRequest;
  recurrenceScope?: RecurrenceEditScope;
};

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, recurrenceScope, request }: UpdateTaskVariables) =>
      taskApi.update(taskId, request, recurrenceScope),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<TaskResponse>(taskQueryKeys.detail(updatedTask.id), updatedTask);
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      requestTaskNotificationSync();
    },
  });
}
