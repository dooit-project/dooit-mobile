import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requestTaskNotificationSync } from '@/features/notifications';
import type { RecurrenceEditScope, TaskResponse } from '@/types';

import { taskApi } from './task-api';
import { taskQueryKeys } from './task-query-keys';

type DeleteTaskVariables = {
  taskId: number;
  recurrenceScope?: RecurrenceEditScope;
};

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, recurrenceScope }: DeleteTaskVariables) =>
      taskApi.delete(taskId, recurrenceScope),
    onSuccess: (_result, { taskId }) => {
      queryClient.removeQueries({ queryKey: taskQueryKeys.detail(taskId) });
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.stale(), (tasks = []) =>
        tasks.filter((task) => task.id !== taskId),
      );
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      requestTaskNotificationSync();
    },
  });
}
