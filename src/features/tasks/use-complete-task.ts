import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requestTaskNotificationSync } from '@/features/notifications';
import { dailyPlanQueryKeys } from '@/features/daily-plan';
import type { LocalDateString, TaskResponse } from '@/types';
import { isLocalDateTimeString } from '@/utils';

import { taskApi } from './task-api';
import { taskQueryKeys } from './task-query-keys';

export function useCompleteTask(date: LocalDateString) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => taskApi.complete(taskId),
    onSuccess: (completedTask) => {
      queryClient.setQueryData<TaskResponse>(taskQueryKeys.detail(completedTask.id), completedTask);
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.today(date), (tasks = []) =>
        tasks.filter((task) => task.id !== completedTask.id),
      );
      queryClient.setQueryData<TaskResponse[]>(taskQueryKeys.stale(), (tasks = []) =>
        tasks.filter((task) => task.id !== completedTask.id),
      );
      const completedDate =
        completedTask.completedAt && isLocalDateTimeString(completedTask.completedAt)
          ? completedTask.completedAt.slice(0, 10)
          : null;
      if (completedDate) {
        queryClient.setQueryData<TaskResponse[]>(
          taskQueryKeys.done(completedDate),
          (tasks = []) => [completedTask, ...tasks.filter((task) => task.id !== completedTask.id)],
        );
        if (completedDate !== date) {
          void queryClient.invalidateQueries({
            queryKey: dailyPlanQueryKeys.summary(completedDate),
          });
        }
      } else {
        void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      }
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.categories() });
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.checklist(completedTask.id) });
      void queryClient.invalidateQueries({ queryKey: dailyPlanQueryKeys.summary(date) });
      requestTaskNotificationSync();
    },
  });
}
