import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requestTaskNotificationSync } from '@/features/notifications';
import type { LocalDateString, TaskResponse } from '@/types';

import { taskApi } from './task-api';
import { taskQueryKeys } from './task-query-keys';

export function useCompleteTask(date: LocalDateString) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => taskApi.complete(taskId),
    onSuccess: (completedTask) => {
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.today(date), (tasks = []) =>
        tasks.filter((task) => task.id !== completedTask.id),
      );
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.stale(), (tasks = []) =>
        tasks.filter((task) => task.id !== completedTask.id),
      );
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.done(date), (tasks = []) => [
        completedTask,
        ...tasks.filter((task) => task.id !== completedTask.id),
      ]);
      requestTaskNotificationSync();
    },
  });
}
