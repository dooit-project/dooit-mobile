import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requestTaskNotificationSync } from '@/features/notifications';
import { dailyPlanQueryKeys } from '@/features/daily-plan';
import type { LocalDateString, TaskResponse } from '@/types';

import { taskApi } from './task-api';
import { taskQueryKeys } from './task-query-keys';

export function useReopenTask(date: LocalDateString) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => taskApi.reopenToday(taskId, date),
    onSuccess: (reopenedTask) => {
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.done(date), (tasks = []) =>
        tasks.filter((task) => task.id !== reopenedTask.id),
      );
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.today(date), (tasks = []) => [
        ...tasks.filter((task) => task.id !== reopenedTask.id),
        reopenedTask,
      ]);
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.categories() });
      void queryClient.invalidateQueries({ queryKey: dailyPlanQueryKeys.summary(date) });
      requestTaskNotificationSync();
    },
  });
}
